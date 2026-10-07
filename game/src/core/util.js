export const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);
export const lerp = (a, b, t) => a + (b - a) * t;

/** 1234 -> "1,234"; 123456 -> "12.3萬" */
export function fmt(n) {
  n = Math.floor(n || 0);
  if (Math.abs(n) >= 100000000) return (n / 100000000).toFixed(n >= 1e9 ? 0 : 1) + '億';
  if (Math.abs(n) >= 100000) return (n / 10000).toFixed(n >= 1e6 ? 0 : 1) + '萬';
  return n.toLocaleString('en-US');
}

/** Local calendar day as "2026-10-04" (daily resets follow the phone's clock at local midnight). */
export function dayKey(t = Date.now()) {
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** ISO-ish week key "2026-W40" (weeks start Monday). */
export function weekKey(t = Date.now()) {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  const n = 1 + Math.round(((d - week1) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
  return `${d.getFullYear()}-W${String(n).padStart(2, '0')}`;
}

export function daysBetween(a, b) {
  const da = new Date(a + 'T00:00:00');
  const db = new Date(b + 'T00:00:00');
  return Math.round((db - da) / 86400000);
}

export function msToClock(ms) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}` : `${m}:${String(ss).padStart(2, '0')}`;
}

export const deepClone = (o) => (o == null ? o : JSON.parse(JSON.stringify(o)));

export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

export function sum(arr, f = (x) => x) {
  let s = 0;
  for (const x of arr) s += f(x);
  return s;
}

let uidCounter = 0;
export function uid(prefix = 'u') {
  uidCounter = (uidCounter + 1) % 1e6;
  return prefix + Date.now().toString(36) + uidCounter.toString(36) + Math.floor(Math.random() * 1296).toString(36);
}
