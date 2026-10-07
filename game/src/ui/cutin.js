// Ultimate cut-in (Union-Burst style): the field dims, element rays spin up, a slanted panel slams open with
// speed lines and the hero's painting framed on the face (with a colored after-image), the skill name
// punches in, and a white flash hands over to the battlefield effect. Duration matches the sim's freeze.
import { h } from './dom.js';
import { heroImageURL } from '../art/hero.js';
import { monsterImageURL } from '../art/monster.js';
import { heroArt } from '../art/assets.js';
import { esc } from '../core/util.js';

export function playCutin(host, { hero, skin, monster, element, name, en, enemy = false, dur = 1.15 }) {
  const painted = hero ? heroArt(hero.id, skin) : null;
  const art = painted ? painted.url : hero ? heroImageURL(hero, { expr: 'angry', skin, aura: true, crop: 'cutin' }) : monster ? monsterImageURL(monster.kind, monster.element, { id: monster.id }) : '';
  const who = hero ? `${hero.zh}　${hero.name}` : '';
  const el = h(`<div class="cutin el-${element} ${enemy ? 'enemy' : ''} ${painted ? 'painted' : ''}" style="--dur:${dur}s">
<div class="ci-dim"></div>
<div class="ci-rays"></div>
<div class="ci-panel"><div class="ci-lines"></div><img class="ci-ghost" src="${art}" alt=""><img class="ci-art" src="${art}" alt=""></div>
<div class="ci-edge top"></div><div class="ci-edge bot"></div>
<div class="ci-text">${who ? `<span class="ci-who">${esc(who)}</span>` : ''}<b>${esc(name || '')}</b><small class="en-title">${esc(en || '')}</small></div>
<div class="ci-shine"></div>
</div>`);
  host.appendChild(el);
  if (painted) {
    // frame the face: the painting is drawn ~2.1x the field height, face at 42% height / 64% width
    const r = host.getBoundingClientRect();
    const H = r.height * 2.1;
    const W = (H * painted.w) / painted.h;
    const [fx, fy] = painted.face;
    const left = (enemy ? 0.36 : 0.64) * r.width - fx * W;
    const top = 0.42 * r.height - fy * H;
    for (const img of el.querySelectorAll('.ci-art, .ci-ghost')) {
      Object.assign(img.style, { height: H + 'px', width: W + 'px', left: left + 'px', top: top + 'px', right: 'auto', bottom: 'auto' });
    }
  }
  setTimeout(() => el.remove(), dur * 1000 + 80);
  return el;
}
