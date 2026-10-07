// Sound effects: each recipe is rendered once in an OfflineAudioContext (mono, 30 kHz) at boot.
//   SFX[name] = { dur, gain?, max? (voices), th? (min seconds between plays), build(ctx, out) }
import * as V from './synth.js';
import { nm } from './music.js';

const g = (ctx, v = 1) => { const n = ctx.createGain(); n.gain.value = v; return n; };
const f = (ctx, type, fr, q = 0.7) => { const b = ctx.createBiquadFilter(); b.type = type; b.frequency.value = fr; b.Q.value = q; return b; };
function tone(ctx, out, type, f0, f1, t, dur, peak, decay) {
  const o = ctx.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(f0, t);
  if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + dur);
  const e = g(ctx, 0);
  e.gain.setValueAtTime(0, t);
  e.gain.linearRampToValueAtTime(peak, t + 0.004);
  e.gain.setTargetAtTime(0, t + 0.01, decay);
  o.connect(e).connect(out);
  o.start(t);
  o.stop(t + dur + decay * 5);
}
function noiseHit(ctx, out, t, type, fr, q, peak, decay, sweepTo) {
  const n = V.noise(ctx, t, decay * 6 + 0.1);
  const b = f(ctx, type, fr, q);
  if (sweepTo) b.frequency.exponentialRampToValueAtTime(sweepTo, t + decay * 3);
  const e = g(ctx, 0);
  e.gain.setValueAtTime(0, t);
  e.gain.linearRampToValueAtTime(peak, t + 0.005);
  e.gain.setTargetAtTime(0, t + 0.01, decay);
  n.connect(b).connect(e).connect(out);
}
function whoosh(ctx, out, t, dur, f0, f1, peak = 0.5) {
  const n = V.noise(ctx, t, dur + 0.1);
  const b = f(ctx, 'bandpass', f0, 1.2);
  b.frequency.setValueAtTime(f0, t);
  b.frequency.exponentialRampToValueAtTime(f1, t + dur);
  const e = g(ctx, 0);
  e.gain.setValueAtTime(0, t);
  e.gain.linearRampToValueAtTime(peak, t + dur * 0.5);
  e.gain.linearRampToValueAtTime(0, t + dur);
  n.connect(b).connect(e).connect(out);
}
const arp = (ctx, out, inst, notes, t0, step, vel = 0.7, dur = 0.3) => notes.forEach((n, i) => inst(ctx, out, t0 + i * step, dur, typeof n === 'string' ? nm(n) : n, vel));

