// Zero-dependency local server: serves the static app AND runs the YouTube polling + scoring
// as a single shared session, so every device (laptop, phone, etc.) that opens this same URL
// sees the identical live board without ever needing the API key entered on that device.
const http = require('http');
const fs = require('fs');
const path = require('path');

const YouTube = require('./js/youtube.js');
const { COUNTRIES, findCountryInText } = require('./js/countries.js');
const GameState = require('./server/gameState.js');

const ROOT = __dirname;
const CONFIG_FILE = path.join(__dirname, 'server', 'config.json');

let session = {
  mode: 'idle', // 'idle' | 'live' | 'demo'
  videoId: null,
  targetScore: 5000,
  subKeywords: ['subscribed', 'sub'],
  startPoints: 1000,
  statusText: 'Not started yet.',
};
let demoTimerHandle = null;
let idleCommentTimer = null;
let lastChatActivity = Date.now();
const IDLE_THRESHOLD_MS = 30000;
const FILLER_NAMES = [
  'Fan92-k9s', 'ViewerX-d7w', 'StreamBuddy-w6e', 'NightOwl-t2f',
  'ChatRider-q8m', 'PixelFan-r5j', 'QuickClap-b3n', 'GameLover-h9x',
];

function parseKeywords(raw) {
  if (Array.isArray(raw)) return raw.map(s => String(s).trim().toLowerCase()).filter(Boolean);
  return String(raw || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
}

function handleChatMessage(item) {
  lastChatActivity = Date.now();
  const id = item.id;
  if (GameState.hasProcessedMessage(id)) return;
  GameState.markMessageProcessed(id);

  const text = item.snippet?.displayMessage || '';
  const authorId = item.authorDetails?.channelId || null;
  const authorName = item.authorDetails?.displayName || 'Someone';

  const countryCode = findCountryInText(text);
  if (countryCode) GameState.addCommentPoint(countryCode, authorId, authorName);

  const lower = text.toLowerCase();
  const isSubscribeMsg = session.subKeywords.some(k => k && lower.includes(k));
  if (isSubscribeMsg) {
    const targetCode = countryCode || GameState.getLastCountryForAuthor(authorId);
    if (targetCode) GameState.addSubscribeBonus(targetCode, authorName, authorId);
  }
  checkForWinAndReset();
}

// Once any country reaches the target score, start a fresh round: reset everyone back to
// the starting points and leave a win announcement in the recent events feed.
function checkForWinAndReset() {
  if (session.mode === 'idle') return;
  const leader = GameState.getSortedCountries()[0];
  if (leader && leader.points >= session.targetScore) {
    GameState.resetForNewRound(session.startPoints, leader.name, session.targetScore);
  }
}

function stopAll(nextStatusText) {
  if (demoTimerHandle) { clearInterval(demoTimerHandle); demoTimerHandle = null; }
  stopIdleFiller();
  YouTube.stop();
  session.mode = 'idle';
  session.statusText = nextStatusText || 'Stopped.';
}

// While connected to a real live stream, if no real chat message has arrived for
// IDLE_THRESHOLD_MS, inject demo-like comment/subscribe/like events at the exact same lively
// pace as Demo Mode, so the board never looks dead during quiet stretches. Reuses the small
// FILLER_NAMES pool (not a fresh identity every tick) so comment counts build up toward
// real 10/20/30... milestones over time, same as Demo Mode.
function startIdleFiller() {
  stopIdleFiller();

  idleCommentTimer = setInterval(() => {
    if (session.mode !== 'live') return;
    if (Date.now() - lastChatActivity < IDLE_THRESHOLD_MS) return;
    const country = COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)];
    const name = FILLER_NAMES[Math.floor(Math.random() * FILLER_NAMES.length)];
    const roll = Math.random();
    if (roll < 0.08) {
      GameState.addSubscribeBonus(country.code, name, `filler-${name}`);
    } else if (roll < 0.15) {
      GameState.addLikeBonus(1);
    } else {
      GameState.addCommentPoint(country.code, `filler-${name}`, name);
    }
    checkForWinAndReset();
  }, 900);
}

function stopIdleFiller() {
  if (idleCommentTimer) clearInterval(idleCommentTimer);
  idleCommentTimer = null;
}

