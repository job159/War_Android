// Deformable battle puppet ("Live2D-lite"): each key pose (idle / atk / cast / hurt) is a textured grid mesh
// whose vertices are pushed every frame by layered deformers — breathing, sway, head tilt around the neck,
// hair / cloth follow-through, squash & stretch about the feet, forward lean — so a single painting moves
// like an animated character. Poses are aligned on the face (no head pops on swaps), cross-faded with a
// smear after-image. Also: white hit flash (shared geometry), colored after-images, glowing dissolve on death.
import { Container, Mesh, MeshGeometry, Sprite, Texture, Filter, GlProgram, UniformGroup, defaultFilterVert } from 'pixi.js';

const NX = 10, NY = 14;
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// ------------------------------------------------------------------ dissolve filter (death)
let noiseTex = null;
function noise() {
  if (noiseTex) return noiseTex;
  const S = 128, c = document.createElement('canvas');
  c.width = c.height = S;
  const g = c.getContext('2d');
  const img = g.createImageData(S, S);
  const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const val = (x, y, cells) => {
    const fx = (x / S) * cells, fy = (y / S) * cells, x0 = Math.floor(fx), y0 = Math.floor(fy), tx = fx - x0, ty = fy - y0;
    const at = (i, j) => rnd(((j % cells + cells) % cells) * cells + ((i % cells + cells) % cells) + cells * 1000);
    const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
    return (at(x0, y0) * (1 - sx) + at(x0 + 1, y0) * sx) * (1 - sy) + (at(x0, y0 + 1) * (1 - sx) + at(x0 + 1, y0 + 1) * sx) * sy;
  };
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const v = val(x, y, 8) * 0.55 + val(x, y, 16) * 0.3 + val(x, y, 32) * 0.15;
    const i = (y * S + x) * 4;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = Math.round(v * 255);
    img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  noiseTex = Texture.from(c);
  noiseTex.source.addressMode = 'repeat';
  return noiseTex;
}

const DISSOLVE_FRAG = `
in vec2 vTextureCoord;
out vec4 finalColor;
uniform sampler2D uTexture;
uniform sampler2D uNoise;
uniform float uProgress;
uniform vec3 uEdge;
uniform highp vec4 uInputSize; // must match the vertex stage precision or the program fails to link
void main() {
  vec4 c = texture(uTexture, vTextureCoord);
  float n = texture(uNoise, vTextureCoord * uInputSize.xy / 90.0).r;
  float t = uProgress * 1.2 - 0.1;
  float keep = smoothstep(t - 0.015, t + 0.015, n);
  float edge = (1.0 - smoothstep(t, t + 0.09, n)) * keep;
  finalColor = vec4(c.rgb + uEdge * edge * 2.2 * c.a, c.a) * keep;
}`;

export function dissolveFilter(color = [1, 0.85, 0.5]) {
  const f = new Filter({
    glProgram: GlProgram.from({ vertex: defaultFilterVert, fragment: DISSOLVE_FRAG, name: 'lexica-dissolve' }),
    resources: {
      dissolveUniforms: new UniformGroup({ uProgress: { value: 0, type: 'f32' }, uEdge: { value: new Float32Array(color), type: 'vec3<f32>' } }),
      uNoise: noise().source,
    },
  });
  Object.defineProperty(f, 'progress', { get: () => f.resources.dissolveUniforms.uniforms.uProgress, set: (v) => { f.resources.dissolveUniforms.uniforms.uProgress = v; } });
  return f;
}

// ------------------------------------------------------------------ pose layer (one grid mesh per key pose)
function buildLayer(tex, sil, meta) {
  const w = tex.width, h = tex.height;
  const n = NX * NY;
  const positions = new Float32Array(n * 2), uvs = new Float32Array(n * 2);
  const indices = new Uint32Array((NX - 1) * (NY - 1) * 6);
  for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
    const k = j * NX + i;
    uvs[k * 2] = i / (NX - 1); uvs[k * 2 + 1] = j / (NY - 1);
  }
  let q = 0;
  for (let j = 0; j < NY - 1; j++) for (let i = 0; i < NX - 1; i++) {
    const a = j * NX + i, b = a + 1, c = a + NX, d = c + 1;
    indices[q++] = a; indices[q++] = b; indices[q++] = c; indices[q++] = b; indices[q++] = d; indices[q++] = c;
  }
  const geom = new MeshGeometry({ positions, uvs, indices });
  const mesh = new Mesh({ geometry: geom, texture: tex });
  const flash = new Mesh({ geometry: geom, texture: sil || Texture.WHITE });
  flash.alpha = 0;
  const face = meta && meta.face ? meta.face : null; // [cx, cy, fs] normalized
  const area = meta && meta.area ? meta.area : 0; // opaque fraction of the cut-out (visual mass)
  return { tex, w, h, mesh, flash, geom, uvs, indices, face, area, rest: new Float32Array(n * 2), headW: new Float32Array(n), scale: 1, ox: 0 };
}

