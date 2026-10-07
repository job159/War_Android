// Texture factory for the WebGL renderer: particle sprites (from fx/particles.js canvases), high-res
// procedural effect textures (rings, beams, slashes, flares, magic circles, fog) and loaded art textures.
// Everything is cached per (kind, color) so effects can request textures freely every frame.
import { Texture } from 'pixi.js';
import { sprite } from '../fx/particles.js';

const cache = new Map();

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

export function rgb(hex) {
  const n = parseInt(String(hex).slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
export const hexNum = (hex) => parseInt(String(hex).slice(1), 16);
const rgba = (hex, a) => { const [r, g, b] = rgb(hex); return `rgba(${r},${g},${b},${a})`; };

function cached(key, make) {
  let t = cache.get(key);
  if (!t) {
    t = Texture.from(make());
    cache.set(key, t);
  }
  return t;
}

/** Particle texture (64 px canvas sprites shared with the Canvas2D renderer). */
export const ptex = (kind, color = '#ffffff') => cached('p:' + kind + color, () => sprite(kind, color));

/** Soft round glow, 128 px: white-hot center fading to `color`. */
export const glowTex = (color = '#ffffff', core = 0.18) => cached(`glow:${color}:${core}`, () => {
  const c = canvas(128, 128), g = c.getContext('2d');
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(core, rgba(color, 0.95)); gr.addColorStop(0.45, rgba(color, 0.35)); gr.addColorStop(1, rgba(color, 0));
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  return c;
});

/** Thin bright ring, 256 px (shockwaves, impact rings). */
export const ringTex = (color = '#ffffff', w = 0.06) => cached(`ring:${color}:${w}`, () => {
  const c = canvas(256, 256), g = c.getContext('2d');
  const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  const e = 1 - w;
  gr.addColorStop(0, rgba(color, 0)); gr.addColorStop(Math.max(0, e - 0.25), rgba(color, 0)); gr.addColorStop(e - 0.04, rgba(color, 0.55));
  gr.addColorStop(e, 'rgba(255,255,255,1)'); gr.addColorStop(Math.min(1, e + 0.035), rgba(color, 0.6)); gr.addColorStop(1, rgba(color, 0));
  g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  return c;
});

/** Horizontal energy beam, 256x64: white core line, colored body, soft edges. */
export const beamTex = (color = '#ffffff') => cached('beam:' + color, () => {
  const c = canvas(256, 64), g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 0, 64);
  gr.addColorStop(0, rgba(color, 0)); gr.addColorStop(0.3, rgba(color, 0.55)); gr.addColorStop(0.44, rgba(color, 0.95));
  gr.addColorStop(0.5, 'rgba(255,255,255,1)'); gr.addColorStop(0.56, rgba(color, 0.95)); gr.addColorStop(0.7, rgba(color, 0.55)); gr.addColorStop(1, rgba(color, 0));
  g.fillStyle = gr; g.fillRect(0, 0, 256, 64);
  // soft ends
  g.globalCompositeOperation = 'destination-in';
  const end = g.createLinearGradient(0, 0, 256, 0);
  end.addColorStop(0, 'rgba(0,0,0,0)'); end.addColorStop(0.06, 'rgba(0,0,0,1)'); end.addColorStop(0.94, 'rgba(0,0,0,1)'); end.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = end; g.fillRect(0, 0, 256, 64);
  return c;
});

/** Vertical light pillar, 64x256 (beamTex rotated, brighter top fade). */
export const pillarTex = (color = '#ffffff') => cached('pillar:' + color, () => {
  const c = canvas(64, 256), g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 64, 0);
  gr.addColorStop(0, rgba(color, 0)); gr.addColorStop(0.32, rgba(color, 0.6)); gr.addColorStop(0.5, 'rgba(255,255,255,1)'); gr.addColorStop(0.68, rgba(color, 0.6)); gr.addColorStop(1, rgba(color, 0));
  g.fillStyle = gr; g.fillRect(0, 0, 64, 256);
  g.globalCompositeOperation = 'destination-in';
  const v = g.createLinearGradient(0, 0, 0, 256);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(0.35, 'rgba(0,0,0,.85)'); v.addColorStop(0.92, 'rgba(0,0,0,1)'); v.addColorStop(1, 'rgba(0,0,0,.4)');
  g.fillStyle = v; g.fillRect(0, 0, 64, 256);
  return c;
});

