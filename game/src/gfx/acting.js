// Action choreography for battle puppets. Every action is a set of keyframed tracks (eased) on additive
// parameters, timed key-pose swaps, after-image windows and *cues* (dust, weapon swings, landings, muzzle
// flashes ...) that the stage turns into effects — so body motion and VFX stay frame-locked. Principles:
// anticipation -> smear (stretch, motion blur, after-images) -> impact (hit-stop) -> follow-through /
// overshoot -> recovery & settle. Secondary motion (hair / cloth lag) is simulated by the puppet itself.
//
//   const a = new Actor();  a.melee({ dx, dy, impact, hits, style });  a.hit({ dir, power });  ...
//   const p = a.tick(dt, time);   // -> { breath, sway, hair, tilt, lean, squash, stretch, rot, spin, turn, x, y, glow, wobble, pose, ghost }
//   a.cues  // [{ type, ... }] drained by the stage every frame
const EASE = {
  lin: (k) => k,
  in: (k) => k * k,
  in3: (k) => k * k * k,
  out: (k) => 1 - (1 - k) * (1 - k),
  out3: (k) => 1 - Math.pow(1 - k, 3),
  io: (k) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2),
  back: (k) => { const c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); },
  snap: (k) => 1 - Math.pow(1 - k, 4),
  expo: (k) => (k >= 1 ? 1 : 1 - Math.pow(2, -10 * k)),
  step: (k) => (k < 1 ? 0 : 1),
};
const TAU = Math.PI * 2;

function track(keys) {
  // keys: [[t, value, ease?], ...]; sorted so choreography can be written in any order
  const K = keys.slice().sort((a, b) => a[0] - b[0]);
  return { keys: K, t: 0, end: K[K.length - 1][0] };
}
function evalTrack(tr) {
  const K = tr.keys;
  if (tr.t <= K[0][0]) return K[0][1];
  for (let i = 1; i < K.length; i++) {
    if (tr.t <= K[i][0]) {
      const [t0, v0] = K[i - 1], [t1, v1, e] = K[i];
      const k = t1 > t0 ? (tr.t - t0) / (t1 - t0) : 1;
      return v0 + (v1 - v0) * (EASE[e || 'io'])(k);
    }
  }
  return K[K.length - 1][1];
}

// ------------------------------------------------------------------ melee styles
// reach: gap kept to the target (fraction of the attacker's width); lead: arrive this long before the first hit
const MELEE = {
  slash: { ant: 0.1, lean: -0.2, crouch: 0.12, pull: 8, lead: 0.06, jump: 0, hold: 0.1, back: 0.3, reach: 0.22, strikeSq: -0.06, swing: 0.05 },
  chop: { ant: 0.12, lean: -0.28, crouch: 0.14, pull: 8, lead: 0.05, jump: 12, hold: 0.12, back: 0.32, reach: 0.2, strikeSq: 0.08, swing: 0.06 },
  dagger: { ant: 0.07, lean: -0.14, crouch: 0.1, pull: 4, lead: 0.035, jump: 0, hold: 0.09, back: 0.36, reach: 0.12, strikeSq: -0.05, swing: 0.04, flip: true },
  thrust: { ant: 0.12, lean: -0.28, crouch: 0.08, pull: 14, lead: 0.05, jump: 0, hold: 0.12, back: 0.3, reach: 0.42, strikeSq: -0.04, swing: 0.04, extend: 0.24 },
  smash: { ant: 0.12, lean: -0.34, crouch: 0.15, pull: 6, lead: 0.03, jump: 34, hold: 0.14, back: 0.34, reach: 0.16, strikeSq: 0.17, swing: 0.07 },
  bash: { ant: 0.1, lean: -0.2, crouch: 0.12, pull: 6, lead: 0.035, jump: 0, hold: 0.1, back: 0.3, reach: 0.1, strikeSq: 0.1, swing: 0.03, extend: 0.12 },
  beast: { ant: 0.12, lean: -0.16, crouch: 0.16, pull: 6, lead: 0.035, jump: 22, hold: 0.08, back: 0.32, reach: 0.12, strikeSq: 0.1, swing: 0.04 },
  slam: { ant: 0.12, lean: -0.04, crouch: 0.2, pull: 2, lead: 0.03, jump: 48, hold: 0.08, back: 0.34, reach: 0, strikeSq: 0.24, swing: 0.03 },
};
const STYLE_OF = {
  lanceThrust: 'thrust', tridentThrust: 'thrust',
  hammerSmash: 'smash', maceStrike: 'smash', rockBreaker: 'smash', axeChop: 'chop', fireSlash: 'slash', shieldBash: 'bash',
  daggerSlash: 'dagger', shadowStep: 'dagger',
};
/** Recipes that read as weapon hits — melee heroes dash in for these even when the sim marks a skill as ranged. */
export const MELEE_VFX = new Set(['slash', 'doubleSlash', 'tripleSlash', 'daggerSlash', 'fireSlash', 'darkSlash', 'axeChop', 'lanceThrust', 'tridentThrust',
  'hammerSmash', 'maceStrike', 'rockBreaker', 'shieldBash', 'shadowStep', 'claw', 'bite', 'bump', 'tentacle', 'howl']);
export function meleeStyle(vfx, monsterKind = null) {
  if (monsterKind) return monsterKind === 'slime' ? 'slam' : 'beast';
  return STYLE_OF[vfx] || 'slash';
}
export const meleeReach = (style) => (MELEE[style] || MELEE.slash).reach;

/** Ultimate choreography per recipe ('leap' = jump, hang in the air in the cast pose, land). */
const ULT_STYLE = { galeBlades: 'rush', shadowStrike: 'flurry', phoenixSlash: 'iai', fireCleave: 'spin', tectonic: 'slam', rollingStone: 'roll' };
export const ultStyle = (vfx) => ULT_STYLE[vfx] || 'leap';

