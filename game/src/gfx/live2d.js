// "Live2D-lite" for the home lobby: the secretary's full painting as a finely subdivided mesh that breathes,
// sways, lets hair and cloth drift, turns its head toward the player's finger and reacts to touch — a head pat
// (ducks into it, wiggles, hearts), a poke on the body (springy bounce) — plus idle gestures (curious head
// tilt, a little hop, a gust of wind through the hair, glances around).
//
//   const fig = await LiveFigure.create(canvas, { url, face })   // null if WebGL / the image is unavailable
//   fig.onTap = (part) => ...  ('head' | 'body');  fig.setActive(bool);  fig.destroy()
import { Application, Container, Mesh, MeshGeometry, Texture } from 'pixi.js';
import { loadTex } from './tex.js';
import { GFX } from './fx.js';

const NX = 20, NY = 30;
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const R = Math.random;

/** Damped spring toward a target (critically-ish damped unless `zeta` < 1). */
class Spring {
  constructor(w = 10, zeta = 0.7) { this.w = w; this.z = zeta; this.x = 0; this.v = 0; this.t = 0; }
  step(dt) { this.v += (-(this.w * this.w) * (this.x - this.t) - 2 * this.z * this.w * this.v) * dt; this.x += this.v * dt; return this.x; }
  kick(v) { this.v += v; }
}

export class LiveFigure {
  static async create(canvas, opts) {
    const f = new LiveFigure(canvas, opts);
    try {
      await f._init();
      return f.dead ? null : f;
    } catch (e) {
      console.warn('live figure unavailable:', e);
      f.destroy();
      return null;
    }
  }

  constructor(canvas, { url, face = [0.5, 0.15, 0.12], rim = 0xffe6aa } = {}) {
    this.rim = rim;
    this.c = canvas;
    this.url = url;
    this.face = face;
    this.onTap = null;
    this.active = true;
    this.time = Math.random() * 10;
    this.look = { x: new Spring(7, 0.8), y: new Spring(7, 0.8) };
    this.bounce = new Spring(17, 0.22); // body squash (impulse on poke / landing)
    this.duck = new Spring(14, 0.35); // head pat: head dips toward the neck
    this.tiltS = new Spring(11, 0.3); // extra head roll (wiggles)
    this.hop = new Spring(16, 0.45);
    this.gust = 0;
    this.pointerAt = -10;
    this.nextGesture = 3 + R() * 4;
    this.nextGlance = 2 + R() * 3;
  }

