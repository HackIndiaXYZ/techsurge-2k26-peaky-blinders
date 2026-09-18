"""Deterministic, explainable risk scoring for messages and payments.

Every contribution is a named signal with an integer weight. The score is the
capped sum of weights; the band is a fixed threshold on the score. There is no
randomness anywhere in this module.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field

from models import IdentifierRisk
from services.entity_extractor import ExtractedEntities, format_inr
from services.intent_detector import INTENT_LABELS, SCAM_INTENTS, IntentPrediction

LOW_MAX = 34      # 0-34  LOW
MEDIUM_MAX = 64   # 35-64 MEDIUM, 65+ HIGH

_REQUEST_RE = re.compile(r"\b(pay|send|transfer|deposit|bhej|bhejo|bhejna|bhej do|de do|de dena|dena|remit)\b", re.IGNORECASE)
_CREDENTIAL_RE = re.compile(r"\b(upi pin|pin|otp|cvv|password|mpin)\b", re.IGNORECASE)
_ACCOUNT_THREAT_RE = re.compile(r"(will be|be) (blocked|suspended|deactivated|disconnected|frozen|closed)|band ho jayega|block ho jayega|permanently blocked|legal action|face arrest|avoid arrest", re.IGNORECASE)
_RECEIVE_TRICK_RE = re.compile(r"(scan|enter|approve|accept)[^.]{0,40}(pin|qr|request|collect)[^.]{0,40}(receive|get|credited|aa jayega)|(receive|get)[^.]{0,30}(scan|enter (your )?pin)", re.IGNORECASE)


@dataclass
class Signal:
    code: str
    label: str
    weight: int

    def to_dict(self) -> dict:
        return {"code": self.code, "label": self.label, "weight": self.weight}


@dataclass
class RiskAssessment:
    score: int
    band: str
    signals: list[Signal] = field(default_factory=list)
    is_payment_related: bool = False

    def signal_codes(self) -> set[str]:
        return {s.code for s in self.signals}


def band_for(score: int) -> str:
    if score <= LOW_MAX:
        return "LOW"
    if score <= MEDIUM_MAX:
        return "MEDIUM"
    return "HIGH"


def _identifier_band_label(record: IdentifierRisk) -> str:
    kind = "UPI ID" if record.identifier_type == "UPI" else "number"
    if record.status == "CONFIRMED_FRAUD":
        return f"This {kind} is on the confirmed-fraud list ({record.report_count} reports)"
    if record.report_count >= 1 and record.suspicious_message_count >= 1:
        return f"This {kind} has {record.report_count} fraud report(s) and appeared in {record.suspicious_message_count} suspicious message(s)"
    if record.report_count >= 1:
        return f"This {kind} has {record.report_count} fraud report(s)"
    return f"This {kind} appeared in {record.suspicious_message_count} earlier suspicious message(s)"


# Identifier evidence weighs more at payment time: the message text is not
# available there, so stored history is the main evidence.
_IDENTIFIER_WEIGHTS = {
    "message": {"CONFIRMED_FRAUD": 35, "HIGH_RISK": 25, "SUSPICIOUS": 12},
    "payment": {"CONFIRMED_FRAUD": 70, "HIGH_RISK": 45, "SUSPICIOUS": 20},
}


def identifier_signals(records: list[IdentifierRisk], context: str = "message") -> list[Signal]:
    """Signals contributed by what we already know about the identifiers in play."""
    weights = _IDENTIFIER_WEIGHTS[context]
    signals: list[Signal] = []
    for record in records:
        if record.status == "CONFIRMED_FRAUD":
            signals.append(Signal("IDENTIFIER_CONFIRMED_FRAUD", _identifier_band_label(record), weights["CONFIRMED_FRAUD"]))
        elif record.risk_band == "HIGH_RISK":
            signals.append(Signal("IDENTIFIER_HIGH_RISK", _identifier_band_label(record), weights["HIGH_RISK"]))
        elif record.risk_band == "SUSPICIOUS":
            signals.append(Signal("IDENTIFIER_SUSPICIOUS", _identifier_band_label(record), weights["SUSPICIOUS"]))
    return signals


def assess_message(text: str, prediction: IntentPrediction, entities: ExtractedEntities, known: list[IdentifierRisk] | None = None) -> RiskAssessment:
    """Score a single message."""
    signals: list[Signal] = []
    kw = entities.keyword_hits
    has_identifier = bool(entities.upi_id or entities.phone_number)
    request_verb = bool(_REQUEST_RE.search(text))

    # Rule override: classifier said "not payment" but the text plainly asks
    # to send an amount to a handle. Trust the concrete evidence.
    payment_related = prediction.is_payment_related or (request_verb and entities.upi_id is not None)

    if not payment_related:
        # Ordinary conversation. Keywords like "KYC" in a chat about visiting
        # the bank must not create risk. Cap firmly at LOW.
        if prediction.fraud_probability >= 0.5:
            signals.append(Signal("ML_FRAUD_PATTERN", f"Wording resembles scam messages ({int(prediction.fraud_probability * 100)}% model confidence)", int(15 * prediction.fraud_probability)))
        score = min(LOW_MAX, sum(s.weight for s in signals))
        return RiskAssessment(score=score, band="LOW", signals=signals, is_payment_related=False)

    # --- ML signals -----------------------------------------------------
    if prediction.intent in SCAM_INTENTS:
        weight = int(round(38 * prediction.confidence))
        signals.append(Signal("SCAM_PATTERN", f"{INTENT_LABELS[prediction.intent]} pattern ({int(prediction.confidence * 100)}% model confidence)", weight))
    if prediction.fraud_probability >= 0.5:
        signals.append(Signal("ML_FRAUD_PATTERN", f"Wording resembles known scam messages ({int(prediction.fraud_probability * 100)}% model confidence)", int(round(18 * prediction.fraud_probability))))

    # --- Language signals (only meaningful in payment context) -----------
    if "urgency" in kw:
        signals.append(Signal("URGENCY", "Urgent, time-pressured language", 10))
    if _ACCOUNT_THREAT_RE.search(text) and prediction.intent not in {"BANK_REQUEST", "BILL_PAYMENT"}:
        signals.append(Signal("ACCOUNT_THREAT", "Threatens account blocking, suspension or legal action", 8))
    if "kyc_credential" in kw and prediction.intent not in {"BANK_REQUEST", "BILL_PAYMENT"}:
        signals.append(Signal("KYC_LANGUAGE", "Account verification / KYC language tied to a payment", 10))
    if "impersonation" in kw and prediction.intent not in {"BANK_REQUEST", "BILL_PAYMENT", "MERCHANT_PAYMENT"}:
        signals.append(Signal("IMPERSONATION", "Claims to be a bank, official or authority", 10))
    if "reward" in kw and prediction.intent not in {"MERCHANT_PAYMENT", "BILL_PAYMENT"}:
        signals.append(Signal("REWARD_BAIT", "Promises a prize, cashback or reward", 8))
    if "upfront_fee" in kw:
        signals.append(Signal("UPFRONT_FEE", "Asks for a fee, deposit or advance before anything is delivered", 10))
    if "refund" in kw and prediction.intent == "REFUND_SCAM":
        signals.append(Signal("REFUND_PRESSURE", "Claims money was sent by mistake and asks for a return", 8))
    if _CREDENTIAL_RE.search(text) and prediction.intent not in {"BANK_REQUEST", "NON_PAYMENT"} and "do not share" not in text.lower() and "never share" not in text.lower():
        signals.append(Signal("CREDENTIAL_ASK", "Mentions entering or sharing a PIN / OTP", 12))
    if _RECEIVE_TRICK_RE.search(text) or prediction.intent == "QR_SCAM":
        signals.append(Signal("PAY_TO_RECEIVE", "Asks you to scan / approve / enter a PIN in order to *receive* money — UPI never needs this", 12))
    if entities.urls:
        signals.append(Signal("LINK", "Contains a link to open", 6))
    if "investment" in kw and prediction.intent == "INVESTMENT_SCAM":
        signals.append(Signal("GUARANTEED_RETURNS", "Promises guaranteed or multiplied returns", 8))
    if "marketplace" in kw and prediction.intent == "MARKETPLACE_PAYMENT" and ("upfront_fee" in kw or "urgency" in kw):
        signals.append(Signal("MARKETPLACE_ADVANCE", "Marketplace seller asking for advance / courier money before inspection", 10))

    # --- Identifier evidence ------------------------------------------------
    signals.extend(identifier_signals(known or []))

    # --- Amount context -----------------------------------------------------
    if entities.amount and entities.amount >= 10_000 and prediction.intent in SCAM_INTENTS:
        signals.append(Signal("LARGE_AMOUNT", f"Large amount requested ({format_inr(entities.amount)})", 6))

    score = max(0, min(100, sum(s.weight for s in signals)))
    # A single weak keyword must not push a benign payment into MEDIUM.
    if prediction.intent not in SCAM_INTENTS and prediction.fraud_probability < 0.5 and len(signals) <= 1:
        score = min(score, LOW_MAX)
    signals.sort(key=lambda s: -s.weight)
    return RiskAssessment(score=score, band=band_for(score), signals=signals, is_payment_related=True)


def assess_payment(
    amount: float,
    record: IdentifierRisk | None,
    matched_message,  # models.MessageAnalysis | None
    amount_match: bool,
    hours_since_message: float | None,
) -> RiskAssessment:
    """Score a payment attempt from stored evidence only (no message text here)."""
    signals: list[Signal] = []

    if matched_message is not None:
        base = int(round(0.75 * matched_message.risk_score))
        label = INTENT_LABELS.get(matched_message.intent, matched_message.intent)
        signals.append(Signal("CONTEXT_MATCH", f"Payee appeared in an earlier {matched_message.risk_band.lower()}-risk message ({label.lower()})", base))
        if amount_match:
            signals.append(Signal("AMOUNT_MATCH", f"Amount matches the {format_inr(matched_message.amount)} requested in that message", 15))
        if hours_since_message is not None and hours_since_message <= 1:
            signals.append(Signal("RECENT_MESSAGE", "That message arrived within the last hour", 6))
        # Carry over the strongest language signals so the warning can name them.
        for s in (matched_message.signals or [])[:4]:
            if s.get("code") in {"URGENCY", "KYC_LANGUAGE", "IMPERSONATION", "UPFRONT_FEE", "REWARD_BAIT", "CREDENTIAL_ASK", "PAY_TO_RECEIVE", "REFUND_PRESSURE", "ACCOUNT_THREAT"}:
                signals.append(Signal(s["code"], s["label"], 0))

    if record is not None:
        signals.extend(identifier_signals([record], context="payment"))
        if record.suspicious_message_count >= 2:
            signals.append(Signal("REPEATED_MESSAGES", f"Seen in {record.suspicious_message_count} suspicious messages", 8))

    score = max(0, min(100, sum(s.weight for s in signals)))
    signals.sort(key=lambda s: -s.weight)
    return RiskAssessment(score=score, band=band_for(score), signals=signals, is_payment_related=True)


def decision_for(band: str) -> str:
    return {"LOW": "ALLOW", "MEDIUM": "REVIEW", "HIGH": "INTERRUPT"}[band]
