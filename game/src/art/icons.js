// Inline SVG icon set (currencies, items, elements, roles, navigation). icon(name, size?) -> svg string.
import { ELEMENTS } from '../core/data/elements.js';

// UI chrome icons are fine-line strokes (inherit color); items, elements and roles stay as filled colour glyphs
const L = (d) => `<g fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${d}</g>`;

const P = {
  coin: '<circle cx="12" cy="12" r="10" fill="url(#gC)" stroke="#9a6a10" stroke-width="1.5"/><circle cx="12" cy="12" r="6.5" fill="none" stroke="#fff3b8" stroke-width="1.2" opacity=".8"/><path d="M12 7.5v9M9.5 9.5h3.8a1.6 1.6 0 010 3.2h-2.6a1.6 1.6 0 000 3.2h3.8" stroke="#8a5a08" stroke-width="1.6" fill="none" stroke-linecap="round"/>',
  gem: '<path d="M6 4h12l4 6-10 11L2 10z" fill="url(#gG)" stroke="#1e6aa8" stroke-width="1.2" stroke-linejoin="round"/><path d="M2 10h20M8 4l-2 6 6 11 6-11-2-6M6 10l6-6 6 6" stroke="#e8fbff" stroke-width=".9" fill="none" opacity=".75"/>',
  heart: '<path d="M12 21s-8-5.2-8-11a4.5 4.5 0 018-2.8A4.5 4.5 0 0120 10c0 5.8-8 11-8 11z" fill="url(#gH)" stroke="#a8204a" stroke-width="1.2"/><path d="M8 8a2 2 0 012-1" stroke="#fff" stroke-width="1.4" fill="none" stroke-linecap="round"/>',
  medal: '<path d="M8 2h3l1 5-3 1zM16 2h-3l-1 5 3 1z" fill="#d84a3a"/><circle cx="12" cy="15" r="7" fill="url(#gC)" stroke="#9a6a10" stroke-width="1.3"/><path d="M12 10.5l1.3 2.7 3 .4-2.2 2 .6 3-2.7-1.5-2.7 1.5.6-3-2.2-2 3-.4z" fill="#fff3b8"/>',
  badge: '<path d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5z" fill="url(#gP)" stroke="#5a3aa8" stroke-width="1.3"/><path d="M12 7l1.5 3 3.3.4-2.4 2.3.6 3.3-3-1.6-3 1.6.6-3.3-2.4-2.3 3.3-.4z" fill="#fff"/>',
  potion: '<path d="M9 2h6v2h-1v4l5 8a4 4 0 01-3.5 6h-7A4 4 0 015 16l5-8V4H9z" fill="currentColor" stroke="#1a1030" stroke-width="1.2" stroke-linejoin="round"/><path d="M7 16h10" stroke="#fff" stroke-width="1" opacity=".6"/><circle cx="10" cy="17" r="1.2" fill="#fff" opacity=".8"/>',
  stone: '<path d="M12 2l7 5v10l-7 5-7-5V7z" fill="url(#gG)" stroke="#2a6aa8" stroke-width="1.2"/><path d="M12 2v20M5 7l14 10M19 7L5 17" stroke="#fff" stroke-width=".7" opacity=".5"/>',
  charm: '<rect x="5" y="3" width="14" height="18" rx="2" fill="#fff3d0" stroke="#c89a2a" stroke-width="1.3"/><path d="M8 8h8M8 12h8M8 16h5" stroke="#c84a2a" stroke-width="1.6" stroke-linecap="round"/>',
  clover: '<g fill="#4ade80" stroke="#167a3a" stroke-width="1"><circle cx="9" cy="9" r="4"/><circle cx="15" cy="9" r="4"/><circle cx="9" cy="15" r="4"/><circle cx="15" cy="15" r="4"/></g><path d="M12 12l5 9" stroke="#167a3a" stroke-width="1.6"/>',
  book: '<path d="M4 4h7a2 2 0 012 2v14a2 2 0 00-2-2H4zM20 4h-7a2 2 0 00-2 2v14a2 2 0 012-2h7z" fill="currentColor" stroke="#4a2a10" stroke-width="1.2"/><path d="M6 8h4M14 8h4M6 11h4M14 11h4" stroke="#fff" stroke-width="1" opacity=".7"/>',
  ticket: '<path d="M3 7a2 2 0 002-2h14a2 2 0 002 2v3a2 2 0 000 4v3a2 2 0 00-2 2H5a2 2 0 00-2-2v-3a2 2 0 000-4z" fill="url(#gP)" stroke="#7a2a8a" stroke-width="1.2"/><path d="M12 8l1.2 2.4 2.6.4-1.9 1.8.5 2.6L12 14l-2.4 1.2.5-2.6-1.9-1.8 2.6-.4z" fill="#fff"/>',
  crystal: '<path d="M12 2l5 7-5 13-5-13z" fill="url(#gP)" stroke="#8a2a9a" stroke-width="1.2"/><path d="M7 9h10M12 2v20" stroke="#fff" stroke-width=".8" opacity=".6"/>',
  cake: '<path d="M4 13h16v7H4z" fill="#ffd0e0" stroke="#a84a6a" stroke-width="1.2"/><path d="M4 13c2-3 14-3 16 0" fill="#fff" stroke="#a84a6a" stroke-width="1.2"/><circle cx="12" cy="8" r="2" fill="#ff4a6a"/><path d="M4 16.5h16" stroke="#ff8ab0" stroke-width="1.5"/>',
  flower: '<g transform="translate(12 10)"><g fill="#ff8aa8" stroke="#a83a5a" stroke-width=".8"><ellipse cy="-5" rx="3" ry="4.5"/><ellipse cy="-5" rx="3" ry="4.5" transform="rotate(72)"/><ellipse cy="-5" rx="3" ry="4.5" transform="rotate(144)"/><ellipse cy="-5" rx="3" ry="4.5" transform="rotate(216)"/><ellipse cy="-5" rx="3" ry="4.5" transform="rotate(288)"/></g><circle r="2.4" fill="#ffd84a"/></g><path d="M12 15v7" stroke="#3a8a3a" stroke-width="1.6"/>',
  tome: '<rect x="4" y="3" width="15" height="18" rx="1.5" fill="#8a5a3a" stroke="#3a2010" stroke-width="1.2"/><rect x="6" y="5" width="11" height="14" fill="none" stroke="#f2c64a" stroke-width="1"/><path d="M11.5 8l1.4 2.8 3 .4-2.2 2.1.5 3-2.7-1.4-2.7 1.4.5-3L7.1 11l3-.4z" fill="#f2c64a"/>',
  sword: '<path d="M19 3l2 2-11 11-2-2z" fill="#e8eef5" stroke="#5a6272" stroke-width="1.2"/><path d="M6 13l5 5M4 19l3-3M3 21l2-2" stroke="#c89a2a" stroke-width="2.2" stroke-linecap="round"/>',
  armor: '<path d="M7 3l5 2 5-2 4 4-2 3v10H5V10L3 7z" fill="#c8d0dc" stroke="#4a5262" stroke-width="1.2" stroke-linejoin="round"/><path d="M12 5v15M8 10h8" stroke="#4a5262" stroke-width="1" opacity=".6"/>',
  amulet: '<path d="M6 3c0 6 12 6 12 0" fill="none" stroke="#c89a2a" stroke-width="1.5"/><circle cx="12" cy="15" r="6" fill="url(#gG)" stroke="#c89a2a" stroke-width="1.5"/><circle cx="10.5" cy="13.5" r="1.6" fill="#fff" opacity=".8"/>',
  rune: '<path d="M12 2l9 5v10l-9 5-9-5V7z" fill="#3a2a6a" stroke="#b08aff" stroke-width="1.3"/><path d="M12 6v12M8 9l8 6M16 9l-8 6" stroke="#e0c8ff" stroke-width="1.4" stroke-linecap="round"/>',
  home: L('<path d="M3.5 10.5L12 3.6l8.5 6.9"/><path d="M5.8 9v11.2h12.4V9"/><path d="M10 20.2v-5.4h4v5.4"/>'),
  heroes: L('<circle cx="9" cy="8" r="3.6"/><path d="M2.6 20.4c0-3.6 2.9-6.4 6.4-6.4s6.4 2.8 6.4 6.4"/><path d="M15.4 4.7a3.6 3.6 0 010 6.6"/><path d="M17.6 14.2c2.3.8 3.8 3 3.8 5.6"/>'),
  adventure: L('<path d="M2.8 20.2l6.4-10.6 3.9 6.3 2.4-3.4 5.7 7.7z"/><path d="M9.2 9.6V3.4l4.3 1.7-4.3 1.8"/>'),
  pvp: L('<path d="M4.2 4.2l10 10M19.8 4.2l-10 10"/><path d="M6.4 15.6l2 2M17.6 15.6l-2 2"/><path d="M4 20l3.2-3.2M20 20l-3.2-3.2"/>'),
  shop: L('<path d="M5 8.2h14l-1.2 12.3H6.2z"/><path d="M8.6 10.6V7.4a3.4 3.4 0 016.8 0v3.2"/>'),
  study: L('<path d="M2.2 9.2L12 4.4l9.8 4.8-9.8 4.8z"/><path d="M6.2 11.3v4.9c1.7 1.4 3.7 2.1 5.8 2.1s4.1-.7 5.8-2.1v-4.9"/><path d="M21.6 9.4v5.4"/>'),
  settings: L('<circle cx="12" cy="12" r="3.1"/><path d="M12 2.8l1.6 2.3 2.8-.5.6 2.8 2.4 1.5-1.2 2.6 1.2 2.6-2.4 1.5-.6 2.8-2.8-.5L12 21.2l-1.6-2.3-2.8.5-.6-2.8-2.4-1.5 1.2-2.6-1.2-2.6L7 7.4l.6-2.8 2.8.5z"/>'),
  mail: L('<rect x="3.2" y="5.6" width="17.6" height="12.8" rx="1.6"/><path d="M3.8 6.6l8.2 6.2 8.2-6.2"/>'),
  scroll: L('<rect x="5" y="4.6" width="14" height="16.2" rx="1.6"/><path d="M9 3.2h6v2.8H9z"/><path d="M8.6 10.6h6.8M8.6 14h6.8M8.6 17.4h4"/>'),
  calendar: L('<rect x="3.6" y="5.2" width="16.8" height="15.2" rx="1.6"/><path d="M3.6 9.6h16.8M8 3.2v3.8M16 3.2v3.8"/><path d="M7.8 13.4h2M14.2 13.4h2M7.8 16.8h2M11 16.8h2"/>'),
  back: L('<path d="M14.8 4.6L7.4 12l7.4 7.4"/>'),
  speaker: L('<path d="M3.6 9.4h3.6l4.6-3.8v12.8l-4.6-3.8H3.6z"/><path d="M15.2 8.8a4.6 4.6 0 010 6.4M17.8 6a8.4 8.4 0 010 12"/>'),
  star: '<path d="M12 2l3 6.5 7 .8-5.2 4.8 1.4 7L12 17.6 5.8 21l1.4-7L2 9.3l7-.8z" fill="currentColor"/>',
  lock: L('<rect x="5.2" y="10.4" width="13.6" height="10.2" rx="1.6"/><path d="M8.4 10.4V7.6a3.6 3.6 0 017.2 0v2.8"/><path d="M12 14.4v2.4"/>'),
  plus: L('<path d="M12 5.4v13.2M5.4 12h13.2"/>'),
  close: L('<path d="M6.4 6.4l11.2 11.2M17.6 6.4L6.4 17.6"/>'),
  check: L('<path d="M4.6 12.4l4.6 4.6 10.2-10.4"/>'),
  pause: L('<path d="M8.6 5.4v13.2M15.4 5.4v13.2"/>'),
  auto: L('<path d="M4.6 12a7.4 7.4 0 0112.9-4.9M19.4 12a7.4 7.4 0 01-12.9 4.9"/><path d="M17.8 3.6v3.8H14M6.2 20.4v-3.8H10"/>'),
  tower: L('<path d="M7.4 21V9.6L5.6 7.8V3.4h2.8v2h2v-2h3.2v2h2v-2h2.8v4.4l-1.8 1.8V21z"/><path d="M10.4 21v-4.4a1.6 1.6 0 013.2 0V21"/><path d="M4.8 21h14.4"/>'),
  dungeon: L('<path d="M3.6 20.6v-9.2a8.4 8.4 0 0116.8 0v9.2"/><path d="M8.2 20.6v-6.2a3.8 3.8 0 017.6 0v6.2"/><path d="M2.4 20.6h19.2"/>'),
  dragon: L('<path d="M3.2 14.2c2.8-6.6 8.6-9.6 15.4-8.8-1.8 1.8-2.8 3.8-2.8 5.6 2.6 0 3.8 1.8 4.8 3.8-2.8-.9-4.8 0-5.8 1.8l-1.8 3.6-1.8-3.8c-3 .9-5.8 0-8-2.2z"/><path d="M15 9.4h.01"/>'),
  hammer: L('<path d="M13.2 3.4l7.4 7.4-2.8 2.8-7.4-7.4z"/><path d="M11.4 9.2L3.6 17l3.4 3.4 7.8-7.8"/>'),
  shirt: L('<path d="M8.4 3.6l3.6 1.8 3.6-1.8 4.8 3.6-2.8 3-2-1v11.4H8.8V9.2l-2 1-2.8-3z"/>'),
  chest: L('<rect x="3.4" y="9.4" width="17.2" height="11" rx="1.4"/><path d="M3.4 11.2c0-4.6 3.8-6.8 8.6-6.8s8.6 2.2 8.6 6.8"/><path d="M10.4 12.4h3.2v3.4h-3.2z"/>'),
  merchant: L('<circle cx="12" cy="7.6" r="3.6"/><path d="M4.6 20.6c0-4.4 3.3-7.4 7.4-7.4s7.4 3 7.4 7.4"/><path d="M5.2 6.4c2-3.8 11.6-3.8 13.6 0"/>'),
  pass: L('<rect x="3.4" y="4.6" width="17.2" height="14.8" rx="1.6"/><path d="M7.2 15.2l3.2-3.8 2.8 2.6 3.6-4.6"/>'),
  trophy: L('<path d="M7.4 3.6h9.2v4.8a4.6 4.6 0 01-9.2 0z"/><path d="M7.4 5.4H4.6a3 3 0 002.8 3.8M16.6 5.4h2.8a3 3 0 01-2.8 3.8"/><path d="M12 13v3.6M8.4 20.4h7.2M9.4 20.4l.6-3.8h4l.6 3.8"/>'),
  bolt: '<path d="M13 2L4 14h6l-1 8 9-12h-6z" fill="currentColor"/>',
  refresh: L('<path d="M19.6 11.2a7.6 7.6 0 10-2.2 5.4"/><path d="M19.8 4.4v6.8H13"/>'),
  info: L('<circle cx="12" cy="12" r="9"/><path d="M12 10.8v6M12 7.6v.2"/>'),
  globe: L('<circle cx="12" cy="12" r="8.8"/><path d="M3.4 12h17.2M12 3.2c2.8 3 2.8 14.6 0 17.6M12 3.2c-2.8 3-2.8 14.6 0 17.6"/>'),
  robot: L('<rect x="5.2" y="8.2" width="13.6" height="10.6" rx="2.6"/><path d="M12 4.2v4M9.6 12.6v1.2M14.4 12.6v1.2M8.6 18.8v2M15.4 18.8v2"/>'),
  flame: L('<path d="M12 3.2c.7 3.5 5.6 5.2 5.6 10.4a5.6 5.6 0 01-11.2 0c0-2.7 1.6-4.4 2.7-5.4 0 1.7.8 2.7 1.9 2.9-.6-2.7.2-5.3 1-7.9z"/>'),
  codex: L('<path d="M12 6.6c-2-1.6-4.8-2.2-8.4-2v13.4c3.6-.2 6.4.4 8.4 2 2-1.6 4.8-2.2 8.4-2V4.6c-3.6-.2-6.4.4-8.4 2z"/><path d="M12 6.6v13.4"/>'),
  bookmark: L('<path d="M6.4 3.6h11.2v16.8l-5.6-4-5.6 4z"/>'),
  swords: L('<path d="M4.4 3.6l9.4 9.4M19.6 3.6l-9.4 9.4"/><path d="M6.6 14.4l3 3M17.4 14.4l-3 3"/><path d="M4.2 19.8l3.2-3.2M19.8 19.8l-3.2-3.2"/>'),
};

