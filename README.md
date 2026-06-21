# AgroMind

AI greenhouse intelligence platform. An autonomous scouting robot traverses a generated farm, classifies plant disease using a CV model, and updates a Bayesian belief map. A Markov Decision Process guides the robot toward disease clusters. A Fetch.ai agent reasons over the completed scan and delivers a structured farm health report.

---

## Architecture

```
frontend (Next.js :3000)
    ↕  REST
backend (FastAPI :8000)
    ↕  HTTP
Fetch.ai farm_analyst agent (:8001 uAgent protocol · :8002 REST companion)
    ↕  NVIDIA API
Nemotron (nvidia/llama-3.1-nemotron-nano-8b-v1)
```

---

## Prerequisites

- Windows 11 with WSL2 enabled (`wsl --install`)
- Node.js 20+ inside WSL2
- Python 3.12 inside WSL2
- NVIDIA API key (free tier at [build.nvidia.com](https://build.nvidia.com))

---

## 1 — Clone into WSL2

Always work from the WSL2 native filesystem to avoid Windows path-length issues with npm and pip.

```bash
# inside WSL2 terminal
git clone <repo-url> ~/agromind
cd ~/agromind
```

---

## 2 — Backend setup

```bash
cd ~/agromind/backend

# create venv
python3 -m venv ~/.venvs/agromind
source ~/.venvs/agromind/bin/activate

# install dependencies
pip install -r requirements.txt
```

Create `backend/.env`:

```env
NVIDIA_API_KEY=your_nvidia_api_key_here
FARM_ANALYST_URL=http://localhost:8002
```

---

## 3 — Frontend setup

```bash
cd ~/agromind/frontend
npm install
```

---

## Running

You need **three terminals** inside WSL2, all with the venv active.

### Terminal 1 — FastAPI backend

```bash
source ~/.venvs/agromind/bin/activate
cd ~/agromind/backend
uvicorn main:app --port 8000
```

### Terminal 2 — Fetch.ai farm analyst agent

```bash
source ~/.venvs/agromind/bin/activate
cd ~/agromind/backend
python -m agents.farm_analyst
```

The agent registers on Agentverse automatically. You will see its address logged:
```
farm_analyst online | address: agent1q...
```

### Terminal 3 — Frontend

```bash
cd ~/agromind/frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Usage

1. **Configure** — set greenhouse conditions (humidity, temperature, light, soil moisture) on the home screen and click **Launch Simulation**
2. **Scout** — on the dashboard, click **Run Agent Step** to move the robot one cell at a time, or **Auto Run** to let it traverse the full farm autonomously
3. **Analyse** — when all plants are inspected the Fetch.ai agent automatically reasons over the belief map and populates the **Recommendation** panel with a structured farm health report

The **Reveal Ground Truth** toggle shows the hidden disease distribution for comparison against the robot's belief map.

---

## API reference

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/farm/agent/step` | Run MDP on frontend belief grid, return next cell |
| `POST` | `/farm/analyze` | Delegate to Fetch.ai agent → Nemotron analysis |
| `POST` | `/cv/predict` | Classify a leaf image with the MobileNetV2 model |
| `GET`  | `/cv/health` | Verify CV model is loaded |
| `GET`  | `/farm/grid` | Current observed belief grid |
| `POST` | `/farm/reset` | Reset all observations |

Full interactive docs at `http://localhost:8000/docs`.

---

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NVIDIA_API_KEY` | Yes | NVIDIA NIM API key for Nemotron |
| `FARM_ANALYST_URL` | No | URL of the farm analyst companion API (default `http://localhost:8002`) |
| `FARM_ANALYST_SEED` | No | Deterministic seed for the Fetch.ai agent identity |
| `AGROMIND_CV_MODEL_PATH` | No | Override path to the `.keras` model file |
| `AGROMIND_CV_CLASSES_PATH` | No | Override path to `class_names.json` |
