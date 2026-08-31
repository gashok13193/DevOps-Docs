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
  const muteBtn = el('btn-mute');
  const commentaryEl = el('commentary');
  const milestoneCard = el('milestone-card');
  const subscribeCard = el('subscribe-card');

  let bannerTimer = null;
  let pollTimer = null;
  let targetScore = 3700;
  let lastSeenEventTs = 0;
  let soundEnabled = true;
  let audioCtx = null;

  // Small synthesized "game" sound effects (no audio files needed, so nothing to host/license).
  function ensureAudio() {
    if (!audioCtx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx) audioCtx = new Ctx();
    }
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  }

  function beep(freq, duration, delay = 0, type = 'square', volume = 0.12) {
    if (!soundEnabled || !audioCtx) return;
    const startTime = audioCtx.currentTime + delay;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);
    gain.gain.setValueAtTime(volume, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(startTime);
    osc.stop(startTime + duration);
  }

  function playCommentSound() {
    beep(880, 0.08);
  }

  function playSubscribeSound() {
    beep(660, 0.09, 0);
    beep(880, 0.09, 0.09);
    beep(1320, 0.14, 0.18);
  }

  function playOvertakeSound() {
    beep(300, 0.05, 0);
    beep(500, 0.07, 0.05);
  }

  // Soft ambient background melody: a gentle looping arpeggio, quiet enough to sit behind speech/SFX.
  const MELODY_NOTES = [523.25, 659.25, 783.99, 1046.5, 783.99, 659.25];
  let musicTimer = null;
  let melodyIndex = 0;

  function startMelody() {
    stopMelody();
    melodyIndex = 0;
    musicTimer = setInterval(() => {
      if (!soundEnabled || !audioCtx) return;
      beep(MELODY_NOTES[melodyIndex % MELODY_NOTES.length], 0.6, 0, 'sine', 0.03);
      melodyIndex++;
    }, 600);
  }

  function stopMelody() {
    if (musicTimer) clearInterval(musicTimer);
    musicTimer = null;
  }

  // Voice narration removed per user request; kept as a no-op so existing call sites don't need changes.
  function speak() {}

  muteBtn.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    muteBtn.textContent = soundEnabled ? '🔊' : '🔇';
    muteBtn.title = soundEnabled ? 'Mute sounds' : 'Unmute sounds';
  });

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
    stopMelody();
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
    const MIN_GAP = 7; // percent; keeps close scores from overlapping so the leader always stands out clearly

    // Real positions reflect true progress toward the target; only spread out ones that would visually collide.
    const positions = top.map(c => Math.max(0, Math.min(1, c.points / targetScore)) * 100);
    for (let i = 1; i < positions.length; i++) {
      if (positions[i - 1] - positions[i] < MIN_GAP) {
        positions[i] = Math.max(0, positions[i - 1] - MIN_GAP);
      }
    }

    const markers = top.map((c, i) => {
      const rankClass = i === 0 ? 'race-rank-1' : '';
      return `
        <div class="race-marker ${rankClass}" style="left:${positions[i]}%">
          <img src="${flagUrl(c.code)}" alt="${c.name}" loading="lazy" />
          <span class="race-rank">${i + 1}</span>
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

  const OVERTAKE_PHRASES = ['overtakes', 'blasts past', 'crushes', 'storms past', 'leaves behind', 'surges past'];
  const OVERTAKE_EMOJI = ['🔥', '🚀', '💥', '⚡'];
  let prevTopOrder = [];
  let prevLeaderCode = null;
  let commentaryLog = []; // newest first, capped

  // Compares this poll's top 10 order to the previous one and returns sportscaster-style
  // lines for every pair whose relative order flipped (a genuine overtake), plus new entries.
  function computeCommentary(sorted) {
    const newTop = sorted.slice(0, 10).map(c => c.code);
    const lines = [];
    if (prevTopOrder.length) {
      const prevRank = new Map(prevTopOrder.map((code, i) => [code, i]));
      const nameOf = code => (sorted.find(c => c.code === code) || {}).name || code.toUpperCase();

      for (let i = 0; i < newTop.length; i++) {
        const mover = newTop[i];
        if (!prevRank.has(mover)) {
          lines.push(`🆕 ${nameOf(mover)} breaks into the Top 10 at #${i + 1}!`);
          continue;
        }
        for (let j = i + 1; j < newTop.length; j++) {
          const passed = newTop[j];
          if (prevRank.has(passed) && prevRank.get(mover) > prevRank.get(passed)) {
            const phrase = OVERTAKE_PHRASES[Math.floor(Math.random() * OVERTAKE_PHRASES.length)];
            const emoji = OVERTAKE_EMOJI[Math.floor(Math.random() * OVERTAKE_EMOJI.length)];
            lines.push(`${emoji} ${nameOf(mover)} ${phrase} ${nameOf(passed)} to grab #${i + 1}!`);
          }
        }
      }
    }
    prevTopOrder = newTop;
    return lines;
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

  let milestoneHideTimer = null;

  // Shows the comment-milestone celebration card (level, stars, badge title, total points) for a few seconds.
  function showMilestoneCard(e) {
    el('milestone-title').textContent = e.title || 'Rising Star';
    el('milestone-stars').textContent = '★'.repeat(e.stars || 1) + '☆'.repeat(5 - (e.stars || 1));
    el('milestone-level').textContent = e.level;
    el('milestone-name').textContent = e.authorName ? `@${e.authorName}` : 'Someone';
    el('milestone-message').textContent = `${e.comments} Comment Milestone!`;
    el('milestone-points').textContent = e.totalPoints ?? 0;
    milestoneCard.classList.remove('hidden');
    speak(`${e.authorName || 'Someone'} just hit a ${e.comments} comment milestone! ${e.title}!`);
    if (milestoneHideTimer) clearTimeout(milestoneHideTimer);
    milestoneHideTimer = setTimeout(() => milestoneCard.classList.add('hidden'), 5000);
  }

  let subscribeHideTimer = null;

  // Shows the "new subscriber" celebration card (flag, name, country, +100 points) for a few seconds.
  function showSubscribeCard(e, countryName) {
    el('subscribe-flag').src = flagUrl(e.code);
    el('subscribe-flag').alt = countryName;
    el('subscribe-name').textContent = e.authorName ? `@${e.authorName}` : 'Someone';
    el('subscribe-country').textContent = countryName;
    subscribeCard.classList.remove('hidden');
    if (subscribeHideTimer) clearTimeout(subscribeHideTimer);
    subscribeHideTimer = setTimeout(() => subscribeCard.classList.add('hidden'), 4000);
  }

  function render(data) {
    const sorted = data.sorted || [];
    grid.innerHTML = sorted.map((c, i) => {
      const rankClass = i === 0 ? 'rank-1' : i === 1 ? 'rank-2' : i === 2 ? 'rank-3' : '';
      return `
        <div class="flag-card ${rankClass}" data-code="${c.code}">
          <span class="rank">#${i + 1}</span>
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
      if (prevLeaderCode && leader.code !== prevLeaderCode) {
        speak(remaining === 0 ? `${leader.name} wins!` : `${leader.name} takes the lead!`);
      }
      prevLeaderCode = leader.code;
    }

    // Only pop/bump for events that are new since the last poll (avoids replaying old ones).
    const newEvents = events.filter(e => e.ts > lastSeenEventTs);
    newEvents.slice().reverse().forEach(e => {
      if (!e.code) return; // e.g. like-bonus events aren't tied to a country
      bumpCard(e.code);
      showPointPopup(e.code, e.type === 'subscribe' ? '+100 🎉' : '+1', e.type === 'subscribe', e.authorName);
      if (e.type === 'subscribe') {
        playSubscribeSound();
        const countryName = (sorted.find(c => c.code === e.code) || {}).name || e.code.toUpperCase();
        speak(`${e.authorName || 'Someone'} just subscribed! ${countryName} gains 100 points!`);
        showSubscribeCard(e, countryName);
      } else {
        playCommentSound();
      }
      if (e.milestone) showMilestoneCard(e);
    });
    if (events.length) lastSeenEventTs = Math.max(lastSeenEventTs, events[0].ts);

    const newCommentary = computeCommentary(sorted);
    if (newCommentary.length) {
      commentaryLog = [...newCommentary.reverse(), ...commentaryLog].slice(0, 6);
      playOvertakeSound();
      speak(newCommentary[newCommentary.length - 1]);
    }
    commentaryEl.innerHTML = commentaryLog.length
      ? commentaryLog.slice(0, 2).map(line => `<div class="commentary-item">${line}</div>`).join('')
      : '';
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
    ensureAudio();
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
      startMelody();
      speak('Game on! Comment your country to score points!');
    } catch (err) {
      showSetup('Could not reach the local server. Is "node server.js" running?');
    }
  });

  el('btn-demo').addEventListener('click', async () => {
    ensureAudio();
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
      startMelody();
      speak('Game on! Comment your country to score points!');
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

  // On load, check whether another device already started a REAL live session on the server
  // and jump straight to the board if so — this is what lets a phone join without any setup.
  // (Demo Mode intentionally does NOT auto-join other devices — it's a local, one-off preview.)
  (async function init() {
    try {
      const res = await fetch('/api/status');
      const status = await res.json();
      if (status.targetScore) el('input-target-score').value = status.targetScore;
      if (status.subKeywords && status.subKeywords.length) el('input-sub-keywords').value = status.subKeywords.join(', ');
      if (status.startPoints != null) el('input-start-points').value = status.startPoints;
      if (status.videoId) el('input-video-id').value = status.videoId;

      if (status.mode === 'live') {
        targetScore = status.targetScore || 3700;
        showBoard();
        startBannerRotation();
        startPolling();
        // No button click happened on this device, so autoplay policies block audio until
        // the visitor taps something — show a one-time prompt to unlock sound/melody.
        el('btn-enable-sound').classList.remove('hidden');
      }
    } catch (err) {
      // Local server not reachable (e.g. opened via file://) — stay on the setup screen.
    }
  })();

  el('btn-enable-sound').addEventListener('click', () => {
    ensureAudio();
    startMelody();
    el('btn-enable-sound').classList.add('hidden');
  });
})();