export class Actor {
  constructor({ phase = Math.random() * 6, style = 'hero' } = {}) {
    this.phase = phase;
    this.style = style;
    this.tracks = []; // { param, tr }
    this.events = []; // { at, fn }
    this.ghostWin = []; // { from, to, every, next, color }
    this.cues = []; // effects for the stage: { type, ... }
    this.clock = 0;
    this.pose = 'idle';
    this.busy = 0; // seconds until the current action is over
    this.dead = false;
    this.deadT = 0;
    this.stunned = false;
    this.frozen = false;
    this.speed = 1;
    this.hurtUntil = 0;
    this.hitN = 0;
  }

  _add(param, keys) { this.tracks.push({ param, tr: track(keys) }); }
  _at(t, fn) { this.events.push({ at: this.clock + t, fn }); }
  _cue(t, type, data = {}) { this._at(t, () => this.cues.push({ type, ...data })); }
  _ghosts(from, to, every = 0.035, color = 0xffffff) { this.ghostWin.push({ from: this.clock + from, to: this.clock + to, every, next: this.clock + from, color }); }
  _clear() { this.tracks.length = 0; this.events.length = 0; this.ghostWin.length = 0; }
  /** Drop whatever the actor was doing (e.g. a boss's charge crouch when it gets BROKEN). */
  reset() { this._clear(); if (!this.dead) this.pose = 'idle'; this.busy = 0; }

  /**
   * Melee: anticipation crouch -> smear dash -> one weapon swing per hit (cue 'swing' lands exactly on each
   * hit time) -> follow-through -> hop back home. dx/dy: world offset to the strike spot; dir: toward the target.
   */
  melee({ dx, dy, impact = 0.3, hits = 1, spacing = 0.13, dir = 1, color = 0xffffff, style = 'slash', heavy = false }) {
    this._clear();
    const S = MELEE[style] || MELEE.slash;
    const ant = Math.min(heavy ? S.ant * 1.8 : S.ant, impact * 0.5);
    const arrive = Math.max(ant + 0.07, impact - S.lead);
    const n = Math.max(1, Math.min(8, hits || 1));
    const T = Array.from({ length: n }, (_, i) => impact + i * spacing);
    const last = T[n - 1];
    const rec = last + S.hold * (heavy ? 1.3 : 1);
    const home = rec + S.back;
    const mid = ant + (arrive - ant) * 0.5;
    const step = 5 * dir; // creep forward with each follow-up strike
    const smash = style === 'smash' || style === 'slam' || style === 'chop';

    // ---- body travel (world px)
    const x = [[0, 0], [ant, -S.pull * dir, 'out'], [arrive, dx, style === 'dagger' ? 'expo' : 'in']];
    for (let i = 1; i < n; i++) x.push([T[i] - 0.03, dx + i * step, 'out']);
    x.push([rec, dx + (n - 1) * step + 3 * dir, 'out'], [home, 0, 'io']);
    this._add('x', x);
    const y = [[0, 0], [ant, 0]];
    if (S.jump) y.push([mid + (arrive - mid) * 0.15, dy * 0.5 - S.jump * (heavy ? 1.3 : 1), 'out'], [arrive, dy, 'in3']);
    else y.push([arrive, dy, 'in']);
    for (let i = 1; i < n; i++) y.push([T[i] - spacing * 0.5, dy - (smash ? 16 : 7), 'out'], [T[i] - 0.01, dy, 'in']);
    const hop = style === 'dagger' ? 46 : smash ? 30 : 24;
    y.push([rec, dy], [rec + S.back * 0.45, dy * 0.5 - hop, 'out'], [home, 0, 'in']);
    this._add('y', y);

    // ---- body shape
    const lean = [[0, 0], [ant, S.lean * (heavy ? 1.2 : 1), 'out'], [arrive - 0.015, 0.24, 'in']];
    T.forEach((t, i) => {
      if (i) lean.push([t - 0.04, smash ? -0.12 : 0.06, 'out']); // re-wind for the follow-up
      lean.push([t, i === n - 1 && heavy ? 0.44 : 0.34, 'snap'], [t + 0.05, 0.26, 'out']);
    });
    lean.push([rec, 0.14, 'io'], [rec + S.back * 0.45, -0.1, 'io'], [home, 0, 'out']);
    this._add('lean', lean);
    const sq = [[0, 0], [ant, S.crouch, 'out'], [ant + 0.05, -0.09, 'snap'], [arrive - 0.01, 0, 'io']];
    T.forEach((t, i) => sq.push([t - 0.025, S.strikeSq > 0 ? -0.06 : 0.05, 'out'], [t, S.strikeSq, 'snap'], [t + 0.07, i === n - 1 ? 0.06 : 0.02, 'out']));
    sq.push([rec, 0, 'io'], [rec + 0.06, 0.09, 'out'], [rec + 0.12, -0.07, 'snap'], [home - 0.02, 0, 'io'], [home + 0.05, 0.13, 'out'], [home + 0.22, 0, 'out']);
    this._add('squash', sq);
    const st = [[0, 0], [ant, -0.05, 'out'], [ant + (arrive - ant) * 0.45, 0.22, 'out'], [arrive, 0.04, 'in']];
    if (S.extend) T.forEach((t) => st.push([t - 0.02, 0, 'out'], [t + 0.01, S.extend, 'snap'], [t + 0.08, 0.02, 'out']));
    st.push([rec + 0.08, 0, 'io'], [rec + S.back * 0.35, 0.08, 'out'], [home - 0.06, 0, 'in']);
    this._add('stretch', st);
    const tilt = [[0, 0], [ant, -0.1, 'out'], [arrive, 0.04]];
    T.forEach((t) => tilt.push([t, 0.13, 'snap'], [t + 0.07, 0.03, 'out']));
    tilt.push([rec + S.back * 0.4, -0.06, 'io'], [home + 0.1, 0, 'io']);
    this._add('tilt', tilt);
    this._add('hair', [[0, 0], [arrive, 1.3, 'out'], [rec, 0.8], [home + 0.2, 0, 'io']]);
    if (heavy) this._add('glow', [[0, 0], [ant, 1, 'out'], [last + 0.1, 0.55], [home, 0, 'in']]);
    if (S.flip) this._add('spin', [[0, 0], [rec + 0.03, 0], [home - 0.05, -TAU * dir, 'io'], [home - 0.049, 0, 'step']]);

    // ---- key poses, after-images, cues
    if (heavy) this._at(0.02, () => { this.pose = 'cast'; });
    this._at(Math.max(0.01, T[0] - 0.08), () => { this.pose = 'atk'; });
    this._at(rec + S.back * 0.35, () => { this.pose = 'idle'; });
    this._ghosts(ant, arrive + 0.02, style === 'dagger' ? 0.016 : 0.024, color);
    T.forEach((t) => this._ghosts(t + 0.005, t + 0.006, 1, color));
    this._ghosts(rec + 0.04, home - 0.05, S.flip ? 0.03 : 0.045, color);
    this._cue(ant, 'dust', { power: heavy ? 1.3 : 1, dir });
    if (heavy) this._cue(0, 'powerUp', {});
    T.forEach((t, i) => this._cue(Math.max(0, t - S.swing), 'swing', { i, n, style, heavy, dir, final: i === n - 1 }));
    this._cue(arrive, S.jump ? 'land' : 'skid', { power: S.jump ? 0.7 : 0.5, dir });
    this._cue(rec + 0.06, 'dust', { power: 0.6, dir: -dir });
    this._cue(home, 'land', { power: 0.7 });
    this.busy = home + 0.2;
  }

