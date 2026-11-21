// main.js — wires Duskhaven Harbour to the page: the two canvases, the HUD,
// pointer and keyboard input, the find/miss/hint effects, and the round flow
// (title -> playing -> won -> a fresh, reshuffled round).
//
// Screenshot states: ?shot=start|play|hint|win&seed=N freezes the game in a
// deterministic pose (see shots.json), so the maker's screenshots are real
// renders of exactly this code.

import { SCENE_WIDTH, SCENE_HEIGHT, pickDifferences } from './differences.js';
import { drawScene } from './scene.js';
import {
  createGame, startGame, tryFind, useHint, checkWin,
  foundCount, remainingCount, elapsedMs, formatTime, MAX_HINTS,
} from './game.js';
import { playFind, playMiss, playWin, playHint } from './sound.js';

const params = new URLSearchParams(location.search);
const shot = params.get('shot');
const baseSeed = Number(params.get('seed') ?? '1') || 1;

const leftCanvas = document.getElementById('leftCanvas');
const rightCanvas = document.getElementById('rightCanvas');
const counterEl = document.getElementById('counter');
const timerEl = document.getElementById('timer');
const missesEl = document.getElementById('misses');
const messageEl = document.getElementById('message');
const hintBtn = document.getElementById('hintBtn');
const restartBtn = document.getElementById('restartBtn');
const startOverlay = document.getElementById('startOverlay');
const winOverlay = document.getElementById('winOverlay');
const winStats = document.getElementById('winStats');

const SCALE = 2; // canvas backing is 1200x900 for a 600x450 scene
for (const canvas of [leftCanvas, rightCanvas]) {
  canvas.getContext('2d').scale(SCALE, SCALE);
}
const leftCtx = leftCanvas.getContext('2d');
const rightCtx = rightCanvas.getContext('2d');

let round = 0;
let game = null;
let alteredIds = new Set();
let effects = []; // { kind: 'pulse'|'miss', x, y, born }
let hintRing = null; // { difference, until }
let shotElapsed = null; // frozen clock for screenshot states

// The keyboard crosshair: which panel it is on, and where.
const cursor = { panel: 'left', x: SCENE_WIDTH / 2, y: SCENE_HEIGHT / 2, visible: false };

function newRound(seed) {
  const differences = pickDifferences(seed, 7);
  game = createGame(differences);
  alteredIds = new Set(differences.map((d) => d.id));
  effects = [];
  hintRing = null;
  updateHud();
}

function updateHud() {
  const total = game.differences.length;
  const found = foundCount(game);
  counterEl.innerHTML = `Found <strong>${found} of ${total}</strong> · ${remainingCount(game)} to go`;
  missesEl.textContent = `Misses: ${game.misses}`;
  const hintsLeft = MAX_HINTS - game.hintsUsed;
  hintBtn.textContent = `Hint (${hintsLeft} left)`;
  hintBtn.disabled = game.status !== 'playing' || hintsLeft <= 0;
}

function currentElapsed(now) {
  if (shotElapsed !== null) return shotElapsed;
  return elapsedMs(game, now);
}

