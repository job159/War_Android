// 文法講堂: 8 categories x 44 lessons from the Grammar repo, rendered as rich lesson pages
// (hook, diagram, formulas, signal words, examples with TTS, tips, pitfalls, Q&A, recap, quiz).
import { register, go, toast } from '../app.js';
import { bindActions, esc } from '../dom.js';
import { icon } from '../../art/icons.js';
import { heroImageURL } from '../../art/hero.js';
import { HERO_MAP } from '../../core/data/heroes.js';
import { S, changed, grant } from '../../core/state.js';
import { content } from '../../core/quiz/content.js';
import { track } from '../../core/missions.js';
import { speak, sfx } from '../sound.js';
import { setBgTheme } from '../../fx/bg.js';

const safeB = (s) => esc(s).replace(/&lt;(\/?)b&gt;/g, '<$1b>');

register({
  id: 'lessons', tab: 'study', title: '文法講堂',
  mount(el) {
    setBgTheme('study');
    const render = () => {
      const g = content.grammar;
      const read = new Set(S.d.learn.lessonsRead);
      el.innerHTML = `<div class="pad">${g.cats.map((c) => {
        const ls = g.lessons.filter((l) => l.cat === c.id);
        const done = ls.filter((l) => read.has(l.id)).length;
        return `<div class="ls-cat" style="--c1:${c.c1};--c2:${c.c2}"><div class="lc-head"><span class="lc-ic">${c.icon}</span><div class="grow"><b>${esc(c.name)}</b> <span class="en-title" style="font-size:10px">${esc(c.en)}</span><div class="dim">${esc(c.desc)}</div></div><span class="lc-n">${done}/${ls.length}</span></div>
<div class="lc-list">${ls.map((l) => `<button class="ls-item ${read.has(l.id) ? 'read' : ''}" data-act="open" data-id="${l.id}"><span class="ls-lv lv${l.lv}">${esc(l.level)}</span><div class="grow"><b>${esc(l.title)}</b><small>${esc(l.en)}</small></div>${read.has(l.id) ? icon('check') : '<span class="ls-new">+30💎</span>'}</button>`).join('')}</div></div>`;
      }).join('')}</div>`;
    };
    render();
    bindActions(el, { open: (b) => go('lesson', { id: b.dataset.id }) });
    return { refresh: render };
  },
});

