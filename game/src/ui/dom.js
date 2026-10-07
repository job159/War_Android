// Small DOM helpers: HTML strings in, elements out, delegated events.
export { esc } from '../core/util.js';

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

export function h(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

/** Delegated click handling: data-act="name" (+ data-* params) -> handlers[name](el, event). */
export function bindActions(root, handlers) {
  const fn = (e) => {
    const el = e.target.closest('[data-act]');
    if (!el || !root.contains(el) || el.disabled || el.classList.contains('disabled')) return;
    const f = handlers[el.dataset.act];
    if (f) {
      e.preventDefault();
      f(el, e);
    }
  };
  root.addEventListener('click', fn);
  return () => root.removeEventListener('click', fn);
}

export function vibrateTap(ms = 8) {
  try {
    if (window.NativeBridge && window.NativeBridge.vibrate) window.NativeBridge.vibrate(ms);
  } catch {
    // ignore
  }
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const nextFrame = () => new Promise((r) => requestAnimationFrame(() => r()));
