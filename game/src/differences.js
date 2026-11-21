// differences.js — the pool of differences that can hide in Duskhaven Harbour.
//
// Each difference names a spot in scene coordinates (the scene is 600x450 and is
// drawn identically into both panels; the right-hand panel applies the round's
// chosen differences). `x`, `y` and `r` are the click target: a click within
// the circle on either panel finds the difference. `foundText` is what the
// game announces when the difference is spotted, so a find feels like a find.

export const SCENE_WIDTH = 600;
export const SCENE_HEIGHT = 450;

export const DIFFERENCE_POOL = [
  {
    id: 'lamp',
    name: 'the lighthouse lamp',
    foundText: 'The lighthouse lamp — lit on the left, dark on the right.',
    x: 66, y: 145, r: 24,
  },
  {
    id: 'moon',
    name: 'the moon',
    foundText: 'The moon — a crescent on the left, full on the right.',
    x: 508, y: 56, r: 24,
  },
  {
    id: 'gull',
    name: 'the second gull',
    foundText: 'The second gull — it flew off in the right-hand picture.',
    x: 308, y: 92, r: 20,
  },
  {
    id: 'sail',
    name: 'the sail',
    foundText: 'The sail — deep red on the left, teal on the right.',
    x: 352, y: 285, r: 30,
  },
  {
    id: 'star',
    name: 'the bright star',
    foundText: 'A bright star that only shines in the right-hand picture.',
    x: 150, y: 88, r: 18,
  },
  {
    id: 'lantern',
    name: "the fisherman's lantern",
    foundText: "The fisherman's lantern — gone from his hand on the right.",
    x: 203, y: 296, r: 16,
  },
  {
    id: 'barrel',
    name: 'the loose barrel',
    foundText: 'The loose barrel rolled a little way along the dock.',
    x: 440, y: 302, r: 26,
  },
  {
    id: 'cat',
    name: 'the harbour cat',
    foundText: 'The harbour cat — sitting on the crates on the left, gone on the right.',
    x: 145, y: 258, r: 18,
  },
  {
    id: 'window',
    name: 'the cottage window',
    foundText: 'One cottage window — warm and lit on the left, dark on the right.',
    x: 252, y: 262, r: 14,
  },
  {
    id: 'flag',
    name: 'the mast flag',
    foundText: 'The little flag at the top of the mast — missing on the right.',
    x: 345, y: 204, r: 16,
  },
];

// mulberry32 — a tiny deterministic random generator, so a seed always deals
// the same round (the screenshot states rely on this).
export function seededRandom(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// pickDifferences deals one round: `count` differences drawn from the pool,
// in pool order (so the round reads naturally left to right across the scene).
export function pickDifferences(seed, count = 7) {
  const rand = seededRandom(seed * 1000 + 17);
  const shuffled = [...DIFFERENCE_POOL];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const chosen = new Set(shuffled.slice(0, count).map((d) => d.id));
  return DIFFERENCE_POOL.filter((d) => chosen.has(d.id));
}
