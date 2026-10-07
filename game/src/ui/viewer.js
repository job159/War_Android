// Full-screen illustration viewer (tap a hero's painting): original / skin toggle, tap or Back to close.
import { h, esc } from './dom.js';
import { heroImageURL } from '../art/hero.js';
import { heroArt } from '../art/assets.js';
import { pushBack } from './app.js';
import { sfx, speak } from './sound.js';

export function viewArt(def, { skinOwned = false, skin = null } = {}) {
  let showSkin = !!skin;
  const root = h(`<div class="viewer el-${def.element}">
<div class="vw-glow"></div>
<img class="vw-art" alt="">
<div class="vw-info"><small>${esc(def.title)}</small><b>${esc(def.zh)}</b><span class="en-title">${esc(def.name)}</span></div>
${skinOwned && heroArt(def.id, def.skin.id) ? `<div class="vw-tabs"><button data-v="0">原初之姿</button><button data-v="1">${esc(def.skin.zh)}</button></div>` : ''}
<div class="vw-hint">點擊任意處關閉</div>
</div>`);
  const img = root.querySelector('.vw-art');
  const render = () => {
    img.classList.remove('in');
    void img.offsetWidth;
    img.src = heroImageURL(def, { skin: showSkin ? def.skin.id : null });
    img.classList.add('in');
    root.querySelectorAll('.vw-tabs button').forEach((b) => b.classList.toggle('on', (b.dataset.v === '1') === showSkin));
  };
  render();
  document.getElementById('overlay').appendChild(root);
  sfx('open');
  speak(def.lines[0][0]);
  const close = () => { popBack(); root.classList.add('out'); setTimeout(() => root.remove(), 250); };
  const popBack = pushBack(close);
  root.addEventListener('click', (e) => {
    const b = e.target.closest('.vw-tabs button');
    if (b) { showSkin = b.dataset.v === '1'; sfx('tab'); render(); return; }
    close();
  });
}