function visualHTML(v) {
  if (!v) return '';
  let inner = '';
  if (v.type === 'table') {
    inner = `<div class="lv-table"><table><thead><tr>${v.head.map((x) => `<th>${safeB(x)}</th>`).join('')}</tr></thead><tbody>${v.rows.map((r) => `<tr>${r.map((x) => `<td>${safeB(x)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  } else if (v.type === 'flow') {
    inner = `<div class="lv-flow">${v.steps.map((s, i) => `<div class="lf-step"><span class="lf-n">${i + 1}</span><div><b>${safeB(s.t)}</b><div class="dim">${safeB(s.d)}</div></div></div>`).join('<div class="lf-arrow">▼</div>')}</div>`;
  } else if (v.type === 'timeline') {
    const rows = Math.max(...v.items.map((it) => it.row)) + 1;
    const H = 30 + rows * 44;
    let svg = `<line x1="5" y1="${H - 14}" x2="95" y2="${H - 14}" stroke="#9a8ac8" stroke-width=".6"/><text x="50" y="${H - 3}" fill="#9a8ac8" font-size="4" text-anchor="middle">現在 NOW</text><line x1="50" y1="6" x2="50" y2="${H - 12}" stroke="#ffd84a" stroke-width=".4" stroke-dasharray="1.5 1.5"/>`;
    for (const it of v.items) {
      const y = 16 + it.row * 44;
      if (it.kind === 'dots') for (let x = it.from; x <= it.to; x += it.step || 10) svg += `<circle cx="${x}" cy="${y}" r="2" fill="${it.color}"/>`;
      else if (it.kind === 'bar') svg += `<rect x="${it.from}" y="${y - 3}" width="${Math.max(1, it.to - it.from)}" height="6" rx="3" fill="${it.color}"/>`;
      else if (it.kind === 'point' || it.kind === 'dot') svg += `<circle cx="${it.at ?? it.from}" cy="${y}" r="3" fill="${it.color}"/>`;
      else if (it.kind === 'arrow') svg += `<line x1="${it.from}" y1="${y}" x2="${it.to}" y2="${y}" stroke="${it.color}" stroke-width="1.4"/><circle cx="${it.to}" cy="${y}" r="1.6" fill="${it.color}"/>`;
      svg += `<text x="${it.lx ?? it.from}" y="${y + 12}" fill="#e8e0ff" font-size="4">${esc(it.label || '')}</text>`;
    }
    inner = `<svg class="lv-time" viewBox="0 0 100 ${H}">${svg}</svg>`;
  }
  return `<div class="panel lv"><b>${esc(v.title || '圖解')}</b>${inner}${v.note ? `<div class="dim lv-note">${safeB(v.note)}</div>` : ''}</div>`;
}

register({
  id: 'lesson', tab: 'study', title: (p) => { const l = content.lesson(p.id); return l ? l.title : '課程'; },
  mount(el, p) {
    setBgTheme('study');
    const L = content.lesson(p.id);
    const cat = content.grammar.cats.find((c) => c.id === L.cat);
    const read = S.d.learn.lessonsRead.includes(L.id);
    el.innerHTML = `<div class="lesson" style="--c1:${cat.c1};--c2:${cat.c2}">
<div class="lsn-head"><small>${cat.icon} ${esc(cat.name)} · ${esc(L.level)}</small><h2>${esc(L.title)}</h2><div class="en-title">${esc(L.en)}</div><p>${esc(L.summary)}</p></div>
<div class="pad">
${L.hook ? `<div class="panel lsn-hook"><img class="lsn-teacher" src="${heroImageURL(HERO_MAP.rune, { crop: 'face' })}" alt=""><div><b class="lsn-tname">露恩老師</b>${esc(L.hook)}</div></div>` : ''}
${visualHTML(L.visual)}
<div class="sec-title">公式結構</div>
<div class="lsn-forms">${L.structure.map((s) => `<div class="lf tone-${s.tone || 'a'}"><small>${esc(s.label)}</small><b>${esc(s.formula)}</b></div>`).join('')}</div>
${L.keywords.length ? `<div class="sec-title">關鍵訊號字</div><div class="row wrap" style="gap:6px">${L.keywords.map((k) => `<span class="chip">${esc(k)}</span>`).join('')}</div>` : ''}
<div class="sec-title">例句拆解</div>
<div class="panel">${L.examples.map((x) => `<div class="lsn-ex"><div class="row"><div class="grow en">${esc(x.en)}</div><button class="mini-say" data-act="say" data-t="${esc(x.en)}">${icon('speaker')}</button></div><div class="dim">${esc(x.zh)}</div>${x.note ? `<div class="lsn-note">💡 ${esc(x.note)}</div>` : ''}</div>`).join('')}</div>
<div class="sec-title">考點提示</div>
<div class="panel"><ul class="lsn-tips">${L.tips.map((t) => `<li>${esc(t)}</li>`).join('')}</ul></div>
${L.pitfalls.length ? `<div class="sec-title">常見錯誤</div><div class="panel">${L.pitfalls.map((x) => `<div class="lsn-pit"><div class="wrong">✗ ${esc(x.wrong)}</div><div class="right">✓ ${esc(x.right)}</div><div class="dim">${esc(x.why)}</div></div>`).join('')}</div>` : ''}
${L.faq.length ? `<div class="sec-title">師生問答</div><div class="panel">${L.faq.map((f) => `<details class="lsn-faq"><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('')}</div>` : ''}
${L.recap.length ? `<div class="sec-title">考前 30 秒</div><div class="panel ornate"><ol class="lsn-recap">${L.recap.map((r) => `<li>${esc(r)}</li>`).join('')}</ol></div>` : ''}
<div class="lsn-end">
<button class="btn primary big block" data-act="done">${read ? '已讀過 · 再次完成' : '完成閱讀（+30 魔晶石）'}</button>
${L.quiz.length ? `<button class="btn blue block" data-act="quiz">隨堂測驗（${L.quiz.length} 題）</button>` : ''}
</div></div></div>`;
    bindActions(el, {
      say: (b) => speak(b.dataset.t, { force: true }),
      done: () => {
        const d = S.d;
        if (!d.learn.lessonsRead.includes(L.id)) {
          d.learn.lessonsRead.push(L.id);
          grant({ gems: 30, gold: 1000 });
          toast('完成閱讀！魔晶石 +30、金幣 +1,000', 'gold');
          sfx('reward');
        } else toast('複習完成！');
        track('lesson', 1);
        changed('lesson');
        if (L.quiz.length) go('quiz', { title: `隨堂測驗：${L.title}`, mode: 'lesson', items: L.quiz.map((_, i) => `g:L:${L.id}:${i}`), reward: (s) => ({ gold: s.correct * 100 }) });
      },
      quiz: () => go('quiz', { title: `隨堂測驗：${L.title}`, mode: 'lesson', items: L.quiz.map((_, i) => `g:L:${L.id}:${i}`), reward: (s) => ({ gold: s.correct * 100 }) }),
    });
    return {};
  },
});
