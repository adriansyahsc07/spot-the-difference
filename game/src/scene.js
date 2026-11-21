// scene.js — draws the Duskhaven Harbour scene, twice.
//
// drawScene(ctx, altered) paints the whole 600x450 harbour at dusk. `altered`
// is a Set of difference ids (see differences.js): the left panel is drawn
// with an empty set (the original), the right panel with the round's chosen
// set, and each difference changes exactly one detail of the drawing. Every
// ambient detail (the star field, the water shimmers) comes from fixed seeds,
// so the two panels match everywhere a difference does not touch them.

import { seededRandom } from './differences.js';

const W = 600;
const H = 450;
const HORIZON = 292;

// The ambient star field is computed once from a fixed seed: identical in
// both panels, every round.
const AMBIENT_STARS = (() => {
  const rand = seededRandom(7);
  const stars = [];
  for (let i = 0; i < 46; i++) {
    stars.push({
      x: Math.floor(rand() * W),
      y: 8 + Math.floor(rand() * 150),
      r: 0.6 + rand() * 1.1,
      a: 0.35 + rand() * 0.6,
    });
  }
  return stars;
})();

// Water shimmer strokes, also fixed-seeded so both panels agree.
const SHIMMERS = (() => {
  const rand = seededRandom(23);
  const rows = [];
  for (let i = 0; i < 26; i++) {
    rows.push({
      x: Math.floor(rand() * 560),
      y: 302 + Math.floor(rand() * 130),
      len: 14 + Math.floor(rand() * 42),
      a: 0.05 + rand() * 0.16,
    });
  }
  return rows;
})();

function drawSky(ctx, altered) {
  const grad = ctx.createLinearGradient(0, 0, 0, HORIZON);
  grad.addColorStop(0, '#241b4d');
  grad.addColorStop(0.45, '#4a2760');
  grad.addColorStop(0.75, '#a34a63');
  grad.addColorStop(1, '#e88a4b');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, HORIZON);

  // Ambient stars.
  for (const s of AMBIENT_STARS) {
    ctx.globalAlpha = s.a;
    ctx.fillStyle = '#f5efe0';
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // The bright star difference: only the altered picture has it.
  if (altered.has('star')) {
    ctx.strokeStyle = '#ffe9a8';
    ctx.fillStyle = '#ffdf7e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(150, 88, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(150, 74); ctx.lineTo(150, 102);
    ctx.moveTo(136, 88); ctx.lineTo(164, 88);
    ctx.stroke();
  }

  drawMoon(ctx, altered);
  drawGull(ctx, 215, 122, 1); // the gull that is always there
  if (!altered.has('gull')) drawGull(ctx, 308, 92, 0.8); // the difference gull
}

