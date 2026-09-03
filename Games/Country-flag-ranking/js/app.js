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
  const neonTitle = el('neon-title');
  const titleEmojiLeft = el('title-emoji-left');
  const titleEmojiRight = el('title-emoji-right');
  const muteBtn = el('btn-mute');
  const milestoneCard = el('milestone-card');
  const subscribeCard = el('subscribe-card');
  const winnerCard = el('winner-card');
  const multiplierBadge = el('multiplier-badge');
  const challengeBanner = el('challenge-banner');

  let bannerTimer = null;
  let pollTimer = null;
  let targetScore = 1000;
  let lastSeenEventTs = 0;
  let soundEnabled = true;
  let audioCtx = null;

  function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, character => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
    }[character]));
  }

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

  function playBoostSound() {
    beep(440, 0.08, 0);
    beep(660, 0.08, 0.08);
    beep(990, 0.12, 0.16);
  }

  function playLikeGoalSound() {
    beep(523.25, 0.1, 0);
    beep(659.25, 0.1, 0.1);
    beep(783.99, 0.1, 0.2);
    beep(1046.5, 0.2, 0.3);
  }

  function playWinnerSound() {
    beep(523.25, 0.15, 0);
    beep(659.25, 0.15, 0.15);
    beep(783.99, 0.15, 0.3);
    beep(1046.5, 0.35, 0.45);
  }

  // Upbeat looping theme, mixed below speech and scoring effects.
  const MELODY_STEPS = [
    [392.0, 0.34, 'triangle'], [523.25, 0.24, 'sine'],
    [659.25, 0.34, 'triangle'], [783.99, 0.24, 'sine'],
    [698.46, 0.34, 'triangle'], [880.0, 0.24, 'sine'],
    [783.99, 0.42, 'triangle'], [523.25, 0.24, 'sine'],
  ];
  let musicTimer = null;
  let melodyIndex = 0;

  function startMelody() {
    stopMelody();
    melodyIndex = 0;
    musicTimer = setInterval(() => {
      if (!soundEnabled || !audioCtx) return;
      const [frequency, duration, type] = MELODY_STEPS[melodyIndex % MELODY_STEPS.length];
      beep(frequency, duration, 0, type, 0.055);
      melodyIndex++;
    }, 420);
  }

  function stopMelody() {
    if (musicTimer) clearInterval(musicTimer);
    musicTimer = null;
  }

  // Real spoken commentary via the browser's built-in text-to-speech (no API key/audio files needed).
  const MALE_VOICE_HINTS = [
    'male', 'david', 'guy', 'ryan', 'christopher', 'eric', 'daniel', 'mark', 'james',
    'george', 'matthew', 'brian', 'alex', 'fred', 'tom', 'google uk english male',
  ];
  let speechVoice = null;
  function loadSpeechVoice() {
    if (!('speechSynthesis' in window) || speechVoice) return; // lock the first voice we find; never switch mid-session
    const voices = window.speechSynthesis.getVoices();
    const enVoices = voices.filter(v => v.lang && v.lang.startsWith('en'));
    const pool = enVoices.length ? enVoices : voices;
    speechVoice = pool.find(v => MALE_VOICE_HINTS.some(h => v.name.toLowerCase().includes(h))) || pool[0] || voices[0] || null;
  }
  if ('speechSynthesis' in window) {
    loadSpeechVoice();
    window.speechSynthesis.onvoiceschanged = loadSpeechVoice;
  }

  function speak(text) {
    if (!soundEnabled || !('speechSynthesis' in window)) return;
    if (!speechVoice) loadSpeechVoice(); // make sure the very first utterance also uses our chosen voice, not the browser default
    const utter = new SpeechSynthesisUtterance(text.replace(/[\u{1F300}-\u{1FAFF}\u2600-\u27BF]/gu, ''));
    if (speechVoice) utter.voice = speechVoice;
    utter.rate = 0.92;
    utter.pitch = 0.95;
    utter.volume = 0.8;
    window.speechSynthesis.speak(utter);
  }

  muteBtn.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    muteBtn.textContent = soundEnabled ? '🔊' : '🔇';
    muteBtn.title = soundEnabled ? 'Mute sounds' : 'Unmute sounds';
  });

  const BANNER_MESSAGES = [
    { left: '🌍', title: 'WHERE ARE<br />YOU FROM?', right: '😎' },
    { left: '🔔', title: 'TYPE "COUNTRY SUB"<br />FOR +100', right: '🔔' },
    { left: '💬', title: 'COMMENT YOUR<br />COUNTRY = +1', right: '💬' },
    { left: '❤️', title: 'TYPE "COUNTRY LIKE"<br />FOR +10', right: '❤️' },
  ];

  function startBannerRotation() {
    stopBannerRotation();
    let lastIndex = -1;
    bannerTimer = setInterval(() => {
      let next = Math.floor(Math.random() * BANNER_MESSAGES.length);
      if (next === lastIndex) next = (next + 1) % BANNER_MESSAGES.length;
      lastIndex = next;
      const msg = BANNER_MESSAGES[next];
      neonTitle.innerHTML = msg.title;
      titleEmojiLeft.textContent = msg.left;
      titleEmojiRight.textContent = msg.right;
    }, 4000);
  }

  function stopBannerRotation() {
    if (bannerTimer) clearInterval(bannerTimer);
    bannerTimer = null;
  }

  let subscriptionReminderTimer = null;

  function startSubscriptionReminder() {
    stopSubscriptionReminder();
    subscriptionReminderTimer = setInterval(() => {
      if ('speechSynthesis' in window && !window.speechSynthesis.speaking) {
        speak('Subscribe for 100 points.');
      }
    }, 60000);
  }

  function stopSubscriptionReminder() {
    if (subscriptionReminderTimer) clearInterval(subscriptionReminderTimer);
    subscriptionReminderTimer = null;
  }

  function showSetup(errorMsg) {
    stopPolling();
    stopBannerRotation();
    stopSubscriptionReminder();
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

  let prevLeaderCode = null;

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
    setTimeout(() => popup.remove(), 3200);
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

  // Shows an engagement celebration card for a reported subscription or like.
  function showSubscribeCard(e, countryName, isLike = false) {
    el('subscribe-flag').src = flagUrl(e.code);
    el('subscribe-flag').alt = countryName;
    el('subscribe-name').textContent = e.authorName ? `@${e.authorName}` : 'Someone';
    el('subscribe-country').textContent = countryName;
    el('subscribe-badge').textContent = isLike ? '❤️ New Like!' : '🔔 New Subscriber!';
    el('subscribe-points').textContent = `+${e.delta} Points! ${isLike ? '❤️' : '🎉'}`;
    subscribeCard.classList.toggle('like-card', isLike);
    subscribeCard.classList.remove('hidden');
    if (subscribeHideTimer) clearTimeout(subscribeHideTimer);
    subscribeHideTimer = setTimeout(() => subscribeCard.classList.add('hidden'), 4000);
  }

  let winnerHideTimer = null;

  // Shows the big winner celebration card when a country reaches the target and the board resets.
  function showWinnerCard(e) {
    el('winner-name').textContent = e.winnerName || 'Someone';
    el('winner-message').textContent = `Reached ${e.targetScore ?? targetScore} pts!`;
    winnerCard.classList.remove('hidden');
    playWinnerSound();
    speak(`Congratulations! ${e.winnerName} reached the target! Starting a new round!`);
    if (winnerHideTimer) clearTimeout(winnerHideTimer);
    winnerHideTimer = setTimeout(() => winnerCard.classList.add('hidden'), 6000);
  }

  let multiplierHideTimer = null;

  // Flashes the "2X POINTS" badge for 60s whenever a like-count goal is reached.
  function showLikeGoalBoost(e) {
    multiplierBadge.classList.remove('hidden');
    playLikeGoalSound();
    speak(`${e.likeGoal} likes! Flags are moving twice as fast for the next minute!`);
    if (multiplierHideTimer) clearTimeout(multiplierHideTimer);
    multiplierHideTimer = setTimeout(() => multiplierBadge.classList.add('hidden'), 60000);
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
    const challenge = data.activeChallenge;
    if (challenge) {
      const seconds = Math.max(0, Math.ceil((challenge.expiresAt - Date.now()) / 1000));
      let progress = '';
      if (challenge.type === 'sprint') {
        const leadingVotes = Math.max(0, ...Object.values(challenge.votes || {}));
        progress = ` ${leadingVotes}/${challenge.goal}`;
      }
      challengeBanner.textContent = `🎯 ${challenge.label} ${seconds}s${progress}`;
      challengeBanner.classList.remove('hidden');
    } else {
      challengeBanner.classList.add('hidden');
    }

    const events = data.recentEvents || [];
    ticker.innerHTML = events.length
      ? events.slice(0, 5).map(e => `<div class="ticker-item">${escapeHtml(e.label)}</div>`).join('')
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
      if (e.type === 'reset') { showWinnerCard(e); return; }
      if (e.type === 'like-goal') { showLikeGoalBoost(e); return; }
      if (e.type === 'boost') {
        bumpCard(e.code);
        const countryName = (sorted.find(c => c.code === e.code) || {}).name || e.code.toUpperCase();
        showPointPopup(e.code, `🚀 +${e.delta} SURGE!`, true, null);
        playBoostSound();
        speak(`${countryName} surges ahead!`);
        return;
      }
      if (e.type === 'overtake') {
        bumpCard(e.code);
        const mover = (sorted.find(c => c.code === e.code) || {}).name || e.code.toUpperCase();
        const passed = (sorted.find(c => c.code === e.passedCode) || {}).name || e.passedCode.toUpperCase();
        speak(`${mover} moved ahead of ${passed} into place ${e.newRank}!`);
        return;
      }
      if (e.type === 'challenge') {
        speak(e.challenge.label);
        return;
      }
      if (e.type === 'challenge-win' || e.type === 'team-bonus' || e.type === 'streak') {
        bumpCard(e.code);
        showPointPopup(e.code, `+${e.delta} ${e.type === 'streak' ? '🔥' : '🎉'}`, true, e.authorName);
        playBoostSound();
        speak(e.type === 'streak' ? `${e.authorName || 'Someone'} is on a ${e.streak} vote streak!` : e.label);
        return;
      }
      if (e.type === 'comeback' || e.type === 'first-voter' || e.type === 'supporter') {
        if (e.code) bumpCard(e.code);
        speak(e.label);
        return;
      }
      if (e.type === 'viewer-like') {
        bumpCard(e.code);
        showPointPopup(e.code, `+${e.delta} ❤️`, true, e.authorName);
        playSubscribeSound();
        const countryName = (sorted.find(c => c.code === e.code) || {}).name || e.code.toUpperCase();
        speak(`${e.authorName || 'Someone'} liked! ${countryName} gains ${e.delta} points!`);
        showSubscribeCard(e, countryName, true);
        return;
      }
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
    targetScore = parseInt(el('input-target-score').value, 10) || 1000;
    const subKeywords = el('input-sub-keywords').value;
    const likeKeywords = el('input-like-keywords').value;

    if (!videoId) {
      showSetup('Please enter a live video URL or ID.');
      return;
    }
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey, videoId, subKeywords, likeKeywords, startPoints, targetScore }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        showSetup(data.error || 'Could not start the live board.');
        return;
      }
      lastSeenEventTs = 0;
      showBoard();
      startBannerRotation();
      startSubscriptionReminder();
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
    targetScore = parseInt(el('input-target-score').value, 10) || 1000;
    const subKeywords = el('input-sub-keywords').value || 'subscribed, sub';
    const likeKeywords = el('input-like-keywords').value || 'liked, like';
    try {
      await fetch('/api/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subKeywords, likeKeywords, startPoints, targetScore }),
      });
      lastSeenEventTs = 0;
      showBoard();
      startBannerRotation();
      startSubscriptionReminder();
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
      if (status.likeKeywords && status.likeKeywords.length) el('input-like-keywords').value = status.likeKeywords.join(', ');
      if (status.startPoints != null) el('input-start-points').value = status.startPoints;
      if (status.videoId) el('input-video-id').value = status.videoId;

      if (status.mode === 'live') {
        targetScore = status.targetScore || 1000;
        showBoard();
        startBannerRotation();
        startSubscriptionReminder();
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
