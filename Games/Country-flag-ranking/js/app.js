// Ties together settings UI, YouTube polling, scoring, and rendering.
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

  const SETTINGS_KEY = 'flagRanking_settings';
  let subKeywords = [];
  let demoTimer = null;
  let bannerTimer = null;
  let targetScore = 3700;

  const BANNER_MESSAGES = [
    '💬 Comment Your Country = +1',
    '🔔 Subscribe = +100 Points',
    '❤️ Like the Video = +10 Bonus',
  ];

  function startBannerRotation() {
    if (bannerTimer) clearInterval(bannerTimer);
    let lastIndex = -1;
    bannerTimer = setInterval(() => {
      let next = Math.floor(Math.random() * BANNER_MESSAGES.length);
      if (next === lastIndex) next = (next + 1) % BANNER_MESSAGES.length;
      lastIndex = next;
      subBanner.textContent = BANNER_MESSAGES[next];
    }, 4000);
  }

  function loadSavedSettings() {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (!raw) return;
      const s = JSON.parse(raw);
      if (s.apiKey) el('input-api-key').value = s.apiKey;
      if (s.videoId) el('input-video-id').value = s.videoId;
      if (s.subKeywords) el('input-sub-keywords').value = s.subKeywords;
      if (s.startPoints != null) el('input-start-points').value = s.startPoints;
      if (s.targetScore != null) el('input-target-score').value = s.targetScore;
    } catch (e) { /* ignore corrupt settings */ }
  }

  function saveSettings(s) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  }

  function showSetup(errorMsg) {
    if (demoTimer) { clearInterval(demoTimer); demoTimer = null; }
    if (bannerTimer) { clearInterval(bannerTimer); bannerTimer = null; }
    YouTube.stop();
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

  function render() {
    const sorted = Scoring.getSortedCountries();
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
    bonusBadge.textContent = `❤️ Bonus: ${Scoring.getBonusPoints()}`;
    const events = Scoring.getRecentEvents();
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

  function parseKeywords(raw) {
    return raw.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  }

  function handleChatMessage(item) {
    const id = item.id;
    if (Scoring.hasProcessedMessage(id)) return;
    Scoring.markMessageProcessed(id);

    const text = item.snippet?.displayMessage || '';
    const authorId = item.authorDetails?.channelId || null;
    const authorName = item.authorDetails?.displayName || 'Someone';

    const countryCode = findCountryInText(text);
    let subscribeCode = null;

    if (countryCode) {
      Scoring.addCommentPoint(countryCode, authorId, authorName);
    }

    const lowerText = text.toLowerCase();
    const isSubscribeMsg = subKeywords.some(k => k && lowerText.includes(k));
    if (isSubscribeMsg) {
      const targetCode = countryCode || Scoring.getLastCountryForAuthor(authorId);
      if (targetCode) {
        Scoring.addSubscribeBonus(targetCode, authorName, authorId);
        subscribeCode = targetCode;
      }
    }

    // Render first (rebuilds the flag grid), then attach popups/animations to the fresh DOM nodes.
    render();
    if (countryCode) {
      bumpCard(countryCode);
      showPointPopup(countryCode, '+1', false, authorName);
    }
    if (subscribeCode) {
      bumpCard(subscribeCode);
      showPointPopup(subscribeCode, '+100 🎉', true, authorName);
    }
  }

  function startLive(apiKey, videoIdOrUrl, startPoints) {
    const videoId = YouTube.extractVideoId(videoIdOrUrl);
    if (!videoId) {
      showSetup('Could not read a video ID from that URL. Paste the full live stream URL or the 11-character video ID.');
      return;
    }

    Scoring.load(videoId, startPoints);
    targetValueEl.textContent = targetScore;
    YouTube.init(apiKey);
    showBoard();
    startBannerRotation();
    statusText.textContent = 'Connecting to live chat…';
    render();

    YouTube.getVideoInfo(videoId).then(info => {
      if (info.likeCount != null) Scoring.setLastKnownLikeCount(info.likeCount);

      if (!info.liveChatId) {
        statusText.textContent = 'No active live chat found for this video. Is it live right now?';
        return;
      }
      statusText.textContent = '🟢 Connected — comment your country in chat!';

      YouTube.pollChat(info.liveChatId, messages => {
        messages.forEach(handleChatMessage);
      }, err => {
        statusText.textContent = `⚠️ Chat error: ${err.message}`;
      });

      YouTube.pollLikes(videoId, likeCount => {
        const last = Scoring.getLastKnownLikeCount();
        if (last != null && likeCount > last) {
          Scoring.addLikeBonus(likeCount - last);
          render();
        }
        Scoring.setLastKnownLikeCount(likeCount);
      }, err => {
        console.warn('Like poll error', err);
      }, 15000);
    }).catch(err => {
      showSetup(err.message);
    });
  }

  function startDemo(startPoints) {
    Scoring.load('demo', startPoints);
    showBoard();
    startBannerRotation();
    statusText.textContent = '🧪 Demo mode — simulating chat activity (no real YouTube data).';
    render();

    const sampleNames = ['Aria', 'Leo', 'Maya', 'Noah', 'Zoe', 'Kai', 'Ivy', 'Omar'];
    demoTimer = setInterval(() => {
      const country = COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)];
      const name = sampleNames[Math.floor(Math.random() * sampleNames.length)];
      const roll = Math.random();
      if (roll < 0.08) {
        Scoring.addSubscribeBonus(country.code, name, `demo-${name}`);
        showPointPopup(country.code, '+100 🎉', true, name);
      } else if (roll < 0.15) {
        Scoring.addLikeBonus(1);
      } else {
        Scoring.addCommentPoint(country.code, `demo-${name}`, name);
        showPointPopup(country.code, '+1', false, name);
      }
      bumpCard(country.code);
      render();
    }, 900);
  }

  el('btn-start').addEventListener('click', () => {
    const apiKey = el('input-api-key').value.trim();
    const videoId = el('input-video-id').value.trim();
    const startPoints = parseInt(el('input-start-points').value, 10) || 0;
    targetScore = parseInt(el('input-target-score').value, 10) || 3700;
    subKeywords = parseKeywords(el('input-sub-keywords').value);

    if (!apiKey || !videoId) {
      showSetup('Please enter both an API key and a video URL/ID.');
      return;
    }
    saveSettings({ apiKey, videoId, subKeywords: el('input-sub-keywords').value, startPoints, targetScore });
    startLive(apiKey, videoId, startPoints);
  });

  el('btn-demo').addEventListener('click', () => {
    const startPoints = parseInt(el('input-start-points').value, 10) || 0;
    targetScore = parseInt(el('input-target-score').value, 10) || 3700;
    subKeywords = parseKeywords(el('input-sub-keywords').value || 'subscribed, sub');
    startDemo(startPoints);
  });

  el('btn-settings').addEventListener('click', () => {
    if (confirm('Return to settings? The live connection will stop (scores are saved).')) {
      showSetup();
    }
  });

  loadSavedSettings();
})();
