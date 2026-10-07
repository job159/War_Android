// 學習 Study hub: daily SRS review, mistake book, word codex, grammar lessons, mock exams.
import { register, go, modal, toast } from '../app.js';
import { bindActions, esc } from '../dom.js';
import { icon } from '../../art/icons.js';
import { S, studyStreak } from '../../core/state.js';
import { content, BOOKS, loadBook } from '../../core/quiz/content.js';
import { dueItems, mistakeItems, counts } from '../../core/quiz/srs.js';
import { track } from '../../core/missions.js';
import { bar } from '../widgets.js';
import { fmt } from '../../core/util.js';
import { setBgTheme } from '../../fx/bg.js';
import { bookList } from '../battleSetup.js';
import { sfx } from '../sound.js';
import { wordModal } from './codex.js';

const playerTier = () => Math.min(6, 1 + Math.floor(S.d.profile.level / 16));

export const EXAMS = {
  vocab: { zh: '詞彙測驗', en: 'Vocabulary Test', desc: '25 題單字（依你的等級）· 8 分鐘', count: 25, time: 480, deck: () => ({ books: bookList(), levels: [playerTier(), Math.max(1, playerTier() - 1), Math.min(6, playerTier() + 1)], glv: 1, grammarShare: 0, only: 'vocab', pool: true }) },
  part5: { zh: '多益 Part 5 文法', en: 'TOEIC Part 5', desc: '20 題句子填空 · 8 分鐘', count: 20, time: 480, deck: () => ({ books: bookList(), levels: [1], glv: Math.min(3, 1 + Math.floor(S.d.profile.level / 25)), grammarShare: 1, only: 'grammar', pool: true }) },
  mixed: { zh: '學測綜合模擬', en: 'GSAT Mock Exam', desc: '30 題單字＋文法＋克漏字 · 12 分鐘', count: 30, time: 720, deck: () => ({ books: bookList(), levels: [playerTier(), Math.min(6, playerTier() + 1)], glv: Math.min(3, 2 + Math.floor(S.d.profile.level / 40)), grammarShare: 0.45, pool: true }) },
};

/** Exam rewards: the main "English exam = gold" faucet. */
export function examReward(id, summary) {
  const pl = S.d.profile.level;
  const sc = summary.score;
  const best = S.d.learn.examBest[id] || 0;
  const bundle = { gold: Math.round(sc * (60 + pl * 12)) };
  if (sc >= 60) bundle.gems = Math.round((sc - 50) * 1.2);
  if (sc >= 90) bundle.expM = 2;
  if (sc === 100) bundle.ticket = 1;
  if (sc > best) S.d.learn.examBest[id] = sc;
  track('lesson', 1);
  return bundle;
}

export function startExam(id) {
  const E = EXAMS[id];
  go('quiz', { title: E.zh, mode: 'exam', count: E.count, timeLimit: E.time, deck: E.deck(), best: S.d.learn.examBest[id] || 0, reward: (s) => examReward(id, s), again: () => null });
}

export function startReview(kind) {
  const d = S.d;
  if (kind === 'review') {
    const due = dueItems(d.learn).filter((k) => content.item(k));
    if (!due.length) { toast('目前沒有到期的複習，去冒險學新單字吧！'); return; }
    go('quiz', { title: '每日複習', mode: 'review', items: due, count: Math.min(20, due.length), reward: (s) => ({ gold: s.correct * 60, gems: s.correct >= 10 ? 30 : 10 }), again: null });
  } else {
    const m = mistakeItems(d.learn).filter((k) => content.item(k));
    if (!m.length) { toast('錯題本是空的，太棒了！'); return; }
    go('quiz', { title: '錯題重練', mode: 'mistakes', items: m, count: Math.min(15, m.length), reward: (s) => ({ gold: s.correct * 80, gems: s.correct >= 8 ? 30 : 10 }) });
  }
}

