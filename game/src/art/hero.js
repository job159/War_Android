// Procedural chibi hero art (SVG). Every hero is built from parts: back items (wings, capes, tails),
// back hair, body + outfit, arms, head (face, eyes, mouth), front hair, headwear and weapon.
//
//   heroSVG(hero, { expr, crop, skin, uid }) -> svg string
//   expr: normal | happy | angry | hurt | wink        crop: full | bust | face | card
//
// Canvas: viewBox space 240 x 320 (x 0..240, y -20..300). Head center ~ (120,112), feet ~ y 282.
import { heroAsset } from './assets.js';
import { lighten, darken, ink, mix } from './color.js';

const CROPS = {
  full: '0 -22 240 324',
  card: '14 -6 212 300',
  bust: '40 18 160 170',
  face: '58 46 124 124',
  cutin: '20 -10 200 230',
};

let uidSeq = 0;

export function heroArt(hero, skinId) {
  const a = hero.art;
  const sk = skinId && hero.skin && hero.skin.id === skinId ? hero.skin : null;
  if (!sk) return a;
  const p = sk.palette || {};
  return {
    ...a,
    hair: p.hair ? { ...a.hair, c1: p.hair[0], c2: p.hair[1] } : a.hair,
    outfit: p.outfit ? { ...a.outfit, c1: p.outfit[0], c2: p.outfit[1], c3: p.outfit[2] } : a.outfit,
    aura: sk.aura || a.aura,
  };
}

export function heroSVG(hero, opts = {}) {
  const s = heroArt(hero, opts.skin);
  const id = 'h' + (opts.uid || ++uidSeq);
  const expr = opts.expr || 'normal';
  const crop = CROPS[opts.crop || 'full'] || CROPS.full;
  const ctx = makeCtx(s, id, hero.element);
  const parts = [];
  parts.push(defs(ctx));
  if (opts.aura) parts.push(auraLayer(ctx));
  parts.push(backItems(ctx));
  parts.push(backHair(ctx));
  const w = weaponParts(ctx);
  parts.push(w.back);
  parts.push(legs(ctx));
  parts.push(body(ctx));
  parts.push(w.under);
  parts.push(arms(ctx));
  parts.push(w.over);
  parts.push(head(ctx, expr));
  parts.push(frontHair(ctx));
  parts.push(headwear(ctx));
  parts.push(w.front);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${crop}" preserveAspectRatio="xMidYMid meet">${parts.join('')}</svg>`;
}

// ------------------------------------------------------------------ context & defs

function makeCtx(s, id, element) {
  const hair = s.hair || { style: 'short', c1: '#6a4a3a', c2: '#3a2a20' };
  const o = s.outfit || { type: 'tunic', c1: '#5a7ac8', c2: '#e8c84a', c3: '#ffffff' };
  return {
    s, id, element,
    female: s.gender !== 'm',
    skin: s.skin || '#ffe2cc',
    skinShade: mix(s.skin || '#ffe2cc', '#e08a7a', 0.35),
    hair, h1: hair.c1, h2: hair.c2, hInk: ink(hair.c2, 0.5),
    eye: (s.eyes && s.eyes.c) || '#5a8ad8',
    eyeShape: (s.eyes && s.eyes.shape) || 'soft',
    o, o1: o.c1, o2: o.c2, o3: o.c3 || '#ffffff',
    acc: s.acc || [], back: s.back || [],
    weapon: s.weapon || null,
    aura: s.aura,
    u: (n) => `${id}-${n}`,
  };
}

function lg(id, x1, y1, x2, y2, stops) {
  return `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a != null ? ` stop-opacity="${a}"` : ''}/>`).join('')}</linearGradient>`;
}
function rg(id, cx, cy, r, stops, fx, fy) {
  return `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}"${fx != null ? ` fx="${fx}" fy="${fy}"` : ''}>${stops.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a != null ? ` stop-opacity="${a}"` : ''}/>`).join('')}</radialGradient>`;
}

function defs(c) {
  const { u } = c;
  return `<defs>
${lg(u('hair'), 0, 0, 0, 1, [[0, lighten(c.h1, 0.12)], [0.45, c.h1], [1, c.h2]])}
${lg(u('hairB'), 0, 0, 0, 1, [[0, c.h2], [1, darken(c.h2, 0.25)]])}
${lg(u('skin'), 0, 0, 0, 1, [[0, lighten(c.skin, 0.08)], [1, c.skin]])}
${lg(u('o1'), 0, 0, 0, 1, [[0, lighten(c.o1, 0.12)], [1, darken(c.o1, 0.12)]])}
${lg(u('o2'), 0, 0, 0, 1, [[0, lighten(c.o2, 0.18)], [1, darken(c.o2, 0.1)]])}
${lg(u('o3'), 0, 0, 0, 1, [[0, lighten(c.o3, 0.1)], [1, darken(c.o3, 0.08)]])}
${lg(u('iris'), 0, 0, 0, 1, [[0, darken(c.eye, 0.55)], [0.5, c.eye], [1, lighten(c.eye, 0.55)]])}
${lg(u('metal'), 0, 0, 1, 1, [[0, '#ffffff'], [0.45, '#d8dee8'], [1, '#8a92a4']])}
${lg(u('gold'), 0, 0, 1, 1, [[0, '#fff3b8'], [0.5, '#f2c64a'], [1, '#b8862a']])}
${rg(u('cheek'), 0.5, 0.5, 0.5, [[0, '#ff7a8a', 0.55], [1, '#ff7a8a', 0]])}
${rg(u('glow'), 0.5, 0.5, 0.5, [[0, '#ffffff', 0.9], [0.4, c.weapon ? (c.weapon.c2 || '#fff') : '#fff', 0.6], [1, c.weapon ? (c.weapon.c2 || '#fff') : '#fff', 0]])}
</defs>`;
}

const AURA_COLORS = {
  holy: ['#fff6c4', '#ffd84a'], flame: ['#ffd08a', '#ff5a3c'], wind: ['#c8ffe0', '#36d68a'], snow: ['#e8f8ff', '#7fd4ff'],
  dark: ['#e0c4ff', '#8f52ff'], earth: ['#ffe6b0', '#d39a45'], bubbles: ['#d8f6ff', '#3ca8ff'], notes: ['#d8fff0', '#3ac8a0'],
  runes: ['#fff2c8', '#e8c84a'], leaves: ['#e8ffc8', '#7ad84a'], stars: ['#e8eeff', '#8aa8ff'], petals: ['#ffe4f0', '#ff8ab8'],
  embers: ['#ffe0a8', '#ff6a2a'], sparkle: ['#fff0f8', '#ff9ad8'], feathers: ['#ffffff', '#c8d4ff'], void: ['#e8e0ff', '#5a3aff'],
  crystal: ['#e0fff4', '#3ad0a0'], bats: ['#ffd8b0', '#ff8a2a'], hearts: ['#ffe0ee', '#ff6aa8'],
};

function auraLayer(c) {
  const [a, b] = AURA_COLORS[c.aura] || AURA_COLORS.holy;
  return `${rg(c.u('aura'), 0.5, 0.5, 0.5, [[0, a, 0.85], [0.45, b, 0.35], [1, b, 0]])}
<ellipse cx="120" cy="150" rx="118" ry="150" fill="url(#${c.u('aura')})"/>`;
}

// ------------------------------------------------------------------ back items

function backItems(c) {
  let out = '';
  for (const b of c.back) {
    if (b === 'angelWings') out += wingPair(c, '#ffffff', '#c8d8ff', 'feather');
    else if (b === 'fireWings') out += fireWings(c);
    else if (b === 'batWings') out += batWings(c);
    else if (b === 'cape') out += cape(c, c.o3 === '#ffffff' ? c.o2 : c.o3, c.o2, 268);
    else if (b === 'darkCape') out += cape(c, '#16121e', '#b0102a', 274);
    else if (b === 'shortCape') out += cape(c, darken(c.o1, 0.1), c.o2, 226);
    else if (b === 'scarf') out += scarfBack(c);
    else if (b === 'dragonTail') out += dragonTail(c);
    else if (b === 'devilTail') out += devilTail(c);
  }
  return out;
}

function wingPair(c, fill, shade) {
  const one = (sx) => {
    const t = (x) => 120 + (x - 120) * sx;
    const feathers = [];
    for (let i = 0; i < 6; i++) {
      const y = 150 + i * 14;
      const len = 92 - i * 10;
      feathers.push(`M${t(134)},${y - 4} Q${t(134 + len * 0.6)},${y - 34 + i * 3} ${t(134 + len)},${y - 18 + i * 6} Q${t(134 + len * 0.55)},${y + 6} ${t(134)},${y + 8} Z`);
    }
    return `<g opacity="0.97">
<path d="M${t(132)},150 C${t(170)},86 ${t(226)},70 ${t(236)},92 C${t(222)},104 ${t(214)},126 ${t(200)},138 C${t(214)},142 ${t(206)},170 ${t(186)},176 C${t(196)},188 ${t(180)},212 ${t(158)},210 C${t(150)},196 ${t(140)},180 ${t(132)},170 Z" fill="${fill}" stroke="${shade}" stroke-width="2"/>
${feathers.map((d) => `<path d="${d}" fill="${lighten(shade, 0.55)}" stroke="${shade}" stroke-width="1.2" opacity="0.9"/>`).join('')}
</g>`;
  };
  return one(1) + one(-1);
}

