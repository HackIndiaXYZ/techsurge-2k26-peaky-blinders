"""Loads the trained scikit-learn classifiers once and serves predictions."""

from __future__ import annotations

import json
import threading
from dataclasses import dataclass
from pathlib import Path

import joblib

from config import settings

INTENT_LABELS: dict[str, str] = {
    "PAYMENT_REQUEST": "Payment request",
    "REFUND_SCAM": "Refund / reversal request",
    "KYC_SCAM": "KYC / account verification demand",
    "PRIZE_SCAM": "Prize / reward claim",
    "IMPERSONATION": "Impersonation request",
    "URGENCY_PAYMENT": "Pressured payment demand",
    "INVESTMENT_SCAM": "Investment offer",
    "JOB_SCAM": "Job / task fee request",
    "MARKETPLACE_PAYMENT": "Marketplace payment",
    "QR_SCAM": "QR / collect-request trick",
    "BANK_REQUEST": "Bank notification",
    "BILL_PAYMENT": "Bill payment",
    "FRIEND_FAMILY_PAYMENT": "Friend / family transfer",
    "MERCHANT_PAYMENT": "Merchant payment",
    "NON_PAYMENT": "Not payment related",
}

# Intents whose *pattern* is a known scam script. Used by the risk engine as a
# base contribution; the classifier's probability scales it.
SCAM_INTENTS = {
    "KYC_SCAM", "REFUND_SCAM", "PRIZE_SCAM", "IMPERSONATION", "URGENCY_PAYMENT",
    "INVESTMENT_SCAM", "JOB_SCAM", "QR_SCAM",
}


@dataclass
class IntentPrediction:
    intent: str
    confidence: float
    probabilities: dict[str, float]
    fraud_probability: float
    is_payment_related: bool

    @property
    def label(self) -> str:
        return INTENT_LABELS.get(self.intent, self.intent.replace("_", " ").title())


class IntentDetector:
    def __init__(self, model_path: Path):
        self.model_path = model_path
        self._bundle: dict | None = None
        self._lock = threading.Lock()

    @property
    def loaded(self) -> bool:
        return self._bundle is not None

    @property
    def version(self) -> str | None:
        return self._bundle.get("version") if self._bundle else None

    def load(self) -> None:
        with self._lock:
            if self._bundle is None:
                if not self.model_path.exists():
                    raise FileNotFoundError(
                        f"Model file not found at {self.model_path}. Run `python scripts/generate_dataset.py` and `python scripts/train_model.py` first."
                    )
                self._bundle = joblib.load(self.model_path)

    def predict(self, text: str) -> IntentPrediction:
        if self._bundle is None:
            self.load()
        assert self._bundle is not None
        intent_model = self._bundle["intent_model"]
        fraud_model = self._bundle["fraud_model"]

        proba = intent_model.predict_proba([text])[0]
        classes = list(intent_model.classes_)
        probabilities = {cls: float(p) for cls, p in zip(classes, proba)}
        intent = max(probabilities, key=probabilities.get)
        fraud_probability = float(fraud_model.predict_proba([text])[0][1])
        return IntentPrediction(
            intent=intent,
            confidence=round(probabilities[intent], 4),
            probabilities=probabilities,
            fraud_probability=round(fraud_probability, 4),
            is_payment_related=intent != "NON_PAYMENT",
        )


detector = IntentDetector(settings.model_path)


def load_metrics() -> dict | None:
    metrics_path = settings.model_path.parent.parent / "data" / "model_metrics.json"
    if not metrics_path.exists():
        return None
    try:
        return json.loads(metrics_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return None