/** Lay out a layer: scale so the figure is `H` px tall (or match `ref`'s head size), feet at y=0, face x aligned. */
function placeLayer(L, H, ref) {
  let s = H / L.h;
  if (ref && ref.face && L.face) {
    s = (ref.face[2] * ref.h * ref.scale) / (L.face[2] * L.h); // equal head size: no head pop on a pose swap
    if (ref.area && L.area) {
      // ...but a painted pose may not share the idle's chibi proportions (2 vs 4 heads tall would double the body):
      // cap how much bigger or smaller the whole figure looks (opaque area, so crouching or leaning doesn't count)
      const g = (Math.sqrt(L.area * L.w * L.h) * s) / (Math.sqrt(ref.area * ref.w * ref.h) * ref.scale);
      if (g > 1.2) s *= 1.2 / g;
      else if (g < 0.84) s *= 0.84 / g;
    }
  }
  L.scale = s;
  const W = L.w * s, Hh = L.h * s;
  const fx = L.face ? L.face[0] * W - W / 2 : 0;
  const refFx = ref && ref.face ? ref.faceX : fx;
  L.ox = ref ? refFx - fx : 0; // shift so this pose's face sits where the idle face is
  L.faceX = fx + L.ox;
  L.W = W; L.H = Hh;
  const fy = L.face ? (L.face[1] - 1) * Hh : -Hh * 0.75;
  const fs = L.face ? L.face[2] * Hh : Hh * 0.2;
  L.neck = [L.faceX, fy + fs * 0.75];
  for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
    const k = j * NX + i;
    const x = (i / (NX - 1) - 0.5) * W + L.ox, y = (j / (NY - 1) - 1) * Hh;
    L.rest[k * 2] = x; L.rest[k * 2 + 1] = y;
    const d = Math.hypot(x - L.faceX, y - fy);
    L.headW[k] = (1 - smooth(fs * 1.1, fs * 2.4, d)) * smooth(L.neck[1] + fs * 0.4, L.neck[1] - fs * 0.2, y);
  }
}

// ------------------------------------------------------------------ puppet
export class Puppet {
  /**
   * poses: { idle: {tex, sil, meta}, atk?, cast?, hurt? }; height: idle figure height in px;
   * kind: 'hero' | 'slime' | 'float' | 'beast' | 'giant' (secondary motion style)
   */
  constructor(poses, { height = 150, kind = 'hero', phase = Math.random() * 6 } = {}) {
    this.node = new Container();
    this.ghosts = new Container();
    this.body = new Container();
    this.node.addChild(this.ghosts, this.body);
    this.kind = kind;
    // how much the outer silhouette ripples like hair / cloth: full for heroes, subtle for rock and fur
    this.hairK = kind === 'hero' ? 1 : kind === 'float' ? 0.9 : kind === 'slime' ? 0.5 : 0.35;
    this.phase = phase;
    this.layers = {};
    this.cur = 'idle';
    this.prev = null;
    this.swapT = 1;
    this.ghostList = [];
    this.flashA = 0;
    this.tint = 0xffffff;
    // secondary motion: hair / cloth lag (damped spring driven by the body's world velocity)
    this.lag = { x: 0, y: 0, vx: 0, vy: 0, px: 0, py: 0 };
    this.setPoses(poses, height);
  }

