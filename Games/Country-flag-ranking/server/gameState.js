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
    firstVoterByCountry: {}, // country code -> first voter name in this round
    teamVoteCounts: {}, // country code -> valid country votes in this round
    subscriptionBonusAuthors: {}, // authorId -> true after their one-time +100 bonus
    likeBonusAuthors: {}, // authorId -> true after their one-time +10 bonus
    lastKnownLikeCount: null,
    likeGoalNext: 50, // next real-like-count milestone that triggers a 2x boost
    multiplier: 1,
    multiplierExpiresAt: 0,
    activeChallenge: null,
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
      if (!state.firstVoterByCountry) state.firstVoterByCountry = {};
      if (!state.teamVoteCounts) state.teamVoteCounts = {};
      if (!state.subscriptionBonusAuthors) state.subscriptionBonusAuthors = {};
      if (!state.likeBonusAuthors) state.likeBonusAuthors = {};
      if (state.likeGoalNext == null) state.likeGoalNext = 50;
      if (state.multiplier == null) state.multiplier = 1;
      if (state.multiplierExpiresAt == null) state.multiplierExpiresAt = 0;
      if (!('activeChallenge' in state)) state.activeChallenge = null;
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
  if (state.recentEvents.length > 50) state.recentEvents.length = 50;
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

function getActiveChallenge() {
  if (state.activeChallenge && Date.now() >= state.activeChallenge.expiresAt) {
    state.activeChallenge = null;
    save();
  }
  return state.activeChallenge;
}

function startChallenge(challenge) {
  state.activeChallenge = { ...challenge, startedAt: Date.now() };
  pushEvent({ type: 'challenge', code: challenge.countryCode || null, challenge: state.activeChallenge, label: `🎯 ${challenge.label}` });
  save();
  return state.activeChallenge;
}

function challengeMultiplierFor(code, rank) {
  const challenge = getActiveChallenge();
  if (!challenge) return 1;
  if (challenge.type === 'country-double' && challenge.countryCode === code) return 2;
  if (challenge.type === 'underdog-double' && rank > 20) return 2;
  return 1;
}

