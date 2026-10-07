// Synth voices for offline rendering (OfflineAudioContext). Every instrument schedules its own nodes:
//   inst(ctx, out, t, dur, midi, vel)    drums: drum(ctx, out, t, vel)
// No samples anywhere: strings, brass, choir, flute, harp, bells, e-piano, supersaw, plucks, organ,
// bass, and an orchestral / electronic drum kit.

export const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

const noiseCache = new WeakMap();
export function noiseBuf(ctx) {
  let b = noiseCache.get(ctx);
  if (b) return b;
  const len = Math.floor(ctx.sampleRate * 2);
  b = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = b.getChannelData(0);
  let s = 1234567;
  for (let i = 0; i < len; i++) { s = (s * 1103515245 + 12345) & 0x7fffffff; d[i] = (s / 0x3fffffff) - 1; }
  noiseCache.set(ctx, b);
  return b;
}

export function noise(ctx, t, dur) {
  const n = ctx.createBufferSource();
  n.buffer = noiseBuf(ctx);
  n.start(t, Math.random() * 1.5);
  n.stop(t + dur + 0.05);
  return n;
}

function osc(ctx, type, f, t, stop, detune = 0) {
  const o = ctx.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(f, t);
  if (detune) o.detune.setValueAtTime(detune, t);
  o.start(t);
  o.stop(stop);
  return o;
}

function gain(ctx, v = 0) { const g = ctx.createGain(); g.gain.value = v; return g; }
function filt(ctx, type, f, q = 0.7) { const b = ctx.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q; return b; }

/** ADSR on a gain param; returns the time the voice is silent. */
function adsr(p, t, dur, a, d, s, r, peak = 1) {
  p.setValueAtTime(0, t);
  p.linearRampToValueAtTime(peak, t + a);
  p.setTargetAtTime(peak * s, t + a, Math.max(0.001, d / 3));
  const rel = t + Math.max(dur, a + 0.01);
  p.setTargetAtTime(0, rel, Math.max(0.001, r / 3));
  return rel + r * 1.6;
}

function vibrato(ctx, targets, t, rate, cents, delay = 0.25) {
  const l = ctx.createOscillator();
  l.frequency.value = rate;
  const g = gain(ctx, 0);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(cents, t + delay + 0.3);
  l.connect(g);
  for (const o of targets) g.connect(o.detune);
  l.start(t);
  return l;
}

// ------------------------------------------------------------------ melodic instruments

export function strings(ctx, out, t, dur, m, vel = 0.6) {
  const f = mtof(m);
  const g = gain(ctx);
  const end = adsr(g.gain, t, dur, 0.22, 0.4, 0.85, 0.7, 0.16 * vel);
  const lp = filt(ctx, 'lowpass', Math.min(6000, 1400 + f * 2.2), 0.4);
  const os = [-9, 0, 8].map((d) => osc(ctx, 'sawtooth', f, t, end, d));
  os.forEach((o) => o.connect(lp));
  const v = vibrato(ctx, os, t, 5.2, 7, 0.35);
  v.stop(end);
  lp.connect(g).connect(out);
}

export function pizz(ctx, out, t, dur, m, vel = 0.6) {
  const f = mtof(m);
  const g = gain(ctx);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(0.32 * vel, t + 0.004);
  g.gain.setTargetAtTime(0, t + 0.01, 0.18);
  const end = t + 1.2;
  const a = osc(ctx, 'triangle', f, t, end);
  const b = osc(ctx, 'sine', f * 2, t, end);
  const bg = gain(ctx, 0.25);
  b.connect(bg);
  const lp = filt(ctx, 'lowpass', 3200, 0.5);
  a.connect(lp); bg.connect(lp);
  lp.connect(g).connect(out);
}

export const harp = (ctx, out, t, dur, m, vel = 0.6) => pizz(ctx, out, t, dur, m, vel * 0.9);

