// Seeded random numbers (mulberry32). Battles, PvP question order and loot use these so a seed
// reproduces the same run on both phones; Math.random is only for cosmetic noise.

export function hashStr(s) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function makeRng(seed = 1) {
  let s = (typeof seed === 'string' ? hashStr(seed) : seed) >>> 0;
  const rng = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  /** integer in [0, n) */
  rng.int = (n) => Math.floor(rng() * n);
  /** integer in [a, b] */
  rng.range = (a, b) => a + Math.floor(rng() * (b - a + 1));
  rng.pick = (arr) => arr[Math.floor(rng() * arr.length)];
  rng.chance = (p) => rng() < p;
  rng.shuffle = (arr) => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };
  /** picks a key of `weights` ({key: weight}) */
  rng.weighted = (weights) => {
    let total = 0;
    for (const k in weights) total += weights[k];
    let r = rng() * total;
    for (const k in weights) {
      r -= weights[k];
      if (r <= 0) return k;
    }
    return Object.keys(weights).pop();
  };
  rng.state = () => s;
  return rng;
}

export function randomSeed() {
  try {
    const a = new Uint32Array(1);
    crypto.getRandomValues(a);
    return a[0] || 1;
  } catch {
    return (Math.random() * 4294967295) >>> 0 || 1;
  }
}