function updateViewerStreak(authorId, authorName) {
  if (!authorId) return { streak: 0, bonus: 0 };
  const entry = state.userStats[authorId] || (state.userStats[authorId] = { name: authorName, comments: 0, points: 0 });
  const now = Date.now();
  entry.name = authorName || entry.name;
  entry.streak = now - (entry.lastVoteAt || 0) <= 90000 ? (entry.streak || 0) + 1 : 1;
  entry.lastVoteAt = now;
  const bonus = entry.streak === 3 ? 3 : entry.streak === 5 ? 5 : 0;
  return { streak: entry.streak, bonus };
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

function rankForCountry(code) {
  return getSortedCountries().findIndex(country => country.code === code) + 1;
}

function announceTopFortyOvertake(code, previousRank, pointsAdded) {
  const newRank = rankForCountry(code);
  if (!previousRank || !newRank || newRank >= previousRank || newRank > 40) return;

  const sorted = getSortedCountries();
  const passed = sorted[newRank] || sorted[Math.min(previousRank - 1, sorted.length - 1)];
  if (!passed) return;

  const mover = countryName(code);
  const verb = pointsAdded >= 100 ? 'crushed past' : 'moved ahead of';
  pushEvent({
    type: 'overtake', code, passedCode: passed.code, previousRank, newRank,
    label: `⚡ ${mover} ${verb} ${passed.name}! #${previousRank} → #${newRank}`,
  });
}

function addCommentPoint(code, authorId, authorName, commentText) {
  if (!(code in state.countries)) return;
  const previousRank = rankForCountry(code);
  const mult = currentMultiplier() * challengeMultiplierFor(code, previousRank);
  const votePoints = 1 * mult;
  state.countries[code] += votePoints;
  if (authorId) state.lastCountryByAuthor[authorId] = code;
  const { comments, level, points } = bumpUserStats(authorId, authorName, 1, votePoints);
  const { streak, bonus: streakBonus } = updateViewerStreak(authorId, authorName);
  if (streakBonus) {
    state.countries[code] += streakBonus;
    bumpUserStats(authorId, authorName, 0, streakBonus);
    pushEvent({ type: 'streak', code, delta: streakBonus, authorName, streak,
      label: `🔥 ${authorName || 'Someone'} is on a ${streak}-vote streak! ${countryName(code)} +${streakBonus}` });
  }
  if (!state.firstVoterByCountry[code]) {
    state.firstVoterByCountry[code] = authorName || 'Someone';
    pushEvent({ type: 'first-voter', code, authorName,
      label: `⭐ ${authorName || 'Someone'} is first for ${countryName(code)} this round!` });
  }
  state.teamVoteCounts[code] = (state.teamVoteCounts[code] || 0) + 1;
  if (state.teamVoteCounts[code] % 25 === 0) {
    state.countries[code] += 20;
    pushEvent({ type: 'team-bonus', code, delta: 20, votes: state.teamVoteCounts[code],
      label: `🤝 ${countryName(code)} reached ${state.teamVoteCounts[code]} team votes! +20 bonus` });
  }
  const challenge = getActiveChallenge();
  if (challenge?.type === 'sprint') {
    challenge.votes[code] = (challenge.votes[code] || 0) + 1;
    if (!challenge.winnerCode && challenge.votes[code] >= challenge.goal) {
      challenge.winnerCode = code;
      state.countries[code] += challenge.bonus;
      pushEvent({ type: 'challenge-win', code, delta: challenge.bonus,
        label: `🏁 ${countryName(code)} won the sprint challenge! +${challenge.bonus}` });
    }
  }
  const milestone = comments > 0 && comments % MILESTONE_STEP === 0;
  pushEvent({
    type: 'comment', code, delta: votePoints, authorId, authorName, comments, level, streak,
    text: String(commentText || '').trim().slice(0, 140),
    label: `💬 [Lvl ${level}] ${authorName || 'Someone'} → ${countryName(code)} +${votePoints}`,
    ...(milestone ? { milestone: true, title: titleForLevel(level), stars: starsForLevel(level), totalPoints: points } : {}),
  });
  const newRank = rankForCountry(code);
  if (previousRank > 20 && newRank <= 20) {
    pushEvent({ type: 'comeback', code, previousRank, newRank,
      label: `🚀 Comeback alert! ${countryName(code)} charged from #${previousRank} to #${newRank}!` });
  }
  announceTopFortyOvertake(code, previousRank, votePoints + streakBonus);
  save();
  return { comments, level };
}

function addChatMessage(authorName, text) {
  const message = String(text || '').trim().slice(0, 140);
  if (!message) return;
  pushEvent({
    type: 'chat', code: null, authorName, text: message,
    label: `💬 ${authorName || 'Someone'}: ${message}`,
  });
  save();
}

function addSubscribeBonus(code, authorName, authorId) {
  if (!code || !(code in state.countries)) return false;
  if (authorId && state.subscriptionBonusAuthors[authorId]) return false;
  const previousRank = rankForCountry(code);
  const mult = currentMultiplier();
  state.countries[code] += 100 * mult;
  if (authorId) state.subscriptionBonusAuthors[authorId] = true;
  const { comments, level } = bumpUserStats(authorId, authorName, 0, 100 * mult);
  pushEvent({
    type: 'subscribe', code, delta: 100 * mult, authorId, authorName, comments, level,
    label: `[Lvl ${level}] ${authorName || 'Someone'} subscribed! → ${countryName(code)} +${100 * mult}`,
  });
  announceTopFortyOvertake(code, previousRank, 100 * mult);
  save();
  return true;
}

function addViewerLikeBonus(code, authorName, authorId) {
  if (!code || !(code in state.countries)) return false;
  if (authorId && state.likeBonusAuthors[authorId]) return false;
  const previousRank = rankForCountry(code);
  const mult = currentMultiplier();
  const gained = 10 * mult;
  state.countries[code] += gained;
  if (authorId) state.likeBonusAuthors[authorId] = true;
  const { comments, level } = bumpUserStats(authorId, authorName, 0, gained);
  pushEvent({
    type: 'viewer-like', code, delta: gained, authorId, authorName, comments, level,
    label: `[Lvl ${level}] ${authorName || 'Someone'} liked! → ${countryName(code)} +${gained}`,
  });
  announceTopFortyOvertake(code, previousRank, gained);
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

function announceTopSupporter() {
  const supporters = Object.entries(state.userStats)
    .filter(([, stats]) => stats.points > 0)
    .sort(([, first], [, second]) => second.points - first.points);
  const [authorId, supporter] = supporters[0] || [];
  if (!supporter) return null;
  pushEvent({ type: 'supporter', code: state.lastCountryByAuthor[authorId] || null, authorName: supporter.name,
    points: supporter.points, label: `🌟 Most active supporter: ${supporter.name || 'Someone'} with ${supporter.points} points!` });
  save();
  return supporter;
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
  state.firstVoterByCountry = {};
  state.teamVoteCounts = {};
  state.activeChallenge = null;
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
  addCommentPoint, addChatMessage, addSubscribeBonus, addViewerLikeBonus, addLikeBonus,
  getLastCountryForAuthor, getSortedCountries, getBonusPoints,
  getRecentEvents, reset, resetForNewRound, setLastKnownLikeCount, getLastKnownLikeCount,
  getUserStats, levelForComments, currentMultiplier, activateMultiplier, getMultiplierInfo, checkLikeGoal,
  getActiveChallenge, startChallenge, announceBoost, announceTopSupporter,
};
