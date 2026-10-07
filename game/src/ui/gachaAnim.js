// Summon animation: magic circle in the summoning hall -> light streams in -> crystal descends (blue / gold /
// rainbow, upgrading on the way) -> shatter with a shockwave -> cards flip one by one (sparkles per card)
// -> full-screen showcase for SSR. Tap anywhere to fast-forward. Effects run on the WebGL overlay.
import { Sprite } from 'pixi.js';
import { h, esc, sleep } from './dom.js';
import { heroImageURL } from '../art/hero.js';
import { heroArt, bgAsset } from '../art/assets.js';
import { HERO_MAP } from '../core/data/heroes.js';
import { RARITY } from '../core/data/elements.js';
import { elemIcon } from '../art/icons.js';
import { stars } from './widgets.js';
import { sfx, speak } from './sound.js';
import { pushBack } from './app.js';
import { createFxOverlay } from '../gfx/overlay.js';
import { glowBurst, sparks, ring, flare, godRays, burst, pillar, converge } from '../gfx/vfx.js';
import * as T from '../gfx/tex.js';
import { S } from '../core/state.js';

const RCOL = { R: '#7ab8ff', SR: '#ffd84a', SSR: '#ff7ad9' };

export function playSummon(results, { title = '' } = {}) {
  return new Promise((resolve) => {
    const best = results.some((r) => r.rarity === 'SSR') ? 'SSR' : results.some((r) => r.rarity === 'SR') ? 'SR' : 'R';
    const hall = bgAsset('summon');
    const root = h(`<div class="gacha">
${hall ? `<div class="ga-hall" style="background-image:url('${hall}')"></div>` : ''}
<canvas class="ga-cv"></canvas>
<div class="ga-orb c-R"><i></i></div>
<div class="ga-flash"></div>
<div class="ga-cards n${results.length}"></div>
<div class="ga-show"></div>
<div class="ga-bar"></div>
<div class="ga-hint">${esc(title)}　點擊畫面加速</div>
</div>`);
    document.getElementById('overlay').appendChild(root);
    let fast = false;
    let running = true;
    const wait = (ms) => sleep(fast ? ms * 0.25 : ms);
    root.addEventListener('pointerdown', () => { fast = true; });
    const popBack = pushBack(() => {
      fast = true;
      const done = root.querySelector('[data-done]');
      if (done) done.click();
    });

    const orb = root.querySelector('.ga-orb');
    const flash = root.querySelector('.ga-flash');
    const cards = root.querySelector('.ga-cards');
    const show = root.querySelector('.ga-show');
    const bar = root.querySelector('.ga-bar');
    const doFlash = (c = '#fff', ms = 350) => { flash.style.background = c; flash.classList.remove('on'); void flash.offsetWidth; flash.classList.add('on'); setTimeout(() => flash.classList.remove('on'), ms); };

    // ---- WebGL layer (optional: the DOM animation works without it)
    let ov = null;
    const circle = { color: RCOL.R, a: 0, spin: 0.35 };
    const ready = createFxOverlay(root.querySelector('.ga-cv'), { quality: S.d.settings.fx }).then((o) => {
      ov = o;
      if (!o || !running) { if (o && !running) o.destroy(); return; }
      const { fx, view } = o;
      const cx = view.w / 2, cy = view.h * 0.62, R = Math.min(view.w, view.h) * 0.46;
      // the summoning circle: lives for the whole animation, color follows the crystal's rarity
      fx.add({ dur: 60, layer: 'under', make(node) {
        node.position.set(cx, cy);
        node.scale.y = 0.38;
        const glow = new Sprite(T.glowTex('#ffffff', 0.02)); glow.anchor.set(0.5); glow.blendMode = 'add';
        const outer = new Sprite(T.circleTex(RCOL.R)); outer.anchor.set(0.5); outer.blendMode = 'add';
        const inner = new Sprite(T.circleTex(RCOL.R)); inner.anchor.set(0.5); inner.blendMode = 'add';
        node.addChild(glow, outer, inner);
        return { glow, outer, inner, color: '' };
      }, update(k, s, dt) {
        if (s.color !== circle.color) {
          s.color = circle.color;
          s.outer.texture = T.circleTex(circle.color); s.inner.texture = T.circleTex(circle.color); s.glow.texture = T.glowTex(circle.color, 0.02);
        }
        circle.a = Math.min(1, circle.a + dt * 1.5);
        s.outer.rotation += dt * circle.spin; s.inner.rotation -= dt * circle.spin * 1.6;
        s.outer.scale.set((R * 2 * (0.7 + 0.3 * circle.a)) / 512); s.inner.scale.set((R * 1.1) / 512); s.glow.scale.set((R * 3) / 128);
        s.outer.alpha = s.inner.alpha = circle.a; s.glow.alpha = circle.a * 0.45;
        // light streaming in from the edges
        if (Math.random() < (fast ? 0.3 : 0.9)) {
          const a = Math.random() * 6.28, d = Math.min(view.w, view.h) * 0.62;
          fx.emit({ x: cx + Math.cos(a) * d, y: cy + Math.sin(a) * d * 0.5, vx: -Math.cos(a) * d * 1.4, vy: -Math.sin(a) * d * 0.7, kind: 'spark', color: circle.color, size: 8, life: 0.65, stretch: 0.03 });
        }
      } });
    });

    const fxc = () => (ov ? { fx: ov.fx, view: ov.view } : null);
    const cardPoint = (el) => {
      const a = el.getBoundingClientRect(), b = root.getBoundingClientRect();
      return [a.left - b.left + a.width / 2, a.top - b.top + a.height / 2];
    };

    (async () => {
      await Promise.race([ready, sleep(1200)]);
      sfx('summonCharge');
      await wait(700);
      orb.classList.add('drop');
      sfx('summonDrop');
      let c = fxc();
      if (c) converge(c, c.view.w / 2, c.view.h * 0.42, '#ffffff', { n: 40, radius: 220, dur: 0.6 });
      await wait(900);
      if (best !== 'R') {
        orb.className = 'ga-orb drop c-SR up';
        circle.color = RCOL.SR;
        circle.spin = 0.7;
        doFlash('rgba(255,216,74,.6)');
        if ((c = fxc())) { glowBurst(c, c.view.w / 2, c.view.h * 0.42, RCOL.SR, 30, 380, 10); ring(c, c.view.w / 2, c.view.h * 0.42, RCOL.SR, 10, 200, 0.6, 0, 6, 1); }
        sfx('summonUpgrade');
        await wait(700);
      }
      if (best === 'SSR') {
        orb.className = 'ga-orb drop c-SSR up crack';
        circle.color = RCOL.SSR;
        circle.spin = 1.2;
        doFlash('rgba(255,140,230,.7)');
        if ((c = fxc())) {
          const x = c.view.w / 2, y = c.view.h * 0.42;
          pillar(c, x, c.view.h * 0.62, '#ffc8f0', { width: 70, dur: 1.6, top: -40 });
          godRays(c, x, y, '#ffb8ec', { size: c.view.h * 0.7, dur: 1.8, spin: 0.4 });
          glowBurst(c, x, y, '#ffffff', 40, 520, 12);
          c.view.shockwave(x, y, { amp: 30, wave: 160 });
        }
        sfx('summonUpgrade');
        await wait(900);
      }
      orb.classList.add('boom');
      doFlash('#ffffff', 600);
      if ((c = fxc())) {
        const x = c.view.w / 2, y = c.view.h * 0.42;
        burst(c, x, y, best === 'SSR' ? 'light' : best === 'SR' ? 'fire' : 'water', { size: 260, color: RCOL[best], dur: 0.8 });
        flare(c, x, y, RCOL[best], { size: 220 });
        glowBurst(c, x, y, RCOL[best], 90, 700, 13, 0, 0.9);
        sparks(c, x, y, '#ffffff', 40, 800);
        c.view.shockwave(x, y, { amp: 40, wave: 200 });
        c.view.shake(10, 0.35);
      }
      sfx('summonBurst');
      await wait(450);
      orb.remove();
      circle.spin = 0.25;
      // cards
      cards.innerHTML = results.map((r, i) => `<div class="ga-card r-${r.rarity}" style="--d:${i * 60}ms"><div class="gc-back"></div><div class="gc-front el-${HERO_MAP[r.id].element}"><img src="${heroImageURL(HERO_MAP[r.id], { crop: 'bust' })}"><span class="gc-r">${r.rarity}</span>${r.isNew ? '<span class="gc-new">新</span>' : ''}<b>${esc(HERO_MAP[r.id].zh)}</b>${r.dupe ? `<small>碎片 +${r.shards}</small>` : ''}</div></div>`).join('');
      cards.classList.add('in');
      await wait(results.length > 1 ? 700 : 300);
      const els = Array.from(cards.children);
      for (let i = 0; i < els.length; i++) {
        const r = results[i];
        if (r.rarity === 'SSR' || (results.length === 1 && r.rarity === 'SR')) await showcase(r);
        els[i].classList.add('flip');
        if ((c = fxc())) {
          const [x, y] = cardPoint(els[i]);
          glowBurst(c, x, y, RCOL[r.rarity], r.rarity === 'R' ? 8 : 20, r.rarity === 'R' ? 160 : 300, 7);
          if (r.rarity !== 'R') ring(c, x, y, RCOL[r.rarity], 6, 60, 0.4, 0, 3, 1);
        }
        sfx(r.rarity === 'SSR' ? 'ssr' : r.rarity === 'SR' ? 'sr' : 'cardFlip');
        await wait(results.length > 1 ? 170 : 400);
      }
      bar.innerHTML = `<button class="btn primary big" data-done>確定</button>`;
      bar.classList.add('in');
      bar.querySelector('[data-done]').onclick = () => {
        popBack();
        running = false;
        root.classList.add('out');
        setTimeout(() => { root.remove(); if (ov) ov.destroy(); }, 300);
        resolve();
      };
    })();

    async function showcase(r) {
      const def = HERO_MAP[r.id];
      show.innerHTML = `<div class="gs-rays r-${r.rarity}"></div><img class="gs-art" src="${heroImageURL(def, { aura: true, expr: 'happy' })}">
<div class="gs-info"><div class="gs-rar r-${r.rarity}">${r.rarity}</div><div class="gs-title">${esc(def.title)}</div><div class="gs-name">${esc(def.zh)}<span class="en-title">${esc(def.name)}</span></div>
<div class="row" style="gap:6px;justify-content:center">${elemIcon(def.element)}${stars(RARITY[def.rarity].stars)}</div>
<p class="gs-line">「${esc(def.lines[0][0])}」<br><small>${esc(def.lines[0][1])}</small></p>${r.isNew ? '<div class="gs-new">新角色</div>' : `<div class="gs-dupe">已擁有 → 碎片 +${r.shards}・契約之心 +${r.hearts}</div>`}</div>`;
      show.className = 'ga-show on r-' + r.rarity + (heroArt(def.id) ? ' painted' : '');
      doFlash(r.rarity === 'SSR' ? 'rgba(255,200,240,.9)' : 'rgba(255,240,180,.8)', 500);
      sfx('ssrShow');
      speak(def.lines[0][0]);
      await new Promise((res) => {
        const t = setTimeout(res, fast ? 900 : 3400);
        show.onclick = () => { clearTimeout(t); res(); };
      });
      show.className = 'ga-show';
      fast = false;
    }
  });
}
