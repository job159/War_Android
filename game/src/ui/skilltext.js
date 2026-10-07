// Human-readable (Chinese) skill descriptions generated from skill data.
import { STATUS_INFO } from '../core/data/elements.js';

const TG = {
  front: '前方敵人', random: '隨機敵人', lowest: '生命最低的敵人', back: '後排敵人', all: '全體敵人', frontRow: '前排敵人',
  self: '自身', allyLowest: '生命最低的隊友', allies: '全體隊友', alliesOther: '其他隊友',
};
const pct = (x) => `${Math.round(x * 100)}%`;

function fxText(f) {
  if (f.dmg != null) return `造成 ${pct(f.dmg)} 攻擊力傷害${f.hits > 1 ? ` ×${f.hits} 次` : ''}${f.pierce ? `（無視 ${pct(f.pierce)} 防禦）` : ''}${f.ex ? `；目標生命低於 30% 時傷害 +${pct(f.ex)}` : ''}`;
  if (f.heal != null) return `回復 ${pct(f.heal)} 攻擊力的生命`;
  if (f.healPct != null) return `回復最大生命 ${pct(f.healPct)}`;
  if (f.shield != null) return `給予 ${pct(f.shield)} 攻擊力的護盾`;
  if (f.shieldPct != null) return `給予施放者最大生命 ${pct(f.shieldPct)} 的護盾`;
  if (f.en != null) return `獲得 ${f.en} 能量`;
  if (f.cleanse) return '淨化負面狀態';
  if (f.revive != null) return `復活倒下的隊友（${pct(f.revive)} 生命）`;
  if (f.st) {
    const s = STATUS_INFO[f.st] || { zh: f.st };
    const chance = f.ch != null ? `${pct(f.ch)} 機率` : '';
    if (f.st === 'burn' || f.st === 'poison') return `${chance}${s.zh}（每秒 ${pct(f.p)} 攻擊力，${f.d} 秒）`;
    if (f.st === 'regen') return `再生（每秒 ${pct(f.p)} 攻擊力，${f.d} 秒）`;
    if (f.p) return `${chance}${s.zh} ${pct(f.p)}（${f.d} 秒）`;
    return `${chance}${s.zh} ${f.d} 秒`;
  }
  return '';
}

export function describeSkill(sk) {
  if (!sk || !sk.parts) return '';
  return sk.parts.map((p) => `${TG[p.tg] || ''}：${p.fx.map(fxText).filter(Boolean).join('，')}`).join('；') + '。';
}
