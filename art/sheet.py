"""Contact sheets for art review: one row of labelled thumbnails per job group.

    python art/sheet.py PREFIX [PREFIX ...] [--h 360] [--out NAME]
    e.g. python art/sheet.py hero.aurora.     -> <ART>/out/sheets/hero.aurora.jpg
"""
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

sys.path.insert(0, str(Path(__file__).parent))

ART = Path('C:/Users/a2105/lexica-art')
RAW = ART / 'out' / 'raw'
SHEETS = ART / 'out' / 'sheets'


def font(size):
    for f in ('C:/Windows/Fonts/msjh.ttc', 'C:/Windows/Fonts/arial.ttf'):
        try:
            return ImageFont.truetype(f, size)
        except OSError:
            pass
    return ImageFont.load_default()


def sheet(prefixes, h=360, out=None, cols=6, cut=False):
    items = []
    for d in sorted(RAW.iterdir()):
        if d.is_dir() and any(d.name.startswith(p) for p in prefixes):
            for f in sorted(d.glob('*.png')):
                if not f.name.endswith('.tmp.png'):
                    items.append((f'{d.name} #{f.stem}', f))
    if not items:
        print('nothing for', prefixes)
        return None
    thumbs = []
    for label, f in items:
        if cut:  # show the segmented cut-out on a dark backdrop (what the game will actually display)
            from seg import cutout
            rgba, _ = cutout(Image.open(f))
            bg = Image.new('RGBA', rgba.size, (46, 34, 78, 255))
            bg.alpha_composite(rgba)
            im = bg.convert('RGB')
        else:
            im = Image.open(f).convert('RGB')
        w = int(im.width * h / im.height)
        thumbs.append((label, im.resize((w, h), Image.LANCZOS)))
    rows = [thumbs[i:i + cols] for i in range(0, len(thumbs), cols)]
    W = max(sum(t.width for _, t in r) + 8 * (len(r) + 1) for r in rows)
    H = len(rows) * (h + 34) + 8
    canvas = Image.new('RGB', (W, H), (24, 22, 34))
    d = ImageDraw.Draw(canvas)
    fnt = font(15)
    y = 8
    for r in rows:
        x = 8
        for label, t in r:
            canvas.paste(t, (x, y))
            d.text((x + 2, y + h + 4), label, fill=(255, 230, 160), font=fnt)
            x += t.width + 8
        y += h + 34
    SHEETS.mkdir(parents=True, exist_ok=True)
    dest = SHEETS / f'{out or prefixes[0].rstrip(".")}.jpg'
    canvas.save(dest, quality=88)
    print(dest, canvas.size, len(items), 'images')
    return dest


if __name__ == '__main__':
    args = sys.argv[1:]
    h = int(args[args.index('--h') + 1]) if '--h' in args else 360
    out = args[args.index('--out') + 1] if '--out' in args else None
    cols = int(args[args.index('--cols') + 1]) if '--cols' in args else 6
    prefixes = [a for i, a in enumerate(args) if not a.startswith('--') and (i == 0 or args[i - 1] not in ('--h', '--out', '--cols'))]
    sheet(prefixes, h, out, cols, cut='--cut' in args)
