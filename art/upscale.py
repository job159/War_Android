"""2x super-resolution for the illustrations: Real-ESRGAN x4plus anime 6B (BSD-3), run tiled on the GPU,
then downscaled to 2x for clean lines.

    python art/upscale.py IN.png OUT.png          # one file
    python art/upscale.py --picks [PREFIX ...]     # every picked hero main/skin painting -> <ART>/out/up/<id>/<seed>.png
"""
import json
import sys
from pathlib import Path

import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
from PIL import Image

ART = Path('C:/Users/a2105/lexica-art')
WEIGHTS = ART / 'models' / 'RealESRGAN_x4plus_anime_6B.pth'
URL = 'https://github.com/xinntao/Real-ESRGAN/releases/download/v0.2.2.4/RealESRGAN_x4plus_anime_6B.pth'


class RDB(nn.Module):
    def __init__(self, nf=64, gc=32):
        super().__init__()
        self.conv1 = nn.Conv2d(nf, gc, 3, 1, 1)
        self.conv2 = nn.Conv2d(nf + gc, gc, 3, 1, 1)
        self.conv3 = nn.Conv2d(nf + 2 * gc, gc, 3, 1, 1)
        self.conv4 = nn.Conv2d(nf + 3 * gc, gc, 3, 1, 1)
        self.conv5 = nn.Conv2d(nf + 4 * gc, nf, 3, 1, 1)
        self.lrelu = nn.LeakyReLU(0.2, True)

    def forward(self, x):
        x1 = self.lrelu(self.conv1(x))
        x2 = self.lrelu(self.conv2(torch.cat((x, x1), 1)))
        x3 = self.lrelu(self.conv3(torch.cat((x, x1, x2), 1)))
        x4 = self.lrelu(self.conv4(torch.cat((x, x1, x2, x3), 1)))
        return self.conv5(torch.cat((x, x1, x2, x3, x4), 1)) * 0.2 + x


class RRDB(nn.Module):
    def __init__(self, nf, gc=32):
        super().__init__()
        self.rdb1, self.rdb2, self.rdb3 = RDB(nf, gc), RDB(nf, gc), RDB(nf, gc)

    def forward(self, x):
        return self.rdb3(self.rdb2(self.rdb1(x))) * 0.2 + x


class RRDBNet(nn.Module):
    def __init__(self, nf=64, nb=6, gc=32):
        super().__init__()
        self.conv_first = nn.Conv2d(3, nf, 3, 1, 1)
        self.body = nn.Sequential(*[RRDB(nf, gc) for _ in range(nb)])
        self.conv_body = nn.Conv2d(nf, nf, 3, 1, 1)
        self.conv_up1 = nn.Conv2d(nf, nf, 3, 1, 1)
        self.conv_up2 = nn.Conv2d(nf, nf, 3, 1, 1)
        self.conv_hr = nn.Conv2d(nf, nf, 3, 1, 1)
        self.conv_last = nn.Conv2d(nf, 3, 3, 1, 1)
        self.lrelu = nn.LeakyReLU(0.2, True)

    def forward(self, x):
        feat = self.conv_first(x)
        feat = feat + self.conv_body(self.body(feat))
        feat = self.lrelu(self.conv_up1(F.interpolate(feat, scale_factor=2, mode='nearest')))
        feat = self.lrelu(self.conv_up2(F.interpolate(feat, scale_factor=2, mode='nearest')))
        return self.conv_last(self.lrelu(self.conv_hr(feat)))


_net = None


def net():
    global _net
    if _net is None:
        if not WEIGHTS.exists():
            import urllib.request
            urllib.request.urlretrieve(URL, WEIGHTS)
        m = RRDBNet()
        sd = torch.load(WEIGHTS, map_location='cpu', weights_only=True)
        m.load_state_dict(sd.get('params_ema', sd.get('params', sd)))
        _net = m.eval().half().cuda()
    return _net


@torch.no_grad()
def upscale4(img, tile=256, pad=16):
    """RGB PIL -> RGB PIL at 4x, processed in overlapping tiles to fit any GPU."""
    x = torch.from_numpy(np.asarray(img.convert('RGB'), dtype=np.float32) / 255.0).permute(2, 0, 1)[None].half().cuda()
    _, _, H, W = x.shape
    out = torch.zeros((1, 3, H * 4, W * 4), dtype=torch.float16, device='cuda')
    for y0 in range(0, H, tile):
        for x0 in range(0, W, tile):
            y1, x1 = min(H, y0 + tile), min(W, x0 + tile)
            ya, xa, yb, xb = max(0, y0 - pad), max(0, x0 - pad), min(H, y1 + pad), min(W, x1 + pad)
            o = net()(x[:, :, ya:yb, xa:xb])
            out[:, :, y0 * 4:y1 * 4, x0 * 4:x1 * 4] = o[:, :, (y0 - ya) * 4:(y0 - ya + y1 - y0) * 4, (x0 - xa) * 4:(x0 - xa + x1 - x0) * 4]
    arr = (out[0].float().clamp(0, 1).permute(1, 2, 0).cpu().numpy() * 255).round().astype(np.uint8)
    return Image.fromarray(arr)


def upscale2(img):
    big = upscale4(img)
    return big.resize((img.width * 2, img.height * 2), Image.LANCZOS)


def run_picks(prefixes):
    picks = json.loads((Path(__file__).parent / 'picks.json').read_text(encoding='utf-8'))
    for jid, p in picks.items():
        seed = p['seed'] if isinstance(p, dict) else p
        if not (jid.endswith('.main') or jid.endswith('.skin') or jid.startswith('bg.')):
            continue
        if prefixes and not any(jid.startswith(x) for x in prefixes):
            continue
        dst = ART / 'out' / 'up' / jid / f'{seed}.png'
        if dst.exists():
            continue
        src = ART / 'out' / 'raw' / jid / f'{seed}.png'
        dst.parent.mkdir(parents=True, exist_ok=True)
        upscale2(Image.open(src)).save(dst)
        print('up', jid, seed, flush=True)


if __name__ == '__main__':
    if sys.argv[1] == '--picks':
        run_picks(sys.argv[2:])
    else:
        upscale2(Image.open(sys.argv[1])).save(sys.argv[2])
        print(sys.argv[2])
