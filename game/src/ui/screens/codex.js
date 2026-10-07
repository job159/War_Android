// 單字圖鑑 Word codex: browse both books by level / mastery, search, and full word cards (TTS).
import { register, modal, toast } from '../app.js';
import { bindActions, esc, h } from '../dom.js';
import { icon } from '../../art/icons.js';
import { S } from '../../core/state.js';
import { content, BOOKS, loadBook } from '../../core/quiz/content.js';
import { boxOf, MASTER_BOX, LEARNED_BOX } from '../../core/quiz/srs.js';
import { bookList } from '../battleSetup.js';
import { speak } from '../sound.js';
import { setBgTheme } from '../../fx/bg.js';

const PAGE = 60;
const BOX_ZH = ['新', '初識', '學習中', '學習中', '熟悉', '掌握', '精通'];

const view = { book: null, lv: 0, filter: 'all', q: '' };

export function wordModal(id) {
  const w = content.item(id);
  if (!w) return;
  const box = boxOf(S.d.learn, id);
  const r = S.d.learn.srs[id];
  const sect = (title, inner) => (inner ? `<div class="wd-sec"><div class="wd-h">${title}</div>${inner}</div>` : '');
  const body = h(`<div class="wd">
<div class="row"><div class="wd-word en-title">${esc(w.w)}</div><button class="btn small" data-say="${esc(w.w)}">${icon('speaker')}</button></div>
<div class="wd-ph">${esc(w.ph || '')}　<b>${esc(w.p)}</b>　<span class="chip">${BOOKS[w.book].zh} ${BOOKS[w.book].levels[w.l]}</span>${w.t ? ` <span class="chip">${esc(w.t)}</span>` : ''}</div>
<div class="wd-m">${esc(w.m)}</div>
${w.d ? `<div class="wd-d">${esc(w.d)}</div>` : ''}
${sect('例句', (w.x || []).map(([en, zh]) => `<div class="wd-ex"><div>${esc(en)} <button class="mini-say" data-say="${esc(en)}">${icon('speaker')}</button></div><small>${esc(zh)}</small></div>`).join(''))}
${sect('常見搭配', (w.k || []).map((k) => `<span class="chip">${esc(k)}</span>`).join(' '))}
${sect('同義 ≈', (w.s || []).map((k) => `<span class="chip">${esc(k)}</span>`).join(' '))}
${sect('反義 ⇄', (w.a || []).map((k) => `<span class="chip">${esc(k)}</span>`).join(' '))}
${sect('詞形變化', (w.f || []).map(([fw, fp, fz]) => `<div class="wd-fam"><b>${esc(fw)}</b> <span class="dim">${esc(fp)}</span> ${esc(fz)}</div>`).join(''))}
${sect('易混淆字', (w.c || []).map(([cw, cz]) => `<div class="wd-fam"><b>${esc(cw)}</b> ${esc(cz)}</div>`).join(''))}
<div class="wd-srs">${box < 0 ? '尚未學習' : `熟練度：${BOX_ZH[box] || '精通'}（答對 ${r[2]}・答錯 ${r[3]}）`}</div>
</div>`);
  body.addEventListener('click', (e) => { const b = e.target.closest('[data-say]'); if (b) speak(b.dataset.say, { force: true }); });
  modal({ title: '單字卡', body, cls: 'wide' });
  speak(w.w);
}

