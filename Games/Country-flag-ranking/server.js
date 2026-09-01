// Zero-dependency local server: serves the static app AND runs the YouTube polling + scoring
// as a single shared session, so every device (laptop, phone, etc.) that opens this same URL
// sees the identical live board without ever needing the API key entered on that device.
const http = require('http');
const fs = require('fs');
const path = require('path');
const { LiveChat } = require('youtube-chat');

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
let boostTimer = null;
let boostSnapshot = {};
let demoLikeCount = 0;
let lastChatActivity = Date.now();
let chatReconnectTimer = null;
let chatWatchdogTimer = null;
let chatConnected = false;
const IDLE_THRESHOLD_MS = 45000;
const CHAT_SILENCE_RECONNECT_MS = 60000;
const FILLER_NAMES = [
  'Fan92-k9s', 'ViewerX-d7w', 'StreamBuddy-w6e', 'NightOwl-t2f',
  'ChatRider-q8m', 'PixelFan-r5j', 'QuickClap-b3n', 'GameLover-h9x',
];

function parseKeywords(raw) {
  if (Array.isArray(raw)) return raw.map(s => String(s).trim().toLowerCase()).filter(Boolean);
  return String(raw || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
}

// Shared scoring logic for both real YouTube chat messages and manually-typed entries
// (used when the operator reads chat by eye instead of relying on the YouTube API).
function processCommentText(text, authorId, authorName) {
  const countryCode = findCountryInText(text);
  if (countryCode) GameState.addCommentPoint(countryCode, authorId, authorName, text);
  else GameState.addChatMessage(authorName, text);

  const lower = text.toLowerCase();
  const isSubscribeMsg = session.subKeywords.some(k => k && lower.includes(k));
  if (isSubscribeMsg) {
    const targetCode = countryCode || GameState.getLastCountryForAuthor(authorId);
    if (targetCode) GameState.addSubscribeBonus(targetCode, authorName, authorId);
  }
  return countryCode;
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
  if (chatReconnectTimer) { clearTimeout(chatReconnectTimer); chatReconnectTimer = null; }
  if (chatWatchdogTimer) { clearInterval(chatWatchdogTimer); chatWatchdogTimer = null; }
  chatConnected = false;
  stopIdleFiller();
  stopBoostTimer();
  if (activeLiveChat) { activeLiveChat.stop(); activeLiveChat = null; }
  YouTube.stop();
  session.mode = 'idle';
  session.statusText = nextStatusText || 'Stopped.';
}

// Every 30 seconds, celebrate whichever country gained the most points since the last check —
// gives viewers a periodic, exciting payoff worth sticking around for (per streaming feedback).
function startBoostTimer() {
  stopBoostTimer();
  boostSnapshot = {};
  boostTimer = setInterval(() => {
    if (session.mode === 'idle') return;
    const sorted = GameState.getSortedCountries();
    let biggest = null;
    for (const c of sorted) {
      const prev = boostSnapshot[c.code] ?? c.points;
      const gain = c.points - prev;
      if (gain > 0 && (!biggest || gain > biggest.gain)) biggest = { code: c.code, name: c.name, gain };
    }
    if (biggest) GameState.announceBoost(biggest.code, biggest.name, biggest.gain);
    boostSnapshot = Object.fromEntries(sorted.map(c => [c.code, c.points]));
  }, 30000);
}

function stopBoostTimer() {
  if (boostTimer) clearInterval(boostTimer);
  boostTimer = null;
}

// While connected to a real live stream, if no real chat message has arrived for
// IDLE_THRESHOLD_MS (45s), inject demo-like comment/subscribe/like events every 10s so the
// board never looks dead during quiet stretches, without drowning out real viewer comments.
// Reuses the small FILLER_NAMES pool (not a fresh identity every tick) so comment counts build
// up toward real 10/20/30... milestones over time.
function startIdleFiller() {
  stopIdleFiller();

  idleCommentTimer = setInterval(() => {
    if (session.mode !== 'live') return;
    if (!chatConnected) return;
    if (Date.now() - lastChatActivity < IDLE_THRESHOLD_MS) return;
    const country = COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)];
    const name = FILLER_NAMES[Math.floor(Math.random() * FILLER_NAMES.length)];
    const roll = Math.random();
    if (roll < 0.08) {
      GameState.addSubscribeBonus(country.code, name, `filler-${name}`);
    } else if (roll < 0.15) {
      GameState.addLikeBonus(1);
      demoLikeCount += 1;
      GameState.checkLikeGoal(demoLikeCount);
    } else {
      GameState.addCommentPoint(country.code, `filler-${name}`, name);
    }
    checkForWinAndReset();
  }, 10000);
}

function stopIdleFiller() {
  if (idleCommentTimer) clearInterval(idleCommentTimer);
  idleCommentTimer = null;
}

