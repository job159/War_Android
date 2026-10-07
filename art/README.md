# 美術生產線（AI 繪製＋美術總監挑選）

遊戲中的角色立繪、戰鬥 Q 版、怪物、場景與特效貼圖，都是用這個資料夾的腳本在本機產生的。
流程：**設定集（提示詞）→ 批次生成候選圖 → 人工挑選 → 超解析 → 去背／臉部定位／裁切 → WebP → `game/assets/`**。

## 工具與授權

| 用途 | 模型／工具 | 授權 |
| --- | --- | --- |
| 繪圖 | [Animagine XL 4.0](https://huggingface.co/cagliostrolab/animagine-xl-4.0)（SDXL 動漫模型） | CreativeML Open RAIL++-M（生成的圖可用於遊戲） |
| 去背 | [skytnt/anime-seg](https://huggingface.co/skytnt/anime-seg)（ISNet） | Apache-2.0 |
| 臉部定位 | [deepghs/anime_face_detection](https://huggingface.co/deepghs/anime_face_detection)（YOLOv8） | MIT |
| 超解析 | [Real-ESRGAN x4plus anime 6B](https://github.com/xinntao/Real-ESRGAN) | BSD-3-Clause |

工具與模型裝在 `C:\Users\<你>\lexica-art\`（約 12.5 GB，不在專案裡）；需要 NVIDIA 顯卡（6 GB 顯存即可，UNet 以 fp8 儲存）。
用完可以整個資料夾刪除；之後要新增角色時，重新執行安裝即可（見下方）。

## 檔案

| 檔案 | 說明 |
| --- | --- |
| `bible.py` | **美術設定集**：每位角色的外觀、時裝、怪物、場景、特效的提示詞（Animagine 標籤寫法） |
| `gen.py` | 批次生成：`plan` 產生工作清單、`run` 生成缺少的候選圖（可中斷續跑）、`one ID SEED` 重畫一張 |
| `sheet.py` | 審圖用拼版：`python art/sheet.py hero.aurora.` |
| `picks.json` | 美術總監的選圖：`工作 id → seed`，可加 `{"seed":…, "face":[cx,cy,size], "flip":true}` 手動修正 |
| `upscale.py` | 立繪 2 倍超解析（`--picks` 處理所有選中的立繪） |
| `seg.py` / `face.py` | 去背、臉部偵測 |
| `proportions.py` | 戰鬥姿勢的比例檢查：每張候選圖與待機 Q 版在「頭一樣大」時，整個人看起來大幾倍（g，1.0 最理想；超出 0.84～1.2 時戰鬥人偶只好縮放頭部），挑攻擊／施法／受擊姿勢時先用它篩選 |
| `post.py` | 把選圖輸出成 `game/assets/`（立繪、頭像、半身卡、Q 版、怪物、場景、特效）與 `manifest.json` |
| `enemy_combos.json` | 關卡實際用到的「怪物 × 屬性」組合 |

## 常用流程

```bash
# 環境（第一次）：Python 3.12 venv + PyTorch CUDA + diffusers + 模型
bash art/setup.sh

PY=~/lexica-art/venv/Scripts/python.exe
$PY art/gen.py plan                      # 依 bible.py 產生工作清單
$PY art/gen.py run                       # 生成全部候選圖（約 40 秒／張）
$PY art/gen.py run --only hero.aurora    # 只生成某些工作
$PY art/sheet.py hero.aurora. hero.valor.  # 拼版審圖
$PY art/proportions.py aurora.atk          # 戰鬥姿勢候選圖與待機 Q 版的比例（g）
# 把選中的 seed 寫進 art/picks.json
$PY art/upscale.py --picks               # 立繪 2 倍超解析
$PY art/post.py                          # 輸出到 game/assets/ 並更新 manifest.json
```

遊戲在執行時讀取 `game/assets/manifest.json`：有手繪素材就使用，沒有就退回程式繪製的角色，所以可以一個一個角色逐步替換。

## 新增角色

1. 在 `game/src/core/data/heroes.js` 加角色資料。
2. 在 `bible.py` 的 `HEROES` 加外觀與時裝描述（英文標籤，約 45 個 token 以內）。
3. `gen.py plan` → `gen.py run --only hero.<id>` → 審圖、寫入 `picks.json` → `upscale.py --picks` → `post.py hero.<id>`。
