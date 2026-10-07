"""Turns the art director's picks into game assets (game/assets/...) and writes game/assets/manifest.json.

    python art/post.py [PREFIX ...]      # process all picked jobs (or only ids starting with PREFIX)

picks.json maps job id -> seed (int) or {"seed": int, "face": [cx, cy, size], "flip": bool}
  face: normalized to the trimmed cut-out (0..1); auto-detected when omitted
  flip: mirror the art (battle sprites should face right)
Jobs without a pick use their first candidate.
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

sys.path.insert(0, str(Path(__file__).parent))
from seg import cutout  # noqa: E402
from face import face_box  # noqa: E402

ART = Path('C:/Users/a2105/lexica-art')
RAW = ART / 'out' / 'raw'
CUT = ART / 'out' / 'cut'
ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'game' / 'assets'
PICKS = Path(__file__).parent / 'picks.json'
JOBS = ART / 'out' / 'jobs.json'


def pick_of(jid, picks, jobs):
    p = picks.get(jid)
    if isinstance(p, dict):
        return None if p.get('skip') else p  # {"skip": true}: rejected in review, keep the procedural fallback
    if isinstance(p, int):
        return {'seed': p}
    d = RAW / jid
    files = sorted(d.glob('*.png')) if d.exists() else []
    files = [f for f in files if not f.name.endswith('.tmp.png')]
    if not files:
        return None
    from gen import seed_for  # first candidate = k 0
    first = seed_for(jid, 0)
    return {'seed': first if (d / f'{first}.png').exists() else int(files[0].stem)}


def save_webp(img, path, q=88):
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path, 'WEBP', quality=q, method=6)


def fit(img, max_w, max_h):
    k = min(max_w / img.width, max_h / img.height, 1.0)
    return img if k >= 1 else img.resize((round(img.width * k), round(img.height * k)), Image.LANCZOS)


def cut_cached(jid, seed):
    """Cut-out PNG cache so re-running post.py doesn't redo segmentation. Prefers the 2x upscaled painting."""
    up = ART / 'out' / 'up' / jid / f'{seed}.png'
    dst = CUT / jid / (f'{seed}_2x.png' if up.exists() else f'{seed}.png')
    if dst.exists():
        return Image.open(dst)
    rgba, _ = cutout(Image.open(up if up.exists() else RAW / jid / f'{seed}.png'))
    dst.parent.mkdir(parents=True, exist_ok=True)
    rgba.save(dst)
    return rgba


def opaque(rgba):
    """Opaque fraction of a cut-out: the puppet uses it to keep every key pose about as big as the idle chibi."""
    a = np.asarray(rgba.split()[-1])
    return round(float((a > 127).mean()), 4)


def auto_face(rgba, chibi=False):
    """Face box (cx, cy, size) normalized to the image, from the alpha mask: the head is the top blob."""
    a = np.asarray(rgba.split()[-1], dtype=np.float32) / 255.0
    H, W = a.shape
    rows = np.where(a.max(axis=1) > 0.5)[0]
    top = rows[0] if len(rows) else 0
    body = (rows[-1] - top) if len(rows) else H
    head = body * (0.36 if chibi else 0.15)
    band = a[top:int(top + head)]
    xs = np.arange(W)[None, :]
    wsum = band.sum()
    cx = float((band * xs).sum() / wsum) if wsum > 0 else W / 2
    cy = top + head * (0.55 if chibi else 0.62)
    size = head * (0.6 if chibi else 0.62)
    return [cx / W, cy / H, size / H]


def face_crop(img, face, out=256):
    """Square portrait icon: the face plus hair, slightly above center."""
    cx, cy, fs = face
    return crop_square(img, cx, cy - fs * 0.12, fs * 2.2, out)


def crop_square(img, cx, cy, size, out):
    W, H = img.size
    s = size * H
    x0, y0 = cx * W - s / 2, cy * H - s / 2
    box = tuple(round(v) for v in (x0, y0, x0 + s, y0 + s))
    c = Image.new('RGBA', (box[2] - box[0], box[3] - box[1]), (0, 0, 0, 0))
    c.paste(img.crop((max(0, box[0]), max(0, box[1]), min(W, box[2]), min(H, box[3]))), (max(0, -box[0]), max(0, -box[1])))
    return c.resize((out, out), Image.LANCZOS)


def bust(img, face, out_w=480, out_h=600):
    """Upper-body card art: centered on the face, head near the top."""
    cx, cy, fs = face
    W, H = img.size
    h = fs * H * 6.4
    w = h * out_w / out_h
    x0 = cx * W - w / 2
    y0 = cy * H - fs * H * 1.7
    box = tuple(round(v) for v in (x0, y0, x0 + w, y0 + h))
    c = Image.new('RGBA', (box[2] - box[0], box[3] - box[1]), (0, 0, 0, 0))
    c.paste(img.crop((max(0, box[0]), max(0, box[1]), min(W, box[2]), min(H, box[3]))), (max(0, -box[0]), max(0, -box[1])))
    return c.resize((out_w, out_h), Image.LANCZOS)


