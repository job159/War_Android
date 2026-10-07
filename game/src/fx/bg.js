// Animated menu background: night-sky gradient, drifting nebula, twinkling stars, rising magic motes
// and the occasional shooting star. Theme colors change per screen (setBgTheme).
// Cheap on purpose: the sky + nebula layer is cached and only redrawn while a theme fades or every
// few seconds; motes are pre-rendered sprites; ~30 fps.

const THEMES = {
  default: { top: '#0b0726', mid: '#1c1046', bot: '#2a0f3a', neb1: '#5a2aa8', neb2: '#1a5aa8', mote: '#ffd98a' },
  heroes: { top: '#0a0a24', mid: '#16204a', bot: '#2a1a4a', neb1: '#3a5ad8', neb2: '#8a2aa8', mote: '#bfe6ff' },
  adventure: { top: '#06121e', mid: '#0e2a3a', bot: '#2a1a2a', neb1: '#1a8a7a', neb2: '#5a3aa8', mote: '#b6ffd8' },
  pvp: { top: '#1a0610', mid: '#3a0e22', bot: '#1a0a2a', neb1: '#c82a4a', neb2: '#5a2aa8', mote: '#ffb08a' },
  shop: { top: '#140a02', mid: '#3a1e08', bot: '#2a0a2a', neb1: '#c8862a', neb2: '#a82a8a', mote: '#ffe08a' },
  study: { top: '#04101e', mid: '#0a2240', bot: '#141a3a', neb1: '#2a7ad8', neb2: '#2ab8a8', mote: '#cff6ff' },
};

let canvas, g, w = 0, h = 0, dpr = 1;
let theme = THEMES.default, target = THEMES.default, mixT = 1;
let stars = [], motes = [], shooting = null;
let running = false, last = 0, paused = false, lowFx = false;
let sky = null, skyKey = '', skyAt = 0;
let raf = 0;
const spriteCache = new Map();

export function initBg(el) {
  canvas = el;
  g = canvas.getContext('2d');
  resize();
  window.addEventListener('resize', resize);
  running = true;
  raf = requestAnimationFrame(loop);
}

export function setBgPaused(p) {
  paused = p;
  if (!p && running) { cancelAnimationFrame(raf); raf = requestAnimationFrame(loop); }
}
export function setBgLowFx(v) { lowFx = v; resize(); }

// Painted scenes behind the sky layer: theme -> scene key; the resolver maps a key to an asset URL (or null).
const SCENES = { default: 'home', heroes: 'summon', adventure: 'map', pvp: 'pvp', shop: 'shop', study: 'study' };
let sceneResolver = () => null;
let sceneActive = false, sceneUrl = '', sceneFlip = 0;
export function setSceneResolver(fn) { sceneResolver = fn; }
function showScene(name) {
  const el = document.getElementById('scene');
  if (!el) return;
  const url = sceneResolver(SCENES[name] || 'home');
  if (url === sceneUrl) return;
  sceneUrl = url || '';
  sceneActive = !!url;
  const layers = el.children;
  sceneFlip = 1 - sceneFlip;
  const on = layers[sceneFlip], off = layers[1 - sceneFlip];
  if (url) on.style.backgroundImage = `url("${url}")`;
  on.classList.toggle('on', !!url);
  off.classList.remove('on');
  sky = null;
}

export function setBgTheme(name) {
  showScene(name);
  const t = THEMES[name] || THEMES.default;
  if (t === target) return;
  theme = blend(theme, target, mixT);
  target = t;
  mixT = 0;
}

function resize() {
  if (!canvas) return;
  dpr = Math.min(window.devicePixelRatio || 1, lowFx ? 1 : 1.5);
  w = canvas.clientWidth || window.innerWidth;
  h = canvas.clientHeight || window.innerHeight;
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  stars = Array.from({ length: Math.round((w * h) / (lowFx ? 5200 : 2600)) }, () => ({ x: Math.random() * w, y: Math.random() * h * 0.85, r: Math.random() * 1.3 + 0.3, p: Math.random() * 6.28, s: 0.5 + Math.random() * 2 }));
  motes = Array.from({ length: lowFx ? 10 : 26 }, () => newMote(true));
  sky = null;
}

function newMote(any) {
  return { x: Math.random() * w, y: any ? Math.random() * h : h + 10, r: 1 + Math.random() * 2.6, vy: 8 + Math.random() * 22, vx: (Math.random() - 0.5) * 8, p: Math.random() * 6.28, life: 0 };
}

