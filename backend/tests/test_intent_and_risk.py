"""Classifier + risk engine behaviour (model must be trained: scripts/train_model.py)."""

import pytest

from services.entity_extractor import extract_entities
from services.intent_detector import detector
from services.risk_engine import assess_message, band_for

KYC = "Your KYC expires today. Pay ₹4,999 immediately to secureverify@upi or your account will be suspended."
PRIZE = "Congratulations! You won ₹25,000 cashback. Pay ₹499 processing fee to rewards.claim@upi to receive it."
LUNCH = "Send ₹300 for lunch to rahul@oksbi"
CHAT = "Went to the SBI branch for KYC today, took 40 minutes. Finally done."
REFUND = "I accidentally sent ₹5,000 to your number. Please return it immediately to refund.desk@ybl"


@pytest.fixture(scope="module", autouse=True)
def _load_model():
    detector.load()


def _assess(text):
    pred = detector.predict(text)
    return pred, assess_message(text, pred, extract_entities(text), known=[])


def test_intent_prediction_shape():
    pred = detector.predict(KYC)
    assert pred.intent == "KYC_SCAM"
    assert 0.0 < pred.confidence <= 1.0
    assert pred.is_payment_related is True
    assert abs(sum(pred.probabilities.values()) - 1.0) < 1e-6


@pytest.mark.parametrize(
    "text,intent",
    [(KYC, "KYC_SCAM"), (PRIZE, "PRIZE_SCAM"), (LUNCH, "PAYMENT_REQUEST"), (CHAT, "NON_PAYMENT"), (REFUND, "REFUND_SCAM")],
)
def test_intent_examples(text, intent):
    assert detector.predict(text).intent == intent


def test_kyc_message_is_high_risk_with_named_signals():
    _, a = _assess(KYC)
    assert a.band == "HIGH" and a.score >= 65
    codes = a.signal_codes()
    assert {"SCAM_PATTERN", "URGENCY", "KYC_LANGUAGE"} <= codes


def test_prize_message_is_high_risk():
    _, a = _assess(PRIZE)
    assert a.band == "HIGH"
    assert "UPFRONT_FEE" in a.signal_codes()


def test_legit_payment_request_is_low():
    _, a = _assess(LUNCH)
    assert a.band == "LOW" and a.score < 20


def test_non_payment_chat_with_kyc_word_stays_low():
    _, a = _assess(CHAT)
    assert a.is_payment_related is False
    assert a.band == "LOW"


def test_legit_urgent_hospital_deposit_is_not_high():
    text = "Lakeview Hospital: admission deposit of ₹18,000 for patient Suresh K is due today so the admission can be completed. Pay to UPI lakeviewhospital@icici. Receipt will be issued."
    _, a = _assess(text)
    assert a.band != "HIGH"


def test_scoring_is_deterministic():
    _, a1 = _assess(KYC)
    _, a2 = _assess(KYC)
    assert a1.score == a2.score and [s.code for s in a1.signals] == [s.code for s in a2.signals]


def test_band_thresholds():
    assert band_for(0) == "LOW" and band_for(34) == "LOW"
    assert band_for(35) == "MEDIUM" and band_for(64) == "MEDIUM"
    assert band_for(65) == "HIGH" and band_for(100) == "HIGH"


def test_rule_override_when_classifier_misses_payment():
    """Concrete evidence (verb + amount + handle) marks a message payment-related even if the model says otherwise."""
    from services.intent_detector import IntentPrediction

    text = "ok cool. send 250 to arjun@oksbi"
    fake = IntentPrediction(intent="NON_PAYMENT", confidence=0.6, probabilities={"NON_PAYMENT": 0.6}, fraud_probability=0.05, is_payment_related=False)
    a = assess_message(text, fake, extract_entities(text), known=[])
    assert a.is_payment_related is True
    assert a.band == "LOW"
