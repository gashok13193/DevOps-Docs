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
  const liveCommentaryEl = el('live-commentary');
  const neonTitle = el('neon-title');
  const titleEmojiLeft = el('title-emoji-left');
  const titleEmojiRight = el('title-emoji-right');
  const muteBtn = el('btn-mute');
  const milestoneCard = el('milestone-card');
  const subscribeCard = el('subscribe-card');
  const winnerCard = el('winner-card');
  const multiplierBadge = el('multiplier-badge');

  let bannerTimer = null;
  let pollTimer = null;
  let targetScore = 5000;
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
    { left: '🔔', title: 'SUBSCRIBE =<br />GET +100 POINTS', right: '🔔' },
    { left: '💬', title: 'COMMENT YOUR<br />COUNTRY = +1', right: '💬' },
    { left: '❤️', title: 'LIKE THE VIDEO<br />= +10 BONUS', right: '❤️' },
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

  let liveCommentaryFacts = [];
  let liveCommentaryTimer = null;
  let liveCommentaryIndex = 0;

  // Builds a fresh list of "who's leading / who subscribed / who's commenting" facts from
  // the current state, so there's always something continuous to say even between events.
  function buildLiveCommentaryFacts(sorted, events) {
    const facts = [];
    const leader = sorted[0];
    if (leader) facts.push(`🏆 ${leader.name} is leading with ${leader.points} pts!`);
    const second = sorted[1];
    if (second) facts.push(`🥈 ${second.name} is in 2nd place with ${second.points} pts!`);
    const third = sorted[2];
    if (third) facts.push(`🥉 ${third.name} is in 3rd place with ${third.points} pts!`);
    const nameOf = code => (sorted.find(c => c.code === code) || {}).name || (code || '').toUpperCase();
    const overtakes = events.filter(e => e.type === 'overtake').slice(0, 3);
    overtakes.forEach(overtake => facts.push(overtake.label));
    const lastSub = events.find(e => e.type === 'subscribe');
    if (lastSub) facts.push(`🔔 ${lastSub.authorName || 'Someone'} subscribed for ${nameOf(lastSub.code)}!`);
    const lastComment = events.find(e => e.type === 'comment');
    if (lastComment) facts.push(`💬 ${lastComment.authorName || 'Someone'} commented for ${nameOf(lastComment.code)}!`);
    return facts.length ? facts : ['💬 Comment your country to get on the board!'];
  }

  function startLiveCommentaryRotation() {
    stopLiveCommentaryRotation();
    liveCommentaryIndex = 0;
    liveCommentaryTimer = setInterval(() => {
      if (!liveCommentaryFacts.length) return;
      liveCommentaryIndex = (liveCommentaryIndex + 1) % liveCommentaryFacts.length;
      liveCommentaryEl.textContent = liveCommentaryFacts[liveCommentaryIndex];
    }, 2500);
  }

  function stopLiveCommentaryRotation() {
    if (liveCommentaryTimer) clearInterval(liveCommentaryTimer);
    liveCommentaryTimer = null;
  }

  function showSetup(errorMsg) {
    stopPolling();
    stopBannerRotation();
    stopLiveCommentaryRotation();
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

    const events = data.recentEvents || [];
    ticker.innerHTML = events.length
      ? events.slice(0, 5).map(e => `<div class="ticker-item">${e.label}</div>`).join('')
      : '<div class="ticker-item">Waiting for chat activity…</div>';
    renderRaceTrack(sorted);

    liveCommentaryFacts = buildLiveCommentaryFacts(sorted, events);
    if (liveCommentaryIndex >= liveCommentaryFacts.length) liveCommentaryIndex = 0;
    liveCommentaryEl.textContent = liveCommentaryFacts[liveCommentaryIndex];

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
    targetScore = parseInt(el('input-target-score').value, 10) || 5000;
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
      startLiveCommentaryRotation();
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
    targetScore = parseInt(el('input-target-score').value, 10) || 5000;
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
      startLiveCommentaryRotation();
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
        targetScore = status.targetScore || 5000;
        showBoard();
        startBannerRotation();
        startLiveCommentaryRotation();
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
