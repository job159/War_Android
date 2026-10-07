// Shared look of the download pages: the LAN server (serve.mjs) and the GitHub Pages site (build-site.mjs).

export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// ------------------------------------------------------------------ emblem (same art as the launcher icon)

export function emblemSvg({ background = false, className = '' } = {}) {
  const id = background ? 'i' : 'e';
  return `<svg class="${className}" xmlns="http://www.w3.org/2000/svg" viewBox="${background ? '18 18 72 72' : '20 16 68 72'}" aria-hidden="true">
<defs><radialGradient id="${id}a" cx="54" cy="46" r="26" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#FFD36B" stop-opacity=".6"/><stop offset="1" stop-color="#FFD36B" stop-opacity="0"/></radialGradient>
<radialGradient id="${id}b" cx="54" cy="50" r="64" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#4A2283"/><stop offset=".55" stop-color="#1E0E45"/><stop offset="1" stop-color="#0A0620"/></radialGradient></defs>
${background ? `<rect x="18" y="18" width="72" height="72" rx="16" fill="url(#${id}b)"/>` : ''}
<circle cx="54" cy="50" r="26" fill="url(#${id}a)"/>
<circle cx="54" cy="51" r="29" fill="none" stroke="#FFE39A" stroke-width="1.1"/>
<path d="M26,63C35,59 46,60 54,64C62,60 73,59 82,63L82,82C73,79 62,80 54,84C46,80 35,79 26,82Z" fill="#8E2A3A" stroke="#E9B54A"/>
<path d="M54,64C46,59.5 37,59.5 29,61.5L29,78.5C37,76.5 46,77 54,81Z" fill="#FFF6DE"/><path d="M54,64C62,59.5 71,59.5 79,61.5L79,78.5C71,76.5 62,77 54,81Z" fill="#F2DDB0"/>
<path d="M48,64L60,64L64,30L44,30Z" fill="#FFF0B3" fill-opacity=".35"/>
<path d="M54,24L46,41L54,41Z" fill="#E6FBFF"/><path d="M54,24L62,41L54,41Z" fill="#7FD8FF"/><path d="M46,41L54,56L54,41Z" fill="#3FA2E8"/><path d="M62,41L54,56L54,41Z" fill="#1E5FB8"/>
<path d="M54,24L62,41L54,56L46,41Z" fill="none" stroke="#F2FDFF" stroke-width=".7"/>
</svg>`;
}

// ------------------------------------------------------------------ pages

export const BASE_CSS = `
:root{--bg:#080614;--cyan:#f6d27a;--magenta:#ff7ad9;--text:#f4efff;--muted:#b9b0d8;--panel:rgba(22,14,48,.82)}
*{box-sizing:border-box}
html{background:var(--bg);color-scheme:dark;-webkit-text-size-adjust:100%}
body{margin:0;min-height:100vh;min-height:100dvh;color:var(--text);
 font-family:system-ui,-apple-system,"Segoe UI","Noto Sans TC","PingFang TC","Microsoft JhengHei",sans-serif;
 background:
  radial-gradient(70% 45% at 50% -5%,rgba(246,210,122,.20),transparent 70%),
  radial-gradient(60% 40% at 50% 105%,rgba(255,122,217,.18),transparent 70%),
  linear-gradient(rgba(246,210,122,.06) 1px,transparent 1px) 0 0/28px 28px,
  linear-gradient(90deg,rgba(246,210,122,.06) 1px,transparent 1px) 0 0/28px 28px,
  var(--bg)}
h1{margin:0;font-weight:800;letter-spacing:.14em;color:#f4fdff;
 text-shadow:0 0 6px var(--cyan),0 0 18px rgba(246,210,122,.8),0 0 44px rgba(246,210,122,.45)}
.sub{margin:6px 0 0;font:700 14px/1 ui-monospace,"Cascadia Mono",Consolas,monospace;letter-spacing:.55em;
 padding-left:.55em;color:var(--magenta);text-shadow:0 0 10px rgba(255,122,217,.85)}
.panel{background:var(--panel);border:1px solid rgba(246,210,122,.22);border-radius:16px;
 box-shadow:0 0 30px rgba(246,210,122,.06) inset}
.panel h2{margin:0 0 12px;font-size:15px;letter-spacing:.14em;color:var(--cyan)}
ol{margin:0;padding:0;list-style:none;counter-reset:s}
li{counter-increment:s;position:relative;padding:0 0 14px 40px;line-height:1.6}
li::before{content:counter(s);position:absolute;left:0;top:0;width:28px;height:28px;border-radius:8px;
 display:grid;place-items:center;font-weight:800;font-size:14px;color:var(--magenta);
 border:1px solid rgba(255,122,217,.6);box-shadow:0 0 10px rgba(255,122,217,.35) inset}
b{color:#fff}
code{font-family:ui-monospace,Consolas,monospace;background:rgba(255,255,255,.09);padding:1px 6px;border-radius:5px}
@keyframes glow{50%{box-shadow:0 0 0 1px rgba(255,255,255,.4) inset,0 0 36px rgba(246,210,122,.8),0 0 80px rgba(255,122,217,.5)}}
@keyframes float{50%{transform:translateY(-6px)}}
@media (prefers-reduced-motion:reduce){*{animation:none!important}}
`;

