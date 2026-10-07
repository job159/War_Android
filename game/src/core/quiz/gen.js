// Question generator.
//
// Question: { item, kind: 'vocab'|'grammar', type, label, main, sub, sentence, options[4], answer,
//             speak (TTS text), speakOnShow, explain, reveal (extra lines after answering), par (s), level }
//
// QuestionDeck yields an endless stream for one battle: SRS reviews + mistakes + new items of the
// chosen tier, vocabulary and grammar mixed by `grammarShare`. Pool mode (PvP) ignores the player's
// SRS so both phones generate the identical sequence from the same seed.
import { makeRng } from '../rng.js';
import { content, BOOKS } from './content.js';
import { dueItems, mistakeItems, boxOf } from './srs.js';

export const TYPE_LABEL = {
  w2m: '選出正確的中文意思',
  m2w: '選出正確的英文單字',
  cloze: '選出最適合填入空格的單字',
  listen: '聽發音，選出正確的單字',
  syn: '選出意思最接近的單字',
  ant: '選出意思相反的單字',
  gram: '文法：選出正確答案',
  passage: '克漏字：選出正確答案',
};
const PAR = { w2m: 5, m2w: 5, cloze: 9, listen: 5, syn: 6, ant: 6, gram: 9, passage: 10 };

// ------------------------------------------------------------------ inflection (for cloze distractors)
const IRREGULAR = new Set('be have do say go get make know think take see come want look use find give tell work call try ask need feel become leave put mean keep let begin seem help show hear play run move live believe hold bring happen write sit stand lose pay meet include continue set learn change lead understand watch follow stop create speak read spend grow open walk win offer remember love consider appear buy wait serve die send expect build stay fall cut reach kill remain suggest raise pass sell require report decide pull break teach catch draw choose fight throw drive ride rise shake sing swim wear wake steal hide forget forgive freeze bite bend bleed blow dig feed fly hang lay lend light shoot shut sink slide spin split spread stick sting strike swear sweep swing tear'.split(' '));
const isVowel = (c) => 'aeiou'.includes(c);

function inflect(base, suffix) {
  const w = base.toLowerCase();
  if (suffix === 's' || suffix === 'es') {
    if (/[^aeiou]y$/.test(w)) return base.slice(0, -1) + 'ies';
    if (/(s|x|z|ch|sh)$/.test(w)) return base + 'es';
    return base + 's';
  }
  if (suffix === 'ed' || suffix === 'd') {
    if (w.endsWith('e')) return base + 'd';
    if (/[^aeiou]y$/.test(w)) return base.slice(0, -1) + 'ied';
    return base + 'ed';
  }
  if (suffix === 'ing') {
    if (w.endsWith('ie')) return base.slice(0, -2) + 'ying';
    if (w.endsWith('e') && !w.endsWith('ee')) return base.slice(0, -1) + 'ing';
    return base + 'ing';
  }
  return base;
}

/** Finds the word (or a regular inflection of it) in a sentence; returns { sentence with blank, form, suffix }. */
function blankOut(word, sentence) {
  const w = word.toLowerCase();
  const esc = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const stem = w.endsWith('e') ? esc.slice(0, -1) : /[^aeiou]y$/.test(w) ? esc.slice(0, -1) : esc;
  const re = new RegExp(`\\b(${esc}|${esc}s|${esc}es|${esc}d|${esc}ed|${stem}ed|${stem}ing|${esc}ing|${stem}ies|${stem}ied|${esc}${esc.slice(-1)}ed|${esc}${esc.slice(-1)}ing)\\b`, 'i');
  const m = re.exec(sentence);
  if (!m) return null;
  const form = m[1];
  const f = form.toLowerCase();
  let suffix = '';
  if (f !== w) {
    if (f.endsWith('ing')) suffix = 'ing';
    else if (f.endsWith('ed') || f.endsWith('ied')) suffix = 'ed';
    else if (f.endsWith('s')) suffix = 's';
  }
  const cap = /^[A-Z]/.test(form) && m.index === 0;
  return { text: sentence.slice(0, m.index) + '_____' + sentence.slice(m.index + form.length), form, suffix, cap };
}

// ------------------------------------------------------------------ distractors

function overlaps(a, b) {
  if (a.w.toLowerCase() === b.w.toLowerCase()) return true;
  for (const p of a.parts) if (b.parts.includes(p)) return true;
  return false;
}

