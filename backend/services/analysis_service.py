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
from services import behavior_service, fraud_lookup, ledger_service
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

    context = None
    if prediction.intent == "REFUND_SCAM" or "refund" in entities.keyword_hits:
        ledger_res = ledger_service.check_incoming_credit(db, entities.amount, sender_label)
        context = {
            "ledger": {
                "matching_credit_found": ledger_res.matched,
                "matching_credit_amount": ledger_res.matching_entry.amount if ledger_res.matching_entry else 0,
                "matching_credit_sender": ledger_res.matching_entry.counterparty if ledger_res.matching_entry else None,
            },
            "message": {
                "claims_incoming_transfer": True,
                "mistaken_transfer": True,
                "claimed_amount": entities.amount,
                "claimed_sender": sender_label,
                "claimed_sender_identifier": sender_label,
                "claimed_payee": entities.upi_id,
            },
            "payment": {
                "payee": entities.upi_id,
                "payee_identifier": entities.upi_id,
                "amount": entities.amount,
            },
        }

    assessment = assess_message(text, prediction, entities, known_before, context=context)
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


def verify_payee(db: Session, raw_identifier: str, amount: float, payee_name: str | None = None, context: dict | None = None) -> tuple[PaymentVerification, IdentifierRisk | None, dict | None, float]:
    """Check a payee before payment. Returns (verification, identifier record, matched message summary, latency_ms)."""
    started = time.perf_counter()
    identifier, identifier_type = classify_identifier(raw_identifier)
    if not identifier:
        raise InvalidIdentifier("Enter a valid UPI ID (name@bank) or a 10-digit Indian mobile number.")

    record = db.scalar(select(IdentifierRisk).where(IdentifierRisk.identifier == identifier))
    correlation = correlate_payment(db, identifier, amount)

    ctx = dict(context) if context else {}
    
    # Inject behavioral baseline context
    b_ctx = behavior_service.evaluate_behavioral_context(db, identifier, amount, explicit_context=ctx)
    ctx.update(b_ctx)

    ledger_result = None

    # Automatically query synthetic ledger if evaluating a refund/accidental transfer scenario
    if "ledger" not in ctx:
        is_refund = False
        check_amt = amount
        claimed_sender = None

        if correlation.message is not None:
            m = correlation.message
            if m.intent == "REFUND_SCAM" or (m.keywords and "refund" in m.keywords):
                is_refund = True
                check_amt = m.amount or amount
                claimed_sender = m.sender_label

        if is_refund:
            ledger_result = ledger_service.check_incoming_credit(db, check_amt, claimed_sender)
            ctx["ledger"] = {
                "matching_credit_found": ledger_result.matched,
                "matching_credit_amount": ledger_result.matching_entry.amount if ledger_result.matching_entry else 0,
                "matching_credit_sender": ledger_result.matching_entry.counterparty if ledger_result.matching_entry else None,
            }
            if "message" not in ctx:
                ctx["message"] = {
                    "claims_incoming_transfer": True,
                    "mistaken_transfer": True,
                    "claimed_amount": check_amt,
                    "claimed_sender": claimed_sender,
                    "claimed_sender_identifier": claimed_sender,
                }
            if "payment" not in ctx:
                ctx["payment"] = {
                    "payee": identifier,
                    "payee_identifier": identifier,
                    "amount": amount,
                }

    assessment = assess_payment(amount, record, correlation.message, correlation.amount_match, correlation.hours_since, context=ctx if ctx else None)
    title, summary, reasons = explain_payment(assessment, identifier_type, amount, correlation.message, correlation.amount_match, record)

    now = datetime.now(timezone.utc)
    from datetime import timedelta
    timeline = []
    if correlation.message:
        m_time = correlation.message.created_at
        timeline.append({"step": "MESSAGE_RECEIVED", "timestamp": m_time.isoformat()})
        timeline.append({"step": "MESSAGE_ANALYZED", "timestamp": (m_time + timedelta(seconds=1)).isoformat()})
    
    timeline.append({"step": "PAYMENT_INITIATED", "timestamp": (now - timedelta(seconds=2)).isoformat()})
    timeline.append({"step": "CONTEXT_AGGREGATED", "timestamp": (now - timedelta(seconds=1)).isoformat()})
    timeline.append({"step": "RISK_SIGNALS_EVALUATED", "timestamp": now.isoformat()})
    timeline.append({"step": "RISK_ASSESSMENT_CREATED", "timestamp": now.isoformat()})
    if decision_for(assessment.band) != "ALLOW":
        timeline.append({"step": "WARNING_DISPLAYED", "timestamp": (now + timedelta(seconds=1)).isoformat()})

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
        timeline=timeline,
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
    verification.mitigators = [m.to_dict() for m in assessment.mitigators]
    verification.families = assessment.families
    verification.override = assessment.override
    verification.override_reason = assessment.override_reason
    if ledger_result:
        verification.ledger_check = ledger_result.to_dict()
    elif "ledger" in ctx and ctx["ledger"]:
        l = ctx["ledger"]
        is_credit_matched = bool(l.get("matching_credit_found", False))
        amt = float(l.get("matching_credit_amount") or amount)
        verification.ledger_check = {
            "claim_amount": amt,
            "matched": is_credit_matched,
            "matching_entry": None,
            "unverified_incoming": not is_credit_matched,
            "summary": (
                f"Matching incoming credit of ₹{amt:,.0f} verified."
                if is_credit_matched
                else f"No matching incoming ₹{amt:,.0f} credit found in your account ledger."
            ),
        }
    else:
        verification.ledger_check = None

    # Construct the ContextGraph for explainability and UX
    nodes = []
    edges = []

    # Message node (Root)
    if correlation.message:
        m = correlation.message
        nodes.append({"id": "message", "type": "message", "label": f"Message: {INTENT_LABELS.get(m.intent, m.intent)}", "properties": {"intent": m.intent, "excerpt": m.message[:50]}})
        if m.amount:
            nodes.append({"id": "claim_amount", "type": "amount", "label": f"Claimed ₹{m.amount:,.0f}", "properties": {"amount": m.amount}})
            edges.append({"source": "message", "target": "claim_amount", "label": "claims amount", "properties": {}})
        if m.sender_label:
            nodes.append({"id": "sender", "type": "sender", "label": m.sender_label, "properties": {"name": m.sender_label}})
            edges.append({"source": "message", "target": "sender", "label": "sent by", "properties": {}})
        if correlation.matched:
            delay = f"{correlation.hours_since * 60:.0f} mins" if correlation.hours_since else "shortly"
            edges.append({"source": "message", "target": "payment", "label": f"followed after {delay}", "properties": {"hours_since": correlation.hours_since}})

    # Ledger node
    if verification.ledger_check:
        l = verification.ledger_check
        label = "No matching credit" if l["unverified_incoming"] else "Matching credit verified"
        nodes.append({"id": "ledger", "type": "ledger", "label": label, "properties": {"matched": l["matched"]}})
        edges.append({"source": "ledger", "target": "payment", "label": "context for", "properties": {}})

    # Payment node
    nodes.append({"id": "payment", "type": "payment", "label": f"Payment ₹{amount:,.0f}", "properties": {"amount": amount}})
    
    # Payee node
    is_first = ctx.get("behavior", {}).get("is_first_time", False) if ctx and "behavior" in ctx else (record is None or record.total_message_count == 0)
    payee_label = "First-time payee" if is_first else "Known payee"
    nodes.append({"id": "payee", "type": "payee", "label": payee_label, "properties": {"identifier": identifier, "is_first_time": is_first}})
    edges.append({"source": "payment", "target": "payee", "label": "to", "properties": {}})

    verification.context_graph = {"nodes": nodes, "edges": edges}

    return verification, record, matched, (time.perf_counter() - started) * 1000


def record_payment_decision(db: Session, verification_id: int, action: str) -> PaymentVerification | None:
    verification = db.get(PaymentVerification, verification_id)
    if verification is None:
        return None
    verification.user_action = action
    now = datetime.now(timezone.utc)
    verification.acted_at = now
    
    # Append USER_DECISION to timeline
    current_timeline = list(verification.timeline or [])
    current_timeline.append({"step": f"USER_DECISION: {action}", "timestamp": now.isoformat()})
    verification.timeline = current_timeline

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