function hex(c) { const n = parseInt(c.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function lerpHex(a, b, t) {
  const A = hex(a), B = hex(b);
  return '#' + [0, 1, 2].map((i) => Math.round(A[i] + (B[i] - A[i]) * t).toString(16).padStart(2, '0')).join('');
}
function blend(a, b, t) { const o = {}; for (const k in a) o[k] = t >= 1 ? b[k] : t <= 0 ? a[k] : lerpHex(a[k], b[k], t); return o; }

function moteSprite(color) {
  let c = spriteCache.get(color);
  if (c) return c;
  c = document.createElement('canvas');
  c.width = c.height = 32;
  const x = c.getContext('2d');
  const [r, gg, b] = hex(color);
  const gr = x.createRadialGradient(16, 16, 0, 16, 16, 16);
  gr.addColorStop(0, `rgba(${r},${gg},${b},1)`);
  gr.addColorStop(0.35, `rgba(${r},${gg},${b},.45)`);
  gr.addColorStop(1, `rgba(${r},${gg},${b},0)`);
  x.fillStyle = gr;
  x.fillRect(0, 0, 32, 32);
  spriteCache.set(color, c);
  return c;
}

function drawSky(T, time) {
  if (!sky) { sky = document.createElement('canvas'); }
  const sw = Math.max(1, Math.round(w * 0.5)), sh = Math.max(1, Math.round(h * 0.5)); // half-res is plenty for soft gradients
  if (sky.width !== sw || sky.height !== sh) { sky.width = sw; sky.height = sh; }
  const x = sky.getContext('2d');
  x.setTransform(0.5, 0, 0, 0.5, 0, 0);
  const bg = x.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, T.top); bg.addColorStop(0.55, T.mid); bg.addColorStop(1, T.bot);
  x.fillStyle = bg;
  x.fillRect(0, 0, w, h);
  x.globalCompositeOperation = 'lighter';
  const blob = (bx, by, r, c, a) => {
    const [R, G, B] = hex(c);
    const gr = x.createRadialGradient(bx, by, 0, bx, by, r);
    gr.addColorStop(0, `rgba(${R},${G},${B},${a})`);
    gr.addColorStop(1, `rgba(${R},${G},${B},0)`);
    x.fillStyle = gr;
    x.fillRect(bx - r, by - r, r * 2, r * 2);
  };
  blob(w * (0.3 + 0.08 * Math.sin(time * 0.05)), h * 0.28, w * 0.8, T.neb1, 0.22);
  blob(w * (0.75 + 0.06 * Math.cos(time * 0.04)), h * 0.55, w * 0.7, T.neb2, 0.18);
  x.globalCompositeOperation = 'source-over';
}

function loop(ts) {
  if (!running || paused) return;
  raf = requestAnimationFrame(loop);
  if (ts - last < 32) return; // ~30 fps is plenty for a backdrop
  const dt = Math.min(0.1, (ts - last) / 1000 || 0.033);
  last = ts;
  if (mixT < 1) mixT = Math.min(1, mixT + dt * 1.2);
  const T = mixT >= 1 ? target : blend(theme, target, mixT);
  const time = ts / 1000;
  const key = mixT >= 1 ? 'static' : 'fade';
  if (!sky || key === 'fade' || skyKey !== key || time - skyAt > 4) { drawSky(T, time); skyKey = key; skyAt = time; }
  draw(T, dt, time);
}

function draw(T, dt, time) {
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (sceneActive) {
    // painted scene underneath: only a soft theme tint (keeps the UI readable) + motes
    g.clearRect(0, 0, w, h);
    g.globalAlpha = 0.42;
    g.drawImage(sky, 0, 0, w, h);
    g.globalAlpha = 1;
  } else g.drawImage(sky, 0, 0, w, h);
  g.globalCompositeOperation = 'lighter';
  g.fillStyle = '#ffffff';
  for (const s of (sceneActive ? [] : stars)) {
    g.globalAlpha = 0.3 + 0.6 * (0.5 + 0.5 * Math.sin(time * s.s + s.p));
    g.fillRect(s.x, s.y, s.r, s.r);
  }
  const spr = moteSprite(T.mote);
  for (const m of motes) {
    m.y -= m.vy * dt;
    m.x += (m.vx + Math.sin(time + m.p) * 6) * dt;
    m.life += dt;
    if (m.y < -10) Object.assign(m, newMote(false));
    g.globalAlpha = Math.min(1, m.life) * (0.4 + 0.4 * Math.sin(time * 2 + m.p));
    const s = m.r * 8;
    g.drawImage(spr, m.x - s / 2, m.y - s / 2, s, s);
  }
  g.globalAlpha = 1;
  if (!lowFx && !shooting && Math.random() < dt * 0.08) shooting = { x: Math.random() * w * 0.8 + w * 0.2, y: Math.random() * h * 0.3, t: 0 };
  if (shooting) {
    shooting.t += dt;
    const k = shooting.t / 0.9;
    const x = shooting.x - k * w * 0.5, y = shooting.y + k * h * 0.25;
    const grd = g.createLinearGradient(x, y, x + 80, y - 40);
    grd.addColorStop(0, `rgba(255,255,255,${0.9 * (1 - k)})`);
    grd.addColorStop(1, 'rgba(255,255,255,0)');
    g.strokeStyle = grd;
    g.lineWidth = 2;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + 80, y - 40); g.stroke();
    if (k >= 1) shooting = null;
  }
  g.globalCompositeOperation = 'source-over';
}