/** n words of the same part of speech near `w`'s level whose meanings do not overlap with it. */
function distractorWords(w, n, rng, { samePos = true, spelling = false } = {}) {
  const book = content.books[w.book];
  const out = [];
  const used = new Set([w.w.toLowerCase()]);
  const syn = new Set([...(w.s || []), ...(w.a || [])].map((x) => x.toLowerCase()));
  const tryPool = (pool, tries) => {
    for (let i = 0; i < tries && out.length < n && pool.length; i++) {
      const c = pool[rng.int(pool.length)];
      if (used.has(c.w.toLowerCase()) || syn.has(c.w.toLowerCase()) || overlaps(w, c)) continue;
      if (spelling && c.w[0].toLowerCase() !== w.w[0].toLowerCase() && rng() < 0.7) continue;
      used.add(c.w.toLowerCase());
      out.push(c);
    }
  };
  if (samePos) {
    const near = (book.byPos[w.pos] || []).filter((c) => Math.abs(c.l - w.l) <= 1);
    tryPool(near, 60);
    tryPool(book.byPos[w.pos] || [], 60);
  }
  tryPool(book.byLevel[w.l] || book.words, 80);
  tryPool(book.words, 200);
  return out;
}

function shuffleOptions(correct, wrongs, rng) {
  const opts = [correct, ...wrongs].slice(0, 4);
  rng.shuffle(opts);
  return { options: opts, answer: opts.indexOf(correct) };
}

// ------------------------------------------------------------------ builders

export function vocabQuestion(w, type, rng, { tts = true } = {}) {
  const sub = [w.ph, w.p].filter(Boolean).join(' · ');
  const exampleZh = w.x && w.x[0] ? w.x[0][1] : '';
  const base = { item: w.id, kind: 'vocab', type, level: w.l, label: TYPE_LABEL[type], par: PAR[type], word: w.w };
  const reveal = [`${w.w}  ${w.ph || ''}  ${w.p}  ${w.m}`];
  if (type === 'w2m') {
    const ds = distractorWords(w, 3, rng);
    if (ds.length < 3) return null;
    return { ...base, main: w.w, sub, speak: w.w, speakOnShow: tts, ...shuffleOptions(w.m, ds.map((d) => d.m), rng), reveal, explain: w.d ? `英英：${w.d}` : '' };
  }
  if (type === 'm2w' || type === 'listen') {
    const ds = distractorWords(w, 3, rng, { spelling: type === 'listen' || w.l >= 4 });
    if (ds.length < 3) return null;
    return {
      ...base, main: type === 'listen' ? '🔊' : w.m, sub: type === 'listen' ? '點擊喇叭可再聽一次' : w.p,
      speak: w.w, speakOnShow: type === 'listen', speakOnReveal: type !== 'listen',
      ...shuffleOptions(w.w, ds.map((d) => d.w), rng), reveal, explain: exampleZh ? `例：${w.x[0][0]}` : '',
    };
  }
  if (type === 'cloze') {
    const exs = (w.x || []).slice();
    rng.shuffle(exs);
    for (const [en, zh] of exs) {
      const b = blankOut(w.w, en);
      if (!b) continue;
      const verbish = b.suffix === 'ed' || b.suffix === 'ing';
      const ds = distractorWords(w, 3, rng).filter((d) => !(verbish && IRREGULAR.has(d.w.toLowerCase())) && !/\s/.test(d.w));
      if (ds.length < 3) continue;
      const fix = (s) => (b.cap ? s[0].toUpperCase() + s.slice(1) : s);
      const correct = fix(b.form);
      const wrongs = ds.slice(0, 3).map((d) => fix(b.suffix ? inflect(d.w, b.suffix) : d.w));
      return { ...base, main: '', sentence: b.text, sub: '', speak: en, speakOnReveal: true, ...shuffleOptions(correct, wrongs, rng), reveal: [en, zh, ...reveal], explain: `${w.w}：${w.m}` };
    }
    return null;
  }
  if (type === 'syn' || type === 'ant') {
    const list = (type === 'syn' ? w.s : w.a) || [];
    const pick = list.filter((s) => s && s.length < 22);
    if (!pick.length) return null;
    const correct = pick[rng.int(pick.length)];
    const ds = distractorWords(w, 3, rng).map((d) => d.w).filter((d) => d.toLowerCase() !== correct.toLowerCase());
    if (ds.length < 3) return null;
    return {
      ...base, main: w.w, sub: `${w.p}  ${type === 'syn' ? '≈ 同義' : '⇄ 反義'}`, speak: w.w, speakOnShow: tts,
      ...shuffleOptions(correct, ds, rng), reveal, explain: `${w.w}（${w.m}）的${type === 'syn' ? '同義詞' : '反義詞'}：${list.join(', ')}`,
    };
  }
  return null;
}