export function flute(ctx, out, t, dur, m, vel = 0.6) {
  const f = mtof(m);
  const g = gain(ctx);
  const end = adsr(g.gain, t, dur, 0.06, 0.2, 0.85, 0.16, 0.3 * vel);
  const a = osc(ctx, 'sine', f, t, end);
  const b = osc(ctx, 'triangle', f * 2, t, end);
  const bg = gain(ctx, 0.07);
  b.connect(bg);
  const v = vibrato(ctx, [a, b], t, 5.6, 9, 0.28);
  v.stop(end);
  a.connect(g); bg.connect(g);
  // breath
  const n = noise(ctx, t, 0.12);
  const bp = filt(ctx, 'bandpass', f * 1.5, 1.5);
  const ng = gain(ctx);
  ng.gain.setValueAtTime(0.06 * vel, t);
  ng.gain.setTargetAtTime(0, t + 0.02, 0.04);
  n.connect(bp).connect(ng).connect(out);
  g.connect(out);
}

export function horn(ctx, out, t, dur, m, vel = 0.6) {
  const f = mtof(m);
  const g = gain(ctx);
  const end = adsr(g.gain, t, dur, 0.07, 0.3, 0.8, 0.25, 0.14 * vel);
  const lp = filt(ctx, 'lowpass', 500, 1.2);
  lp.frequency.setValueAtTime(400, t);
  lp.frequency.linearRampToValueAtTime(Math.min(5000, f * 4.5), t + 0.08);
  lp.frequency.setTargetAtTime(Math.min(3000, f * 2.8), t + 0.1, 0.25);
  const os = [-5, 4].map((d) => osc(ctx, 'sawtooth', f, t, end, d));
  os.forEach((o) => o.connect(lp));
  const v = vibrato(ctx, os, t, 5, 5, 0.4);
  v.stop(end);
  lp.connect(g).connect(out);
}

export function choir(ctx, out, t, dur, m, vel = 0.6) {
  const f = mtof(m);
  const g = gain(ctx);
  const end = adsr(g.gain, t, dur, 0.35, 0.5, 0.9, 0.9, 0.22 * vel);
  const sum = gain(ctx, 1);
  const os = [-11, -3, 6, 12].map((d) => osc(ctx, 'sawtooth', f, t, end, d));
  os.forEach((o) => o.connect(sum));
  const v = vibrato(ctx, os, t, 4.8, 10, 0.4);
  v.stop(end);
  const f1 = filt(ctx, 'bandpass', 720, 5), f2 = filt(ctx, 'bandpass', 1180, 6), f3 = filt(ctx, 'bandpass', 2600, 7);
  const g1 = gain(ctx, 1), g2 = gain(ctx, 0.6), g3 = gain(ctx, 0.18);
  sum.connect(f1).connect(g1).connect(g);
  sum.connect(f2).connect(g2).connect(g);
  sum.connect(f3).connect(g3).connect(g);
  g.connect(out);
}

export function bell(ctx, out, t, dur, m, vel = 0.6) {
  const f = mtof(m);
  const end = t + 2.6;
  const car = osc(ctx, 'sine', f, t, end);
  const mod = osc(ctx, 'sine', f * 3.5, t, end);
  const idx = gain(ctx);
  idx.gain.setValueAtTime(f * 2.2, t);
  idx.gain.setTargetAtTime(f * 0.1, t, 0.4);
  mod.connect(idx).connect(car.frequency);
  const g = gain(ctx);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(0.22 * vel, t + 0.005);
  g.gain.setTargetAtTime(0, t + 0.01, 0.6);
  car.connect(g).connect(out);
}

