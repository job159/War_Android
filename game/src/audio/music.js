// Background music: four selectable styles, each written as two 8-bar sections (A, B) and rendered
// offline into three stems (bed = chords / bass / arps, drums, lead = melody) so the runtime can mix
// them by situation: lobby (bed + soft lead), battle (everything), fever / boss (lead and drums up).
import * as V from './synth.js';

const PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
export function nm(s) {
  const m = /^([A-G])(#|b)?(-?\d)$/.exec(s);
  if (!m) throw new Error('bad note ' + s);
  return 12 * (+m[3] + 1) + PC[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
}
/** 'A4:4 D5:4 r:8' -> [[step, midi, len]] in 16th steps */
export function mel(str) {
  const out = [];
  let pos = 0;
  for (const tok of str.trim().split(/\s+/)) {
    if (tok === '|') continue;
    const [n, l] = tok.split(':');
    const len = +l;
    if (n !== 'r') out.push([pos, nm(n), len]);
    pos += len;
  }
  return out;
}
const QUAL = { '': [0, 4, 7], m: [0, 3, 7], 7: [0, 4, 7, 10], maj7: [0, 4, 7, 11], m7: [0, 3, 7, 10], sus4: [0, 5, 7], sus2: [0, 2, 7], dim: [0, 3, 6], add9: [0, 4, 7, 14], m9: [0, 3, 7, 10, 14], maj9: [0, 4, 7, 11, 14], '7sus4': [0, 5, 7, 10] };
export function chord(sym) {
  const m = /^([A-G][#b]?)(.*)$/.exec(sym);
  const root = (PC[m[1][0]] + (m[1][1] === '#' ? 1 : m[1][1] === 'b' ? -1 : 0) + 12) % 12;
  return { root, iv: QUAL[m[2]] || QUAL[''] };
}
/** Chord tones voiced closest to the previous voicing inside [lo, hi]. */
function voicings(chords, lo = 55, hi = 76, n = 4) {
  let prev = null;
  return chords.map((c) => {
    const pcs = [...new Set(c.iv.map((i) => (c.root + i) % 12))];
    const cands = [];
    for (let m = lo; m <= hi; m++) if (pcs.includes(m % 12)) cands.push(m);
    let best = null, bs = Infinity;
    for (let s = 0; s + n <= cands.length; s++) {
      const v = cands.slice(s, s + n);
      let sc = prev ? v.reduce((a, x, i) => a + Math.abs(x - prev[i]), 0) : Math.abs(v[0] - 60);
      const covered = new Set(v.map((x) => x % 12));
      sc += (pcs.length - pcs.filter((p) => covered.has(p)).length) * 6;
      if (sc < bs) { bs = sc; best = v; }
    }
    prev = best || cands.slice(0, n);
    return prev;
  });
}
const bassNote = (pc, lo = 33) => { let m = lo; while (m % 12 !== pc) m++; return m; };

// ------------------------------------------------------------------ styles

export const STYLES = {
  adventure: {
    bpm: 116, reverb: [1.9, 3.2], tail: 2.5,
    A: { chords: 'D A Bm G D A G A', mel: 'A4:4 D5:4 F#5:4 A5:4 | G5:6 F#5:2 E5:8 | F#5:4 D5:4 B4:4 D5:4 | E5:8 r:4 D5:2 E5:2 | F#5:4 A5:4 D6:6 C#6:2 | B5:4 A5:4 G5:4 F#5:4 | E5:4 G5:4 B5:4 A5:4 | A5:12 r:4' },
    B: { chords: 'G A F#m Bm G A D D', mel: 'B5:6 A5:2 G5:4 D5:4 | C#6:6 B5:2 A5:8 | A5:4 F#5:4 C#5:4 F#5:4 | D6:8 B5:8 | B5:4 D6:4 G6:6 F#6:2 | E6:6 D6:2 C#6:4 A5:4 | D6:8 A5:4 F#5:4 | D6:12 r:4' },
    parts(add, sec, ch, vo, bar) {
      // strings sustain, harp arpeggios, walking bass; flute melody, horn answers
      vo.forEach((v, b) => {
        v.forEach((m) => add('bed', V.strings, bar(b), bar(1) * 0.98, m, 0.55));
        const arp = [v[0], v[1], v[2], v[0] + 12, v[1] + 12, v[2] + 12, v[0] + 12, v[2]];
        arp.forEach((m, i) => add('bed', V.harp, bar(b) + i * bar(1) / 8, 0.3, m, 0.5));
        const r = bassNote(ch[b].root);
        add('bed', V.bass, bar(b), bar(0.5) * 0.95, r, 0.8);
        add('bed', V.bass, bar(b + 0.5), bar(0.5) * 0.95, r + 7 > 47 ? r - 5 : r + 7, 0.7);
      });
      sec.melody.forEach(([s, m, l]) => add('lead', V.flute, bar(s / 16), (l / 16) * bar(1), m, 0.75));
      ch.forEach((c, b) => { if (b % 2 === 1) add('lead', V.horn, bar(b + 0.5), bar(0.5), bassNote(c.root, 55), 0.5); });
    },
    drums(add, bars, bar) {
      for (let b = 0; b < bars; b++) {
        add(V.timpani, bar(b), 0.7, 38);
        if (b % 2 === 1) add(V.timpani, bar(b + 0.75), 0.5, 45);
        add(V.snare, bar(b + 0.25), 0.35); add(V.snare, bar(b + 0.75), 0.4);
        for (let i = 0; i < 8; i++) add(V.shaker, bar(b + i / 8), i % 2 ? 0.5 : 0.8);
        if (b === bars - 1) for (let i = 0; i < 4; i++) add(V.tom, bar(b + 0.75 + i / 16), 0.6, 200 - i * 25);
      }
      add(V.crash, 0, 0.7);
    },
  },

  majestic: {
    bpm: 92, reverb: [2.8, 2.6], tail: 3.2,
    A: { chords: 'Cm Ab Eb Bb Cm Ab Fm G', mel: 'C5:8 Eb5:4 G5:4 | Ab5:8 G5:4 F5:4 | G5:12 Eb5:4 | F5:8 D5:8 | C5:4 Eb5:4 G5:4 C6:4 | Bb5:8 Ab5:4 G5:4 | Ab5:6 G5:2 F5:4 Eb5:4 | D5:8 B4:8' },
    B: { chords: 'Ab Bb Gm Cm Ab Bb G G', mel: 'Eb5:4 Ab5:4 C6:8 | D6:8 Bb5:4 F5:4 | G5:6 Bb5:2 D6:8 | C6:12 G5:4 | Ab5:4 C6:4 Eb6:8 | D6:6 C6:2 Bb5:4 D6:4 | B5:8 D6:4 F6:4 | G6:16' },
    parts(add, sec, ch, vo, bar) {
      vo.forEach((v, b) => {
        v.forEach((m) => add('bed', V.choir, bar(b), bar(1) * 0.98, m, 0.6));
        v.slice(0, 3).forEach((m) => add('bed', V.organ, bar(b), bar(1), m - 12, 0.5));
        const r = bassNote(ch[b].root, 31);
        add('bed', V.strings, bar(b), bar(1), r, 0.7);
        add('bed', V.strings, bar(b), bar(1), r + 12, 0.55);
      });
      sec.melody.forEach(([s, m, l]) => { add('lead', V.horn, bar(s / 16), (l / 16) * bar(1), m, 0.85); add('lead', V.horn, bar(s / 16), (l / 16) * bar(1), m - 12, 0.45); });
      ch.forEach((c, b) => { if (b % 2 === 0) for (let i = 0; i < 4; i++) add('lead', V.bell, bar(b + i / 4), 0.5, bassNote(c.root, 72) + [0, 7, 12, 7][i], 0.25); });
    },
    drums(add, bars, bar) {
      for (let b = 0; b < bars; b++) {
        add(V.taiko, bar(b), 1);
        add(V.taiko, bar(b + 0.375), 0.5);
        add(V.taiko, bar(b + 0.5), 0.85);
        add(V.taiko, bar(b + 0.75), 0.55);
        add(V.timpani, bar(b), 0.6, 36);
        add(V.snare, bar(b + 0.5), 0.3);
        if (b % 4 === 3) { for (let i = 0; i < 8; i++) add(V.snare, bar(b + 0.5 + i / 16), 0.15 + i * 0.05); add(V.swell, bar(b + 0.25), bar(0.75), 0.8); }
      }
      add(V.crash, 0, 0.8);
      add(V.crash, bar(4), 0.6);
    },
  },

  rush: {
    bpm: 140, reverb: [1.4, 3.6], tail: 2,
    A: { chords: 'Am F C G Am F C G', mel: 'A5:2 A5:2 E5:2 A5:2 C6:2 A5:2 E5:2 A5:2 | A5:2 A5:2 F5:2 A5:2 C6:2 A5:2 F5:2 A5:2 | G5:2 G5:2 E5:2 G5:2 C6:2 G5:2 E5:2 G5:2 | B5:2 B5:2 G5:2 B5:2 D6:2 B5:2 G5:2 B5:2 | A5:2 A5:2 E5:2 A5:2 C6:2 A5:2 E5:2 A5:2 | A5:2 A5:2 F5:2 A5:2 C6:2 A5:2 F5:2 A5:2 | G5:2 G5:2 E5:2 G5:2 C6:2 G5:2 E5:2 G5:2 | E6:4 D6:4 C6:4 B5:4' },
    B: { chords: 'F G Em Am F G Em Am', mel: 'C6:6 B5:2 A5:8 | B5:6 A5:2 G5:8 | E5:4 G5:4 B5:4 E6:4 | C6:12 B5:4 | A5:6 C6:2 F6:8 | G6:6 F6:2 D6:8 | E6:4 D6:4 B5:4 G5:4 | A5:16' },
    parts(add, sec, ch, vo, bar) {
      vo.forEach((v, b) => {
        // offbeat supersaw stabs + 16th pluck arp + pumping bass
        for (let i = 0; i < 4; i++) v.forEach((m) => add('bed', V.supersaw, bar(b + i / 4 + 1 / 8), bar(1 / 8) * 0.9, m, 0.6));
        for (let i = 0; i < 16; i++) add('bed', V.pluck, bar(b + i / 16), 0.12, [v[0], v[1], v[2], v[1]][i % 4] + 12, 0.55);
        const r = bassNote(ch[b].root, 33);
        for (let i = 0; i < 4; i++) add('bed', V.pumpBass, bar(b + i / 4), bar(1 / 4), r, 0.9);
      });
      sec.melody.forEach(([s, m, l]) => add('lead', V.supersaw, bar(s / 16), (l / 16) * bar(1), m, 1.0));
    },
    drums(add, bars, bar) {
      for (let b = 0; b < bars; b++) {
        for (let i = 0; i < 4; i++) add(V.kick, bar(b + i / 4), 1);
        add(V.clap, bar(b + 0.25), 0.8); add(V.clap, bar(b + 0.75), 0.8);
        for (let i = 0; i < 4; i++) add(V.hat, bar(b + i / 4 + 1 / 8), 0.9, true);
        for (let i = 0; i < 16; i++) add(V.hat, bar(b + i / 16), i % 2 ? 0.35 : 0.2);
        if (b === bars - 1) for (let i = 0; i < 8; i++) add(V.snare, bar(b + 0.5 + i / 16), 0.25 + i * 0.07);
      }
      add(V.crash, 0, 0.8);
    },
  },

  calm: {
    bpm: 78, reverb: [2.2, 3], tail: 3,
    A: { chords: 'Fmaj7 Em7 Dm7 C Bbmaj7 Am7 Gm7 C7sus4', mel: 'r:4 A5:4 G5:4 E5:4 | D5:8 r:8 | r:4 F5:4 E5:4 C5:4 | E5:12 r:4 | r:4 D5:4 F5:4 A5:4 | G5:8 E5:8 | r:4 F5:4 D5:4 Bb4:4 | C5:16' },
    B: { chords: 'Dm7 Gm7 Cmaj7 Fmaj7 Bbmaj7 Em7 Am7 C7sus4', mel: 'r:4 F5:4 A5:4 C6:4 | Bb5:8 G5:8 | r:4 E5:4 G5:4 B5:4 | A5:12 r:4 | r:4 D6:4 C6:4 A5:4 | G5:8 E5:8 | r:4 C5:4 E5:4 G5:4 | F5:16' },
    parts(add, sec, ch, vo, bar) {
      vo.forEach((v, b) => {
        v.forEach((m) => { add('bed', V.epiano, bar(b), bar(0.375), m, 0.55); add('bed', V.epiano, bar(b + 0.625), bar(0.3), m, 0.4); });
        v.forEach((m) => add('bed', V.pad, bar(b), bar(1), m - 12, 0.5));
        const r = bassNote(ch[b].root, 36);
        add('bed', V.bass, bar(b), bar(0.45), r, 0.55);
        add('bed', V.bass, bar(b + 0.625), bar(0.3), r + 7 > 52 ? r - 5 : r + 7, 0.4);
      });
      sec.melody.forEach(([s, m, l]) => add('lead', V.bell, bar(s / 16), (l / 16) * bar(1), m, 0.5));
    },
    drums(add, bars, bar) {
      for (let b = 0; b < bars; b++) {
        add(V.kick, bar(b), 0.5); add(V.kick, bar(b + 0.5625), 0.35);
        add(V.rim, bar(b + 0.25), 0.7); add(V.rim, bar(b + 0.75), 0.7);
        for (let i = 0; i < 8; i++) add(V.shaker, bar(b + i / 8 + (i % 2 ? 0.02 : 0)), i % 2 ? 0.4 : 0.7);
      }
    },
  },
};

// ------------------------------------------------------------------ offline render

const OAC = typeof window !== 'undefined' ? (window.OfflineAudioContext || window.webkitOfflineAudioContext) : null;
export const SR = 30000;

/** Renders one section of a style into { bed, drums, lead } Float32 stereo pairs. */
export async function renderSection(styleId, secId) {
  const S = STYLES[styleId];
  const sec = S[secId];
  const beat = 60 / S.bpm;
  const barDur = beat * 4;
  const bars = sec.chords.split(/\s+/).length;
  const dur = bars * barDur;
  const len = Math.ceil((dur + S.tail) * SR);
  const ctx = new OAC(6, len, SR);
  const merger = ctx.createChannelMerger(6);
  merger.connect(ctx.destination);
  const ir = V.makeIR(ctx, S.reverb[0], S.reverb[1]);
  const bus = (ch, wet, comp = true) => {
    const inp = ctx.createGain();
    const dry = ctx.createGain(); dry.gain.value = 1;
    const sp = ctx.createChannelSplitter(2);
    let tail = inp;
    if (comp) {
      const c = ctx.createDynamicsCompressor();
      c.threshold.value = -16; c.ratio.value = 3; c.attack.value = 0.01; c.release.value = 0.2;
      inp.connect(c);
      tail = c;
    }
    const mix = ctx.createGain();
    tail.connect(dry).connect(mix);
    if (wet > 0) {
      const cv = ctx.createConvolver();
      cv.normalize = true;
      cv.buffer = ir;
      const wg = ctx.createGain(); wg.gain.value = wet;
      tail.connect(cv).connect(wg).connect(mix);
    }
    mix.connect(sp);
    sp.connect(merger, 0, ch);
    sp.connect(merger, 1, ch + 1);
    return inp;
  };
  const buses = { bed: bus(0, styleId === 'rush' ? 0.25 : 0.45), drums: bus(2, styleId === 'majestic' ? 0.3 : 0.12), lead: bus(4, styleId === 'rush' ? 0.3 : 0.4) };
  const chords = sec.chords.split(/\s+/).map(chord);
  const vo = voicings(chords, styleId === 'rush' ? 57 : 55, styleId === 'rush' ? 76 : 74, styleId === 'calm' ? 4 : 3);
  const bar = (b) => b * barDur;
  const melody = mel(sec.mel);
  const add = (stem, inst, t, d, m, vel) => { try { inst(ctx, buses[stem], t, d, m, vel); } catch (e) { /* skip a bad note */ } };
  S.parts(add, { melody }, chords, vo, bar);
  S.drums((inst, t, vel, extra) => { try { inst(ctx, buses.drums, t, vel, extra); } catch (e) { /* ignore */ } }, bars, bar, beat);
  const buf = await ctx.startRendering();
  const pick = (c) => [buf.getChannelData(c).slice(), buf.getChannelData(c + 1).slice()];
  return { dur, barDur, bars, stems: { bed: pick(0), drums: pick(2), lead: pick(4) } };
}

// ------------------------------------------------------------------ stingers

export async function renderStinger(name) {
  const len = Math.ceil(4 * SR);
  const ctx = new OAC(2, len, SR);
  const out = ctx.createGain();
  const cv = ctx.createConvolver();
  cv.buffer = V.makeIR(ctx, 2.2, 3);
  const wet = ctx.createGain(); wet.gain.value = 0.4;
  out.connect(ctx.destination);
  out.connect(cv).connect(wet).connect(ctx.destination);
  if (name === 'victory') {
    const seq = [['C5', 0, 0.16], ['E5', 0.16, 0.16], ['G5', 0.32, 0.16], ['C6', 0.48, 1.6]];
    for (const [n, t, d] of seq) { V.horn(ctx, out, t, d, nm(n), 0.9); V.horn(ctx, out, t, d, nm(n) - 12, 0.5); }
    for (const n of ['C4', 'E4', 'G4', 'C5']) V.strings(ctx, out, 0.48, 1.8, nm(n), 0.7);
    V.timpani(ctx, out, 0.48, 1, 36); V.crash(ctx, out, 0.48, 0.8);
    for (let i = 0; i < 6; i++) V.bell(ctx, out, 0.6 + i * 0.09, 0.5, nm('C6') + [0, 4, 7, 12, 16, 19][i], 0.35);
  } else if (name === 'defeat') {
    const seq = [['G4', 0, 0.5], ['Eb4', 0.5, 0.5], ['C4', 1.0, 0.5], ['B3', 1.5, 1.6]];
    for (const [n, t, d] of seq) V.strings(ctx, out, t, d, nm(n), 0.8);
    for (const n of ['C3', 'G3']) V.strings(ctx, out, 1.5, 1.8, nm(n), 0.6);
    V.timpani(ctx, out, 1.5, 0.7, 31);
  }
  const buf = await ctx.startRendering();
  return [buf.getChannelData(0).slice(), buf.getChannelData(1).slice()];
}
