// App shell: top bar, bottom navigation, screen stack, modals, toasts, Android back button.
import { h, $, bindActions, esc, vibrateTap } from './dom.js';
import { icon } from '../art/icons.js';
import { S, subscribe } from '../core/state.js';
import { fmt } from '../core/util.js';
import { heroImageURL } from '../art/hero.js';
import { HERO_MAP } from '../core/data/heroes.js';
import { sfx } from './sound.js';

const registry = {};
const stack = [];
let root, topbar, screenHost, nav;
let badgeFn = () => ({});

export const TABS = [
  { id: 'home', zh: '主頁', icon: 'home' },
  { id: 'heroes', zh: '角色', icon: 'heroes' },
  { id: 'adventure', zh: '冒險', icon: 'adventure' },
  { id: 'pvp', zh: '對戰', icon: 'pvp' },
  { id: 'shop', zh: '商城', icon: 'shop' },
  { id: 'study', zh: '學習', icon: 'study' },
];

/** screen: { id, tab, title, chrome (default true), mount(el, params) -> { refresh?, destroy?, back? } } */
export function register(screen) {
  registry[screen.id] = screen;
}

export function setBadgeProvider(fn) {
  badgeFn = fn;
}

export function initApp() {
  root = document.getElementById('app');
  root.innerHTML = '';
  topbar = h('<header class="topbar"></header>');
  screenHost = h('<main class="screen-host"></main>');
  nav = h(`<nav class="nav">${TABS.map((t) => `<button class="nav-b" data-act="tab" data-id="${t.id}">${icon(t.icon)}<span>${t.zh}</span><i class="dot"></i></button>`).join('')}</nav>`);
  root.append(topbar, screenHost, nav);
  bindActions(nav, { tab: (el) => tab(el.dataset.id) });
  bindActions(topbar, {
    back: () => back(),
    settings: () => go('settings'),
    profile: () => go('profile'),
    gems: () => go('shop', { tab: 'summon' }),
  });
  subscribe((topic) => {
    renderTopbar();
    renderBadges();
    const top = stack[stack.length - 1];
    if (top && top.inst && top.inst.refresh) top.inst.refresh(topic);
  });
  window.__nativeBack = () => back();
}

function renderTopbar() {
  const top = stack[stack.length - 1];
  if (!top) return;
  const scr = registry[top.id];
  const d = S.d;
  const isRoot = stack.length === 1 && scr.tab === top.id;
  const sec = HERO_MAP[d.profile.avatar] || HERO_MAP.pebble;
  const left = isRoot && top.id === 'home'
    ? `<button class="tb-profile" data-act="profile"><img src="${heroImageURL(sec, { crop: 'face' })}"><span class="tb-lv">${d.profile.level}</span><span class="tb-name">${esc(d.profile.name || '契約者')}</span></button>`
    : `<button class="tb-back" data-act="back">${isRoot ? '' : icon('back')}</button><h1 class="tb-title"><span>${esc(typeof scr.title === 'function' ? scr.title(top.params) : scr.title || '')}</span></h1>`;
  topbar.innerHTML = `${left}<div class="tb-cur">
<span class="pill" data-act="gold">${icon('coin')}<b>${fmt(d.cur.gold)}</b></span>
<span class="pill" data-act="gems">${icon('gem')}<b>${fmt(d.cur.gems)}</b><i class="plus">${icon('plus')}</i></span>
<button class="tb-set" data-act="settings">${icon('settings')}</button></div>`;
}

function renderBadges() {
  const b = badgeFn() || {};
  for (const el of nav.querySelectorAll('.nav-b')) el.classList.toggle('badge', !!b[el.dataset.id]);
}

function setChrome(scr, params = {}) {
  const chrome = scr.chrome !== false;
  root.classList.toggle('no-chrome', !chrome);
  const tabId = params.navTab || scr.tab; // a screen can be opened "under" another tab
  for (const el of nav.querySelectorAll('.nav-b')) el.classList.toggle('on', el.dataset.id === tabId);
}

function mountTop(dir = 0) {
  const top = stack[stack.length - 1];
  const scr = registry[top.id];
  const el = h(`<section class="screen scr-${top.id}"></section>`);
  if (dir) el.classList.add(dir > 0 ? 'enter-r' : 'enter-l');
  screenHost.innerHTML = '';
  screenHost.appendChild(el);
  top.el = el;
  setChrome(scr, top.params);
  renderTopbar();
  renderBadges();
  try {
    top.inst = scr.mount(el, top.params || {}) || {};
  } catch (e) {
    console.error(e);
    el.innerHTML = `<div class="panel" style="margin:20px">畫面載入失敗：${esc(e.message)}</div>`;
    top.inst = {};
  }
  requestAnimationFrame(() => el.classList.remove('enter-r', 'enter-l'));
}

function unmountTop() {
  const top = stack[stack.length - 1];
  if (top && top.inst && top.inst.destroy) {
    try { top.inst.destroy(); } catch (e) { console.error(e); }
  }
}

