// Visual-novel scene player: painted backdrop, speaker portraits (left / right, the active one lit),
// a dialogue box with typewriter Chinese + English line (read aloud). Tap to advance, 跳過 to skip.
import { h, esc } from './dom.js';
import { heroImageURL } from '../art/hero.js';
import { monsterImageURL } from '../art/monster.js';
import { bgAsset } from '../art/assets.js';
import { HERO_MAP } from '../core/data/heroes.js';
import { ENEMIES } from '../core/data/enemies.js';
import { S } from '../core/state.js';
import { speak, stopSpeak, sfx } from './sound.js';
import { pushBack } from './app.js';

/** lines: [[speaker, zh, en]], opts: { bg: scene key, boss: { id, element }, title } */
export function playStory(lines, { bg = 'home', boss = null, title = '' } = {}) {
  return new Promise((resolve) => {
    const url = bgAsset(bg);
    const root = h(`<div class="story">
<div class="st-bg" ${url ? `style="background-image:url('${url}')"` : ''}></div><div class="st-shade"></div>
<div class="st-por left"><img alt=""></div><div class="st-por right"><img alt=""></div>
${title ? `<div class="st-title">${esc(title)}</div>` : ''}
<button class="st-skip">跳過 ›</button>
<div class="st-box"><div class="st-name"></div><p class="st-zh"></p><p class="st-en"></p><i class="st-next">▼</i></div>
</div>`);
    document.getElementById('overlay').appendChild(root);
    const por = { left: root.querySelector('.st-por.left'), right: root.querySelector('.st-por.right') };
    const box = root.querySelector('.st-box');
    const nameEl = root.querySelector('.st-name'), zhEl = root.querySelector('.st-zh'), enEl = root.querySelector('.st-en');
    const sides = new Map(); // speaker -> side
    let i = -1, typing = 0, full = '', done = false;

    const who = (sp) => {
      if (sp === 'narrator') return null;
      if (sp === 'boss' && boss) { const d = ENEMIES[boss.id]; return { name: d ? d.zh : '???', en: d ? d.en || '' : '', art: monsterImageURL(d ? d.kind : 'slime', boss.element, { id: boss.id, crown: d && !!d.crown }), enemy: true }; }
      if (sp === 'silentia') { const d = ENEMIES.silentia; return { name: d.zh, en: d.en || 'Silentia', art: monsterImageURL(d.kind, 'dark', { id: 'silentia' }), enemy: true }; }
      const hdef = HERO_MAP[sp];
      if (!hdef) return null;
      const st = S.d.heroes[sp];
      return { name: hdef.zh, en: hdef.name, art: heroImageURL(hdef, { skin: st && st.skin }), element: hdef.element };
    };

    const show = () => {
      i++;
      if (i >= lines.length) return finish();
      const [sp, zh, en] = lines[i];
      const w = who(sp);
      box.classList.toggle('narrator', !w);
      box.classList.toggle('enemy', !!(w && w.enemy));
      nameEl.innerHTML = w ? `${esc(w.name)}<small>${esc(w.en)}</small>` : '';
      if (w) {
        let side = sides.get(sp);
        if (!side) { side = w.enemy ? 'right' : sides.size % 2 ? 'right' : 'left'; sides.set(sp, side); }
        const p = por[side];
        const img = p.querySelector('img');
        if (img.dataset.sp !== sp) { img.src = w.art; img.dataset.sp = sp; p.classList.remove('in'); void p.offsetWidth; }
        p.classList.add('in', 'talk');
        p.classList.toggle('enemy', !!w.enemy);
        por[side === 'left' ? 'right' : 'left'].classList.remove('talk');
      } else { por.left.classList.remove('talk'); por.right.classList.remove('talk'); }
      full = zh;
      zhEl.textContent = '';
      enEl.textContent = en;
      enEl.classList.remove('on');
      typing = 0;
      clearInterval(tick);
      tick = setInterval(() => {
        typing += 2;
        zhEl.textContent = full.slice(0, typing);
        if (typing >= full.length) { clearInterval(tick); enEl.classList.add('on'); }
      }, 28);
      if (S.d.settings.tts !== false) speak(en, { rate: 0.95 });
    };
    let tick = 0;

    const next = () => {
      if (typing < full.length) { typing = full.length; zhEl.textContent = full; clearInterval(tick); enEl.classList.add('on'); return; }
      sfx('tap');
      show();
    };
    const finish = () => {
      if (done) return;
      done = true;
      clearInterval(tick);
      stopSpeak();
      popBack();
      root.classList.add('out');
      setTimeout(() => { root.remove(); resolve(); }, 350);
    };
    const popBack = pushBack(finish);
    root.addEventListener('click', (e) => { if (e.target.closest('.st-skip')) finish(); else next(); });
    show();
  });
}
