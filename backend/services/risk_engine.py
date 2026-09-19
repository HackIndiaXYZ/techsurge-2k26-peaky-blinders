"""Deterministic, explainable risk scoring for messages and payments.

Every contribution is a named signal with an integer weight. The score is the
capped sum of weights; the band is a fixed threshold on the score. There is no
randomness anywhere in this module.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Any

from models import IdentifierRisk
from services.entity_extractor import ExtractedEntities, format_inr
from services.intent_detector import INTENT_LABELS, SCAM_INTENTS, IntentPrediction

LOW_MAX = 34      # 0-34  LOW
MEDIUM_MAX = 64   # 35-64 MEDIUM, 65+ HIGH

_REQUEST_RE = re.compile(r"\b(pay|send|transfer|deposit|bhej|bhejo|bhejna|bhej do|de do|de dena|dena|remit)\b", re.IGNORECASE)
_CREDENTIAL_RE = re.compile(r"\b(upi pin|pin|otp|cvv|password|mpin)\b", re.IGNORECASE)
_ACCOUNT_THREAT_RE = re.compile(r"(will be|be) (blocked|suspended|deactivated|disconnected|frozen|closed)|band ho jayega|block ho jayega|permanently blocked|legal action|face arrest|avoid arrest", re.IGNORECASE)
_RECEIVE_TRICK_RE = re.compile(r"(scan|enter|approve|accept)[^.]{0,40}(pin|qr|request|collect)[^.]{0,40}(receive|get|credited|aa jayega)|(receive|get)[^.]{0,30}(scan|enter (your )?pin)", re.IGNORECASE)


# =============================================================================
# CONTEXTUAL SIGNAL WEIGHTS & MITIGATORS
# =============================================================================

# Transaction / behaviour
FIRST_TIME_PAYEE = 8
AMOUNT_ABOVE_BASELINE = 12
VELOCITY_BURST = 10
OFF_PATTERN_HOUR = 4
ESCALATING_TO_NEW_PAYEE = 12

# Ledger / context
INBOUND_CREDIT_UNVERIFIED = 22
COUNTERPARTY_MISMATCH = 25
AMOUNT_ECHO = 10
SHORT_LATENCY_AFTER_MESSAGE = 10
PAYEE_SOURCED_FROM_MESSAGE = 8

# Social engineering
CREDENTIAL_OR_PIN_REQUEST = 30
MISTAKEN_TRANSFER_CLAIM = 18
AUTHORITY_IMPERSONATION = 18
REDIRECT_INSTRUCTION = 15
SECRECY_OR_ISOLATION = 12
URGENCY_PRESSURE = 6
UNVERIFIED_CHANNEL = 5

# Payee identity
VPA_NAME_MISMATCH = 12
LOOKALIKE_VPA = 15
PERSONAL_VPA_IN_MERCHANT_CONTEXT = 12

# Mitigators (negative integer weights)
INBOUND_CREDIT_VERIFIED = -20
ESTABLISHED_PAYEE = -15
PAYEE_IN_CONTACTS = -10
QR_SCANNED_IN_PERSON = -12
VERIFIED_MERCHANT_VPA = -12


# =============================================================================
# SIGNAL FAMILY REGISTRY
# =============================================================================

SIGNAL_FAMILY: dict[str, str] = {
    # Existing message & ML signals
    "SCAM_PATTERN": "social_engineering",
    "ML_FRAUD_PATTERN": "social_engineering",
    "URGENCY": "social_engineering",
    "ACCOUNT_THREAT": "social_engineering",
    "KYC_LANGUAGE": "social_engineering",
    "IMPERSONATION": "social_engineering",
    "REWARD_BAIT": "social_engineering",
    "UPFRONT_FEE": "social_engineering",
    "REFUND_PRESSURE": "social_engineering",
    "CREDENTIAL_ASK": "social_engineering",
    "PAY_TO_RECEIVE": "social_engineering",
    "LINK": "social_engineering",
    "GUARANTEED_RETURNS": "social_engineering",
    "MARKETPLACE_ADVANCE": "social_engineering",

    # Existing identifier & correlation signals
    "IDENTIFIER_CONFIRMED_FRAUD": "payee_identity",
    "IDENTIFIER_HIGH_RISK": "payee_identity",
    "IDENTIFIER_SUSPICIOUS": "payee_identity",
    "REPEATED_MESSAGES": "payee_identity",
    "LARGE_AMOUNT": "transaction",
    "CONTEXT_MATCH": "context",
    "AMOUNT_MATCH": "context",
    "RECENT_MESSAGE": "context",

    # Contextual - Transaction / behaviour
    "FIRST_TIME_PAYEE": "transaction",
    "AMOUNT_ABOVE_BASELINE": "transaction",
    "VELOCITY_BURST": "transaction",
    "OFF_PATTERN_HOUR": "transaction",
    "ESCALATING_TO_NEW_PAYEE": "transaction",

    # Contextual - Ledger / context
    "INBOUND_CREDIT_UNVERIFIED": "context",
    "COUNTERPARTY_MISMATCH": "context",
    "AMOUNT_ECHO": "context",
    "SHORT_LATENCY_AFTER_MESSAGE": "context",
    "PAYEE_SOURCED_FROM_MESSAGE": "context",

    # Contextual - Social engineering
    "CREDENTIAL_OR_PIN_REQUEST": "social_engineering",
    "MISTAKEN_TRANSFER_CLAIM": "social_engineering",
    "AUTHORITY_IMPERSONATION": "social_engineering",
    "REDIRECT_INSTRUCTION": "social_engineering",
    "SECRECY_OR_ISOLATION": "social_engineering",
    "URGENCY_PRESSURE": "social_engineering",
    "UNVERIFIED_CHANNEL": "social_engineering",

    # Contextual - Payee identity
    "VPA_NAME_MISMATCH": "payee_identity",
    "LOOKALIKE_VPA": "payee_identity",
    "PERSONAL_VPA_IN_MERCHANT_CONTEXT": "payee_identity",

    # Mitigators
    "INBOUND_CREDIT_VERIFIED": "mitigator",
    "ESTABLISHED_PAYEE": "mitigator",
    "PAYEE_IN_CONTACTS": "mitigator",
    "QR_SCANNED_IN_PERSON": "mitigator",
    "VERIFIED_MERCHANT_VPA": "mitigator",
}


@dataclass
class Signal:
    code: str
    label: str
    weight: int
    family: str = "general"
    evidence: str | None = None

    def __post_init__(self):
        if (self.family == "general" or not self.family) and self.code in SIGNAL_FAMILY:
            self.family = SIGNAL_FAMILY[self.code]
        if self.evidence is None:
            self.evidence = self.label

    def to_dict(self) -> dict:
        return {
            "code": self.code,
            "label": self.label,
            "weight": self.weight,
            "family": self.family,
            "evidence": self.evidence or self.label,
        }


@dataclass
class RiskAssessment:
    score: int
    band: str
    signals: list[Signal] = field(default_factory=list)
    is_payment_related: bool = False
    mitigators: list[Signal] = field(default_factory=list)
    families: list[str] = field(default_factory=list)
    override: bool = False
    override_reason: str | None = None

    def signal_codes(self) -> set[str]:
        return {s.code for s in self.signals}

    def mitigator_codes(self) -> set[str]:
        return {m.code for m in self.mitigators}

    def to_dict(self) -> dict:
        return {
            "score": self.score,
            "band": self.band,
            "signals": [s.to_dict() for s in self.signals],
            "mitigators": [m.to_dict() for m in self.mitigators],
            "families": self.families,
            "override": self.override,
            "override_reason": self.override_reason,
            "is_payment_related": self.is_payment_related,
        }


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


def add_signal(
    signals: list[Signal],
    code: str,
    label: str,
    weight: int,
    evidence: str | None = None,
    family: str | None = None,
) -> None:
    """Collect unique signals: only one instance per signal code."""
    for i, s in enumerate(signals):
        if s.code == code:
            if weight > s.weight:
                signals[i] = Signal(
                    code=code,
                    label=label,
                    weight=weight,
                    family=family or s.family,
                    evidence=evidence or s.evidence,
                )
            return
    resolved_family = family or SIGNAL_FAMILY.get(code, "general")
    signals.append(
        Signal(
            code=code,
            label=label,
            weight=weight,
            family=resolved_family,
            evidence=evidence or label,
        )
    )


def add_mitigator(
    mitigators: list[Signal],
    code: str,
    label: str,
    weight: int,
    evidence: str | None = None,
) -> None:
    """Collect unique mitigators (negative weights): only one instance per code."""
    for i, m in enumerate(mitigators):
        if m.code == code:
            if weight < m.weight:  # more negative = stronger reduction
                mitigators[i] = Signal(
                    code=code,
                    label=label,
                    weight=weight,
                    family="mitigator",
                    evidence=evidence or m.evidence,
                )
            return
    mitigators.append(
        Signal(
            code=code,
            label=label,
            weight=weight,
            family="mitigator",
            evidence=evidence or label,
        )
    )


def apply_contextual_evidence(
    signals: list[Signal],
    mitigators: list[Signal],
    context: dict[str, Any],
    fallback_amount: float | None = None,
) -> None:
    """Evaluate optional multi-source contextual evidence without double-counting."""
    ledger = context.get("ledger") or {}
    behavior = context.get("behavior") or {}
    payee = context.get("payee") or {}
    message = context.get("message") or {}
    payment = context.get("payment") or {}

    payment_amount = payment.get("amount") or behavior.get("current_amount") or fallback_amount

    # -------------------------------------------------------------------------
    # 6. Hero Rules: Unverified Inbound Credit & Counterparty Mismatch
    # -------------------------------------------------------------------------
    claims_incoming = bool(
        message.get("claims_incoming_transfer")
        or message.get("mistaken_transfer")
    )
    if claims_incoming and ledger.get("matching_credit_found") is False:
        add_signal(
            signals,
            "INBOUND_CREDIT_UNVERIFIED",
            "No matching incoming credit found in bank ledger",
            INBOUND_CREDIT_UNVERIFIED,
            evidence="Sender claims money was transferred, but account ledger shows no matching incoming credit",
        )

    claimed_sender = (
        message.get("claimed_sender_identifier")
        or message.get("claimed_sender")
    )
    payee_id = (
        payment.get("payee_identifier")
        or payment.get("payee")
        or payee.get("identifier")
    )
    if claimed_sender and payee_id:
        if str(claimed_sender).strip().lower() != str(payee_id).strip().lower():
            add_signal(
                signals,
                "COUNTERPARTY_MISMATCH",
                f"Claimed sender ({claimed_sender}) differs from payment recipient ({payee_id})",
                COUNTERPARTY_MISMATCH,
                evidence=f"Claimed sender ({claimed_sender}) does not match destination payee ({payee_id})",
            )

    # -------------------------------------------------------------------------
    # 7. Transaction / Behavioural Signals (only fire when data exists)
    # -------------------------------------------------------------------------
    if payee.get("is_first_time") is True:
        add_signal(
            signals,
            "FIRST_TIME_PAYEE",
            "First time paying this recipient",
            FIRST_TIME_PAYEE,
            evidence="No prior completed transactions with this payee",
        )

    typical_amt = behavior.get("typical_amount")
    if typical_amt is not None and typical_amt > 0 and payment_amount is not None:
        if payment_amount >= 3 * typical_amt:
            add_signal(
                signals,
                "AMOUNT_ABOVE_BASELINE",
                f"Amount ({format_inr(payment_amount)}) is significantly above typical baseline ({format_inr(typical_amt)})",
                AMOUNT_ABOVE_BASELINE,
                evidence=f"Payment of {format_inr(payment_amount)} exceeds 3x typical average ({format_inr(typical_amt)})",
            )

    recent_count = behavior.get("recent_payment_count")
    if recent_count is not None and recent_count >= 3:
        add_signal(
            signals,
            "VELOCITY_BURST",
            f"High velocity: {recent_count} payments in a short window",
            VELOCITY_BURST,
            evidence=f"{recent_count} recent payments attempted in rapid succession",
        )

    hour_start = behavior.get("typical_hour_start")
    hour_end = behavior.get("typical_hour_end")
    payment_hour = payment.get("payment_hour")
    if hour_start is not None and hour_end is not None and payment_hour is not None:
        if not (hour_start <= payment_hour <= hour_end):
            add_signal(
                signals,
                "OFF_PATTERN_HOUR",
                f"Payment attempted at unusual hour ({payment_hour}:00)",
                OFF_PATTERN_HOUR,
                evidence=f"Payment initiated at {payment_hour}:00, outside user's normal active hours ({hour_start}:00–{hour_end}:00)",
            )

    if behavior.get("escalating_to_new_payee") or payment.get("escalating_to_new_payee"):
        add_signal(
            signals,
            "ESCALATING_TO_NEW_PAYEE",
            "Rapid escalation of transfer amounts to an unestablished payee",
            ESCALATING_TO_NEW_PAYEE,
            evidence="Multiple escalating payment attempts to an unverified new counterparty",
        )

    # -------------------------------------------------------------------------
    # Ledger / Context Correlation Signals
    # -------------------------------------------------------------------------
    claimed_amt = message.get("claimed_amount")
    if claimed_amt is not None and payment_amount is not None:
        try:
            c_val = float(claimed_amt)
            p_val = float(payment_amount)
            if abs(c_val - p_val) <= max(1.0, 0.01 * max(c_val, p_val)):
                add_signal(
                    signals,
                    "AMOUNT_ECHO",
                    f"Payment amount matches {format_inr(p_val)} mentioned in message",
                    AMOUNT_ECHO,
                    evidence=f"Payment amount ({format_inr(p_val)}) exactly echoes amount claimed in external message",
                )
        except (ValueError, TypeError):
            pass

    latency_sec = payment.get("latency_seconds_after_message")
    if latency_sec is not None and latency_sec <= 120:
        add_signal(
            signals,
            "SHORT_LATENCY_AFTER_MESSAGE",
            f"Payment initiated within {int(latency_sec)}s of message receipt",
            SHORT_LATENCY_AFTER_MESSAGE,
            evidence=f"Payment started only {int(latency_sec)} seconds after message arrival",
        )

    if payment.get("payee_sourced_from_message") is True or (
        message.get("claimed_payee")
        and payee_id
        and str(message.get("claimed_payee")).strip().lower() == str(payee_id).strip().lower()
    ):
        add_signal(
            signals,
            "PAYEE_SOURCED_FROM_MESSAGE",
            "Payee was extracted directly from an unverified message",
            PAYEE_SOURCED_FROM_MESSAGE,
            evidence="Payee address was directly extracted from an unverified incoming message",
        )

    # -------------------------------------------------------------------------
    # Social Engineering Signals
    # -------------------------------------------------------------------------
    if message.get("credential_or_pin_request") is True:
        add_signal(
            signals,
            "CREDENTIAL_OR_PIN_REQUEST",
            "Explicit request for UPI PIN, OTP or security credentials",
            CREDENTIAL_OR_PIN_REQUEST,
            evidence="Message explicitly prompts user to enter or share PIN/OTP",
        )

    if message.get("mistaken_transfer") is True:
        add_signal(
            signals,
            "MISTAKEN_TRANSFER_CLAIM",
            "Claims money was sent by mistake and urgently demands return",
            MISTAKEN_TRANSFER_CLAIM,
            evidence="Sender claims accidental credit and urges immediate reversal",
        )

    if message.get("authority_impersonation") is True:
        add_signal(
            signals,
            "AUTHORITY_IMPERSONATION",
            "Claims to represent a bank, law enforcement or regulatory official",
            AUTHORITY_IMPERSONATION,
            evidence="Sender impersonates institutional authority or law enforcement",
        )

    if message.get("redirect_instruction") is True:
        add_signal(
            signals,
            "REDIRECT_INSTRUCTION",
            "Instructs user to move to secondary or unmonitored communication channel",
            REDIRECT_INSTRUCTION,
            evidence="Sender redirects conversation away from official channels",
        )

    if message.get("secrecy_or_isolation") is True:
        add_signal(
            signals,
            "SECRECY_OR_ISOLATION",
            "Demands secrecy or tells user not to discuss transaction with bank/family",
            SECRECY_OR_ISOLATION,
            evidence="Sender enforces secrecy and isolation tactics",
        )

    if message.get("urgency_pressure") is True or (
        message.get("urgency") is True and not any(s.code == "URGENCY" for s in signals)
    ):
        add_signal(
            signals,
            "URGENCY_PRESSURE",
            "Extreme time pressure applied to rush payment",
            URGENCY_PRESSURE,
            evidence="Acute psychological urgency applied to prevent verification",
        )

    if message.get("unverified_channel") is True:
        add_signal(
            signals,
            "UNVERIFIED_CHANNEL",
            "Payment request received via an unverified communication channel",
            UNVERIFIED_CHANNEL,
            evidence="Communication arrived via untrusted or spoofable channel",
        )

    # -------------------------------------------------------------------------
    # Payee Identity Signals
    # -------------------------------------------------------------------------
    if payee.get("vpa_name_mismatch") is True:
        add_signal(
            signals,
            "VPA_NAME_MISMATCH",
            "Registered banking name does not match claimed payee identity",
            VPA_NAME_MISMATCH,
            evidence="Banking beneficiary name conflicts with claimed contact/identity",
        )

    if payee.get("lookalike_vpa") is True:
        add_signal(
            signals,
            "LOOKALIKE_VPA",
            "UPI handle mimics a well-known brand or institution (lookalike spoofing)",
            LOOKALIKE_VPA,
            evidence="VPA syntax closely resembles a recognized brand via typosquatting",
        )

    if payee.get("personal_vpa_in_merchant_context") is True:
        add_signal(
            signals,
            "PERSONAL_VPA_IN_MERCHANT_CONTEXT",
            "Personal UPI account used in a supposed commercial or merchant transaction",
            PERSONAL_VPA_IN_MERCHANT_CONTEXT,
            evidence="Individual savings handle provided instead of a verified merchant account",
        )

    # -------------------------------------------------------------------------
    # 8. Mitigators (Reduce Risk)
    # -------------------------------------------------------------------------
    if ledger.get("matching_credit_found") is True:
        credit_amt = ledger.get("matching_credit_amount")
        credit_label = f" ({format_inr(credit_amt)})" if credit_amt else ""
        add_mitigator(
            mitigators,
            "INBOUND_CREDIT_VERIFIED",
            f"Matching incoming credit verified in account ledger{credit_label}",
            INBOUND_CREDIT_VERIFIED,
            evidence=f"Confirmed incoming credit{credit_label} found in bank ledger",
        )

    past_payments = payee.get("previous_completed_payments", 0) or payee.get("established_payment_count", 0)
    if past_payments >= 3:
        add_mitigator(
            mitigators,
            "ESTABLISHED_PAYEE",
            f"Established payee with {past_payments} prior successful transactions",
            ESTABLISHED_PAYEE,
            evidence=f"User has completed {past_payments} previous successful payments to this payee",
        )

    if payee.get("in_contacts") is True:
        add_mitigator(
            mitigators,
            "PAYEE_IN_CONTACTS",
            "Payee is in user's saved contacts",
            PAYEE_IN_CONTACTS,
            evidence="Recipient handle or mobile number exists in trusted contacts",
        )

    if payee.get("qr_scanned_in_person") is True:
        add_mitigator(
            mitigators,
            "QR_SCANNED_IN_PERSON",
            "Merchant QR code was physically scanned in person",
            QR_SCANNED_IN_PERSON,
            evidence="Payment initiated via physically scanned in-person QR code",
        )

    if payee.get("verified_merchant") is True:
        add_mitigator(
            mitigators,
            "VERIFIED_MERCHANT_VPA",
            "Payee is an officially verified merchant VPA",
            VERIFIED_MERCHANT_VPA,
            evidence="Verified merchant status authenticated via NPCI registry",
        )


def evaluate_safety_overrides(signal_codes: set[str]) -> tuple[bool, str | None]:
    """9. Conclusive safety rules for critical threat patterns."""
    if "CREDENTIAL_OR_PIN_REQUEST" in signal_codes:
        return True, "PIN / OTP credential request detected — critical scam indicator"
    if "COUNTERPARTY_MISMATCH" in signal_codes and "INBOUND_CREDIT_UNVERIFIED" in signal_codes:
        return True, "Unverified inbound credit combined with recipient mismatch indicates a refund scam"
    return False, None


def assess_message(
    text: str,
    prediction: IntentPrediction,
    entities: ExtractedEntities,
    known: list[IdentifierRisk] | None = None,
    context: dict[str, Any] | None = None,
) -> RiskAssessment:
    """Score a single message."""
    signals: list[Signal] = []
    mitigators: list[Signal] = []
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
            add_signal(
                signals,
                "ML_FRAUD_PATTERN",
                f"Wording resembles scam messages ({int(prediction.fraud_probability * 100)}% model confidence)",
                int(15 * prediction.fraud_probability),
            )
        if context:
            apply_contextual_evidence(signals, mitigators, context, fallback_amount=entities.amount)
        score = min(LOW_MAX, max(0, sum(s.weight for s in signals) + sum(m.weight for m in mitigators)))
        signals.sort(key=lambda s: -s.weight)
        mitigators.sort(key=lambda m: m.weight)
        families = sorted({s.family for s in signals if s.family} | {m.family for m in mitigators if m.family})
        return RiskAssessment(
            score=score,
            band="LOW",
            signals=signals,
            is_payment_related=False,
            mitigators=mitigators,
            families=families,
        )

    # --- ML signals -----------------------------------------------------
    if prediction.intent in SCAM_INTENTS:
        weight = int(round(38 * prediction.confidence))
        add_signal(signals, "SCAM_PATTERN", f"{INTENT_LABELS[prediction.intent]} pattern ({int(prediction.confidence * 100)}% model confidence)", weight)
    if prediction.fraud_probability >= 0.5:
        add_signal(signals, "ML_FRAUD_PATTERN", f"Wording resembles known scam messages ({int(prediction.fraud_probability * 100)}% model confidence)", int(round(18 * prediction.fraud_probability)))

    # --- Language signals (only meaningful in payment context) -----------
    if "urgency" in kw:
        add_signal(signals, "URGENCY", "Urgent, time-pressured language", 10)
    if _ACCOUNT_THREAT_RE.search(text) and prediction.intent not in {"BANK_REQUEST", "BILL_PAYMENT"}:
        add_signal(signals, "ACCOUNT_THREAT", "Threatens account blocking, suspension or legal action", 8)
    if "kyc_credential" in kw and prediction.intent not in {"BANK_REQUEST", "BILL_PAYMENT"}:
        add_signal(signals, "KYC_LANGUAGE", "Account verification / KYC language tied to a payment", 10)
    if "impersonation" in kw and prediction.intent not in {"BANK_REQUEST", "BILL_PAYMENT", "MERCHANT_PAYMENT"}:
        add_signal(signals, "IMPERSONATION", "Claims to be a bank, official or authority", 10)
    if "reward" in kw and prediction.intent not in {"MERCHANT_PAYMENT", "BILL_PAYMENT"}:
        add_signal(signals, "REWARD_BAIT", "Promises a prize, cashback or reward", 8)
    if "upfront_fee" in kw:
        add_signal(signals, "UPFRONT_FEE", "Asks for a fee, deposit or advance before anything is delivered", 10)
    if "refund" in kw and prediction.intent == "REFUND_SCAM":
        add_signal(signals, "REFUND_PRESSURE", "Claims money was sent by mistake and asks for a return", 8)
    if _CREDENTIAL_RE.search(text) and prediction.intent not in {"BANK_REQUEST", "NON_PAYMENT"} and "do not share" not in text.lower() and "never share" not in text.lower():
        add_signal(signals, "CREDENTIAL_ASK", "Mentions entering or sharing a PIN / OTP", 12)
    if _RECEIVE_TRICK_RE.search(text) or prediction.intent == "QR_SCAM":
        add_signal(signals, "PAY_TO_RECEIVE", "Asks you to scan / approve / enter a PIN in order to *receive* money — UPI never needs this", 12)
    if entities.urls:
        add_signal(signals, "LINK", "Contains a link to open", 6)
    if "investment" in kw and prediction.intent == "INVESTMENT_SCAM":
        add_signal(signals, "GUARANTEED_RETURNS", "Promises guaranteed or multiplied returns", 8)
    if "marketplace" in kw and prediction.intent == "MARKETPLACE_PAYMENT" and ("upfront_fee" in kw or "urgency" in kw):
        add_signal(signals, "MARKETPLACE_ADVANCE", "Marketplace seller asking for advance / courier money before inspection", 10)

    # --- Identifier evidence ------------------------------------------------
    for s in identifier_signals(known or []):
        add_signal(signals, s.code, s.label, s.weight, evidence=s.evidence)

    # --- Amount context -----------------------------------------------------
    if entities.amount and entities.amount >= 10_000 and prediction.intent in SCAM_INTENTS:
        add_signal(signals, "LARGE_AMOUNT", f"Large amount requested ({format_inr(entities.amount)})", 6)

    # --- Contextual evidence layer ------------------------------------------
    if context:
        apply_contextual_evidence(signals, mitigators, context, fallback_amount=entities.amount)

    raw_score = sum(s.weight for s in signals) + sum(m.weight for m in mitigators)
    score = max(0, min(100, raw_score))

    # A single weak keyword must not push a benign payment into MEDIUM.
    if not context and prediction.intent not in SCAM_INTENTS and prediction.fraud_probability < 0.5 and len(signals) <= 1:
        score = min(score, LOW_MAX)

    band = band_for(score)
    signal_codes = {s.code for s in signals}
    override, override_reason = evaluate_safety_overrides(signal_codes)
    if override:
        band = "HIGH"

    signals.sort(key=lambda s: -s.weight)
    mitigators.sort(key=lambda m: m.weight)
    families = sorted({s.family for s in signals if s.family} | {m.family for m in mitigators if m.family})

    return RiskAssessment(
        score=score,
        band=band,
        signals=signals,
        is_payment_related=True,
        mitigators=mitigators,
        families=families,
        override=override,
        override_reason=override_reason,
    )


def assess_payment(
    amount: float,
    record: IdentifierRisk | None,
    matched_message,  # models.MessageAnalysis | None
    amount_match: bool,
    hours_since_message: float | None,
    context: dict[str, Any] | None = None,
) -> RiskAssessment:
    """Score a payment attempt from stored evidence only (no message text here)."""
    signals: list[Signal] = []
    mitigators: list[Signal] = []

    if matched_message is not None:
        base = int(round(0.75 * matched_message.risk_score))
        label = INTENT_LABELS.get(matched_message.intent, matched_message.intent)
        add_signal(signals, "CONTEXT_MATCH", f"Payee appeared in an earlier {matched_message.risk_band.lower()}-risk message ({label.lower()})", base)
        if amount_match:
            add_signal(signals, "AMOUNT_MATCH", f"Amount matches the {format_inr(matched_message.amount)} requested in that message", 15)
        if hours_since_message is not None and hours_since_message <= 1:
            add_signal(signals, "RECENT_MESSAGE", "That message arrived within the last hour", 6)
        # Carry over the strongest language signals so the warning can name them.
        for s in (matched_message.signals or [])[:4]:
            if s.get("code") in {"URGENCY", "KYC_LANGUAGE", "IMPERSONATION", "UPFRONT_FEE", "REWARD_BAIT", "CREDENTIAL_ASK", "PAY_TO_RECEIVE", "REFUND_PRESSURE", "ACCOUNT_THREAT"}:
                add_signal(signals, s["code"], s["label"], 0)

    if record is not None:
        for s in identifier_signals([record], context="payment"):
            add_signal(signals, s.code, s.label, s.weight, evidence=s.evidence)
        if record.suspicious_message_count >= 2:
            add_signal(signals, "REPEATED_MESSAGES", f"Seen in {record.suspicious_message_count} suspicious messages", 8)

    # --- Contextual evidence layer ------------------------------------------
    if context:
        apply_contextual_evidence(signals, mitigators, context, fallback_amount=amount)

    raw_score = sum(s.weight for s in signals) + sum(m.weight for m in mitigators)
    score = max(0, min(100, raw_score))
    band = band_for(score)

    signal_codes = {s.code for s in signals}
    override, override_reason = evaluate_safety_overrides(signal_codes)
    if override:
        band = "HIGH"

    signals.sort(key=lambda s: -s.weight)
    mitigators.sort(key=lambda m: m.weight)
    families = sorted({s.family for s in signals if s.family} | {m.family for m in mitigators if m.family})

    return RiskAssessment(
        score=score,
        band=band,
        signals=signals,
        is_payment_related=True,
        mitigators=mitigators,
        families=families,
        override=override,
        override_reason=override_reason,
    )


def assess_context(context: dict[str, Any], base_signals: list[Signal] | None = None) -> RiskAssessment:
    """Convenience evaluator for purely contextual inputs."""
    signals: list[Signal] = list(base_signals or [])
    mitigators: list[Signal] = []
    apply_contextual_evidence(signals, mitigators, context)
    raw_score = sum(s.weight for s in signals) + sum(m.weight for m in mitigators)
    score = max(0, min(100, raw_score))
    band = band_for(score)

    signal_codes = {s.code for s in signals}
    override, override_reason = evaluate_safety_overrides(signal_codes)
    if override:
        band = "HIGH"

    signals.sort(key=lambda s: -s.weight)
    mitigators.sort(key=lambda m: m.weight)
    families = sorted({s.family for s in signals if s.family} | {m.family for m in mitigators if m.family})

    return RiskAssessment(
        score=score,
        band=band,
        signals=signals,
        is_payment_related=True,
        mitigators=mitigators,
        families=families,
        override=override,
        override_reason=override_reason,
    )


def decision_for(band: str) -> str:
    return {"LOW": "ALLOW", "MEDIUM": "REVIEW", "HIGH": "INTERRUPT"}[band]

