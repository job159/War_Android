// Title screen: painted hall, three random SSR spirits, the glowing logo and "tap to start".
// The tap is also the first user gesture, so the music starts exactly here.
import { h } from './dom.js';
import { heroImageURL } from '../art/hero.js';
import { heroArt, bgAsset } from '../art/assets.js';
import { HEROES } from '../core/data/heroes.js';
import { sfx, music } from './sound.js';
import { pushBack } from './app.js';

export function showTitle() {
  return new Promise((resolve) => {
    const painted = HEROES.filter((x) => x.rarity === 'SSR' && heroArt(x.id));
    const pick = [];
    while (pick.length < 3 && painted.length) pick.push(painted.splice(Math.floor(Math.random() * painted.length), 1)[0]);
    const bg = bgAsset('summon') || bgAsset('home');
    const [c, l, r] = pick;
    const root = h(`<div class="title">
${bg ? `<div class="tt-bg" style="background-image:url('${bg}')"></div>` : ''}
<div class="tt-rays"></div>
${l ? `<img class="tt-hero l" src="${heroImageURL(l)}" alt="">` : ''}${r ? `<img class="tt-hero r" src="${heroImageURL(r)}" alt="">` : ''}${c ? `<img class="tt-hero c" src="${heroImageURL(c)}" alt="">` : ''}
<div class="tt-shade"></div>
<div class="tt-logo"><b>詞靈幻想</b><span>LEXICA</span><small>答對英文，喚醒詞靈的力量</small></div>
<div class="tt-tap">點擊畫面開始</div>
<div class="tt-ver">v${__VERSION__}</div>
</div>`);
    document.getElementById('overlay').appendChild(root);
    let done = false;
    const go = () => {
      if (done) return;
      done = true;
      popBack();
      sfx('summonBurst');
      music('menu');
      root.classList.add('out');
      setTimeout(() => { root.remove(); resolve(); }, 650);
    };
    const popBack = pushBack(() => {}); // Back does nothing on the title screen
    root.addEventListener('click', go);
  });
}
