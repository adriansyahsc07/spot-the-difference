// game.js — the rules of a round of Duskhaven Harbour: what counts as a find,
// what a miss costs, how hints behave, and when the round is won.
//
// The state is plain data; main.js renders it and feeds it clicks. Times are
// milliseconds on a clock main.js supplies, so a round can be frozen exactly
// for the screenshot states.

export const MAX_HINTS = 3;
export const MISS_PENALTY_MS = 3000; // a wrong click adds 3 seconds
export const HINT_PENALTY_MS = 10000; // a hint adds 10 seconds

export function createGame(differences) {
  return {
    differences: differences.map((d) => ({ ...d, found: false })),
    status: 'ready', // ready -> playing -> won
    misses: 0,
    hintsUsed: 0,
    penaltyMs: 0,
    startedAt: null,
    frozenElapsedMs: 0,
  };
}

export function startGame(game, now) {
  game.status = 'playing';
  game.startedAt = now;
}

export function foundCount(game) {
  return game.differences.filter((d) => d.found).length;
}

export function remainingCount(game) {
  return game.differences.length - foundCount(game);
}

export function elapsedMs(game, now) {
  if (game.status === 'ready') return 0;
  if (game.status === 'won') return game.frozenElapsedMs;
  return now - game.startedAt + game.penaltyMs;
}

// tryFind tests a click in scene coordinates against the unfound differences.
// Returns { outcome: 'found', difference } or { outcome: 'miss' }.
export function tryFind(game, x, y) {
  for (const d of game.differences) {
    if (d.found) continue;
    const dx = x - d.x, dy = y - d.y;
    if (dx * dx + dy * dy <= d.r * d.r) {
      d.found = true;
      return { outcome: 'found', difference: d };
    }
  }
  game.misses += 1;
  game.penaltyMs += MISS_PENALTY_MS;
  return { outcome: 'miss' };
}

// useHint picks the next unfound difference for the game to point at, or null
// when the round's hints are spent. The hint is a nudge, not a giveaway: the
// ring shows for a moment and the clock takes the cost.
export function useHint(game) {
  if (game.hintsUsed >= MAX_HINTS) return null;
  const next = game.differences.find((d) => !d.found);
  if (!next) return null;
  game.hintsUsed += 1;
  game.penaltyMs += HINT_PENALTY_MS;
  return next;
}

// checkWin freezes the clock and closes the round when the last difference
// has been found. Returns true when this call won the round.
export function checkWin(game, now) {
  if (game.status === 'playing' && remainingCount(game) === 0) {
    game.frozenElapsedMs = now - game.startedAt + game.penaltyMs;
    game.status = 'won';
    return true;
  }
  return false;
}

export function formatTime(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