function startLiveInternal(cfg) {
  stopAll();
  GameState.load(cfg.videoId, cfg.startPoints);
  YouTube.init(cfg.apiKey);
  lastChatActivity = Date.now();
  session = {
    mode: 'live', videoId: cfg.videoId, targetScore: cfg.targetScore,
    subKeywords: parseKeywords(cfg.subKeywords), startPoints: cfg.startPoints,
    statusText: 'Connecting to live chat…',
  };
  startIdleFiller();
  connectChat(cfg);
}

// Fetches a fresh liveChatId and (re)starts polling. Called again automatically if the
// chat ID goes stale mid-stream (e.g. the broadcast briefly reconnected on YouTube's side),
// if the stream hasn't gone live yet, or after a transient network/fetch failure — instead
// of retrying forever with a dead connection.
function connectChat(cfg) {
  if (session.mode !== 'live') return; // user stopped/reset in the meantime

  YouTube.getVideoInfo(cfg.videoId).then(info => {
    if (session.mode !== 'live') return;
    if (info.likeCount != null) GameState.setLastKnownLikeCount(info.likeCount);

    if (!info.liveChatId) {
      session.statusText = 'No active live chat found for this video. Is it live right now?';
      setTimeout(() => connectChat(cfg), 15000);
      return;
    }
    session.statusText = '🟢 Connected — comment your country in chat!';

    YouTube.pollChat(info.liveChatId, messages => {
      messages.forEach(handleChatMessage);
    }, err => {
      session.statusText = `⚠️ Chat error: ${err.message}`;
      const staleOrUnreachable = /cannot be found|not found|ended|fetch failed/i.test(err.message || '');
      if (staleOrUnreachable) {
        // Stop the stale retry loop and fetch a brand-new chat ID instead of looping forever.
        YouTube.stop();
        YouTube.init(cfg.apiKey);
        session.statusText = 'Reconnecting to live chat…';
        setTimeout(() => connectChat(cfg), 8000);
      }
    });

    YouTube.pollLikes(cfg.videoId, likeCount => {
      const last = GameState.getLastKnownLikeCount();
      if (last != null && likeCount > last) GameState.addLikeBonus(likeCount - last);
      GameState.setLastKnownLikeCount(likeCount);
    }, err => console.warn('Like poll error', err), 60000); // 60s: likes don't need near-real-time polling, saves quota
  }).catch(err => {
    // Network hiccup fetching video info — retry rather than dropping into idle permanently.
    session.statusText = `⚠️ Connection error: ${err.message}. Retrying…`;
    setTimeout(() => connectChat(cfg), 10000);
  });
}

function startDemoInternal(cfg) {
  stopAll();
  GameState.load('demo', cfg.startPoints);
  session = {
    mode: 'demo', videoId: null, targetScore: cfg.targetScore,
    subKeywords: parseKeywords(cfg.subKeywords), startPoints: cfg.startPoints,
    statusText: '🧪 Demo mode — simulating chat activity (no real YouTube data).',
  };
  const sampleNames = [
    'Aria-k9s', 'Leo-d7w', 'Maya-c4p', 'Noah-t2f', 'Zoe-q8m', 'Kai-r5j', 'Ivy-b3n', 'Omar-h9x',
    'FirasGaming-p4c', 'HarshitaPrajapat-m3v', 'Yesenia-x7z',
  ];
  demoTimerHandle = setInterval(() => {
    const country = COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)];
    const name = sampleNames[Math.floor(Math.random() * sampleNames.length)];
    const roll = Math.random();
    if (roll < 0.08) GameState.addSubscribeBonus(country.code, name, `demo-${name}`);
    else if (roll < 0.15) GameState.addLikeBonus(1);
    else GameState.addCommentPoint(country.code, `demo-${name}`, name);
    checkForWinAndReset();
  }, 900);
}

function saveConfigToDisk(cfg) {
  fs.mkdirSync(path.dirname(CONFIG_FILE), { recursive: true });
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(cfg));
}

function loadConfigFromDisk() {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
  } catch (e) {
    return null;
  }
}

// Auto-resume a previously configured live session if the server restarts mid-stream.
const savedConfig = loadConfigFromDisk();
if (savedConfig && savedConfig.apiKey && savedConfig.videoId) {
  startLiveInternal(savedConfig);
}

