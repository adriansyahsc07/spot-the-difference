// sound.js — small WebAudio feedback, made in code (no audio files, so the
// game stays fully offline). A soft two-note chime for a find, a low thud for
// a miss, and a little rising arpeggio for the win. The context is created
// lazily on the first user gesture, as browsers require.

let ctx = null;

function audioContext() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq, startOffset, duration, type = 'sine', gainPeak = 0.12) {
  const ac = audioContext();
  if (!ac) return;
  const t0 = ac.currentTime + startOffset;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(gainPeak, t0 + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(gain).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.05);
}

export function playFind() {
  tone(880, 0, 0.18);
  tone(1318, 0.07, 0.26);
}

export function playMiss() {
  tone(150, 0, 0.16, 'triangle', 0.1);
}

export function playWin() {
  tone(660, 0, 0.2);
  tone(880, 0.1, 0.2);
  tone(1108, 0.2, 0.22);
  tone(1318, 0.3, 0.4);
}

export function playHint() {
  tone(1046, 0, 0.15, 'sine', 0.07);
}
