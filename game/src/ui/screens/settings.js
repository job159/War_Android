// Settings (music style, volumes, pronunciation, book, effects, save backup) and the player profile.
import { register, go, modal, toast, confirmBox } from '../app.js';
import { bindActions, esc, h } from '../dom.js';
import { icon } from '../../art/icons.js';
import { heroImageURL } from '../../art/hero.js';
import { HERO_MAP, HEROES } from '../../core/data/heroes.js';
import { S, changed, exportSave, importSave, resetSave, saveNow, studyStreak } from '../../core/state.js';
import { counts } from '../../core/quiz/srs.js';
import { loadBook, BOOKS } from '../../core/quiz/content.js';
import { configure, speak, ttsAvailable, sfx, music, previewBgm } from '../sound.js';
import { setBgLowFx } from '../../fx/bg.js';
import { fmt } from '../../core/util.js';

export const BGM_STYLES = [
  { id: 'adventure', zh: '冒險', icon: 'adventure', desc: '明亮的管弦冒險曲：長笛、弦樂與號角，踏上旅程的心情' },
  { id: 'majestic', zh: '莊嚴', icon: 'tower', desc: '聖詠合唱、銅管與定音鼓，史詩般的莊嚴感' },
  { id: 'rush', zh: '快感', icon: 'bolt', desc: '高速電子節拍與超鋸齒主旋律，越答越嗨' },
  { id: 'calm', zh: '專注', icon: 'study', desc: '溫柔的鋼琴與 lo-fi 節奏，適合讀書複習' },
  { id: 'off', zh: '關閉', icon: 'speaker', desc: '不播放背景音樂' },
];

const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'dev';