const ELEM_P = {
  fire: '<path d="M12 2c1 4 6 6 6 12a6 6 0 01-12 0c0-3 2-5 3-6 0 2 1 3 2 3-1-3 0-6 1-9z" fill="currentColor"/>',
  water: '<path d="M12 2c3 5 7 9 7 13a7 7 0 01-14 0c0-4 4-8 7-13z" fill="currentColor"/><path d="M9 15a3 3 0 003 3" stroke="#fff" stroke-width="1.5" fill="none" opacity=".7"/>',
  wind: '<path d="M3 8h11a3 3 0 10-3-3M3 12h15a3 3 0 11-3 3M3 16h7" stroke="currentColor" stroke-width="2.4" fill="none" stroke-linecap="round"/>',
  earth: '<path d="M2 20l7-12 4 6 3-4 6 10z" fill="currentColor"/><path d="M9 8l1.5 2.5" stroke="#fff" stroke-width="1.2" opacity=".6"/>',
  light: '<circle cx="12" cy="12" r="5" fill="currentColor"/><path d="M12 1v4M12 19v4M1 12h4M19 12h4M4.2 4.2l2.8 2.8M17 17l2.8 2.8M4.2 19.8L7 17M17 7l2.8-2.8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  dark: '<path d="M15 2a10 10 0 100 20A8 8 0 0115 2z" fill="currentColor"/><path d="M18 6l.6 1.4 1.4.6-1.4.6L18 10l-.6-1.4L16 8l1.4-.6z" fill="currentColor"/>',
};