export function epiano(ctx, out, t, dur, m, vel = 0.6) {
  const f = mtof(m);
  const end = t + Math.max(dur, 0.2) + 1.6;
  const car = osc(ctx, 'sine', f, t, end);
  const mod = osc(ctx, 'sine', f, t, end);
  const idx = gain(ctx);
  idx.gain.setValueAtTime(f * 1.4 * vel, t);
  idx.gain.setTargetAtTime(f * 0.15, t, 0.25);
  mod.connect(idx).connect(car.frequency);
  const g = gain(ctx);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(0.2 * vel, t + 0.004);
  g.gain.setTargetAtTime(0.09 * vel, t + 0.01, 0.4);
  g.gain.setTargetAtTime(0, t + Math.max(dur, 0.2), 0.3);
  const trem = osc(ctx, 'sine', 4.2, t, end);
  const tg = gain(ctx, 0.25);
  const tremAmp = gain(ctx, 0.75);
  trem.connect(tg).connect(tremAmp.gain);
  car.connect(g).connect(tremAmp).connect(out);
}

export function supersaw(ctx, out, t, dur, m, vel = 0.6) {
  const f = mtof(m);
  const g = gain(ctx);
  const end = adsr(g.gain, t, dur, 0.01, 0.25, 0.75, 0.18, 0.07 * vel);
  const hp = filt(ctx, 'highpass', 180, 0.5);
  const lp = filt(ctx, 'lowpass', 7000, 0.6);
  lp.frequency.setValueAtTime(9000, t);
  lp.frequency.setTargetAtTime(4500, t + 0.02, 0.2);
  for (const d of [-28, -17, -7, 0, 7, 17, 28]) osc(ctx, 'sawtooth', f, t, end, d).connect(hp);
  hp.connect(lp).connect(g).connect(out);
}

export function pluck(ctx, out, t, dur, m, vel = 0.6) {
  const f = mtof(m);
  const g = gain(ctx);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(0.14 * vel, t + 0.003);
  g.gain.setTargetAtTime(0, t + 0.01, 0.09);
  const lp = filt(ctx, 'lowpass', 5000, 3);
  lp.frequency.setValueAtTime(5200, t);
  lp.frequency.setTargetAtTime(500, t, 0.06);
  const end = t + 0.6;
  osc(ctx, 'sawtooth', f, t, end, -6).connect(lp);
  osc(ctx, 'square', f, t, end, 6).connect(lp);
  lp.connect(g).connect(out);
}

export function pad(ctx, out, t, dur, m, vel = 0.6) {
  const f = mtof(m);
  const g = gain(ctx);
  const end = adsr(g.gain, t, dur, 0.5, 0.8, 0.9, 1.0, 0.08 * vel);
  const lp = filt(ctx, 'lowpass', 1400, 0.6);
  const l = osc(ctx, 'sine', 0.25, t, end);
  const lg = gain(ctx, 500);
  l.connect(lg).connect(lp.frequency);
  osc(ctx, 'sawtooth', f, t, end, -10).connect(lp);
  osc(ctx, 'sawtooth', f, t, end, 10).connect(lp);
  osc(ctx, 'triangle', f / 2, t, end).connect(lp);
  lp.connect(g).connect(out);
}

export function organ(ctx, out, t, dur, m, vel = 0.6) {
  const f = mtof(m);
  const g = gain(ctx);
  const end = adsr(g.gain, t, dur, 0.08, 0.2, 1, 0.5, 0.06 * vel);
  for (const [h, a] of [[1, 1], [2, 0.6], [3, 0.35], [4, 0.25], [6, 0.12]]) {
    const o = osc(ctx, 'sine', f * h, t, end);
    const og = gain(ctx, a);
    o.connect(og).connect(g);
  }
  g.connect(out);
}

export function bass(ctx, out, t, dur, m, vel = 0.6) {
  const f = mtof(m);
  const g = gain(ctx);
  const end = adsr(g.gain, t, dur, 0.008, 0.25, 0.75, 0.1, 0.26 * vel);
  const lp = filt(ctx, 'lowpass', 600, 1.2);
  lp.frequency.setValueAtTime(1500, t);
  lp.frequency.setTargetAtTime(420, t, 0.08);
  osc(ctx, 'sawtooth', f, t, end).connect(lp);
  const sub = osc(ctx, 'sine', f, t, end);
  const sg = gain(ctx, 0.9);
  sub.connect(sg).connect(g);
  lp.connect(g).connect(out);
}

