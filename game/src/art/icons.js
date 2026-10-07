// Inline SVG icon set (currencies, items, elements, roles, navigation). icon(name, size?) -> svg string.
import { ELEMENTS } from '../core/data/elements.js';

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
  home: '<path d="M3 11l9-8 9 8v10h-6v-6H9v6H3z" fill="currentColor"/>',
  heroes: '<circle cx="9" cy="8" r="4" fill="currentColor"/><path d="M1 21c0-5 3.5-8 8-8s8 3 8 8z" fill="currentColor"/><circle cx="17" cy="7" r="3" fill="currentColor" opacity=".6"/><path d="M15 12c4 0 8 2.5 8 8h-4" fill="currentColor" opacity=".6"/>',
  adventure: '<path d="M4 20l5-14 4 7 3-4 4 11z" fill="currentColor"/><path d="M9 3v4l3-2z" fill="currentColor" opacity=".7"/>',
  pvp: '<path d="M4 3l7 7-2 2-7-7zM20 3l-7 7 2 2 7-7z" fill="currentColor"/><path d="M3 21l6-6M21 21l-6-6M7 15l2 2M17 15l-2 2" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>',
  shop: '<path d="M4 8h16l-1.5 13h-13z" fill="currentColor"/><path d="M8 8a4 4 0 018 0" stroke="currentColor" stroke-width="2" fill="none"/>',
  study: '<path d="M2 8l10-5 10 5-10 5z" fill="currentColor"/><path d="M6 10.5V16c0 1.5 3 3 6 3s6-1.5 6-3v-5.5" stroke="currentColor" stroke-width="2" fill="none"/><path d="M21 8v6" stroke="currentColor" stroke-width="1.6"/>',
  settings: '<path d="M12 8.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 2l1.8 2.6 3.1-.6.6 3.1L20 9l-1.4 3L20 15l-2.5 1.9-.6 3.1-3.1-.6L12 22l-1.8-2.6-3.1.6-.6-3.1L4 15l1.4-3L4 9l2.5-1.9.6-3.1 3.1.6z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2" fill="currentColor"/><path d="M3 7l9 6 9-6" stroke="#1a1030" stroke-width="1.6" fill="none"/>',
  scroll: '<path d="M7 3h11a2 2 0 012 2v12h-2V5H7z" fill="currentColor" opacity=".55"/><path d="M5 6h11a2 2 0 012 2v11a2 2 0 01-2 2H7a2 2 0 01-2-2z" fill="currentColor"/><path d="M8 10h7M8 13h7M8 16h5" stroke="#1a1030" stroke-width="1.5" stroke-linecap="round"/><circle cx="18" cy="5" r="2" fill="currentColor"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2" fill="currentColor"/><path d="M3 9h18" stroke="#1a1030" stroke-width="1.6"/><path d="M8 3v4M16 3v4" stroke="currentColor" stroke-width="2"/><path d="M8 13h2M11 13h2M14 13h2M8 16h2M11 16h2" stroke="#1a1030" stroke-width="1.6"/>',
  back: '<path d="M15 4l-8 8 8 8" stroke="currentColor" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
  speaker: '<path d="M3 9h4l5-4v14l-5-4H3z" fill="currentColor"/><path d="M15 8a5 5 0 010 8M18 5a9 9 0 010 14" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round"/>',
  star: '<path d="M12 2l3 6.5 7 .8-5.2 4.8 1.4 7L12 17.6 5.8 21l1.4-7L2 9.3l7-.8z" fill="currentColor"/>',
  lock: '<rect x="5" y="10" width="14" height="11" rx="2" fill="currentColor"/><path d="M8 10V7a4 4 0 018 0v3" stroke="currentColor" stroke-width="2" fill="none"/>',
  plus: '<path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>',
  close: '<path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>',
  check: '<path d="M4 12l5 5L20 6" stroke="currentColor" stroke-width="2.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
  pause: '<rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor"/><rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor"/>',
  auto: '<path d="M4 12a8 8 0 0114-5.3M20 12a8 8 0 01-14 5.3" stroke="currentColor" stroke-width="2.2" fill="none" stroke-linecap="round"/><path d="M18 3v4h-4M6 21v-4h4" stroke="currentColor" stroke-width="2.2" fill="none" stroke-linecap="round"/>',
  tower: '<path d="M8 22V9l-2-2V3h3v2h2V3h2v2h2V3h3v4l-2 2v13z" fill="currentColor"/><rect x="10.5" y="13" width="3" height="5" rx="1.5" fill="#1a1030"/>',
  dungeon: '<path d="M3 21V11a9 9 0 0118 0v10z" fill="currentColor"/><path d="M8 21v-7a4 4 0 018 0v7" fill="#1a1030"/>',
  dragon: '<path d="M3 14c3-7 9-10 16-9-2 2-3 4-3 6 3 0 4 2 5 4-3-1-5 0-6 2l-2 4-2-4c-3 1-6 0-8-3z" fill="currentColor"/><circle cx="15" cy="9" r="1" fill="#1a1030"/>',
  hammer: '<path d="M13 3l8 8-3 3-8-8z" fill="currentColor"/><path d="M11 9l-8 8 3 3 8-8" stroke="currentColor" stroke-width="2.4" fill="none"/>',
  shirt: '<path d="M8 3l4 2 4-2 5 4-3 3-2-1v12H8V9L6 10 3 7z" fill="currentColor"/>',
  chest: '<rect x="3" y="9" width="18" height="12" rx="1.5" fill="currentColor"/><path d="M3 11c0-5 4-7 9-7s9 2 9 7" fill="currentColor" opacity=".75"/><rect x="10" y="12" width="4" height="4" rx="1" fill="#1a1030"/>',
  merchant: '<circle cx="12" cy="7" r="4" fill="currentColor"/><path d="M4 21c0-5 3.5-8 8-8s8 3 8 8z" fill="currentColor"/><path d="M5 6c2-4 12-4 14 0l-3 1H8z" fill="currentColor" opacity=".6"/>',
  pass: '<rect x="3" y="4" width="18" height="16" rx="2" fill="currentColor"/><path d="M7 15l3-4 3 3 4-5" stroke="#1a1030" stroke-width="2" fill="none" stroke-linecap="round"/>',
  trophy: '<path d="M7 3h10v5a5 5 0 01-10 0z" fill="currentColor"/><path d="M7 5H4a3 3 0 003 4M17 5h3a3 3 0 01-3 4" stroke="currentColor" stroke-width="1.8" fill="none"/><path d="M10 13h4v4h3v4H7v-4h3z" fill="currentColor"/>',
  bolt: '<path d="M13 2L4 14h6l-1 8 9-12h-6z" fill="currentColor"/>',
  refresh: '<path d="M20 11a8 8 0 10-2.3 5.7" stroke="currentColor" stroke-width="2.2" fill="none" stroke-linecap="round"/><path d="M20 4v7h-7" stroke="currentColor" stroke-width="2.2" fill="none" stroke-linecap="round"/>',
  info: '<circle cx="12" cy="12" r="10" fill="currentColor"/><path d="M12 11v6M12 7.5v.5" stroke="#1a1030" stroke-width="2.4" stroke-linecap="round"/>',
  globe: '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" stroke="currentColor" stroke-width="1.6" fill="none"/>',
  robot: '<rect x="5" y="8" width="14" height="11" rx="3" fill="currentColor"/><circle cx="9.5" cy="13" r="1.6" fill="#1a1030"/><circle cx="14.5" cy="13" r="1.6" fill="#1a1030"/><path d="M12 4v4M8 19v2M16 19v2" stroke="currentColor" stroke-width="2"/>',
  swords: '<path d="M5 3l9 9M19 3l-9 9" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/><path d="M4 16l4 4M20 16l-4 4M7 13l4 4M17 13l-4 4" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>',
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