register({
  id: 'study', tab: 'study', title: '學習',
  mount(el) {
    setBgTheme('study');
    const render = () => {
      const d = S.d;
      const books = bookList();
      const due = dueItems(d.learn).length;
      const mist = mistakeItems(d.learn).length;
      const cards = books.map((b) => {
        const bk = content.books[b];
        const c = counts(d.learn, b + ':');
        const total = bk ? bk.count : 0;
        return `<div class="bk-stat"><b>${BOOKS[b].zh}</b><div class="row"><div class="grow">${bar(total ? c.mastered / total : 0, 'green')}</div><span class="dim">${c.mastered}/${total}</span></div><div class="dim">掌握 ${c.mastered}・學習中 ${c.learned}・見過 ${c.seen}</div></div>`;
      }).join('');
      const nextMs = (Math.floor(counts(d.learn).mastered / 25) + 1) * 25;
      el.innerHTML = `<div class="pad">
<div class="panel ornate study-head"><div class="row"><div class="sh-streak">${icon('flame')}<b>${studyStreak()}</b><small>天連續學習</small></div><div class="grow">${cards}</div></div>
<div class="dim" style="margin-top:6px">下一個里程碑：掌握 ${nextMs} 字 → 魔晶石獎勵（每 25 字一次）</div></div>
<div class="study-grid">
  <button class="st-card c1" data-act="review">${icon('refresh')}<b>每日複習</b><span>${due} 題到期</span>${due ? '<i class="dot"></i>' : ''}</button>
  <button class="st-card c2" data-act="mistakes">${icon('bookmark')}<b>錯題本</b><span>${mist} 題待訂正</span></button>
  <button class="st-card c3" data-act="codex">${icon('codex')}<b>單字圖鑑</b><span>收集 ${fmt(counts(d.learn).seen)} 字</span></button>
  <button class="st-card c4" data-act="lessons">${icon('study')}<b>文法講堂</b><span>已讀 ${d.learn.lessonsRead.length}/44 課</span></button>
</div>
<div class="sec-title">模擬考 <span class="more">考試成績換金幣與魔晶石</span></div>
${Object.entries(EXAMS).map(([id, E]) => `<button class="exam-row" data-act="exam" data-id="${id}"><div class="ex-ic">${icon('scroll')}</div><div class="grow"><b>${E.zh}</b><div class="dim">${E.desc}</div></div><div class="ex-best"><small>最佳</small><b>${d.learn.examBest[id] || '-'}</b></div></button>`).join('')}
<div class="sec-title">自由練習</div>
<div class="row wrap" style="gap:8px">${[['w2m', '看英選中'], ['m2w', '看中選英'], ['cloze', '例句克漏字'], ['listen', '聽音選字'], ['syn', '同義字'], ['gram', '文法題']].map(([t, z]) => `<button class="btn small" data-act="practice" data-t="${t}">${z}</button>`).join('')}</div>
<div class="sec-title">學習設定</div>
<button class="panel row team-row" data-act="settings"><div class="grow"><b>目前單字書：${books.map((b) => BOOKS[b].zh).join(' ＋ ')}</b><div class="dim">可在設定中切換 學測 / 多益 / 兩本</div></div>${icon('settings')}</button>
</div>`;
    };
    render();
    bindActions(el, {
      review: () => startReview('review'),
      mistakes: () => go('mistakes'),
      codex: () => go('codex'),
      lessons: () => go('lessons'),
      exam: (b) => {
        const E = EXAMS[b.dataset.id];
        modal({ title: E.zh, body: `<div class="center"><p>${E.desc}</p><p class="dim">分數越高，金幣越多。60 分以上加贈魔晶石，滿分再送召喚券！<br>最佳成績：${S.d.learn.examBest[b.dataset.id] || '尚無'}</p></div>`, buttons: [{ label: '取消', value: 0 }, { label: '開始考試', cls: 'primary', value: 1 }] }).then((v) => { if (v) startExam(b.dataset.id); });
      },
      practice: (b) => {
        const t = b.dataset.t;
        const deck = t === 'gram' ? { books: bookList(), levels: [1], glv: Math.min(3, 1 + Math.floor(S.d.profile.level / 25)), grammarShare: 1, only: 'grammar' } : { books: bookList(), levels: [playerTier()], glv: 1, grammarShare: 0, only: 'vocab' };
        if (t !== 'gram') deck.types = [t];
        go('quiz', { title: '自由練習', mode: 'practice', count: 10, deck: { ...deck }, typeOverride: t === 'gram' ? null : t, reward: (s) => ({ gold: s.correct * 40 }), again: null });
      },
      settings: () => go('settings'),
    });
    return { refresh: render };
  },
});

// ------------------------------------------------------------------ mistake book
register({
  id: 'mistakes', tab: 'study', title: '錯題本',
  mount(el) {
    const render = () => {
      const list = mistakeItems(S.d.learn).map((k) => ({ k, n: S.d.learn.mistakes[k], it: content.item(k) })).filter((x) => x.it);
      el.innerHTML = `<div class="pad"><button class="btn primary block" data-act="drill" ${list.length ? '' : 'disabled'}>重練錯題（${list.length}）</button>
<p class="dim center">答錯一次 +1，答對一次 −1，歸零自動移出。</p>
<div class="panel">${list.length ? list.slice(0, 200).map((x) => {
        const it = x.it;
        const isWord = x.k[0] === 'c' || x.k[0] === 't';
        const title = isWord ? `<b class="en-title">${esc(it.w)}</b> <span class="dim">${esc(it.p)}</span> ${esc(it.m)}` : `<span>${esc((it.q || (it.passage && it.passage.title) || '').slice(0, 60))}</span>`;
        return `<div class="mk-row" ${isWord ? `data-act="word" data-k="${esc(x.k)}"` : ''}><span class="mk-n">✕${x.n}</span><div class="grow">${title}</div></div>`;
      }).join('') : '<div class="empty">錯題本是空的！</div>'}</div></div>`;
    };
    render();
    bindActions(el, {
      drill: () => startReview('mistakes'),
      word: (b) => wordModal(b.dataset.k),
    });
    return { refresh: render };
  },
});

export { loadBook };
