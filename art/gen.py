"""Batch image generation with Animagine XL 4.0 (SDXL) on a 6 GB GPU.

    python art/gen.py plan                 # write the job list (out/jobs.json) from bible.py
    python art/gen.py run [--only PREFIX]  # generate missing candidates (resumable)
    python art/gen.py one ID SEED          # regenerate one candidate with a given seed

Outputs: <ART>/out/raw/<job id>/<seed>.png  (ART = C:/Users/a2105/lexica-art unless $LEXICA_ART is set)
"""
import hashlib
import json
import os
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import bible as B  # noqa: E402

ART = Path(os.environ.get('LEXICA_ART', 'C:/Users/a2105/lexica-art'))
MODEL = ART / 'models' / 'animagine-xl-4.0'
RAW = ART / 'out' / 'raw'
JOBS = ART / 'out' / 'jobs.json'
LOG = ART / 'out' / 'gen.log'

CHAR_TAIL = 'safe, full body, standing, looking at viewer, white background, simple background, official art, ' + B.QUALITY
CHIBI_TAIL = 'safe, chibi, full body, standing, white background, simple background, ' + B.QUALITY
HUMANOID = {'harpy', 'harpyQueen', 'silentia'}
# jobs that needed extra candidates after review (new prompt or messy cut-outs): id -> total candidates
REDO = {'hero.onyx.main': 4, 'hero.quake.chibi': 4}


_tok = None


def tokens(text):
    """CLIP token count (needs transformers, i.e. the art venv); falls back to a word-count estimate."""
    global _tok
    try:
        if _tok is None:
            from transformers import CLIPTokenizer
            _tok = CLIPTokenizer.from_pretrained(str(MODEL / 'tokenizer'))
        return len(_tok(text)['input_ids']) - 2
    except Exception:
        return int(len(text.replace(',', ' , ').split()) * 1.25)


def fit_prompt(make, design, limit=75):
    """Shrink `design` until make(design) fits: first drop effect tags, then trailing tags."""
    tags = [t.strip() for t in design.split(',') if t.strip()]
    if tokens(make(', '.join(tags))) <= limit:
        return make(', '.join(tags))
    tags = [t for t in tags if not any(w in t for w in B.EFFECT_WORDS)] or tags
    while len(tags) > 3 and tokens(make(', '.join(tags))) > limit:
        tags.pop()
    return make(', '.join(tags))


def seed_for(job_id, k):
    return int(hashlib.md5(f'{job_id}:{k}'.encode()).hexdigest()[:8], 16) % 2_000_000_000


# monster combos whose first painting failed the cut-out (empty mask, or the backdrop came along)
MON_REDO = {'golem.earth', 'golem.light', 'kraken.water', 'slime.fire', 'sprite.water', 'treantElder.earth', 'gargoyle.dark',
            'gargoyle.earth', 'wolf.wind', 'treant.earth', 'wisp.fire', 'armor.earth'}

# key poses whose first two paintings were rejected (a backdrop came along / the design tags were cut and the
# character lost its face to a helmet / the body was drawn at other proportions than the idle chibi, so the figure
# grew or shrank on every pose swap / the outfit differed from the idle): hand-shortened prompts, more seeds and a
# stricter negative. Candidates are then ranked by how well their proportions match the idle chibi.
POSE_REDO = {
    'hero.frost.cast': ('1girl, solo, chibi, hunter girl, short white hair, light blue eyes, fur-trimmed hood, blue fur coat, '
                        'holding crossbow, power up, glowing aura, ice magic, arms raised, intense, safe, full body, centered',
                        'scenery, landscape, mountain, building, close-up, portrait'),
    'hero.onyx.atk': ('1boy, solo, chibi, knight, short dark grey hair, amber eyes, dark grey plate armor, gold trim, dark cape, '
                      'holding tower shield, shield bash, lunging forward, dynamic pose, safe, full body, centered',
                      'helmet, covered face, realistic, tall'),
    'hero.onyx.cast': ('1boy, solo, chibi, knight, short dark grey hair, amber eyes, dark grey plate armor, gold trim, dark cape, '
                       'holding tower shield, power up, glowing aura, clenched fist, determined, safe, full body, standing, centered',
                       'helmet, covered face, realistic, tall, shield above head'),
    'hero.abyss.atk': ('1boy, solo, chibi, demon lord, long white hair, red eyes, horns, black and purple royal coat with gold trim, '
                       'dark cape, holding dark orb, thrusting dark orb forward, casting spell, dynamic pose, safe, full body, centered',
                       'dark background, black background, scenery, smoke, darkness, realistic, tall'),
    'hero.aurora.atk': ('1girl, solo, chibi, saint, long wavy platinum blonde hair, golden eyes, halo, tiara, white robe with gold trim, '
                        'white angel wings, holding golden sun staff, raising staff, casting holy light, dynamic pose, safe, full body, centered',
                        'scenery, light rays, sunburst'),
    # Breeze's painting and idle chibi wear a red top, navy skirt and white-and-orange cap (not the blue outfit of the brief)
    'hero.breeze.atk': ('1girl, solo, chibi, courier girl, short yellow-green hair, green eyes, white baseball cap, orange brim, red jacket, '
                        'navy skirt, teal shoulder bag, sneakers, holding slingshot, shooting slingshot, dynamic pose, safe, full body, centered',
                        'blue jacket, blue shirt, blue dress, blue headwear, red headwear'),
    'hero.breeze.cast': ('1girl, solo, chibi, courier girl, short yellow-green hair, green eyes, white and orange baseball cap, red jacket, '
                         'navy skirt, teal shoulder bag, sneakers, holding slingshot, power up, glowing aura, arms raised, safe, full body, centered',
                         'blue jacket, blue shirt, blue dress, blue headwear'),
    'hero.breeze.hurt': ('1girl, solo, chibi, courier girl, short yellow-green hair, green eyes, white and orange baseball cap, red jacket, '
                         'navy skirt, teal shoulder bag, sneakers, hurt, flinching, eyes closed, recoiling, safe, full body, centered',
                         'blue jacket, blue shirt, blue dress, blue headwear'),
}
POSE_MORE = {'hero.breeze.atk': 4}  # second round after the first one kept painting a red cap


