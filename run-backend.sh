#!/usr/bin/env bash
# Starts the PausePay FastAPI backend (macOS / Linux / Git Bash).
set -euo pipefail
cd "$(dirname "$0")/backend"
export PYTHONIOENCODING=utf-8
PY=".venv/bin/python"; [ -x "$PY" ] || PY=".venv/Scripts/python.exe"
if [ ! -f models_store/intent_model.joblib ]; then
  "$PY" scripts/generate_dataset.py
  "$PY" scripts/train_model.py
fi
exec "$PY" -m uvicorn main:app --reload --port 8000