function startLiveInternal(cfg) {
  stopAll();
  GameState.load(cfg.videoId, cfg.startPoints);
  lastChatActivity = Date.now();
  chatConnected = false;
  demoLikeCount = 0;
  session = {
    mode: 'live', videoId: cfg.videoId, targetScore: cfg.targetScore,
    subKeywords: parseKeywords(cfg.subKeywords), startPoints: cfg.startPoints,
    statusText: 'Connecting to live chat…',
  };
  startIdleFiller();
  startBoostTimer();
  connectChat(cfg);
}

// Reads live chat via the unofficial youtube-chat package (no Data API quota used at all for
// chat — it reads YouTube's internal live-chat feed directly, the same way the web player does).
// ⚠️ This is not an officially supported YouTube API; it could break if YouTube changes their
// internal page structure, and carries the ToS caveats the youtube-chat project itself calls out.
// The official Data API key, if provided, is now used ONLY for the optional real-like-count bonus.
let videoInfoFailStreak = 0;
let noChatStreak = 0;
let activeLiveChat = null;

function scheduleChatReconnect(cfg, delayMs, statusText) {
  if (session.mode !== 'live' || chatReconnectTimer) return;
  chatConnected = false;
  session.statusText = statusText || 'Reconnecting to live chat…';
  const previousLiveChat = activeLiveChat;
  activeLiveChat = null;
  if (previousLiveChat) previousLiveChat.stop('Restarting chat connection');
  chatReconnectTimer = setTimeout(() => {
    chatReconnectTimer = null;
    connectChat(cfg);
  }, delayMs);
}

function startChatWatchdog(cfg, liveChat) {
  if (chatWatchdogTimer) clearInterval(chatWatchdogTimer);
  chatWatchdogTimer = setInterval(() => {
    if (session.mode !== 'live' || activeLiveChat !== liveChat) return;
    if (Date.now() - lastChatActivity >= CHAT_SILENCE_RECONNECT_MS) {
      scheduleChatReconnect(cfg, 3000, 'Reconnecting to live chat…');
    }
  }, 15000);
}

function connectChat(cfg) {
  if (session.mode !== 'live') return; // user stopped/reset in the meantime
  const previousLiveChat = activeLiveChat;
  activeLiveChat = null;
  if (previousLiveChat) previousLiveChat.stop();

  const liveChat = new LiveChat({ liveId: cfg.videoId }, 3000);
  activeLiveChat = liveChat;

  liveChat.on('chat', chatItem => {
    if (session.mode !== 'live') return;
    lastChatActivity = Date.now();
    if (GameState.hasProcessedMessage(chatItem.id)) return;
    GameState.markMessageProcessed(chatItem.id);
    const text = (chatItem.message || [])
      .map(part => ('text' in part ? part.text : (part.emojiText || part.alt || '')))
      .join('');
    processCommentText(text, chatItem.author.channelId, chatItem.author.name);
    checkForWinAndReset();
  });

  liveChat.on('error', err => {
    console.error('youtube-chat error:', err && err.message ? err.message : err); // terminal only
    if (activeLiveChat === liveChat) scheduleChatReconnect(cfg, 15000, 'Live chat connection interrupted. Reconnecting…');
  });

  liveChat.on('end', reason => {
    console.warn('youtube-chat ended:', reason || '(no reason given)');
    if (session.mode !== 'live' || activeLiveChat !== liveChat) return;
    noChatStreak += 1;
    const statusText = noChatStreak >= 3
      ? '📴 Live chat ended. If you\'re not going live again here, tap ⚙️ and start a new session with the current link.'
      : 'Reconnecting to live chat…';
    scheduleChatReconnect(cfg, 8000, statusText);
  });

  liveChat.start().then(ok => {
    if (session.mode !== 'live') return;
    if (!ok) {
      videoInfoFailStreak += 1;
      session.statusText = videoInfoFailStreak >= 3
        ? '📴 No active live chat found for this video for a while. Tap ⚙️ and enter the current live link.'
        : 'No active live chat found for this video. Is it live right now?';
      scheduleChatReconnect(cfg, 15000, session.statusText);
      return;
    }
    videoInfoFailStreak = 0;
    noChatStreak = 0;
    lastChatActivity = Date.now();
    chatConnected = true;
    session.statusText = '🟢 Connected — comment your country in chat!';
    startChatWatchdog(cfg, liveChat);
  }).catch(err => {
    console.error('Error starting youtube-chat:', err.message);
    scheduleChatReconnect(cfg, 10000, 'Live chat connection interrupted. Reconnecting…');
  });

  // Optional: only if a real Data API key was given, poll the official API for the real
  // video like count so the like-bonus/like-goal features keep working.
  if (cfg.apiKey) {
    YouTube.init(cfg.apiKey);
    YouTube.pollLikes(cfg.videoId, likeCount => {
      const last = GameState.getLastKnownLikeCount();
      if (last != null && likeCount > last) GameState.addLikeBonus(likeCount - last);
      GameState.setLastKnownLikeCount(likeCount);
      GameState.checkLikeGoal(likeCount);
    }, err => console.warn('Like poll error:', err.message), 60000); // 60s: saves quota
  }
}

