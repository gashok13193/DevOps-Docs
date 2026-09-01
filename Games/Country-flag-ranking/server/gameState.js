// Server-side scoring engine (port of js/scoring.js for Node): single shared source of truth
// for all devices viewing the board, persisted to a local JSON file instead of localStorage.
const fs = require('fs');
const path = require('path');
const { COUNTRIES } = require('../js/countries.js');

const DATA_DIR = path.join(__dirname, 'data');

let state = null;
let stateFile = null;

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function keyFor(videoId) {
  const safe = String(videoId || 'default').replace(/[^a-zA-Z0-9_-]/g, '_');
  return path.join(DATA_DIR, `state_${safe}.json`);
}

function freshState(startingPoints) {
  const countries = {};
  for (const c of COUNTRIES) countries[c.code] = startingPoints;
  return {
    countries,
    bonusPoints: 0,
    processedMessageIds: [],
    lastCountryByAuthor: {},
    userStats: {}, // authorId -> { name, comments }
    lastKnownLikeCount: null,
    likeGoalNext: 50, // next real-like-count milestone that triggers a 2x boost
    multiplier: 1,
    multiplierExpiresAt: 0,
    recentEvents: [], // newest first, capped
  };
}

function load(videoId, startingPoints) {
  ensureDataDir();
  stateFile = keyFor(videoId);
  if (fs.existsSync(stateFile)) {
    try {
      state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
      for (const c of COUNTRIES) {
        if (!(c.code in state.countries)) state.countries[c.code] = startingPoints;
      }
      if (!state.userStats) state.userStats = {};
      if (state.likeGoalNext == null) state.likeGoalNext = 50;
      if (state.multiplier == null) state.multiplier = 1;
      if (state.multiplierExpiresAt == null) state.multiplierExpiresAt = 0;
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
  if (!stateFile) return;
  fs.writeFileSync(stateFile, JSON.stringify(state));
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

// Level 1 by default, +1 level per 100 comments, capped at level 10 (900+ comments).
function levelForComments(comments) {
  return Math.min(10, Math.floor((comments || 0) / 100) + 1);
}

const LEVEL_TITLES = {
  1: 'Newcomer', 2: 'Rising Star', 3: 'Chat Enthusiast', 4: 'Community Voice',
  5: 'Local Legend', 6: 'Fan Favorite', 7: 'Global Icon', 8: 'Superstar',
  9: 'Hall of Famer', 10: 'Legendary Champion',
};
const MILESTONE_STEP = 10;

function titleForLevel(level) {
  return LEVEL_TITLES[level] || LEVEL_TITLES[1];
}

function starsForLevel(level) {
  return Math.min(5, Math.ceil(level / 2));
}

function countryName(code) {
  return COUNTRIES.find(c => c.code === code)?.name || code.toUpperCase();
}

function bumpUserStats(authorId, authorName, commentDelta, pointsDelta) {
  if (!authorId) return { comments: 0, level: 1, points: 0 };
  if (!state.userStats[authorId]) state.userStats[authorId] = { name: authorName, comments: 0, points: 0 };
  const entry = state.userStats[authorId];
  entry.name = authorName || entry.name;
  entry.comments += commentDelta;
  entry.points = (entry.points || 0) + pointsDelta;
  return { comments: entry.comments, level: levelForComments(entry.comments), points: entry.points };
}

function getUserStats(authorId) {
  const entry = state.userStats[authorId];
  if (!entry) return { comments: 0, level: 1, points: 0 };
  return { comments: entry.comments, level: levelForComments(entry.comments), points: entry.points || 0 };
}

// Returns the currently active point multiplier (1 = normal, >1 while a like-goal boost is active).
function currentMultiplier() {
  return Date.now() < state.multiplierExpiresAt ? state.multiplier : 1;
}

// Activates a temporary point multiplier (e.g. 2x for 60s) once a like-count goal is reached.
function activateMultiplier(mult, durationMs) {
  state.multiplier = mult;
  state.multiplierExpiresAt = Date.now() + durationMs;
  save();
}

function getMultiplierInfo() {
  return { multiplier: currentMultiplier(), expiresAt: state.multiplierExpiresAt };
}

// Checks the real cumulative like count against the next 50-like goal; if crossed, activates a
// 2x boost, announces it in the events feed, and returns the goal value reached (or null).
function checkLikeGoal(totalRealLikes) {
  if (totalRealLikes < state.likeGoalNext) return null;
  const reached = state.likeGoalNext;
  state.likeGoalNext += 50;
  activateMultiplier(2, 60000);
  pushEvent({
    type: 'like-goal', code: null, delta: 0, likeGoal: reached,
    label: `🎉 ${reached} Likes! Flags moving 2x faster for the next 60 seconds!`,
  });
  save();
  return reached;
}

function addCommentPoint(code, authorId, authorName) {
  if (!(code in state.countries)) return;
  const mult = currentMultiplier();
  state.countries[code] += 1 * mult;
  if (authorId) state.lastCountryByAuthor[authorId] = code;
  const { comments, level, points } = bumpUserStats(authorId, authorName, 1, 1 * mult);
  const milestone = comments > 0 && comments % MILESTONE_STEP === 0;
  pushEvent({
    type: 'comment', code, delta: 1 * mult, authorId, authorName, comments, level,
    label: `[Lvl ${level}] ${authorName || 'Someone'} (${comments} comments) → ${countryName(code)} +${1 * mult}`,
    ...(milestone ? { milestone: true, title: titleForLevel(level), stars: starsForLevel(level), totalPoints: points } : {}),
  });
  save();
  return { comments, level };
}

function addSubscribeBonus(code, authorName, authorId) {
  if (!code || !(code in state.countries)) return false;
  const mult = currentMultiplier();
  state.countries[code] += 100 * mult;
  const { comments, level } = bumpUserStats(authorId, authorName, 0, 100 * mult);
  pushEvent({
    type: 'subscribe', code, delta: 100 * mult, authorId, authorName, comments, level,
    label: `[Lvl ${level}] ${authorName || 'Someone'} subscribed! → ${countryName(code)} +${100 * mult}`,
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

// Announces whichever country gained the most points in the last boost window (e.g. 30s),
// giving viewers a periodic, exciting payoff to watch for instead of only continuous chatter.
function announceBoost(code, name, gain) {
  pushEvent({
    type: 'boost', code, delta: gain,
    label: `🚀 ${name} surges ahead! +${gain} in the last 30 seconds!`,
  });
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

// Resets only the country scores/bonus pool for a new round once a country reaches the target
// score — viewer comment counts, levels, and milestone progress are intentionally kept intact.
function resetForNewRound(startingPoints, winnerName, targetScore) {
  const countries = {};
  for (const c of COUNTRIES) countries[c.code] = startingPoints;
  state.countries = countries;
  state.bonusPoints = 0;
  pushEvent({
    type: 'reset', code: null, delta: 0, winnerName, targetScore,
    label: `🏆 ${winnerName} reached ${targetScore} pts! Scores reset for a new round — back to ${startingPoints} each.`,
  });
  save();
}

function setLastKnownLikeCount(n) {
  state.lastKnownLikeCount = n;
  save();
}

function getLastKnownLikeCount() {
  return state.lastKnownLikeCount;
}

module.exports = {
  load, save, hasProcessedMessage, markMessageProcessed,
  addCommentPoint, addSubscribeBonus, addLikeBonus,
  getLastCountryForAuthor, getSortedCountries, getBonusPoints,
  getRecentEvents, reset, resetForNewRound, setLastKnownLikeCount, getLastKnownLikeCount,
  getUserStats, levelForComments, currentMultiplier, activateMultiplier, getMultiplierInfo, checkLikeGoal,
  announceBoost,
};
