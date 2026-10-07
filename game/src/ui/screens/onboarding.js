// First launch: story intro, name, and which vocabulary book to study.
import { h, $, sleep } from '../dom.js';
import { heroImageURL } from '../../art/hero.js';
import { HERO_MAP } from '../../core/data/heroes.js';
import { S, changed, saveNow } from '../../core/state.js';
import { loadBook } from '../../core/quiz/content.js';
import { speak, sfx } from '../sound.js';
import { pushBack } from '../app.js';

const STORY = [
  ['在萊克西卡大陸，萬物都由「詞」構成。', 'In the land of Lexica, everything is made of words.'],
  ['巴別之塔崩塌後，緘默女王帶來了吞噬詞義的噬詞獸。', 'When the Tower of Babel fell, the Silent Queen unleashed the word-eaters.'],
  ['唯有「契約者」——能說出正確詞語的人——才能喚醒詞靈的力量。', 'Only a Covenanter, who speaks the right words, can awaken the spirits.'],
  ['……而你，就是新的契約者。', '...And you are the new Covenanter.'],
];

export function runOnboarding() {
  return new Promise((resolve) => {
    const guide = HERO_MAP.rune;
    const ov = h(`<div class="onb"><div class="onb-guide"><img src="${heroImageURL(guide)}"></div><div class="onb-box panel ornate"></div></div>`);
    $('#overlay').appendChild(ov);
    const box = ov.querySelector('.onb-box');
    const popBack = pushBack(() => {}); // Back does nothing until the covenant is sealed
    let step = 0;

    const storyStep = (i) => {
      const [zh, en] = STORY[i];
      box.innerHTML = `<div class="onb-name">${guide.zh} · 符文學者</div><p class="onb-zh">${zh}</p><p class="onb-en">${en}</p><button class="btn primary block" data-next>${i < STORY.length - 1 ? '繼續' : '締結契約'}</button>`;
      speak(en);
      box.querySelector('[data-next]').onclick = () => { sfx('tap'); i + 1 < STORY.length ? storyStep(i + 1) : nameStep(); };
    };

    const nameStep = () => {
      box.innerHTML = `<div class="onb-name">${guide.zh}</div><p class="onb-zh">請告訴我，契約者的名字是？</p>
<input class="inp" maxlength="12" placeholder="輸入你的名字" value="">
<button class="btn primary block" data-next>就是這個名字</button>`;
      const inp = box.querySelector('input');
      setTimeout(() => inp.focus(), 100);
      box.querySelector('[data-next]').onclick = () => {
        const name = inp.value.trim() || '契約者';
        S.d.profile.name = Array.from(name).slice(0, 12).join('');
        sfx('tap');
        bookStep();
      };
    };

    const bookStep = () => {
      box.innerHTML = `<div class="onb-name">${guide.zh}</div><p class="onb-zh">${S.d.profile.name}，你想用哪一本「詞之書」締結契約？<br><span class="dim">之後可以在設定中隨時更換</span></p>
<div class="book-pick">
<button class="book-b" data-book="c"><b>學測 4000</b><span>國高中 · Level 1–6<br>4,353 字</span></button>
<button class="book-b" data-book="t"><b>多益 3000</b><span>職場商務 · 350+～900+<br>3,000 字</span></button>
<button class="book-b" data-book="both"><b>兩本都要</b><span>混合出題<br>7,353 字</span></button>
</div>`;
      box.querySelectorAll('[data-book]').forEach((b) => {
        b.onclick = async () => {
          sfx('tap');
          const book = b.dataset.book;
          S.d.learn.book = book;
          box.innerHTML = '<p class="onb-zh center">締結契約中…</p>';
          try {
            if (book === 't' || book === 'both') await loadBook('t');
            if (book === 'c' || book === 'both') await loadBook('c');
          } catch (e) {
            console.error(e);
          }
          finish();
        };
      });
    };

    const finish = async () => {
      S.d.profile.onboarded = true;
      saveNow();
      changed('all');
      box.innerHTML = `<p class="onb-zh center">契約成立！<br>先到「商城 → 召喚之間」召喚你的第一批詞靈吧——<br><b class="gold-text">首次十連召喚必定獲得 SSR！</b></p>`;
      speak('The covenant is sealed. Let us begin!');
      sfx('reward');
      await sleep(2200);
      ov.classList.add('out');
      setTimeout(() => ov.remove(), 400);
      popBack();
      resolve();
    };

    void step;
    storyStep(0);
  });
}