def edge_fade(img, inner=0.55):
    """Fade an additive (black background) texture to black at the edges so no square border shows."""
    a = np.asarray(img.convert('RGB'), dtype=np.float32)
    h, w = a.shape[:2]
    yy, xx = np.mgrid[0:h, 0:w]
    r = np.sqrt(((xx - w / 2) / (w / 2)) ** 2 + ((yy - h / 2) / (h / 2)) ** 2)
    m = np.clip((1.0 - r) / (1.0 - inner), 0, 1) ** 1.5
    # crush the dark noise floor so it adds nothing
    a = np.clip((a - 14) * 1.08, 0, 255) * m[..., None]
    return Image.fromarray(a.astype(np.uint8), 'RGB')


def main(prefixes):
    picks = json.loads(PICKS.read_text(encoding='utf-8')) if PICKS.exists() else {}
    jobs = json.loads(JOBS.read_text(encoding='utf-8'))
    man_path = OUT / 'manifest.json'
    man = json.loads(man_path.read_text(encoding='utf-8')) if man_path.exists() else {'heroes': {}, 'monsters': {}, 'bg': [], 'fx': []}
    for j in jobs:
        jid = j['id']
        if prefixes and not any(jid.startswith(p) for p in prefixes):
            continue
        pk = pick_of(jid, picks, jobs)
        if not pk:
            continue
        seed = pk['seed']
        kind, *rest = jid.split('.')
        print(jid, seed, flush=True)
        if kind == 'hero':
            hid, part = rest
            rgba = cut_cached(jid, seed)
            if pk.get('flip'):
                rgba = rgba.transpose(Image.FLIP_LEFT_RIGHT)
            d = OUT / 'heroes' / hid
            entry = man['heroes'].setdefault(hid, {})
            if part in ('main', 'skin'):
                full = fit(rgba, 1800, 2600)
                save_webp(full, d / f'{part}.webp')
                face = pk.get('face') or face_box(full) or auto_face(full)
                face = [float(v) for v in face]
                save_webp(face_crop(full, face), d / f'{part}_face.webp')
                save_webp(bust(full, face), d / f'{part}_bust.webp')
                entry[part] = {'w': full.width, 'h': full.height, 'face': [round(v, 4) for v in face]}
            else:  # battle sprites: chibi / skinchibi and the key poses atk / cast / hurt
                ch = fit(rgba, 720, 720)
                save_webp(ch, d / f'{part}.webp')
                face = pk.get('face') or face_box(ch)
                entry[part] = {'w': ch.width, 'h': ch.height, 'area': opaque(ch),
                               **({'face': [round(float(v), 4) for v in face]} if face else {})}
        elif kind == 'mon':
            eid, el = rest
            rgba = cut_cached(jid, seed)
            if pk.get('flip'):
                rgba = rgba.transpose(Image.FLIP_LEFT_RIGHT)
            m = fit(rgba, 720, 720)
            save_webp(m, OUT / 'monsters' / f'{eid}_{el}.webp')
            face = pk.get('face') or face_box(m)
            man['monsters'][f'{eid}_{el}'] = {'w': m.width, 'h': m.height, **({'face': [round(float(v), 4) for v in face]} if face else {})}
        elif kind == 'bg':
            up = ART / 'out' / 'up' / jid / f'{seed}.png'
            img = Image.open(up if up.exists() else RAW / jid / f'{seed}.png').convert('RGB')
            save_webp(img, OUT / 'bg' / f'{rest[0]}.webp', q=82)
            if rest[0] not in man['bg']:
                man['bg'].append(rest[0])
        elif kind == 'fx':
            img = Image.open(RAW / jid / f'{seed}.png').convert('RGB').resize((512, 512), Image.LANCZOS)
            if pk.get('rot'):  # e.g. a falling meteor painted head-down -> head pointing +x (projectiles rotate to their heading)
                img = img.rotate(pk['rot'], expand=True)
            save_webp(edge_fade(img), OUT / 'fx' / f'{rest[0]}.webp', q=86)
            if rest[0] not in man['fx']:
                man['fx'].append(rest[0])
    man['bg'].sort()
    man['fx'].sort()
    man_path.parent.mkdir(parents=True, exist_ok=True)
    man_path.write_text(json.dumps(man, ensure_ascii=False, indent=1), encoding='utf-8')
    print('manifest ->', man_path)


if __name__ == '__main__':
    main(sys.argv[1:])
