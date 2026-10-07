#!/bin/bash
# LEXICA art toolkit: Python 3.12 venv + PyTorch CUDA + diffusers + Animagine XL 4.0 + anime segmentation model.
set -e
ART=/c/Users/a2105/lexica-art
UV="C:/Users/a2105/AppData/Local/Programs/Python/Python39/Scripts/uv.exe"
export UV_NO_CACHE=1
export UV_PYTHON_INSTALL_DIR="$ART/python"
cd "$ART"
echo "[$(date +%T)] python 3.12"
"$UV" python install 3.12
"$UV" venv "$ART/venv" --python 3.12 --seed
PY="$ART/venv/Scripts/python.exe"
echo "[$(date +%T)] torch (cu126)"
"$UV" pip install --python "$PY" torch==2.9.1 --index-url https://download.pytorch.org/whl/cu126
echo "[$(date +%T)] diffusers stack"
"$UV" pip install --python "$PY" diffusers transformers accelerate safetensors huggingface_hub pillow numpy onnxruntime
echo "[$(date +%T)] model: animagine-xl-4.0 (diffusers folders, ~7 GB)"
"$PY" - <<'PYEOF'
from huggingface_hub import snapshot_download, hf_hub_download
p = snapshot_download('cagliostrolab/animagine-xl-4.0', local_dir='C:/Users/a2105/lexica-art/models/animagine-xl-4.0',
    allow_patterns=['model_index.json', 'scheduler/*', 'tokenizer/*', 'tokenizer_2/*', 'text_encoder/*', 'text_encoder_2/*', 'unet/*', 'vae/*'])
print('model ->', p)
q = hf_hub_download('skytnt/anime-seg', 'isnetis.onnx', local_dir='C:/Users/a2105/lexica-art/models')
print('seg ->', q)
PYEOF
echo "[$(date +%T)] check"
"$PY" -c "import torch, diffusers; print('torch', torch.__version__, 'cuda', torch.cuda.is_available(), torch.cuda.get_device_name(0) if torch.cuda.is_available() else '-'); print('diffusers', diffusers.__version__)"
du -sh "$ART"
echo "[$(date +%T)] DONE"