  async _init() {
    const tex = await loadTex(this.url);
    if (!tex || this.dead) throw new Error('art missing');
    this.tex = tex;
    const app = new Application();
    this.app = app;
    const r = this.c.getBoundingClientRect();
    await app.init({
      canvas: this.c, width: Math.max(10, r.width), height: Math.max(10, r.height), resolution: Math.min(2, window.devicePixelRatio || 1),
      autoDensity: false, backgroundAlpha: 0, antialias: true, autoStart: false, sharedTicker: false, preference: 'webgl',
    });
    if (app.ticker) app.ticker.stop();
    this.c.style.width = '100%';
    this.c.style.height = '100%';
    if (this.dead) return;
    this.root = new Container();
    this.fxLayer = new Container();
    app.stage.addChild(this.root, this.fxLayer);
    this.fx = new GFX({ under: this.fxLayer, add: this.fxLayer, normal: this.fxLayer });
    const n = NX * NY;
    this.rest = new Float32Array(n * 2);
    const uvs = new Float32Array(n * 2);
    const indices = new Uint32Array((NX - 1) * (NY - 1) * 6);
    for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) { const k = j * NX + i; uvs[k * 2] = i / (NX - 1); uvs[k * 2 + 1] = j / (NY - 1); }
    let q = 0;
    for (let j = 0; j < NY - 1; j++) for (let i = 0; i < NX - 1; i++) {
      const a = j * NX + i, b = a + 1, c = a + NX, d = c + 1;
      indices[q++] = a; indices[q++] = b; indices[q++] = c; indices[q++] = b; indices[q++] = d; indices[q++] = c;
    }
    this.geom = new MeshGeometry({ positions: new Float32Array(n * 2), uvs, indices });
    this.mesh = new Mesh({ geometry: this.geom, texture: tex });
    // a blurred silhouette (computed once) gives the rim light and the ground shadow; both share the mesh
    const halo = this._haloTex(tex);
    if (halo) {
      this.shadow = new Mesh({ geometry: this.geom, texture: halo });
      this.shadow.tint = 0x000000; this.shadow.alpha = 0.42; this.shadow.y = 14;
      this.glow = new Mesh({ geometry: this.geom, texture: halo });
      this.glow.tint = this.rim; this.glow.alpha = 0.55;
      this.root.addChild(this.shadow, this.glow);
    }
    this.root.addChild(this.mesh);
    this.W = { head: new Float32Array(n), upper: new Float32Array(n), edge: new Float32Array(n), chest: new Float32Array(n) };
    this._hitMask();
    this._layout();
    this._bind();
    this._loop = (ts) => this._frame(ts);
    this.raf = requestAnimationFrame(this._loop);
  }

  _haloTex(tex) {
    try {
      const img = tex.source.resource;
      const w = Math.max(8, Math.round(tex.width / 4)), h = Math.max(8, Math.round(tex.height / 4));
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      const g = c.getContext('2d');
      g.filter = 'blur(5px)';
      g.drawImage(img, 0, 0, w, h);
      g.filter = 'none';
      g.globalCompositeOperation = 'source-in';
      g.fillStyle = '#ffffff';
      g.fillRect(0, 0, w, h);
      this.haloTex = Texture.from(c);
      return this.haloTex;
    } catch { return null; }
  }

  /** Low-res alpha mask of the painting so taps on empty space fall through. */
  _hitMask() {
    try {
      const img = this.tex.source.resource;
      const c = document.createElement('canvas');
      c.width = 90; c.height = Math.round((90 * this.tex.height) / this.tex.width);
      const g = c.getContext('2d', { willReadFrequently: true });
      g.drawImage(img, 0, 0, c.width, c.height);
      this.mask = { w: c.width, h: c.height, a: g.getImageData(0, 0, c.width, c.height).data };
    } catch { this.mask = null; }
  }

  _layout() {
    const r = this.c.getBoundingClientRect();
    if (r.width < 10 || r.height < 10) return;
    this.cw = r.width; this.ch = r.height;
    this.app.renderer.resize(r.width, r.height, Math.min(2, window.devicePixelRatio || 1));
    this.c.style.width = '100%';
    this.c.style.height = '100%';
    const tw = this.tex.width, th = this.tex.height;
    const s = Math.min(r.width / tw, r.height / th); // contain, top-aligned (matches the old <img>)
    const w = tw * s, h = th * s, x0 = (r.width - w) / 2, y0 = 0;
    this.box = { x0, y0, w, h };
    const [fcx, fcy, fsz] = this.face;
    const fx = x0 + fcx * w, fy = y0 + fcy * h, fs = fsz * h;
    this.F = { fx, fy, fs, neckY: fy + fs * 0.8, bottom: y0 + h };
    const { head, upper, edge, chest } = this.W;
    for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
      const k = j * NX + i;
      const x = x0 + (i / (NX - 1)) * w, y = y0 + (j / (NY - 1)) * h;
      this.rest[k * 2] = x; this.rest[k * 2 + 1] = y;
      const d = Math.hypot(x - fx, (y - fy) * 0.9);
      head[k] = (1 - smooth(fs * 1.05, fs * 2.3, d)) * smooth(this.F.neckY + fs * 0.55, this.F.neckY - fs * 0.25, y);
      upper[k] = smooth(this.F.bottom, this.F.neckY, y);
      edge[k] = smooth(fs * 0.9, fs * 3.6, Math.abs(x - fx));
      chest[k] = Math.exp(-Math.pow((y - (this.F.neckY + fs * 1.3)) / (fs * 1.1), 2)) * (1 - smooth(fs * 0.7, fs * 2.6, Math.abs(x - fx)));
    }
  }

  _bind() {
    const local = (e) => { const r = this.c.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    this._onMove = (e) => {
      if (e.pointerType === 'mouse' || e.buttons) this._lookAt(...local(e));
    };
    this._onDown = (e) => {
      const [x, y] = local(e);
      this._lookAt(x, y);
      const part = this._part(x, y);
      if (!part) return;
      e.stopPropagation();
      this.tapAt = performance.now(); // the click that follows belongs to this tap
      this.react(part, x, y);
      if (this.onTap) this.onTap(part);
    };
    this._onResize = () => this._layout();
    this.c.addEventListener('pointermove', this._onMove);
    this.c.addEventListener('pointerdown', this._onDown);
    this.ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(this._onResize) : null;
    if (this.ro) this.ro.observe(this.c);
  }

  _lookAt(x, y) {
    const { fx, fy, fs } = this.F;
    this.look.x.t = Math.max(-1, Math.min(1, (x - fx) / (fs * 4)));
    this.look.y.t = Math.max(-1, Math.min(1, (y - fy) / (fs * 5)));
    this.pointerAt = this.time;
  }

  /** 'head' | 'body' | null for a canvas point. */
  _part(x, y) {
    const { fx, fy, fs } = this.F;
    if (Math.hypot(x - fx, y - fy) < fs * 1.25) return 'head';
    const b = this.box;
    if (x < b.x0 || x > b.x0 + b.w || y < b.y0 || y > b.y0 + b.h) return null;
    if (this.mask) {
      const mx = Math.floor(((x - b.x0) / b.w) * this.mask.w), my = Math.floor(((y - b.y0) / b.h) * this.mask.h);
      if (this.mask.a[(my * this.mask.w + mx) * 4 + 3] < 40) return null;
    }
    return 'body';
  }

  /** Touch reaction (also callable from outside, e.g. when the speech bubble is tapped). */
  react(part = 'body', x = null, y = null) {
    const { fx, fy, fs } = this.F;
    if (part === 'head') {
      this.duck.kick(9);
      this.tiltS.kick((R() < 0.5 ? -1 : 1) * 2.4);
      for (let i = 0; i < 6; i++) this.fx.emit({ x: fx + (R() - 0.5) * fs * 1.6, y: fy - fs * 0.6, vx: (R() - 0.5) * 60, vy: -70 - R() * 70, kind: 'heart', color: i % 2 ? '#ff8ac8' : '#ffb3d9', size: 9 + R() * 6, size1: 4, life: 1 + R() * 0.4, delay: i * 0.05, drag: 0.6 });
    } else {
      this.bounce.kick(3.2);
      this.hop.kick(-140);
      const px = x ?? fx, py = y ?? fy + fs * 3;
      for (let i = 0; i < 8; i++) this.fx.emit({ x: px, y: py, vx: (R() - 0.5) * 260, vy: (R() - 0.5) * 260, kind: 'star', color: '#fff2b0', size: 7, size1: 1, life: 0.6, drag: 3 });
    }
    this.gust = Math.max(this.gust, 0.6);
  }

  setActive(on) {
    this.active = on;
    if (on && !this.raf && !this.dead) { this.last = 0; this.raf = requestAnimationFrame(this._loop); }
  }

  _gesture() {
    const g = R();
    if (g < 0.3) this.tiltS.kick((R() < 0.5 ? -1 : 1) * 1.6); // curious head tilt
    else if (g < 0.5) { this.hop.kick(-90); this.bounce.kick(1.6); } // little hop
    else if (g < 0.8) this.gust = 1; // wind through the hair
    else this.duck.kick(4); // nod
  }

  _frame(ts) {
    this.raf = 0;
    if (this.dead || !this.active) return;
    this.raf = requestAnimationFrame(this._loop);
    if (document.hidden || !this.c.isConnected) return;
    const dt = Math.min(0.05, this.last ? (ts - this.last) / 1000 : 1 / 60);
    this.last = ts;
    this.time += dt;
    const t = this.time;
    // idle behaviour: occasional gestures and glances when nobody is touching
    if (t - this.pointerAt > 2.5) {
      this.nextGlance -= dt;
      if (this.nextGlance <= 0) {
        this.nextGlance = 2.5 + R() * 4;
        const back = R() < 0.45;
        this.look.x.t = back ? 0 : (R() - 0.5) * 0.9;
        this.look.y.t = back ? 0 : (R() - 0.5) * 0.4;
      }
    }
    this.nextGesture -= dt;
    if (this.nextGesture <= 0) { this.nextGesture = 6 + R() * 6; this._gesture(); }
    this.gust = Math.max(0, this.gust - dt * 0.5);
    const lx = this.look.x.step(dt), ly = this.look.y.step(dt);
    const bq = this.bounce.step(dt) * 0.4;
    const duck = Math.max(-0.4, this.duck.step(dt)) * 0.25;
    const roll = this.tiltS.step(dt) * 0.8;
    const hop = Math.min(0, this.hop.step(dt) * 3.5);
    this._deform(t, lx, ly, bq, duck, roll);
    this.root.y = hop;
    this.fx.update(dt);
    this.app.renderer.render(this.app.stage);
  }

  _deform(t, lx, ly, bq, duck, roll) {
    const P = this.geom.positions, Rr = this.rest;
    const { head, upper, edge, chest } = this.W;
    const { fx, fy, fs, neckY, bottom } = this.F;
    const br = Math.sin(t * 2.1);
    const sw = Math.sin(t * 0.85) * 0.6 + Math.sin(t * 1.9 + 1.3) * 0.15;
    const hairAmp = 1 + this.gust * 2.2;
    const ang = 0.03 * Math.sin(t * 0.75 + 0.6) + lx * 0.08 + roll; // head roll around the neck
    const ca = Math.cos(ang), sa = Math.sin(ang);
    const hx = lx * fs * 0.25, hy = ly * fs * 0.12 + duck * fs * 1.2; // head shift (look / pat)
    for (let k = 0, n = head.length; k < n; k++) {
      let x = Rr[k * 2], y = Rr[k * 2 + 1];
      const hw = head[k], up = upper[k], ed = edge[k], chW = chest[k];
      // head: roll about the neck + look / duck offset (squashes toward the neck on a pat)
      if (hw > 0) {
        const dx = x - fx, dy = y - neckY;
        const rx = fx + dx * ca - dy * sa, ry = neckY + dx * sa + dy * ca;
        x += (rx - x) * hw + hx * hw;
        y += (ry - y) * hw + hy * hw * Math.max(0, (neckY - y) / (fs * 2));
      }
      // breathing: chest swells, shoulders rise
      y -= br * fs * 0.045 * chW + br * fs * 0.015 * up;
      x += (x - fx) * br * 0.01 * chW;
      // the upper body leans with the look and sways
      x += (lx * fs * 0.12 + sw * fs * 0.06) * up * up;
      // hair & cloth drift: outer regions ripple, more with height and gusts
      const wave = Math.sin(t * 1.6 - (y - fy) / (fs * 1.4) + Math.sign(x - fx) * 0.6);
      x += ed * (0.35 + up) * fs * 0.06 * wave * hairAmp;
      y += ed * fs * 0.01 * Math.cos(t * 1.25 - (x - fx) / (fs * 1.8)) * hairAmp;
      // springy squash & stretch about the feet (pokes, hops)
      y = bottom - (bottom - y) * (1 - bq);
      x = fx + (x - fx) * (1 + bq * 0.5);
      P[k * 2] = x; P[k * 2 + 1] = y;
    }
    this.geom.getBuffer('aPosition').update();
  }

  destroy() {
    this.dead = true;
    cancelAnimationFrame(this.raf);
    if (this.ro) this.ro.disconnect();
    if (this.c) { this.c.removeEventListener('pointermove', this._onMove); this.c.removeEventListener('pointerdown', this._onDown); }
    const gl = this.app && this.app.renderer && this.app.renderer.gl;
    try {
      if (this.fx) this.fx.destroy();
      if (this.geom) this.geom.destroy();
      if (this.haloTex) this.haloTex.destroy(true);
      if (this.app) this.app.destroy({ removeView: false }, { children: true });
    } catch { /* already gone */ }
    try { gl && gl.getExtension('WEBGL_lose_context') && gl.getExtension('WEBGL_lose_context').loseContext(); } catch { /* ignore */ }
  }
}
