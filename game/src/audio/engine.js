// Runtime audio: renders SFX and the chosen music style offline in the background, then plays buffers.
// Music = sections (A, B) x stems (bed, drums, lead) scheduled back to back on the audio clock; the
// stem mix follows the situation (menu / battle / boss / pause) and battle intensity.
import { SFX, renderSfx, SFX_SR } from './sfx.js';
import { STYLES, renderSection, renderStinger, SR } from './music.js';
import { cacheGet, cachePut, toI16, fromI16 } from './cache.js';

const MIX = {
  menu: { adventure: [0.85, 0.3, 0.55], majestic: [0.85, 0.35, 0.5], rush: [0.8, 0.15, 0.45], calm: [0.85, 0.7, 0.6] },
  battle: [1, 0.85, 0.8],
  boss: [1, 1, 1],
};

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.sfxData = new Map(); // name -> Float32Array (rendered before the context exists)
    this.sfxBuf = new Map();
    this.lastPlay = {};
    this.voices = [];
    this.style = null;
    this.wantStyle = 'adventure';
    this.styleData = {}; // id -> { sections: {A, B}, order }
    this.rendering = {};
    this.mode = 'menu';
    this.intensity = 0.5;
    this.sfxVol = 0.8;
    this.musicVol = 0.6;
    this.paused = false;
    this.sched = null;
    this.stingers = {};
    setTimeout(() => this._prepare(), 400);
  }

  // ---------------------------------------------------------------- graph
  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      try { this.ctx = new AC({ latencyHint: 'interactive' }); } catch { try { this.ctx = new AC(); } catch { return; } }
      const c = this.ctx;
      this.master = c.createDynamicsCompressor();
      this.master.threshold.value = -6; this.master.ratio.value = 12; this.master.attack.value = 0.003; this.master.release.value = 0.2;
      this.master.connect(c.destination);
      this.sfxBus = c.createGain(); this.sfxBus.gain.value = this.sfxVol; this.sfxBus.connect(this.master);
      this.musicBus = c.createGain(); this.musicBus.gain.value = this.musicVol * 0.8;
      this.duck = c.createGain(); this.duck.gain.value = 1;
      this.musicFilter = c.createBiquadFilter(); this.musicFilter.type = 'lowpass'; this.musicFilter.frequency.value = 18000;
      this.musicFilter.connect(this.duck).connect(this.musicBus).connect(this.master);
      this.stems = {};
      for (const k of ['bed', 'drums', 'lead']) { const gg = c.createGain(); gg.gain.value = 0; gg.connect(this.musicFilter); this.stems[k] = gg; }
      for (const [k, d] of this.sfxData) this.sfxBuf.set(k, this._buf([d], SFX_SR));
      this._ensureMusic();
    }
    if (this.ctx.state !== 'running' && !this.paused) this.ctx.resume().catch(() => {});
  }

  _buf(chs, sr) {
    const b = this.ctx.createBuffer(chs.length, chs[0].length, sr);
    chs.forEach((d, i) => b.getChannelData(i).set(d));
    return b;
  }

  setVolumes(sfx, music) {
    this.sfxVol = sfx;
    this.musicVol = music;
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.sfxBus.gain.setTargetAtTime(sfx, t, 0.05);
    this.musicBus.gain.setTargetAtTime(music * 0.8, t, 0.05);
  }

  pause() { this.paused = true; if (this.ctx && this.ctx.state === 'running') this.ctx.suspend().catch(() => {}); }
  resume() { this.paused = false; if (this.ctx && this.ctx.state !== 'running') this.ctx.resume().catch(() => {}); }

  // ---------------------------------------------------------------- preparation (offline renders)
  async _prepare() {
    // cached renders from an earlier launch: everything is ready almost instantly
    const cached = await cacheGet('sfx');
    if (cached) {
      for (const k in cached) if (SFX[k]) { const d = fromI16(cached[k]); this.sfxData.set(k, d); if (this.ctx) this.sfxBuf.set(k, this._buf([d], SFX_SR)); }
    }
    const st = await cacheGet('stingers');
    if (st) for (const k in st) this.stingers[k] = st[k].map(fromI16);
    // UI + battle basics first, everything else after; the music style renders in between
    const first = ['tap', 'tab', 'back', 'open', 'correct', 'wrong', 'coin', 'perfect', 'hit', 'slash', 'shoot'];
    const rest = Object.keys(SFX).filter((k) => !first.includes(k));
    for (const k of first) await this._renderSfx(k);
    this._ensureMusic();
    for (const k of rest) await this._renderSfx(k);
    if (!cached) {
      const pack = {};
      for (const [k, d] of this.sfxData) pack[k] = toI16(d);
      cachePut('sfx', pack);
    }
    if (!st) {
      for (const s of ['victory', 'defeat']) {
        try { this.stingers[s] = await renderStinger(s); } catch { /* ignore */ }
      }
      const pack = {};
      for (const k in this.stingers) pack[k] = this.stingers[k].map(toI16);
      cachePut('stingers', pack);
    }
  }

  async _renderSfx(k) {
    if (this.sfxData.has(k)) return;
    try {
      const d = await renderSfx(k);
      this.sfxData.set(k, d);
      if (this.ctx) this.sfxBuf.set(k, this._buf([d], SFX_SR));
    } catch (e) { /* unsupported: fallback blips */ }
    await new Promise((r) => setTimeout(r, 0));
  }

  // ---------------------------------------------------------------- sfx
  play(name, opts = {}) {
    const def = SFX[name];
    if (!def) return false;
    if (!this.ctx || this.paused || this.sfxVol <= 0.001) return true;
    const b = this.sfxBuf.get(name);
    if (!b) return false;
    const t = this.ctx.currentTime;
    if (this.lastPlay[name] && t - this.lastPlay[name] < (def.th ?? 0.02)) return true;
    this.lastPlay[name] = t;
    this.voices = this.voices.filter((v) => v.end > t);
    const same = this.voices.filter((v) => v.name === name);
    if (same.length >= (def.max ?? 3)) { try { same[0].src.stop(); } catch { /* ignore */ } }
    if (this.voices.length > 24) return true;
    const src = this.ctx.createBufferSource();
    src.buffer = b;
    src.playbackRate.value = (opts.pitch || 1) * (1 + (Math.random() - 0.5) * 0.06);
    const gg = this.ctx.createGain();
    gg.gain.value = (opts.gain ?? 1) * 0.9;
    src.connect(gg).connect(this.sfxBus);
    src.start(t);
    this.voices.push({ name, src, end: t + b.duration });
    if (name === 'ultHit' || name === 'bossBlast' || name === 'summonBurst') this._duckMusic(0.45, 0.6);
    return true;
  }

  _duckMusic(level, hold) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const p = this.duck.gain;
    p.cancelScheduledValues(t);
    p.setTargetAtTime(level, t, 0.02);
    p.setTargetAtTime(1, t + hold, 0.4);
  }

  // ---------------------------------------------------------------- music
  setBgmStyle(style) {
    this.wantStyle = style;
    this._ensureMusic();
  }

  preview(style) { this.setBgmStyle(style); }

  setMusic(mode) {
    if (mode === 'pause') { this._applyMix(true); return; }
    this.mode = mode;
    this._applyMix();
  }

  setIntensity(x) {
    const old = this.intensity;
    this.intensity = Math.max(0, Math.min(1, x));
    if (Math.abs(old - this.intensity) > 0.05) this._applyMix();
  }

  async _ensureMusic() {
    const want = this.wantStyle;
    if (!want || want === 'off' || !STYLES[want]) { this._stopMusic(); this.style = null; return; }
    if (this.style === want && this.sched) return;
    if (!this.styleData[want]) {
      if (this.rendering[want]) return;
      this.rendering[want] = true;
      try {
        const hit = await cacheGet('music:' + want);
        let A, B;
        if (hit) {
          const un = (sec) => ({ ...sec, stems: Object.fromEntries(Object.entries(sec.stems).map(([k, v]) => [k, v.map(fromI16)])) });
          A = un(hit.A); B = un(hit.B);
        } else {
          A = await renderSection(want, 'A');
          await new Promise((r) => setTimeout(r, 0));
          B = await renderSection(want, 'B');
          const pk = (sec) => ({ dur: sec.dur, barDur: sec.barDur, bars: sec.bars, stems: Object.fromEntries(Object.entries(sec.stems).map(([k, v]) => [k, v.map(toI16)])) });
          cachePut('music:' + want, { A: pk(A), B: pk(B) });
        }
        this.styleData[want] = { sections: { A, B }, order: ['A', 'A', 'B', 'A', 'B', 'B'] };
        // keep memory down: only the selected style stays resident
        for (const k of Object.keys(this.styleData)) if (k !== this.wantStyle && k !== want) delete this.styleData[k];
      } catch (e) {
        console.warn('music render failed', e);
      }
      this.rendering[want] = false;
      if (this.wantStyle !== want) { this._ensureMusic(); return; }
    }
    if (!this.ctx || !this.styleData[want]) return;
    this._startMusic(want);
  }

  _startMusic(style) {
    this._stopMusic();
    const c = this.ctx;
    this.style = style;
    const data = this.styleData[style];
    const bufs = {};
    for (const id in data.sections) {
      bufs[id] = {};
      for (const k of ['bed', 'drums', 'lead']) bufs[id][k] = this._buf(data.sections[id].stems[k], SR);
    }
    this.bufs = bufs;
    this.seq = { idx: 0, next: c.currentTime + 0.15, sources: [] };
    for (const k in this.stems) { this.stems[k].gain.cancelScheduledValues(c.currentTime); this.stems[k].gain.setValueAtTime(0, c.currentTime); }
    this._applyMix(false, 1.2);
    this.sched = setInterval(() => this._tick(), 120);
    this._tick();
  }

  _stopMusic() {
    if (this.sched) clearInterval(this.sched);
    this.sched = null;
    if (this.seq && this.ctx) {
      const t = this.ctx.currentTime;
      for (const k in this.stems) { this.stems[k].gain.cancelScheduledValues(t); this.stems[k].gain.setTargetAtTime(0, t, 0.25); }
      const old = this.seq.sources;
      setTimeout(() => old.forEach((s) => { try { s.stop(); } catch { /* ignore */ } }), 1500);
    }
    this.seq = null;
  }

  _tick() {
    const c = this.ctx;
    if (!c || !this.seq || !this.style) return;
    const data = this.styleData[this.style];
    if (!data) return;
    const s = this.seq;
    if (s.next < c.currentTime - 0.1) s.next = c.currentTime + 0.05; // stalled (backgrounded)
    while (s.next < c.currentTime + 1.2) {
      const id = data.order[s.idx % data.order.length];
      const sec = data.sections[id];
      for (const k of ['bed', 'drums', 'lead']) {
        const src = c.createBufferSource();
        src.buffer = this.bufs[id][k];
        src.connect(this.stems[k]);
        src.start(s.next);
        src.onended = () => { try { src.disconnect(); } catch { /* ignore */ } };
        s.sources.push(src);
      }
      s.next += sec.dur;
      s.idx++;
    }
    if (s.sources.length > 30) s.sources = s.sources.slice(-12);
  }

  _applyMix(pause = false, tau = 0.6) {
    if (!this.ctx || !this.stems) return;
    const t = this.ctx.currentTime;
    let m;
    if (this.mode === 'off') m = [0, 0, 0];
    else if (this.mode === 'boss') m = MIX.boss;
    else if (this.mode === 'battle') m = [MIX.battle[0], MIX.battle[1] + 0.15 * this.intensity, MIX.battle[2] + 0.2 * this.intensity];
    else m = (MIX.menu[this.style] || MIX.menu.adventure);
    const k = pause ? 0.35 : 1;
    ['bed', 'drums', 'lead'].forEach((s, i) => { this.stems[s].gain.cancelScheduledValues(t); this.stems[s].gain.setTargetAtTime(m[i] * k, t, tau); });
    this.musicFilter.frequency.setTargetAtTime(pause ? 1200 : 18000, t, 0.3);
  }

  stinger(name) {
    if (!this.ctx || this.paused) return;
    const d = this.stingers[name];
    if (!d) { this.play(name === 'victory' ? 'levelup' : 'death'); return; }
    const src = this.ctx.createBufferSource();
    src.buffer = this._buf(d, SR);
    const gg = this.ctx.createGain();
    gg.gain.value = Math.max(this.musicVol, this.sfxVol) * 0.9;
    src.connect(gg).connect(this.master);
    src.start();
    this._duckMusic(0.15, 3.2);
  }
}