/** Crescent sword trail, 512x256 (arc from left to right across the top, thick in the middle). */
export const slashTex = (color = '#ffffff') => cached('slash:' + color, () => {
  const c = canvas(512, 256), g = c.getContext('2d');
  g.translate(256, 250);
  const R = 236;
  for (let i = 0; i < 64; i++) {
    const t = i / 63;
    const a = Math.PI + t * Math.PI;
    const thick = Math.sin(t * Math.PI) ** 0.8;
    const x = Math.cos(a) * R, y = Math.sin(a) * R;
    const w = 6 + 40 * thick;
    const gr = g.createRadialGradient(x, y, 0, x, y, w);
    gr.addColorStop(0, `rgba(255,255,255,${0.9 * thick})`); gr.addColorStop(0.35, rgba(color, 0.7 * thick)); gr.addColorStop(1, rgba(color, 0));
    g.fillStyle = gr;
    g.beginPath(); g.arc(x, y, w, 0, Math.PI * 2); g.fill();
  }
  return c;
});

/**
 * Weapon-trail ribbon, 256x64: u (x) runs tail -> head (transparent -> opaque), v (y) runs outer edge -> inner
 * edge: a white-hot cutting edge near the outside, the element color glowing inward, soft falloff.
 */
export const trailTex = (color = '#ffffff') => cached('trail:' + color, () => {
  const W = 256, H = 64;
  const c = canvas(W, H), g = c.getContext('2d');
  const img = g.createImageData(W, H);
  const [r, gg, b] = rgb(color);
  const sm = (a, b2, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b2 - a))); return t * t * (3 - 2 * t); };
  for (let y = 0; y < H; y++) {
    const v = y / (H - 1);
    const core = Math.exp(-Math.pow((v - 0.26) / 0.085, 2));
    const body = Math.exp(-Math.pow((v - 0.38) / 0.27, 2)) * 0.85;
    const across = Math.min(1, core + body) * sm(0, 0.1, v);
    for (let x = 0; x < W; x++) {
      const u = x / (W - 1);
      const along = Math.pow(sm(0, 0.62, u), 1.3) * (0.75 + 0.25 * sm(0.75, 1, u));
      const a = across * along;
      const wht = Math.min(1, core * 1.1 * (0.4 + 0.6 * u));
      const i = (y * W + x) * 4;
      img.data[i] = Math.round(r + (255 - r) * wht);
      img.data[i + 1] = Math.round(gg + (255 - gg) * wht);
      img.data[i + 2] = Math.round(b + (255 - b) * wht);
      img.data[i + 3] = Math.round(255 * a);
    }
  }
  g.putImageData(img, 0, 0);
  return c;
});

/** Star flare with long cross spikes, 256 px. */
export const flareTex = (color = '#ffffff') => cached('flare:' + color, () => {
  const c = canvas(256, 256), g = c.getContext('2d');
  g.translate(128, 128);
  const gr = g.createRadialGradient(0, 0, 0, 0, 0, 70);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.2, rgba(color, 0.8)); gr.addColorStop(1, rgba(color, 0));
  g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 70, 0, Math.PI * 2); g.fill();
  for (const [ang, len, w] of [[0, 128, 5], [Math.PI / 2, 128, 5], [Math.PI / 4, 70, 3], [-Math.PI / 4, 70, 3]]) {
    g.save(); g.rotate(ang);
    const sg = g.createLinearGradient(-len, 0, len, 0);
    sg.addColorStop(0, rgba(color, 0)); sg.addColorStop(0.5, 'rgba(255,255,255,1)'); sg.addColorStop(1, rgba(color, 0));
    g.fillStyle = sg;
    g.beginPath(); g.ellipse(0, 0, len, w, 0, 0, Math.PI * 2); g.fill();
    g.restore();
  }
  return c;
});

/** Procedural magic circle, 512 px (used until / unless the painted circle textures are loaded). */
export const circleTex = (color = '#ffd84a') => cached('circle:' + color, () => {
  const S = 512, c = canvas(S, S), g = c.getContext('2d');
  g.translate(S / 2, S / 2);
  const col = (a) => rgba(color, a);
  const glowStroke = (fn, w, a = 1) => {
    g.strokeStyle = col(0.25 * a); g.lineWidth = w * 4; fn(); g.stroke();
    g.strokeStyle = col(0.9 * a); g.lineWidth = w; fn(); g.stroke();
    g.strokeStyle = `rgba(255,255,255,${0.8 * a})`; g.lineWidth = w * 0.35; fn(); g.stroke();
  };
  const circ = (r) => () => { g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); };
  glowStroke(circ(244), 5); glowStroke(circ(222), 2.5); glowStroke(circ(150), 3); glowStroke(circ(128), 1.5);
  // star polygons
  for (const [n, r, step] of [[6, 222, 2], [8, 150, 3]]) {
    glowStroke(() => {
      g.beginPath();
      for (let i = 0; i <= n; i++) { const a = ((i * step) / n) * Math.PI * 2 - Math.PI / 2; const x = Math.cos(a) * r, y = Math.sin(a) * r; if (i) g.lineTo(x, y); else g.moveTo(x, y); }
    }, 2);
  }
  // rune ticks around the rim
  g.fillStyle = col(0.95);
  for (let i = 0; i < 48; i++) {
    const a = (i / 48) * Math.PI * 2;
    g.save(); g.rotate(a); g.translate(0, -233);
    if (i % 4 === 0) { g.fillRect(-5, -6, 10, 12); } else { g.fillRect(-1.5, -4, 3, 8); }
    g.restore();
  }
  // glyphs between the rings
  g.font = 'bold 22px serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  const glyphs = 'ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊᛏᛒᛖᛗᛚᛜᛞᛟ';
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    g.save(); g.rotate(a); g.translate(0, -187);
    g.fillStyle = col(0.9); g.fillText(glyphs[i], 0, 0);
    g.restore();
  }
  const gr = g.createRadialGradient(0, 0, 0, 0, 0, 250);
  gr.addColorStop(0, col(0.32)); gr.addColorStop(0.6, col(0.1)); gr.addColorStop(1, col(0));
  g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 250, 0, Math.PI * 2); g.fill();
  return c;
});