register({
  id: 'settings', tab: 'home', title: '設定',
  mount(el) {
    const render = () => {
      const st = S.d.settings;
      const tts = ttsAvailable();
      const T = (k) => `<button class="toggle ${st[k] ? 'on' : ''}" data-act="toggle" data-k="${k}"></button>`;
      el.innerHTML = `<div class="pad">
<div class="sec-title">背景音樂</div>
<div class="bgm-list">${BGM_STYLES.map((b) => `<button class="bgm-b ${st.bgm === b.id ? 'on' : ''}" data-act="bgm" data-id="${b.id}"><span class="bg-ic">${icon(b.icon)}</span><div><b>${b.zh}</b><small>${b.desc}</small></div>${st.bgm === b.id ? `<span class="prev">${icon('check')}</span>` : ''}</button>`).join('')}</div>
<div class="panel" style="margin-top:10px">
<div class="set-row"><div class="grow"><b>音樂音量</b></div><input type="range" min="0" max="100" value="${Math.round(st.music * 100)}" data-range="music"></div>
<div class="set-row"><div class="grow"><b>音效音量</b></div><input type="range" min="0" max="100" value="${Math.round(st.sfx * 100)}" data-range="sfx"></div>
</div>
<div class="sec-title">英文發音</div>
<div class="panel">
<div class="set-row"><div class="grow"><b>自動朗讀單字與例句</b><small>${tts ? '使用裝置的英文語音（TTS）' : '未偵測到英文語音：請在系統設定安裝「Google 文字轉語音」的英文語音'}</small></div>${T('tts')}</div>
<div class="set-row"><div class="grow"><b>朗讀速度</b></div><div class="seg">${[[0.7, '慢'], [0.9, '標準'], [1.1, '快']].map(([v, z]) => `<button class="${Math.abs(st.ttsRate - v) < 0.01 ? 'on' : ''}" data-act="rate" data-v="${v}">${z}</button>`).join('')}</div></div>
<div class="set-row"><div class="grow"><b>戰鬥中出現聽力題</b><small>聽發音選單字（需要英文語音）</small></div>${T('listen')}</div>
<div class="set-row"><div class="grow"><b>試聽</b></div><button class="btn small" data-act="testtts">${icon('speaker')} Hello, Covenanter!</button></div>
</div>
<div class="sec-title">學習內容</div>
<div class="panel"><div class="set-row"><div class="grow"><b>單字書</b><small>決定冒險與練習出現的單字</small></div><div class="seg">${[['c', '學測'], ['t', '多益'], ['both', '兩本']].map(([v, z]) => `<button class="${S.d.learn.book === v ? 'on' : ''}" data-act="book" data-v="${v}">${z}</button>`).join('')}</div></div></div>
<div class="sec-title">遊戲</div>
<div class="panel">
<div class="set-row"><div class="grow"><b>畫面特效</b><small>華麗：泛光、衝擊波扭曲、鏡頭特寫；舊手機若卡頓請選「省電」</small></div><div class="seg"><button class="${st.fx !== 'low' ? 'on' : ''}" data-act="fx" data-v="high">華麗</button><button class="${st.fx === 'low' ? 'on' : ''}" data-act="fx" data-v="low">省電</button></div></div>
<div class="set-row"><div class="grow"><b>震動回饋</b></div>${T('vib')}</div>
<div class="set-row"><div class="grow"><b>奧義預設自動施放</b><small>戰鬥中也可以點右上角「自動」切換</small></div>${T('autoUlt')}</div>
</div>
<div class="sec-title">存檔</div>
<div class="panel">
<div class="set-row"><div class="grow"><b>匯出存檔碼</b><small>換手機前請先備份</small></div><button class="btn small" data-act="export">匯出</button></div>
<div class="set-row"><div class="grow"><b>匯入存檔碼</b><small>會覆蓋目前進度</small></div><button class="btn small" data-act="import">匯入</button></div>
<div class="set-row"><div class="grow"><b>重新開始</b><small>刪除所有進度</small></div><button class="btn small red" data-act="reset">重置</button></div>
</div>
<div class="sec-title">關於</div>
<div class="panel about"><b>詞靈幻想 LEXICA</b> v${esc(VERSION)}<p class="dim">題庫來源：job159/VocabularyBook（學測 4000、多益 3000）與 job159/Grammar（44 課文法、3,100+ 題、252 篇克漏字）。<br>角色立繪、怪物、場景與特效貼圖由本機 AI 繪圖（Animagine XL 4.0）產生；音樂與音效為程式即時合成。字型 Cinzel、Barlow Condensed、思源宋體 Noto Serif TC（SIL Open Font License）。<br>本遊戲沒有任何真實金錢付費。<br>下載最新版：job159.github.io/War_Android</p></div>
</div>`;
    };
    render();
    const apply = () => { configure(S.d.settings); changed('settings'); };
    bindActions(el, {
      bgm: (b) => { S.d.settings.bgm = b.dataset.id; apply(); previewBgm(b.dataset.id); sfx('tap'); render(); },
      toggle: (b) => { const k = b.dataset.k; S.d.settings[k] = !S.d.settings[k]; apply(); sfx('tap'); render(); },
      rate: (b) => { S.d.settings.ttsRate = +b.dataset.v; apply(); speak('Practice makes perfect.', { force: true }); render(); },
      testtts: () => { if (!speak('Hello, Covenanter! Every word you learn makes us stronger.', { force: true })) toast('無法播放英文語音', 'bad'); },
      fx: (b) => { S.d.settings.fx = b.dataset.v; setBgLowFx(b.dataset.v === 'low'); apply(); render(); },
      book: async (b) => {
        const v = b.dataset.v;
        S.d.learn.book = v;
        try {
          if (v !== 'c') await loadBook('t');
          if (v !== 't') await loadBook('c');
        } catch (e) { toast('單字書載入失敗', 'bad'); }
        apply();
        toast(`已切換為 ${v === 'both' ? '學測 ＋ 多益' : BOOKS[v].zh}`, 'gold');
        render();
      },
      export: () => {
        saveNow();
        const code = exportSave();
        const body = h(`<div><p class="dim center">請複製下方存檔碼並妥善保存（貼到記事本或傳給自己）。</p><textarea class="save-code" readonly>${esc(code)}</textarea><button class="btn block" data-copy>複製</button></div>`);
        body.querySelector('[data-copy]').onclick = async () => {
          const ta = body.querySelector('textarea');
          ta.select();
          try { await navigator.clipboard.writeText(code); toast('已複製', 'good'); } catch { try { document.execCommand('copy'); toast('已複製', 'good'); } catch { toast('請手動複製', 'bad'); } }
        };
        modal({ title: '匯出存檔', body });
      },
      import: () => {
        const body = h('<div><p class="dim center">貼上存檔碼（LXC1 開頭）</p><textarea class="save-code"></textarea></div>');
        modal({ title: '匯入存檔', body, buttons: [{ label: '取消', value: 0 }, { label: '匯入', cls: 'red', value: 1 }] }).then(async (v) => {
          if (!v) return;
          if (!(await confirmBox('確定要用這個存檔覆蓋目前進度嗎？'))) return;
          try { importSave(body.querySelector('textarea').value); toast('匯入成功！', 'gold'); setTimeout(() => location.reload(), 600); } catch (e) { toast(e.message, 'bad'); }
        });
      },
      reset: async () => {
        if (!(await confirmBox('確定要刪除所有進度嗎？'))) return;
        if (!(await confirmBox('真的確定？此動作無法復原！', { ok: '刪除全部' }))) return;
        resetSave();
        location.reload();
      },
    });
    el.addEventListener('change', (e) => {
      const k = e.target.dataset.range;
      if (!k) return;
      S.d.settings[k] = +e.target.value / 100;
      apply();
      if (k === 'sfx') sfx('coin');
    });
    void music;
    return { refresh: () => {} };
  },
});

