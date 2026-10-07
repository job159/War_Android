// WebGL battle renderer (PixiJS). Drop-in replacement for fx/battleView.js with a cinematic layer on top:
// painted backgrounds with fog / light rays, bloom on effects, camera punch-ins, hit-stop, shockwave
// distortion, chromatic aberration and radial blur for ultimates.
//
//   const view = await BattleStage.create(canvas, { bg, quality })   // null if WebGL is unavailable
//   view.addUnit(info) / sync / event(e) / update(dt) / draw(fever) / resize() / destroy()
import { Application, Container, Sprite, Graphics, Text, TilingSprite, Rectangle, Texture } from 'pixi.js';
import { AdvancedBloomFilter, ShockwaveFilter, ZoomBlurFilter, RGBSplitFilter, MotionBlurFilter } from 'pixi-filters';
import { GFX } from './fx.js';
import { Puppet, dissolveFilter } from './puppet.js';
import { Actor, meleeStyle, meleeReach, MELEE_VFX, ultStyle } from './acting.js';
import { playVfx, ultCharge, preloadFxArt, PAL, glowBurst, ring, rising, sparks, swoosh as swooshFx, arcPath, bezPath, hitSpark, dust, groundCrack, magicCircle, flare, converge, smoke } from './vfx.js';
import * as T from './tex.js';
import { BG, paintBattleBg } from '../fx/battleView.js';
import { ease } from '../fx/particles.js';
import { bgAsset } from '../art/assets.js';

const SCENE = {
  plains: { fog: 0.06, fogC: '#ffffff', rays: 0.16, raysC: '#fff4d0', dust: '#e0d4b0' },
  forest: { fog: 0.18, fogC: '#bfffd8', rays: 0.22, raysC: '#e8ffb8', dust: '#c8d4a0' },
  canyon: { fog: 0.16, fogC: '#ff8a4a', rays: 0, raysC: '#ffb04a', embers: true, dust: '#d09a70' },
  tundra: { fog: 0.2, fogC: '#e8f6ff', rays: 0.1, raysC: '#d8f0ff', dust: '#f4fbff' },
  sky: { fog: 0.1, fogC: '#ffffff', rays: 0.28, raysC: '#fff0c8', dust: '#ffffff' },
  graveyard: { fog: 0.26, fogC: '#9a7aff', rays: 0, raysC: '#c8b8ff', dust: '#9a90a8' },
  harbor: { fog: 0.14, fogC: '#7fd4ff', rays: 0.26, raysC: '#c8f4ff', dust: '#dce8f0' },
  ruins: { fog: 0.12, fogC: '#ffe0a0', rays: 0.18, raysC: '#ffe8b0', dust: '#dccca8' },
  labyrinth: { fog: 0.2, fogC: '#c8a0ff', rays: 0.08, raysC: '#e0c8ff', dust: '#b8a8c8' },
  battlefield: { fog: 0.18, fogC: '#ff9a5a', rays: 0.12, raysC: '#ffb070', embers: true, dust: '#b8987a' },
  citadel: { fog: 0.22, fogC: '#7a7aff', rays: 0.06, raysC: '#a8a8ff', dust: '#a8a8c0' },
  tower: { fog: 0.16, fogC: '#ff8ad8', rays: 0.12, raysC: '#ffc8f0', dust: '#e8c8e0' },
  arena: { fog: 0.08, fogC: '#ffd8a0', rays: 0.2, raysC: '#ffe8b0', dust: '#e0cca8' },
};

