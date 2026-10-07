// Procedural monster art (SVG), facing left (enemies stand on the right). viewBox 0 0 240 240, feet ~ y 228.
//   monsterSVG(kind, element, { expr: 'normal'|'hurt', crown }) -> svg string
import { ELEMENTS } from '../core/data/elements.js';
import { lighten, darken, ink, mix } from './color.js';
import { heroSVG } from './hero.js';
import { SILENTIA_ART } from '../core/data/enemies.js';

let seq = 0;

function pal(el) {
  const e = ELEMENTS[el] || ELEMENTS.dark;
  const base = e.color;
  return { base, light: lighten(base, 0.35), pale: lighten(base, 0.65), dark: darken(base, 0.35), ink: ink(base, 0.6), glow: e.glow };
}

function eyes(x, y, r, expr, color = '#1a0a14', glowC = null, gap = 1) {
  if (expr === 'hurt') {
    const hurt = (cx, d) => `<path d="M${cx - d * r},${y - r} L${cx + d * r * 0.6},${y} L${cx - d * r},${y + r}" stroke="${glowC ? '#1a0a14' : color}" stroke-width="${Math.max(2.5, r * 0.5)}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
    return hurt(x, 1) + (gap ? hurt(x + gap, -1) : '');
  }
  const one = (cx) => glowC
    ? `<circle cx="${cx}" cy="${y}" r="${r * 1.8}" fill="${glowC}" opacity=".35"/><circle cx="${cx}" cy="${y}" r="${r}" fill="${glowC}"/><circle cx="${cx}" cy="${y}" r="${r * 0.45}" fill="#fff"/>`
    : `<ellipse cx="${cx}" cy="${y}" rx="${r}" ry="${r * 1.25}" fill="${color}"/><circle cx="${cx - r * 0.35}" cy="${y - r * 0.45}" r="${r * 0.38}" fill="#fff"/>`;
  return one(x) + (gap ? one(x + gap) : '');
}

const crownSVG = (x, y, s = 1) => `<g transform="translate(${x},${y}) scale(${s})"><path d="M-24,0 L-28,-26 L-12,-12 L0,-32 L12,-12 L28,-26 L24,0 Z" fill="#ffd84a" stroke="#9a6a10" stroke-width="2.5" stroke-linejoin="round"/><circle cx="0" cy="-12" r="4" fill="#ff3a6a"/><circle cx="-16" cy="-6" r="3" fill="#3ab0ff"/><circle cx="16" cy="-6" r="3" fill="#3ab0ff"/></g>`;

const SHAPES = {
  slime(p, ex, o) {
    return `<ellipse cx="120" cy="226" rx="78" ry="12" fill="#000" opacity=".25"/>
<path d="M40,214 C34,150 70,96 120,92 C170,96 206,150 200,214 C200,230 40,230 40,214 Z" fill="url(#g1)" stroke="${p.ink}" stroke-width="4"/>
<path d="M66,132 C80,110 100,104 116,104" stroke="#fff" stroke-width="9" stroke-linecap="round" fill="none" opacity=".55"/>
<circle cx="76" cy="150" r="6" fill="#fff" opacity=".6"/>
${eyes(92, 168, 9, ex, '#1a0a14', null, 50)}
<path d="M106,196 Q118,${ex === 'hurt' ? 188 : 206} 130,196" stroke="#1a0a14" stroke-width="4" fill="none" stroke-linecap="round"/>
${o.crown ? crownSVG(120, 100, 1.1) : ''}`;
  },
  mushroom(p, ex) {
    return `<ellipse cx="120" cy="226" rx="56" ry="10" fill="#000" opacity=".25"/>
<path d="M88,224 C84,190 90,160 96,150 L146,150 C152,160 158,190 152,224 Z" fill="#f5e6c8" stroke="#8a6a4a" stroke-width="3"/>
${eyes(104, 184, 6, ex, '#2a1a10', null, 30)}<path d="M112,204 q8,6 16,0" stroke="#2a1a10" stroke-width="3" fill="none"/>
<path d="M30,150 C30,90 76,56 122,56 C170,56 214,92 212,150 C180,160 64,160 30,150 Z" fill="url(#g1)" stroke="${p.ink}" stroke-width="4"/>
<circle cx="80" cy="110" r="12" fill="#fff" opacity=".85"/><circle cx="130" cy="86" r="9" fill="#fff" opacity=".85"/><circle cx="168" cy="122" r="13" fill="#fff" opacity=".85"/><circle cx="112" cy="128" r="7" fill="#fff" opacity=".85"/>`;
  },
  wolf(p, ex) {
    return `<ellipse cx="122" cy="228" rx="84" ry="10" fill="#000" opacity=".25"/>
<path d="M176,140 C206,120 222,130 228,108 C232,140 214,160 190,160 Z" fill="url(#g1)" stroke="${p.ink}" stroke-width="3"/>
<path d="M70,150 C80,120 120,112 160,118 C190,124 196,160 186,178 L180,222 L166,222 L162,190 L110,192 L104,222 L90,222 L88,186 C74,178 66,164 70,150 Z" fill="url(#g1)" stroke="${p.ink}" stroke-width="3.5"/>
<path d="M30,120 C34,98 52,84 74,84 C96,84 108,100 106,122 C104,142 86,152 64,150 L36,140 C26,138 24,128 30,120 Z" fill="url(#g1)" stroke="${p.ink}" stroke-width="3.5"/>
<path d="M60,88 L66,58 L82,86 Z M84,88 L96,62 L102,94 Z" fill="${p.dark}" stroke="${p.ink}" stroke-width="3" stroke-linejoin="round"/>
<path d="M28,126 L40,132 L30,138 Z" fill="#fff"/><circle cx="26" cy="122" r="5" fill="#1a0a14"/>
${ex === 'hurt' ? '<path d="M60,104 l12,6 l-12,6" stroke="#1a0a14" stroke-width="4" fill="none"/>' : `<path d="M58,108 L78,104 L74,114 Z" fill="${p.glow}" stroke="#1a0a14" stroke-width="2"/>`}
<path d="M110,130 C130,124 150,124 170,132" stroke="${p.light}" stroke-width="5" fill="none" opacity=".6"/>`;
  },
  bat(p, ex) {
    return `<ellipse cx="120" cy="228" rx="50" ry="8" fill="#000" opacity=".2"/>
<path d="M120,120 C90,80 50,70 14,86 C30,96 30,110 24,124 C40,118 52,126 54,140 C66,130 80,134 86,148 Z" fill="${p.dark}" stroke="${p.ink}" stroke-width="3"/>
<path d="M120,120 C150,80 190,70 226,86 C210,96 210,110 216,124 C200,118 188,126 186,140 C174,130 160,134 154,148 Z" fill="${p.dark}" stroke="${p.ink}" stroke-width="3"/>
<ellipse cx="120" cy="144" rx="40" ry="44" fill="url(#g1)" stroke="${p.ink}" stroke-width="3.5"/>
<path d="M92,112 L86,80 L106,104 Z M148,112 L154,80 L134,104 Z" fill="url(#g1)" stroke="${p.ink}" stroke-width="3"/>
${eyes(102, 138, 7, ex, '#ff3a4a', null, 36)}<path d="M108,164 l4,10 l4,-10 M124,164 l4,10 l4,-10" fill="#fff" stroke="#fff"/>`;
  },
  goblin(p, ex) {
    const skin = '#7ab84a';
    return `<ellipse cx="120" cy="228" rx="56" ry="9" fill="#000" opacity=".25"/>
<path d="M92,224 L96,190 L144,190 L148,224 Z" fill="#5a3a2a" stroke="#2a1a10" stroke-width="3"/>
<path d="M84,196 C84,156 100,146 120,146 C140,146 156,156 156,196 Z" fill="url(#g1)" stroke="${p.ink}" stroke-width="3"/>
<path d="M60,180 L44,150 L50,148 L66,176 Z" fill="#c8c8d0" stroke="#4a4a5a" stroke-width="2"/>
<circle cx="66" cy="180" r="9" fill="${skin}" stroke="#2a5a1a" stroke-width="2"/>
<path d="M40,96 L84,110 L80,124 Z M200,96 L156,110 L160,124 Z" fill="${skin}" stroke="#2a5a1a" stroke-width="3"/>
<ellipse cx="120" cy="116" rx="42" ry="38" fill="${skin}" stroke="#2a5a1a" stroke-width="3.5"/>
${eyes(100, 112, 7, ex, '#ffd02a', null, 40)}<circle cx="100" cy="112" r="3" fill="#1a0a14"/><circle cx="140" cy="112" r="3" fill="#1a0a14"/>
<path d="M98,134 Q120,146 142,134" stroke="#1a2a10" stroke-width="3" fill="#fff"/><path d="M110,90 L120,72 L130,90" fill="${p.base}" stroke="${p.ink}" stroke-width="2"/>`;
  },
  wisp(p, ex) {
    return `<ellipse cx="120" cy="226" rx="40" ry="8" fill="${p.base}" opacity=".35"/>
<circle cx="120" cy="140" r="80" fill="url(#gl)"/>
<path d="M120,40 C150,80 176,110 170,150 C166,186 144,206 120,206 C96,206 74,186 70,150 C66,116 96,96 100,70 C110,90 116,96 120,40 Z" fill="url(#g1)" stroke="${p.light}" stroke-width="3" opacity=".95"/>
<path d="M120,96 C134,120 144,140 136,164 C128,180 112,180 104,164 C98,146 112,126 120,96 Z" fill="#fff" opacity=".55"/>
${eyes(104, 150, 8, ex, '#1a0a24', null, 32)}`;
  },
  skeleton(p, ex) {
    const bone = '#efe8d6';
    return `<ellipse cx="120" cy="228" rx="54" ry="9" fill="#000" opacity=".25"/>
<path d="M104,224 L108,184 M136,224 L132,184" stroke="${bone}" stroke-width="9" stroke-linecap="round"/>
<path d="M98,186 L142,186" stroke="${bone}" stroke-width="10" stroke-linecap="round"/>
<path d="M120,140 L120,186" stroke="${bone}" stroke-width="8"/>${[148, 160, 172].map((y) => `<path d="M100,${y} Q120,${y - 6} 140,${y}" stroke="${bone}" stroke-width="5" fill="none"/>`).join('')}
<path d="M100,150 L72,176 M140,150 L160,170" stroke="${bone}" stroke-width="7" stroke-linecap="round"/>
<path d="M60,190 L80,120 L86,122 L68,192 Z" fill="#c8ccd8" stroke="#4a4a5a" stroke-width="2"/><path d="M62,180 L82,186" stroke="${p.base}" stroke-width="6"/>
<path d="M88,98 C88,70 104,58 120,58 C138,58 154,70 154,98 C154,116 146,124 140,128 L140,140 L102,140 L102,128 C94,124 88,116 88,98 Z" fill="${bone}" stroke="#7a705a" stroke-width="3.5"/>
${ex === 'hurt' ? eyes(104, 98, 7, ex, '#1a0a14', null, 32) : `<ellipse cx="106" cy="98" rx="11" ry="12" fill="#1a0a14"/><ellipse cx="136" cy="98" rx="11" ry="12" fill="#1a0a14"/><circle cx="106" cy="98" r="4" fill="${p.glow}"/><circle cx="136" cy="98" r="4" fill="${p.glow}"/>`}
<path d="M110,128 v8 M120,128 v8 M130,128 v8" stroke="#7a705a" stroke-width="2"/>`;
  },
  golem(p, ex, o) {
    const rock = mix(p.base, '#8a8478', 0.6);
    return `<ellipse cx="120" cy="228" rx="86" ry="12" fill="#000" opacity=".3"/>
<rect x="76" y="186" width="34" height="42" rx="8" fill="${rock}" stroke="#2a2a2a" stroke-width="3.5"/><rect x="130" y="186" width="34" height="42" rx="8" fill="${rock}" stroke="#2a2a2a" stroke-width="3.5"/>
<path d="M58,110 C58,90 80,80 120,80 C160,80 182,90 182,110 L188,180 C188,196 52,196 52,180 Z" fill="${rock}" stroke="#2a2a2a" stroke-width="4"/>
<path d="M80,120 L100,140 L90,170 M160,116 L140,150 L156,174" stroke="${p.base}" stroke-width="4" fill="none" opacity=".9"/>
<circle cx="120" cy="140" r="16" fill="${p.glow}"/><circle cx="120" cy="140" r="26" fill="${p.base}" opacity=".35"/>
<rect x="26" y="110" width="34" height="70" rx="12" fill="${rock}" stroke="#2a2a2a" stroke-width="3.5"/><rect x="180" y="110" width="34" height="70" rx="12" fill="${rock}" stroke="#2a2a2a" stroke-width="3.5"/>
<path d="M88,62 C88,44 104,36 120,36 C136,36 152,44 152,62 L152,86 L88,86 Z" fill="${rock}" stroke="#2a2a2a" stroke-width="3.5"/>
${eyes(106, 64, 6, ex, '#000', p.glow, 28)}${o.crown ? crownSVG(120, 40, 0.9) : ''}`;
  },
  harpy(p, ex, o) {
    return `<ellipse cx="120" cy="228" rx="50" ry="8" fill="#000" opacity=".2"/>
<path d="M110,110 C70,60 30,70 8,100 C30,104 36,118 30,134 C48,128 60,136 62,150 C74,140 90,146 96,160 Z" fill="url(#g1)" stroke="${p.ink}" stroke-width="3"/>
<path d="M130,110 C170,60 210,70 232,100 C210,104 204,118 210,134 C192,128 180,136 178,150 C166,140 150,146 144,160 Z" fill="url(#g1)" stroke="${p.ink}" stroke-width="3"/>
<path d="M96,200 L100,226 M140,200 L136,226" stroke="#e8b84a" stroke-width="6" stroke-linecap="round"/>
<path d="M96,130 C96,112 106,104 120,104 C134,104 144,112 144,130 L150,190 C150,206 90,206 90,190 Z" fill="${p.pale}" stroke="${p.ink}" stroke-width="3"/>
<circle cx="120" cy="86" r="26" fill="#ffe0cc" stroke="#a87a6a" stroke-width="3"/>
<path d="M92,84 C90,60 106,54 120,54 C138,54 152,62 150,86 C140,74 126,70 120,72 C110,74 100,76 92,84 Z" fill="${p.base}" stroke="${p.ink}" stroke-width="3"/>
${eyes(110, 90, 4, ex, '#1a0a14', null, 20)}${o.crown ? crownSVG(120, 58, 0.8) : ''}`;
  },
  sprite(p, ex) {
    return `<ellipse cx="120" cy="226" rx="36" ry="7" fill="${p.base}" opacity=".3"/>
<path d="M120,120 C96,80 70,76 52,92 C70,104 80,118 96,130 Z M120,120 C144,80 170,76 188,92 C170,104 160,118 144,130 Z" fill="${p.pale}" stroke="${p.base}" stroke-width="2.5" opacity=".9"/>
<path d="M120,96 L150,150 L120,212 L90,150 Z" fill="url(#g1)" stroke="${p.ink}" stroke-width="3"/>
<path d="M120,96 L120,212 M90,150 L150,150" stroke="#fff" stroke-width="2" opacity=".6"/>
<circle cx="120" cy="84" r="22" fill="${p.pale}" stroke="${p.ink}" stroke-width="3"/>
${eyes(112, 86, 4, ex, '#1a2a4a', null, 16)}<path d="M108,62 L114,48 L120,60 L126,46 L132,62" fill="none" stroke="#fff" stroke-width="3"/>`;
  },
  salamander(p, ex) {
    return `<ellipse cx="120" cy="228" rx="88" ry="10" fill="#000" opacity=".25"/>
<path d="M150,180 C190,184 214,170 226,146 C222,180 200,204 160,204 Z" fill="url(#g1)" stroke="${p.ink}" stroke-width="3"/>
<path d="M50,168 C60,140 100,132 150,140 C180,146 186,190 166,206 L60,206 C46,200 44,182 50,168 Z" fill="url(#g1)" stroke="${p.ink}" stroke-width="3.5"/>
<path d="M70,206 L64,224 M96,206 L96,224 M140,206 L140,224 M162,206 L168,224" stroke="${p.ink}" stroke-width="8" stroke-linecap="round"/>
<path d="M18,150 C22,126 44,116 66,122 C80,126 86,140 82,156 C76,170 56,174 38,168 C26,164 16,160 18,150 Z" fill="url(#g1)" stroke="${p.ink}" stroke-width="3.5"/>
${eyes(46, 140, 6, ex, '#1a0a14', null, 0)}<path d="M18,154 L36,156" stroke="#1a0a14" stroke-width="3"/>
${[90, 110, 130, 150].map((x, i) => `<path d="M${x},${138 - (i % 2) * 4} q6,-22 12,-4" fill="${p.glow}" stroke="${p.base}" stroke-width="2"/>`).join('')}`;
  },
  armor(p, ex) {
    const steel = mix(p.base, '#8a92a4', 0.7);
    return `<ellipse cx="120" cy="228" rx="64" ry="10" fill="#000" opacity=".3"/>
<path d="M92,226 L96,180 L118,180 L116,226 Z M148,226 L144,180 L122,180 L124,226 Z" fill="${steel}" stroke="#2a2a3a" stroke-width="3"/>
<path d="M80,110 C80,96 100,90 120,90 C140,90 160,96 160,110 L156,184 L84,184 Z" fill="${steel}" stroke="#2a2a3a" stroke-width="3.5"/>
<path d="M100,120 L140,120 M98,140 L142,140 M100,160 L140,160" stroke="#2a2a3a" stroke-width="2" opacity=".5"/>
<circle cx="76" cy="112" r="20" fill="${steel}" stroke="#2a2a3a" stroke-width="3"/><circle cx="164" cy="112" r="20" fill="${steel}" stroke="#2a2a3a" stroke-width="3"/>
<path d="M44,200 L70,80 L78,82 L54,202 Z" fill="#dfe4ee" stroke="#4a4a5a" stroke-width="2"/><path d="M44,170 L76,178" stroke="${p.base}" stroke-width="7"/>
<path d="M94,74 C94,48 108,40 120,40 C132,40 146,48 146,74 L146,92 L94,92 Z" fill="${steel}" stroke="#2a2a3a" stroke-width="3.5"/>
<path d="M100,66 L140,66 L140,74 L100,74 Z" fill="#0a0a14"/>${ex === 'hurt' ? '' : `<circle cx="110" cy="70" r="3.5" fill="${p.glow}"/><circle cx="130" cy="70" r="3.5" fill="${p.glow}"/>`}
<path d="M120,40 C130,24 146,22 150,30" stroke="${p.base}" stroke-width="6" fill="none" stroke-linecap="round"/>`;
  },
  treant(p, ex, o) {
    const bark = '#6a4a2a';
    return `<ellipse cx="120" cy="228" rx="80" ry="11" fill="#000" opacity=".3"/>
<path d="M78,228 C70,200 80,150 84,110 L156,110 C160,150 170,200 162,228 C150,214 130,222 120,212 C110,222 90,214 78,228 Z" fill="${bark}" stroke="#2a1a0a" stroke-width="4"/>
<path d="M100,130 C104,160 98,190 104,210 M140,126 C136,160 142,190 136,210" stroke="#4a2a14" stroke-width="3" fill="none"/>
<path d="M84,120 C50,110 40,80 46,60 M156,120 C190,110 200,80 194,60" stroke="${bark}" stroke-width="12" stroke-linecap="round" fill="none"/>
<circle cx="120" cy="66" r="62" fill="url(#g2)" stroke="#2a5a1a" stroke-width="4"/><circle cx="60" cy="64" r="32" fill="url(#g2)" stroke="#2a5a1a" stroke-width="3"/><circle cx="180" cy="64" r="32" fill="url(#g2)" stroke="#2a5a1a" stroke-width="3"/>
${eyes(104, 150, 7, ex, '#1a0a00', p.glow, 32)}<path d="M104,178 Q120,${ex === 'hurt' ? 170 : 186} 136,178" stroke="#1a0a00" stroke-width="4" fill="none"/>
${o.crown ? crownSVG(120, 16, 0.9) : ''}`;
  },
  gargoyle(p, ex) {
    const stone = mix(p.base, '#7a7a84', 0.7);
    return `<ellipse cx="120" cy="228" rx="64" ry="10" fill="#000" opacity=".3"/>
<path d="M100,120 C70,80 40,82 24,96 C40,104 44,120 38,134 C56,128 70,140 72,150 Z M140,120 C170,80 200,82 216,96 C200,104 196,120 202,134 C184,128 170,140 168,150 Z" fill="${darken(stone, 0.2)}" stroke="#1a1a24" stroke-width="3"/>
<path d="M90,226 L96,190 M150,226 L144,190" stroke="${stone}" stroke-width="14" stroke-linecap="round"/>
<path d="M84,130 C84,110 100,104 120,104 C140,104 156,110 156,130 L152,196 L88,196 Z" fill="${stone}" stroke="#1a1a24" stroke-width="3.5"/>
<path d="M90,64 C90,46 104,38 120,38 C136,38 150,46 150,64 C150,84 138,96 120,96 C102,96 90,84 90,64 Z" fill="${stone}" stroke="#1a1a24" stroke-width="3.5"/>
<path d="M96,48 L84,24 L104,40 Z M144,48 L156,24 L136,40 Z" fill="${darken(stone, 0.3)}" stroke="#1a1a24" stroke-width="2.5"/>
${eyes(108, 62, 5, ex, '#000', p.glow, 24)}<path d="M108,82 l6,6 l6,-6 l6,6 l6,-6" stroke="#1a1a24" stroke-width="2.5" fill="none"/>`;
  },
  mimic(p, ex) {
    return `<ellipse cx="120" cy="228" rx="76" ry="10" fill="#000" opacity=".3"/>
<rect x="48" y="140" width="144" height="86" rx="8" fill="#8a5a2a" stroke="#3a2010" stroke-width="4"/>
<path d="M48,166 L192,166 M48,200 L192,200" stroke="#e0b04a" stroke-width="6"/><rect x="108" y="150" width="24" height="28" rx="4" fill="#e0b04a" stroke="#7a5a10" stroke-width="2"/>
<path d="M58,140 l10,-14 l10,14 l10,-14 l10,14 l10,-14 l10,14 l10,-14 l10,14 l10,-14 l10,14 l10,-14 l10,14 l10,-14 l2,14" fill="#fff" stroke="#3a2010" stroke-width="2"/>
<path d="M48,140 C48,76 192,76 192,140 L192,104 C192,58 48,58 48,104 Z" fill="#9a6a3a" stroke="#3a2010" stroke-width="4"/>
<path d="M48,112 C72,104 168,104 192,112" stroke="#e0b04a" stroke-width="6" fill="none"/>
<path d="M58,104 l10,14 l10,-14 l10,14 l10,-14 l10,14 l10,-14 l10,14 l10,-14 l10,14 l10,-14 l10,14 l10,-14 l10,14 l2,-14" fill="#fff" stroke="#3a2010" stroke-width="2"/>
<path d="M90,126 C100,150 120,160 150,150" stroke="#ff5a8a" stroke-width="12" stroke-linecap="round" fill="none"/>
${eyes(92, 90, 6, ex, '#000', p.glow, 56)}`;
  },
  dragon(p, ex) {
    return `<ellipse cx="128" cy="230" rx="100" ry="10" fill="#000" opacity=".3"/>
<path d="M140,96 C170,30 220,24 236,40 C216,48 214,70 222,86 C200,82 190,96 194,112 C176,104 160,110 150,124 Z" fill="${p.dark}" stroke="${p.ink}" stroke-width="3.5"/>
<path d="M170,170 C206,176 230,160 236,132 C236,170 214,200 176,204 Z" fill="url(#g1)" stroke="${p.ink}" stroke-width="3.5"/>
<path d="M80,150 C88,116 130,104 168,120 C192,132 196,176 180,200 L80,206 C66,196 72,168 80,150 Z" fill="url(#g1)" stroke="${p.ink}" stroke-width="4"/>
<path d="M96,206 L92,228 L112,228 L114,204 M150,204 L152,228 L172,228 L168,200" fill="${p.dark}" stroke="${p.ink}" stroke-width="3.5"/>
<path d="M100,160 C110,150 140,150 156,160 L150,196 L104,198 Z" fill="${p.pale}" opacity=".6"/>
<path d="M90,140 C80,108 64,96 40,96 C20,96 8,108 10,122 C12,134 26,140 40,140 L56,146 Z" fill="url(#g1)" stroke="${p.ink}" stroke-width="4"/>
<path d="M48,98 L54,70 L66,96 Z M68,100 L82,76 L84,108 Z" fill="${p.pale}" stroke="${p.ink}" stroke-width="2.5"/>
<path d="M12,124 L40,126" stroke="${p.ink}" stroke-width="3"/><path d="M16,126 l4,6 l4,-6 l4,6 l4,-6" fill="#fff"/>
${ex === 'hurt' ? '<path d="M38,106 l10,6 l-10,6" stroke="#1a0a14" stroke-width="4" fill="none"/>' : `<path d="M34,108 L54,104 L50,114 Z" fill="${p.glow}" stroke="#1a0a14" stroke-width="2"/>`}`;
  },
  kraken(p, ex) {
    const tent = (x, d) => `<path d="M${x},170 C${x + d * 30},190 ${x + d * 10},214 ${x + d * 40},226" stroke="url(#g1)" stroke-width="20" stroke-linecap="round" fill="none"/><path d="M${x},170 C${x + d * 30},190 ${x + d * 10},214 ${x + d * 40},226" stroke="${p.ink}" stroke-width="2" fill="none" opacity=".5"/>`;
    return `<ellipse cx="120" cy="230" rx="104" ry="10" fill="#1a3a6a" opacity=".4"/>
${tent(80, -1)}${tent(104, -0.5)}${tent(136, 0.5)}${tent(160, 1)}
<path d="M44,140 C30,60 80,20 120,20 C160,20 210,60 196,140 C190,176 50,176 44,140 Z" fill="url(#g1)" stroke="${p.ink}" stroke-width="4"/>
<circle cx="80" cy="70" r="10" fill="${p.pale}" opacity=".7"/><circle cx="160" cy="60" r="8" fill="${p.pale}" opacity=".7"/><circle cx="130" cy="44" r="6" fill="${p.pale}" opacity=".7"/>
${eyes(86, 116, 12, ex, '#1a0a14', p.glow, 68)}`;
  },
  lich(p, ex, o) {
    return `<ellipse cx="120" cy="228" rx="64" ry="10" fill="#000" opacity=".3"/>
<circle cx="120" cy="120" r="96" fill="url(#gl)" opacity=".7"/>
<path d="M70,226 C74,180 86,130 98,110 L142,110 C154,130 166,180 170,226 Z" fill="#2a1a3a" stroke="#0a0414" stroke-width="3.5"/>
<path d="M98,110 L120,150 L142,110" fill="none" stroke="${p.base}" stroke-width="4"/>
<path d="M50,226 L60,60" stroke="#5a4a3a" stroke-width="7" stroke-linecap="round"/><circle cx="60" cy="54" r="14" fill="${p.glow}"/><circle cx="60" cy="54" r="24" fill="${p.base}" opacity=".35"/>
<path d="M92,80 C92,54 106,44 120,44 C136,44 150,54 150,80 C150,96 142,104 136,108 L104,108 C98,104 92,96 92,80 Z" fill="#efe8d6" stroke="#5a5040" stroke-width="3.5"/>
${ex === 'hurt' ? eyes(108, 80, 6, ex, '#1a0a14', null, 26) : `<ellipse cx="108" cy="80" rx="9" ry="10" fill="#0a0414"/><ellipse cx="134" cy="80" rx="9" ry="10" fill="#0a0414"/><circle cx="108" cy="80" r="4" fill="${p.glow}"/><circle cx="134" cy="80" r="4" fill="${p.glow}"/>`}
${crownSVG(120, 50, 0.85)}`;
  },
  demon(p, ex) {
    return `<ellipse cx="120" cy="228" rx="76" ry="11" fill="#000" opacity=".3"/>
<path d="M94,100 C60,50 24,58 10,80 C30,86 34,104 28,120 C48,114 62,124 64,138 Z M146,100 C180,50 216,58 230,80 C210,86 206,104 212,120 C192,114 178,124 176,138 Z" fill="#2a1020" stroke="#0a0408" stroke-width="3"/>
<path d="M92,226 L98,180 L118,180 L116,226 Z M148,226 L142,180 L122,180 L124,226 Z" fill="#3a2030" stroke="#0a0408" stroke-width="3"/>
<path d="M78,110 C78,96 100,88 120,88 C140,88 162,96 162,110 L158,184 L82,184 Z" fill="#3a1a2a" stroke="#0a0408" stroke-width="3.5"/>
<path d="M96,108 L144,108 L138,150 L102,150 Z" fill="${p.base}" opacity=".5"/>
<path d="M30,210 L60,70 L72,72 L48,214 Z" fill="#c8ccd8" stroke="#2a2a3a" stroke-width="2.5"/><path d="M34,196 L66,204" stroke="${p.base}" stroke-width="8"/>
<path d="M96,70 C96,48 108,38 120,38 C134,38 146,48 146,70 C146,88 134,96 120,96 C106,96 96,88 96,70 Z" fill="#8a3a4a" stroke="#0a0408" stroke-width="3.5"/>
<path d="M100,50 C82,34 80,14 92,4 C92,22 100,34 110,42 Z M140,50 C158,34 160,14 148,4 C148,22 140,34 130,42 Z" fill="#1a0a10" stroke="${p.base}" stroke-width="2"/>
${eyes(110, 68, 5, ex, '#000', p.glow, 20)}<path d="M110,84 l5,5 l5,-5 l5,5 l5,-5" stroke="#fff" stroke-width="2" fill="none"/>`;
  },
};

export function monsterSVG(kind, element, opts = {}) {
  if (kind === 'queen') {
    return heroSVG({ id: 'silentia', element: 'dark', art: SILENTIA_ART, skin: null }, { expr: opts.expr === 'hurt' ? 'hurt' : 'angry', crop: 'full', uid: 'silentia' + (opts.expr || '') });
  }
  const p = pal(element);
  const id = 'm' + (++seq);
  const body = (SHAPES[kind] || SHAPES.slime)(p, opts.expr || 'normal', opts);
  const defs = `<defs><linearGradient id="${id}g1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p.light}"/><stop offset=".55" stop-color="${p.base}"/><stop offset="1" stop-color="${p.dark}"/></linearGradient>
<linearGradient id="${id}g2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8ad85a"/><stop offset="1" stop-color="#2a7a2a"/></linearGradient>
<radialGradient id="${id}gl" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="${p.glow}" stop-opacity=".7"/><stop offset="1" stop-color="${p.base}" stop-opacity="0"/></radialGradient></defs>`;
  const fixed = body.replace(/url\(#g1\)/g, `url(#${id}g1)`).replace(/url\(#g2\)/g, `url(#${id}g2)`).replace(/url\(#gl\)/g, `url(#${id}gl)`);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240">${defs}${fixed}</svg>`;
}

const urlCache = new Map();
export function monsterImageURL(kind, element, opts = {}) {
  const key = `${kind}|${element}|${opts.expr || 'normal'}|${opts.crown ? 1 : 0}`;
  let url = urlCache.get(key);
  if (!url) {
    const svg = monsterSVG(kind, element, opts);
    try { url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' })); } catch { url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); }
    urlCache.set(key, url);
  }
  return url;
}

const imgCache = new Map();
export function monsterImage(kind, element, opts = {}) {
  const url = monsterImageURL(kind, element, opts);
  let p = imgCache.get(url);
  if (!p) {
    p = new Promise((resolve) => { const img = new Image(); img.onload = () => resolve(img); img.onerror = () => resolve(null); img.src = url; });
    imgCache.set(url, p);
  }
  return p;
}