function drawMoon(ctx, altered) {
  const x = 508, y = 56, r = 21;
  ctx.fillStyle = '#f3ead2';
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  if (altered.has('moon')) {
    // Full moon on the right: a couple of soft craters.
    ctx.fillStyle = 'rgba(190,180,150,0.55)';
    ctx.beginPath(); ctx.arc(x - 6, y - 4, 5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + 7, y + 8, 4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + 9, y - 9, 3, 0, Math.PI * 2); ctx.fill();
  } else {
    // Crescent on the left: paint a shifted circle of sky back over the disc.
    // The bite is filled with the same sky gradient (canvas gradients live in
    // user space, so the colours line up exactly with the sky behind).
    const sky = ctx.createLinearGradient(0, 0, 0, HORIZON);
    sky.addColorStop(0, '#241b4d');
    sky.addColorStop(0.45, '#4a2760');
    sky.addColorStop(0.75, '#a34a63');
    sky.addColorStop(1, '#e88a4b');
    ctx.fillStyle = sky;
    ctx.beginPath();
    ctx.arc(x + 10, y - 5, r - 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawGull(ctx, x, y, scale) {
  ctx.strokeStyle = 'rgba(240,236,224,0.9)';
  ctx.lineWidth = 2.2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x - 11 * scale, y);
  ctx.quadraticCurveTo(x - 5 * scale, y - 7 * scale, x, y);
  ctx.quadraticCurveTo(x + 5 * scale, y - 7 * scale, x + 11 * scale, y);
  ctx.stroke();
}

function drawHills(ctx) {
  ctx.fillStyle = '#2a2148';
  ctx.beginPath();
  ctx.moveTo(0, HORIZON);
  ctx.lineTo(0, 268);
  ctx.quadraticCurveTo(90, 246, 190, 262);
  ctx.quadraticCurveTo(300, 276, 410, 258);
  ctx.quadraticCurveTo(510, 244, 600, 264);
  ctx.lineTo(600, HORIZON);
  ctx.closePath();
  ctx.fill();
}

function drawSea(ctx, altered) {
  const grad = ctx.createLinearGradient(0, HORIZON, 0, H);
  grad.addColorStop(0, '#1b4a5a');
  grad.addColorStop(1, '#0c2432');
  ctx.fillStyle = grad;
  ctx.fillRect(0, HORIZON, W, H - HORIZON);

  // The lighthouse lamp throws a shimmering path on the water while it is lit.
  if (!altered.has('lamp')) {
    ctx.fillStyle = 'rgba(255,205,100,0.10)';
    ctx.beginPath();
    ctx.moveTo(56, HORIZON);
    ctx.lineTo(78, HORIZON);
    ctx.lineTo(88, H);
    ctx.lineTo(46, H);
    ctx.closePath();
    ctx.fill();
  }
  // The boat and dock sit dark against the water: a soft mirrored smudge
  // under the hull keeps the lower half of the scene from reading as empty.
  ctx.fillStyle = 'rgba(10,16,26,0.35)';
  ctx.beginPath();
  ctx.ellipse(330, 402, 86, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(232,177,58,0.10)';
  ctx.beginPath();
  ctx.ellipse(330, 398, 60, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  // Moonlight path.
  ctx.fillStyle = 'rgba(240,234,210,0.07)';
  ctx.beginPath();
  ctx.moveTo(492, HORIZON);
  ctx.lineTo(524, HORIZON);
  ctx.lineTo(540, H);
  ctx.lineTo(476, H);
  ctx.closePath();
  ctx.fill();

  for (const s of SHIMMERS) {
    ctx.strokeStyle = `rgba(255,196,130,${s.a})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(s.x, s.y);
    ctx.lineTo(s.x + s.len, s.y);
    ctx.stroke();
  }
}

function drawLighthouse(ctx, altered) {
  // The rocky point the lighthouse stands on.
  ctx.fillStyle = '#191430';
  ctx.beginPath();
  ctx.moveTo(0, 348);
  ctx.lineTo(0, 300);
  ctx.quadraticCurveTo(40, 282, 84, 288);
  ctx.quadraticCurveTo(126, 294, 138, 316);
  ctx.quadraticCurveTo(120, 340, 84, 348);
  ctx.closePath();
  ctx.fill();

  // Tower: tapered, banded red and white. The half-width narrows from 16 at
  // the base (y=292) to 10 at the top (y=164), centred on x=66.
  const halfWidth = (y) => 10 + ((y - 164) / 128) * 6;
  const bands = [
    { y0: 252, y1: 292, c: '#c8433a' },
    { y0: 222, y1: 252, c: '#e8e0d0' },
    { y0: 192, y1: 222, c: '#c8433a' },
    { y0: 164, y1: 192, c: '#e8e0d0' },
  ];
  for (const b of bands) {
    ctx.fillStyle = b.c;
    ctx.beginPath();
    ctx.moveTo(66 - halfWidth(b.y0), b.y0);
    ctx.lineTo(66 + halfWidth(b.y0), b.y0);
    ctx.lineTo(66 + halfWidth(b.y1), b.y1);
    ctx.lineTo(66 - halfWidth(b.y1), b.y1);
    ctx.closePath();
    ctx.fill();
  }

  // Gallery and lamp room.
  ctx.fillStyle = '#241d3d';
  ctx.fillRect(46, 154, 40, 8);
  const lit = !altered.has('lamp');
  if (lit) {
    const glow = ctx.createRadialGradient(66, 145, 2, 66, 145, 34);
    glow.addColorStop(0, 'rgba(255,214,106,0.85)');
    glow.addColorStop(1, 'rgba(255,214,106,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(66, 145, 34, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = lit ? '#ffd76a' : '#3a3f4a';
  ctx.fillRect(56, 136, 20, 18);
  ctx.strokeStyle = '#241d3d';
  ctx.lineWidth = 2;
  ctx.strokeRect(56, 136, 20, 18);
  // Roof.
  ctx.fillStyle = '#241d3d';
  ctx.beginPath();
  ctx.moveTo(52, 136);
  ctx.lineTo(66, 120);
  ctx.lineTo(80, 136);
  ctx.closePath();
  ctx.fill();
}

function drawHouses(ctx, altered) {
  const houses = [
    { x: 205, w: 70, body: '#4a3049', windows: [[222, 262, true], [252, 262, !altered.has('window')]] },
    { x: 295, w: 80, body: '#54364a', windows: [[312, 266, true], [352, 266, true]] },
    { x: 400, w: 70, body: '#46304e', windows: [[420, 264, true], [448, 264, false]] },
  ];
  for (const hse of houses) {
    ctx.fillStyle = hse.body;
    ctx.fillRect(hse.x, 240, hse.w, 52);
    // Roof.
    ctx.fillStyle = '#241a33';
    ctx.beginPath();
    ctx.moveTo(hse.x - 6, 242);
    ctx.lineTo(hse.x + hse.w / 2, 214);
    ctx.lineTo(hse.x + hse.w + 6, 242);
    ctx.closePath();
    ctx.fill();
    // Chimney.
    ctx.fillStyle = '#33222f';
    ctx.fillRect(hse.x + hse.w - 20, 218, 9, 16);
    // Windows.
    for (const [wx, wy, lit] of hse.windows) {
      ctx.fillStyle = lit ? '#ffca7a' : '#241d33';
      ctx.fillRect(wx, wy, 11, 13);
      ctx.strokeStyle = 'rgba(20,14,30,0.8)';
      ctx.lineWidth = 1;
      ctx.strokeRect(wx, wy, 11, 13);
    }
  }
  // A curl of chimney smoke from the middle cottage.
  ctx.strokeStyle = 'rgba(230,225,215,0.35)';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(360, 214);
  ctx.quadraticCurveTo(368, 200, 360, 188);
  ctx.quadraticCurveTo(353, 177, 361, 164);
  ctx.stroke();
}

function drawDock(ctx) {
  // Posts first (they stand in the water), then the deck over them.
  ctx.fillStyle = '#4a3420';
  for (const px of [150, 240, 330, 420, 510, 580]) {
    ctx.fillRect(px, 330, 9, 44);
  }
  ctx.fillStyle = '#6b4a2f';
  ctx.fillRect(110, 318, 490, 14);
  ctx.strokeStyle = 'rgba(40,24,12,0.55)';
  ctx.lineWidth = 1;
  for (let x = 134; x < 600; x += 24) {
    ctx.beginPath();
    ctx.moveTo(x, 319);
    ctx.lineTo(x, 331);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.fillRect(110, 329, 490, 3);
}

function drawCratesAndCat(ctx, altered) {
  // A stack of crates on the dock, left side.
  ctx.fillStyle = '#7d5a33';
  ctx.fillRect(118, 292, 34, 26);
  ctx.fillRect(154, 292, 30, 26);
  ctx.fillRect(128, 266, 32, 26);
  ctx.strokeStyle = 'rgba(43,28,12,0.7)';
  ctx.lineWidth = 1.5;
  for (const [x, y, w, h] of [[118, 292, 34, 26], [154, 292, 30, 26], [128, 266, 32, 26]]) {
    ctx.strokeRect(x, y, w, h);
    ctx.beginPath();
    ctx.moveTo(x, y); ctx.lineTo(x + w, y + h);
    ctx.moveTo(x + w, y); ctx.lineTo(x, y + h);
    ctx.stroke();
  }
  // The harbour cat, asleep on the top crate — unless the difference took it.
  if (!altered.has('cat')) {
    ctx.fillStyle = '#2e2a38';
    ctx.beginPath();
    ctx.ellipse(145, 260, 13, 6.5, 0, 0, Math.PI * 2); // curled body
    ctx.fill();
    ctx.beginPath();
    ctx.arc(156, 255, 5.5, 0, Math.PI * 2); // head
    ctx.fill();
    ctx.beginPath(); // ears
    ctx.moveTo(152, 251); ctx.lineTo(153.5, 246); ctx.lineTo(156, 250);
    ctx.moveTo(157, 250); ctx.lineTo(160, 246); ctx.lineTo(161, 251);
    ctx.fill();
    ctx.strokeStyle = '#2e2a38'; // tail curling round the body
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(138, 262, 6, Math.PI * 0.4, Math.PI * 1.5);
    ctx.stroke();
  }
}

function drawBarrels(ctx, altered) {
  const drawBarrel = (x) => {
    ctx.fillStyle = '#5d4128';
    ctx.beginPath();
    ctx.ellipse(x + 11, 290, 11, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(x, 290, 22, 28);
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(x, 298, 22, 3);
    ctx.fillRect(x, 308, 22, 3);
  };
  drawBarrel(505); // the barrel that never moves
  drawBarrel(altered.has('barrel') ? 448 : 418); // the loose barrel
}

function drawFisherman(ctx, altered) {
  // Standing on the dock at x ~178, rod out over the water.
  ctx.strokeStyle = '#1f2c38';
  ctx.lineWidth = 3;
  ctx.beginPath(); // fishing rod
  ctx.moveTo(186, 288);
  ctx.lineTo(238, 322);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(230,230,220,0.5)';
  ctx.lineWidth = 1;
  ctx.beginPath(); // line down to the water
  ctx.moveTo(238, 322);
  ctx.lineTo(244, 356);
  ctx.stroke();

  ctx.fillStyle = '#41748f'; // coat — light enough to read against the dusk
  ctx.fillRect(172, 284, 13, 24);
  ctx.fillStyle = '#22303c'; // legs
  ctx.fillRect(173, 308, 5, 12);
  ctx.fillRect(180, 308, 5, 12);
  ctx.fillStyle = '#e0aa6e'; // head
  ctx.beginPath();
  ctx.arc(178, 276, 6.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#6e4525'; // hat
  ctx.fillRect(168, 271, 20, 3.5);
  ctx.fillRect(173, 265, 10, 6);

  // The lantern hangs from his free hand — unless the difference took it.
  if (!altered.has('lantern')) {
    ctx.strokeStyle = '#1f2c38';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(186, 292);
    ctx.lineTo(201, 288);
    ctx.stroke();
    const glow = ctx.createRadialGradient(203, 298, 1, 203, 298, 15);
    glow.addColorStop(0, 'rgba(255,205,100,0.8)');
    glow.addColorStop(1, 'rgba(255,205,100,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(203, 298, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffca7a';
    ctx.fillRect(199, 292, 8, 11);
    ctx.strokeStyle = '#241d3d';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(199, 292, 8, 11);
  }
}

function drawBoat(ctx, altered) {
  // The fishing boat, moored in front of the dock.
  ctx.fillStyle = '#7a3b2e';
  ctx.beginPath();
  ctx.moveTo(252, 350);
  ctx.lineTo(408, 350);
  ctx.lineTo(392, 384);
  ctx.quadraticCurveTo(330, 396, 268, 384);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#e0b56a';
  ctx.fillRect(252, 346, 156, 5);
  ctx.fillStyle = '#5d2d22'; // little cabin
  ctx.fillRect(268, 326, 34, 22);
  ctx.fillStyle = '#ffca7a';
  ctx.fillRect(278, 332, 10, 9);

  // Mast and sail.
  ctx.strokeStyle = '#3a2a18';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(330, 348);
  ctx.lineTo(330, 198);
  ctx.stroke();
  ctx.fillStyle = altered.has('sail') ? '#2f7f8f' : '#b8452f';
  ctx.beginPath();
  ctx.moveTo(336, 208);
  ctx.lineTo(336, 332);
  ctx.lineTo(400, 332);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.16)'; // a patch of light on the sail
  ctx.beginPath();
  ctx.moveTo(336, 250);
  ctx.lineTo(336, 332);
  ctx.lineTo(362, 332);
  ctx.closePath();
  ctx.fill();

  // The mast flag — unless the difference took it.
  if (!altered.has('flag')) {
    ctx.fillStyle = '#e8b13a';
    ctx.beginPath();
    ctx.moveTo(330, 198);
    ctx.lineTo(358, 204);
    ctx.lineTo(330, 212);
    ctx.closePath();
    ctx.fill();
  }
}

function drawRowboat(ctx) {
  ctx.fillStyle = '#4f6152';
  ctx.beginPath();
  ctx.moveTo(468, 394);
  ctx.lineTo(566, 394);
  ctx.lineTo(552, 414);
  ctx.quadraticCurveTo(517, 422, 482, 414);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#3a2a18';
  ctx.lineWidth = 3;
  ctx.beginPath(); // a resting oar
  ctx.moveTo(492, 392);
  ctx.lineTo(468, 372);
  ctx.stroke();
}

export function drawScene(ctx, altered) {
  ctx.clearRect(0, 0, W, H);
  drawSky(ctx, altered);
  drawHills(ctx);
  drawSea(ctx, altered);
  drawLighthouse(ctx, altered);
  drawHouses(ctx, altered);
  drawDock(ctx);
  drawCratesAndCat(ctx, altered);
  drawBarrels(ctx, altered);
  drawFisherman(ctx, altered);
  drawBoat(ctx, altered);
  drawRowboat(ctx);
}