  /** Ranged / spell: wind-up (cast pose + magic circle for casters), release at `release`, recoil, settle. */
  shoot({ release = 0.2, dir = 1, cast = false, color = 0xffffff, heavy = false }) {
    this._clear();
    const r = Math.max(0.08, release);
    const end = r + (heavy ? 0.5 : 0.42);
    this._add('lean', [[0, 0], [r - 0.03, heavy ? -0.2 : -0.15, 'out'], [r + 0.03, 0.2, 'snap'], [r + 0.16, -0.05, 'out'], [end, 0, 'io']]);
    this._add('squash', [[0, 0], [r - 0.03, 0.09, 'out'], [r + 0.03, -0.07, 'snap'], [r + 0.18, 0.03, 'out'], [end, 0, 'io']]);
    this._add('x', [[0, 0], [r - 0.03, -3 * dir, 'out'], [r + 0.1, -9 * dir, 'out'], [end, 0, 'io']]);
    this._add('tilt', [[0, 0], [r - 0.03, -0.08, 'out'], [r + 0.03, 0.08, 'snap'], [end, 0, 'io']]);
    this._add('stretch', [[0, 0], [r - 0.02, -0.03], [r + 0.03, 0.08, 'snap'], [r + 0.14, 0, 'out']]);
    if (cast) {
      this._add('y', [[0, 0], [r, heavy ? -12 : -6, 'out'], [r + 0.2, heavy ? -16 : -9, 'io'], [end, 0, 'in']]);
      this._add('glow', [[0, 0], [r, heavy ? 1.3 : 1, 'out'], [r + 0.15, 0.8], [end, 0, 'in']]);
      this._add('hair', [[0, 0], [r, heavy ? 1.6 : 0.9, 'out'], [end, 0, 'io']]);
      this._at(0.02, () => { this.pose = 'cast'; });
      this._cue(0, 'circle', { heavy });
    } else {
      this._add('y', [[0, 0], [r + 0.04, -2, 'out'], [end, 0, 'io']]);
      this._at(Math.max(0.01, r - 0.1), () => { this.pose = 'atk'; });
    }
    this._at(end - 0.1, () => { this.pose = 'idle'; });
    this._ghosts(r + 0.005, r + 0.006, 1, color);
    this._cue(r, 'muzzle', { heavy, cast });
    this.busy = end;
  }

  /** Charging during the ultimate cut-in (slow-motion): crouch, glow builds, hair and cloth lift. */
  charge() {
    this._clear();
    this._add('squash', [[0, 0], [0.25, 0.13, 'out'], [0.6, 0.09]]);
    this._add('lean', [[0, 0], [0.3, -0.09, 'out'], [0.6, -0.06]]);
    this._add('glow', [[0, 0], [0.5, 1.3, 'out']]);
    this._add('hair', [[0, 0], [0.4, 1.8, 'out']]);
    this._add('wobble', [[0, 0], [0.3, 0.25, 'out'], [0.6, 0.15]]);
    this._at(0.05, () => { this.pose = 'cast'; });
    this._cue(0, 'powerUp', { big: true });
    this.busy = 0.6;
  }