function startDemoInternal(cfg) {
  stopAll();
  GameState.load('demo', cfg.startPoints);
  demoLikeCount = 0;
  session = {
    mode: 'demo', videoId: null, targetScore: cfg.targetScore,
    subKeywords: parseKeywords(cfg.subKeywords), startPoints: cfg.startPoints,
    statusText: '🧪 Demo mode — simulating chat activity (no real YouTube data).',
  };
  startBoostTimer();
  const sampleNames = [
    'Aria-k9s', 'Leo-d7w', 'Maya-c4p', 'Noah-t2f', 'Zoe-q8m', 'Kai-r5j', 'Ivy-b3n', 'Omar-h9x',
    'FirasGaming-p4c', 'HarshitaPrajapat-m3v', 'Yesenia-x7z',
  ];
  demoTimerHandle = setInterval(() => {
    const country = COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)];
    const name = sampleNames[Math.floor(Math.random() * sampleNames.length)];
    const roll = Math.random();
    if (roll < 0.08) {
      GameState.addSubscribeBonus(country.code, name, `demo-${name}`);
    } else if (roll < 0.15) {
      GameState.addLikeBonus(1);
      demoLikeCount += 1;
      GameState.checkLikeGoal(demoLikeCount);
    } else {
      GameState.addCommentPoint(country.code, `demo-${name}`, name);
    }
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
if (savedConfig && savedConfig.videoId) {
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

function serveStatic(res, pathname, defaultFile) {
  const decoded = decodeURIComponent(pathname);
  const normalized = path.normalize(decoded).replace(/^([/\\])+/, '');
  if (normalized.split(/[/\\]/).includes('..') || isBlockedPath(normalized)) {
    res.writeHead(403); res.end('Forbidden'); return;
  }
  const relPath = normalized === '' ? (defaultFile || 'index.html') : normalized;
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
      if (!body.videoId) {
        sendJson(res, 400, { ok: false, error: 'A video URL/ID is required.' });
        return;
      }
      const videoId = YouTube.extractVideoId(body.videoId);
      if (!videoId) {
        sendJson(res, 400, { ok: false, error: 'Could not read a video ID from that URL.' });
        return;
      }
      const cfg = {
        apiKey: body.apiKey ? String(body.apiKey).trim() : null, // optional: only needed for the like-count bonus
        videoId,
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

  // Manually award points by typing what a real viewer commented — useful as a free,
  // quota-free fallback if reading chat via the YouTube API is unavailable or over quota.
  // Restricted to the admin-only port so it never appears reachable from the public board.
  if (pathname === '/api/manual' && req.method === 'POST') {
    if (req.socket.localPort !== ADMIN_PORT) {
      res.writeHead(403); res.end('Forbidden');
      return;
    }
    if (session.mode === 'idle') {
      sendJson(res, 400, { ok: false, error: 'Start Live or Demo mode first.' });
      return;
    }
    try {
      const body = await readJsonBody(req);
      const text = String(body.text || '').trim();
      const authorName = String(body.authorName || 'Operator').trim() || 'Operator';
      if (!text) {
        sendJson(res, 400, { ok: false, error: 'Comment text is required.' });
        return;
      }
      const authorId = `manual-${authorName.toLowerCase()}`;
      const countryCode = processCommentText(text, authorId, authorName);
      checkForWinAndReset();
      sendJson(res, 200, { ok: true, countryCode });
    } catch (err) {
      sendJson(res, 500, { ok: false, error: err.message });
    }
    return;
  }

  if (req.method === 'GET') {
    const isAdminPort = req.socket.localPort === ADMIN_PORT;
    if (isAdminPort && (pathname === '/' || pathname === '/index.html')) {
      serveStatic(res, '/admin.html');
      return;
    }
    serveStatic(res, pathname);
    return;
  }

  res.writeHead(404); res.end('Not found');
});

const PORT = process.env.PORT || 8090;
const ADMIN_PORT = process.env.ADMIN_PORT ? Number(process.env.ADMIN_PORT) : 8091;

server.listen(PORT, () => {
  console.log(`Country Flag Ranking server running at http://localhost:${PORT}`);
  console.log('Open the same URL using this PC\'s LAN IP on your phone to view/control the identical live board.');
});

// Second listener on a separate port serves ONLY the admin (manual entry) page — it's the same
// process/handler, so it shares the exact same live game state, but /api/manual only works here.
const adminServer = http.createServer(server.listeners('request')[0]);
adminServer.listen(ADMIN_PORT, () => {
  console.log(`Admin (manual entry) panel running at http://localhost:${ADMIN_PORT} — keep this private, don't share it with viewers.`);
});