def plan():
    jobs = []

    def add(jid, prompt, size, n, neg=B.NEG, cfg=5.0, steps=28, group=''):
        jobs.append({'id': jid, 'prompt': prompt, 'neg': neg, 'w': size[0], 'h': size[1], 'n': n,
                     'cfg': cfg, 'steps': steps, 'group': group or jid.split('.')[0]})

    # priority order: hero paintings (the selling point), scenes, battle sprites, bosses, monsters, effects, skins
    for hid, (subj, design, _) in B.HEROES.items():
        add(f'hero.{hid}.main', f'{subj}, solo, {design}, {CHAR_TAIL}', (832, 1216), REDO.get(f'hero.{hid}.main', 2), group=f'hero.{hid}')
    for sid, (tags, size) in B.SCENES.items():
        add(f'bg.{sid}', f'no humans, scenery, {tags}, fantasy, highly detailed, {B.QUALITY}', size, 2, neg=B.NEG_SCENE, cfg=6.0, group='bg')
    for hid, (subj, design, _) in B.HEROES.items():
        cd = B.CHIBI_DESIGN.get(hid, design)
        add(f'hero.{hid}.chibi', f'{subj}, solo, {cd}, {CHIBI_TAIL}', (896, 896), REDO.get(f'hero.{hid}.chibi', 2), steps=24, group=f'hero.{hid}')
    # battle animation key poses (attack / ultimate cast / hurt), same design tags as the idle chibi
    for pose, fn in B.POSES.items():
        for hid, (subj, design, _) in B.HEROES.items():
            d0 = design if pose == 'atk' else ', '.join(t for t in design.split(', ') if not any(w in t for w in B.EXPRESSION_WORDS))
            prompt = fit_prompt(lambda d: f'{subj}, solo, chibi, {d}, {fn(hid)}, safe, full body, white background, simple background, {B.QUALITY}', d0)
            redo = POSE_REDO.get(f'hero.{hid}.{pose}')
            if redo:  # seeds 0-1 keep the old prompt's paintings; 2-5 (and the extra rounds of POSE_MORE) are new
                add(f'hero.{hid}.{pose}', f'{redo[0]}, white background, simple background, {B.QUALITY}', (896, 896), 6 + POSE_MORE.get(f'hero.{hid}.{pose}', 0),
                    neg=f'{B.NEG}, {redo[1]}', steps=24, group=f'hero.{hid}')
                continue
            add(f'hero.{hid}.{pose}', prompt, (896, 896), 2, steps=24, group=f'hero.{hid}')
    combos = json.loads((Path(__file__).parent / 'enemy_combos.json').read_text(encoding='utf-8'))
    combos.sort(key=lambda c: 0 if B.MONSTERS[c.split(':')[0]].endswith('boss') or ', boss' in B.MONSTERS[c.split(':')[0]] else 1)
    for combo in combos:
        eid, el = combo.split(':')
        tags = B.MONSTERS[eid]
        subj = '1girl, solo' if eid in HUMANOID else 'no humans'
        boss = tags.endswith('boss') or ', boss' in tags
        size = (1216, 832) if eid in ('flameDrake', 'frostWyrm', 'kraken') else (1024, 1024)
        redo = f'{eid}.{el}' in MON_REDO  # first try could not be cut out cleanly: more seeds, isolated on plain white
        extra = ', solo, single monster, isolated, centered, plain white background' if redo else ''
        add(f'mon.{eid}.{el}', f'{subj}, {tags}, {B.ELEMENT_TAGS[el]}, safe, full body, white background, simple background, fantasy{extra}, {B.QUALITY}',
            size, (4 if boss else 3) if redo else (2 if boss else 1), cfg=5.5, steps=24, group=f'mon.{eid}')
    for fid, tags in B.FX.items():
        add(f'fx.{fid}', f'no humans, {tags}, black background, simple background, {B.QUALITY}', (896, 896), 1, neg=B.NEG_FX, cfg=6.0, steps=24, group='fx')
    for hid, (subj, _, skin) in B.HEROES.items():
        add(f'hero.{hid}.skin', f'{subj}, solo, {skin}, {CHAR_TAIL}', (832, 1216), 1, group=f'skin.{hid}')
    for hid, (subj, _, skin) in B.HEROES.items():
        add(f'hero.{hid}.skinchibi', f'{subj}, solo, {skin}, {CHIBI_TAIL}', (896, 896), 1, steps=24, group=f'skin.{hid}')
    JOBS.parent.mkdir(parents=True, exist_ok=True)
    JOBS.write_text(json.dumps(jobs, ensure_ascii=False, indent=1), encoding='utf-8')
    print(f'{len(jobs)} jobs, {sum(j["n"] for j in jobs)} images -> {JOBS}')


