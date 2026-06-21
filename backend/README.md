# AgroMind backend

The FastAPI backend now packages the trained four-class MobileNetV2 tomato classifier. The model is loaded once per process and used directly by the API; the frontend and MDP implementation do not need TensorFlow knowledge.

## WSL2 GPU setup

From PowerShell:

```powershell
wsl -d Ubuntu
cd /mnt/c/Users/monaz/Documents/GitHub/agromind/backend
bash scripts/setup_wsl.sh
source scripts/activate_wsl.sh
```

In later WSL sessions, only `source scripts/activate_wsl.sh` is needed.

## Run

```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

Interactive API documentation is at `http://localhost:8000/docs`.

### Classify without changing farm state

```bash
curl -X POST http://localhost:8000/cv/predict \
  -F "plantId=plant_042" \
  -F "file=@tests/sample_early_blight.jpg"
```

### Classify a robot visit and update the observed grid

```bash
curl -X POST "http://localhost:8000/farm/visit/image?row=2&col=3" \
  -F "plantId=plant_042" \
  -F "file=@tests/sample_early_blight.jpg"
```

The image-visit route stores the current fixed severity mapping as the grid score, then asks the existing MDP for the next cell. The value is a simulation disease-risk proxy, not measured lesion coverage.

## Endpoints

- `GET /cv/health` loads and verifies the model artifacts.
- `POST /cv/predict` returns `plantId`, `prediction`, `confidence`, and `severity`.
- `POST /farm/visit/image` additionally records severity in the observed grid and returns the existing route recommendation.
- Existing `/farm/*` simulation endpoints are unchanged.

Uploads must be readable images and are limited to 10 MB. Override packaged artifacts with `AGROMIND_CV_MODEL_PATH` and `AGROMIND_CV_CLASSES_PATH` if needed.

## Verification

```bash
ruff check .
python -m pytest -q
python -m scripts.benchmark_cv tests/sample_early_blight.jpg
```

The packaged model was trained on PlantVillage's four tomato classes. Its held-out PlantVillage test accuracy is 95.36% with 95.17% macro F1. Controlled-background accuracy should not be presented as real-greenhouse accuracy.
