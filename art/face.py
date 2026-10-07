"""Anime face detection (deepghs/anime_face_detection, YOLOv8 ONNX, MIT) for framing crops and cut-ins.

    face_box(rgba_or_rgb) -> (cx, cy, size) normalized to the image, or None
"""
from pathlib import Path

import numpy as np
from PIL import Image

MODEL = Path('C:/Users/a2105/lexica-art/models/face/face_detect_v1.4_s/model.onnx')
THRESH = 0.307
_sess = None


def session():
    global _sess
    if _sess is None:
        import onnxruntime as ort
        _sess = ort.InferenceSession(str(MODEL), providers=['CPUExecutionProvider'])
    return _sess


def detect(img, size=640, thresh=THRESH):
    """[(x0, y0, x1, y1, score)] in pixels of `img`."""
    if img.mode == 'RGBA':  # flatten on grey so transparent areas don't look like faces
        bg = Image.new('RGB', img.size, (128, 128, 128))
        bg.paste(img, mask=img.split()[-1])
        img = bg
    img = img.convert('RGB')
    w0, h0 = img.size
    k = size / max(w0, h0)
    w, h = round(w0 * k), round(h0 * k)
    canvas = Image.new('RGB', (size, size), (114, 114, 114))
    px, py = (size - w) // 2, (size - h) // 2
    canvas.paste(img.resize((w, h), Image.BILINEAR), (px, py))
    x = np.asarray(canvas, dtype=np.float32).transpose(2, 0, 1)[None] / 255.0
    out = session().run(None, {'images': x})[0][0]  # (5, N): cx, cy, w, h, score
    if out.shape[0] != 5 and out.shape[1] == 5:
        out = out.T
    cx, cy, bw, bh, sc = out
    keep = sc > thresh
    boxes = np.stack([cx - bw / 2, cy - bh / 2, cx + bw / 2, cy + bh / 2, sc], 1)[keep]
    # NMS
    boxes = boxes[np.argsort(-boxes[:, 4])]
    res = []
    while len(boxes):
        b = boxes[0]
        res.append(b)
        xx0 = np.maximum(b[0], boxes[1:, 0]); yy0 = np.maximum(b[1], boxes[1:, 1])
        xx1 = np.minimum(b[2], boxes[1:, 2]); yy1 = np.minimum(b[3], boxes[1:, 3])
        inter = np.clip(xx1 - xx0, 0, None) * np.clip(yy1 - yy0, 0, None)
        area = (b[2] - b[0]) * (b[3] - b[1]) + (boxes[1:, 2] - boxes[1:, 0]) * (boxes[1:, 3] - boxes[1:, 1]) - inter
        boxes = boxes[1:][inter / np.maximum(area, 1e-6) < 0.5]
    return [((b[0] - px) / k, (b[1] - py) / k, (b[2] - px) / k, (b[3] - py) / k, float(b[4])) for b in res]


def face_box(img):
    """Best face as (cx, cy, size) normalized; size = face height / image height."""
    found = detect(img)
    if not found:
        return None
    W, H = img.size
    # prefer confident faces near the top of the figure
    x0, y0, x1, y1, s = max(found, key=lambda b: b[4] - 0.3 * (b[1] / H))
    return [(x0 + x1) / 2 / W, (y0 + y1) / 2 / H, (y1 - y0) / H]


if __name__ == '__main__':
    import sys
    for p in sys.argv[1:]:
        print(p, face_box(Image.open(p)))
