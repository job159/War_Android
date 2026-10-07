// Question content: the two vocabulary books and the grammar bank, indexed for the generator.
// Item ids: 'c:<word>' 學測, 't:<word>' 多益, 'g:<bank id>' grammar item, 'z:<cloze id>:<blank>' cloze blank.

export const BOOKS = {
  c: { id: 'c', zh: '學測 4000', file: 'data/vocab_ceec.json', levels: ['', 'Level 1', 'Level 2', 'Level 3', 'Level 4', 'Level 5', 'Level 6'] },
  t: { id: 't', zh: '多益 3000', file: 'data/vocab_toeic.json', levels: ['', '350+', '500+', '650+', '750+', '850+', '900+'] },
};

export const primaryPos = (p) => (p || '').split('/')[0].trim();
/** Meaning segments for overlap checks: "放棄；拋棄；遺棄" -> ['放棄','拋棄','遺棄'] */
export const meaningParts = (m) => (m || '').replace(/（[^）]*）|\([^)]*\)/g, '').split(/[；;，,、／/]/).map((s) => s.trim()).filter(Boolean);

export class Content {
  constructor() {
    this.books = {}; // id -> { words, byLevel: {lv: [word]}, byPos: {pos: [word]}, map }
    this.grammar = null;
  }

  addBook(id, json) {
    const words = json.words.map((w) => ({ ...w, id: `${id}:${w.w}`, book: id, pos: primaryPos(w.p), parts: meaningParts(w.m) }));
    const byLevel = {};
    const byPos = {};
    const map = new Map();
    for (const w of words) {
      (byLevel[w.l] || (byLevel[w.l] = [])).push(w);
      (byPos[w.pos] || (byPos[w.pos] = [])).push(w);
      map.set(w.id, w);
    }
    this.books[id] = { id, words, byLevel, byPos, map, count: words.length };
  }

  setGrammar(json) {
    const byLevel = { 1: [], 2: [], 3: [] };
    const byCat = {};
    const map = new Map();
    for (const q of json.bank) {
      const item = { ...q, item: 'g:' + q.id };
      (byLevel[q.v] || byLevel[1]).push(item);
      (byCat[q.c] || (byCat[q.c] = [])).push(item);
      map.set(item.item, item);
    }
    const clozeBlanks = [];
    for (const c of json.cloze) {
      c.blanks.forEach((b, i) => {
        const long = b.o.some((o) => o.length > 48);
        const blank = { item: `z:${c.id}:${i}`, passage: c, i, o: b.o, a: b.a, e: b.e, v: c.v, c: c.c, long };
        clozeBlanks.push(blank);
        map.set(blank.item, blank);
      });
    }
    this.grammar = { cats: json.cats, lessons: json.lessons, bank: json.bank, byLevel, byCat, map, cloze: json.cloze, clozeBlanks };
  }

  hasBook(id) { return !!this.books[id]; }

  /** Looks up any item id. */
  item(id) {
    if (!id) return null;
    const k = id[0];
    if (k === 'c' || k === 't') return this.books[k] ? this.books[k].map.get(id) : null;
    return this.grammar ? this.grammar.map.get(id) : null;
  }

  word(id) { return this.item(id); }
  lesson(id) { return this.grammar && this.grammar.lessons.find((l) => l.id === id); }
}

export const content = new Content();

/** Fetches a book / grammar JSON once (shared promise). */
const loading = {};
export function loadBook(id, onProgress) {
  if (content.hasBook(id)) return Promise.resolve(content.books[id]);
  if (!loading[id]) {
    loading[id] = fetchJSON(BOOKS[id].file, onProgress).then((json) => {
      content.addBook(id, json);
      return content.books[id];
    });
  }
  return loading[id];
}

export function loadGrammar(onProgress) {
  if (content.grammar) return Promise.resolve(content.grammar);
  if (!loading.g) loading.g = fetchJSON('data/grammar.json', onProgress).then((json) => { content.setGrammar(json); return content.grammar; });
  return loading.g;
}

async function fetchJSON(url, onProgress) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  if (!onProgress || !res.body || !res.headers.get('content-length')) return res.json();
  const total = +res.headers.get('content-length');
  const reader = res.body.getReader();
  const chunks = [];
  let got = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    got += value.length;
    onProgress(Math.min(1, got / total));
  }
  const all = new Uint8Array(got);
  let o = 0;
  for (const c of chunks) { all.set(c, o); o += c.length; }
  return JSON.parse(new TextDecoder().decode(all));
}