export function go(id, params = {}) {
  if (!registry[id]) { console.warn('no screen', id); return; }
  unmountTop();
  stack.push({ id, params });
  mountTop(1);
}

/** Replaces the current screen (e.g. battle -> results). */
export function replace(id, params = {}) {
  unmountTop();
  stack.pop();
  stack.push({ id, params });
  mountTop(1);
}

export function tab(id) {
  vibrateTap();
  sfx('tab');
  unmountTop();
  stack.length = 0;
  stack.push({ id, params: {} });
  mountTop(0);
}

// Full-screen overlays (summon animation, tutorials, onboarding) claim Back while they are up.
const backHandlers = [];
export function pushBack(fn) {
  backHandlers.push(fn);
  return () => { const i = backHandlers.indexOf(fn); if (i >= 0) backHandlers.splice(i, 1); };
}

/** Back: overlays first, then an open modal, then the screen's own handler, then pop. Returns true if handled. */
export function back() {
  if (backHandlers.length) { backHandlers[backHandlers.length - 1](); return true; }
  if (closeTopModal()) return true;
  const top = stack[stack.length - 1];
  if (top && top.inst && top.inst.back && top.inst.back() === true) return true;
  if (stack.length > 1) {
    sfx('back');
    unmountTop();
    stack.pop();
    mountTop(-1);
    return true;
  }
  if (top && top.id !== 'home') { tab('home'); return true; }
  // home root: a second Back within 2 s leaves the app
  const now = Date.now();
  if (now - lastBackAt < 2000) return false;
  lastBackAt = now;
  toast('再按一次返回鍵離開遊戲');
  return true;
}
let lastBackAt = 0;

export const current = () => stack[stack.length - 1];

/** Pops the current screen without asking it (used after a screen's own confirm dialog). */
export function pop() {
  if (stack.length <= 1) { tab('home'); return; }
  unmountTop();
  stack.pop();
  mountTop(-1);
}

// ------------------------------------------------------------------ modals

const modals = [];

/**
 * modal({ title, body, buttons: [{label, cls, value}], cls, closable }) -> Promise(value)
 * body may be a string or an element; `onMount(el, close)` for custom wiring.
 */
export function modal(o) {
  return new Promise((resolve) => {
    const host = $('#overlay');
    const m = h(`<div class="modal-wrap ${o.cls || ''}"><div class="modal">
${o.title ? `<div class="modal-title">${o.title}</div>` : ''}
<div class="modal-body"></div>
${o.buttons && o.buttons.length ? `<div class="modal-btns">${o.buttons.map((b, i) => `<button class="btn ${b.cls || ''}" data-i="${i}">${b.label}</button>`).join('')}</div>` : ''}
${o.closable !== false ? `<button class="modal-x" data-x="1">${icon('close')}</button>` : ''}
</div></div>`);
    const body = m.querySelector('.modal-body');
    if (typeof o.body === 'string') body.innerHTML = o.body;
    else if (o.body) body.appendChild(o.body);
    const entry = { m, close: (v) => done(v), closable: o.closable !== false };
    const done = (v) => {
      const i = modals.indexOf(entry);
      if (i >= 0) modals.splice(i, 1);
      m.classList.add('out');
      setTimeout(() => m.remove(), 180);
      if (o.onClose) o.onClose(v);
      resolve(v);
    };
    m.addEventListener('click', (e) => {
      const b = e.target.closest('[data-i]');
      if (b && b.closest('.modal-btns')) { sfx('tap'); done(o.buttons[+b.dataset.i].value); return; }
      if (e.target.closest('[data-x]') || (e.target === m && o.closable !== false && o.tapOutside !== false)) { sfx('back'); done(null); }
    });
    host.appendChild(m);
    modals.push(entry);
    if (o.onMount) o.onMount(m, done);
    sfx(o.sound || 'open');
  });
}

export function closeTopModal() {
  const e = modals[modals.length - 1];
  if (!e) return false;
  if (e.closable) e.close(null);
  return true;
}

export const hasModal = () => modals.length > 0;

export function confirmBox(text, { ok = '確定', cancel = '取消', title = '' } = {}) {
  return modal({ title, body: `<p class="confirm-text">${text}</p>`, buttons: [{ label: cancel, value: false }, { label: ok, cls: 'primary', value: true }] }).then((v) => !!v);
}

export function infoBox(text, { title = '', ok = '確定' } = {}) {
  return modal({ title, body: `<p class="confirm-text">${text}</p>`, buttons: [{ label: ok, cls: 'primary', value: true }] });
}

// ------------------------------------------------------------------ toasts

export function toast(text, type = '') {
  const host = $('#toasts');
  const t = h(`<div class="toast ${type}">${text}</div>`);
  host.appendChild(t);
  setTimeout(() => t.classList.add('out'), 1900);
  setTimeout(() => t.remove(), 2300);
}
