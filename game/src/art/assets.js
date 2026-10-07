// Painted (SDXL) art: game/assets/manifest.json lists what exists, written by art/post.py.
// Every lookup returns null when the painting is missing, so callers fall back to the procedural SVG art.
let M = { heroes: {}, monsters: {}, bg: [], fx: [] };

export async function loadManifest() {
  try {
    const r = await fetch('assets/manifest.json', { cache: 'no-cache' });
    if (r.ok) M = { heroes: {}, monsters: {}, bg: [], fx: [], ...(await r.json()) };
  } catch { /* offline web build without assets: procedural art only */ }
  return M;
}

export const manifest = () => M;

/** Hero art: crop 'face' (256 sq) | 'bust' (480x600 card) | default full body; battle: true -> chibi sprite. */
export function heroAsset(id, { skin, crop, battle } = {}) {
  const h = M.heroes[id];
  if (!h) return null;
  const s = skin && h.skin ? 'skin' : 'main';
  if (battle) {
    const part = s === 'skin' && h.skinchibi ? 'skinchibi' : h.chibi ? 'chibi' : null;
    return part ? `assets/heroes/${id}/${part}.webp` : null;
  }
  if (!h[s]) return null;
  if (crop === 'face') return `assets/heroes/${id}/${s}_face.webp`;
  if (crop === 'bust') return `assets/heroes/${id}/${s}_bust.webp`;
  return `assets/heroes/${id}/${s}.webp`;
}

/** Monster art by enemy id + element; falls back to the same enemy in another element. */
export function monsterAsset(id, el) {
  if (!id) return null;
  if (M.monsters[`${id}_${el}`]) return `assets/monsters/${id}_${el}.webp`;
  const any = Object.keys(M.monsters).find((k) => k.startsWith(id + '_'));
  return any ? `assets/monsters/${any}.webp` : null;
}

export const bgAsset = (key) => (M.bg.includes(key) ? `assets/bg/${key}.webp` : null);
export const fxAssets = () => M.fx.slice();

/** Full-body painting + its face box (normalized), for close-up framing (cut-ins, showcases). */
export function heroArt(id, skin) {
  const h = M.heroes[id];
  if (!h) return null;
  const s = skin && h.skin ? 'skin' : 'main';
  const e = h[s];
  if (!e) return null;
  return { url: `assets/heroes/${id}/${s}.webp`, w: e.w, h: e.h, face: e.face || [0.5, 0.12, 0.14] };
}

/** Inline style that paints a scene behind a card / header when the painting exists ('' otherwise). */
export const sceneStyle = (key, pos = 'center') => {
  const u = bgAsset(key);
  return u ? ` style="background:url('${u}') ${pos} / cover no-repeat"` : '';
};

/** Battle key poses for a hero: { idle, atk, cast, hurt } URLs + face metadata (poses only without a skin). */
export function heroBattleArt(id, skin) {
  const h = M.heroes[id];
  if (!h) return null;
  const useSkin = skin && h.skinchibi;
  const idleKey = useSkin ? 'skinchibi' : h.chibi ? 'chibi' : null;
  if (!idleKey) return null;
  const out = { urls: { idle: `assets/heroes/${id}/${idleKey}.webp` }, meta: { idle: h[idleKey] } };
  for (const k of ['atk', 'cast', 'hurt']) {
    const key = useSkin ? 'skin' + k : k;
    if (h[key]) { out.urls[k] = `assets/heroes/${id}/${key}.webp`; out.meta[k] = h[key]; }
  }
  return out;
}

/** Face / size metadata of a monster painting (for puppet alignment), or null. */
export function monsterMeta(id, el) {
  return M.monsters[`${id}_${el}`] || null;
}
