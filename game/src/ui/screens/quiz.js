// Calm quiz runner (no battle): daily review, mistake drills, lesson quizzes and timed mock exams.
// params: { title, items? (fixed item ids) | deck (QuestionDeck options), count, timeLimit (s, exam),
//           mode: 'review'|'mistakes'|'practice'|'lesson'|'exam'|'sweep', reward(summary) -> bundle,
//           grantRewards(summary) -> granted reward list (instead of reward), endNote(summary) -> text, onFinish(summary) }
import { register, replace, back, modal, pop } from '../app.js';
import { h, esc, bindActions } from '../dom.js';
import { icon } from '../../art/icons.js';
import { QuestionDeck, questionFor, speedTier } from '../../core/quiz/gen.js';
import { record } from '../../core/quiz/srs.js';
import { S, changed, grant, markStudyDay } from '../../core/state.js';
import { track } from '../../core/missions.js';
import { makeRng, randomSeed } from '../../core/rng.js';
import { rewardList, bar } from '../widgets.js';
import { speak, sfx, stopSpeak } from '../sound.js';
import { msToClock } from '../../core/util.js';
import { setBgTheme } from '../../fx/bg.js';

register({
  id: 'quiz', tab: 'study', title: (p) => p.title || '練習',
  mount(el, p) {
    setBgTheme('study');
    const rng = makeRng(randomSeed());
    const learn = S.d.learn;
    const total = p.items ? Math.min(p.count || p.items.length, p.items.length) : p.count || 10;
    const deck = p.items ? null : new QuestionDeck({ ...p.deck, learn, seed: randomSeed(), listen: S.d.settings.listen });
    const items = p.items ? p.items.slice(0, total) : null;
    let i = 0, correct = 0, combo = 0, maxCombo = 0;
    let q = null, shown = 0, locked = false;
    const results = [];
    const start = Date.now();
    let timer = 0;

    const nextQ = () => {
      if (i >= total) return finish();
      q = items ? questionFor(items[i], rng, { learn, listen: S.d.settings.listen }) : deck.next();
      if (!q) { i++; return nextQ(); }
      locked = false;
      shown = performance.now();
      render();
      if (q.speakOnShow && S.d.settings.tts) speak(q.speak);
    };

    const render = () => {
      const remain = p.timeLimit ? Math.max(0, p.timeLimit * 1000 - (Date.now() - start)) : 0;
      el.innerHTML = `<div class="qz">
<div class="qz-top"><div class="grow">${bar(i / total, 'blue')}</div><span class="qz-n">${i + 1}/${total}</span>${p.timeLimit ? `<span class="qz-time">${icon('calendar')}<b data-t>${msToClock(remain)}</b></span>` : `<span class="qz-combo">🔥${combo}</span>`}</div>
<div class="panel qz-card"><div class="q-label">${esc(q.label)}</div>
${q.sentence ? `<div class="q-sent">${esc(q.sentence).replace(/_{2,}/g, '<span class="blank">　　　</span>')}</div>` : `<div class="q-main ${/[一-鿿]/.test(q.main) ? 'zh' : ''}">${esc(q.main)}${q.speak && (q.speakOnShow || q.type === 'listen') ? `<button class="q-say" data-act="say">${icon('speaker')}</button>` : ''}</div>${q.sub ? `<div class="q-sub">${esc(q.sub)}</div>` : ''}`}
</div>
<div class="q-opts qz-opts n${q.options.length} ${q.options.some((o) => o.length > 22) ? 'long' : ''}">${q.options.map((o, k) => `<button class="q-opt" data-act="pick" data-k="${k}"><span>${esc(o)}</span></button>`).join('')}</div>
<div class="qz-fb"></div></div>`;
    };

    const answer = (k) => {
      if (locked) return;
      locked = true;
      const ok = k === q.answer;
      const ms = performance.now() - shown;
      record(learn, q.item, ok);
      if (markStudyDay()) track('studyDay', 1);
      S.d.stats.answered++;
      if (ok) { correct++; combo++; maxCombo = Math.max(maxCombo, combo); S.d.stats.correct++; track('correct', 1); } else combo = 0;
      if (p.mode === 'review' || p.mode === 'mistakes') track('review', 1);
      results.push({ q, ok, ms, tier: speedTier(ms, q.par) });
      const opts = el.querySelectorAll('.q-opt');
      opts[q.answer].classList.add('right');
      if (!ok) opts[k].classList.add('wrong');
      sfx(ok ? 'correct' : 'wrong');
      if (q.speak && S.d.settings.tts && (q.speakOnReveal || !ok)) speak(q.speak);
      const fb = el.querySelector('.qz-fb');
      const exam = p.mode === 'exam';
      if (exam && ok) { setTimeout(() => { i++; nextQ(); }, 350); return; }
      fb.innerHTML = `<div class="panel qz-explain ${ok ? 'ok' : 'ng'}"><b>${ok ? icon('check') + ' 正確！' : icon('close') + ' 正確答案：' + esc(q.options[q.answer])}</b>
${(q.reveal || []).map((r) => `<div class="qz-rev">${esc(r)}</div>`).join('')}${q.explain ? `<div class="qz-ex">${esc(q.explain)}</div>` : ''}
<div class="row" style="margin-top:8px">${q.speak ? `<button class="btn small" data-act="say">${icon('speaker')} 發音</button>` : ''}<button class="btn primary grow" data-act="next">${i + 1 >= total ? '查看結果' : '下一題'}</button></div></div>`;
      changed('quiz');
    };

    const finish = () => {
      clearInterval(timer);
      stopSpeak();
      const summary = { correct, total: results.length, maxCombo, results, score: results.length ? Math.round((correct / Math.max(total, 1)) * 100) : 0, ms: Date.now() - start };
      const bundle = p.reward ? p.reward(summary) : null;
      const got = p.grantRewards ? p.grantRewards(summary) : bundle ? grant(bundle) : [];
      if (p.onFinish) p.onFinish(summary);
      changed('quiz');
      const wrong = results.filter((r) => !r.ok);
      el.innerHTML = `<div class="pad qz-end">
<div class="panel ornate center"><div class="qz-score">${p.mode === 'exam' ? `${summary.score}<small>分</small>` : `${correct}<small>/${total}</small>`}</div>
<div class="dim">${p.mode === 'exam' ? `答對 ${correct}/${total}　用時 ${msToClock(summary.ms)}` : `最高連對 ${maxCombo}`}</div>
${p.mode === 'exam' && p.best != null ? `<div class="dim">最佳成績：${Math.max(p.best, summary.score)} 分</div>` : ''}${p.endNote ? `<div class="qz-note">${esc(p.endNote(summary))}</div>` : ''}</div>
${got.length ? `<div class="sec-title">獲得獎勵</div><div class="panel">${rewardList(got, { big: true })}</div>` : ''}
${wrong.length ? `<div class="sec-title">錯題複習</div><div class="panel">${wrong.map((r, k) => `<div class="rs-miss"><div class="row"><div class="grow"><div class="rm-q">${esc(r.q.main || r.q.sentence || '')}</div><div class="rm-a">✔ ${esc(r.q.options[r.q.answer])}</div></div>${r.q.speak ? `<button class="mini-say" data-act="sayw" data-k="${k}">${icon('speaker')}</button>` : ''}</div>${r.q.explain ? `<div class="rm-ex">${esc(r.q.explain)}</div>` : ''}</div>`).join('')}</div>` : ''}
<div class="rs-btns"><button class="btn" data-act="done">返回</button>${p.again ? '<button class="btn primary" data-act="again">再來一輪</button>' : ''}</div></div>`;
      sfx('reward');
      bindWrong = wrong;
    };
    let bindWrong = [];

    bindActions(el, {
      pick: (b) => answer(+b.dataset.k),
      next: () => { i++; nextQ(); },
      say: () => q && speak(q.speak, { force: true }),
      sayw: (b) => speak(bindWrong[+b.dataset.k].q.speak, { force: true }),
      done: () => back(),
      again: () => replace('quiz', p.again()),
    });
    if (p.timeLimit) {
      timer = setInterval(() => {
        const remain = p.timeLimit * 1000 - (Date.now() - start);
        const t = el.querySelector('[data-t]');
        if (t) t.textContent = msToClock(Math.max(0, remain));
        if (remain <= 0) { clearInterval(timer); finish(); }
      }, 500);
    }
    nextQ();
    if (__DEV__) window.__lxQuiz = { q: () => q };
    return {
      back: () => {
        if (i >= total || !results.length) return false;
        modal({ title: '離開練習？', body: '<p class="confirm-text">目前的作答紀錄已保存（錯題已加入錯題本），但本輪獎勵將不會發放。</p>', buttons: [{ label: '繼續作答', value: 0 }, { label: '離開', cls: 'red', value: 1 }] }).then((v) => { if (v) { clearInterval(timer); pop(); } });
        return true;
      },
      destroy: () => { clearInterval(timer); stopSpeak(); },
    };
    void h;
  },
});
