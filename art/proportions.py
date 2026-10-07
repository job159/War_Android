"""Proportion check of battle-pose candidates against each hero's idle chibi.

    python art/proportions.py [HERO.POSE ...]     # e.g. spark.cast breeze.atk; default: every hero pose

The battle puppet (game/src/gfx/puppet.js) scales every key pose to the idle chibi's head size, then caps how
much bigger or smaller the whole figure may look. g = that size ratio (square root of the opaque-area ratio) at
equal head size: 1.0 = same chibi proportions; outside 0.84..1.2 the puppet has to shrink or grow the head instead.
Prints every raw candidate (cut-outs are cached like post.py's) and marks the current pick with *.
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).parent))
from post import OUT, PICKS, RAW, cut_cached, fit, pick_of  # noqa: E402
from face import face_box  # noqa: E402


def opaque_px(rgba):
    return float((np.asarray(rgba.split()[-1]) > 127).sum())


def main(want):
    man = json.loads((OUT / 'manifest.json').read_text(encoding='utf-8'))['heroes']
    picks = json.loads(PICKS.read_text(encoding='utf-8'))
    want = want or [f'{h}.{p}' for h in sorted(man) for p in ('atk', 'cast', 'hurt')]
    for hp in want:
        hid, part = hp.split('.')
        idle_meta = man[hid]['chibi']
        idle = Image.open(OUT / 'heroes' / hid / 'chibi.webp').convert('RGBA')
        idle_px = opaque_px(idle)
        jid = f'hero.{hid}.{part}'
        pk = pick_of(jid, picks, None)
        cur = pk and pk['seed']
        cells = []
        for f in sorted((RAW / jid).glob('*.png')):
            if f.name.endswith('.tmp.png'):
                continue
            seed = int(f.stem)
            rgba = fit(cut_cached(jid, seed), 720, 720)
            fb = face_box(rgba)
            mark = '*' if seed == cur else ''
            if not fb:
                cells.append(f'{mark}{seed}: no face')
                continue
            s = (idle_meta['face'][2] * idle.height) / (float(fb[2]) * rgba.height)  # equal head size
            g = (opaque_px(rgba) ** 0.5) * s / idle_px ** 0.5
            cells.append(f'{mark}{seed}: g={g:.2f}')
        print(f'{jid:24s}', '  '.join(cells), flush=True)


if __name__ == '__main__':
    main(sys.argv[1:])
