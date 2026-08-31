// Thin client: all YouTube polling + scoring now happens on the local server (server.js),
// so every device that opens this page sees the same shared board without re-entering the API key.
(() => {
  const el = id => document.getElementById(id);
  const setupScreen = el('setup-screen');
  const boardScreen = el('board-screen');
  const statusText = el('status-text');
  const bonusBadge = el('bonus-badge');
  const ticker = el('ticker');
  const grid = el('flag-grid');
  const raceTrack = el('race-track');
  const targetValueEl = el('target-value');
  const leaderBanner = el('leader-banner');
  const subBanner = el('sub-banner');

  let bannerTimer = null;
  let pollTimer = null;
  let targetScore = 3700;
  let lastSeenEventTs = 0;

  const BANNER_MESSAGES = [
    '💬 Comment Your Country = +1',
    '🔔 Subscribe = +100 Points',
    '❤️ Like the Video = +10 Bonus',
  ];

  function startBannerRotation() {
    stopBannerRotation();
    let lastIndex = -1;
    bannerTimer = setInterval(() => {
      let next = Math.floor(Math.random() * BANNER_MESSAGES.length);
      if (next === lastIndex) next = (next + 1) % BANNER_MESSAGES.length;
      lastIndex = next;
      subBanner.textContent = BANNER_MESSAGES[next];
    }, 4000);
  }

  function stopBannerRotation() {
    if (bannerTimer) clearInterval(bannerTimer);
    bannerTimer = null;
  }

  function showSetup(errorMsg) {
    stopPolling();
    stopBannerRotation();
    setupScreen.classList.remove('hidden');
    boardScreen.classList.add('hidden');
    el('setup-error').textContent = errorMsg || '';
  }

  function showBoard() {
    setupScreen.classList.add('hidden');
    boardScreen.classList.remove('hidden');
  }

  function flagUrl(code) {
    return `https://flagcdn.com/w160/${code}.png`;
  }

  function renderRaceTrack(sorted) {
    targetValueEl.textContent = targetScore;
    const top = sorted.slice(0, 8);
    const markers = top.map((c, i) => {
      const percent = Math.max(0, Math.min(1, c.points / targetScore)) * 100;
      const rankClass = i === 0 ? 'race-rank-1' : '';
      return `
        <div class="race-marker ${rankClass}" style="left:${percent}%">
          <img src="${flagUrl(c.code)}" alt="${c.name}" loading="lazy" />
          <span class="race-rank">#${i + 1} ${c.name}</span>
        </div>`;
    }).join('');
    raceTrack.innerHTML = '<div class="race-finish"></div>' + markers;
  }

  function bumpCard(code) {
    const card = grid.querySelector(`.flag-card[data-code="${code}"]`);
    if (card) {
      card.classList.remove('bump');
      void card.offsetWidth; // restart animation
      card.classList.add('bump');
    }
  }

  // Shows a floating "name +points" label on top of the given flag card, then removes it.
  function showPointPopup(code, text, isSubscribe, authorName) {
    const card = grid.querySelector(`.flag-card[data-code="${code}"]`);
    if (!card) return;
    const popup = document.createElement('span');
    popup.className = 'point-popup' + (isSubscribe ? ' subscribe' : '');
    popup.textContent = authorName ? `${authorName} ${text}` : text;
    popup.style.left = `${30 + Math.random() * 40}%`;
    card.appendChild(popup);
    popup.addEventListener('animationend', () => popup.remove());
    setTimeout(() => popup.remove(), 1500);
  }

  function render(data) {
    const sorted = data.sorted || [];
    grid.innerHTML = sorted.map((c, i) => {
      const rankClass = i === 0 ? 'rank-1' : i === 1 ? 'rank-2' : i === 2 ? 'rank-3' : '';
      return `
        <div class="flag-card ${rankClass}" data-code="${c.code}">
          ${i < 3 ? `<span class="rank">#${i + 1}</span>` : ''}
          <img src="${flagUrl(c.code)}" alt="${c.name}" loading="lazy" />
          <div class="country-name">${c.name}</div>
          <div class="points">${c.points}</div>
        </div>`;
    }).join('');
    bonusBadge.textContent = `❤️ Bonus: ${data.bonusPoints || 0}`;
    statusText.textContent = data.statusText || '';

    const events = data.recentEvents || [];
    ticker.innerHTML = events.length
      ? events.slice(0, 5).map(e => `<div class="ticker-item">${e.label}</div>`).join('')
      : '<div class="ticker-item">Waiting for chat activity…</div>';
    renderRaceTrack(sorted);

    const leader = sorted[0];
    if (leader) {
      const remaining = Math.max(0, targetScore - leader.points);
      leaderBanner.textContent = remaining === 0
        ? `🏆 ${leader.name} wins! Reached the target of ${targetScore}!`
        : `🏆 ${leader.name} is leading with ${leader.points} pts — ${remaining} to go!`;
    }

    // Only pop/bump for events that are new since the last poll (avoids replaying old ones).
    const newEvents = events.filter(e => e.ts > lastSeenEventTs);
    newEvents.slice().reverse().forEach(e => {
      if (!e.code) return; // e.g. like-bonus events aren't tied to a country
      bumpCard(e.code);
      showPointPopup(e.code, e.type === 'subscribe' ? '+100 🎉' : '+1', e.type === 'subscribe', e.authorName);
    });
    if (events.length) lastSeenEventTs = Math.max(lastSeenEventTs, events[0].ts);
  }

  async function pollState() {
    try {
      const res = await fetch('/api/state');
      const data = await res.json();
      if (data.targetScore) targetScore = data.targetScore;
      render(data);
    } catch (err) {
      statusText.textContent = '⚠️ Lost connection to the local server.';
    }
  }

  function startPolling() {
    stopPolling();
    pollState();
    pollTimer = setInterval(pollState, 1500);
  }

  function stopPolling() {
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = null;
  }

  el('btn-start').addEventListener('click', async () => {
    const apiKey = el('input-api-key').value.trim();
    const videoId = el('input-video-id').value.trim();
    const startPoints = parseInt(el('input-start-points').value, 10) || 0;
    targetScore = parseInt(el('input-target-score').value, 10) || 3700;
    const subKeywords = el('input-sub-keywords').value;

    if (!apiKey || !videoId) {
      showSetup('Please enter both an API key and a video URL/ID.');
      return;
    }
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey, videoId, subKeywords, startPoints, targetScore }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        showSetup(data.error || 'Could not start the live board.');
        return;
      }
      lastSeenEventTs = 0;
      showBoard();
      startBannerRotation();
      startPolling();
    } catch (err) {
      showSetup('Could not reach the local server. Is "node server.js" running?');
    }
  });

  el('btn-demo').addEventListener('click', async () => {
    const startPoints = parseInt(el('input-start-points').value, 10) || 0;
    targetScore = parseInt(el('input-target-score').value, 10) || 3700;
    const subKeywords = el('input-sub-keywords').value || 'subscribed, sub';
    try {
      await fetch('/api/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subKeywords, startPoints, targetScore }),
      });
      lastSeenEventTs = 0;
      showBoard();
      startBannerRotation();
      startPolling();
    } catch (err) {
      showSetup('Could not reach the local server. Is "node server.js" running?');
    }
  });

  el('btn-settings').addEventListener('click', async () => {
    if (confirm('Return to settings? The live connection will stop for everyone (scores are saved).')) {
      try { await fetch('/api/reset', { method: 'POST' }); } catch (e) { /* server may be unreachable */ }
      showSetup();
    }
  });

  // On load, check whether another device already started a live/demo session on the server
  // and jump straight to the board if so — this is what lets a phone join without any setup.
  (async function init() {
    try {
      const res = await fetch('/api/status');
      const status = await res.json();
      if (status.targetScore) el('input-target-score').value = status.targetScore;
      if (status.subKeywords && status.subKeywords.length) el('input-sub-keywords').value = status.subKeywords.join(', ');
      if (status.startPoints != null) el('input-start-points').value = status.startPoints;
      if (status.videoId) el('input-video-id').value = status.videoId;

      if (status.mode === 'live' || status.mode === 'demo') {
        targetScore = status.targetScore || 3700;
        showBoard();
        startBannerRotation();
        startPolling();
      }
    } catch (err) {
      // Local server not reachable (e.g. opened via file://) — stay on the setup screen.
    }
  })();
})();