/** Tileable soft noise (fog / mist layers), 256 px grayscale. */
export const fogTex = () => cached('fog', () => {
  const S = 256, c = canvas(S, S), g = c.getContext('2d');
  const img = g.createImageData(S, S);
  // sum of a few wrapped value-noise octaves
  const oct = (cells, seed) => {
    const v = new Float32Array(cells * cells);
    let s = seed;
    for (let i = 0; i < v.length; i++) { s = (s * 16807) % 2147483647; v[i] = s / 2147483647; }
    return (x, y) => {
      const fx = (x / S) * cells, fy = (y / S) * cells;
      const x0 = Math.floor(fx), y0 = Math.floor(fy), tx = fx - x0, ty = fy - y0;
      const at = (i, j) => v[((j % cells + cells) % cells) * cells + ((i % cells + cells) % cells)];
      const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
      return (at(x0, y0) * (1 - sx) + at(x0 + 1, y0) * sx) * (1 - sy) + (at(x0, y0 + 1) * (1 - sx) + at(x0 + 1, y0 + 1) * sx) * sy;
    };
  };
  const o = [oct(4, 11), oct(8, 23), oct(16, 37)];
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const n = o[0](x, y) * 0.55 + o[1](x, y) * 0.3 + o[2](x, y) * 0.15;
      const v = Math.max(0, Math.min(1, (n - 0.35) * 2.2));
      const i = (y * S + x) * 4;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = 255;
      img.data[i + 3] = v * 255;
    }
  }
  g.putImageData(img, 0, 0);
  return c;
});

/** Radial light rays (god rays / summon bursts), 512 px. */
export const raysTex = (color = '#ffffff', n = 18) => cached(`rays:${color}:${n}`, () => {
  const S = 512, c = canvas(S, S), g = c.getContext('2d');
  g.translate(S / 2, S / 2);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + (i % 3) * 0.05;
    const w = 0.035 + (i % 4) * 0.012;
    const gr = g.createLinearGradient(0, 0, Math.cos(a) * 256, Math.sin(a) * 256);
    gr.addColorStop(0, rgba(color, 0.9)); gr.addColorStop(1, rgba(color, 0));
    g.fillStyle = gr;
    g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, 256, a - w, a + w); g.closePath(); g.fill();
  }
  return c;
});

/** Soft black ellipse for unit shadows. */
export const shadowTex = () => cached('shadow', () => {
  const c = canvas(128, 64), g = c.getContext('2d');
  const gr = g.createRadialGradient(64, 32, 0, 64, 32, 64);
  gr.addColorStop(0, 'rgba(0,0,0,.6)'); gr.addColorStop(0.6, 'rgba(0,0,0,.25)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.save(); g.scale(1, 0.5); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); g.restore();
  return c;
});

/** Vertical gradient used to darken the bottom of the battlefield and for vignettes. */
export const vignetteTex = () => cached('vignette', () => {
  const c = canvas(256, 256), g = c.getContext('2d');
  const gr = g.createRadialGradient(128, 140, 60, 128, 140, 190);
  gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.55)');
  g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  return c;
});

// ------------------------------------------------------------------ loaded art

const art = new Map();
/** Loads an image URL as a texture (cached). Resolves to null when the file is missing. */
export function loadTex(url) {
  if (!art.has(url)) {
    art.set(url, new Promise((res) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => res(Texture.from(img));
      img.onerror = () => res(null);
      img.src = url;
    }));
  }
  return art.get(url);
}

/** White silhouette of a texture (hit flashes). */
export function silhouette(tex) {
  const key = 'sil:' + tex.uid;
  if (cache.has(key)) return cache.get(key);
  const src = tex.source.resource;
  const w = tex.source.width, h = tex.source.height;
  const c = canvas(w, h), g = c.getContext('2d');
  g.drawImage(src, 0, 0, w, h);
  g.globalCompositeOperation = 'source-in';
  g.fillStyle = '#ffffff';
  g.fillRect(0, 0, w, h);
  const t = Texture.from(c);
  cache.set(key, t);
  return t;
}