function drawMarker(ctx, d) {
  ctx.save();
  ctx.lineWidth = 5;
  ctx.strokeStyle = 'rgba(20,14,8,0.55)';
  ctx.beginPath();
  ctx.arc(d.x, d.y, d.r + 5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#ffd23e';
  ctx.beginPath();
  ctx.arc(d.x, d.y, d.r + 5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawPanel(ctx, altered, panelName, now) {
  drawScene(ctx, altered);
  for (const d of game.differences) {
    if (d.found) drawMarker(ctx, d);
  }
  // The hint ring breathes around the difference it points at.
  if (hintRing && now < hintRing.until) {
    const d = hintRing.difference;
    const pulse = 3 + Math.sin(now / 160) * 2;
    ctx.save();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#7ee2ff';
    ctx.setLineDash([7, 6]);
    ctx.beginPath();
    ctx.arc(d.x, d.y, d.r + 10 + pulse, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  // Short-lived effects: a gold pulse on a find, a red cross on a miss.
  for (const fx of effects) {
    if (fx.panel !== panelName) continue;
    const age = (now - fx.born) / 650;
    if (age < 0 || age > 1) continue;
    ctx.save();
    ctx.globalAlpha = 1 - age;
    if (fx.kind === 'pulse') {
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#ffd23e';
      ctx.beginPath();
      ctx.arc(fx.x, fx.y, 8 + age * 26, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#ff5a4e';
      const s = 9;
      ctx.beginPath();
      ctx.moveTo(fx.x - s, fx.y - s); ctx.lineTo(fx.x + s, fx.y + s);
      ctx.moveTo(fx.x + s, fx.y - s); ctx.lineTo(fx.x - s, fx.y + s);
      ctx.stroke();
    }
    ctx.restore();
  }
  // The keyboard crosshair.
  if (cursor.visible && cursor.panel === panelName && game.status === 'playing') {
    ctx.save();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(cursor.x, cursor.y, 11, 0, Math.PI * 2);
    ctx.moveTo(cursor.x - 17, cursor.y); ctx.lineTo(cursor.x - 5, cursor.y);
    ctx.moveTo(cursor.x + 5, cursor.y); ctx.lineTo(cursor.x + 17, cursor.y);
    ctx.moveTo(cursor.x, cursor.y - 17); ctx.lineTo(cursor.x, cursor.y - 5);
    ctx.moveTo(cursor.x, cursor.y + 5); ctx.lineTo(cursor.x, cursor.y + 17);
    ctx.stroke();
    ctx.restore();
  }
}

function render(now) {
  drawPanel(leftCtx, new Set(), 'left', now);
  drawPanel(rightCtx, alteredIds, 'right', now);
  timerEl.textContent = formatTime(currentElapsed(now));
}

function frame(now) {
  render(now);
  effects = effects.filter((fx) => now - fx.born < 700);
  if (hintRing && now >= hintRing.until) hintRing = null;
  requestAnimationFrame(frame);
}

function setMessage(text) {
  messageEl.textContent = text;
}

function markAt(panelName, x, y) {
  if (game.status !== 'playing') return;
  const now = performance.now();
  const result = tryFind(game, x, y);
  if (result.outcome === 'found') {
    effects.push({ kind: 'pulse', x: result.difference.x, y: result.difference.y, panel: panelName, born: now });
    effects.push({ kind: 'pulse', x: result.difference.x, y: result.difference.y, panel: panelName === 'left' ? 'right' : 'left', born: now });
    setMessage(result.difference.foundText);
    playFind();
    if (checkWin(game, now)) {
      winStats.textContent = `Time ${formatTime(game.frozenElapsedMs)} · ${game.misses} misses · ${game.hintsUsed} hints`;
      winOverlay.hidden = false;
      playWin();
    }
  } else {
    effects.push({ kind: 'miss', x, y, panel: panelName, born: now });
    setMessage('Not there — the clock takes 3 seconds for that.');
    playMiss();
  }
  updateHud();
}

function sceneCoords(canvas, event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * SCENE_WIDTH,
    y: ((event.clientY - rect.top) / rect.height) * SCENE_HEIGHT,
  };
}

leftCanvas.addEventListener('pointerdown', (e) => {
  const { x, y } = sceneCoords(leftCanvas, e);
  cursor.panel = 'left'; cursor.x = x; cursor.y = y;
  markAt('left', x, y);
});
rightCanvas.addEventListener('pointerdown', (e) => {
  const { x, y } = sceneCoords(rightCanvas, e);
  cursor.panel = 'right'; cursor.x = x; cursor.y = y;
  markAt('right', x, y);
});

function doHint() {
  if (game.status !== 'playing') return;
  const d = useHint(game);
  if (!d) {
    setMessage('No hints left — trust your eyes.');
    return;
  }
  hintRing = { difference: d, until: performance.now() + 2200 };
  setMessage('Somewhere in the ring… the clock takes 10 seconds for a hint.');
  playHint();
  updateHud();
}

function doRestart() {
  round += 1;
  newRound(baseSeed + round);
  game.status = 'playing';
  game.startedAt = performance.now();
  startOverlay.hidden = true;
  winOverlay.hidden = true;
  setMessage('A fresh round — seven differences, newly hidden.');
  updateHud();
}

hintBtn.addEventListener('click', doHint);
restartBtn.addEventListener('click', doRestart);
document.getElementById('startBtn').addEventListener('click', () => {
  startGame(game, performance.now());
  startOverlay.hidden = true;
  setMessage('Seven differences hide between the two pictures. Click one, in either picture, to ring it.');
  updateHud();
});
document.getElementById('againBtn').addEventListener('click', doRestart);

window.addEventListener('keydown', (e) => {
  if (game.status !== 'playing') return;
  const step = e.shiftKey ? 24 : 10;
  let used = true;
  switch (e.key) {
    case 'ArrowLeft': cursor.x = Math.max(0, cursor.x - step); cursor.visible = true; break;
    case 'ArrowRight': cursor.x = Math.min(SCENE_WIDTH, cursor.x + step); cursor.visible = true; break;
    case 'ArrowUp': cursor.y = Math.max(0, cursor.y - step); cursor.visible = true; break;
    case 'ArrowDown': cursor.y = Math.min(SCENE_HEIGHT, cursor.y + step); cursor.visible = true; break;
    case 'Tab':
      cursor.panel = cursor.panel === 'left' ? 'right' : 'left';
      leftCanvas.classList.toggle('active', cursor.panel === 'left');
      rightCanvas.classList.toggle('active', cursor.panel === 'right');
      cursor.visible = true;
      break;
    case 'Enter':
    case ' ':
      cursor.visible = true;
      markAt(cursor.panel, cursor.x, cursor.y);
      break;
    case 'h': case 'H': doHint(); break;
    case 'r': case 'R': doRestart(); break;
    default: used = false;
  }
  if (used) e.preventDefault();
});

// --- Round setup, including the frozen screenshot states -------------------
newRound(baseSeed);

if (shot === 'start') {
  shotElapsed = 0;
} else if (shot === 'play' || shot === 'hint' || shot === 'win') {
  game.status = 'playing';
  game.startedAt = performance.now();
  startOverlay.hidden = true;
  const markFirst = (n) => game.differences.slice(0, n).forEach((d) => { d.found = true; });
  if (shot === 'play') {
    markFirst(3);
    shotElapsed = 74000;
    setMessage(game.differences[2].foundText);
  } else if (shot === 'hint') {
    markFirst(5);
    shotElapsed = 123000;
    game.hintsUsed = 1;
    hintRing = { difference: game.differences[5], until: Number.POSITIVE_INFINITY };
    setMessage('Somewhere in the ring… the clock takes 10 seconds for a hint.');
  } else {
    markFirst(game.differences.length);
    game.status = 'won';
    game.misses = 2;
    game.hintsUsed = 1;
    game.frozenElapsedMs = 227000;
    shotElapsed = 227000;
    winStats.textContent = `Time ${formatTime(227000)} · 2 misses · 1 hint`;
    winOverlay.hidden = false;
  }
  updateHud();
} else {
  shotElapsed = null;
}

requestAnimationFrame(frame);
