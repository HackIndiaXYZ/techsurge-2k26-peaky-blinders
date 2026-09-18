# Starts the PausePay FastAPI backend (Windows PowerShell). Run once: python -m venv backend\.venv; backend\.venv\Scripts\pip install -r backend\requirements.txt
Set-Location "$PSScriptRoot\backend"
$env:PYTHONIOENCODING = "utf-8"
if (-not (Test-Path "models_store\intent_model.joblib")) {
  .\.venv\Scripts\python.exe scripts\generate_dataset.py
  .\.venv\Scripts\python.exe scripts\train_model.py
}
.\.venv\Scripts\python.exe -m uvicorn main:app --reload --port 8000
