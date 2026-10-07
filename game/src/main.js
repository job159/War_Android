// LEXICA entry point: boot (save, content), app shell, screens, lifecycle hooks.
import { HEROES } from './core/data/heroes.js';
import { heroImageURL } from './art/hero.js';
import { monsterImageURL } from './art/monster.js';
import { injectIconDefs } from './art/icons.js';
import { initBg, setBgPaused, setBgLowFx } from './fx/bg.js';
import { loadSave, S, saveNow, changed } from './core/state.js';
import { loadBook, loadGrammar } from './core/quiz/content.js';
import { ensureDay, badges, syncCounters, checkMilestones } from './core/missions.js';
import { initApp, register, tab, setBadgeProvider, go, toast } from './ui/app.js';
import { subscribe } from './core/state.js';
import { configure, unlockAudio, pauseAudio, resumeAudio, setEngine } from './ui/sound.js';
import { AudioEngine } from './audio/engine.js';
import * as soundMod from './ui/sound.js';

import './ui/screens/home.js';
import './ui/screens/mail.js';
import './ui/screens/missions.js';
import './ui/screens/heroes.js';
import './ui/screens/hero.js';
import './ui/screens/team.js';
import './ui/screens/adventure.js';
import './ui/screens/battle.js';
import './ui/screens/results.js';
import './ui/screens/shop.js';
import './ui/screens/quiz.js';
import './ui/screens/study.js';
import './ui/screens/codex.js';
import './ui/screens/lesson.js';
import './ui/screens/pvp.js';
import './ui/screens/settings.js';
import { runOnboarding } from './ui/screens/onboarding.js';


function gallery() {
  const app = document.getElementById('app');
  if (location.hash.startsWith('#gallery-m')) {
    const kinds = ['slime', 'mushroom', 'wolf', 'bat', 'goblin', 'wisp', 'skeleton', 'golem', 'harpy', 'sprite', 'salamander', 'armor', 'treant', 'gargoyle', 'mimic', 'dragon', 'kraken', 'lich', 'demon', 'queen'];
    const els = ['fire', 'water', 'wind', 'earth', 'light', 'dark'];
    app.innerHTML = `<div class="gallery">${kinds.map((k, i) => `<div class="g"><img src="${monsterImageURL(k, els[i % 6], { crown: i % 5 === 0 })}"><img style="height:60px" src="${monsterImageURL(k, els[(i + 3) % 6], { expr: 'hurt' })}"><div>${k}</div></div>`).join('')}</div>`;
    return;
  }
  const params = new URLSearchParams(location.hash.slice(location.hash.indexOf('?') + 1));
  const expr = params.get('expr') || 'normal';
  const crop = params.get('crop') || 'full';
  app.innerHTML = `<div class="gallery">${HEROES.map((h) => `<div class="g"><img src="${heroImageURL(h, { expr, crop, aura: params.get('aura') === '1' })}"><div>${h.rarity} ${h.name} ${h.zh}</div></div>`).join('')}</div>`;
}

function setBoot(frac, msg) {
  const b = document.querySelector('#boot .boot-bar i');
  if (b) b.style.width = Math.round(frac * 100) + '%';
  const m = document.querySelector('#boot .boot-msg');
  if (m && msg) m.textContent = msg;
}

async function boot() {
  injectIconDefs();
  if (__DEV__ && /[?&]frame/.test(location.search)) document.documentElement.classList.add('dev-frame');
  const bootEl = document.getElementById('boot');
  if (location.hash.startsWith('#gallery')) {
    gallery();
    bootEl.classList.add('done');
    return;
  }
  initBg(document.getElementById('bg'));
  const d = loadSave();
  setBgLowFx(d.settings.fx === 'low');
  try { setEngine(new AudioEngine()); } catch (e) { console.warn('audio engine unavailable', e); }
  configure(d.settings);
  setBoot(0.05, '讀取文法題庫…');
  try {
    await loadGrammar((p) => setBoot(0.05 + p * 0.25));
    setBoot(0.3, '讀取單字書…');
    const books = d.learn.book === 'both' ? ['c', 't'] : [d.learn.book || 'c'];
    for (let i = 0; i < books.length; i++) {
      await loadBook(books[i], (p) => setBoot(0.3 + ((i + p) / books.length) * 0.6));
    }
  } catch (e) {
    console.error(e);
    setBoot(1, '題庫載入失敗：' + e.message);
    return;
  }
  setBoot(1, '準備完成');
  ensureDay();
  syncCounters();
  initApp();
  setBadgeProvider(badges);
  subscribe((topic) => {
    if ((topic === 'battle' || topic === 'quiz') && checkMilestones()) { toast('📬 單字里程碑達成！獎勵已寄到信箱', 'gold'); changed('mail'); }
  });
  window.addEventListener('pointerdown', unlockAudio, { capture: true });
  window.__nativePause = () => { saveNow(); pauseAudio(); setBgPaused(true); };
  window.__nativeResume = () => { resumeAudio(); setBgPaused(false); if (ensureDay()) changed('day'); };
  document.addEventListener('visibilitychange', () => { if (document.hidden) window.__nativePause(); else window.__nativeResume(); });
  window.addEventListener('beforeunload', saveNow);
  setTimeout(() => bootEl.classList.add('done'), 150);
  if (!S.d.profile.onboarded) await runOnboarding();
  tab('home');
  if (__DEV__) window.__lx = { S, go, changed, sound: soundMod };
}

boot();