  setPoses(poses, height) {
    for (const L of Object.values(this.layers)) { L.mesh.destroy(); L.flash.destroy(); L.geom.destroy(); }
    this.layers = {};
    this.body.removeChildren();
    const idle = poses.idle;
    if (!idle || !idle.tex) return;
    const base = buildLayer(idle.tex, idle.sil, idle.meta);
    placeLayer(base, height, null);
    this.layers.idle = base;
    for (const k of ['atk', 'cast', 'hurt']) {
      const p = poses[k];
      if (!p || !p.tex || p.tex === idle.tex) continue;
      const L = buildLayer(p.tex, p.sil, p.meta);
      placeLayer(L, height, base);
      this.layers[k] = L;
    }
    for (const L of Object.values(this.layers)) { L.mesh.alpha = 0; L.flash.alpha = 0; this.body.addChild(L.mesh, L.flash); }
    this.layers.idle.mesh.alpha = 1;
    this.cur = 'idle';
    this.height = height;
    this.width = base.W;
  }

  has(pose) { return !!this.layers[pose]; }

  /** Switch key pose with a short cross-fade (and an after-image of the old pose). */
  pose(name, ghostColor = null) {
    if (!this.layers[name]) name = 'idle';
    if (name === this.cur) return;
    this.prev = this.cur;
    this.cur = name;
    this.swapT = 0;
    if (ghostColor != null) this.ghost(ghostColor, 0.6, this.prev);
  }

  /** Colored after-image: a frozen copy of the current (deformed) silhouette at the puppet's present transform. */
  ghost(color = 0xffffff, alpha = 0.5, poseName = null) {
    const L = this.layers[poseName || this.cur] || this.layers.idle;
    if (!L || this.ghostList.length > 28) return;
    const geom = new MeshGeometry({ positions: new Float32Array(L.geom.positions), uvs: L.uvs, indices: L.indices });
    const g = new Mesh({ geometry: geom, texture: L.flash.texture });
    g.position.copyFrom(this.body.position);
    g.rotation = this.body.rotation;
    g.scale.copyFrom(this.body.scale);
    g.tint = color;
    g.alpha = alpha;
    this.ghosts.addChild(g);
    this.ghostList.push({ g, geom, a: alpha, t: 0 });
  }

  flash(a = 0.9) { this.flashA = Math.max(this.flashA, a); }

  /**
   * Per-frame update. p: { breath, sway, hair, tilt, lean, squash, rot, jump, x, y, wobble } (already combined).
   */
  update(dt, time, p) {
    this.swapT = Math.min(1, this.swapT + dt / 0.07);
    this.flashA = Math.max(0, this.flashA - dt * 9);
    const px = p.x || 0, py = p.y || 0;
    const G = this.lag;
    if (dt > 0) {
      const H = this.height || 150;
      const vx = (px - G.px) / dt, vy = (py - G.py) / dt;
      const tx = Math.max(-0.16, Math.min(0.16, -vx * 0.00012)) * H; // hair streams behind the motion
      const ty = Math.max(-0.08, Math.min(0.08, -vy * 0.0001)) * H;
      const w = 15, z = 0.3; // under-damped: overshoots when the body stops, then settles
      G.vx += (-(w * w) * (G.x - tx) - 2 * z * w * G.vx) * dt;
      G.vy += (-(w * w) * (G.y - ty) - 2 * z * w * G.vy) * dt;
      G.x += G.vx * dt;
      G.y += G.vy * dt;
    }
    G.px = px; G.py = py;
    p.lagX = G.x * (this.facing || 1); // local space
    p.lagY = G.y;
    for (const [name, L] of Object.entries(this.layers)) {
      const a = name === this.cur ? this.swapT : name === this.prev ? 1 - this.swapT : 0;
      L.mesh.alpha = a;
      L.mesh.visible = a > 0.01;
      L.mesh.tint = this.tint;
      L.flash.alpha = name === this.cur ? this.flashA : 0;
      L.flash.visible = L.flash.alpha > 0.01;
      if (L.mesh.visible) this._deform(L, time, p);
    }
    // rot pivots on the feet (topple); spin pivots on the body centre (flips, twirls, rolls)
    const rot = p.rot || 0, spin = p.spin || 0;
    let ox = 0, oy = 0;
    if (spin) {
      const c = (this.height || 150) * 0.5;
      ox = c * (Math.sin(rot) - Math.sin(rot + spin));
      oy = c * (Math.cos(rot + spin) - Math.cos(rot));
    }
    this.body.position.set(px + ox, py + oy);
    this.body.rotation = rot + spin;
    // turn: rotation about the vertical axis (pirouettes) — the figure narrows to a sliver and comes back mirrored
    const ct = Math.cos(p.turn || 0);
    this.body.scale.x = (this.facing || 1) * (Math.abs(ct) < 0.05 ? (ct < 0 ? -0.05 : 0.05) : ct);
    for (let i = this.ghostList.length - 1; i >= 0; i--) {
      const gh = this.ghostList[i];
      gh.t += dt;
      const k = gh.t / 0.26;
      gh.g.alpha = gh.a * Math.max(0, 1 - k) * Math.max(0, 1 - k);
      if (k >= 1) { gh.g.destroy(); gh.geom.destroy(); this.ghostList.splice(i, 1); }
    }
  }

