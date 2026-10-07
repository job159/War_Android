// Summon animation: magic circle -> crystal descends (blue / gold / rainbow, upgrading on the way) ->
// shatter flash -> cards flip one by one -> SSR showcase. Tap anywhere to fast-forward.
import { h, esc, sleep } from './dom.js';
import { heroImageURL } from '../art/hero.js';
import { HERO_MAP } from '../core/data/heroes.js';
import { RARITY } from '../core/data/elements.js';
import { FX } from '../fx/particles.js';
import { elemIcon } from '../art/icons.js';
import { stars } from './widgets.js';
import { sfx, speak } from './sound.js';
import { pushBack } from './app.js';

const RCOL = { R: '#7ab8ff', SR: '#ffd84a', SSR: '#ff7ad9' };

export function playSummon(results, { title = '' } = {}) {
  return new Promise((resolve) => {
    const best = results.some((r) => r.rarity === 'SSR') ? 'SSR' : results.some((r) => r.rarity === 'SR') ? 'SR' : 'R';
    const root = h(`<div class="gacha">
<canvas class="ga-cv"></canvas>
<div class="ga-orb c-R"><i></i></div>
<div class="ga-flash"></div>
<div class="ga-cards n${results.length}"></div>
<div class="ga-show"></div>
<div class="ga-bar"></div>
<div class="ga-hint">${esc(title)}　點擊畫面加速</div>
</div>`);
    document.getElementById('overlay').appendChild(root);
    const cv = root.querySelector('.ga-cv');
    const g = cv.getContext('2d');
    const fx = new FX();
    let W = 0, H = 0, dpr = Math.min(2, window.devicePixelRatio || 1);
    const resize = () => { W = root.clientWidth; H = root.clientHeight; cv.width = W * dpr; cv.height = H * dpr; };
    resize();
    let color = RCOL.R;
    let circleK = 0;
    let running = true;
    let last = performance.now();
    let fast = false;
    const loop = (ts) => {
      if (!running) return;
      const dt = Math.min(0.05, (ts - last) / 1000);
      last = ts;
      circleK = Math.min(1, circleK + dt * 1.2);
      fx.update(dt);
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.__base = [dpr, 0, 0, dpr, 0, 0];
      g.clearRect(0, 0, W, H);
      drawCircle(g, W / 2, H * 0.62, Math.min(W, H) * 0.42 * circleK, color, ts / 1000);
      if (Math.random() < 0.6) {
        const a = Math.random() * 6.28, d = Math.min(W, H) * 0.5;
        fx.emit({ x: W / 2 + Math.cos(a) * d, y: H * 0.62 + Math.sin(a) * d * 0.4, vx: -Math.cos(a) * d * 1.5, vy: -Math.sin(a) * d * 0.6, kind: 'spark', color, size: 7, life: 0.6, stretch: 0.03 });
      }
      fx.draw(g);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
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

    const burst = (c, n = 60) => {
      for (let i = 0; i < n; i++) { const a = Math.random() * 6.28, sp = 200 + Math.random() * 500; fx.emit({ x: W / 2, y: H * 0.42, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, kind: i % 3 ? 'spark' : 'star', color: c, size: 8 + Math.random() * 8, life: 0.9, drag: 1.5, stretch: i % 3 ? 0.03 : 0 }); }
    };
    const doFlash = (c = '#fff', ms = 350) => { flash.style.background = c; flash.classList.remove('on'); void flash.offsetWidth; flash.classList.add('on'); setTimeout(() => flash.classList.remove('on'), ms); };

    (async () => {
      sfx('summonCharge');
      await wait(700);
      orb.classList.add('drop');
      sfx('summonDrop');
      await wait(900);
      if (best !== 'R') {
        orb.className = 'ga-orb drop c-SR up';
        color = RCOL.SR;
        doFlash('rgba(255,216,74,.6)');
        burst(RCOL.SR, 30);
        sfx('summonUpgrade');
        await wait(700);
      }
      if (best === 'SSR') {
        orb.className = 'ga-orb drop c-SSR up crack';
        color = RCOL.SSR;
        doFlash('rgba(255,140,230,.7)');
        burst('#ffffff', 40);
        sfx('summonUpgrade');
        await wait(900);
      }
      orb.classList.add('boom');
      burst(color, 90);
      doFlash('#ffffff', 600);
      sfx('summonBurst');
      await wait(450);
      orb.remove();
      // cards
      cards.innerHTML = results.map((r, i) => `<div class="ga-card r-${r.rarity}" style="--d:${i * 60}ms"><div class="gc-back"></div><div class="gc-front el-${HERO_MAP[r.id].element}"><img src="${heroImageURL(HERO_MAP[r.id], { crop: 'bust' })}"><span class="gc-r">${r.rarity}</span>${r.isNew ? '<span class="gc-new">NEW</span>' : ''}<b>${esc(HERO_MAP[r.id].zh)}</b>${r.dupe ? `<small>碎片 +${r.shards}</small>` : ''}</div></div>`).join('');
      cards.classList.add('in');
      await wait(results.length > 1 ? 700 : 300);
      const els = Array.from(cards.children);
      for (let i = 0; i < els.length; i++) {
        const r = results[i];
        if (r.rarity === 'SSR' || (results.length === 1 && r.rarity === 'SR')) {
          await showcase(r);
        }
        els[i].classList.add('flip');
        sfx(r.rarity === 'SSR' ? 'ssr' : r.rarity === 'SR' ? 'sr' : 'cardFlip');
        await wait(results.length > 1 ? 170 : 400);
      }
      bar.innerHTML = `<button class="btn primary big" data-done>確定</button>`;
      bar.classList.add('in');
      bar.querySelector('[data-done]').onclick = () => {
        popBack();
        running = false;
        root.classList.add('out');
        setTimeout(() => root.remove(), 300);
        resolve();
      };
    })();

    async function showcase(r) {
      const def = HERO_MAP[r.id];
      show.innerHTML = `<div class="gs-rays r-${r.rarity}"></div><img class="gs-art" src="${heroImageURL(def, { aura: true, expr: 'happy' })}">
<div class="gs-info"><div class="gs-rar r-${r.rarity}">${r.rarity}</div><div class="gs-title">${esc(def.title)}</div><div class="gs-name">${esc(def.zh)}<span class="en-title">${esc(def.name)}</span></div>
<div class="row" style="gap:6px;justify-content:center">${elemIcon(def.element)}${stars(RARITY[def.rarity].stars)}</div>
<p class="gs-line">「${esc(def.lines[0][0])}」<br><small>${esc(def.lines[0][1])}</small></p>${r.isNew ? '<div class="gs-new">NEW!</div>' : `<div class="gs-dupe">已擁有 → 碎片 +${r.shards}・契約之心 +${r.hearts}</div>`}</div>`;
      show.className = 'ga-show on r-' + r.rarity;
      doFlash(r.rarity === 'SSR' ? 'rgba(255,200,240,.9)' : 'rgba(255,240,180,.8)', 500);
      sfx('ssrShow');
      speak(def.lines[0][0]);
      await new Promise((res) => {
        const t = setTimeout(res, fast ? 900 : 3200);
        show.onclick = () => { clearTimeout(t); res(); };
      });
      show.className = 'ga-show';
      fast = false;
    }
    window.addEventListener('resize', resize, { once: true });
  });
}

function drawCircle(g, x, y, r, color, t) {
  if (r < 2) return;
  g.save();
  g.translate(x, y);
  g.scale(1, 0.38);
  g.globalCompositeOperation = 'lighter';
  const gr = g.createRadialGradient(0, 0, 0, 0, 0, r);
  gr.addColorStop(0, hexA(color, 0.35)); gr.addColorStop(1, hexA(color, 0));
  g.fillStyle = gr;
  g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.fill();
  g.strokeStyle = hexA(color, 0.95);
  for (const [rr, w, sp] of [[1, 3, 0.3], [0.82, 1.5, -0.5], [0.62, 2, 0.8]]) {
    g.save(); g.rotate(t * sp); g.lineWidth = w;
    g.beginPath(); g.arc(0, 0, r * rr, 0, Math.PI * 2); g.stroke();
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; g.fillStyle = hexA(color, 0.9); g.fillRect(Math.cos(a) * r * rr - 3, Math.sin(a) * r * rr - 3, 6, 6); }
    g.restore();
  }
  g.rotate(-t * 0.4);
  g.lineWidth = 1.5;
  g.beginPath();
  for (let i = 0; i < 5; i++) { const a = (i * 4 * Math.PI) / 5 - Math.PI / 2; const px = Math.cos(a) * r * 0.62, py = Math.sin(a) * r * 0.62; if (i) g.lineTo(px, py); else g.moveTo(px, py); }
  g.closePath(); g.stroke();
  g.restore();
}

function hexA(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
