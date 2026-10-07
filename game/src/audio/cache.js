// IndexedDB cache for rendered PCM (Int16) so music and SFX render only once per install / version.
export const AUDIO_VERSION = 'lx-audio-1';
const DB_NAME = 'lexica-audio';
const STORE = 'pcm';

let dbp = null;
function db() {
  if (!dbp) {
    dbp = new Promise((resolve) => {
      try {
        const req = indexedDB.open(DB_NAME, 1);
        req.onupgradeneeded = () => req.result.createObjectStore(STORE);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(null);
        req.onblocked = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  }
  return dbp;
}

export async function cacheGet(key) {
  const d = await db();
  if (!d) return null;
  return new Promise((resolve) => {
    try {
      const r = d.transaction(STORE, 'readonly').objectStore(STORE).get(AUDIO_VERSION + ':' + key);
      r.onsuccess = () => resolve(r.result || null);
      r.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function cachePut(key, value) {
  const d = await db();
  if (!d) return;
  try {
    const tx = d.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(value, AUDIO_VERSION + ':' + key);
    // drop entries of older versions
    const cur = tx.objectStore(STORE).openCursor();
    cur.onsuccess = () => {
      const c = cur.result;
      if (!c) return;
      if (typeof c.key === 'string' && !c.key.startsWith(AUDIO_VERSION + ':')) c.delete();
      c.continue();
    };
  } catch {
    // quota / private mode: just don't cache
  }
}

export function toI16(f32) {
  const out = new Int16Array(f32.length);
  for (let i = 0; i < f32.length; i++) {
    const v = Math.max(-1, Math.min(1, f32[i]));
    out[i] = v < 0 ? v * 32768 : v * 32767;
  }
  return out;
}

export function fromI16(i16) {
  const out = new Float32Array(i16.length);
  for (let i = 0; i < i16.length; i++) out[i] = i16[i] / 32768;
  return out;
}