function fireWings(c) {
  const g = c.u('fw');
  const one = (sx, k) => {
    const t = (x) => 120 + (x - 120) * sx;
    const y0 = 128 + k * 36;
    const L = 110 - k * 18;
    return `<path d="M${t(136)},${y0 + 30} C${t(160)},${y0 - 10} ${t(136 + L * 0.8)},${y0 - 40} ${t(136 + L)},${y0 - 30} C${t(136 + L * 0.75)},${y0 - 12} ${t(136 + L * 0.9)},${y0 + 2} ${t(136 + L * 0.7)},${y0 + 10} C${t(136 + L * 0.8)},${y0 + 22} ${t(136 + L * 0.5)},${y0 + 30} ${t(136 + L * 0.42)},${y0 + 40} C${t(160)},${y0 + 46} ${t(146)},${y0 + 46} ${t(136)},${y0 + 44} Z" fill="url(#${g})" stroke="#ff6a2a" stroke-width="1.5" opacity="${0.95 - k * 0.12}"/>`;
  };
  return `${lg(g, 0, 0, 1, 0, [[0, '#ffe6a0'], [0.5, '#ff9a3a'], [1, '#ff3a1a', 0.85]])}
${[2, 1, 0].map((k) => one(1, k) + one(-1, k)).join('')}`;
}

function batWings(c) {
  const fill = '#2a1a3a';
  const one = (sx) => {
    const t = (x) => 120 + (x - 120) * sx;
    return `<path d="M${t(134)},178 C${t(150)},150 ${t(178)},132 ${t(204)},130 C${t(198)},144 ${t(206)},150 ${t(200)},160 C${t(190)},158 ${t(186)},166 ${t(186)},176 C${t(176)},172 ${t(166)},178 ${t(166)},190 C${t(154)},186 ${t(144)},190 ${t(134)},194 Z" fill="${fill}" stroke="${mix(fill, c.o2, 0.5)}" stroke-width="2"/>
<path d="M${t(140)},180 L${t(200)},132 M${t(140)},184 L${t(186)},166 M${t(140)},188 L${t(166)},180" stroke="${c.o2}" stroke-width="1.2" opacity="0.6"/>`;
  };
  return one(1) + one(-1);
}

function cape(c, fill, inner, bottom) {
  return `<path d="M92,172 C76,206 64,${bottom - 40} 58,${bottom} Q90,${bottom - 10} 120,${bottom + 4} Q150,${bottom - 10} 182,${bottom} C176,${bottom - 40} 164,206 148,172 Z" fill="${inner}" stroke="${ink(inner)}" stroke-width="2"/>
<path d="M92,172 C80,206 72,${bottom - 44} 68,${bottom - 6} Q94,${bottom - 16} 120,${bottom - 4} Q146,${bottom - 16} 172,${bottom - 6} C168,${bottom - 44} 160,206 148,172 Z" fill="${fill}" opacity="0.96"/>`;
}

function scarfBack(c) {
  const col = c.o2;
  return `<path d="M136,174 C166,170 190,176 214,160 C206,176 214,188 208,196 C190,190 170,196 150,192 Z" fill="${col}" stroke="${ink(col)}" stroke-width="2"/>
<path d="M150,184 C176,186 196,198 220,190 C212,204 216,214 210,222 C192,212 174,212 152,200 Z" fill="${darken(col, 0.12)}" stroke="${ink(col)}" stroke-width="2"/>`;
}

function dragonTail(c) {
  const col = c.o2;
  return `<path d="M132,228 C170,240 196,236 210,214 C222,196 214,176 226,168 C236,186 236,214 222,236 C204,262 168,262 136,250 Z" fill="${col}" stroke="${ink(col)}" stroke-width="2"/>
<path d="M150,246 L156,236 L162,248 L170,238 L176,250 L186,240 L190,250" fill="none" stroke="${lighten(col, 0.5)}" stroke-width="2"/>`;
}

function devilTail(c) {
  return `<path d="M128,232 C160,250 182,240 190,214 C194,200 204,194 210,196" fill="none" stroke="#2a1a2a" stroke-width="4" stroke-linecap="round"/>
<path d="M206,186 L222,196 L206,206 L210,196 Z" fill="${c.o2}" stroke="#2a1a2a" stroke-width="1.5"/>`;
}

// ------------------------------------------------------------------ hair

function hairShape(d, c, extra = '') {
  return `<path d="${d}" fill="url(#${c.u('hair')})" stroke="${c.hInk}" stroke-width="2" stroke-linejoin="round" ${extra}/>`;
}
function hairBack(d, c) {
  return `<path d="${d}" fill="url(#${c.u('hairB')})" stroke="${c.hInk}" stroke-width="2" stroke-linejoin="round"/>`;
}

const DOME = 'M58,128 C52,74 84,44 120,44 C156,44 188,74 182,128 C186,150 176,168 170,174 L70,174 C64,168 54,150 58,128 Z';

function backHair(c) {
  const st = c.hair.style;
  let out = '';
  switch (st) {
    case 'long':
    case 'longStraight':
      out += hairBack('M60,112 C44,170 46,236 58,266 L74,258 L88,268 L104,258 L120,268 L136,258 L152,268 L166,258 L182,266 C194,236 196,170 180,112 Z', c);
      break;
    case 'wavy':
      out += hairBack('M60,112 C40,150 52,180 42,210 C34,238 52,262 66,268 C76,256 84,270 96,262 C106,272 118,262 126,270 C138,262 148,272 158,262 C168,270 186,258 194,240 C188,214 204,186 190,158 C184,140 184,124 180,112 Z', c);
      break;
    case 'hime':
      out += hairBack('M60,110 C50,170 52,232 56,272 L184,272 C188,232 190,170 180,110 Z', c);
      break;
    case 'twintails':
      out += hairBack('M62,96 C30,118 22,170 30,214 C36,244 26,262 18,276 C46,270 60,250 62,222 C64,194 56,160 70,124 Z', c);
      out += hairBack('M178,96 C210,118 218,170 210,214 C204,244 214,262 222,276 C194,270 180,250 178,222 C176,194 184,160 170,124 Z', c);
      out += hairBack('M62,120 C58,150 64,170 76,182 L164,182 C176,170 182,150 178,120 Z', c);
      break;
    case 'ponytail':
      out += hairBack('M150,62 C196,60 214,104 206,150 C200,186 212,214 224,234 C198,236 182,214 180,188 C178,160 186,126 164,100 Z', c);
      out += hairBack('M62,120 C58,150 64,170 76,182 L164,182 C176,170 182,150 178,120 Z', c);
      break;
    case 'sidePony':
      out += hairBack('M168,80 C204,90 210,130 200,166 C194,190 202,210 210,226 C186,222 176,204 176,184 C176,158 184,128 166,108 Z', c);
      out += hairBack('M62,120 C58,150 64,170 76,180 L164,180 C176,170 182,150 178,120 Z', c);
      break;
    case 'bob':
    case 'messyF':
      out += hairBack('M60,112 C52,150 56,176 72,186 L168,186 C184,176 188,150 180,112 Z', c);
      break;
    case 'buns':
      out += hairBack('M62,120 C58,150 64,170 76,182 L164,182 C176,170 182,150 178,120 Z', c);
      break;
    case 'braid':
      out += hairBack('M62,118 C56,152 62,176 78,186 L162,186 C178,176 184,152 178,118 Z', c);
      break;
    case 'twinBraids':
      out += hairBack('M62,118 C56,150 62,172 76,180 L164,180 C178,172 184,150 178,118 Z', c);
      break;
    case 'longMale':
      out += hairBack('M60,112 C50,160 54,196 66,206 L84,198 L100,208 L120,200 L140,208 L156,198 L174,206 C186,196 190,160 180,112 Z', c);
      break;
    default: // short, spiky, messy, round, emo
      break;
  }
  // skull dome (always) - the visible hair around and above the face
  out += hairShape(DOME, c);
  return out;
}

