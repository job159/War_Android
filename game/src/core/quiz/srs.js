// Spaced repetition (Leitner, 7 boxes) + mistake book.
// srs[item] = [box, dueMinute, correct, wrong]  (dueMinute = minutes since epoch; compact for saves)
// mistakes[item] = open count (wrong +1, correct -1, removed at 0) - same rule as the source apps.

export const BOX_MIN = [0, 10, 1440, 4320, 10080, 23040, 50400]; // 0, 10 min, 1 d, 3 d, 7 d, 16 d, 35 d
export const MASTER_BOX = 5;
export const LEARNED_BOX = 2;
const nowMin = (t = Date.now()) => Math.floor(t / 60000);

export function record(learn, item, ok, t = Date.now()) {
  const srs = learn.srs || (learn.srs = {});
  const r = srs[item] || [0, 0, 0, 0];
  const before = r[0];
  if (ok) {
    r[0] = Math.min(BOX_MIN.length - 1, r[0] + 1);
    r[2]++;
  } else {
    r[0] = 0;
    r[3]++;
  }
  r[1] = nowMin(t) + BOX_MIN[r[0]];
  srs[item] = r;
  const mk = learn.mistakes || (learn.mistakes = {});
  if (ok) {
    if (mk[item]) { mk[item]--; if (mk[item] <= 0) delete mk[item]; }
  } else mk[item] = (mk[item] || 0) + 1;
  return { box: r[0], before, mastered: before < MASTER_BOX && r[0] >= MASTER_BOX, learned: before < LEARNED_BOX && r[0] >= LEARNED_BOX };
}

export function isDue(r, t = Date.now()) {
  return r && r[0] > 0 && r[1] <= nowMin(t);
}

/** Items due for review (box > 0, due passed), most overdue first; optional prefix filter like 'c:'. */
export function dueItems(learn, prefix = '', t = Date.now()) {
  const m = nowMin(t);
  const out = [];
  for (const k in learn.srs || {}) {
    if (prefix && !k.startsWith(prefix)) continue;
    const r = learn.srs[k];
    if (r[0] > 0 && r[1] <= m) out.push([k, r[1]]);
  }
  out.sort((a, b) => a[1] - b[1]);
  return out.map((x) => x[0]);
}

export function mistakeItems(learn, prefix = '') {
  return Object.keys(learn.mistakes || {}).filter((k) => !prefix || k.startsWith(prefix)).sort((a, b) => learn.mistakes[b] - learn.mistakes[a]);
}

export function counts(learn, prefix = '') {
  let seen = 0, learned = 0, mastered = 0;
  for (const k in learn.srs || {}) {
    if (prefix && !k.startsWith(prefix)) continue;
    seen++;
    const b = learn.srs[k][0];
    if (b >= LEARNED_BOX) learned++;
    if (b >= MASTER_BOX) mastered++;
  }
  return { seen, learned, mastered };
}

export function boxOf(learn, item) {
  const r = learn.srs && learn.srs[item];
  return r ? r[0] : -1;
}