register({
  id: 'codex', tab: 'study', title: '單字圖鑑',
  mount(el) {
    setBgTheme('study');
    if (!view.book || !bookList().includes(view.book)) view.book = bookList()[0];
    let shown = PAGE;
    const filtered = () => {
      const bk = content.books[view.book];
      if (!bk) return [];
      const q = view.q.trim().toLowerCase();
      return bk.words.filter((w) => {
        if (view.lv && w.l !== view.lv) return false;
        if (q && !w.w.toLowerCase().includes(q) && !w.m.includes(q)) return false;
        if (view.filter !== 'all') {
          const b = boxOf(S.d.learn, w.id);
          if (view.filter === 'mastered' && b < MASTER_BOX) return false;
          if (view.filter === 'learning' && (b < 0 || b >= MASTER_BOX)) return false;
          if (view.filter === 'new' && b >= 0) return false;
          if (view.filter === 'mistakes' && !S.d.learn.mistakes[w.id]) return false;
        }
        return true;
      });
    };
    const render = () => {
      const bk = content.books[view.book];
      if (!bk) {
        el.innerHTML = '<div class="pad"><div class="panel center">讀取單字書中…</div></div>';
        loadBook(view.book).then(render).catch(() => toast('讀取失敗', 'bad'));
        return;
      }
      const list = filtered();
      const levels = BOOKS[view.book].levels;
      const lvCount = (lv) => {
        const ws = bk.byLevel[lv] || [];
        let m = 0;
        for (const w of ws) if (boxOf(S.d.learn, w.id) >= MASTER_BOX) m++;
        return `${m}/${ws.length}`;
      };
      el.innerHTML = `<div class="pad codex">
<div class="tabs">${['c', 't'].map((b) => `<button class="tab-b ${view.book === b ? 'on' : ''}" data-act="book" data-b="${b}">${BOOKS[b].zh}</button>`).join('')}</div>
<input class="inp" placeholder="搜尋單字或中文意思…" value="${esc(view.q)}" data-search>
<div class="tabs">${[0, 1, 2, 3, 4, 5, 6].map((lv) => `<button class="tab-b ${view.lv === lv ? 'on' : ''}" data-act="lv" data-lv="${lv}">${lv ? `${levels[lv]}<small> ${lvCount(lv)}</small>` : '全部'}</button>`).join('')}</div>
<div class="tabs" style="margin-top:6px">${[['all', '全部'], ['new', '未學'], ['learning', '學習中'], ['mastered', '已掌握'], ['mistakes', '錯題']].map(([k, z]) => `<button class="tab-b ${view.filter === k ? 'on' : ''}" data-act="filter" data-f="${k}">${z}</button>`).join('')}</div>
<div class="dim" style="margin:8px 2px">${list.length} 個單字</div>
<div class="wlist">${list.slice(0, shown).map((w) => {
        const b = boxOf(S.d.learn, w.id);
        return `<div class="wrow" data-act="word" data-id="${esc(w.id)}"><span class="wb b${Math.max(-1, b)}">${b < 0 ? '' : b >= MASTER_BOX ? '★' : b >= LEARNED_BOX ? '◐' : '○'}</span><div class="grow"><b>${esc(w.w)}</b> <span class="dim">${esc(w.p)}</span><div class="wm">${esc(w.m)}</div></div><button class="mini-say" data-act="say" data-w="${esc(w.w)}">${icon('speaker')}</button></div>`;
      }).join('')}</div>
${list.length > shown ? '<button class="btn block" data-act="more">載入更多</button>' : ''}
</div>`;
    };
    render();
    bindActions(el, {
      book: (b) => { view.book = b.dataset.b; view.lv = 0; shown = PAGE; render(); },
      lv: (b) => { view.lv = +b.dataset.lv; shown = PAGE; render(); },
      filter: (b) => { view.filter = b.dataset.f; shown = PAGE; render(); },
      more: () => { shown += PAGE * 2; render(); },
      word: (b, e) => { if (e.target.closest('[data-act="say"]')) return; wordModal(b.dataset.id); },
      say: (b) => speak(b.dataset.w, { force: true }),
    });
    let t = 0;
    el.addEventListener('input', (e) => {
      if (!e.target.matches('[data-search]')) return;
      view.q = e.target.value;
      clearTimeout(t);
      t = setTimeout(() => {
        shown = PAGE;
        const pos = e.target.selectionStart;
        render();
        const inp = el.querySelector('[data-search]');
        inp.focus();
        try { inp.setSelectionRange(pos, pos); } catch { /* ignore */ }
      }, 250);
    });
    return {};
  },
});