function frontHair(c) {
  const st = c.hair.style;
  if (c.acc.includes('veil')) return veilFront(c);
  let out = '';
  const shine = `<path d="M74,86 C92,66 148,66 166,86" fill="none" stroke="#ffffff" stroke-width="5" stroke-linecap="round" opacity="0.38"/>
<path d="M84,80 C96,72 108,70 116,70" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" opacity="0.6"/>`;
  // bangs: jagged fringe hanging over the forehead
  const fringe = {
    default: 'M60,128 C56,80 84,50 120,50 C156,50 184,80 180,128 L172,108 L166,124 L158,98 L148,118 L140,92 L130,114 L120,90 L110,114 L100,92 L92,118 L82,98 L74,124 L68,108 Z',
    soft: 'M60,128 C56,80 84,50 120,50 C156,50 184,80 180,128 C176,112 172,104 166,98 C164,110 160,118 154,122 C154,108 150,98 144,92 C140,104 132,112 124,116 C126,104 124,94 120,88 C114,98 106,108 96,112 C98,102 98,96 96,92 C88,100 84,112 82,122 C78,112 74,104 70,100 C66,108 62,118 60,128 Z',
    hime: 'M60,128 C56,80 84,50 120,50 C156,50 184,80 180,128 L180,106 L60,106 Z',
    side: 'M60,128 C56,80 84,50 120,50 C156,50 184,80 180,128 C176,110 170,100 162,96 C150,104 132,108 112,108 C96,108 84,104 74,100 C68,108 62,116 60,128 Z',
    spiky: 'M56,128 C50,86 70,58 88,52 L80,36 L100,46 L104,26 L120,42 L132,24 L140,44 L160,32 L156,54 C178,64 190,92 184,128 L174,110 L170,124 L160,100 L150,118 L142,96 L132,114 L122,94 L112,116 L102,96 L94,118 L84,100 L76,122 L68,106 Z',
    messy: 'M58,128 C52,84 74,54 100,48 L96,38 L114,44 L124,32 L132,46 L150,40 L148,52 C172,60 190,90 182,128 L174,112 L168,126 L160,102 L152,120 L144,98 L134,116 L124,96 L114,118 L104,98 L96,120 L86,102 L78,124 L70,108 Z',
    emo: 'M58,130 C52,84 80,50 120,50 C158,50 186,80 182,128 L176,112 L170,124 L164,100 L156,116 L150,96 C140,110 132,124 128,140 C120,132 112,122 104,112 C96,124 88,138 84,150 C76,136 70,120 66,110 L62,130 Z',
    round: 'M58,130 C54,82 84,50 120,50 C156,50 186,82 182,130 C180,120 176,114 172,112 L68,112 C64,114 60,120 58,130 Z',
  };
  const key = { long: 'soft', wavy: 'soft', longStraight: 'default', hime: 'hime', twintails: 'default', ponytail: 'side', sidePony: 'side', bob: 'default',
    buns: 'soft', braid: 'side', twinBraids: 'default', short: 'default', spiky: 'spiky', messy: 'messy', messyF: 'messy', longMale: 'side', round: 'round', emo: 'emo' }[st] || 'default';
  out += hairShape(fringe[key], c);
  // side locks framing the face
  const lockLen = { long: 178, longStraight: 182, wavy: 176, hime: 186, twintails: 160, ponytail: 156, sidePony: 160, bob: 166, buns: 158, braid: 160,
    twinBraids: 156, short: 150, spiky: 140, messy: 144, messyF: 160, longMale: 170, round: 146, emo: 150 }[st] || 150;
  if (key === 'hime') {
    out += hairShape(`M60,104 L76,104 L78,${lockLen} L62,${lockLen - 6} Z`, c);
    out += hairShape(`M180,104 L164,104 L162,${lockLen} L178,${lockLen - 6} Z`, c);
  } else {
    out += hairShape(`M62,100 C58,124 60,${lockLen - 20} 68,${lockLen} C72,${lockLen - 24} 74,128 80,108 Z`, c);
    out += hairShape(`M178,100 C182,124 180,${lockLen - 20} 172,${lockLen} C168,${lockLen - 24} 166,128 160,108 Z`, c);
  }
  // style extras drawn in front
  if (st === 'buns') {
    out += hairShape('M58,72 a20,20 0 1,0 40,0 a20,20 0 1,0 -40,0', c) + hairShape('M142,72 a20,20 0 1,0 40,0 a20,20 0 1,0 -40,0', c);
    out += `<path d="M68,64 a8,6 0 0,1 14,-4 M150,60 a8,6 0 0,1 14,4" stroke="#fff" stroke-width="2" fill="none" opacity="0.5"/>`;
  }
  if (st === 'twintails') {
    out += `<circle cx="66" cy="96" r="7" fill="${c.o2}" stroke="${ink(c.o2)}" stroke-width="1.5"/><circle cx="174" cy="96" r="7" fill="${c.o2}" stroke="${ink(c.o2)}" stroke-width="1.5"/>`;
  }
  if (st === 'braid') {
    let b = '';
    for (let i = 0; i < 6; i++) b += hairShape(`M${70 - i * 1.5},${170 + i * 16} a10,9 0 1,0 20,0 a10,9 0 1,0 -20,0`, c);
    out += b + `<path d="M66,262 l6,10 l6,-10 z" fill="${c.o2}"/>`;
  }
  if (st === 'twinBraids') {
    for (const x of [68, 172]) for (let i = 0; i < 5; i++) out += hairShape(`M${x - 9},${166 + i * 15} a9,8 0 1,0 18,0 a9,8 0 1,0 -18,0`, c);
    out += `<circle cx="68" cy="246" r="5" fill="${c.o2}"/><circle cx="172" cy="246" r="5" fill="${c.o2}"/>`;
  }
  if (st === 'ponytail' || st === 'sidePony') {
    out += `<path d="M160,74 l10,-6 l4,10 z" fill="${c.o2}" stroke="${ink(c.o2)}" stroke-width="1"/>`;
  }
  // ahoge (antenna hair) for some styles
  if (['long', 'bob', 'short', 'messyF', 'round', 'wavy'].includes(st)) {
    out += `<path d="M120,52 C116,36 128,30 136,34 C128,36 124,42 124,52 Z" fill="url(#${c.u('hair')})" stroke="${c.hInk}" stroke-width="1.6"/>`;
  }
  return out + shine;
}

function veilFront(c) {
  const v = c.o1;
  return `<path d="M54,140 C46,84 78,44 120,44 C162,44 194,84 186,140 L190,250 C170,256 160,242 156,212 L160,128 C156,96 140,82 120,82 C100,82 84,96 80,128 L84,212 C80,242 70,256 50,250 Z" fill="${v}" stroke="${ink(v, 0.4)}" stroke-width="2"/>
<path d="M80,96 C90,80 150,80 160,96 L160,104 C150,92 90,92 80,104 Z" fill="${c.o2}" stroke="${ink(c.o2, 0.3)}" stroke-width="1.5"/>
<path d="M84,104 C92,96 110,92 120,92 C130,92 148,96 156,104 L150,110 L142,102 L132,112 L120,100 L108,112 L98,102 L90,110 Z" fill="url(#${c.u('hair')})" stroke="${c.hInk}" stroke-width="1.5"/>
<path d="M114,70 h12 M120,62 v18" stroke="${c.o3}" stroke-width="3" stroke-linecap="round"/>`;
}

// ------------------------------------------------------------------ body

function legs(c) {
  const t = c.o.type;
  const longRobe = ['robe', 'gown', 'nun', 'darklord', 'apprentice', 'scholar'].includes(t);
  const boot = { armor: '#c8ccd8', heavyArmor: c.o1, tunic: '#5a3a2a', ranger: '#5a3a2a', barbarian: '#6a4a2a', furCoat: c.o3, ninja: '#2a2a34', squire: '#6a4a2a', messenger: '#6a4a2a', smith: '#5a3a2a' }[t] || darken(c.o2, 0.15);
  const sock = c.female && !['armor', 'heavyArmor', 'ninja', 'barbarian'].includes(t) ? (['gothic', 'witch', 'imp'].includes(t) ? '#2a2030' : '#ffffff') : null;
  if (longRobe) {
    return `<ellipse cx="106" cy="282" rx="11" ry="6" fill="${boot}" stroke="${ink(boot)}" stroke-width="1.6"/><ellipse cx="134" cy="282" rx="11" ry="6" fill="${boot}" stroke="${ink(boot)}" stroke-width="1.6"/>`;
  }
  const leg = (x) => `<path d="M${x - 7},236 L${x - 6},274 L${x + 6},274 L${x + 7},236 Z" fill="${sock || c.skin}" stroke="${ink(sock || c.skin, 0.35)}" stroke-width="1.5"/>`;
  const shoe = (x) => `<path d="M${x - 9},266 L${x + 8},266 L${x + 9},280 C${x + 9},286 ${x - 12},286 ${x - 12},280 Z" fill="${boot}" stroke="${ink(boot)}" stroke-width="1.6"/>
<path d="M${x - 8},270 h15" stroke="${lighten(boot, 0.4)}" stroke-width="1.5" opacity="0.7"/>`;
  return leg(106) + leg(134) + shoe(106) + shoe(134);
}

