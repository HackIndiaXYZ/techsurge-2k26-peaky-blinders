"""Orchestration: message analysis, payee verification, reporting.

Pipeline for a message:
    text → intent classifier → entity extraction → identifier lookup
         → risk engine → explanation → persist → update identifier profiles
"""

from __future__ import annotations

import time
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from config import settings
from models import FraudReport, IdentifierRisk, MessageAnalysis, PaymentVerification
from services import fraud_lookup
from services.correlation_engine import correlate_payment
from services.entity_extractor import classify_identifier, extract_entities
from services.explanation_engine import explain_message, explain_payment
from services.intent_detector import INTENT_LABELS, detector
from services.risk_engine import assess_message, assess_payment, decision_for


class InvalidIdentifier(ValueError):
    pass


def _known_records(db: Session, identifiers: list[str]) -> list[IdentifierRisk]:
    if not identifiers:
        return []
    return db.scalars(select(IdentifierRisk).where(IdentifierRisk.identifier.in_(identifiers))).all()


def analyze_message(db: Session, text: str, source: str = "MANUAL_CHECK", source_ref: str | None = None, sender_label: str | None = None) -> tuple[MessageAnalysis, list[IdentifierRisk], dict, float, bool]:
    """Analyse and persist a message. Returns (analysis, identifier records, entities dict, latency_ms, cached)."""
    started = time.perf_counter()

    # Simulated messenger threads are re-opened often; never double-count the same message as new evidence.
    if source_ref:
        existing = db.scalar(select(MessageAnalysis).where(MessageAnalysis.source == source, MessageAnalysis.source_ref == source_ref))
        if existing is not None:
            ids = [i for i in (existing.upi_id, existing.phone_number) if i]
            entities = extract_entities(existing.message).to_dict()
            return existing, _known_records(db, ids), entities, (time.perf_counter() - started) * 1000, True

    prediction = detector.predict(text)
    entities = extract_entities(text)
    identifiers = [i for i in (entities.upi_id, entities.phone_number) if i]
    known_before = _known_records(db, identifiers)

    assessment = assess_message(text, prediction, entities, known_before)
    summary, reasons = explain_message(assessment, prediction.intent, prediction.confidence, entities)

    analysis = MessageAnalysis(
        message=text,
        source=source,
        source_ref=source_ref,
        sender_label=sender_label,
        intent=prediction.intent,
        intent_confidence=prediction.confidence,
        is_payment_related=assessment.is_payment_related,
        phone_number=entities.phone_number,
        upi_id=entities.upi_id,
        amount=entities.amount,
        urls=entities.urls,
        keywords=entities.keywords,
        risk_score=assessment.score,
        risk_band=assessment.band,
        signals=[s.to_dict() for s in assessment.signals],
        reasons=reasons,
        summary=summary,
    )
    db.add(analysis)
    db.flush()

    records = fraud_lookup.record_message_evidence(db, analysis)
    db.commit()
    db.refresh(analysis)
    for record in records:
        db.refresh(record)
    return analysis, records, entities.to_dict(), (time.perf_counter() - started) * 1000, False


def verify_payee(db: Session, raw_identifier: str, amount: float, payee_name: str | None = None) -> tuple[PaymentVerification, IdentifierRisk | None, dict | None, float]:
    """Check a payee before payment. Returns (verification, identifier record, matched message summary, latency_ms)."""
    started = time.perf_counter()
    identifier, identifier_type = classify_identifier(raw_identifier)
    if not identifier:
        raise InvalidIdentifier("Enter a valid UPI ID (name@bank) or a 10-digit Indian mobile number.")

    record = db.scalar(select(IdentifierRisk).where(IdentifierRisk.identifier == identifier))
    correlation = correlate_payment(db, identifier, amount)
    assessment = assess_payment(amount, record, correlation.message, correlation.amount_match, correlation.hours_since)
    title, summary, reasons = explain_payment(assessment, identifier_type, amount, correlation.message, correlation.amount_match, record)

    verification = PaymentVerification(
        identifier=identifier,
        identifier_type=identifier_type,
        payee_name=payee_name,
        amount=amount,
        decision=decision_for(assessment.band),
        risk_score=assessment.score,
        risk_band=assessment.band,
        matched_context=correlation.matched,
        matched_message_analysis_id=correlation.message.id if correlation.message else None,
        signals=[s.to_dict() for s in assessment.signals],
        reasons=reasons,
        summary=summary,
    )
    db.add(verification)
    db.commit()
    db.refresh(verification)

    matched = None
    if correlation.message is not None:
        m = correlation.message
        matched = {
            "id": m.id,
            "excerpt": m.message if len(m.message) <= 160 else m.message[:157] + "…",
            "intent": m.intent,
            "intent_label": INTENT_LABELS.get(m.intent, m.intent),
            "amount": m.amount,
            "amount_match": correlation.amount_match,
            "risk_score": m.risk_score,
            "risk_band": m.risk_band,
            "sender_label": m.sender_label,
            "source": m.source,
            "created_at": m.created_at,
        }
    verification.title = title  # transient attribute for the response builder
    return verification, record, matched, (time.perf_counter() - started) * 1000


def record_payment_decision(db: Session, verification_id: int, action: str) -> PaymentVerification | None:
    verification = db.get(PaymentVerification, verification_id)
    if verification is None:
        return None
    verification.user_action = action
    verification.acted_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(verification)
    return verification


def report_fraud(db: Session, raw_identifier: str, reason: str | None, amount: float | None, verification_id: int | None) -> tuple[FraudReport, IdentifierRisk]:
    identifier, identifier_type = classify_identifier(raw_identifier)
    if not identifier:
        raise InvalidIdentifier("Enter a valid UPI ID (name@bank) or a 10-digit Indian mobile number.")

    source = "USER"
    if verification_id is not None:
        verification = db.get(PaymentVerification, verification_id)
        if verification is not None:
            verification.user_action = "CANCELLED_REPORTED"
            verification.acted_at = datetime.now(timezone.utc)
            source = "PAYMENT_CANCEL"
            if amount is None:
                amount = verification.amount

    report = FraudReport(identifier=identifier, identifier_type=identifier_type, reason=reason, amount=amount, source=source, payment_verification_id=verification_id)
    db.add(report)
    db.flush()
    record = fraud_lookup.record_report(db, identifier, identifier_type, source=source)
    db.commit()
    db.refresh(report)
    db.refresh(record)
    return report, record


def engine_version() -> str:
    return settings.engine_version