/** Electronic bass that ducks on every beat (sidechain feel baked in). */
export function pumpBass(ctx, out, t, dur, m, vel = 0.6) {
  const f = mtof(m);
  const g = gain(ctx);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(0.24 * vel, t + 0.05);
  g.gain.setTargetAtTime(0, t + dur * 0.85, 0.03);
  const lp = filt(ctx, 'lowpass', 900, 2);
  const end = t + dur + 0.2;
  osc(ctx, 'sawtooth', f, t, end, -8).connect(lp);
  osc(ctx, 'sawtooth', f, t, end, 8).connect(lp);
  osc(ctx, 'sine', f / 2, t, end).connect(g);
  lp.connect(g).connect(out);
}

// ------------------------------------------------------------------ drums

export function kick(ctx, out, t, vel = 1) {
  const o = osc(ctx, 'sine', 150, t, t + 0.5);
  o.frequency.setValueAtTime(160, t);
  o.frequency.exponentialRampToValueAtTime(42, t + 0.13);
  const g = gain(ctx);
  g.gain.setValueAtTime(0.95 * vel, t);
  g.gain.setTargetAtTime(0, t + 0.02, 0.11);
  o.connect(g).connect(out);
  const n = noise(ctx, t, 0.02);
  const hp = filt(ctx, 'highpass', 3000);
  const ng = gain(ctx);
  ng.gain.setValueAtTime(0.25 * vel, t);
  ng.gain.setTargetAtTime(0, t, 0.004);
  n.connect(hp).connect(ng).connect(out);
}

export function snare(ctx, out, t, vel = 1) {
  const n = noise(ctx, t, 0.3);
  const bp = filt(ctx, 'bandpass', 2000, 0.7);
  const g = gain(ctx);
  g.gain.setValueAtTime(0.45 * vel, t);
  g.gain.setTargetAtTime(0, t + 0.01, 0.06);
  n.connect(bp).connect(g).connect(out);
  const o = osc(ctx, 'triangle', 190, t, t + 0.2);
  o.frequency.exponentialRampToValueAtTime(150, t + 0.08);
  const og = gain(ctx);
  og.gain.setValueAtTime(0.4 * vel, t);
  og.gain.setTargetAtTime(0, t, 0.035);
  o.connect(og).connect(out);
}

export function clap(ctx, out, t, vel = 1) {
  for (let i = 0; i < 3; i++) {
    const tt = t + i * 0.011;
    const n = noise(ctx, tt, 0.25);
    const bp = filt(ctx, 'bandpass', 1300, 1.2);
    const g = gain(ctx);
    g.gain.setValueAtTime(0.4 * vel, tt);
    g.gain.setTargetAtTime(0, tt, i === 2 ? 0.07 : 0.008);
    n.connect(bp).connect(g).connect(out);
  }
}

export function hat(ctx, out, t, vel = 1, open = false) {
  const n = noise(ctx, t, open ? 0.5 : 0.1);
  const hp = filt(ctx, 'highpass', 7500, 0.6);
  const g = gain(ctx);
  g.gain.setValueAtTime(0.16 * vel, t);
  g.gain.setTargetAtTime(0, t, open ? 0.09 : 0.018);
  n.connect(hp).connect(g).connect(out);
}

export function shaker(ctx, out, t, vel = 1) {
  const n = noise(ctx, t, 0.12);
  const bp = filt(ctx, 'bandpass', 6500, 1.5);
  const g = gain(ctx);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(0.1 * vel, t + 0.02);
  g.gain.setTargetAtTime(0, t + 0.03, 0.025);
  n.connect(bp).connect(g).connect(out);
}

export function crash(ctx, out, t, vel = 1) {
  const n = noise(ctx, t, 2.5);
  const hp = filt(ctx, 'highpass', 4500, 0.5);
  const g = gain(ctx);
  g.gain.setValueAtTime(0.28 * vel, t);
  g.gain.setTargetAtTime(0, t + 0.02, 0.55);
  n.connect(hp).connect(g).connect(out);
}