export const SFX = {
  // ---------------------------------------------------------------- UI
  tap: { dur: 0.12, th: 0.03, build: (c, o) => tone(c, o, 'sine', 1300, 1700, 0, 0.04, 0.25, 0.02) },
  tab: { dur: 0.18, build: (c, o) => { tone(c, o, 'triangle', 700, 1050, 0, 0.06, 0.25, 0.03); tone(c, o, 'sine', 1400, 1400, 0.04, 0.05, 0.12, 0.03); } },
  back: { dur: 0.15, build: (c, o) => tone(c, o, 'sine', 900, 600, 0, 0.07, 0.22, 0.03) },
  open: { dur: 0.35, build: (c, o) => { whoosh(c, o, 0, 0.22, 600, 3000, 0.25); tone(c, o, 'sine', 1200, 1800, 0.08, 0.1, 0.12, 0.06); } },
  error: { dur: 0.3, build: (c, o) => { tone(c, o, 'square', 220, 180, 0, 0.12, 0.12, 0.05); tone(c, o, 'square', 165, 150, 0.1, 0.12, 0.1, 0.06); } },
  coin: { dur: 0.45, max: 4, th: 0.04, build: (c, o) => { tone(c, o, 'square', 1975, 1975, 0, 0.05, 0.08, 0.03); tone(c, o, 'square', 2637, 2637, 0.06, 0.2, 0.08, 0.08); } },
  buy: { dur: 0.6, build: (c, o) => { arp(c, o, V.bell, ['E6', 'G6', 'C7'], 0, 0.06, 0.6); tone(c, o, 'square', 2637, 2637, 0.15, 0.1, 0.05, 0.06); } },
  reward: { dur: 1.2, build: (c, o) => { arp(c, o, V.bell, ['C6', 'E6', 'G6', 'C7', 'E7'], 0, 0.07, 0.55); V.swell(c, o, 0, 0.35, 0.3); } },
  levelup: { dur: 1.3, build: (c, o) => { arp(c, o, V.horn, ['C5', 'E5', 'G5'], 0, 0.09, 0.8, 0.15); V.horn(c, o, 0.27, 0.6, nm('C6'), 0.9); arp(c, o, V.bell, ['G6', 'C7', 'E7'], 0.3, 0.06, 0.4); } },
  starup: { dur: 2, build: (c, o) => { V.swell(c, o, 0, 0.8, 0.5); arp(c, o, V.bell, ['C6', 'D6', 'E6', 'G6', 'A6', 'C7', 'D7', 'E7'], 0.2, 0.06, 0.5); for (const n of ['C4', 'G4', 'C5', 'E5']) V.choir(c, o, 0.7, 1, nm(n), 0.6); } },
  equip: { dur: 0.4, build: (c, o) => { noiseHit(c, o, 0, 'bandpass', 3500, 4, 0.5, 0.02); tone(c, o, 'triangle', 2200, 2100, 0, 0.2, 0.15, 0.08); } },
  heart: { dur: 0.5, build: (c, o) => { tone(c, o, 'sine', 600, 1200, 0, 0.12, 0.3, 0.06); tone(c, o, 'sine', 900, 1800, 0.08, 0.12, 0.2, 0.08); } },

  // ---------------------------------------------------------------- quiz
  correct: { dur: 0.6, build: (c, o) => { V.bell(c, o, 0, 0.3, nm('E6'), 0.6); V.bell(c, o, 0.08, 0.4, nm('B6'), 0.55); } },
  perfect: { dur: 0.9, build: (c, o) => { arp(c, o, V.bell, ['E6', 'G#6', 'B6', 'E7'], 0, 0.05, 0.6); noiseHit(c, o, 0.15, 'highpass', 8000, 0.5, 0.15, 0.15); } },
  wrong: { dur: 0.6, build: (c, o) => { tone(c, o, 'sawtooth', 240, 120, 0, 0.35, 0.18, 0.12); tone(c, o, 'square', 180, 90, 0.05, 0.35, 0.08, 0.12); } },
  fever: { dur: 1.6, build: (c, o) => { V.swell(c, o, 0, 0.6, 0.7); arp(c, o, V.supersaw, ['A4', 'C5', 'E5', 'A5', 'C6', 'E6'], 0.2, 0.06, 0.9, 0.12); V.crash(c, o, 0.6, 0.7); V.kick(c, o, 0.6, 1); } },

  // ---------------------------------------------------------------- battle
  battleStart: { dur: 1.6, build: (c, o) => { V.horn(c, o, 0, 0.25, nm('G4'), 0.9); V.horn(c, o, 0.28, 0.9, nm('C5'), 1); V.horn(c, o, 0.28, 0.9, nm('E5'), 0.7); V.timpani(c, o, 0.28, 1, 36); V.crash(c, o, 0.28, 0.6); } },
  slash: { dur: 0.3, max: 4, th: 0.04, build: (c, o) => { whoosh(c, o, 0, 0.14, 1200, 6000, 0.6); noiseHit(c, o, 0.1, 'highpass', 4000, 0.7, 0.25, 0.04); } },
  shoot: { dur: 0.35, max: 4, th: 0.04, build: (c, o) => { tone(c, o, 'sine', 1800, 500, 0, 0.18, 0.2, 0.06); whoosh(c, o, 0, 0.2, 2000, 800, 0.2); } },
  hit: { dur: 0.35, max: 5, th: 0.03, build: (c, o) => { V.kick(c, o, 0, 0.55); noiseHit(c, o, 0, 'bandpass', 1400, 0.8, 0.5, 0.04); } },
  crit: { dur: 0.6, max: 3, th: 0.05, build: (c, o) => { V.kick(c, o, 0, 0.9); noiseHit(c, o, 0, 'bandpass', 900, 0.6, 0.7, 0.07); tone(c, o, 'triangle', 2400, 2300, 0, 0.3, 0.15, 0.12); } },
  skill: { dur: 0.6, max: 3, th: 0.08, build: (c, o) => { whoosh(c, o, 0, 0.3, 500, 4000, 0.4); arp(c, o, V.bell, ['A5', 'E6'], 0.05, 0.06, 0.4); } },
  heal: { dur: 0.9, max: 2, th: 0.2, build: (c, o) => { arp(c, o, V.bell, ['C6', 'E6', 'G6', 'C7'], 0, 0.06, 0.35); V.swell(c, o, 0, 0.5, 0.25); } },
  death: { dur: 0.9, max: 2, build: (c, o) => { tone(c, o, 'sawtooth', 400, 60, 0, 0.6, 0.2, 0.2); whoosh(c, o, 0, 0.6, 3000, 300, 0.3); } },
  ultReady: { dur: 0.5, build: (c, o) => { arp(c, o, V.bell, ['G6', 'D7'], 0, 0.05, 0.5); } },
  ult: { dur: 1.3, build: (c, o) => { V.swell(c, o, 0, 0.7, 0.8); tone(c, o, 'sawtooth', 110, 440, 0, 0.7, 0.15, 0.3); for (const n of ['C4', 'G4', 'C5']) V.choir(c, o, 0.1, 0.8, nm(n), 0.5); } },
  ultHit: { dur: 1.6, build: (c, o) => { V.taiko(c, o, 0, 1); V.kick(c, o, 0, 1); noiseHit(c, o, 0, 'lowpass', 1800, 0.5, 0.9, 0.35, 200); V.crash(c, o, 0, 0.7); } },
  enemyUlt: { dur: 1.3, build: (c, o) => { V.horn(c, o, 0, 0.8, nm('C3'), 1); V.horn(c, o, 0, 0.8, nm('Gb3'), 0.9); V.taiko(c, o, 0, 1); V.swell(c, o, 0.1, 0.6, 0.5); } },
  alarm: { dur: 1.4, build: (c, o) => { for (let i = 0; i < 3; i++) { V.horn(c, o, i * 0.4, 0.3, nm('D4'), 0.9); V.horn(c, o, i * 0.4, 0.3, nm('Ab4'), 0.7); } } },
  break: { dur: 1.6, build: (c, o) => { for (let i = 0; i < 10; i++) tone(c, o, 'triangle', 2000 + Math.random() * 4000, 1500, i * 0.02, 0.2, 0.08, 0.1); V.taiko(c, o, 0, 1); V.crash(c, o, 0, 1); arp(c, o, V.bell, ['C6', 'G6', 'C7'], 0.1, 0.05, 0.5); } },
  bossBlast: { dur: 2.2, build: (c, o) => { V.kick(c, o, 0, 1); V.taiko(c, o, 0.02, 1); noiseHit(c, o, 0, 'lowpass', 3000, 0.4, 1, 0.6, 120); tone(c, o, 'sine', 60, 30, 0, 1.2, 0.8, 0.5); } },
  victory: { dur: 0.1, build: () => {} },
  defeat: { dur: 0.1, build: () => {} },

  // ---------------------------------------------------------------- blacksmith
  anvil: { dur: 0.7, max: 3, th: 0.05, build: (c, o) => { for (const [fr, a] of [[1830, 0.25], [2750, 0.18], [4100, 0.12], [5600, 0.08]]) tone(c, o, 'sine', fr, fr * 0.995, 0, 0.6, a, 0.18); noiseHit(c, o, 0, 'bandpass', 3000, 1, 0.6, 0.015); } },
  enhanceOk: { dur: 1.4, build: (c, o) => { arp(c, o, V.bell, ['C6', 'E6', 'G6', 'C7', 'E7', 'G7'], 0, 0.06, 0.55); V.horn(c, o, 0.3, 0.6, nm('C5'), 0.6); V.crash(c, o, 0.05, 0.4); } },
  enhanceFail: { dur: 1, build: (c, o) => { tone(c, o, 'sawtooth', 300, 80, 0, 0.5, 0.2, 0.2); noiseHit(c, o, 0.05, 'lowpass', 800, 0.5, 0.5, 0.25); } },

  // ---------------------------------------------------------------- summon
  summonCharge: { dur: 1.2, build: (c, o) => { V.swell(c, o, 0, 1.0, 0.6); tone(c, o, 'sine', 110, 440, 0, 1.1, 0.25, 0.4); } },
  summonDrop: { dur: 1, build: (c, o) => { whoosh(c, o, 0, 0.6, 4000, 400, 0.5); V.timpani(c, o, 0.6, 0.8, 38); } },
  summonUpgrade: { dur: 1.2, build: (c, o) => { arp(c, o, V.bell, ['C6', 'G6', 'C7', 'G7'], 0, 0.04, 0.6); V.swell(c, o, 0, 0.3, 0.4); noiseHit(c, o, 0.3, 'highpass', 6000, 0.5, 0.3, 0.2); } },
  summonBurst: { dur: 2, build: (c, o) => { V.kick(c, o, 0, 1); V.crash(c, o, 0, 1); for (const n of ['C4', 'G4', 'C5', 'E5', 'G5']) V.choir(c, o, 0, 1.2, nm(n), 0.7); arp(c, o, V.bell, ['C7', 'E7', 'G7', 'C8'], 0.1, 0.05, 0.4); } },
  cardFlip: { dur: 0.25, max: 4, th: 0.03, build: (c, o) => { whoosh(c, o, 0, 0.1, 2500, 6000, 0.3); tone(c, o, 'sine', 900, 1300, 0.05, 0.05, 0.1, 0.03); } },
  sr: { dur: 1, build: (c, o) => { arp(c, o, V.bell, ['E6', 'G#6', 'B6', 'E7'], 0, 0.05, 0.6); } },
  ssr: { dur: 2.2, build: (c, o) => { V.crash(c, o, 0, 0.8); for (const n of ['D4', 'A4', 'D5', 'F#5', 'A5']) V.choir(c, o, 0, 1.6, nm(n), 0.75); arp(c, o, V.bell, ['D6', 'F#6', 'A6', 'D7', 'F#7', 'A7'], 0.05, 0.06, 0.55); V.timpani(c, o, 0, 1, 38); } },
  ssrShow: { dur: 2.5, build: (c, o) => { for (const n of ['G3', 'D4', 'G4', 'B4', 'D5']) V.strings(c, o, 0, 2, nm(n), 0.8); for (const n of ['G5', 'B5', 'D6']) V.choir(c, o, 0.1, 2, nm(n), 0.6); V.crash(c, o, 0, 0.6); } },
};

export const SFX_SR = 30000;
const OAC = typeof window !== 'undefined' ? (window.OfflineAudioContext || window.webkitOfflineAudioContext) : null;

export async function renderSfx(name) {
  const def = SFX[name];
  const len = Math.max(1, Math.ceil((def.dur + 0.15) * SFX_SR));
  const ctx = new OAC(1, len, SFX_SR);
  const out = ctx.createGain();
  out.gain.value = def.gain ?? 1;
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -10; comp.ratio.value = 4;
  out.connect(comp).connect(ctx.destination);
  def.build(ctx, out);
  const buf = await ctx.startRendering();
  return buf.getChannelData(0).slice();
}
