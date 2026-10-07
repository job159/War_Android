// Full-screen WebGL effect layer for menus (summon animation, celebrations): transparent canvas, bloomed
// additive particles, and the same primitives as battles (gfx/vfx.js). Returns null without WebGL.
import { Application, Container, Rectangle } from 'pixi.js';
import { AdvancedBloomFilter, ShockwaveFilter } from 'pixi-filters';
import { GFX } from './fx.js';
import { preloadFxArt } from './vfx.js';

export async function createFxOverlay(canvas, { quality = 'high' } = {}) {
  const high = quality !== 'low';
  const app = new Application();
  try {
    const r = canvas.getBoundingClientRect();
    await app.init({ canvas, width: Math.max(10, r.width), height: Math.max(10, r.height), resolution: Math.min(2, window.devicePixelRatio || 1) * (high ? 1 : 0.75),
      autoDensity: false, backgroundAlpha: 0, antialias: false, preference: 'webgl', powerPreference: 'high-performance' });
  } catch (e) {
    console.warn('fx overlay unavailable', e);
    try { app.destroy(); } catch { /* ignore */ }
    return null;
  }
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  preloadFxArt();
  const world = new Container();
  const under = new Container(), add = new Container(), normal = new Container();
  world.addChild(under, normal, add);
  app.stage.addChild(world);
  const view = {
    w: app.screen.width, h: app.screen.height, high,
    shake: (a, dur = 0.25) => { canvas.parentElement && canvas.parentElement.animate([{ transform: `translate(${a}px,${-a / 2}px)` }, { transform: `translate(${-a}px,${a / 2}px)` }, { transform: 'none' }], { duration: dur * 1000, iterations: 1 }); },
    flash: () => {}, dim: () => {}, punch: () => {}, aberrate: () => {}, radialBlur: () => {}, hitStop: () => {},
    shockwave: (x, y, { amp = 26, wave = 140, speed = 900 } = {}) => {
      if (!high) return;
      const f = new ShockwaveFilter({ center: { x, y }, amplitude: amp, wavelength: wave, speed, brightness: 1.2, radius: -1, time: 0 });
      waves.push({ f, t: 0 });
    },
  };
  const fx = new GFX({ under, add, normal });
  fx.setQuality(high);
  const area = new Rectangle(0, 0, view.w, view.h);
  if (high) {
    const bloom = new AdvancedBloomFilter({ threshold: 0.4, bloomScale: 1.3, brightness: 1.05, blur: 8, quality: 5, resolution: 0.5 });
    bloom.resolution = 0.5;
    add.filters = [bloom];
    add.filterArea = area;
  }
  const waves = [];
  let last = performance.now();
  app.ticker.add(() => {
    const now = performance.now();
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    fx.update(dt);
    for (const w of waves) w.t += dt;
    for (let i = waves.length - 1; i >= 0; i--) if (waves[i].t > 1.2) waves.splice(i, 1);
    for (const w of waves) w.f.time = w.t;
    world.filters = waves.length ? waves.map((w) => w.f) : null;
    world.filterArea = area;
  });
  return {
    app, fx, view,
    destroy() {
      const gl = app.renderer && app.renderer.gl;
      try { fx.destroy(); app.destroy({ removeView: false }, { children: true }); } catch { /* ignore */ }
      try { gl && gl.getExtension('WEBGL_lose_context') && gl.getExtension('WEBGL_lose_context').loseContext(); } catch { /* ignore */ }
    },
  };
}