export function page(title, css, body, favicon = '/favicon.svg') {
  return `<!doctype html>
<html lang="zh-Hant">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#080614">
<title>${esc(title)}</title>
<link rel="icon" href="${favicon}" type="image/svg+xml">
<style>${BASE_CSS}${css}</style>
</head>
<body>
${body}
</body>
</html>`;
}

export const DOWNLOAD_CSS = `
body{display:flex;justify-content:center;
 padding:max(20px,env(safe-area-inset-top)) 16px max(28px,env(safe-area-inset-bottom))}
main{width:100%;max-width:460px}
.hero{text-align:center;margin-top:8px}
.emblem{width:132px;height:132px;filter:drop-shadow(0 0 16px rgba(246,210,122,.45));animation:float 6s ease-in-out infinite}
h1{margin-top:6px;font-size:44px}
.meta{display:flex;justify-content:center;flex-wrap:wrap;gap:8px;margin:18px 0 22px}
.chip{font-size:13px;padding:5px 11px;border:1px solid rgba(246,210,122,.35);border-radius:999px;background:rgba(246,210,122,.08)}
.download{display:flex;align-items:center;justify-content:center;gap:14px;width:100%;min-height:76px;padding:14px 20px;
 border-radius:18px;text-decoration:none;color:#03121a;font-size:23px;font-weight:900;letter-spacing:.1em;
 background:linear-gradient(120deg,#ffe7a0,#f2b94a 45%,#ff7ad9);
 box-shadow:0 0 0 1px rgba(255,255,255,.4) inset,0 0 24px rgba(246,210,122,.6),0 0 60px rgba(255,122,217,.35);
 animation:glow 2.8s ease-in-out infinite;-webkit-tap-highlight-color:transparent}
.download:active{transform:translateY(1px) scale(.99)}
.download svg{width:30px;height:30px;flex:none}
.download small{display:block;font-size:13px;font-weight:700;letter-spacing:.04em;opacity:.75}
.download.off{background:#161d3d;color:var(--muted);box-shadow:none;animation:none;pointer-events:none;font-size:19px}
.warn{margin:12px 0 0;text-align:center;color:#ffb3e9;font-size:14px;line-height:1.6}
.panel{margin-top:22px;padding:18px 18px 6px;font-size:15px}
.play{display:block;margin-top:16px;padding:15px;text-align:center;border-radius:14px;text-decoration:none;
 border:1px solid rgba(255,122,217,.55);background:rgba(255,122,217,.08);color:#ffd6f5;font-weight:700;letter-spacing:.06em}
.play.off{opacity:.45;pointer-events:none}
footer{margin-top:20px;text-align:center;color:var(--muted);font-size:13px;line-height:1.7}
footer a{color:var(--muted)}
`;

export const DOWNLOAD_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12m0 0l-5-5m5 5l5-5M4 19h16"/></svg>';

// Install instructions shown on both download pages.
export const INSTALL_STEPS = `<ol>
<li>點上方按鈕下載。瀏覽器若提示「<b>不安全的下載</b>」或「檔案可能有害」，請選「<b>保留</b>」（或「仍要下載」）。</li>
<li>下載完成後，點通知或到「下載」資料夾<b>開啟 Lexica.apk</b>。</li>
<li>系統若詢問，允許此來源（你的瀏覽器）<b>安裝未知應用程式</b>，然後返回繼續安裝。</li>
<li>若 <b>Play 安全防護</b>跳出詢問，選「更多詳細資料」→「<b>仍要安裝</b>」。</li>
<li>日後更新：直接下載新版覆蓋安裝，遊戲進度會保留。</li>
</ol>`;