_pipe = None


def pipe():
    global _pipe
    if _pipe is not None:
        return _pipe
    import torch
    from diffusers import EulerAncestralDiscreteScheduler, StableDiffusionXLPipeline
    torch.backends.cuda.matmul.allow_tf32 = True
    p = StableDiffusionXLPipeline.from_pretrained(str(MODEL), dtype=torch.float16, use_safetensors=True)
    p.scheduler = EulerAncestralDiscreteScheduler.from_config(p.scheduler.config)
    try:  # fp8 weight storage halves the UNet's VRAM (5.1 -> 2.6 GB); compute stays fp16
        p.unet.enable_layerwise_casting(storage_dtype=torch.float8_e4m3fn, compute_dtype=torch.float16)
    except Exception as e:  # older diffusers
        print('layerwise casting unavailable:', e)
    if os.environ.get('LEXICA_RESIDENT') == '1':
        p.to('cuda')  # whole pipeline stays in VRAM (~4.7 GB peak): no per-image CPU<->GPU weight traffic
    else:
        p.enable_model_cpu_offload()
    p.vae.enable_tiling()
    p.set_progress_bar_config(disable=True)
    _pipe = p
    return p


def render(job, seed, dest):
    import torch
    g = torch.Generator('cpu').manual_seed(seed)
    img = pipe()(prompt=job['prompt'], negative_prompt=job['neg'], width=job['w'], height=job['h'],
                 num_inference_steps=job['steps'], guidance_scale=job['cfg'], generator=g).images[0]
    from PIL.PngImagePlugin import PngInfo
    meta = PngInfo()
    meta.add_text('parameters', json.dumps({'prompt': job['prompt'], 'neg': job['neg'], 'seed': seed, 'cfg': job['cfg'], 'steps': job['steps']}))
    dest.parent.mkdir(parents=True, exist_ok=True)
    tmp = dest.with_suffix('.tmp.png')
    img.save(tmp, pnginfo=meta)
    tmp.replace(dest)


def log(msg):
    line = f'[{time.strftime("%H:%M:%S")}] {msg}'
    print(line, flush=True)
    with LOG.open('a', encoding='utf-8') as f:
        f.write(line + '\n')


def run(only=None):
    jobs = json.loads(JOBS.read_text(encoding='utf-8'))
    todo = []
    for j in jobs:
        if only and not any(j['id'].startswith(o) for o in only):
            continue
        for k in range(j['n']):
            s = seed_for(j['id'], k)
            dest = RAW / j['id'] / f'{s}.png'
            if not dest.exists():
                todo.append((j, s, dest))
    log(f'{len(todo)} images to render')
    t0 = time.time()
    for i, (j, s, dest) in enumerate(todo):
        t = time.time()
        try:
            render(j, s, dest)
        except Exception as e:  # keep going; a failed image can be retried later
            log(f'FAIL {j["id"]} {s}: {e!r}')
            continue
        avg = (time.time() - t0) / (i + 1)
        log(f'{i + 1}/{len(todo)} {j["id"]} seed {s}  {time.time() - t:.1f}s  (eta {avg * (len(todo) - i - 1) / 60:.0f} min)')
    log('run done')


if __name__ == '__main__':
    cmd = sys.argv[1] if len(sys.argv) > 1 else 'plan'
    if cmd == 'plan':
        plan()
    elif cmd == 'run':
        only = sys.argv[sys.argv.index('--only') + 1].split(',') if '--only' in sys.argv else None
        run(only)
    elif cmd == 'one':
        jobs = {j['id']: j for j in json.loads(JOBS.read_text(encoding='utf-8'))}
        jid, seed = sys.argv[2], int(sys.argv[3])
        render(jobs[jid], seed, RAW / jid / f'{seed}.png')
        print('ok')