export function swell(ctx, out, t, dur = 1.5, vel = 1) {
  const n = noise(ctx, t, dur + 0.2);
  const hp = filt(ctx, 'highpass', 3000, 0.5);
  const g = gain(ctx);
  g.gain.setValueAtTime(0.001, t);
  g.gain.exponentialRampToValueAtTime(0.22 * vel, t + dur);
  g.gain.setTargetAtTime(0, t + dur, 0.03);
  n.connect(hp).connect(g).connect(out);
}

export function taiko(ctx, out, t, vel = 1) {
  const o = osc(ctx, 'sine', 95, t, t + 1.2);
  o.frequency.setValueAtTime(110, t);
  o.frequency.exponentialRampToValueAtTime(52, t + 0.3);
  const g = gain(ctx);
  g.gain.setValueAtTime(0.9 * vel, t);
  g.gain.setTargetAtTime(0, t + 0.02, 0.22);
  o.connect(g).connect(out);
  const n = noise(ctx, t, 0.2);
  const bp = filt(ctx, 'bandpass', 500, 1);
  const ng = gain(ctx);
  ng.gain.setValueAtTime(0.5 * vel, t);
  ng.gain.setTargetAtTime(0, t, 0.03);
  n.connect(bp).connect(ng).connect(out);
}

export function timpani(ctx, out, t, vel = 1, m = 38) {
  const f = mtof(m);
  const o = osc(ctx, 'sine', f, t, t + 2);
  o.frequency.setValueAtTime(f * 1.04, t);
  o.frequency.exponentialRampToValueAtTime(f, t + 0.15);
  const o2 = osc(ctx, 'sine', f * 1.5, t, t + 2);
  const g = gain(ctx);
  g.gain.setValueAtTime(0.7 * vel, t);
  g.gain.setTargetAtTime(0, t + 0.03, 0.45);
  const g2 = gain(ctx, 0.25);
  o.connect(g); o2.connect(g2).connect(g);
  g.connect(out);
  const n = noise(ctx, t, 0.1);
  const lp = filt(ctx, 'lowpass', 900);
  const ng = gain(ctx);
  ng.gain.setValueAtTime(0.3 * vel, t);
  ng.gain.setTargetAtTime(0, t, 0.02);
  n.connect(lp).connect(ng).connect(out);
}

export function tom(ctx, out, t, vel = 1, f0 = 180) {
  const o = osc(ctx, 'sine', f0, t, t + 0.6);
  o.frequency.exponentialRampToValueAtTime(f0 * 0.6, t + 0.25);
  const g = gain(ctx);
  g.gain.setValueAtTime(0.6 * vel, t);
  g.gain.setTargetAtTime(0, t + 0.02, 0.12);
  o.connect(g).connect(out);
}

export function rim(ctx, out, t, vel = 1) {
  const o = osc(ctx, 'square', 1700, t, t + 0.05);
  const bp = filt(ctx, 'bandpass', 1700, 3);
  const g = gain(ctx);
  g.gain.setValueAtTime(0.18 * vel, t);
  g.gain.setTargetAtTime(0, t, 0.012);
  o.connect(bp).connect(g).connect(out);
}

// ------------------------------------------------------------------ space

/** Stereo reverb impulse response (decaying noise with a darkening tail). */
export function makeIR(ctx, seconds = 1.8, decay = 3) {
  const sr = ctx.sampleRate;
  const len = Math.floor(sr * seconds);
  const b = ctx.createBuffer(2, len, sr);
  for (let c = 0; c < 2; c++) {
    const d = b.getChannelData(c);
    let s = 99 + c * 7;
    let lp = 0;
    for (let i = 0; i < len; i++) {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      const n = (s / 0x3fffffff) - 1;
      const k = i / len;
      lp += (n - lp) * (0.9 - k * 0.75);
      d[i] = lp * Math.pow(1 - k, decay) * (i < sr * 0.01 ? i / (sr * 0.01) : 1);
    }
  }
  return b;
}