const STATUS = {
  burn: ['#ff7a2a', '火'], poison: ['#9ad83a', '毒'], stun: ['#ffd84a', '暈'], freeze: ['#7fd4ff', '冰'], atkUp: ['#ff5a5a', '攻', 1], atkDown: ['#7a7aff', '攻', -1],
  defUp: ['#4aa8ff', '防', 1], defDown: ['#ff8a4a', '防', -1], spdUp: ['#4ade80', '速', 1], spdDown: ['#a8a8a8', '速', -1], taunt: ['#ff3a3a', '!'], silence: ['#b05cff', '默'],
  broken: ['#ffd84a', '破'], critUp: ['#ff7ad9', '爆', 1],
};
const statusTexCache = new Map();
function statusTex(s) {
  if (statusTexCache.has(s)) return statusTexCache.get(s);
  const [color, ch, dir] = STATUS[s] || ['#ffffff', '?'];
  const c = document.createElement('canvas');
  c.width = c.height = 48;
  const g = c.getContext('2d');
  g.fillStyle = 'rgba(10,6,20,.85)'; g.beginPath(); g.arc(24, 24, 22, 0, Math.PI * 2); g.fill();
  g.fillStyle = color; g.beginPath(); g.arc(24, 24, 18, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#10081c'; g.font = '900 22px "Noto Sans TC", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(ch, 24, 25);
  if (dir) { g.fillStyle = '#ffffff'; g.strokeStyle = '#10081c'; g.lineWidth = 3; g.font = '900 20px sans-serif'; g.strokeText(dir > 0 ? '▲' : '▼', 38, 10); g.fillText(dir > 0 ? '▲' : '▼', 38, 10); }
  const t = Texture.from(c);
  statusTexCache.set(s, t);
  return t;
}

const TAU = Math.PI * 2;
const BEAST_VFX = new Set(['claw', 'bite', 'bump', 'tentacle', 'howl']);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

const FLOAT_STYLE = (color, size) => ({
  fontFamily: 'Cinzel, "Noto Sans TC", sans-serif', fontWeight: '900', fontSize: size, fill: color,
  stroke: { color: '#14061a', width: Math.max(3, size * 0.22), join: 'round' },
  dropShadow: { color: '#000000', alpha: 0.6, blur: 4, distance: 2, angle: Math.PI / 2 },
});

export class BattleStage {
  static async create(canvas, opts = {}) {
    const s = new BattleStage(canvas, opts);
    try {
      await s._init();
      return s;
    } catch (e) {
      console.warn('WebGL battle renderer unavailable, falling back to Canvas2D:', e);
      try { s.app && s.app.destroy(); } catch { /* ignore */ }
      return null;
    }
  }

  constructor(canvas, { bg = 'plains', quality = 'high' } = {}) {
    this.c = canvas;
    this.bgKey = BG[bg] ? bg : 'plains';
    this.high = quality !== 'low';
    this.units = new Map();
    this.floats = [];
    this.flashes = [];
    this.time = 0;
    this.shakeA = 0; this.shakeT = 0; this.shakeDur = 0;
    this.dimA = 0; this.dimT = 0;
    this.frozen = false;
    this.slow = 0; this.slowK = 1; // hit-stop / slow motion
    this.cam = { s: 1, fx: 0, fy: 0, t: 0, dur: 0, amt: 0 };
    this.waves = [];
    this.chroma = { t: 0, dur: 0, a: 0 };
    this.zoomFx = { t: 0, dur: 0, a: 0, x: 0, y: 0 };
    this.fever = [0, 0];
  }

  async _init() {
    const r = this.c.getBoundingClientRect();
    this.w = Math.max(10, r.width);
    this.h = Math.max(10, r.height);
    this.dpr = Math.min(2, window.devicePixelRatio || 1) * (this.high ? 1 : 0.75);
    const app = new Application();
    this.app = app;
    await app.init({
      canvas: this.c, width: this.w, height: this.h, resolution: this.dpr, autoDensity: false, antialias: false,
      autoStart: false, sharedTicker: false, background: '#05030c', preference: 'webgl', powerPreference: 'high-performance',
    });
    if (app.ticker) app.ticker.stop();
    this.c.style.width = '100%';
    this.c.style.height = '100%';

    // ---- scene graph
    const world = (this.world = new Container());
    this.bgLayer = new Container();
    this.ambLayer = new Container();
    this.under = new Container();
    this.unitLayer = new Container();
    this.unitLayer.sortableChildren = true;
    this.dimG = new Graphics();
    this.fxNormal = new Container();
    this.fxAdd = new Container();
    world.addChild(this.bgLayer, this.ambLayer, this.under, this.unitLayer, this.dimG, this.fxNormal, this.fxAdd);
    this.hud = new Container();
    this.screen = new Container();
    app.stage.addChild(world, this.hud, this.screen);

    this.fx = new GFX({ under: this.under, add: this.fxAdd, normal: this.fxNormal });
    this.fx.setQuality(this.high);
    this.amb = new GFX({ under: this.ambLayer, add: this.ambLayer, normal: this.ambLayer });
    this.amb.setQuality(this.high);

    if (this.high) {
      this.bloom = new AdvancedBloomFilter({ threshold: 0.42, bloomScale: 1.25, brightness: 1.05, blur: 7, quality: 5, resolution: 0.5 });
      this.bloom.blendMode = 'add';
      this.bloom.resolution = 0.5;
      this.fxAdd.filters = [this.bloom];
      this.fxAdd.blendMode = 'add';
    }
    this.rgbSplit = new RGBSplitFilter({ red: { x: 0, y: 0 }, green: { x: 0, y: 0 }, blue: { x: 0, y: 0 } });
    this.zoomBlur = new ZoomBlurFilter({ strength: 0, center: { x: 0, y: 0 }, innerRadius: 40 });

    // ---- background
    this.bgSprite = new Sprite(Texture.EMPTY);
    this.bgSprite.anchor.set(0.5, 1);
    this.groundShade = new Sprite(T.vignetteTex());
    this.fog = new TilingSprite({ texture: T.fogTex(), width: 10, height: 10 });
    this.fog.blendMode = 'add';
    this.rays = new Sprite(T.raysTex('#ffffff', 14));
    this.rays.anchor.set(0.5);
    this.rays.blendMode = 'add';
    this.bgLayer.addChild(this.bgSprite, this.rays, this.fog, this.groundShade);
    const sc = SCENE[this.bgKey] || SCENE.plains;
    this.fog.tint = T.hexNum(sc.fogC);
    this.rays.tint = T.hexNum(sc.raysC);
    this.feverG = [new Sprite(T.glowTex('#ffb84a', 0.05)), new Sprite(T.glowTex('#ffb84a', 0.05))];
    for (const f of this.feverG) { f.blendMode = 'add'; f.anchor.set(0.5); f.alpha = 0; this.screen.addChild(f); }
    this.flashG = new Graphics();
    this.screen.addChild(this.flashG);
    this._layout();
    this._loadBg();
    preloadFxArt();
  }

  async _loadBg() {
    const url = bgAsset(this.bgKey);
    const painted = url ? await T.loadTex(url) : null;
    if (this.dead) return;
    this.painted = !!painted;
    this.bgSprite.texture = painted || Texture.from(paintBattleBg(this.bgKey, 720, 560, 1));
    this._layout();
  }

  _layout() {
    const W = this.w, H = this.h;
    const tex = this.bgSprite.texture;
    if (tex && tex.width > 1) {
      // cover the field with a margin for camera moves; keep the ground (bottom) in view
      const s = Math.max((W * 1.12) / tex.width, (H * 1.12) / tex.height);
      this.bgSprite.scale.set(s);
      this.bgSprite.position.set(W / 2, H * 1.04);
      this.bgBase = s;
    }
    this.groundShade.width = W * 1.3; this.groundShade.height = H * 1.3;
    this.groundShade.position.set(-W * 0.15, -H * 0.15);
    this.fog.width = W * 1.3; this.fog.height = H * 0.75;
    this.fog.position.set(-W * 0.15, H * 0.3);
    this.fog.tileScale.set(1.6);
    this.rays.position.set(W * 0.72, -H * 0.18);
    this.rays.scale.set((H * 2.2) / 512);
    for (const f of this.feverG) f.scale.set((Math.max(W, H) * 1.3) / 128, (H * 2.2) / 128);
    this.feverG[0].position.set(0, H / 2);
    this.feverG[1].position.set(W, H / 2);
    // filterArea is in world space (moves with the camera); pad it so shakes / punch-ins never uncover an edge.
    // The filter system clips it to the viewport, which keeps filter coordinates == screen coordinates.
    const area = new Rectangle(-W * 0.25, -H * 0.25, W * 1.5, H * 1.5);
    this.world.filterArea = area;
    this.fxAdd.filterArea = area;
  }

  resize() {
    if (!this.app) return;
    const r = this.c.getBoundingClientRect();
    if (r.width < 10 || r.height < 10) return;
    this.w = r.width;
    this.h = r.height;
    this.app.renderer.resize(this.w, this.h, this.dpr);
    this.c.style.width = '100%';
    this.c.style.height = '100%';
    this._layout();
    for (const u of this.units.values()) {
      const ox = u.x, oy = u.y;
      this._place(u);
      if (ox != null && this.time > 0.2) { u.gx = (u.gx || 0) * (u.gt > 0 ? u.gt / 0.35 : 0) + ox - u.x; u.gy = (u.gy || 0) * (u.gt > 0 ? u.gt / 0.35 : 0) + oy - u.y; u.gt = 0.35; }
    }
  }

  // ---------------------------------------------------------------- units

  /** info: { id, side, slot, boss, scale, imgs: {idle|normal, atk|attack, cast, hurt, meta, raster}, flip, element, name, maxHp, monster, kind, role } */
  addUnit(info) {
    const u = { ...info, hp: info.maxHp, maxHp: info.maxHp, alive: true, energy: 0, shield: 0, statuses: [], deathT: 0, charge: 0, chargeProg: 0, chargeNeed: 0 };
    u.actor = new Actor({ phase: Math.random() * 6 });
    u.p = u.actor.tick(0, 0);
    u.col = T.hexNum((PAL[u.element] || PAL.light)[0]);
    u.node = new Container();
    u.shadow = new Sprite(T.shadowTex()); u.shadow.anchor.set(0.5);
    u.aura = new Sprite(T.glowTex((PAL[u.element] || PAL.light)[0], 0.05)); u.aura.anchor.set(0.5, 0.62); u.aura.blendMode = 'add'; u.aura.alpha = 0;
    u.holder = new Container();
    u.shieldG = new Graphics();
    u.node.addChild(u.shadow, u.aura, u.holder, u.shieldG);
    this.unitLayer.addChild(u.node);
    u.bar = new Graphics();
    u.icons = new Container();
    this.hud.addChild(u.bar, u.icons);
    this.units.set(u.id, u);
    this._place(u);
  }

  _place(u) {
    const W = this.w, H = this.h;
    const bossSide = [...this.units.values()].some((x) => x.side === u.side && x.boss);
    let fx, fy;
    if (bossSide) {
      [fx, fy] = u.boss ? [0.74, 0.88] : u.slot === 1 ? [0.55, 0.95] : [0.93, 0.62];
    } else {
      const P = [[0.37, 0.62], [0.37, 0.93], [0.15, 0.57], [0.15, 0.88]];
      [fx, fy] = P[u.slot] || P[0];
      if (u.side === 1) fx = 1 - fx;
    }
    u.x = W * fx;
    u.y = H * fy;
    const base = Math.min(H * 0.37, W * 0.33);
    u.h = base * (u.boss ? u.scale || 1.7 : 1) * (u.monster ? 0.92 : 1);
    if (!u.puppet) u.w = u.monster ? u.h : u.h * 0.74;
    u.cy = u.y - u.h * 0.45;
    if (u.puppet) this._buildPuppet(u, true);
  }

  /** Image -> texture. SVG art (the procedural fallback) is rasterized first: WebGL can't upload SVG images. */
  _texOf(img) {
    if (!img) return null;
    if (img.__pixiTex) return img.__pixiTex;
    const w0 = img.naturalWidth || img.width, h0 = img.naturalHeight || img.height;
    if (!w0 || !h0) return null;
    const svg = img instanceof HTMLImageElement && (/^data:image\/svg|\.svg(\?|$)/.test(img.src) || (img.src.startsWith('blob:') && !img.dataset.raster));
    let tex;
    try {
      const k = svg ? 512 / Math.max(w0, h0) : Math.min(1, 1024 / Math.max(w0, h0));
      const c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(w0 * k));
      c.height = Math.max(1, Math.round(h0 * k));
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      tex = Texture.from(c);
    } catch { return null; }
    img.__pixiTex = tex;
    return tex;
  }

  _style(u) {
    if (!u.monster) return 'hero';
    const k = u.kind || '';
    if (k === 'slime') return 'slime';
    if (['wisp', 'sprite', 'bat', 'harpy', 'lich', 'queen'].includes(k)) return 'float';
    return 'beast';
  }

  /** (Re)build the puppet from the unit's images: idle / atk / cast / hurt key poses. */
  _buildPuppet(u, force = false) {
    if (!force && u._imgs === u.imgs) return;
    u._imgs = u.imgs;
    const I = u.imgs || {};
    const M = I.meta || {};
    const pose = (img, meta) => { const tex = this._texOf(img); return tex ? { tex, sil: T.silhouette(tex), meta } : null; };
    const idle = pose(I.idle || I.normal, M.idle);
    if (!idle) return;
    const poses = { idle, atk: pose(I.atk || I.attack, M.atk), cast: pose(I.cast || (I.raster ? null : I.attack), M.cast), hurt: pose(I.hurt, M.hurt) };
    const t = idle.tex;
    // fit: full height, never wider than ~1.45x the height for creatures (dragons, krakens)
    const Hgt = Math.min(u.h, (u.h * (u.monster ? 1.45 : 1.0) * t.height) / t.width);
    if (!u.puppet) {
      u.puppet = new Puppet(poses, { height: Hgt, kind: this._style(u), phase: u.actor.phase });
      u.holder.addChild(u.puppet.node);
    } else u.puppet.setPoses(poses, Hgt);
    u.puppet.setFacing(u.flip);
    u.w = u.puppet.width * 0.9;
    u.figH = Hgt;
    u.raster = !!I.raster;
  }

  unit(id) { return this.units.get(id); }

  sync(id, hp, alive, energy, shield, statuses) {
    const u = this.units.get(id);
    if (!u) return;
    u.hp = hp; u.energy = energy; u.shield = shield;
    if (statuses) u.statuses = statuses;
    if (u.alive && !alive) this._die(u, u.lastHitDir || (u.side === 0 ? -1 : 1));
    if (!u.alive && alive) this._revive(u);
  }

  _die(u, dir = u.side === 0 ? -1 : 1) {
    u.alive = false;
    u.deathT = 0.001;
    u.actor.die({ dir });
    if (u.puppet) u.puppet.flash(1);
    const c = { fx: this.fx, view: this };
    sparks(c, u.x, u.cy, '#ffffff', 16, 520);
    glowBurst(c, u.x, u.cy, (PAL[u.element] || PAL.light)[1], 18, 260, 10, 0, 0.6);
    this.hitStop(0.06);
    // the last one standing on that side falls: finishing-blow slow motion
    if (![...this.units.values()].some((x) => x.side === u.side && x.alive)) {
      this.slowMo(0.75, 0.3);
      this.punch(u.x, u.cy, 0.1, 0.8);
      this.flash('#ffffff', 0.35, 0.3);
      this.aberrate(6, 0.4);
    }
  }

  /** Battle start: everyone runs in from their side of the field (bosses already made their entrance). */
  entrance() {
    let i = [0, 0];
    for (const u of this.units.values()) {
      if (!u.alive || u.boss) continue;
      const from = (u.side === 0 ? -1 : 1) * (this.w * 0.62 + u.w);
      u.actor.enter({ from: from - (u.side === 0 ? 1 : -1) * 0, delay: 0.06 * i[u.side]++, color: u.col, bouncy: this._style(u) === 'slime' });
      u.p = u.actor.tick(0, this.time);
    }
  }

  /** Battle over: the winners celebrate, the losers slump. */
  finale(winnerSide) {
    let i = 0;
    for (const u of this.units.values()) {
      if (!u.alive) continue;
      if (u.side === winnerSide) u.actor.victory(0.25 + 0.12 * i++);
      else if (winnerSide >= 0) u.actor.defeat(0.2);
    }
  }

  /** Unit id under a canvas point (CSS px), front-most first, or null. */
  pick(px, py) {
    let best = null;
    for (const u of this.units.values()) {
      if (!u.alive) continue;
      const x = u.x + (u.p.x || 0), y = u.y + (u.p.y || 0);
      if (Math.abs(px - x) < u.w * 0.55 && py < y + 8 && py > y - u.h * 1.02 && (!best || u.y > best.y)) best = u;
    }
    return best ? best.id : null;
  }

  /** The player tapped a unit: it reacts (a hop and an emote). */
  poke(id) {
    const u = this.units.get(id);
    if (!u || !u.alive) return false;
    const happy = u.side === 0 && !u.monster;
    if (!u.actor.poke(happy)) return false;
    const pal = PAL[u.element] || PAL.light;
    const c = { fx: this.fx, view: this };
    rising(c, u.x, u.y - u.h * 0.6, happy ? 'heart' : 'star', happy ? '#ff8ac8' : pal[1], 5, { spread: u.w * 0.6, speed: 70, size: 7, life: 0.8 });
    ring(c, u.x, u.y, pal[1], 6, u.w * 0.7, 0.35, 0, 3);
    return true;
  }

  _dustC() { return (SCENE[this.bgKey] || SCENE.plains).dust || '#e0d4b0'; }

  /** Effects requested by the choreography (frame-locked to the body motion). */
  _cues(u) {
    const Q = u.actor.cues;
    if (!Q.length) return;
    const c0 = { fx: this.fx, view: this };
    const p = u.p;
    const fx = u.x + (p.x || 0), fy = u.y + (p.y || 0);
    const H = u.figH || u.h;
    const pal = PAL[u.element] || PAL.light;
    const face = u.side === 0 ? 1 : -1;
    for (const q of Q) {
      if (this.onCue) this.onCue(u.id, q);
      switch (q.type) {
        case 'dust': dust(c0, fx, fy + 2, this._dustC(), { n: Math.round(6 * q.power), power: q.power, dir: -(q.dir || 0) }); break;
        case 'skid': dust(c0, fx, fy + 2, this._dustC(), { n: 5, power: 0.6 * (q.power || 1), dir: -(q.dir || 0) }); break;
        case 'land':
          dust(c0, fx, fy + 2, this._dustC(), { n: Math.round(4 + 6 * q.power), power: q.power });
          if (q.power >= 1) { this.shake(3 * q.power, 0.15); ring(c0, fx, fy, pal[1], 8, u.w * 0.9 * q.power, 0.35, 0, 3); }
          break;
        case 'swing': this._swing(u, q); break;
        case 'muzzle': {
          const hx = fx + face * u.w * 0.4, hy = fy - H * 0.52;
          flare(c0, hx, hy, pal[1], { size: q.heavy ? 70 : 42, dur: 0.22 });
          ring(c0, hx, hy, pal[0], 4, q.heavy ? 50 : 30, 0.22, 0, 3, 1);
          if (q.cast) c0.fx.burst(hx, hy, q.heavy ? 12 : 6, { kind: 'star', color: pal[1], speed: 160, size: 6, size1: 1, life: 0.4, drag: 3 });
          break;
        }
        case 'circle':
          magicCircle(c0, fx, fy, H * (q.heavy ? 0.85 : 0.55), pal[0], { dur: q.heavy ? 0.9 : 0.6, el: u.element, spin: 1.6 });
          rising(c0, fx, fy, 'rune', pal[1], q.heavy ? 6 : 3, { spread: u.w * 0.8, speed: 80, size: 7, life: 0.7 });
          break;
        case 'powerUp':
          converge(c0, fx, fy - H * 0.45, pal[1], { n: q.big ? 30 : 16, radius: H * (q.big ? 1.3 : 0.9), dur: 0.35 });
          ring(c0, fx, fy, pal[0], H * 0.7, 8, 0.35, 0, 3);
          break;
        case 'aura':
          glowBurst(c0, fx, fy - H * 0.45, pal[1], 18, 260, 9, 0, 0.5);
          ring(c0, fx, fy - H * 0.45, pal[1], 10, H * 0.9, 0.4, 0, 4, 1);
          break;
        case 'blink':
          ring(c0, fx, fy - H * 0.45, '#ffffff', 6, H * 0.4, 0.16, 0, 3, 1);
          sparks(c0, fx, fy - H * 0.45, pal[1], 6, 300);
          break;
        case 'vanish':
          smoke(c0, fx, fy - H * 0.35, '#1a0a24', 12);
          ring(c0, fx, fy - H * 0.4, pal[0], 6, H * 0.6, 0.25, 0, 4, 1);
          break;
        case 'quake': {
          const gx = fx + face * u.w * 0.45;
          groundCrack(c0, gx, fy, pal[0], { size: 130 * q.power, dur: 0.9, n: 8 });
          dust(c0, gx, fy + 2, this._dustC(), { n: 16, power: 1.5 * q.power });
          ring(c0, gx, fy, pal[1], 10, 160 * q.power, 0.5, 0, 6);
          this.shake(9 * q.power, 0.35);
          this.shockwave(gx, fy - 10, { amp: 22 * q.power, wave: 120 });
          break;
        }
        case 'sparkle': rising(c0, fx, fy, 'star', '#fff6c4', 10, { spread: u.w, speed: 120, size: 7 }); break;
        default:
      }
    }
    Q.length = 0;
  }

  /** Weapon trail for one swing, shaped by the weapon style and aimed through the current target. */
  _swing(u, q) {
    const c0 = { fx: this.fx, view: this };
    const pal = PAL[u.element] || PAL.light;
    const col = pal[1];
    const p = u.p;
    const H = u.figH || u.h;
    const ax = u.x + (p.x || 0), ay = u.y + (p.y || 0);
    const dir = q.dir || (u.side === 0 ? 1 : -1);
    const swoosh = (c, color, path, o = {}) => swooshFx(c, color, path, { color2: pal[0], ...o });
    const t = u.strike && u.strike.t;
    const tp = t ? t.p || {} : {};
    const tx = t ? t.x + (tp.x || 0) : ax + dir * u.w, ty = t ? t.cy + (tp.y || 0) : ay - H * 0.5;
    const mir = (a) => (dir > 0 ? a : Math.PI - a);
    const W = q.heavy ? 1.25 : 1;
    switch (q.style) {
      case 'thrust': {
        const x0 = ax + dir * u.w * 0.05, y0 = ay - H * 0.5;
        const x1 = q.through ? tx + dir * 170 : tx + dir * (t ? t.w * 0.65 : 40), y1 = ty;
        swoosh(c0, col, bezPath(x0, y0, (x0 + x1) / 2, Math.min(y0, y1) - 8, x1, y1), { width: 20 * W * (q.big ? 1.8 : 1), dur: q.big ? 0.34 : 0.17, lead: 0.32 });
        if (q.big) swoosh(c0, '#ffffff', bezPath(x0, y0 + 6, (x0 + x1) / 2, y0, x1, y1 + 6), { width: 8, dur: 0.3, lead: 0.3, glow: false, delay: 0.03 });
        break;
      }
      case 'dagger': {
        const L = (t ? t.h : H) * 0.34;
        const s2 = q.i % 2 ? -1 : 1;
        swoosh(c0, col, bezPath(tx - dir * L, ty - L * 0.85 * s2, tx + dir * L * 0.25, ty - L * 0.15 * s2, tx + dir * L, ty + L * 0.8 * s2), { width: 18 * W, dur: 0.16, lead: 0.4 });
        break;
      }
      case 'smash':
      case 'chop': {
        const cx = ax + dir * u.w * 0.1, cy = ay - H * 0.62;
        const gy = t ? t.y + (tp.y || 0) - 6 : ay;
        const R = Math.max(H * 0.55, Math.hypot(tx - cx, gy - cy) * 0.92);
        const [a0, a1] = q.style === 'chop' ? [-2.25, 0.95] : [-1.95, 1.3];
        swoosh(c0, col, arcPath(cx, cy, R, R, mir(a0), mir(a1)), { width: (q.big ? 54 : 36) * W, dur: 0.24, lead: 0.42, center: [cx, cy] });
        break;
      }
      case 'whirl': {
        const cx = ax, cy = ay - H * 0.45;
        swoosh(c0, col, arcPath(cx, cy, u.w * 1.15, u.w * 0.45, mir(-1.6), mir(-1.6 + TAU * 2)), { width: 28, dur: q.dur || 0.3, lead: 0.92, lag: 0.22, center: [cx, cy], segs: 56 });
        swoosh(c0, '#ffffff', arcPath(cx, cy - 6, u.w * 0.95, u.w * 0.36, mir(-1.2), mir(-1.2 + TAU * 2)), { width: 12, dur: q.dur || 0.3, lead: 0.92, lag: 0.16, center: [cx, cy], segs: 56, glow: false });
        break;
      }
      case 'bash':
        ring(c0, ax + dir * u.w * 0.4, ay - H * 0.45, pal[1], 6, H * 0.45, 0.2, 0, 5, 1.6);
        break;
      case 'beast':
      case 'slam':
        break;
      default: { // sword: alternating crescents pivoting on the shoulder, reaching just past the target
        const cx = ax - dir * u.w * 0.05, cy = ay - H * 0.52;
        const R = Math.hypot(tx - cx, ty - cy) + 16;
        const V = [[-1.75, 1.0], [1.15, -1.45], [-0.5, 1.75], [1.9, -0.85]];
        let [a0, a1] = V[q.i % V.length];
        if (q.big) [a0, a1] = [-2.6, 2.1];
        swoosh(c0, col, arcPath(cx, cy, R, R * 0.82, mir(a0), mir(a1)), { width: (q.big ? 48 : 30) * W, dur: q.big ? 0.3 : 0.22, lead: 0.4, center: [cx, cy] });
        if (q.big || (q.final && q.heavy)) swoosh(c0, '#ffffff', arcPath(cx, cy, R * 0.86, R * 0.7, mir(a0 + 0.2), mir(a1 - 0.1)), { width: 10, dur: 0.24, lead: 0.42, center: [cx, cy], glow: false, delay: 0.02 });
      }
    }
  }

  _revive(u) {
    u.alive = true;
    u.deathT = 0;
    u.actor.revive();
    u.holder.filters = null;
    u.dissolve = null;
  }

  // ---------------------------------------------------------------- camera & post
  shake(a, dur = 0.25, delay = 0) {
    if (delay > 0) { setTimeout(() => !this.dead && this.shake(a, dur), delay * 1000); return; }
    if (a >= this.shakeA * (this.shakeT / (this.shakeDur || 1))) { this.shakeA = a; this.shakeT = dur; this.shakeDur = dur; }
  }
  flash(color, a = 0.5, dur = 0.25, delay = 0) { this.flashes.push({ color: T.hexNum(color), a, dur, t: -delay }); }
  dim(a = 0.6, dur = 1) { this.dimA = Math.max(this.dimA, a); this.dimT = Math.max(this.dimT, dur); }
  /** Brief freeze on a heavy hit (sim keeps running; only visuals pause). */
  hitStop(dur = 0.07, delay = 0) {
    if (delay > 0) { setTimeout(() => !this.dead && this.hitStop(dur), delay * 1000); return; }
    this.slow = Math.max(this.slow, dur); this.slowK = 0.04;
  }
  slowMo(dur = 0.5, k = 0.35, delay = 0) {
    if (delay > 0) { setTimeout(() => !this.dead && this.slowMo(dur, k), delay * 1000); return; }
    this.slow = Math.max(this.slow, dur); this.slowK = k;
  }
  /** Zoom the camera toward a point: amt = extra scale (0.15 = 115%), held for `dur` then eased back. */
  punch(x, y, amt = 0.12, dur = 0.5, delay = 0) {
    if (delay > 0) { setTimeout(() => !this.dead && this.punch(x, y, amt, dur), delay * 1000); return; }
    Object.assign(this.cam, { fx: x, fy: y, amt, t: 0, dur });
  }
  shockwave(x, y, { amp = 26, wave = 120, speed = 900, radius = -1, delay = 0, dur = 0.8 } = {}) {
    if (!this.high) return;
    if (delay > 0) { setTimeout(() => !this.dead && this.shockwave(x, y, { amp, wave, speed, radius, dur }), delay * 1000); return; }
    if (this.waves.length >= 3) this.waves.shift();
    const f = new ShockwaveFilter({ center: { x: 0, y: 0 }, amplitude: amp, wavelength: wave, speed, brightness: 1.15, radius, time: 0 });
    this.waves.push({ f, x, y, t: 0, dur });
  }
  aberrate(a = 6, dur = 0.35, delay = 0) {
    if (delay > 0) { setTimeout(() => !this.dead && this.aberrate(a, dur), delay * 1000); return; }
    Object.assign(this.chroma, { t: 0, dur, a: Math.max(a, this.chroma.t < this.chroma.dur ? this.chroma.a : 0) });
  }
  radialBlur(x, y, a = 0.12, dur = 0.4, delay = 0) {
    if (!this.high) return;
    if (delay > 0) { setTimeout(() => !this.dead && this.radialBlur(x, y, a, dur), delay * 1000); return; }
    Object.assign(this.zoomFx, { t: 0, dur, a, x, y });
  }

  // ---------------------------------------------------------------- events
  event(e, sideOfViewer = 0) {
    const U = (id) => this.units.get(id);
    const c0 = { fx: this.fx, view: this };
    switch (e.k) {
      case 'act': {
        const u = U(e.u);
        if (!u) return;
        const tg = (e.tg || []).map(U).filter(Boolean);
        const dir = u.side === 0 ? 1 : -1;
        const skill = e.a === 'skill';
        const t0 = tg[0];
        const melee = !!t0 && t0.side !== u.side && (e.melee || (skill && MELEE_VFX.has(e.vfx)));
        let release = 0;
        if (melee) {
          const style = meleeStyle(e.vfx, u.monster && BEAST_VFX.has(e.vfx) ? u.kind || 'beast' : null);
          const side = Math.sign(t0.x - u.x) || dir;
          let tx = t0.x - side * (t0.w * 0.5 + u.w * meleeReach(style)), ty = t0.y + 2;
          if (u.boss) { tx = u.x + (tx - u.x) * 0.35; ty = u.y + (ty - u.y) * 0.35; } // giants lunge, they don't run
          u.strike = { t: t0, style, side, heavy: skill, until: this.time + e.impact + (e.hits || 1) * 0.13 + 0.2 };
          u.actor.melee({ dx: tx - u.x, dy: ty - u.y, impact: e.impact, hits: e.hits || 1, spacing: skill ? 0.12 : 0.13, dir: side, color: u.col, style, heavy: skill });
        } else {
          const caster = skill || (!u.monster && /caster|healer|support/.test(u.role || ''));
          release = skill ? 0.3 : Math.min(0.24, e.impact * 0.5);
          u.strike = null;
          u.actor.shoot({ release, dir, cast: caster, color: u.col, heavy: skill });
        }
        if (skill) {
          this._skillName(u, e.name);
          if (t0 && t0.side !== u.side) this.punch((u.x + t0.x) / 2, (u.cy + t0.cy) / 2, 0.035, 0.45, Math.max(0, e.impact - 0.1));
        }
        playVfx(e.vfx, { fx: this.fx, view: this, src: u, tg, el: u.element, kind: e.a, impact: e.impact, hits: e.hits || 1, melee: e.melee, release, actorSwings: melee });
        break;
      }
      case 'ult': {
        const u = U(e.u);
        if (!u) return;
        u.actor.charge();
        ultCharge({ fx: this.fx, view: this, src: u, tg: [], el: u.element });
        this.punch(u.x, u.cy, 0.06, 1.0);
        break;
      }
      case 'ultFire': {
        const u = U(e.u);
        if (!u) return;
        const tg = (e.tg || []).map(U).filter(Boolean);
        const dir = u.side === 0 ? 1 : -1;
        const kind = u.monster ? 'leap' : ultStyle(e.vfx);
        const hits = e.hits || 1;
        const spot = (t, k = 0.25) => ({ dx: t.x - Math.sign(t.x - u.x || dir) * (t.w * 0.5 + u.w * k) - u.x, dy: t.y + 2 - u.y });
        const path = [];
        const foes = tg.filter((t) => t.side !== u.side);
        if (foes.length) {
          if (kind === 'rush') for (let h = 0; h < hits; h++) path.push({ t: 0.18 + h * 0.16, ...spot(foes[h % foes.length]) });
          else if (kind === 'spin') { const f = foes.reduce((a, b) => (Math.abs(b.x - u.x) < Math.abs(a.x - u.x) ? b : a)); path.push({ t: 0.12, ...spot(f, 0.6) }); }
          else path.push({ t: 0.18, ...spot(foes[0], kind === 'flurry' ? 0.05 : 0.25) });
          u.strike = { t: foes[0], style: kind === 'iai' ? 'thrust' : 'slash', side: dir, heavy: true, until: this.time + 1.6 };
        }
        u.actor.ultimate({ dir, color: u.col, kind: path.length || kind === 'slam' || kind === 'leap' ? kind : 'leap', path, final: 0.18 + hits * 0.16 });
        u.ultUntil = this.time + 1.4;
        // the rest of the team cheers the big moment
        let n = 0;
        for (const a of this.units.values()) if (a !== u && a.side === u.side && a.alive) a.actor.cheer(0.15 + 0.08 * n++);
        playVfx(e.vfx, { fx: this.fx, view: this, src: u, tg, el: u.element, kind: 'ult', impact: 0.18, hits, actorMoves: kind !== 'leap' });
        break;
      }
      case 'chargeBlast': {
        const u = U(e.u);
        if (!u) return;
        const tg = [...this.units.values()].filter((x) => x.side !== u.side && x.alive);
        u.charge = 0;
        u.actor.shoot({ release: 0.3, dir: u.side === 0 ? 1 : -1, cast: true, color: 0xff4a3a });
        u.ultUntil = this.time + 1.2;
        playVfx(e.vfx, { fx: this.fx, view: this, src: u, tg, el: u.element, kind: 'charge', impact: 0.35, hits: 1 });
        this.flash('#ff2a2a', 0.4, 0.35, 0.3);
        this.aberrate(10, 0.5, 0.3);
        break;
      }
      case 'dmg': {
        const u = U(e.u);
        if (!u) return;
        u.hp = e.hp;
        if (e.dot) { this._float(u, e.v, e.dot === 'burn' ? '#ffa04a' : '#b8e85a', 0.8); break; }
        const src = U(e.s);
        const dir = src ? Math.sign(u.x - src.x) || (u.side === 0 ? -1 : 1) : (u.side === 0 ? -1 : 1);
        const big = !!(src && src.ultUntil > this.time);
        // a weapon blow from a fighter who is mid-swing on this very target
        const st = src && src.strike && src.strike.t === u && src.strike.until > this.time ? src.strike : null;
        const heavyStyle = st && (st.style === 'smash' || st.style === 'slam' || st.style === 'chop');
        const power = (e.crit ? 1.5 : 1) * (big ? 1.25 : 1) * (heavyStyle ? 1.2 : 1);
        if (u.alive && e.hp > 0) u.actor.hit({ dir, power });
        u.lastHitDir = dir;
        if (u.puppet) u.puppet.flash(e.crit || big ? 0.68 : 0.5);
        // hit-stop: both fighters freeze for a few frames while the target shudders
        const hs = st ? (e.crit ? 0.09 : 0.06) : e.crit ? 0.06 : 0.03;
        u.hs = Math.max(u.hs || 0, hs);
        u.shudder = hs;
        if (st) src.hs = Math.max(src.hs || 0, hs * 0.85);
        const foe = u.side !== sideOfViewer;
        this._float(u, e.v, e.crit ? '#ffd84a' : foe ? '#ffffff' : '#ff8a8a', e.crit ? 1.4 : 1, e.crit ? '暴擊' : foe && e.el > 0 ? '弱點' : foe && e.el < 0 ? '抵抗' : '', dir);
        if (e.sh) this._float(u, e.sh, '#7ae0ff', 0.8, '吸收', dir);
        // contact flash on the side facing the attacker, spraying along the blow
        const pal = PAL[(src && src.element) || 'light'] || PAL.light;
        const hx = u.x + (u.p.x || 0) - dir * u.w * 0.16, hy = u.cy + (u.p.y || 0) + (st && heavyStyle ? u.h * 0.1 : 0);
        const ang = st ? (heavyStyle ? Math.atan2(0.9, 0.45 * dir) : st.style === 'thrust' || st.style === 'bash' ? (dir > 0 ? 0 : Math.PI) : Math.atan2(0.55, 0.85 * dir))
          : src ? Math.atan2(u.cy - src.cy, u.x - src.x) : 0;
        hitSpark(c0, hx, hy, e.crit ? '#ffe9a0' : pal[1], { size: (e.crit ? 84 : st ? 60 : 44) * (big ? 1.2 : 1), angle: ang, power: e.crit ? 1.3 : st ? 1 : 0.75 });
        if (heavyStyle) {
          groundCrack(c0, u.x + (u.p.x || 0), u.y, pal[0], { size: 70 * power, dur: 0.6 });
          dust(c0, u.x + (u.p.x || 0), u.y + 2, this._dustC(), { n: 10, power: 1.2 });
          this.shake(5 * power, 0.2);
        } else this.shake(e.crit ? 5 : st ? 2.5 : 1.5, 0.12);
        if (e.crit) { this.hitStop(0.05); this.aberrate(4, 0.2); }
        break;
      }
      case 'heal': {
        const u = U(e.u);
        if (!u || e.v <= 0) return;
        u.hp = e.hp;
        if (!e.regen || e.v > u.maxHp * 0.03) this._float(u, '+' + e.v, '#5aff9a', e.regen ? 0.75 : 1);
        if (!e.regen && u.alive) { u.actor.cheer(0.05); if (u.puppet) u.puppet.flash(0.25); } // relieved little bounce
        break;
      }
      case 'shield': { const u = U(e.u); if (u) u.shield = e.total; break; }
      case 'status': {
        const u = U(e.u);
        if (!u) return;
        u.statuses = e.list || [];
        u.actor.stunned = u.statuses.includes('stun');
        u.actor.frozen = u.statuses.includes('freeze');
        if (e.add === 'stun' || e.add === 'freeze') ring(c0, u.x, u.y - u.h, e.add === 'freeze' ? '#9ee0ff' : '#ffd84a', 4, 26, 0.4, 0, 3, 0.4);
        // buffs: the unit straightens up with a glint; debuffs: it sags for a moment
        const sd = e.add && STATUS[e.add];
        if (sd && sd[2] && u.alive) {
          if (sd[2] > 0) { u.actor.cheer(0); rising(c0, u.x, u.y, 'spark', sd[0], 6, { spread: u.w * 0.7, speed: 150, size: 6, life: 0.5 }); }
          else { u.actor.hit({ dir: 0, power: 0.35 }); rising(c0, u.x, u.y - u.h * 0.8, 'glow', sd[0], 4, { spread: u.w * 0.5, speed: -60, size: 5, life: 0.5 }); }
        }
        break;
      }
      case 'death': { const u = U(e.u); if (u && u.alive) this._die(u, u.lastHitDir || (u.side === 0 ? -1 : 1)); break; }
      case 'revive': {
        const u = U(e.u);
        if (u) { this._revive(u); u.hp = e.hp; rising(c0, u.x, u.y, 'star', '#fff6c4', 18); ring(c0, u.x, u.y, '#fff6c4', 10, 80, 0.6); }
        break;
      }
      case 'charge': { const u = U(e.u); if (u) { u.charge = e.dur; u.chargeNeed = e.need; u.chargeProg = 0; u.actor.charge(); } break; }
      case 'chargeProg': {
        const u = U(e.u);
        if (u) {
          if (e.n > u.chargeProg) { glowBurst(c0, u.x, u.cy, '#ffd84a', 10, 220, 8); this.shake(3, 0.1); }
          u.chargeProg = e.n;
        }
        break;
      }
      case 'break': {
        const u = U(e.u);
        if (!u) return;
        u.charge = 0;
        u.actor.reset();
        u.actor.hit({ dir: u.side === 0 ? -1 : 1, power: 2.2 });
        if (u.puppet) u.puppet.flash(1);
        this.flash('#ffffff', 0.75, 0.35);
        this.shake(14, 0.45);
        this.hitStop(0.12);
        this.punch(u.x, u.cy, 0.12, 0.6);
        this.shockwave(u.x, u.cy, { amp: 34, wave: 140 });
        this.aberrate(12, 0.45);
        glowBurst(c0, u.x, u.cy, '#ffd84a', 50, 560, 15, 0, 0.9);
        ring(c0, u.x, u.cy, '#ffffff', 10, 240, 0.7, 0, 10, 0.8);
        sparks(c0, u.x, u.cy, '#fff2c0', 30, 700);
        this._float(u, '破防！', '#ffd84a', 2);
        break;
      }
      default:
    }
  }

  _skillName(u, name) {
    if (!name) return;
    const t = new Text({ text: name, style: { fontFamily: '"Noto Sans TC", sans-serif', fontWeight: '900', fontSize: 13, fill: '#fff2c4', stroke: { color: '#1a0e30', width: 4, join: 'round' } } });
    t.anchor.set(0.5);
    const bg = new Graphics().roundRect(-t.width / 2 - 10, -12, t.width + 20, 24, 6).fill({ color: 0x0a061c, alpha: 0.82 }).stroke({ color: 0xf6d27a, width: 1, alpha: 0.85 });
    const node = new Container();
    node.addChild(bg, t);
    node.position.set(u.x, u.y - u.h - 24);
    this.hud.addChild(node);
    this.floats.push({ node, t: 0, life: 1.1, banner: true, y0: node.y });
  }

  _float(u, v, color, size = 1, label = '', dir = 0) {
    const n = this.floats.filter((f) => f.u === u && f.t < 0.3).length;
    const fs = Math.round(18 * size);
    const node = new Container();
    const t = new Text({ text: String(v), style: FLOAT_STYLE(color, fs) });
    t.anchor.set(0.5);
    node.addChild(t);
    if (label) {
      const lc = label === '暴擊' ? '#ffb84a' : label === '弱點' ? '#ff6a4a' : '#9ad8ff';
      const l = new Text({ text: label, style: { ...FLOAT_STYLE(lc, Math.round(10 + size * 3)), fontFamily: '"Noto Sans TC", sans-serif' } });
      l.anchor.set(0.5);
      l.y = -fs * 0.85;
      node.addChild(l);
    }
    node.position.set(u.x + (Math.random() - 0.5) * u.w * 0.5, u.cy - u.h * 0.15 - n * 18);
    this.hud.addChild(node);
    if (size >= 1.3) { // critical: a spinning star burst behind the number
      const star = new Sprite(T.flareTex('#ffd84a'));
      star.anchor.set(0.5); star.blendMode = 'add'; star.alpha = 0.85;
      star.scale.set((fs * 4) / 256);
      node.addChildAt(star, 0);
      node.star = star;
    }
    const dx = dir || (Math.random() < 0.5 ? -1 : 1);
    this.floats.push({ u, node, t: 0, life: 0.9 + size * 0.2, y0: node.y, x0: node.x, vx: dx * (26 + Math.random() * 30), vy: -150 - Math.random() * 40 - size * 40 });
  }

  // ---------------------------------------------------------------- per-frame
  update(dt) {
    this.time += dt;
    let k = 1;
    if (this.slow > 0) { this.slow -= dt; k = this.slowK; }
    const fdt = (this.frozen ? dt * 0.25 : dt) * k;
    const unitDt = (this.frozen ? dt * 0.08 : dt) * k;
    this.fx.update(fdt);
    this.amb.update(dt);
    for (const u of this.units.values()) {
      if (u._imgs !== u.imgs) this._buildPuppet(u);
      // per-unit hit-stop; afterwards the unit runs a little fast until its choreography is back in sync
      let ud = unitDt;
      if (u.hs > 0) { u.hs = Math.max(0, u.hs - dt); u.debt = (u.debt || 0) + ud; ud = 0; }
      else if (u.debt > 0) { const extra = Math.min(u.debt, ud * 0.6); u.debt -= extra; ud += extra; }
      const px0 = u.p.x || 0, py0 = u.p.y || 0;
      u.p = u.actor.tick(ud, this.time);
      this._cues(u);
      if (u.alive && ud > 0) {
        u.fidgetT = (u.fidgetT ?? 2 + Math.random() * 4) - ud;
        if (u.fidgetT <= 0) { u.fidgetT = 3.5 + Math.random() * 5; u.actor.fidget(u.side === 0 ? 1 : -1); }
      }
      if (u.puppet) {
        if (u.p.pose !== u.puppet.cur) u.puppet.pose(u.p.pose, u.p.pose === 'idle' ? null : u.col);
        if (u.p.ghost != null) u.puppet.ghost(u.p.ghost, 0.36);
        u.puppet.tint = u.actor.frozen ? 0xa8e8ff : 0xffffff;
        u.puppet.update(ud, this.time, u.p);
      }
      // motion blur + speed lines while dashing
      if (this.high && dt > 0 && !u.dissolve) {
        const vx = ((u.p.x || 0) - px0) / dt, vy = ((u.p.y || 0) - py0) / dt;
        const sp = Math.abs(vx);
        if (sp > 700) { // horizontal dashes only: hops and recoils stay crisp
          if (!u.mb) u.mb = new MotionBlurFilter({ velocity: { x: 0, y: 0 }, kernelSize: 9, offset: 0 });
          const k = Math.min(1, (sp - 700) / 900) * dt * 0.6;
          u.mb.velocity = { x: clamp(vx * k, -22, 22), y: clamp(vy * k * 0.5, -10, 10) };
          if (!u.holder.filters || u.holder.filters[0] !== u.mb) u.holder.filters = [u.mb];
          if (Math.random() < 0.7) {
            const H = u.figH || u.h;
            this.fx.emit({ x: u.x + u.p.x - vx * 0.03 + (Math.random() - 0.5) * 20, y: u.y + u.p.y - H * (0.15 + Math.random() * 0.7), vx: -vx * 0.3, vy: -vy * 0.3, kind: 'spark', color: '#ffffff', size: 3, size1: 1, life: 0.16, stretch: 0.07, a0: 0.55 });
          }
        } else if (u.holder.filters && u.holder.filters[0] === u.mb) u.holder.filters = null;
      }
      if (u.charge > 0) {
        u.charge = Math.max(0, u.charge - unitDt);
        if (Math.random() < 0.7) {
          const a = Math.random() * 6.28, d = u.w * (0.7 + Math.random() * 0.5);
          this.fx.emit({ x: u.x + Math.cos(a) * d, y: u.cy + Math.sin(a) * d * 0.7, vx: -Math.cos(a) * d * 2.2, vy: -Math.sin(a) * d * 1.5, kind: 'spark', color: '#ff4a3a', size: 7, life: 0.45, stretch: 0.04 });
        }
      }
      // ultimate ready: rising sparkles on the player's heroes
      if (u.alive && u.side === 0 && u.energy >= 1000 && Math.random() < dt * 6) {
        this.fx.emit({ x: u.x + (Math.random() - 0.5) * u.w * 0.7, y: u.y - Math.random() * u.h * 0.3, vy: -60 - Math.random() * 60, kind: 'star', color: '#ffe08a', size: 5, life: 0.8 });
      }
      // knocked out: topple, then burn away with a glowing dissolve and a column of light motes
      if (!u.alive && u.deathT > 0) {
        u.deathT += unitDt;
        if (u.deathT > 0.55) {
          if (!u.dissolve) {
            const c = (PAL[u.element] || PAL.light)[1];
            const [r, g, b] = T.rgb(c);
            u.dissolve = dissolveFilter([r / 255, g / 255, b / 255]);
            if (u.mb) u.holder.filters = null;
            u.holder.filters = [u.dissolve];
            rising({ fx: this.fx, view: this }, u.x + (u.p.x || 0), u.y - 10, 'glow', c, 20, { spread: u.w * 0.8, speed: 150, size: 8, life: 1.1 });
            rising({ fx: this.fx, view: this }, u.x + (u.p.x || 0), u.y - 10, 'spark', '#ffffff', 10, { spread: u.w * 0.6, speed: 220, size: 6 });
          }
          u.dissolve.progress = Math.min(1, (u.deathT - 0.55) / 0.85);
          if (u.dissolve.progress < 0.95 && Math.random() < 0.8) {
            const rr = u.p.rot || 0, H = u.figH || u.h, k = Math.random();
            const bx = u.x + (u.p.x || 0) + Math.sin(rr) * H * k, by = u.y + (u.p.y || 0) - Math.cos(rr) * H * k;
            this.fx.emit({ x: bx + (Math.random() - 0.5) * u.w * 0.4, y: by + (Math.random() - 0.5) * 12, vx: (Math.random() - 0.5) * 30, vy: -60 - Math.random() * 80, kind: 'glow', color: (PAL[u.element] || PAL.light)[1], size: 4 + Math.random() * 4, size1: 1, life: 0.7 + Math.random() * 0.4 });
          }
        }
      }
    }
    for (const u of this.units.values()) if (u.gt > 0) u.gt = Math.max(0, u.gt - dt);
    for (const f of this.floats) f.t += dt;
    for (let i = this.floats.length - 1; i >= 0; i--) {
      const f = this.floats[i];
      if (f.t >= f.life) { f.node.destroy({ children: true }); this.floats.splice(i, 1); }
    }
    this.shakeT = Math.max(0, this.shakeT - dt);
    for (const f of this.flashes) f.t += dt;
    this.flashes = this.flashes.filter((f) => f.t < f.dur);
    this.dimT = Math.max(0, this.dimT - dt);
    if (this.dimT <= 0) this.dimA = Math.max(0, this.dimA - dt * 2);
    this.cam.t += dt;
    for (const w of this.waves) w.t += dt;
    this.waves = this.waves.filter((w) => w.t < w.dur);
    this.chroma.t += dt;
    this.zoomFx.t += dt;
    this._ambient(dt);
  }

  _ambient(dt) {
    const B = BG[this.bgKey];
    const sc = SCENE[this.bgKey] || {};
    if (this.amb.parts.length > (this.high ? 70 : 30) || Math.random() > dt * (this.high ? 22 : 12)) return;
    const W = this.w, H = this.h;
    const k = B.amb;
    if (sc.embers && Math.random() < 0.5) {
      this.amb.emit({ x: Math.random() * W, y: H + 6, vx: (Math.random() - 0.5) * 30, vy: -40 - Math.random() * 60, kind: 'glow', color: '#ff8a3a', size: 2 + Math.random() * 3, size1: 1, life: 3 + Math.random() * 2, a0: 0.9, a1: 0, fadeIn: 0.4 });
      return;
    }
    if (k === 'snow' || k === 'feather' || k === 'leaf') this.amb.emit({ x: Math.random() * W, y: -8, vx: -14 + Math.random() * 28, vy: 30 + Math.random() * 30, kind: k, color: B.ambC, size: k === 'snow' ? 3 : 5, size1: 3, life: H / 40, a0: 0.85, a1: 0.4, vr: 2, blend: 'normal' });
    else this.amb.emit({ x: Math.random() * W, y: H * (0.35 + Math.random() * 0.65), vx: (Math.random() - 0.5) * 10, vy: -12 - Math.random() * 18, kind: k === 'bubble' ? 'bubble' : k === 'star' ? 'star' : 'glow', color: B.ambC, size: 3 + Math.random() * 3, size1: 1, life: 3 + Math.random() * 2, a0: 0.75, a1: 0, fadeIn: 0.6 });
  }

  _drawUnit(u) {
    const n = u.node;
    const p = u.p || {};
    n.visible = u.alive || u.deathT < 1.5;
    u.bar.visible = u.icons.visible = u.alive;
    if (!n.visible) return;
    n.zIndex = u.y + (u.strike && u.actor.busy > 0 ? 2 : 0);
    const shud = u.hs > 0 && u.shudder ? (Math.floor(this.time * 60) % 2 ? 1 : -1) * 3 * (u.hs / u.shudder) : 0;
    let gx = 0, gy = 0;
    if (u.gt > 0) { const k = ease.inOut(u.gt / 0.35); gx = u.gx * k; gy = u.gy * k; }
    n.position.set(u.x + shud + gx, u.y + gy);
    const px = p.x || 0, py = p.y || 0;
    // shadow stays on the ground, shrinking as the puppet leaves it
    const lift = Math.max(0, -py);
    const sh = Math.max(0.35, 1 - lift / 100);
    u.shadow.position.set(px, 3);
    u.shadow.scale.set((u.w * 1.05 * sh) / 128, (u.w * 0.5 * sh) / 64);
    u.shadow.alpha = (u.alive ? 0.9 : Math.max(0, 0.9 - u.deathT)) * (0.4 + 0.6 * sh);
    // aura: boss charge (red, pulsing), ultimate ready, or the glow of a power move
    const ready = u.alive && u.side === 0 && u.energy >= 1000;
    const g = p.glow || 0;
    if (u.charge > 0 && u.alive) {
      u.aura.texture = T.glowTex('#ff2a2a', 0.05);
      u.aura.alpha = 0.55 + 0.3 * Math.sin(this.time * 14);
      u.aura.scale.set((u.w * 2.4) / 128, (u.h * 1.5) / 128);
    } else if (g > 0.02 || ready) {
      u.aura.texture = T.glowTex((PAL[u.element] || PAL.light)[0], 0.05);
      u.aura.alpha = Math.max(ready ? 0.35 + 0.2 * Math.sin(this.time * 5) : 0, Math.min(1, g * 0.75));
      const k = 1 + g * 0.35;
      u.aura.scale.set((u.w * 1.9 * k) / 128, (u.h * 1.35 * k) / 128);
    } else u.aura.alpha = 0;
    u.aura.position.set(px, py);
    // shield bubble
    const gs = u.shieldG;
    gs.clear();
    if (u.shield > 1 && u.alive) {
      const a = 0.45 + 0.15 * Math.sin(this.time * 4 + (u.actor.phase || 0));
      gs.ellipse(px, -u.h * 0.45 + py, u.w * 0.55, u.h * 0.58).fill({ color: 0x7ae0ff, alpha: 0.08 }).stroke({ color: 0x9ae8ff, width: 2, alpha: a });
    }
    // status particles
    const st = u.statuses || [];
    const wx = u.x + px + gx, wy = u.y + py + gy;
    if (u.alive) {
      if (st.includes('burn') && Math.random() < 0.3) this.fx.emit({ x: wx + (Math.random() - 0.5) * u.w * 0.5, y: u.cy + py + u.h * 0.2, vy: -70, kind: 'flame', color: '#ff7a2a', size: 7, life: 0.5 });
      if (st.includes('poison') && Math.random() < 0.15) this.fx.emit({ x: wx + (Math.random() - 0.5) * u.w * 0.5, y: u.cy + py, vy: -40, kind: 'bubble', color: '#9ad83a', size: 4, life: 0.7 });
      if (st.includes('regen') && Math.random() < 0.1) this.fx.emit({ x: wx + (Math.random() - 0.5) * u.w * 0.5, y: wy - 10, vy: -50, kind: 'glow', color: '#5aff9a', size: 4, life: 0.8 });
      if (st.includes('stun') && Math.random() < 0.25) {
        const a = this.time * 5;
        this.fx.emit({ x: wx + Math.cos(a) * u.w * 0.25, y: wy - u.h - 2 + Math.sin(a) * 4, kind: 'star', color: '#ffd84a', size: 6, life: 0.25 });
      }
    }
    this._drawHud(u, wx, wy + (this.frozen ? 0 : Math.sin(this.time * 2.2 + (u.actor.phase || 0)) * 1.2));
  }

  _drawHud(u, x, y) {
    // HP lives in the hero cards (bottom) and the enemy gauge (top of the field): nothing is drawn over the
    // characters except status icons and a charging boss's break pips
    const g = u.bar;
    g.clear();
    if (!u.alive) return;
    const top = y - (u.figH || u.h) - 6;
    if (u.charge > 0 && u.chargeNeed) {
      const n = u.chargeNeed;
      for (let i = 0; i < n; i++) {
        const px = x - (n - 1) * 12 + i * 24, py = top - 22;
        g.poly([px, py - 9, px + 8, py, px, py + 9, px - 8, py]).fill({ color: i < u.chargeProg ? 0xffd84a : 0x000000, alpha: i < u.chargeProg ? 1 : 0.6 }).stroke({ color: 0xffd84a, width: 2 });
      }
    }
    const icons = (u.statuses || []).filter((s2) => s2 !== 'regen').slice(0, 5);
    const ic = u.icons;
    while (ic.children.length < icons.length) { const sp = new Sprite(Texture.EMPTY); sp.width = sp.height = 14; ic.addChild(sp); }
    const x0 = x - (icons.length * 15) / 2;
    ic.children.forEach((sp, i) => {
      sp.visible = i < icons.length;
      if (!sp.visible) return;
      sp.texture = statusTex(icons[i]);
      sp.width = sp.height = 14;
      sp.position.set(x0 + i * 15, top - 14);
    });
  }

  draw(sideFever = [false, false]) {
    if (!this.app || this.dead) return;
    // camera: shake + punch-in zoom toward a focus point
    let ox = 0, oy = 0;
    if (this.shakeT > 0) {
      const k = this.shakeT / (this.shakeDur || 1);
      ox = (Math.random() - 0.5) * this.shakeA * 2 * k;
      oy = (Math.random() - 0.5) * this.shakeA * 2 * k;
    }
    const C = this.cam;
    let z = 0;
    if (C.dur > 0 && C.t < C.dur + 0.45) {
      if (C.t < 0.14) z = ease.outCubic(C.t / 0.14);
      else if (C.t < C.dur) z = 1;
      else z = 1 - ease.inOut((C.t - C.dur) / 0.45);
    }
    const s = 1 + C.amt * z;
    const px = C.fx * (1 - s), py = C.fy * (1 - s);
    for (const layer of [this.world, this.hud]) {
      layer.scale.set(s);
      layer.position.set(px + ox, py + oy);
    }
    // background drift + scene light
    if (this.bgBase) {
      const d = 1 + 0.015 * Math.sin(this.time * 0.13);
      this.bgSprite.scale.set(this.bgBase * d);
      this.bgSprite.x = this.w / 2 + Math.sin(this.time * 0.09) * this.w * 0.012;
    }
    const sc = SCENE[this.bgKey] || SCENE.plains;
    this.fog.alpha = sc.fog * (this.high ? 1 : 0.6);
    this.fog.tilePosition.x = this.time * 9;
    this.fog.tilePosition.y = Math.sin(this.time * 0.2) * 12;
    this.rays.alpha = sc.rays * (0.75 + 0.25 * Math.sin(this.time * 0.7));
    this.rays.rotation = Math.sin(this.time * 0.1) * 0.05;
    this.groundShade.alpha = this.painted ? 0.85 : 0.4;
    // units
    for (const u of this.units.values()) this._drawUnit(u);
    // floats
    for (const f of this.floats) {
      const k = f.t / f.life;
      if (f.banner) {
        f.node.alpha = k < 0.75 ? 1 : 1 - (k - 0.75) / 0.25;
        f.node.y = f.y0 - ease.out(Math.min(1, k * 4)) * 6;
        continue;
      }
      // numbers pop (overshoot), then fly out in a small arc and fade
      const pop = f.t < 0.08 ? 0.3 + 1.1 * ease.outCubic(f.t / 0.08) : f.t < 0.2 ? 1.4 - 0.4 * ease.out((f.t - 0.08) / 0.12) : 1;
      f.node.scale.set(pop);
      const tt = Math.min(f.t, 0.55);
      f.node.x = f.x0 + f.vx * tt;
      f.node.y = f.y0 + f.vy * tt + 420 * tt * tt;
      f.node.alpha = k < 0.7 ? 1 : 1 - (k - 0.7) / 0.3;
      if (f.node.star) { f.node.star.rotation = f.t * 2; f.node.star.alpha = 0.85 * (1 - k); }
    }
    // dim (between units and effects so the effects stay bright)
    this.dimG.clear();
    if (this.dimA > 0.01) this.dimG.rect(-this.w, -this.h, this.w * 3, this.h * 3).fill({ color: 0x04020c, alpha: this.dimA * (this.dimT > 0 ? 1 : 0.6) });
    // fever glow
    for (let i = 0; i < 2; i++) this.feverG[i].alpha = sideFever[i] ? 0.4 + 0.15 * Math.sin(this.time * 8) : 0;
    // flashes
    const fg = this.flashG;
    fg.clear();
    for (const f of this.flashes) {
      if (f.t < 0) continue;
      const k = f.t / f.dur;
      fg.rect(0, 0, this.w, this.h).fill({ color: f.color, alpha: f.a * (1 - ease.in(k)) });
    }
    // post effects on the world
    const filters = [];
    for (const w of this.waves) {
      const p = this.world.toGlobal({ x: w.x, y: w.y });
      w.f.centerX = p.x; w.f.centerY = p.y;
      w.f.time = w.t;
      filters.push(w.f);
    }
    const ch = this.chroma;
    if (ch.t < ch.dur) {
      const a = ch.a * (1 - ch.t / ch.dur);
      this.rgbSplit.red = { x: -a, y: 0 }; this.rgbSplit.green = { x: 0, y: a * 0.5 }; this.rgbSplit.blue = { x: a, y: 0 };
      filters.push(this.rgbSplit);
    }
    const zf = this.zoomFx;
    if (zf.t < zf.dur) {
      const p = this.world.toGlobal({ x: zf.x, y: zf.y });
      this.zoomBlur.center = { x: p.x, y: p.y };
      this.zoomBlur.strength = zf.a * (1 - zf.t / zf.dur);
      filters.push(this.zoomBlur);
    }
    const sig = filters.length ? filters.map((f) => f.uid).join(',') : '';
    if (sig !== this._filterSig) { this._filterSig = sig; this.world.filters = filters.length ? filters : null; }
    this.app.renderer.render(this.app.stage);
  }

  destroy() {
    this.dead = true;
    const gl = this.app && this.app.renderer && this.app.renderer.gl;
    try {
      this.fx.destroy();
      this.amb.destroy();
      this.app.destroy({ removeView: false }, { children: true });
    } catch (e) { console.warn(e); }
    // release the GPU context right away: browsers only allow a handful of live WebGL contexts
    try { gl && gl.getExtension('WEBGL_lose_context') && gl.getExtension('WEBGL_lose_context').loseContext(); } catch { /* already gone */ }
  }
}
