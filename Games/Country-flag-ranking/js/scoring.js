// Scoring engine: holds per-country points + a global "likes bonus" pool, persisted to localStorage.
const Scoring = (() => {
  let state = null;
  let storageKey = 'flagRanking_state_default';

  function keyFor(videoId) {
    return `flagRanking_state_${videoId || 'default'}`;
  }

  function freshState(startingPoints) {
    const countries = {};
    for (const c of COUNTRIES) countries[c.code] = startingPoints;
    return {
      countries,
      bonusPoints: 0,
      processedMessageIds: [], // capped ring buffer, newest last
      lastCountryByAuthor: {},
      userStats: {}, // authorId -> { name, comments }
      lastKnownLikeCount: null,
      recentEvents: [], // {type, code, delta, label, ts}, newest first, capped
    };
  }

  function load(videoId, startingPoints) {
    storageKey = keyFor(videoId);
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      try {
        state = JSON.parse(raw);
        // Ensure any new countries added to COUNTRIES since last save exist.
        for (const c of COUNTRIES) {
          if (!(c.code in state.countries)) state.countries[c.code] = startingPoints;
        }
        if (!state.userStats) state.userStats = {}; // back-compat with older saved states
        return state;
      } catch (e) {
        console.warn('Failed to parse saved state, starting fresh.', e);
      }
    }
    state = freshState(startingPoints);
    save();
    return state;
  }

  function save() {
    localStorage.setItem(storageKey, JSON.stringify(state));
  }

  function pushEvent(evt) {
    state.recentEvents.unshift({ ...evt, ts: Date.now() });
    if (state.recentEvents.length > 20) state.recentEvents.length = 20;
  }

  function hasProcessedMessage(id) {
    return state.processedMessageIds.includes(id);
  }

  function markMessageProcessed(id) {
    state.processedMessageIds.push(id);
    if (state.processedMessageIds.length > 500) {
      state.processedMessageIds.splice(0, state.processedMessageIds.length - 500);
    }
  }

  // Level 1 by default, +1 level per 100 comments, capped at level 10 (1000+ comments).
  function levelForComments(comments) {
    return Math.min(10, Math.floor((comments || 0) / 100) + 1);
  }

  function countryName(code) {
    return COUNTRIES.find(c => c.code === code)?.name || code.toUpperCase();
  }

  function bumpUserComment(authorId, authorName) {
    if (!authorId) return { comments: 0, level: 1 };
    if (!state.userStats[authorId]) state.userStats[authorId] = { name: authorName, comments: 0 };
    const entry = state.userStats[authorId];
    entry.name = authorName || entry.name;
    entry.comments += 1;
    return { comments: entry.comments, level: levelForComments(entry.comments) };
  }

  function getUserStats(authorId) {
    const entry = state.userStats[authorId];
    if (!entry) return { comments: 0, level: 1 };
    return { comments: entry.comments, level: levelForComments(entry.comments) };
  }

  function addCommentPoint(code, authorId, authorName) {
    if (!(code in state.countries)) return;
    state.countries[code] += 1;
    if (authorId) state.lastCountryByAuthor[authorId] = code;
    const { comments, level } = bumpUserComment(authorId, authorName);
    pushEvent({
      type: 'comment', code, delta: 1, authorId, authorName, comments, level,
      label: `[Lvl ${level}] ${authorName || 'Someone'} (${comments} comments) → ${countryName(code)} +1`,
    });
    save();
    return { comments, level };
  }

  function addSubscribeBonus(code, authorName, authorId) {
    if (!code || !(code in state.countries)) return false;
    state.countries[code] += 100;
    const { comments, level } = getUserStats(authorId);
    pushEvent({
      type: 'subscribe', code, delta: 100, authorId, authorName, comments, level,
      label: `[Lvl ${level}] ${authorName || 'Someone'} subscribed! → ${countryName(code)} +100`,
    });
    save();
    return true;
  }

  function addLikeBonus(deltaLikes) {
    if (deltaLikes <= 0) return;
    const gained = deltaLikes * 10;
    state.bonusPoints += gained;
    pushEvent({ type: 'like', code: null, delta: gained, label: `+${gained} bonus (video likes)` });
    save();
  }

  function getLastCountryForAuthor(authorId) {
    return state.lastCountryByAuthor[authorId] || null;
  }

  function getSortedCountries() {
    return COUNTRIES
      .map(c => ({ ...c, points: state.countries[c.code] ?? 0 }))
      .sort((a, b) => b.points - a.points);
  }

  function getBonusPoints() {
    return state.bonusPoints;
  }

  function getRecentEvents() {
    return state.recentEvents;
  }

  function reset(startingPoints) {
    state = freshState(startingPoints);
    save();
  }

  function setLastKnownLikeCount(n) {
    state.lastKnownLikeCount = n;
    save();
  }

  function getLastKnownLikeCount() {
    return state.lastKnownLikeCount;
  }

  return {
    load, save, hasProcessedMessage, markMessageProcessed,
    addCommentPoint, addSubscribeBonus, addLikeBonus,
    getLastCountryForAuthor, getSortedCountries, getBonusPoints,
    getRecentEvents, reset, setLastKnownLikeCount, getLastKnownLikeCount,
    getUserStats, levelForComments,
  };
})();