  /**
   * Ultimate release. kind: 'leap' (default) | 'rush' (blink between targets) | 'flurry' (vanish, slash storm on one
   * target) | 'iai' (dash through the target) | 'spin' (whirlwind in front of the enemy line) | 'slam' (leap and
   * smash the ground) | 'roll'. path: [{ t, dx, dy }] strike spots (world offsets) for the moving kinds.
   */
  ultimate({ dir = 1, color = 0xffffff, kind = 'leap', path = [], final = 0.7 }) {
    this._clear();
    const P = path.length ? path : [{ t: 0.2, dx: 60 * dir, dy: 0 }];
    if (kind === 'rush') return this._ultRush(P, final, dir, color);
    if (kind === 'flurry') return this._ultFlurry(P[0], dir, color);
    if (kind === 'iai') return this._ultIai(P[0], dir, color);
    if (kind === 'spin') return this._ultSpin(P[0], dir, color);
    if (kind === 'slam') return this._ultSlam(dir, color);
    if (kind === 'roll') return this._ultRoll(P[0], dir, color);
    const land = 1.15;
    this._add('y', [[0, 0], [0.12, -38, 'snap'], [0.7, -46, 'lin'], [land, 0, 'in3'], [land + 0.15, 0]]);
    this._add('x', [[0, 0], [0.12, 10 * dir, 'out'], [land, 0, 'io']]);
    this._add('squash', [[0, 0.1], [0.1, -0.13, 'snap'], [0.3, 0, 'out'], [land - 0.05, -0.05], [land + 0.04, 0.15, 'out'], [land + 0.25, 0, 'out']]);
    this._add('lean', [[0, -0.05], [0.12, 0.14, 'out'], [0.6, 0.05], [land, 0, 'io']]);
    this._add('glow', [[0, 1.3], [0.8, 1.5], [land + 0.2, 0, 'in']]);
    this._add('hair', [[0, 1.8], [0.8, 2], [land + 0.3, 0, 'io']]);
    this._add('tilt', [[0, 0], [0.12, -0.12, 'snap'], [0.5, -0.04], [land, 0.05], [land + 0.2, 0, 'io']]);
    this._at(0, () => { this.pose = 'cast'; });
    this._at(land - 0.05, () => { this.pose = 'idle'; });
    this._ghosts(0, 0.2, 0.025, color);
    this._ghosts(land - 0.25, land, 0.035, color);
    this._cue(0, 'dust', { power: 1.4, dir });
    this._cue(0.12, 'aura', {});
    this._cue(land, 'land', { power: 1.1 });
    this.busy = land + 0.3;
  }

  _ultRush(P, final, dir, color) {
    const x = [[0, 0]], y = [[0, 0]], lean = [[0, 0]], sq = [[0, 0], [0.05, 0.12, 'out'], [0.1, -0.1, 'snap']], st = [[0, 0]];
    P.forEach((p, i) => {
      const a = Math.max(0.06, p.t - 0.06);
      x.push([a, p.dx, 'expo'], [p.t + 0.05, p.dx + 8 * dir, 'out']);
      y.push([a, p.dy - 10, 'expo'], [p.t, p.dy, 'in'], [p.t + 0.06, p.dy - 4, 'out']);
      lean.push([a, 0.18, 'out'], [p.t, 0.4, 'snap'], [p.t + 0.06, 0.2, 'out']);
      sq.push([p.t - 0.02, 0.04], [p.t, -0.07, 'snap'], [p.t + 0.06, 0.03, 'out']);
      st.push([a - 0.03, 0.28, 'out'], [a + 0.01, 0.02, 'in']);
      this._at(a, () => { this.pose = i % 2 ? 'cast' : 'atk'; });
      this._cue(Math.max(0, p.t - 0.04), 'swing', { i, n: P.length, style: 'slash', heavy: true, dir, final: false });
      this._cue(Math.max(0, a - 0.03), 'blink', {});
    });
    const lastP = P[P.length - 1];
    const fx = lastP.dx + 18 * dir;
    x.push([final - 0.07, fx, 'expo'], [final + 0.12, fx + 14 * dir, 'out']);
    y.push([final - 0.07, lastP.dy - 30, 'expo'], [final, lastP.dy, 'in3']);
    lean.push([final - 0.07, -0.1, 'out'], [final, 0.46, 'snap'], [final + 0.14, 0.24, 'out']);
    sq.push([final - 0.03, -0.08], [final, 0.16, 'snap'], [final + 0.14, 0, 'out']);
    const home = final + 0.48;
    x.push([home, 0, 'io']);
    y.push([final + 0.2, lastP.dy], [final + 0.34, lastP.dy * 0.5 - 40, 'out'], [home, 0, 'in']);
    lean.push([final + 0.3, -0.12, 'io'], [home, 0, 'out']);
    sq.push([home - 0.02, 0], [home + 0.05, 0.13, 'out'], [home + 0.22, 0, 'out']);
    st.push([home, 0]);
    this._add('x', x); this._add('y', y); this._add('lean', lean); this._add('squash', sq); this._add('stretch', st);
    this._add('glow', [[0, 1.3], [final, 1.4], [home + 0.2, 0, 'in']]);
    this._add('hair', [[0, 1.8], [final, 2], [home + 0.3, 0, 'io']]);
    this._add('spin', [[0, 0], [final + 0.2, 0], [home - 0.04, -TAU * dir, 'io'], [home - 0.039, 0, 'step']]);
    this._at(final - 0.07, () => { this.pose = 'atk'; });
    this._at(final + 0.3, () => { this.pose = 'idle'; });
    this._ghosts(0, home, 0.02, color);
    this._cue(0, 'dust', { power: 1.4, dir });
    this._cue(Math.max(0, final - 0.05), 'swing', { i: 0, n: 1, style: 'slash', heavy: true, dir, final: true, big: true });
    this._cue(home, 'land', { power: 1 });
    this.busy = home + 0.3;
  }

