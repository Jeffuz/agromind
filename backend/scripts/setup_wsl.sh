#!/usr/bin/env bash
set -euo pipefail

VENV_PATH="${HOME}/.venvs/agromind-backend"
python3 -m venv "${VENV_PATH}"
source "${VENV_PATH}/bin/activate"
python -m pip install --upgrade pip setuptools wheel
python -m pip install -r requirements-gpu.txt
python -m pip install pytest httpx ruff
source scripts/activate_wsl.sh

python -c "import tensorflow as tf; print('TensorFlow:', tf.__version__); print('GPUs:', tf.config.list_physical_devices('GPU'))"
echo "Backend environment ready. Activate it with: source scripts/activate_wsl.sh"

