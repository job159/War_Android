// Core logic checks (no browser): question generation, SRS, battle smoke test.
//   node tools/test-core.mjs
import fs from 'node:fs';
import { content } from '../game/src/core/quiz/content.js';
import { QuestionDeck, vocabQuestion, questionFor } from '../game/src/core/quiz/gen.js';
import { record, dueItems, counts } from '../game/src/core/quiz/srs.js';
import { makeRng } from '../game/src/core/rng.js';

let fails = 0;
const check = (cond, msg) => { if (!cond) { fails++; console.log('FAIL', msg); } };

content.addBook('c', JSON.parse(fs.readFileSync('game/data/vocab_ceec.json', 'utf8')));
content.addBook('t', JSON.parse(fs.readFileSync('game/data/vocab_toeic.json', 'utf8')));
content.setGrammar(JSON.parse(fs.readFileSync('game/data/grammar.json', 'utf8')));

function validQ(q, tag) {
  check(q && Array.isArray(q.options) && (q.options.length === 4 || (q.kind === 'grammar' && q.options.length >= 2)), `${tag}: needs 4 options ${q && JSON.stringify(q.options)}`);
  if (!q) return;
  check(new Set(q.options.map((o) => o.toLowerCase())).size === q.options.length, `${tag}: duplicate options ${JSON.stringify(q.options)}`);
  check(q.answer >= 0 && q.answer < q.options.length, `${tag}: bad answer index`);
  if (q.type === 'cloze' || q.type === 'passage' || (q.type === 'gram' && !q.item.startsWith('g:L:'))) check(/_{2,}/.test(q.sentence), `${tag}: no blank in "${q.sentence}"`);
}

// every vocab question type across a sample of both books
const rng = makeRng(42);
const stats = {};
for (const b of ['c', 't']) {
  const words = content.books[b].words;
  for (let i = 0; i < words.length; i += 7) {
    for (const type of ['w2m', 'm2w', 'cloze', 'listen', 'syn', 'ant']) {
      const q = vocabQuestion(words[i], type, rng);
      stats[type] = stats[type] || { ok: 0, none: 0 };
      if (q) { stats[type].ok++; validQ(q, `${b}:${words[i].w}:${type}`); } else stats[type].none++;
    }
  }
}
console.log('vocab types:', JSON.stringify(stats));
check(stats.w2m.none < 5, 'w2m should almost always work');
check(stats.cloze.ok > stats.cloze.none * 4, 'cloze should usually work');

// grammar bank and cloze blanks
let g = 0;
for (const it of content.grammar.bank.slice(0, 3200)) { const q = questionFor('g:' + it.id, rng); validQ(q, 'g:' + it.id); g++; }
let z = 0, zl = 0;
for (const b of content.grammar.clozeBlanks) { const q = questionFor(b.item, rng); if (b.long) { zl++; continue; } validQ(q, b.item); z++; }
console.log(`grammar ok: ${g}, cloze blanks ok: ${z} (skipped long ${zl})`);

// a deck with SRS state
const learn = { srs: {}, mistakes: {} };
const deck = new QuestionDeck({ books: ['c'], levels: [1], glv: 1, grammarShare: 0.25, learn, seed: 7 });
const seen = new Set();
for (let i = 0; i < 80; i++) {
  const q = deck.next();
  validQ(q, 'deck#' + i);
  check(!seen.has(q.item), 'deck repeated ' + q.item);
  seen.add(q.item);
  record(learn, q.item, i % 3 !== 0, Date.now() - 3600e3 * 48);
}
console.log('srs after deck:', JSON.stringify(counts(learn)), 'due now:', dueItems(learn).length, 'mistakes:', Object.keys(learn.mistakes).length);
const review = new QuestionDeck({ books: ['c'], levels: [1], glv: 1, learn, seed: 9, only: 'review' });
for (let i = 0; i < 10; i++) validQ(review.next(), 'review#' + i);

// pool mode determinism (PvP: both phones must agree)
const A = new QuestionDeck({ books: ['c'], levels: [3, 4], glv: 2, grammarShare: 0.3, seed: 123, pool: true });
const B = new QuestionDeck({ books: ['c'], levels: [3, 4], glv: 2, grammarShare: 0.3, seed: 123, pool: true });
for (let i = 0; i < 40; i++) {
  const a = A.next(), b = B.next();
  check(a.item === b.item && a.answer === b.answer && a.options.join() === b.options.join(), 'pool decks diverged at ' + i);
}

// sample output
const s = new QuestionDeck({ books: ['c'], levels: [4], glv: 2, grammarShare: 0.4, seed: 3, pool: true });
for (let i = 0; i < 6; i++) { const q = s.next(); console.log(`[${q.type}] ${q.main || ''} ${q.sentence || ''} | ${q.options.join(' / ')} | ✓${q.options[q.answer]}`); }

console.log(fails ? `\n${fails} FAILED` : '\nall core checks passed');
process.exit(fails ? 1 : 0);