  _ultFlurry(p, dir, color) {
    // vanish in smoke, reappear on the target, 7 slashes from every side, final cut, backflip home
    const x = [[0, 0], [0.06, p.dx, 'expo']], y = [[0, 0], [0.06, p.dy - 8, 'expo']], lean = [[0, 0]], sq = [[0, 0]];
    const N = 7;
    for (let i = 0; i < N; i++) {
      const t = 0.08 + i * 0.045;
      const side = i % 2 ? -1 : 1;
      x.push([t, p.dx + side * 14 * dir, 'expo']);
      y.push([t, p.dy - (i % 3) * 9, 'expo']);
      lean.push([t - 0.02, 0.05], [t, 0.38, 'snap']);
      sq.push([t, -0.06, 'snap'], [t + 0.02, 0.04]);
      this._cue(t - 0.02, 'swing', { i, n: N, style: 'dagger', heavy: true, dir: side * dir, final: false });
      this._at(t - 0.02, () => { this.pose = i % 2 ? 'cast' : 'atk'; });
    }
    const fin = 0.4;
    x.push([fin, p.dx + 10 * dir, 'out']);
    y.push([fin, p.dy, 'in']);
    lean.push([fin, 0.46, 'snap'], [fin + 0.1, 0.2]);
    const home = fin + 0.42;
    x.push([fin + 0.08, p.dx + 10 * dir], [home, 0, 'io']);
    y.push([fin + 0.08, p.dy], [fin + 0.24, p.dy * 0.5 - 50, 'out'], [home, 0, 'in']);
    lean.push([home, 0, 'io']);
    sq.push([fin, 0.12, 'snap'], [fin + 0.1, 0], [home - 0.02, 0], [home + 0.05, 0.13, 'out'], [home + 0.22, 0, 'out']);
    this._add('x', x); this._add('y', y); this._add('lean', lean); this._add('squash', sq);
    this._add('spin', [[0, 0], [fin + 0.1, 0], [home - 0.04, -TAU * dir, 'io'], [home - 0.039, 0, 'step']]);
    this._add('glow', [[0, 1.3], [fin, 1.4], [home + 0.2, 0, 'in']]);
    this._add('hair', [[0, 1.6], [home + 0.3, 0, 'io']]);
    this._at(fin - 0.02, () => { this.pose = 'atk'; });
    this._at(fin + 0.2, () => { this.pose = 'idle'; });
    this._ghosts(0, home, 0.018, color);
    this._cue(0, 'vanish', {});
    this._cue(0.06, 'blink', {});
    this._cue(fin - 0.04, 'swing', { i: 0, n: 1, style: 'slash', heavy: true, dir, final: true, big: true });
    this._cue(home, 'land', { power: 0.8 });
    this.busy = home + 0.3;
  }

  _ultIai(p, dir, color) {
    // one blinding dash *through* the target; hold the drawn-sword pose on the far side while the cut lands
    const through = p.dx + 120 * dir;
    const hold = 0.62, home = hold + 0.34;
    this._add('x', [[0, 0], [0.05, -12 * dir, 'out'], [0.11, through, 'expo'], [hold, through + 6 * dir, 'out'], [home, 0, 'io']]);
    this._add('y', [[0, 0], [0.11, p.dy], [hold, p.dy], [hold + 0.15, p.dy * 0.5 - 34, 'out'], [home, 0, 'in']]);
    this._add('lean', [[0, 0], [0.05, -0.3, 'out'], [0.11, 0.44, 'snap'], [0.3, 0.3, 'out'], [hold, 0.22], [hold + 0.15, -0.1, 'io'], [home, 0, 'out']]);
    this._add('squash', [[0, 0], [0.05, 0.16, 'out'], [0.09, -0.1, 'snap'], [0.14, 0.14, 'snap'], [0.3, 0.05, 'out'], [hold, 0], [home - 0.02, 0], [home + 0.05, 0.13, 'out'], [home + 0.22, 0, 'out']]);
    this._add('stretch', [[0, 0], [0.06, 0.4, 'snap'], [0.12, 0, 'out'], [hold + 0.05, 0], [hold + 0.15, 0.1, 'out'], [home - 0.05, 0]]);
    this._add('tilt', [[0, 0], [0.05, -0.14], [0.11, 0.1, 'snap'], [0.4, 0.04], [home, 0, 'io']]);
    this._add('glow', [[0, 1.3], [0.2, 1.6, 'out'], [home + 0.2, 0, 'in']]);
    this._add('hair', [[0, 1.8], [0.15, 2.6, 'out'], [home + 0.3, 0, 'io']]);
    this._at(0.04, () => { this.pose = 'atk'; });
    this._at(hold + 0.1, () => { this.pose = 'idle'; });
    this._ghosts(0.05, 0.13, 0.008, color);
    this._ghosts(hold, home - 0.05, 0.04, color);
    this._cue(0.05, 'dust', { power: 1.5, dir });
    this._cue(0.11, 'skid', { power: 1.2, dir });
    this._cue(0.07, 'swing', { i: 0, n: 1, style: 'thrust', heavy: true, dir, final: true, big: true, through: true });
    this._cue(home, 'land', { power: 0.9 });
    this.busy = home + 0.3;
  }

  _ultSpin(p, dir, color) {
    const s0 = 0.12, s1 = 0.42, home = s1 + 0.36;
    this._add('x', [[0, 0], [0.05, -8 * dir, 'out'], [s0, p.dx, 'in'], [s1, p.dx + 16 * dir, 'out'], [home, 0, 'io']]);
    this._add('y', [[0, 0], [s0, p.dy - 14, 'out'], [s0 + 0.15, p.dy - 22, 'io'], [s1, p.dy, 'in'], [s1 + 0.14, p.dy * 0.5 - 28, 'out'], [home, 0, 'in']]);
    this._add('spin', [[0, 0], [s0, 0], [s1, TAU * 2 * dir, 'io'], [s1 + 0.001, 0, 'step']]);
    this._add('squash', [[0, 0], [0.05, 0.14, 'out'], [s0, -0.08, 'snap'], [s1, 0.14, 'snap'], [s1 + 0.12, 0, 'out'], [home - 0.02, 0], [home + 0.05, 0.12, 'out'], [home + 0.22, 0, 'out']]);
    this._add('stretch', [[0, 0], [0.08, 0.22, 'out'], [s0, 0.1], [s0 + 0.05, 0.18], [s1, 0, 'in']]);
    this._add('lean', [[0, 0], [0.05, -0.24, 'out'], [s0, 0.3, 'snap'], [s1, 0.28], [s1 + 0.14, -0.1, 'io'], [home, 0, 'out']]);
    this._add('glow', [[0, 1.3], [s1, 1.5], [home + 0.2, 0, 'in']]);
    this._add('hair', [[0, 1.8], [s1, 2.4], [home + 0.3, 0, 'io']]);
    this._at(0.05, () => { this.pose = 'atk'; });
    this._at(s1 + 0.12, () => { this.pose = 'idle'; });
    this._ghosts(0.04, s1, 0.02, color);
    this._cue(0.05, 'dust', { power: 1.3, dir });
    this._cue(s0, 'swing', { i: 0, n: 1, style: 'whirl', heavy: true, dir, final: true, big: true, dur: s1 - s0 });
    this._cue(s1, 'land', { power: 1 });
    this._cue(home, 'land', { power: 0.7 });
    this.busy = home + 0.3;
  }

