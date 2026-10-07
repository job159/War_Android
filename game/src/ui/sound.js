// Audio facade: sound effects, background music and English text-to-speech.
// The procedural audio engine plugs in through setEngine(); until it is ready, UI sounds fall back to
// tiny real-time blips so taps are never silent.

let engine = null;
let settings = { music: 0.6, sfx: 0.8, tts: true, ttsRate: 0.9, bgm: 'adventure' };
let ctx = null;
let unlocked = false;

export function setEngine(e) {
  engine = e;
  applyVolumes();
}

export function configure(s) {
  settings = { ...settings, ...s };
  applyVolumes();
  if (engine && engine.setBgmStyle) engine.setBgmStyle(settings.bgm);
}

function applyVolumes() {
  if (engine && engine.setVolumes) engine.setVolumes(settings.sfx, settings.music);
}

export function unlockAudio() {
  if (engine && engine.unlock) engine.unlock();
  if (!unlocked) {
    unlocked = true;
    try {
      if (!engine) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (AC) ctx = new AC();
      }
    } catch {
      ctx = null;
    }
  }
  if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
}

const BLIPS = {
  tap: [880, 1180, 0.05, 'sine', 0.06], tab: [660, 990, 0.06, 'triangle', 0.06], back: [700, 520, 0.06, 'sine', 0.05],
  open: [520, 880, 0.09, 'triangle', 0.06], correct: [880, 1760, 0.16, 'triangle', 0.09], wrong: [220, 150, 0.22, 'sawtooth', 0.06],
  coin: [1320, 1980, 0.07, 'square', 0.035], error: [200, 160, 0.15, 'square', 0.05], buy: [990, 1480, 0.12, 'triangle', 0.08],
};

export function sfx(name, opts) {
  if (engine && engine.play) {
    if (engine.play(name, opts) !== false) return;
  }
  const b = BLIPS[name];
  if (!b || !ctx || settings.sfx <= 0) return;
  try {
    const [f0, f1, dur, type, g] = b;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const gn = ctx.createGain();
    gn.gain.setValueAtTime(0, t);
    gn.gain.linearRampToValueAtTime(g * settings.sfx, t + 0.006);
    gn.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.05);
    o.connect(gn).connect(ctx.destination);
    o.start(t);
    o.stop(t + dur + 0.08);
  } catch {
    // ignore
  }
}

/** Settings: play a few bars of a background-music style. */
export function previewBgm(style) {
  if (engine && engine.preview) engine.preview(style);
}

export function music(mode) {
  if (engine && engine.setMusic) engine.setMusic(mode);
}
export function intensity(x) {
  if (engine && engine.setIntensity) engine.setIntensity(x);
}
export function stinger(name) {
  if (engine && engine.stinger) engine.stinger(name);
}
export function pauseAudio() {
  if (engine && engine.pause) engine.pause();
  if (ctx) ctx.suspend().catch(() => {});
  stopSpeak();
}
export function resumeAudio() {
  if (engine && engine.resume) engine.resume();
  if (ctx) ctx.resume().catch(() => {});
}

// ------------------------------------------------------------------ text to speech

let voice = null;
function pickVoice() {
  try {
    const vs = speechSynthesis.getVoices() || [];
    voice = vs.find((v) => /en[-_]US/i.test(v.lang) && /female|samantha|google|zira|aria|jenny/i.test(v.name))
      || vs.find((v) => /en[-_]US/i.test(v.lang)) || vs.find((v) => /^en/i.test(v.lang)) || null;
  } catch {
    voice = null;
  }
}
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  pickVoice();
  try { speechSynthesis.addEventListener('voiceschanged', pickVoice); } catch { /* old WebView */ }
}

export function ttsAvailable() {
  if (window.NativeBridge && window.NativeBridge.ttsReady) {
    try { return !!window.NativeBridge.ttsReady(); } catch { return false; }
  }
  return 'speechSynthesis' in window;
}

export function speak(text, { rate, force } = {}) {
  if (!text || (!settings.tts && !force)) return false;
  const r = rate || settings.ttsRate || 0.9;
  if (window.NativeBridge && window.NativeBridge.speak) {
    try { return window.NativeBridge.speak(String(text), r); } catch { return false; }
  }
  if (!('speechSynthesis' in window)) return false;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(String(text));
    u.lang = 'en-US';
    if (voice) u.voice = voice;
    u.rate = r;
    speechSynthesis.speak(u);
    return true;
  } catch {
    return false;
  }
}

export function stopSpeak() {
  try {
    if (window.NativeBridge && window.NativeBridge.stopSpeaking) window.NativeBridge.stopSpeaking();
    else if ('speechSynthesis' in window) speechSynthesis.cancel();
  } catch {
    // ignore
  }
}

/** Dev / diagnostics. */
export const getEngine = () => engine;
