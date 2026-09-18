from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from config import settings
from database import get_db
from schemas import HealthResponse
from services.intent_detector import detector, load_metrics

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse)
def health(db: Session = Depends(get_db)) -> HealthResponse:
    try:
        db.execute(text("SELECT 1"))
        database = "ok"
    except Exception as exc:  # pragma: no cover - defensive
        database = f"error: {exc.__class__.__name__}"
    metrics = load_metrics()
    compact = None
    if metrics:
        compact = {
            "model_version": metrics.get("model_version"),
            "dataset_rows": metrics.get("dataset", {}).get("rows"),
            "intent_accuracy": metrics.get("intent", {}).get("accuracy"),
            "intent_f1_macro": metrics.get("intent", {}).get("f1_macro"),
            "fraud_precision": metrics.get("fraud", {}).get("precision"),
            "fraud_recall": metrics.get("fraud", {}).get("recall"),
            "holdout": metrics.get("holdout"),
            "avg_inference_latency_ms": metrics.get("avg_inference_latency_ms"),
        }
    return HealthResponse(
        status="ok" if detector.loaded and database == "ok" else "degraded",
        model_loaded=detector.loaded,
        model_version=detector.version,
        engine_version=settings.engine_version,
        database=database,
        metrics=compact,
    )