  _ultSlam(dir, color) {
    const top = 0.1, hit = 0.16, home = 0.75;
    this._add('y', [[0, 0], [0.03, 0], [top, -86, 'snap'], [hit, 0, 'in3'], [hit + 0.12, 0], [hit + 0.22, -14, 'out'], [hit + 0.34, 0, 'in']]);
    this._add('x', [[0, 0], [top, 14 * dir, 'out'], [hit, 26 * dir, 'in'], [home, 0, 'io']]);
    this._add('squash', [[0, 0.16], [0.03, 0.18], [0.07, -0.16, 'snap'], [top, -0.06], [hit - 0.01, -0.14], [hit + 0.02, 0.28, 'snap'], [hit + 0.18, 0, 'out'], [hit + 0.34, 0.08, 'out'], [home, 0, 'out']]);
    this._add('lean', [[0, -0.1], [top, -0.34, 'out'], [hit, 0.46, 'snap'], [hit + 0.2, 0.2, 'out'], [home, 0, 'io']]);
    this._add('stretch', [[0, 0], [hit - 0.01, 0], [hit + 0.02, 0.2, 'snap'], [hit + 0.2, 0, 'out']]);
    this._add('glow', [[0, 1.3], [hit, 1.7], [home + 0.2, 0, 'in']]);
    this._add('hair', [[0, 1.8], [top, 2.6], [hit + 0.1, 1.2], [home + 0.3, 0, 'io']]);
    this._at(0, () => { this.pose = 'cast'; });
    this._at(hit - 0.06, () => { this.pose = 'atk'; });
    this._at(hit + 0.4, () => { this.pose = 'idle'; });
    this._ghosts(0.03, hit + 0.02, 0.016, color);
    this._cue(0.03, 'dust', { power: 1.4, dir });
    this._cue(hit - 0.06, 'swing', { i: 0, n: 1, style: 'smash', heavy: true, dir, final: true, big: true });
    this._cue(hit, 'quake', { power: 1.6 });
    this.busy = home + 0.3;
  }

  _ultRoll(p, dir, color) {
    const go = 0.1, hit = 0.45, home = 0.9;
    this._add('x', [[0, 0], [go, -10 * dir, 'out'], [hit, p.dx, 'in'], [hit + 0.25, p.dx - 30 * dir, 'out'], [home, 0, 'io']]);
    this._add('y', [[0, 0], [hit, p.dy], [hit + 0.14, p.dy * 0.5 - 50, 'out'], [hit + 0.3, p.dy * 0.3, 'in'], [hit + 0.36, -10, 'out'], [home, 0, 'in']]);
    this._add('spin', [[0, 0], [go, 0], [hit, TAU * 3 * dir, 'in'], [hit + 0.3, TAU * 3.5 * dir, 'out'], [home - 0.05, TAU * 4 * dir, 'io'], [home - 0.049, 0, 'step']]);
    this._add('squash', [[0, 0], [go, 0.24, 'out'], [hit - 0.05, 0.18], [hit, 0.3, 'snap'], [hit + 0.1, 0.05, 'out'], [home - 0.02, 0], [home + 0.05, 0.13, 'out'], [home + 0.22, 0, 'out']]);
    this._add('glow', [[0, 1.2], [hit, 1.5], [home + 0.2, 0, 'in']]);
    this._at(0, () => { this.pose = 'cast'; });
    this._at(hit + 0.3, () => { this.pose = 'idle'; });
    this._ghosts(go, hit, 0.02, color);
    this._cue(go, 'dust', { power: 1.3, dir });
    this._cue(hit, 'quake', { power: 1.2 });
    this._cue(home, 'land', { power: 0.8 });
    this.busy = home + 0.3;
  }

  /** Taking a hit: hurt pose, knockback away from the attacker, recoil lean and head snap; heavy hits launch. */
  hit({ dir = 1, power = 1 }) {
    if (this.dead) return;
    // reactions layer on top of whatever is running (an attacker hit mid-dash keeps dashing)
    const idx = this.hitN++;
    const kb = (6 + 9 * power) * dir;
    const t1 = 0.05, t2 = 0.2 + 0.08 * power, t3 = t2 + 0.24;
    const alt = idx % 2 ? -0.6 : 1;
    this._add('x', [[0, 0], [t1, kb, 'snap'], [t2, kb * 0.8, 'out'], [t3, 0, 'io']]);
    this._add('lean', [[0, 0], [t1, -0.24 * Math.min(1.6, power), 'snap'], [t1 + 0.12, 0.05, 'out'], [t3, 0, 'io']]);
    this._add('squash', [[0, 0], [t1, 0.11, 'snap'], [t1 + 0.1, -0.05, 'out'], [t1 + 0.2, 0.02, 'io'], [t3, 0, 'io']]);
    this._add('tilt', [[0, 0], [t1, -0.22 * alt, 'snap'], [t1 + 0.14, 0.04 * alt, 'out'], [t3, 0, 'io']]);
    this._add('stretch', [[0, 0], [t1, -0.06, 'snap'], [t1 + 0.12, 0.02, 'out'], [t3, 0, 'io']]);
    if (power >= 1.4) {
      this._add('y', [[0, 0], [t1 + 0.04, -16 * (power - 0.8), 'out'], [t2, 0, 'in'], [t2 + 0.07, -5, 'out'], [t2 + 0.14, 0, 'in']]);
      this._add('rot', [[0, 0], [t1 + 0.04, 0.12 * Math.sign(dir), 'out'], [t2, 0.04 * Math.sign(dir), 'in'], [t3, 0, 'io']]);
      this._cue(t2, 'land', { power: 0.5 });
    }
    this.pose = 'hurt';
    this.hurtUntil = this.clock + t2;
    this._at(t2, () => { if (!this.dead && this.clock >= this.hurtUntil - 1e-6 && this.pose === 'hurt') this.pose = 'idle'; });
  }

