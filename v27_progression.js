// Hokm Online v27 — XP / Level / Rating

function xpForLevel(level) {
  return Math.max(0, (level - 1) * (level - 1) * 100);
}

function levelFromXp(xp) {
  let level = 1;
  while (xpForLevel(level + 1) <= xp) level++;
  return level;
}

function winXp(level) {
  return 100 + Math.min(level * 5, 100);
}

function lossXp() {
  return 30;
}

function ratingDelta(won, currentRating) {
  const base = won ? 25 : -15;
  // جلوگیری از سقوط رتبه به زیر 100
  if (!won && currentRating <= 100) return 0;
  return base;
}

function applyResult(stats, won) {
  const gained = won ? winXp(stats.level) : lossXp();
  const xp = stats.xp + gained;
  const level = levelFromXp(xp);
  const streak = won ? stats.streak + 1 : 0;
  const bestStreak = Math.max(stats.best_streak, streak);
  const rating = Math.max(100, stats.rating + ratingDelta(won, stats.rating));

  return {xp, level, streak, bestStreak, rating, gained};
}

module.exports = {
  xpForLevel, levelFromXp, winXp, lossXp, ratingDelta, applyResult
};