function body(c) {
  const t = c.o.type;
  const O1 = `url(#${c.u('o1')})`, O2 = `url(#${c.u('o2')})`, O3 = `url(#${c.u('o3')})`;
  const i1 = ink(c.o1), i2 = ink(c.o2), i3 = ink(c.o3, 0.4);
  const neck = `<path d="M112,160 L113,180 L127,180 L128,160 Z" fill="${c.skinShade}"/>`;
  const torso = (fill = O1, stroke = i1) => `<path d="M92,182 C96,174 108,172 120,172 C132,172 144,174 148,182 L152,218 C140,224 100,224 88,218 Z" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
  const skirt = (fill, stroke, len = 248, flare = 22) => `<path d="M92,212 L148,212 L${148 + flare},${len} C${150},${len + 8} ${90},${len + 8} ${92 - flare},${len} Z" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
  const frills = (y, col, x0 = 72, x1 = 168) => {
    let d = `M${x0},${y}`;
    for (let x = x0; x < x1; x += 8) d += ` q4,7 8,0`;
    return `<path d="${d}" fill="none" stroke="${col}" stroke-width="3" stroke-linecap="round"/>`;
  };
  const robe = (fill, stroke, bottom = 280) => `<path d="M92,182 C96,174 108,172 120,172 C132,172 144,174 148,182 L170,${bottom} C150,${bottom + 6} 90,${bottom + 6} 70,${bottom} Z" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
  const belt = (y, col) => `<path d="M90,${y} L150,${y} L150,${y + 7} L90,${y + 7} Z" fill="${col}" stroke="${ink(col)}" stroke-width="1.5"/><rect x="115" y="${y - 1}" width="10" height="9" rx="2" fill="url(#${c.u('gold')})" stroke="#8a6a1a" stroke-width="1"/>`;
  const collar = (col) => `<path d="M104,174 L120,192 L136,174 L130,172 L120,184 L110,172 Z" fill="${col}" stroke="${ink(col, 0.35)}" stroke-width="1.5"/>`;
  const bow = (x, y, col) => `<path d="M${x},${y} l-12,-7 l0,14 z M${x},${y} l12,-7 l0,14 z" fill="${col}" stroke="${ink(col)}" stroke-width="1.5"/><circle cx="${x}" cy="${y}" r="3.5" fill="${lighten(col, 0.3)}" stroke="${ink(col)}" stroke-width="1"/>`;
  const pauldrons = (col) => `<ellipse cx="90" cy="184" rx="15" ry="11" fill="${col}" stroke="${ink(col)}" stroke-width="2"/><ellipse cx="150" cy="184" rx="15" ry="11" fill="${col}" stroke="${ink(col)}" stroke-width="2"/>
<path d="M80,182 q10,-8 20,0 M140,182 q10,-8 20,0" stroke="#fff" stroke-width="2" fill="none" opacity="0.6"/>`;
  const shorts = (col) => `<path d="M92,214 L148,214 L150,240 L124,240 L120,232 L116,240 L90,240 Z" fill="${col}" stroke="${ink(col)}" stroke-width="2"/>`;

  let o = neck;
  switch (t) {
    case 'robe':
      o += robe(O1, i1) + `<path d="M120,180 L120,282" stroke="${c.o2}" stroke-width="5"/><path d="M80,262 C100,272 140,272 160,262" stroke="${c.o2}" stroke-width="4" fill="none"/>`;
      o += `<path d="M96,180 C100,198 140,198 144,180" fill="${O3}" stroke="${i3}" stroke-width="1.5"/>` + belt(214, c.o2) + `<path d="M120,186 l5,8 l-5,8 l-5,-8 z" fill="${c.o3}" stroke="${ink(c.o3)}"/>`;
      break;
    case 'dress':
      o += torso() + skirt(O1, i1, 252, 26) + frills(252, c.o3, 66, 174) + `<path d="M96,214 L144,214" stroke="${c.o2}" stroke-width="5"/>` + bow(120, 190, c.o2) + collar('#ffffff');
      break;
    case 'witch':
      o += torso() + `<path d="M92,212 L148,212 L172,250 L160,244 L150,256 L138,246 L126,258 L114,246 L102,258 L90,246 L80,256 L68,250 Z" fill="${O1}" stroke="${i1}" stroke-width="2"/>`;
      o += `<path d="M100,186 L140,186 L136,214 L104,214 Z" fill="${O2}" stroke="${i2}" stroke-width="1.5"/><path d="M106,192 l28,16 M134,192 l-28,16" stroke="${c.o3}" stroke-width="1.5"/>` + collar(c.o3);
      break;
    case 'armor':
      o += torso(O1, i1) + `<path d="M98,184 C110,178 130,178 142,184 L140,210 C130,216 110,216 100,210 Z" fill="url(#${c.u('metal')})" stroke="#6a7286" stroke-width="2"/>`;
      o += `<path d="M120,186 L120,210" stroke="${c.o2}" stroke-width="3"/>` + skirt(O3, i3, 244, 14) + `<path d="M96,214 L144,214 L150,238 L90,238 Z" fill="url(#${c.u('metal')})" stroke="#6a7286" stroke-width="1.8"/>`;
      o += pauldrons(c.o2 === c.o3 ? '#d8dee8' : c.o2) + belt(212, c.o3);
      break;
    case 'heavyArmor':
      o += torso(O1, i1) + `<path d="M94,184 C108,176 132,176 146,184 L146,214 C132,222 108,222 94,214 Z" fill="${O1}" stroke="${i1}" stroke-width="2.5"/><path d="M106,192 h28 M106,202 h28" stroke="${c.o2}" stroke-width="2.5"/>`;
      o += shorts(darken(c.o1, 0.2)) + pauldrons(darken(c.o1, 0.05)) + `<circle cx="90" cy="184" r="4" fill="${c.o2}"/><circle cx="150" cy="184" r="4" fill="${c.o2}"/>` + belt(214, c.o3);
      break;
    case 'tunic':
    case 'ranger':
    case 'messenger':
    case 'squire':
      o += torso() + (c.female && t !== 'squire' ? skirt(O1, i1, 240, 14) : shorts(darken(c.o1, 0.25)));
      if (t === 'tunic') o += `<path d="M98,180 L120,200 L142,180" fill="none" stroke="${c.o2}" stroke-width="4"/><path d="M100,186 C110,182 130,182 140,186 L138,206 L102,206 Z" fill="${O3}" opacity="0.5"/>`;
      if (t === 'ranger') o += `<path d="M90,180 C104,196 136,196 150,180 L150,198 C136,210 104,210 90,198 Z" fill="${O2}" stroke="${i2}" stroke-width="1.5"/>`;
      if (t === 'messenger') o += `<path d="M96,176 L146,222" stroke="${c.o3}" stroke-width="5"/><rect x="138" y="214" width="20" height="16" rx="3" fill="${c.o3}" stroke="${ink(c.o3)}" stroke-width="1.5"/>` + collar('#ffffff');
      if (t === 'squire') o += `<path d="M104,178 L136,178 L134,232 L120,238 L106,232 Z" fill="${O2}" stroke="${i2}" stroke-width="1.5"/><path d="M120,188 v26 M110,198 h20" stroke="${c.o3}" stroke-width="3"/>`;
      o += belt(212, c.o3 === '#ffffff' ? '#6a4a2a' : c.o3);
      break;
    case 'gown':
      o += robe(O1, i1, 282) + `<path d="M70,282 C90,288 150,288 170,282 L166,268 C150,274 90,274 74,268 Z" fill="${c.o2}" stroke="${ink(c.o2, 0.3)}" stroke-width="1.5"/>`;
      o += `<path d="M96,182 C104,194 136,194 144,182 L146,190 C136,204 104,204 94,190 Z" fill="${c.o2}" stroke="${ink(c.o2, 0.3)}" stroke-width="1.5"/>` + `<path d="M120,198 l6,10 l-6,10 l-6,-10 z" fill="${c.o3}" stroke="${ink(c.o3)}"/>`;
      o += `<path d="M100,220 C112,226 128,226 140,220" stroke="${c.o3}" stroke-width="2" fill="none"/>`;
      break;
    case 'smith':
      o += torso(O3, i3) + shorts(O1) + `<path d="M100,182 L140,182 L144,236 L96,236 Z" fill="${O1}" stroke="${i1}" stroke-width="2"/><path d="M104,182 L100,172 M136,182 L140,172" stroke="${c.o1}" stroke-width="4"/>`;
      o += `<rect x="110" y="196" width="20" height="14" rx="2" fill="${darken(c.o1, 0.2)}" stroke="${i1}" stroke-width="1.2"/>` + belt(214, c.o2);
      break;
    case 'gothic':
      o += torso() + skirt(O1, i1, 250, 24) + frills(250, c.o3, 68, 172) + frills(236, c.o2, 78, 162) + `<path d="M100,184 L140,184 L136,214 L104,214 Z" fill="${O2}" opacity="0.85"/>` + bow(120, 184, c.o2) + collar(c.o3);
      break;
    case 'darklord':
      o += robe(O1, i1, 280) + `<path d="M120,190 L120,280" stroke="${c.o2}" stroke-width="2" opacity="0.6"/><path d="M100,186 C110,180 130,180 140,186 L138,214 L102,214 Z" fill="url(#${c.u('metal')})" opacity="0.35"/>`;
      o += `<path d="M90,178 L80,146 L104,170 Z M150,178 L160,146 L136,170 Z" fill="${O1}" stroke="${c.o2}" stroke-width="2"/>` + `<path d="M110,190 l10,10 l10,-10" stroke="${c.o3}" stroke-width="3" fill="none"/>` + belt(214, c.o3);
      break;
    case 'kimono':
      o += torso() + `<path d="M92,212 L148,212 L156,248 L84,248 Z" fill="${O2}" stroke="${i2}" stroke-width="2"/>`;
      o += `<path d="M104,174 L126,206 M136,174 L114,206" stroke="${c.o3}" stroke-width="4"/>` + `<path d="M90,200 L150,200 L150,216 L90,216 Z" fill="${O2}" stroke="${i2}" stroke-width="1.5"/><path d="M140,208 l14,-6 l0,14 z" fill="${c.o2}"/>`;
      break;
    case 'idol':
      o += torso() + skirt(O1, i1, 244, 26) + frills(244, c.o3, 64, 176) + frills(230, c.o2, 74, 166) + bow(120, 186, c.o3) + `<path d="M92,212 L148,212" stroke="${c.o2}" stroke-width="4"/>`;
      o += `<circle cx="96" cy="230" r="3" fill="${c.o3}"/><circle cx="144" cy="230" r="3" fill="${c.o3}"/>`;
      break;
    case 'scholar':
    case 'apprentice':
      o += robe(O1, i1, 280) + `<path d="M88,180 C100,204 140,204 152,180 L152,196 C140,220 100,220 88,196 Z" fill="${O2}" stroke="${i2}" stroke-width="1.5"/>`;
      o += (t === 'scholar' ? bow(120, 192, '#c83a3a') : `<path d="M100,206 L140,206" stroke="${c.o2}" stroke-width="4"/>`) + `<path d="M120,214 L120,280" stroke="${c.o2}" stroke-width="3"/>`;
      break;
    case 'bard':
      o += torso(O3, i3) + skirt(O1, i1, 242, 16) + `<path d="M96,180 L104,218 L136,218 L144,180 L132,176 L120,200 L108,176 Z" fill="${O1}" stroke="${i1}" stroke-width="1.5"/>` + `<path d="M90,208 C110,214 130,214 150,208" stroke="${c.o2}" stroke-width="4" fill="none"/>`;
      break;
    case 'furCoat':
      o += robe(O1, i1, 252) + `<path d="M70,252 C90,260 150,260 170,252 L166,240 C150,246 90,246 74,240 Z" fill="${O2}" stroke="${ink(c.o2, 0.3)}" stroke-width="1.5"/><path d="M120,176 L120,246" stroke="${c.o2}" stroke-width="7"/>`;
      o += `<circle cx="120" cy="196" r="3" fill="${c.o3}"/><circle cx="120" cy="214" r="3" fill="${c.o3}"/>`;
      break;
    case 'imp':
      o += `<path d="M94,184 C104,178 136,178 146,184 L146,204 L94,204 Z" fill="${O1}" stroke="${i1}" stroke-width="2"/><path d="M96,204 L144,204 L146,214 L94,214 Z" fill="${c.skin}" stroke="${ink(c.skin, 0.3)}" stroke-width="1"/>`;
      o += skirt(O1, i1, 240, 18) + `<path d="M74,240 L82,232 L90,240 L98,232 L106,240 L114,232 L122,240 L130,232 L138,240 L146,232 L154,240 L162,232 L166,240" stroke="${c.o2}" stroke-width="3" fill="none"/>` + `<path d="M108,186 l12,8 l12,-8" stroke="${c.o2}" stroke-width="3" fill="none"/>`;
      break;
    case 'apron':
      o += torso() + skirt(O1, i1, 248, 22) + `<path d="M100,184 L140,184 L146,244 L94,244 Z" fill="${O2}" stroke="${ink(c.o2, 0.3)}" stroke-width="1.5"/>` + frills(244, c.o2, 92, 148) + `<path d="M112,196 h16 M120,188 v16" stroke="#ff7a8a" stroke-width="3"/>`;
      break;
    case 'leafDress':
      o += torso() + `<path d="M92,212 L148,212 L170,246 C160,236 154,252 144,244 C136,256 128,244 120,254 C112,244 104,256 96,244 C86,252 80,236 70,246 Z" fill="${O1}" stroke="${i1}" stroke-width="2"/>`;
      o += `<path d="M96,214 L144,214" stroke="${c.o2}" stroke-width="5"/>` + `<path d="M114,186 c-6,-10 6,-14 6,-4 c0,-10 12,-6 6,4 c-2,4 -10,6 -12,0" fill="#ff8ab0"/>`;
      break;
    case 'nun':
      o += robe(O1, i1, 282) + `<path d="M98,176 C104,196 136,196 142,176 L142,184 C134,204 106,204 98,184 Z" fill="${O2}" stroke="${ink(c.o2, 0.3)}" stroke-width="1.5"/><path d="M120,200 v18 M113,207 h14" stroke="${c.o3}" stroke-width="3"/>`;
      break;
    case 'ninja':
      o += torso() + shorts(darken(c.o1, 0.15)) + `<path d="M98,176 L130,214 M142,176 L110,214" stroke="${c.o3}" stroke-width="4"/>` + `<path d="M88,206 L152,206 L152,216 L88,216 Z" fill="${O2}" stroke="${i2}" stroke-width="1.5"/>`;
      o += `<path d="M98,236 L142,236" stroke="${c.o2}" stroke-width="3"/>`;
      break;
    case 'barbarian':
      o += `<path d="M92,182 C96,174 108,172 120,172 C132,172 144,174 148,182 L152,218 C140,224 100,224 88,218 Z" fill="${c.skin}" stroke="${ink(c.skin, 0.35)}" stroke-width="2"/>`;
      o += `<path d="M90,180 C100,176 110,178 114,184 L112,214 L88,214 Z M150,180 C140,176 130,178 126,184 L128,214 L152,214 Z" fill="${O1}" stroke="${i1}" stroke-width="2"/><path d="M90,180 l6,6 l4,-6 l6,6 l4,-6" stroke="${c.o2}" stroke-width="3" fill="none"/>`;
      o += shorts(darken(c.o1, 0.2)) + belt(212, c.o3);
      break;
    default:
      o += torso() + skirt(O1, i1);
  }
  return o;
}

function arms(c) {
  const t = c.o.type;
  const bare = t === 'barbarian';
  const sleeve = bare ? c.skin : ['armor', 'heavyArmor'].includes(t) ? '#d8dee8' : t === 'smith' ? c.o3 : ['bard'].includes(t) ? c.o3 : c.o1;
  const sInk = ink(sleeve, 0.45);
  const cuff = ['gown', 'furCoat'].includes(t) ? c.o2 : ['robe', 'scholar', 'nun', 'witch', 'dress', 'gothic', 'idol'].includes(t) ? c.o3 : null;
  const L = `<path d="M94,180 C84,186 80,202 82,218 L94,220 C94,206 98,196 104,188 Z" fill="${sleeve}" stroke="${sInk}" stroke-width="2"/>`;
  const R = `<path d="M146,180 C158,186 162,200 160,216 L148,218 C148,204 144,196 136,188 Z" fill="${sleeve}" stroke="${sInk}" stroke-width="2"/>`;
  const cuffs = cuff ? `<path d="M81,214 L95,216 L95,222 L81,220 Z M147,214 L161,212 L161,218 L147,220 Z" fill="${cuff}" stroke="${ink(cuff, 0.35)}" stroke-width="1.2"/>` : '';
  const gaunt = ['armor', 'heavyArmor', 'smith'].includes(t) ? `<rect x="80" y="210" width="16" height="10" rx="3" fill="url(#${c.u('metal')})" stroke="#6a7286" stroke-width="1.2"/><rect x="146" y="208" width="16" height="10" rx="3" fill="url(#${c.u('metal')})" stroke="#6a7286" stroke-width="1.2"/>` : '';
  const hands = `<circle cx="88" cy="224" r="7.5" fill="${c.skin}" stroke="${ink(c.skin, 0.35)}" stroke-width="1.5"/><circle cx="154" cy="222" r="7.5" fill="${c.skin}" stroke="${ink(c.skin, 0.35)}" stroke-width="1.5"/>`;
  return L + R + cuffs + gaunt + hands;
}

// ------------------------------------------------------------------ head

function head(c, expr) {
  const skinFill = `url(#${c.u('skin')})`;
  const ski = ink(c.skin, 0.38);
  let o = '';
  // ears
  if (c.acc.includes('elfEars')) {
    o += `<path d="M66,120 L36,100 L64,138 Z M174,120 L204,100 L176,138 Z" fill="${c.skin}" stroke="${ski}" stroke-width="1.8"/><path d="M60,122 L44,108 L62,132 Z M180,122 L196,108 L178,132 Z" fill="${c.skinShade}" opacity="0.6"/>`;
  } else {
    o += `<ellipse cx="66" cy="126" rx="7" ry="10" fill="${c.skin}" stroke="${ski}" stroke-width="1.5"/><ellipse cx="174" cy="126" rx="7" ry="10" fill="${c.skin}" stroke="${ski}" stroke-width="1.5"/>`;
  }
  // face
  o += `<path d="M66,110 C66,148 90,170 120,172 C150,170 174,148 174,110 C174,80 150,62 120,62 C90,62 66,80 66,110 Z" fill="${skinFill}" stroke="${ski}" stroke-width="2"/>`;
  // shadow under the bangs
  o += `<path d="M70,104 C90,96 150,96 170,104 L170,114 C150,108 90,108 70,114 Z" fill="${c.skinShade}" opacity="0.35"/>`;
  // blush
  o += `<ellipse cx="88" cy="148" rx="11" ry="6" fill="url(#${c.u('cheek')})"/><ellipse cx="152" cy="148" rx="11" ry="6" fill="url(#${c.u('cheek')})"/>`;
  o += eyes(c, expr);
  o += `<path d="M119,148 l1.2,2.4" stroke="${ink(c.skin, 0.5)}" stroke-width="1.6" stroke-linecap="round"/>`;
  o += mouth(c, expr);
  return o;
}

function eyes(c, expr) {
  const lash = '#2a1a22';
  const brow = darken(c.h2, 0.2);
  const shape = c.eyeShape;
  const one = (x, side, closed) => {
    // side: -1 left eye (outer corner left), +1 right eye
    const m = (dx) => x + dx * -side; // mirror so the outer corner is always away from the nose
    if (closed === 'happy') {
      return `<path d="M${m(-12)},132 Q${x},118 ${m(12)},132" fill="none" stroke="${lash}" stroke-width="3.2" stroke-linecap="round"/>`;
    }
    if (closed === 'blink') {
      return `<path d="M${m(-13)},130 Q${x},137 ${m(13)},128" fill="none" stroke="${lash}" stroke-width="3" stroke-linecap="round"/><path d="M${m(-13)},130 L${m(-18)},127" stroke="${lash}" stroke-width="2.2" stroke-linecap="round"/>`;
    }
    if (closed === 'hurt') {
      return `<path d="M${m(-10)},120 L${m(8)},129 L${m(-10)},138" fill="none" stroke="${lash}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>`;
    }
    const narrow = shape === 'sharp' || closed === 'angry' ? 3 : shape === 'sleepy' ? 6 : 0;
    const catUp = shape === 'cat' ? 4 : 0;
    const top = 116 + narrow;
    const white = `M${m(-13)},${126 - catUp} Q${m(-2)},${top - 2} ${m(13)},${121 + narrow * 0.5} Q${m(15)},${138} ${m(1)},${143} Q${m(-12)},${142} ${m(-13)},${126 - catUp} Z`;
    const cid = c.u('eye' + side);
    const pupil = shape === 'cat'
      ? `<ellipse cx="${x}" cy="${133}" rx="2.2" ry="7" fill="#140a14"/>`
      : `<ellipse cx="${x}" cy="${134}" rx="4.6" ry="6.2" fill="#140a14" opacity="0.9"/>`;
    const lid = `M${m(-15)},${127 - catUp} Q${m(-3)},${top - 6} ${m(14)},${119 + narrow * 0.5} L${m(15)},${123 + narrow * 0.5} Q${m(-1)},${top - 1} ${m(-13)},${130 - catUp} Z`;
    const flick = `M${m(-13)},${128 - catUp} L${m(-19)},${123 - catUp * 1.5} L${m(-14)},${131 - catUp} Z`;
    return `<clipPath id="${cid}"><path d="${white}"/></clipPath>
<path d="${white}" fill="#ffffff"/>
<g clip-path="url(#${cid})"><ellipse cx="${x}" cy="${132}" rx="10" ry="13" fill="url(#${c.u('iris')})"/><ellipse cx="${x}" cy="${132}" rx="10" ry="13" fill="none" stroke="${darken(c.eye, 0.6)}" stroke-width="1.4"/>${pupil}
<path d="M${x - 8},${139} Q${x},${145} ${x + 8},${139}" stroke="${lighten(c.eye, 0.7)}" stroke-width="2" fill="none" opacity="0.8"/></g>
<path d="${lid}" fill="${lash}"/>${c.female ? `<path d="${flick}" fill="${lash}"/>` : ''}
<circle cx="${x - 3.5 * side}" cy="${126}" r="3.6" fill="#ffffff"/><circle cx="${x + 4 * side}" cy="${138}" r="1.8" fill="#ffffff" opacity="0.85"/>
<path d="M${m(-6)},${144} Q${m(1)},${146} ${m(8)},${143}" stroke="${lash}" stroke-width="1.3" fill="none" opacity="0.7"/>`;
  };
  const b = (x, side) => {
    const m = (dx) => x + dx * -side;
    const angry = expr === 'angry';
    const worried = expr === 'hurt';
    const y0 = angry ? 110 : worried ? 106 : 106;
    const yIn = angry ? 112 : worried ? 102 : 105;
    const yOut = angry ? 104 : worried ? 110 : 107;
    return `<path d="M${m(-12)},${yOut} Q${x},${y0 - 4} ${m(11)},${yIn}" fill="none" stroke="${brow}" stroke-width="2.6" stroke-linecap="round"/>`;
  };
  const L = expr === 'happy' ? 'happy' : expr === 'hurt' ? 'hurt' : expr === 'angry' ? 'angry' : expr === 'blink' ? 'blink' : null;
  const R = expr === 'wink' ? 'happy' : L;
  return b(96, -1) + b(144, 1) + one(96, -1, L) + one(144, 1, R);
}

function mouth(c, expr) {
  const lip = '#a83a4a';
  if (expr === 'happy' || expr === 'wink') return `<path d="M110,154 Q120,168 130,154 Z" fill="#c8404a" stroke="${lip}" stroke-width="1.5"/><path d="M114,159 Q120,164 126,159" fill="#ff8a9a"/>`;
  if (expr === 'angry') return `<path d="M111,158 L129,158 L127,163 L113,163 Z" fill="#ffffff" stroke="${lip}" stroke-width="1.6"/>`;
  if (expr === 'hurt') return `<path d="M112,160 Q116,155 120,160 Q124,165 128,160" fill="none" stroke="${lip}" stroke-width="2"/>`;
  return c.female ? `<path d="M114,156 Q120,161 126,156" fill="none" stroke="${lip}" stroke-width="2" stroke-linecap="round"/>`
    : `<path d="M113,157 Q120,160 127,157" fill="none" stroke="${lip}" stroke-width="2" stroke-linecap="round"/>`;
}

// ------------------------------------------------------------------ headwear & accessories

function headwear(c) {
  let o = '';
  const A = c.acc;
  if (A.includes('furHood')) o += `<path d="M54,128 C46,70 82,36 120,36 C158,36 194,70 186,128 C192,150 184,170 176,176 C180,150 178,108 164,86 C150,66 90,66 76,86 C62,108 60,150 64,176 C56,170 48,150 54,128 Z" fill="${c.o1}" stroke="${ink(c.o1)}" stroke-width="2"/>
<path d="M60,140 C52,90 84,50 120,50 C156,50 188,90 180,140" fill="none" stroke="#ffffff" stroke-width="9" stroke-linecap="round"/>`;
  if (A.includes('catEars')) o += `<path d="M70,78 L66,30 L104,58 Z M170,78 L174,30 L136,58 Z" fill="url(#${c.u('hair')})" stroke="${c.hInk}" stroke-width="2" stroke-linejoin="round"/><path d="M74,68 L72,42 L94,58 Z M166,68 L168,42 L146,58 Z" fill="#ffb0c8"/>`;
  if (A.includes('horns')) o += `<path d="M78,70 C62,52 58,30 70,14 C70,34 80,48 94,58 Z M162,70 C178,52 182,30 170,14 C170,34 160,48 146,58 Z" fill="#2a2030" stroke="#7a5aff" stroke-width="2"/><path d="M70,22 C68,36 76,48 88,56 M170,22 C172,36 164,48 152,56" stroke="#b08aff" stroke-width="1.5" fill="none" opacity="0.6"/>`;
  if (A.includes('smallHorns')) o += `<path d="M88,62 C82,50 84,40 92,34 C92,44 96,50 102,56 Z M152,62 C158,50 156,40 148,34 C148,44 144,50 138,56 Z" fill="#3a2a3a" stroke="#ff4ab0" stroke-width="1.6"/>`;
  if (A.includes('coralHorns')) o += `<path d="M82,64 C74,48 72,34 78,22 M78,40 C70,36 66,30 66,24 M80,50 C88,44 90,36 90,30 M158,64 C166,48 168,34 162,22 M162,40 C170,36 174,30 174,24 M160,50 C152,44 150,36 150,30" stroke="#ff8a9a" stroke-width="5" stroke-linecap="round" fill="none"/><path d="M82,64 C74,48 72,34 78,22 M158,64 C166,48 168,34 162,22" stroke="#ffd0d8" stroke-width="1.6" fill="none"/>`;
  if (A.includes('witchHat')) {
    o += `<path d="M44,90 C70,74 170,74 196,90 C178,100 62,100 44,90 Z" fill="#241826" stroke="#0e080e" stroke-width="2"/>
<path d="M76,84 C88,52 100,22 132,4 C154,-6 178,6 172,22 C160,14 148,16 142,26 C150,44 158,66 164,84 C140,90 100,90 76,84 Z" fill="#2c1e30" stroke="#0e080e" stroke-width="2"/>
<path d="M80,78 C104,84 140,84 162,78 L164,86 C140,92 102,92 78,86 Z" fill="${c.o2}"/><path d="M146,70 l10,-8 l4,12 z" fill="${c.o3}"/>`;
  }
  if (A.includes('featherHat')) o += `<path d="M48,88 C74,70 166,70 192,88 C172,98 68,98 48,88 Z" fill="${c.o1}" stroke="${ink(c.o1)}" stroke-width="2"/><path d="M78,82 C80,56 160,56 162,82 Z" fill="${c.o1}" stroke="${ink(c.o1)}" stroke-width="2"/><path d="M150,70 C176,40 200,38 214,30 C206,52 186,68 156,78 Z" fill="${c.o2}" stroke="${ink(c.o2)}" stroke-width="1.5"/><path d="M80,78 C104,84 136,84 160,78" stroke="${c.o2}" stroke-width="4" fill="none"/>`;
  if (A.includes('beret')) o += `<path d="M70,74 C72,46 108,36 140,40 C168,44 180,62 170,74 C150,80 92,82 70,74 Z" fill="${c.o1}" stroke="${ink(c.o1)}" stroke-width="2"/><circle cx="128" cy="40" r="4" fill="${c.o2}"/>`;
  if (A.includes('cap')) o += `<path d="M70,82 C70,50 96,40 120,40 C146,40 170,52 170,82 Z" fill="${c.o1}" stroke="${ink(c.o1)}" stroke-width="2"/><path d="M64,84 C90,76 120,76 150,82 C130,94 84,96 64,84 Z" fill="${darken(c.o1, 0.15)}" stroke="${ink(c.o1)}" stroke-width="2"/><circle cx="120" cy="42" r="4" fill="${c.o2}"/>`;
  if (A.includes('potHelmet')) o += `<path d="M64,84 C64,50 88,40 120,40 C152,40 176,50 176,84 Z" fill="url(#${c.u('metal')})" stroke="#5a6272" stroke-width="2"/><path d="M58,84 L182,84 L182,92 L58,92 Z" fill="#a8b0bc" stroke="#5a6272" stroke-width="2"/><path d="M110,40 C110,30 130,30 130,40" fill="none" stroke="#5a6272" stroke-width="4"/>`;
  if (A.includes('leafHat')) o += `<path d="M76,74 C78,38 136,28 170,52 C150,52 140,62 136,76 C118,70 94,70 76,74 Z" fill="#6ac83a" stroke="#2a7a1a" stroke-width="2"/><path d="M90,66 C110,56 140,52 164,54" stroke="#2a7a1a" stroke-width="1.6" fill="none"/><path d="M120,40 C118,30 124,24 130,22" stroke="#5a3a1a" stroke-width="3" fill="none"/>`;
  if (A.includes('headband')) o += `<path d="M66,96 C90,86 150,86 174,96 L174,104 C150,94 90,94 66,104 Z" fill="${c.o2}" stroke="${ink(c.o2)}" stroke-width="1.5"/><path d="M174,98 C190,104 196,116 206,118 C196,122 186,114 176,104 Z" fill="${c.o2}" stroke="${ink(c.o2)}" stroke-width="1.5"/>`;
  if (A.includes('circlet')) o += `<path d="M70,94 C92,84 148,84 170,94" fill="none" stroke="url(#${c.u('gold')})" stroke-width="4"/><path d="M120,84 l5,7 l-5,7 l-5,-7 z" fill="#5ab0ff" stroke="#8a6a1a" stroke-width="1"/>`;
  if (A.includes('tiara')) o += `<path d="M92,80 L100,66 L108,76 L120,58 L132,76 L140,66 L148,80 C130,76 110,76 92,80 Z" fill="url(#${c.u('gold')})" stroke="#9a7a1a" stroke-width="1.5"/><circle cx="120" cy="70" r="4" fill="#ff5a8a" stroke="#9a2a4a"/>`;
  if (A.includes('iceCrown')) o += `<path d="M86,76 L92,46 L102,68 L110,34 L120,64 L130,34 L138,68 L148,46 L154,76 C134,72 106,72 86,76 Z" fill="#dff8ff" stroke="#5ab8ff" stroke-width="2" stroke-linejoin="round"/><path d="M110,40 L114,62 M130,40 L126,62" stroke="#ffffff" stroke-width="1.5"/>`;
  if (A.includes('halo')) o += `<ellipse cx="120" cy="30" rx="34" ry="9" fill="none" stroke="#ffe680" stroke-width="7" opacity="0.35"/><ellipse cx="120" cy="30" rx="34" ry="9" fill="none" stroke="#fff3b0" stroke-width="3"/>`;
  if (A.includes('flameHalo')) o += `<ellipse cx="120" cy="28" rx="36" ry="10" fill="none" stroke="#ffb04a" stroke-width="8" opacity="0.4"/><ellipse cx="120" cy="28" rx="36" ry="10" fill="none" stroke="#ffe6a0" stroke-width="3"/>${[0, 1, 2, 3, 4, 5, 6].map((i) => { const x = 90 + i * 10; return `<path d="M${x},22 q4,-12 2,-18 q6,8 4,18 z" fill="#ff8a2a" opacity="0.85"/>`; }).join('')}`;
  if (A.includes('goggles')) o += `<path d="M64,88 C90,80 150,80 176,88" stroke="#5a3a2a" stroke-width="5" fill="none"/><circle cx="102" cy="80" r="12" fill="#9ae0ff" stroke="#6a4a2a" stroke-width="4"/><circle cx="138" cy="80" r="12" fill="#9ae0ff" stroke="#6a4a2a" stroke-width="4"/><path d="M96,74 l6,-3 M132,74 l6,-3" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`;
  if (A.includes('ribbon')) o += `<path d="M150,64 l26,-16 l2,26 z M150,64 l14,24 l14,-10 z" fill="${c.o2}" stroke="${ink(c.o2)}" stroke-width="1.6"/><circle cx="152" cy="64" r="5" fill="${lighten(c.o2, 0.3)}" stroke="${ink(c.o2)}"/>`;
  if (A.includes('flower')) o += `<g transform="translate(160,74)">${[0, 72, 144, 216, 288].map((a) => `<ellipse cx="0" cy="-7" rx="5" ry="7" fill="#ffffff" stroke="#9ad0f0" stroke-width="1" transform="rotate(${a})"/>`).join('')}<circle r="4" fill="#ffd84a"/></g>`;
  if (A.includes('headphones')) o += `<path d="M64,112 C60,60 180,60 176,112" stroke="#f0f4ff" stroke-width="6" fill="none"/><rect x="54" y="104" width="16" height="26" rx="7" fill="${c.o2}" stroke="${ink(c.o2)}" stroke-width="2"/><rect x="170" y="104" width="16" height="26" rx="7" fill="${c.o2}" stroke="${ink(c.o2)}" stroke-width="2"/>`;
  if (A.includes('glasses')) o += `<circle cx="96" cy="132" r="15" fill="#ffffff" fill-opacity="0.12" stroke="#5a3a2a" stroke-width="2.2"/><circle cx="144" cy="132" r="15" fill="#ffffff" fill-opacity="0.12" stroke="#5a3a2a" stroke-width="2.2"/><path d="M111,130 Q120,126 129,130" stroke="#5a3a2a" stroke-width="2" fill="none"/>`;
  if (A.includes('mask')) o += `<path d="M76,146 C90,140 150,140 164,146 L162,166 C140,176 100,176 78,166 Z" fill="${c.o1}" stroke="${ink(c.o1)}" stroke-width="2"/><path d="M84,154 C110,150 130,150 156,154" stroke="${c.o2}" stroke-width="2" fill="none" opacity="0.6"/>`;
  return o;
}

// ------------------------------------------------------------------ weapons
// back: behind the body; under: before arms (hands grip it); over: after arms; front: after the head

function weaponParts(c) {
  const out = { back: '', under: '', over: '', front: '' };
  const w = c.weapon;
  if (!w) return out;
  const c1 = w.c1 || '#8a8a9a';
  const c2 = w.c2 || '#ffffff';
  const shaft = (x1, y1, x2, y2, col = c1, wd = 6) => `<path d="M${x1},${y1} L${x2},${y2}" stroke="${ink(col, 0.4)}" stroke-width="${wd + 3}" stroke-linecap="round"/><path d="M${x1},${y1} L${x2},${y2}" stroke="${col}" stroke-width="${wd}" stroke-linecap="round"/>`;
  const gem = (x, y, r, col) => `<circle cx="${x}" cy="${y}" r="${r * 2}" fill="url(#${c.u('glow')})"/><circle cx="${x}" cy="${y}" r="${r}" fill="${col}" stroke="${ink(col, 0.4)}" stroke-width="1.5"/><circle cx="${x - r * 0.35}" cy="${y - r * 0.35}" r="${r * 0.35}" fill="#fff" opacity="0.8"/>`;
  const blade = (d, col = '#e8eef5') => `<path d="${d}" fill="${col}" stroke="${ink(col, 0.5)}" stroke-width="1.8" stroke-linejoin="round"/>`;
  switch (w.type) {
    case 'sunStaff':
      out.under = shaft(164, 120, 154, 284, c1);
      out.front = `<g>${gem(166, 104, 12, c2)}<circle cx="166" cy="104" r="20" fill="none" stroke="${c1}" stroke-width="4"/>${[0, 45, 90, 135, 180, 225, 270, 315].map((a) => `<path d="M166,78 l4,8 l-8,0 z" fill="${c1}" transform="rotate(${a} 166 104)"/>`).join('')}</g>`;
      break;
    case 'flameStaff':
      out.under = shaft(166, 130, 154, 284, c1);
      out.front = `<path d="M166,128 C150,116 156,96 166,86 C164,100 176,102 172,90 C184,102 182,122 166,128 Z" fill="${c2}" stroke="#c83a1a" stroke-width="1.5"/>${gem(166, 114, 7, '#ffe6a0')}`;
      break;
    case 'iceScepter':
      out.under = shaft(164, 128, 156, 270, c1, 5);
      out.front = `<path d="M164,84 L176,110 L164,132 L152,110 Z" fill="${c1}" stroke="${c2}" stroke-width="2"/><path d="M164,84 L164,132 M152,110 L176,110" stroke="#fff" stroke-width="1.2" opacity="0.7"/><circle cx="164" cy="108" r="22" fill="url(#${c.u('glow')})" opacity="0.6"/>`;
      break;
    case 'sproutStaff':
    case 'wand':
    case 'dropWand':
      out.under = shaft(162, w.type === 'wand' || w.type === 'dropWand' ? 170 : 134, 154, w.type === 'sproutStaff' ? 284 : 236, c1, w.type === 'sproutStaff' ? 6 : 4);
      if (w.type === 'sproutStaff') out.front = `<path d="M162,134 C150,120 140,122 136,110 C150,108 160,118 162,130 C164,116 174,106 188,108 C184,122 172,126 162,134 Z" fill="${c2}" stroke="#2a7a1a" stroke-width="1.5"/>`;
      else if (w.type === 'dropWand') out.front = `<path d="M162,146 C154,158 152,168 162,172 C172,168 170,158 162,146 Z" fill="${c2}" stroke="${ink(c2, 0.4)}" stroke-width="1.5"/>${gem(162, 164, 4, '#ffffff')}`;
      else out.front = `${gem(162, 164, 7, c2)}<path d="M156,150 l-6,-6 M170,150 l6,-6 M162,148 v-8" stroke="${c2}" stroke-width="2" stroke-linecap="round"/>`;
      break;
    case 'micStaff':
      out.under = shaft(162, 150, 156, 260, c1, 5);
      out.front = `<ellipse cx="163" cy="140" rx="11" ry="14" fill="${c2}" stroke="${ink(c2, 0.4)}" stroke-width="2"/><path d="M155,136 h16 M155,142 h16" stroke="#fff" stroke-width="1.5" opacity="0.7"/><path d="M170,128 c10,-6 16,0 12,8" stroke="#ff8ac2" stroke-width="3" fill="none"/>`;
      break;
    case 'darkOrb':
      out.under = shaft(164, 132, 156, 284, c1, 6);
      out.front = `<circle cx="166" cy="110" r="26" fill="url(#${c.u('glow')})"/><circle cx="166" cy="110" r="13" fill="#1a0a24" stroke="${c2}" stroke-width="3"/><path d="M158,104 a10,10 0 0,1 12,-4" stroke="#e0b0ff" stroke-width="2" fill="none"/><path d="M152,124 L146,118 M180,124 L186,118" stroke="${c2}" stroke-width="3" stroke-linecap="round"/>`;
      break;
    case 'spear':
    case 'trident':
    case 'pitchfork': {
      out.under = shaft(168, 70, 150, 290, c1 === '#ffd36a' ? '#d8a84a' : c1, 5);
      if (w.type === 'spear') out.front = blade('M168,40 L178,72 L168,82 L158,72 Z', c1) + `<path d="M160,84 L176,84" stroke="${c2}" stroke-width="5" stroke-linecap="round"/><path d="M168,86 C182,92 186,104 180,112" stroke="${c2}" stroke-width="3" fill="none"/>`;
      else {
        const col = w.type === 'trident' ? c1 : '#5a4a5a';
        out.front = `<path d="M150,84 C150,96 186,96 186,84" stroke="${col}" stroke-width="5" fill="none"/>` + blade('M150,84 L146,58 L156,70 Z', col) + blade('M168,92 L168,46 L176,74 L160,74 Z', col) + blade('M186,84 L190,58 L180,70 Z', col);
        if (w.type === 'pitchfork') out.front += `<path d="M168,98 l0,6" stroke="${c2}" stroke-width="6"/>`;
      }
      break;
    }
    case 'lanceShield':
      out.back = shaft(176, 40, 156, 236, c1, 7) + blade('M176,10 L186,46 L176,56 L166,46 Z', '#f2f6ff');
      out.front = `<path d="M60,186 C60,174 104,170 104,186 L104,226 C104,248 82,262 82,262 C82,262 60,248 60,226 Z" fill="${c2}" stroke="${ink(c2, 0.4)}" stroke-width="2.5"/><path d="M66,190 C68,182 98,180 98,190 L98,224 C98,240 82,252 82,252 C82,252 66,240 66,224 Z" fill="none" stroke="${c1}" stroke-width="3"/><path d="M82,196 v40 M70,212 h24" stroke="${c1}" stroke-width="4"/>`;
      break;
    case 'greatshield':
      out.front = `<path d="M54,176 C54,162 112,160 112,176 L112,236 C112,262 84,278 84,278 C84,278 54,262 54,236 Z" fill="${c1}" stroke="${ink(c1, 0.4)}" stroke-width="3"/><path d="M62,182 C64,172 104,172 104,182 L104,232 C104,252 84,266 84,266 C84,266 62,252 62,232 Z" fill="none" stroke="${c2}" stroke-width="3"/><path d="M84,196 l14,22 l-14,22 l-14,-22 z" fill="${c2}" stroke="${ink(c2, 0.4)}" stroke-width="2"/>`;
      out.under = shaft(160, 176, 150, 240, '#5a5a66', 6) + `<circle cx="162" cy="172" r="10" fill="#6a6a78" stroke="#2a2a34" stroke-width="2"/>`;
      break;
    case 'swordShield':
      out.under = blade('M156,224 L164,150 L170,150 L166,226 Z') + `<path d="M150,222 L172,226" stroke="${c2}" stroke-width="5" stroke-linecap="round"/>`;
      out.front = `<circle cx="84" cy="218" r="22" fill="${c2}" stroke="${ink(c2, 0.4)}" stroke-width="3"/><circle cx="84" cy="218" r="14" fill="none" stroke="${c1}" stroke-width="3"/><circle cx="84" cy="218" r="5" fill="${c1}"/>`;
      break;
    case 'twinSwords':
      out.under = blade('M150,226 L196,148 L200,152 L158,230 Z', c1) + `<path d="M146,218 L164,232" stroke="${c2}" stroke-width="5" stroke-linecap="round"/>`
        + blade('M90,228 L44,150 L40,154 L82,232 Z', c1) + `<path d="M94,220 L76,234" stroke="${c2}" stroke-width="5" stroke-linecap="round"/>`;
      break;
    case 'katana':
      out.back = blade('M150,236 C170,180 192,120 206,96 L210,100 C198,128 178,186 160,240 Z', c1) + `<path d="M148,230 L166,240" stroke="#2a2a2a" stroke-width="6" stroke-linecap="round"/><path d="M146,238 L136,262" stroke="${c2}" stroke-width="6" stroke-linecap="round"/>`;
      break;
    case 'daggers':
      out.under = blade('M154,226 L176,186 L180,190 L160,230 Z', c1) + blade('M88,228 L64,190 L60,194 L82,232 Z', c1) + `<path d="M150,224 L162,232 M92,226 L80,234" stroke="${c2}" stroke-width="4" stroke-linecap="round"/>`;
      break;
    case 'hammer':
      out.back = shaft(150, 236, 196, 90, '#7a5a3a', 7) + `<g transform="rotate(-18 196 84)"><rect x="166" y="58" width="62" height="44" rx="6" fill="url(#${c.u('metal')})" stroke="#4a5262" stroke-width="2.5"/><rect x="166" y="72" width="62" height="14" fill="${c2}" stroke="#7a5a1a" stroke-width="1.5"/><rect x="190" y="58" width="14" height="44" fill="${c2}" opacity="0.6"/></g>`;
      break;
    case 'axe':
      out.under = shaft(160, 140, 152, 250, '#7a5a3a', 6) + `<path d="M162,132 C188,120 200,140 196,166 C186,156 172,156 160,162 Z" fill="url(#${c.u('metal')})" stroke="#4a5262" stroke-width="2"/><path d="M190,140 C194,148 194,156 192,162" stroke="#fff" stroke-width="2" fill="none" opacity="0.7"/>`;
      break;
    case 'bow':
    case 'crescentBow':
      out.over = `<path d="M178,128 C204,170 204,250 178,294" stroke="${c1}" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M178,128 C204,170 204,250 178,294" stroke="${c2}" stroke-width="2" fill="none" opacity="0.6"/><path d="M178,128 L172,212 L178,294" stroke="#f4f4f4" stroke-width="1.5" fill="none"/>`
        + (w.type === 'crescentBow' ? `<path d="M178,128 C186,118 196,120 200,126 M178,294 C186,304 196,302 200,296" stroke="${c2}" stroke-width="3" fill="none"/>` : '');
      break;
    case 'crossbow':
      out.over = `<path d="M136,206 L184,206" stroke="${c1}" stroke-width="8" stroke-linecap="round"/><path d="M178,182 C190,196 190,216 178,230" stroke="${c2}" stroke-width="5" fill="none"/><path d="M178,182 L166,206 L178,230" stroke="#eee" stroke-width="1.2" fill="none"/>`;
      break;
    case 'slingshot':
      out.over = `<path d="M156,226 L156,204 M156,204 L146,186 M156,204 L166,186" stroke="${c1}" stroke-width="5" stroke-linecap="round" fill="none"/><path d="M146,186 Q156,200 166,186" stroke="${c2}" stroke-width="2" fill="none"/>`;
      break;
    case 'book':
      out.front = `<g transform="translate(70,206) rotate(-12)"><circle cx="10" cy="0" r="26" fill="url(#${c.u('glow')})" opacity="0.7"/><path d="M-14,-12 C-4,-16 6,-14 10,-10 C14,-14 24,-16 34,-12 L34,12 C24,8 14,10 10,14 C6,10 -4,8 -14,12 Z" fill="#fff8e6" stroke="${c1}" stroke-width="2.5"/><path d="M10,-10 L10,14" stroke="${c1}" stroke-width="2"/><path d="M-8,-4 h12 M-8,2 h12 M16,-4 h12 M16,2 h12" stroke="${c2}" stroke-width="1.5" opacity="0.8"/></g>`;
      break;
    case 'lute':
      out.over = `<g transform="rotate(-30 128 222)"><ellipse cx="116" cy="230" rx="22" ry="18" fill="${c1}" stroke="${ink(c1, 0.4)}" stroke-width="2"/><circle cx="116" cy="230" r="6" fill="#3a2010"/><rect x="134" y="226" width="44" height="7" fill="${darken(c1, 0.2)}" stroke="${ink(c1, 0.4)}" stroke-width="1.5"/><path d="M94,229 L178,229 M94,231 L178,231" stroke="${c2}" stroke-width="0.8"/></g>`;
      break;
    case 'maceStrike':
    default:
      break;
  }
  return out;
}

// ------------------------------------------------------------------ cache of rendered images

const urlCache = new Map();

/** Blob URL for an <img>: cached per hero/skin/expression/crop. */
export function heroImageURL(hero, opts = {}) {
  const painted = heroAsset(hero.id, opts);
  if (painted) return painted;
  const key = `${hero.id}|${opts.skin || ''}|${opts.expr || 'normal'}|${opts.crop || 'full'}|${opts.aura ? 1 : 0}`;
  let url = urlCache.get(key);
  if (!url) {
    const svg = heroSVG(hero, { ...opts, uid: key.replace(/[^a-z0-9]/gi, '') });
    try {
      url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    } catch {
      url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    }
    urlCache.set(key, url);
  }
  return url;
}

const imgCache = new Map();
/** Decoded HTMLImageElement promise (for canvas drawing). */
export function heroImage(hero, opts = {}) {
  const url = heroImageURL(hero, opts);
  let p = imgCache.get(url);
  if (!p) {
    p = new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = url;
    });
    imgCache.set(url, p);
  }
  return p;
}