  /** Knocked out: launched away, topples and bounces; the stage then burns the puppet away. */
  die({ dir = 1 }) {
    this._clear();
    this.dead = true;
    this.deadT = 0;
    this.pose = 'hurt';
    const s = Math.sign(dir || 1);
    this._add('x', [[0, 0], [0.1, 30 * dir, 'snap'], [0.5, 46 * dir, 'out']]);
    this._add('y', [[0, 0], [0.1, -26, 'out'], [0.34, 0, 'in'], [0.42, -7, 'out'], [0.5, 0, 'in']]);
    this._add('rot', [[0, 0], [0.34, 1.05 * s, 'in'], [0.42, 0.9 * s, 'out'], [0.5, 1.12 * s, 'in'], [0.56, 1.05 * s, 'out']]);
    this._add('squash', [[0, 0], [0.1, -0.1, 'snap'], [0.34, 0, 'in'], [0.38, 0.12, 'out'], [0.6, 0.04]]);
    this._add('tilt', [[0, 0], [0.1, -0.3, 'snap'], [0.5, -0.12, 'out']]);
    this._cue(0.34, 'land', { power: 0.9 });
  }

  revive() {
    this._clear(); this.dead = false; this.deadT = 0; this.pose = 'idle';
    this._add('y', [[0, -30], [0.4, 0, 'back']]);
    this._add('glow', [[0, 1.5], [0.8, 0, 'in']]);
    this._add('squash', [[0, -0.1], [0.4, 0.12, 'snap'], [0.6, 0, 'out']]);
  }

  /** Victory: two happy hops (and a twirl) in the cast pose, then a bouncy idle while the banner plays. */
  victory(delay = 0) {
    this._clear();
    const d = delay;
    this._add('y', [[0, 0], [d, 0], [d + 0.18, -30, 'out'], [d + 0.36, 0, 'in'], [d + 0.5, -20, 'out'], [d + 0.66, 0, 'in'],
      [d + 1.6, 0], [d + 1.75, -10, 'out'], [d + 1.9, 0, 'in'], [d + 2.6, 0], [d + 2.75, -10, 'out'], [d + 2.9, 0, 'in']]);
    this._add('squash', [[0, 0], [d, 0.1, 'out'], [d + 0.1, -0.1, 'snap'], [d + 0.36, 0.08, 'in'], [d + 0.44, -0.08, 'out'], [d + 0.66, 0.1, 'in'], [d + 0.8, 0, 'out']]);
    this._add('turn', [[0, 0], [d + 0.36, 0], [d + 0.7, TAU, 'io'], [d + 0.701, 0, 'step']]); // pirouette
    this._add('glow', [[0, 0], [d + 0.2, 0.8, 'out'], [d + 1.2, 0, 'in']]);
    this._add('tilt', [[0, 0], [d + 0.8, 0.1, 'io'], [d + 1.3, -0.08, 'io'], [d + 1.8, 0.06, 'io'], [d + 2.4, 0, 'io']]);
    this._at(d, () => { this.pose = 'cast'; });
    this._cue(d + 0.2, 'sparkle', {});
    this._cue(d + 0.66, 'land', { power: 0.5 });
    this._at(d + 1.6, () => { this.pose = 'idle'; });
  }

  /** Defeat: slump, head down, hurt pose. */
  defeat(delay = 0) {
    this._clear();
    this._add('squash', [[0, 0], [delay, 0], [delay + 0.4, 0.12, 'out']]);
    this._add('lean', [[0, 0], [delay, 0], [delay + 0.4, -0.06, 'out']]);
    this._add('tilt', [[0, 0], [delay, 0], [delay + 0.5, 0.2, 'out']]);
    this._at(delay, () => { if (!this.dead) this.pose = 'hurt'; });
  }

  /** Tapped by the player: a little hop + wiggle (heroes beam in the cast pose). */
  poke(happy = true) {
    if (this.dead || this.busy > 0) return false;
    this._add('y', [[0, 0], [0.05, 0], [0.16, -20, 'out'], [0.3, 0, 'in']]);
    this._add('squash', [[0, 0], [0.05, 0.12, 'out'], [0.1, -0.1, 'snap'], [0.3, 0.1, 'in'], [0.45, 0, 'out']]);
    this._add('tilt', [[0, 0], [0.1, 0.16, 'out'], [0.2, -0.14, 'io'], [0.3, 0.08, 'io'], [0.42, 0, 'io']]);
    this._add('wobble', [[0, 0], [0.1, 0.5, 'out'], [0.45, 0, 'in']]);
    if (happy) { this.pose = 'cast'; this._at(0.6, () => { if (this.pose === 'cast') this.pose = 'idle'; }); }
    this._cue(0.3, 'land', { power: 0.25 });
    this.busy = 0.45;
    return true;
  }