const ROLE_P = {
  guardian: '<path d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5z" fill="currentColor"/>',
  striker: '<path d="M18 2l4 4-12 12-4-4zM4 16l4 4-3 2-3-3z" fill="currentColor"/>',
  caster: '<path d="M12 2l2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5z" fill="currentColor"/>',
  ranger: '<path d="M4 20L20 4M14 4h6v6" stroke="currentColor" stroke-width="2.6" fill="none" stroke-linecap="round"/><path d="M4 12c4-1 7-4 8-8" stroke="currentColor" stroke-width="2" fill="none"/>',
  healer: '<path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6z" fill="currentColor"/>',
  support: '<path d="M9 18V5l12-2v13" stroke="currentColor" stroke-width="2.2" fill="none"/><circle cx="6" cy="18" r="3" fill="currentColor"/><circle cx="18" cy="16" r="3" fill="currentColor"/>',
};

const DEFS = `<defs><linearGradient id="gC" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff3b0"/><stop offset=".5" stop-color="#f6c63a"/><stop offset="1" stop-color="#c88a10"/></linearGradient><linearGradient id="gG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e0fbff"/><stop offset=".5" stop-color="#6ad4ff"/><stop offset="1" stop-color="#2a7ad8"/></linearGradient><linearGradient id="gH" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffb0c8"/><stop offset="1" stop-color="#ff3a6a"/></linearGradient><linearGradient id="gP" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffd8f8"/><stop offset=".5" stop-color="#d07aff"/><stop offset="1" stop-color="#7a3ad8"/></linearGradient></defs>`;
let defsInjected = false;