const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'application/javascript',
  '.png': 'image/png', '.json': 'application/json', '.svg': 'image/svg+xml',
};

// Never serve anything under /server/ — that's where the API key and score data live.
function isBlockedPath(safePath) {
  return safePath === 'server' || safePath.startsWith('server/') || safePath.startsWith('server\\');
}

function serveStatic(res, pathname) {
  const decoded = decodeURIComponent(pathname);
  const normalized = path.normalize(decoded).replace(/^([/\\])+/, '');
  if (normalized.split(/[/\\]/).includes('..') || isBlockedPath(normalized)) {
    res.writeHead(403); res.end('Forbidden'); return;
  }
  const relPath = normalized === '' ? 'index.html' : normalized;
  const filePath = path.join(ROOT, relPath);
  if (!filePath.startsWith(ROOT)) { res.writeHead(403); res.end('Forbidden'); return; }
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath)] || 'application/octet-stream' });
    res.end(data);
  });
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 1e6) { req.destroy(); reject(new Error('Request body too large')); }
    });
    req.on('end', () => {
      try { resolve(body ? JSON.parse(body) : {}); } catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}

function sendJson(res, status, obj) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(obj));
}

const server = http.createServer(async (req, res) => {
  const parsed = new URL(req.url, 'http://localhost');
  const pathname = parsed.pathname;

  if (pathname === '/api/status' && req.method === 'GET') {
    sendJson(res, 200, {
      mode: session.mode, videoId: session.videoId, targetScore: session.targetScore,
      subKeywords: session.subKeywords, startPoints: session.startPoints, statusText: session.statusText,
    });
    return;
  }

  if (pathname === '/api/state' && req.method === 'GET') {
    const active = session.mode !== 'idle';
    sendJson(res, 200, {
      sorted: active ? GameState.getSortedCountries() : [],
      bonusPoints: active ? GameState.getBonusPoints() : 0,
      recentEvents: active ? GameState.getRecentEvents() : [],
      targetScore: session.targetScore,
      statusText: session.statusText,
      mode: session.mode,
    });
    return;
  }

  if (pathname === '/api/config' && req.method === 'POST') {
    try {
      const body = await readJsonBody(req);
      if (!body.apiKey || !body.videoId) {
        sendJson(res, 400, { ok: false, error: 'API key and video URL/ID are required.' });
        return;
      }
      const videoId = YouTube.extractVideoId(body.videoId);
      if (!videoId) {
        sendJson(res, 400, { ok: false, error: 'Could not read a video ID from that URL.' });
        return;
      }
      const cfg = {
        apiKey: String(body.apiKey).trim(), videoId,
        subKeywords: body.subKeywords, startPoints: parseInt(body.startPoints, 10) || 0,
        targetScore: parseInt(body.targetScore, 10) || 5000,
      };
      saveConfigToDisk(cfg);
      startLiveInternal(cfg);
      sendJson(res, 200, { ok: true, videoId, targetScore: cfg.targetScore });
    } catch (err) {
      sendJson(res, 500, { ok: false, error: err.message });
    }
    return;
  }

  if (pathname === '/api/demo' && req.method === 'POST') {
    try {
      const body = await readJsonBody(req);
      startDemoInternal({
        subKeywords: body.subKeywords, startPoints: parseInt(body.startPoints, 10) || 0,
        targetScore: parseInt(body.targetScore, 10) || 5000,
      });
      sendJson(res, 200, { ok: true });
    } catch (err) {
      sendJson(res, 500, { ok: false, error: err.message });
    }
    return;
  }

  if (pathname === '/api/reset' && req.method === 'POST') {
    stopAll('Not started yet.');
    sendJson(res, 200, { ok: true });
    return;
  }

  if (req.method === 'GET') {
    serveStatic(res, pathname);
    return;
  }

  res.writeHead(404); res.end('Not found');
});

const PORT = process.env.PORT || 8090;
server.listen(PORT, () => {
  console.log(`Country Flag Ranking server running at http://localhost:${PORT}`);
  console.log('Open the same URL using this PC\'s LAN IP on your phone to view/control the identical live board.');
});
