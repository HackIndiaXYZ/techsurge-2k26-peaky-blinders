"""Turns risk signals and stored evidence into short, human explanations.

Rules of thumb used here:
  * name the evidence, never the model ("appeared in a KYC message", not "AI detected fraud")
  * strongest 1-3 reasons only
  * calm wording: "high risk", "suspicious", "previously reported"
"""

from __future__ import annotations

from services.entity_extractor import format_inr
from services.intent_detector import INTENT_LABELS
from services.risk_engine import RiskAssessment, Signal

# Short, intent-specific phrases used to build the one-line summary.
_INTENT_PHRASE: dict[str, str] = {
    "KYC_SCAM": "demands a KYC / verification payment",
    "REFUND_SCAM": "asks you to return money that was supposedly sent by mistake",
    "PRIZE_SCAM": "asks for an upfront payment to claim a reward",
    "IMPERSONATION": "asks for money while claiming to be someone in authority or someone you know",
    "URGENCY_PAYMENT": "pressures you to pay immediately",
    "INVESTMENT_SCAM": "promises guaranteed returns on a deposit",
    "JOB_SCAM": "asks for a fee to unlock a job or earnings",
    "QR_SCAM": "asks you to scan or approve something to receive money",
    "MARKETPLACE_PAYMENT": "is a marketplace payment",
    "PAYMENT_REQUEST": "is an ordinary payment request",
    "FRIEND_FAMILY_PAYMENT": "is a friend or family transfer",
    "MERCHANT_PAYMENT": "is a merchant bill",
    "BILL_PAYMENT": "is a utility or bill notice",
    "BANK_REQUEST": "is a bank notification",
    "NON_PAYMENT": "does not ask for a payment",
}

# Signal code -> plain-language sentence for the "why" list.
_SIGNAL_SENTENCE: dict[str, str] = {
    "SCAM_PATTERN": "The wording follows a common {intent} script.",
    "ML_FRAUD_PATTERN": "The wording closely resembles known scam messages.",
    "URGENCY": "It uses urgent, time-pressured language.",
    "ACCOUNT_THREAT": "It threatens account blocking, suspension or legal action.",
    "KYC_LANGUAGE": "It ties a payment to KYC or account verification — banks never charge for this over chat.",
    "IMPERSONATION": "It claims to come from a bank, official or authority.",
    "REWARD_BAIT": "It promises a prize, cashback or reward.",
    "UPFRONT_FEE": "It asks for a fee, deposit or advance before anything is delivered.",
    "REFUND_PRESSURE": "It claims money was sent by mistake and asks for a return.",
    "CREDENTIAL_ASK": "It mentions entering or sharing a PIN or OTP.",
    "PAY_TO_RECEIVE": "It asks you to scan, approve or enter a PIN in order to receive money — receiving never needs this.",
    "LINK": "It contains a link to open.",
    "GUARANTEED_RETURNS": "It promises guaranteed or multiplied returns.",
    "MARKETPLACE_ADVANCE": "The seller wants an advance or courier payment before you can inspect the item.",
    "LARGE_AMOUNT": "The amount requested is large.",
    "IDENTIFIER_CONFIRMED_FRAUD": "{identifier_label}",
    "IDENTIFIER_HIGH_RISK": "{identifier_label}",
    "IDENTIFIER_SUSPICIOUS": "{identifier_label}",
    "CONTEXT_MATCH": "{identifier_label}",
    "AMOUNT_MATCH": "{identifier_label}",
    "RECENT_MESSAGE": "That message arrived within the last hour.",
    "REPEATED_MESSAGES": "{identifier_label}",
}


def _sentence(signal: Signal, intent: str | None) -> str:
    template = _SIGNAL_SENTENCE.get(signal.code, signal.label + ".")
    return template.format(intent=INTENT_LABELS.get(intent or "", intent or "").lower(), identifier_label=signal.label.rstrip(".") + ".")


def explain_message(assessment: RiskAssessment, intent: str, confidence: float, entities) -> tuple[str, list[str]]:
    """Return (summary, reasons) for an analysed message."""
    reasons = [_sentence(s, intent) for s in assessment.signals if s.weight > 0][:3]

    if not assessment.is_payment_related:
        return "No payment request found in this message.", reasons

    phrase = _INTENT_PHRASE.get(intent, "asks for a payment")
    codes = assessment.signal_codes()
    if assessment.band == "HIGH":
        extras = []
        if "URGENCY" in codes:
            extras.append("uses urgency")
        if "IMPERSONATION" in codes:
            extras.append("claims to be an authority")
        if "UPFRONT_FEE" in codes and intent not in {"PRIZE_SCAM", "JOB_SCAM"}:
            extras.append("wants an upfront fee")
        tail = f" and {', '.join(extras)}" if extras else ""
        summary = f"High risk: this message {phrase}{tail}."
    elif assessment.band == "MEDIUM":
        summary = f"Suspicious: this message {phrase}, with some pressure signals. Verify the sender before paying."
    else:
        summary = f"Looks ordinary: this message {phrase} with no pressure or scam signals."
    return summary, reasons


def explain_payment(assessment: RiskAssessment, identifier_type: str, amount: float, matched_message, amount_match: bool, record) -> tuple[str, str, list[str]]:
    """Return (title, summary, reasons) for a payee verification."""
    kind = "UPI ID" if identifier_type == "UPI" else "number"
    reasons = [_sentence(s, matched_message.intent if matched_message else None) for s in assessment.signals if s.weight > 0][:3]

    if assessment.band == "HIGH":
        title = "High-risk payment"
    elif assessment.band == "MEDIUM":
        title = "Review this payment"
    else:
        title = "PausePay check complete"

    if matched_message is not None:
        label = INTENT_LABELS.get(matched_message.intent, matched_message.intent).lower()
        if amount_match and matched_message.amount:
            summary = f"This {kind} and the {format_inr(amount)} amount match an earlier suspicious message ({label})."
        else:
            summary = f"This {kind} previously appeared in a suspicious message ({label})."
        if record is not None and record.report_count:
            summary += f" It also has {record.report_count} fraud report(s)."
    elif record is not None and record.status == "CONFIRMED_FRAUD":
        summary = f"This {kind} is on the confirmed-fraud list with {record.report_count} reports."
    elif record is not None and record.report_count:
        summary = f"This {kind} has been reported {record.report_count} time(s) by users."
    elif record is not None and record.total_message_count and record.suspicious_message_count == 0:
        summary = f"This {kind} has only been seen in ordinary payment messages. No suspicious context found."
    else:
        summary = f"No suspicious messages or reports are linked to this {kind}. PausePay has no evidence against it — this is not a guarantee it is safe."

    if assessment.band == "LOW" and not reasons:
        reasons = []
    return title, summary, reasons
