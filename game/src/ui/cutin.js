// Ultimate cut-in: a slanted band with speed lines slams across the battlefield, the character slides
// in large, and the skill name punches in with a gold glow. Duration matches the sim's freeze.
import { h } from './dom.js';
import { heroImageURL } from '../art/hero.js';
import { monsterImageURL } from '../art/monster.js';
import { esc } from '../core/util.js';

export function playCutin(host, { hero, skin, monster, element, name, en, enemy = false, dur = 1.15 }) {
  const art = hero ? heroImageURL(hero, { expr: 'angry', skin, aura: true, crop: 'cutin' }) : monster ? monsterImageURL(monster.kind, monster.element) : '';
  const el = h(`<div class="cutin el-${element} ${enemy ? 'enemy' : ''}" style="--dur:${dur}s">
<div class="ci-dim"></div>
<div class="ci-band"><div class="ci-lines"></div></div>
<img class="ci-art" src="${art}" alt="">
<div class="ci-text"><small class="en-title">${esc(en || '')}</small><b>${esc(name || '')}</b></div>
<div class="ci-shine"></div>
</div>`);
  host.appendChild(el);
  setTimeout(() => el.remove(), dur * 1000 + 80);
  return el;
}