  _deform(L, t, p) {
    const pos = L.geom.positions;
    const R = L.rest, HW = L.headW;
    const W = L.W, H = L.H;
    const [nx, ny] = L.neck;
    const br = p.breath || 0, sw = p.sway || 0, hair = p.hair ?? 1, sq = p.squash || 0, lean = p.lean || 0, wob = p.wobble || 0;
    const str = p.stretch || 0, lagX = p.lagX || 0, lagY = p.lagY || 0;
    const tilt = p.tilt || 0, ct = Math.cos(tilt), st = Math.sin(tilt);
    const ph = this.phase;
    const kind = this.kind;
    for (let k = 0, n = HW.length; k < n; k++) {
      let x = R[k * 2], y = R[k * 2 + 1];
      const h = -y / H; // 0 at the feet .. 1 at the top
      const u = (x - L.ox) / W + 0.5;
      // head: rotate around the neck pivot
      const hw = HW[k];
      if (hw > 0 && tilt) {
        const dx = x - nx, dy = y - ny;
        x = x + (nx + dx * ct - dy * st - x) * hw;
        y = y + (ny + dx * st + dy * ct - y) * hw;
      }
      // breathing: chest swells, shoulders and head rise
      y -= br * 0.011 * H * smooth(0.12, 0.62, h);
      x += (u - 0.5) * W * br * 0.012 * (1 - Math.abs(h - 0.45) * 2.2 > 0 ? 1 - Math.abs(h - 0.45) * 2.2 : 0);
      // squash & stretch about the feet (volume-preserving-ish)
      y *= 1 - sq;
      x = (x - L.ox) * (1 + sq * 0.55) + L.ox;
      // smear stretch along the facing axis (dashes, thrusts)
      if (str) { x = (x - L.ox) * (1 + str) + L.ox; y *= 1 - str * 0.3; }
      // lean (shear) — positive leans toward facing direction
      x += lean * h * H;
      // idle sway grows with height
      x += sw * W * 0.018 * Math.pow(h, 1.6);
      // hair / cloth follow-through: a wave travelling down, strongest at the top and the outer edges
      const edge = Math.min(1, Math.abs(u - 0.5) * 2);
      const hairW = h * h * (0.35 + edge * 0.9) * hair * this.hairK;
      x += hairW * W * 0.022 * Math.sin(t * 2.7 + ph - h * 4.2 + u * 1.7);
      y += hairW * H * 0.006 * Math.cos(t * 2.3 + ph - u * 3.1);
      // follow-through: the upper body, hair and cloth edges trail the motion
      if (lagX || lagY) {
        const lw = h * h * (0.45 + edge * 0.55);
        x += lagX * lw;
        y += lagY * lw * 0.5;
      }
      // creature styles
      if (kind === 'slime') {
        const j = Math.sin(t * 5.5 + ph) * 0.03 + wob * Math.sin(t * 22) * 0.08;
        y *= 1 - j;
        x = (x - L.ox) * (1 + j * 0.8) + L.ox;
      } else if (kind === 'float') {
        x += Math.sin(t * 3.1 + ph + h * 2) * W * 0.012;
      } else if (wob) {
        x += wob * Math.sin(t * 30 + h * 6) * W * 0.03 * h;
      }
      pos[k * 2] = x; pos[k * 2 + 1] = y;
    }
    L.geom.getBuffer('aPosition').update();
    L.mesh.position.set(0, 0);
    L.flash.position.set(0, 0);
  }

  get scaleX() { return this.body.scale.x; }

  setFacing(flip) { this.facing = flip ? -1 : 1; this.body.scale.x = this.facing; }

  destroy() {
    for (const gh of this.ghostList) { gh.g.destroy(); gh.geom.destroy(); }
    const geoms = Object.values(this.layers).map((L) => L.geom);
    this.node.destroy({ children: true });
    for (const g of geoms) g.destroy();
  }
}