register({
  id: 'profile', tab: 'home', title: '個人資料',
  mount(el) {
    const render = () => {
      const d = S.d;
      const c = counts(d.learn);
      const acc = d.stats.answered ? Math.round((d.stats.correct / d.stats.answered) * 100) : 0;
      const sec = HERO_MAP[d.profile.avatar] || HERO_MAP.pebble;
      el.innerHTML = `<div class="pad">
<div class="panel ornate prof-head"><img class="prof-av" src="${heroImageURL(sec, { crop: 'face' })}"><div class="grow"><h2>${esc(d.profile.name || '契約者')}</h2><div class="dim">Lv.${d.profile.level}　契約者</div><button class="btn small" data-act="rename" style="margin-top:6px">改名</button></div></div>
<div class="sec-title">學習紀錄</div>
<div class="stat-list"><div><small>累計答對</small><b>${fmt(d.stats.correct)}</b></div><div><small>正確率</small><b>${acc}%</b></div>
<div><small>已掌握單字</small><b>${fmt(c.mastered)}</b></div><div><small>連續學習</small><b>${studyStreak()} 天</b></div>
<div><small>文法課</small><b>${d.learn.lessonsRead.length}/44</b></div><div><small>最高連擊</small><b>${d.stats.maxCombo || 0}</b></div></div>
<div class="sec-title">冒險紀錄</div>
<div class="stat-list"><div><small>戰鬥</small><b>${fmt(d.stats.battles)}</b></div><div><small>勝利</small><b>${fmt(d.stats.wins)}</b></div>
<div><small>詞靈</small><b>${Object.keys(d.heroes).length}/${HEROES.length}</b></div><div><small>召喚 SSR</small><b>${d.stats.gachaSSR || 0}</b></div>
<div><small>試煉之塔</small><b>${d.tower.best || 0} 層</b></div><div><small>對戰勝場</small><b>${d.pvp.wins}</b></div></div>
<button class="btn block" style="margin-top:12px" data-act="sec">更換秘書／頭像</button>
</div>`;
    };
    render();
    bindActions(el, {
      rename: () => {
        const body = h(`<div><input class="inp" maxlength="12" value="${esc(S.d.profile.name)}"></div>`);
        modal({ title: '改名', body, buttons: [{ label: '取消', value: 0 }, { label: '確定', cls: 'primary', value: 1 }] }).then((v) => {
          if (!v) return;
          const n = body.querySelector('input').value.trim();
          if (n) { S.d.profile.name = Array.from(n).slice(0, 12).join(''); changed('profile'); render(); }
        });
      },
      sec: () => go('heroes', { pickSecretary: true }),
    });
    return { refresh: render };
  },
});
