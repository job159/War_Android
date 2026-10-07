// Mailbox: system gifts (welcome pack, compensation, milestone rewards).
import { register, modal } from '../app.js';
import { bindActions, esc } from '../dom.js';
import { S, grant, changed } from '../../core/state.js';
import { rewardList, emptyState } from '../widgets.js';
import { sfx } from '../sound.js';

export function sendMail(title, body, gift) {
  S.d.mail.push({ id: 'm' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), title, body, gift, at: Date.now() });
}

export function grantMail(id) {
  const i = S.d.mail.findIndex((m) => m.id === id);
  if (i < 0) return [];
  const m = S.d.mail[i];
  S.d.mail.splice(i, 1);
  return grant(m.gift);
}

const giftList = (gift) => Object.entries(gift || {}).filter(([k]) => k !== 'shards').map(([k, n]) => ({ k, n }));

register({
  id: 'mail', tab: 'home', title: '信箱',
  mount(el) {
    const render = () => {
      const mail = S.d.mail;
      el.innerHTML = `<div class="pad">
${mail.length ? `<button class="btn primary block" data-act="all">全部領取（${mail.length}）</button>` : ''}
${mail.length ? mail.map((m) => `<div class="panel mail-item"><div class="row"><b class="grow">${esc(m.title)}</b><span class="dim">${new Date(m.at).toLocaleDateString()}</span></div>
<p class="muted" style="white-space:pre-line;margin:6px 0 8px">${esc(m.body)}</p>${rewardList(giftList(m.gift))}
<div class="center" style="margin-top:8px"><button class="btn small primary" data-act="claim" data-id="${m.id}">領取</button></div></div>`).join('') : emptyState('信箱是空的')}
</div>`;
    };
    render();
    bindActions(el, {
      claim: (b) => {
        const got = grantMail(b.dataset.id);
        sfx('reward');
        changed('mail');
        modal({ title: '已領取', body: rewardList(got, { big: true }), buttons: [{ label: '好', cls: 'primary', value: 1 }] });
      },
      all: () => {
        const got = [];
        for (const m of [...S.d.mail]) got.push(...grantMail(m.id));
        sfx('reward');
        changed('mail');
        modal({ title: '已全部領取', body: rewardList(mergeRewards(got), { big: true }), buttons: [{ label: '好', cls: 'primary', value: 1 }] });
      },
    });
    return { refresh: render };
  },
});

export function mergeRewards(list) {
  const out = [];
  const map = new Map();
  for (const r of list) {
    if (r.k === 'gear' || r.k === 'hero') { out.push(r); continue; }
    const key = r.k === 'shard' ? 'shard:' + r.id : r.k;
    if (map.has(key)) map.get(key).n += r.n;
    else { const c = { ...r }; map.set(key, c); out.push(c); }
  }
  return out;
}