const englishOnly = (s) => /^[ -~’‘“”—–…]+$/.test(s);

export function grammarQuestion(q, rng) {
  const order = q.o.map((_, i) => i);
  rng.shuffle(order);
  const options = order.map((i) => q.o[i]);
  return {
    item: q.item, kind: 'grammar', type: 'gram', level: q.v, label: `文法 · ${q.t || '綜合'}`, par: PAR.gram + Math.min(6, q.q.length / 25),
    main: '', sentence: q.q, sub: '', options, answer: order.indexOf(q.a), explain: q.e,
    speak: englishOnly(q.q) ? q.q.replace(/_{2,}/g, q.o[q.a]) : '', speakOnReveal: englishOnly(q.q), reveal: [/_{2,}/.test(q.q) ? q.q.replace(/_{2,}/g, `【${q.o[q.a]}】`) : `${q.q} → ${q.o[q.a]}`],
  };
}

/** One blank of a cloze passage: the sentence around it, other blanks filled in. */
export function passageQuestion(b, rng) {
  const p = b.passage;
  let text = p.text;
  p.blanks.forEach((bl, i) => {
    if (i !== b.i) text = text.replace(`{${i + 1}}`, bl.o[bl.a]);
  });
  const marker = `{${b.i + 1}}`;
  const idx = text.indexOf(marker);
  // the sentence that contains the blank (plus the previous one for context)
  const flat = text.replace(/\n+/g, ' ');
  const at = flat.indexOf(marker);
  let start = Math.max(flat.lastIndexOf('. ', at - 1), flat.lastIndexOf('! ', at - 1), flat.lastIndexOf('? ', at - 1));
  start = start < 0 ? 0 : start + 2;
  let end = flat.slice(at).search(/[.!?](\s|$)/);
  end = end < 0 ? flat.length : at + end + 1;
  const sentence = flat.slice(start, end).replace(marker, '_____').trim();
  void idx;
  const order = b.o.map((_, i) => i);
  rng.shuffle(order);
  return {
    item: b.item, kind: 'grammar', type: 'passage', level: b.v, label: `克漏字 · ${p.title}`, par: PAR.passage + Math.min(6, sentence.length / 25),
    main: '', sentence, sub: '', options: order.map((i) => b.o[i]), answer: order.indexOf(b.a), explain: b.e,
    speak: sentence.replace('_____', b.o[b.a]), speakOnReveal: true, reveal: [sentence.replace('_____', `【${b.o[b.a]}】`)],
  };
}

export function questionFor(item, rng, opts = {}) {
  const it = content.item(item);
  if (!it) return null;
  if (item[0] === 'g') return grammarQuestion(it, rng);
  if (item[0] === 'z') return it.long ? null : passageQuestion(it, rng);
  const types = opts.types || pickVocabTypes(boxOf(opts.learn || {}, item), opts);
  for (const t of types) {
    const q = vocabQuestion(it, t, rng, opts);
    if (q) return q;
  }
  return vocabQuestion(it, 'w2m', rng, opts);
}

/** Harder question types for better-known words. */
function pickVocabTypes(box, { listen = false } = {}) {
  const L = listen ? ['listen'] : [];
  if (box <= 0) return ['w2m', 'm2w'];
  if (box === 1) return ['m2w', 'w2m'];
  if (box === 2) return ['cloze', ...L, 'm2w'];
  if (box === 3) return [...L, 'cloze', 'syn', 'm2w'];
  return ['syn', 'cloze', 'ant', ...L, 'm2w'];
}

// ------------------------------------------------------------------ deck

export class QuestionDeck {
  /**
   * @param {object} o
   * @param {string[]} o.books   ['c'] | ['t'] | ['c','t']
   * @param {number[]} o.levels  vocabulary levels to draw new words from
   * @param {number} o.glv       grammar level 1-3
   * @param {number} o.grammarShare 0..1
   * @param {object} [o.learn]   save.learn (SRS); omit for pool mode
   * @param {number} o.seed
   * @param {boolean} [o.listen] allow listening questions (needs TTS)
   * @param {string} [o.only]    'review' | 'mistakes' | 'grammar' | 'vocab'
   */
  constructor(o) {
    this.o = o;
    this.rng = makeRng(o.seed || 1);
    this.learn = o.learn || null;
    this.queue = [];
    this.used = new Set();
    this.count = 0;
    this.fill();
  }