  /** Battle start: run (or bounce) in from off-screen, skid to a stop on the spot, settle into the stance. */
  enter({ from = -200, delay = 0, color = 0xffffff, bouncy = false }) {
    this._clear();
    const d = delay, run = 0.44, end = d + run;
    const dir = from < 0 ? 1 : -1;
    this._add('x', [[0, from], [d, from], [end, 0, 'out3'], [end + 0.08, 2 * dir, 'out'], [end + 0.2, 0, 'io']]);
    const y = [[0, 0], [d, 0]];
    const steps = bouncy ? 2 : 4;
    for (let i = 0; i < steps; i++) {
      const a = d + (run * i) / steps, b = d + (run * (i + 1)) / steps;
      y.push([(a + b) / 2, bouncy ? -26 : -9, 'out'], [b, 0, 'in']);
      this._cue(b - d + d, 'dust', { power: 0.45, dir });
    }
    this._add('y', y);
    this._add('lean', [[0, 0.2], [d, 0.2], [end - 0.06, 0.16], [end + 0.06, -0.12, 'out'], [end + 0.3, 0, 'io']]);
    this._add('squash', [[0, 0], [end - 0.02, -0.04], [end + 0.05, 0.13, 'out'], [end + 0.24, 0, 'out']]);
    this._add('stretch', [[0, 0.16], [d + run * 0.7, 0.12], [end, 0, 'in']]);
    this._add('hair', [[0, 1.4], [end + 0.4, 0, 'io']]);
    this._ghosts(d, end - 0.05, 0.05, color);
    this._cue(end, 'skid', { power: 1, dir });
    this.busy = end + 0.2;
  }

  /** Idle fidget so nobody stands like a statue: a bob, a curious head tilt, a weapon-ready shuffle. */
  fidget(dir = 1) {
    if (this.dead || this.busy > 0 || this.tracks.length) return;
    const k = Math.floor(Math.random() * 4);
    if (k === 0) {
      this._add('y', [[0, 0], [0.08, 0], [0.2, -8, 'out'], [0.34, 0, 'in']]);
      this._add('squash', [[0, 0], [0.08, 0.07, 'out'], [0.14, -0.05, 'snap'], [0.34, 0.06, 'in'], [0.48, 0, 'out']]);
    } else if (k === 1) {
      const s = Math.random() < 0.5 ? 1 : -1;
      this._add('tilt', [[0, 0], [0.3, 0.13 * s, 'io'], [1.0, 0.11 * s], [1.35, 0, 'io']]);
    } else if (k === 2) {
      this._add('lean', [[0, 0], [0.16, -0.09, 'out'], [0.38, 0.1, 'io'], [0.62, 0, 'io']]);
      this._add('squash', [[0, 0], [0.16, 0.06, 'out'], [0.38, -0.03, 'io'], [0.62, 0, 'io']]);
    } else {
      this._add('x', [[0, 0], [0.2, 4 * dir, 'io'], [0.45, 0, 'io']]);
      this._add('y', [[0, 0], [0.1, -4, 'out'], [0.2, 0, 'in'], [0.32, -3, 'out'], [0.45, 0, 'in']]);
    }
  }

  /** An ally unleashed an ultimate: quick cheer hop. */
  cheer(delay = 0) {
    if (this.dead || this.busy > 0) return;
    this._add('y', [[0, 0], [delay, 0], [delay + 0.14, -12, 'out'], [delay + 0.28, 0, 'in']]);
    this._add('squash', [[0, 0], [delay, 0.06, 'out'], [delay + 0.06, -0.06, 'snap'], [delay + 0.28, 0.06, 'in'], [delay + 0.4, 0, 'out']]);
  }

  /**
   * Advance and sample. Returns params for Puppet.update plus `pose` and `ghost` (after-image color or null).
   */
  tick(dt, time) {
    const sdt = dt * this.speed;
    this.clock += sdt;
    if (this.dead) this.deadT += sdt;
    const out = { lean: 0, squash: 0, stretch: 0, tilt: 0, rot: 0, spin: 0, turn: 0, x: 0, y: 0, glow: 0, hair: 0, wobble: 0 };
    for (let i = this.tracks.length - 1; i >= 0; i--) {
      const T = this.tracks[i];
      T.tr.t += sdt;
      out[T.param] += evalTrack(T.tr);
      if (T.tr.t >= T.tr.end && !(this.dead && (T.param === 'rot' || T.param === 'x'))) {
        if (Math.abs(T.tr.keys[T.tr.keys.length - 1][1]) < 1e-6) this.tracks.splice(i, 1);
      }
    }
    for (let i = this.events.length - 1; i >= 0; i--) if (this.clock >= this.events[i].at) { const e = this.events[i]; this.events.splice(i, 1); e.fn(); }
    let ghost = null;
    for (let i = this.ghostWin.length - 1; i >= 0; i--) {
      const g = this.ghostWin[i];
      if (this.clock > g.to) { this.ghostWin.splice(i, 1); continue; }
      if (this.clock >= g.next && this.clock >= g.from) { g.next = this.clock + g.every; ghost = g.color; }
    }
    this.busy = Math.max(0, this.busy - sdt);
    // idle life (keeps moving under every action): breathing, sway, head bob, hair
    const ph = this.phase;
    const calm = this.frozen ? 0 : 1;
    const t = time;
    out.breath = Math.sin(t * 2.2 + ph) * calm;
    out.sway = Math.sin(t * 1.25 + ph * 1.7) * calm;
    out.hair = (1 + out.hair) * calm;
    out.tilt += (0.035 * Math.sin(t * 1.05 + ph) + (this.stunned ? 0.16 * Math.sin(t * 7) : 0)) * calm;
    out.pose = this.pose;
    out.ghost = ghost;
    return out;
  }
}
