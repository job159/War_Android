// Converts the two source question banks in content/ into compact JSON for the game (game/data/).
//
//   content/vocab/words.js   window.VOCAB  學測 4000 (level 1-6)
//   content/vocab/toeic.js   window.TOEIC  多益 3000 (level 1-6 = 350+ ... 900+)
//   content/grammar/*.js     CATEGORIES / LESSONS / ENRICH / QUESTION_BANK / CLOZE
//
// The grammar bank and cloze generators shuffle options with Math.random; it is replaced by a seeded
// generator so every build produces byte-identical output.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = (...p) => path.join(root, 'content', ...p);
const outDir = path.join(root, 'game', 'data');
fs.mkdirSync(outDir, { recursive: true });

function seeded(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function runScripts(files, seed = 1) {
  const math = Object.create(Math);
  math.random = seeded(seed);
  const window = {};
  const ctx = vm.createContext({ window, Math: math, console });
  for (const f of files) vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f });
  return window;
}

const clean = (s) => (typeof s === 'string' ? s.replace(/\s+/g, ' ').trim() : s);
const nonEmpty = (a) => Array.isArray(a) && a.length > 0;

// ------------------------------------------------------------------ vocabulary
function compactWord(w) {
  const o = { w: clean(w.word), p: clean(w.pos || ''), m: clean(w.meaning || ''), l: w.level | 0 || 1 };
  if (w.phonetic) o.ph = clean(w.phonetic);
  if (w.definition) o.d = clean(w.definition);
  let ex = nonEmpty(w.examples) ? w.examples.map((e) => [clean(e.en), clean(e.zh || '')]) : [];
  if (!ex.length && w.example) ex = [[clean(w.example), clean(w.exampleZh || '')]];
  ex = ex.filter((e) => e[0]);
  if (ex.length) o.x = ex;
  if (nonEmpty(w.synonyms)) o.s = w.synonyms.map(clean).filter(Boolean);
  if (nonEmpty(w.antonyms)) o.a = w.antonyms.map(clean).filter(Boolean);
  if (nonEmpty(w.family)) o.f = w.family.filter((f) => f && f.w).map((f) => [clean(f.w), clean(f.pos || ''), clean(f.zh || '')]);
  if (nonEmpty(w.confusables)) o.c = w.confusables.filter((c) => c && c.w).map((c) => [clean(c.w), clean(c.zh || '')]);
  if (nonEmpty(w.collocations)) o.k = w.collocations.map(clean).filter(Boolean);
  if (w.theme) o.t = clean(w.theme);
  return o;
}

function buildVocab(file, globalName, outName, label) {
  const win = runScripts([src('vocab', file)]);
  const list = win[globalName];
  if (!Array.isArray(list)) throw new Error(`${file}: window.${globalName} missing`);
  const seen = new Set();
  const words = [];
  for (const w of list) {
    if (!w || !w.word || !w.meaning) continue;
    const key = w.word.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    words.push(compactWord(w));
  }
  const levels = {};
  for (const w of words) levels[w.l] = (levels[w.l] || 0) + 1;
  fs.writeFileSync(path.join(outDir, outName), JSON.stringify({ book: label, count: words.length, words }));
  const kb = (fs.statSync(path.join(outDir, outName)).size / 1024).toFixed(0);
  console.log(`${outName}: ${words.length} words, levels ${JSON.stringify(levels)}, ${kb} KB`);
}

buildVocab('words.js', 'VOCAB', 'vocab_ceec.json', '學測 4000');
buildVocab('toeic.js', 'TOEIC', 'vocab_toeic.json', '多益 3000');

// ------------------------------------------------------------------ grammar
const LEVEL_NUM = { 基礎: 1, 進階: 2, 精熟: 3 };
const g = runScripts(['data.js', 'enrich.js', 'enrich2.js', 'bank.js', 'cloze.js', 'cloze2.js'].map((f) => src('grammar', f)), 20260704);
const cats = g.CATEGORIES.map((c) => ({ id: c.id, name: c.name, en: c.en, icon: c.icon, c1: c.c1, c2: c.c2, desc: c.desc }));
const enrich = g.ENRICH || {};
const lessons = g.LESSONS.map((L) => {
  const e = enrich[L.id] || {};
  return {
    id: L.id, cat: L.cat, lv: LEVEL_NUM[L.level] || 1, level: L.level, title: L.title, en: L.en, summary: L.summary,
    structure: L.structure || [], examples: L.examples || [], tips: L.tips || [], pitfalls: L.pitfalls || [],
    hook: e.hook || '', keywords: e.keywords || [], faq: e.faq || [], recap: e.recap || [], visual: e.visual || null,
    quiz: (L.quiz || []).map((q) => ({ q: clean(q.q), o: q.opts.map(clean), a: q.a, e: clean(q.ex || '') })),
  };
});

// One flat bank of single-blank multiple-choice items: c cat, t topic, v level 1-3, q stem, o options, a answer, e explanation
const bank = [];
for (const L of lessons) {
  L.quiz.forEach((q, i) => bank.push({ id: `L:${L.id}:${i}`, c: L.cat, t: L.title, v: L.lv, q: q.q, o: q.o, a: q.a, e: q.e, L: L.id }));
}
const seenQ = new Set();
for (const q of g.QUESTION_BANK) {
  const key = q.q + '|' + q.opts[q.a];
  if (seenQ.has(key)) continue;
  seenQ.add(key);
  bank.push({ id: q.qid, c: q.cat, t: q.lesson, v: q.lv, q: clean(q.q), o: q.opts.map(clean), a: q.a, e: clean(q.ex || '') });
}
const cloze = g.CLOZE.map((c) => ({
  id: c.id, kind: c.kind, c: c.cat, v: c.lv, title: c.title, text: c.text,
  blanks: c.blanks.map((b) => ({ o: b.opts.map(clean), a: b.a, e: clean(b.ex || '') })),
}));

// sanity: every answer index points inside its options
for (const q of bank) if (!(q.a >= 0 && q.a < q.o.length)) throw new Error('bad answer index ' + q.id);
for (const c of cloze) for (const b of c.blanks) if (!(b.a >= 0 && b.a < b.o.length)) throw new Error('bad cloze answer ' + c.id);

fs.writeFileSync(path.join(outDir, 'grammar.json'), JSON.stringify({ cats, lessons, bank, cloze }));
const byLv = {};
for (const q of bank) byLv[q.v] = (byLv[q.v] || 0) + 1;
const kb = (fs.statSync(path.join(outDir, 'grammar.json')).size / 1024).toFixed(0);
console.log(`grammar.json: ${cats.length} categories, ${lessons.length} lessons, ${bank.length} bank items ${JSON.stringify(byLv)}, ${cloze.length} cloze passages, ${kb} KB`);