  fill() {
    const o = this.o;
    const rng = this.rng;
    const books = o.books.filter((b) => content.hasBook(b));
    const n = 30;
    const items = [];
    const vocabN = o.only === 'grammar' ? 0 : o.only === 'vocab' ? n : Math.round(n * (1 - (o.grammarShare ?? 0.25)));
    const gramN = n - vocabN;
    if (this.learn && !o.pool) {
      const prefixes = books.map((b) => b + ':');
      const due = dueItems(this.learn).filter((k) => (prefixes.some((p) => k.startsWith(p)) || (o.only !== 'vocab' && (k[0] === 'g' || k[0] === 'z'))) && !this.used.has(k));
      const mist = mistakeItems(this.learn).filter((k) => (prefixes.some((p) => k.startsWith(p)) || k[0] === 'g' || k[0] === 'z') && !this.used.has(k));
      const reviewN = o.only === 'review' ? n : o.only === 'mistakes' ? 0 : Math.round(n * 0.25);
      const mistN = o.only === 'mistakes' ? n : o.only === 'review' ? 0 : Math.round(n * 0.15);
      items.push(...due.slice(0, reviewN));
      for (const k of mist) if (items.length < reviewN + mistN && !items.includes(k)) items.push(k);
      if (o.only === 'review' || o.only === 'mistakes') {
        if (!items.length) return this._fallback(books, n);
        rng.shuffle(items);
        for (const k of items) this.queue.push(k);
        return;
      }
    }
    // new / learning vocabulary from the chosen levels (prefer unseen and not-yet-mastered words)
    const vPool = [];
    for (const b of books) for (const lv of o.levels) vPool.push(...(content.books[b].byLevel[lv] || []));
    let added = 0;
    for (let tries = 0; added < vocabN - Math.min(items.length, vocabN) && tries < 400 && vPool.length; tries++) {
      const w = vPool[rng.int(vPool.length)];
      if (this.used.has(w.id) || items.includes(w.id)) continue;
      const box = this.learn && !o.pool ? boxOf(this.learn, w.id) : -1;
      if (box >= 5 && rng() < 0.85) continue; // mastered words come back rarely
      items.push(w.id);
      added++;
    }
    // grammar
    if (gramN > 0 && content.grammar) {
      const g = content.grammar;
      const lvPool = [...(g.byLevel[o.glv] || []), ...(o.glv > 1 ? g.byLevel[o.glv - 1].slice(0, 400) : [])];
      const clz = g.clozeBlanks.filter((b) => !b.long && b.v <= o.glv);
      for (let i = 0, tries = 0; i < gramN && tries < 300; tries++) {
        const fromCloze = o.glv >= 2 && rng() < 0.25 && clz.length;
        const it = fromCloze ? clz[rng.int(clz.length)] : lvPool[rng.int(lvPool.length)];
        if (!it || this.used.has(it.item) || items.includes(it.item)) continue;
        items.push(it.item);
        i++;
      }
    }
    rng.shuffle(items);
    for (const k of items) this.queue.push(k);
  }

  _fallback(books, n) {
    const o = { ...this.o, only: undefined, pool: true };
    const save = this.o;
    this.o = o;
    this.fill();
    this.o = save;
    void books; void n;
  }

  next() {
    for (let guard = 0; guard < 60; guard++) {
      if (!this.queue.length) {
        if (this.used.size > 2000) this.used.clear();
        this.fill();
        if (!this.queue.length) return null;
      }
      const item = this.queue.shift();
      if (this.used.has(item)) continue;
      this.used.add(item);
      const q = questionFor(item, this.rng, { learn: this.learn && !this.o.pool ? this.learn : null, listen: this.o.listen, tts: this.o.tts !== false, types: this.o.types });
      if (q) {
        q.n = ++this.count;
        return q;
      }
    }
    return null;
  }
}

/** Speed tier for the battle engine. */
export function speedTier(ms, par) {
  const s = ms / 1000;
  return s < par * 0.45 ? 'perfect' : s < par ? 'great' : 'good';
}

export const bookLabel = (b) => (BOOKS[b] ? BOOKS[b].zh : b);