/** Injects shared gradients once (icons reference them by id). */
export function injectIconDefs() {
  if (defsInjected || typeof document === 'undefined') return;
  defsInjected = true;
  const d = document.createElement('div');
  d.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
  d.innerHTML = `<svg width="0" height="0">${DEFS}</svg>`;
  document.body.appendChild(d);
}

export function icon(name, cls = '') {
  const p = P[name] || ELEM_P[name] || ROLE_P[name];
  if (!p) return '';
  return `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true">${p}</svg>`;
}

export function elemIcon(el, cls = '') {
  const e = ELEMENTS[el];
  return `<svg class="ic el ${cls}" viewBox="0 0 24 24" style="color:${e ? e.color : '#fff'}">${ELEM_P[el] || ''}</svg>`;
}

export function roleIcon(role, cls = '') {
  return `<svg class="ic role ${cls}" viewBox="0 0 24 24">${ROLE_P[role] || ''}</svg>`;
}

/** Icon for a reward / item / currency key. */
export function itemIcon(key, defs) {
  const map = { gold: 'coin', gems: 'gem', hearts: 'heart', arena: 'medal', medal: 'badge' };
  if (map[key]) return icon(map[key]);
  const d = defs && defs[key];
  if (d) return `<span style="color:${d.color}">${icon(d.icon)}</span>`;
  return icon('chest');
}
