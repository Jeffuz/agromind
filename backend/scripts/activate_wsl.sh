#!/usr/bin/env bash
# Source this file from backend/: source scripts/activate_wsl.sh
source "${HOME}/.venvs/agromind-backend/bin/activate"

SITE_PACKAGES="$(python -c 'import site; print(site.getsitepackages()[0])')"
NVIDIA_ROOT="${SITE_PACKAGES}/nvidia"
if [[ -d "${NVIDIA_ROOT}" ]]; then
  NVIDIA_LIB_DIRS="$(find "${NVIDIA_ROOT}" -type d -name lib -print | paste -sd: -)"
  export LD_LIBRARY_PATH="${NVIDIA_LIB_DIRS}${LD_LIBRARY_PATH:+:${LD_LIBRARY_PATH}}"
  export PATH="${NVIDIA_ROOT}/cuda_nvcc/bin:${PATH}"
  export XLA_FLAGS="--xla_gpu_cuda_data_dir=${NVIDIA_ROOT}/cuda_nvcc"
fi

