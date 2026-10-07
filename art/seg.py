"""Anime character / monster cut-out with skytnt/anime-seg (ISNet, ONNX).

    python art/seg.py IN.png OUT.png        # RGBA cut-out, trimmed to the subject with a small margin
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

ART = Path('C:/Users/a2105/lexica-art')
_sess = None


def session():
    global _sess
    if _sess is None:
        import onnxruntime as ort
        _sess = ort.InferenceSession(str(ART / 'models' / 'isnetis.onnx'), providers=['CPUExecutionProvider'])
    return _sess


def mask_of(img, s=1024):
    """Soft alpha mask (float 0..1, HxW) for an RGB PIL image."""
    a = np.asarray(img.convert('RGB'), dtype=np.float32) / 255.0
    h0, w0 = a.shape[:2]
    h, w = (s, int(s * w0 / h0)) if h0 > w0 else (int(s * h0 / w0), s)
    ph, pw = s - h, s - w
    inp = np.zeros((s, s, 3), dtype=np.float32)
    inp[ph // 2:ph // 2 + h, pw // 2:pw // 2 + w] = np.asarray(img.convert('RGB').resize((w, h), Image.BICUBIC), dtype=np.float32) / 255.0
    out = session().run(None, {'img': inp.transpose(2, 0, 1)[None]})[0][0, 0]
    out = out[ph // 2:ph // 2 + h, pw // 2:pw // 2 + w]
    m = Image.fromarray((np.clip(out, 0, 1) * 255).astype(np.uint8)).resize((w0, h0), Image.BICUBIC)
    return np.asarray(m, dtype=np.float32) / 255.0


def white_bg(rgb, thr=244, tol=10):
    """Pure-white background reachable from the image border (flood fill through near-white pixels).
    Catches white gaps the segmenter keeps inside swirls / debris / halos; outlined white clothes survive."""
    from scipy import ndimage
    a = np.asarray(rgb, dtype=np.int16)
    lo, hi = a.min(axis=2), a.max(axis=2)
    cand = (lo >= thr) & (hi - lo <= tol)
    lab, n = ndimage.label(cand)
    if n == 0:
        return np.zeros(cand.shape, bool)
    border = np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))
    border = border[border > 0]
    return np.isin(lab, border)


def cutout(img, margin=0.03, keep_largest=True, clean_white=True):
    """RGBA cut-out with a clean edge; returns (rgba, bbox in the source image)."""
    rgb = img.convert('RGB')
    m = mask_of(rgb)
    # sharpen the soft edge a little and drop faint haze
    m = np.clip((m - 0.08) / 0.84, 0, 1)
    if clean_white:
        from scipy import ndimage
        bgw = ndimage.binary_dilation(white_bg(rgb), iterations=1)
        m = m * (~bgw)
    if keep_largest:
        m = _largest_blob(m)
    alpha = Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.6))
    # pull white fringe out of the edge pixels (subject was generated on white)
    arr = np.asarray(rgb, dtype=np.float32)
    al = np.asarray(alpha, dtype=np.float32)[..., None] / 255.0
    edge = (al > 0.02) & (al < 0.98)
    bg = np.array([255.0, 255.0, 255.0])
    fixed = np.where(edge, np.clip((arr - bg * (1 - al)) / np.maximum(al, 0.05), 0, 255), arr)
    rgba = np.dstack([fixed, al[..., 0] * 255]).astype(np.uint8)
    out = Image.fromarray(rgba, 'RGBA')
    bb = out.getbbox()
    if not bb:
        return out, (0, 0, out.width, out.height)
    x0, y0, x1, y1 = bb
    pad = int(max(x1 - x0, y1 - y0) * margin)
    bb = (max(0, x0 - pad), max(0, y0 - pad), min(out.width, x1 + pad), min(out.height, y1 + pad))
    return out.crop(bb), bb


def _largest_blob(m, thr=0.5):
    """Remove disconnected specks: keep components that hold >= 2% of the subject's area."""
    from scipy import ndimage
    lab, n = ndimage.label(m > thr)
    if n <= 1:
        return m
    sizes = ndimage.sum(np.ones_like(m), lab, range(1, n + 1))
    keep = np.zeros(n + 1, dtype=bool)
    keep[1:] = sizes >= sizes.max() * 0.02
    region = ndimage.binary_dilation(keep[lab], iterations=6)
    return m * region


if __name__ == '__main__':
    src, dst = sys.argv[1], sys.argv[2]
    rgba, bb = cutout(Image.open(src))
    rgba.save(dst)
    print(dst, rgba.size, bb)
