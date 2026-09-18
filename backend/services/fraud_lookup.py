"""Identifier risk store: lookups, seeding and evidence accumulation.

Bands for an identifier express uncertainty rather than a verdict:

    UNKNOWN     nothing on record
    LOW         seen only in ordinary payment context
    SUSPICIOUS  appeared in at least one risky message, or has a single report
    HIGH_RISK   strong or repeated evidence (multiple risky messages / reports,
                or presence on the seeded confirmed-fraud list)
"""

from __future__ import annotations

import json
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.orm import Session

from models import IdentifierRisk, MessageAnalysis
from services.entity_extractor import classify_identifier


def get_identifier_risk(db: Session, identifier: str) -> IdentifierRisk | None:
    normalised, _ = classify_identifier(identifier)
    key = normalised or identifier.strip().lower()
    return db.scalar(select(IdentifierRisk).where(IdentifierRisk.identifier == key))


def get_or_create_identifier(db: Session, identifier: str, identifier_type: str) -> IdentifierRisk:
    record = db.scalar(select(IdentifierRisk).where(IdentifierRisk.identifier == identifier))
    if record is None:
        record = IdentifierRisk(identifier=identifier, identifier_type=identifier_type, sources=[])
        db.add(record)
        db.flush()
    return record


def _add_source(record: IdentifierRisk, source: str) -> None:
    sources = list(record.sources or [])
    if source not in sources:
        sources.append(source)
    record.sources = sources


def compute_identifier_score(record: IdentifierRisk) -> tuple[int, str]:
    """Deterministic identifier score from accumulated evidence.

    Evidence is additive but capped, so one weak signal cannot brand an
    identifier as fraud while repeated evidence pushes it firmly up.
    """
    if record.status == "CONFIRMED_FRAUD":
        return 95, "HIGH_RISK"
    if record.status == "TRUSTED":
        return 5, "LOW"

    score = 0
    # Strongest single message seen involving this identifier (discounted: one message is not proof).
    score += int(0.6 * (record.max_message_score or 0))
    # Repetition: each further suspicious message adds evidence, capped.
    score += min(20, max(0, (record.suspicious_message_count or 0) - 1) * 8)
    # User / system reports are strong evidence.
    score += min(36, (record.report_count or 0) * 18)
    score = max(0, min(100, score))

    reports = record.report_count or 0
    suspicious = record.suspicious_message_count or 0
    if suspicious == 0 and reports == 0:
        band = "LOW" if (record.total_message_count or 0) > 0 else "UNKNOWN"
    elif score >= 70 or reports >= 2 or suspicious >= 3 or (reports >= 1 and suspicious >= 1):
        band = "HIGH_RISK"
    else:
        band = "SUSPICIOUS"
    return score, band


def record_message_evidence(db: Session, analysis: MessageAnalysis) -> list[IdentifierRisk]:
    """Update the identifier profiles that a newly analysed message touches."""
    touched: list[IdentifierRisk] = []
    pairs = [(analysis.upi_id, "UPI"), (analysis.phone_number, "PHONE")]
    suspicious = analysis.risk_band in {"MEDIUM", "HIGH"} and analysis.is_payment_related
    for identifier, id_type in pairs:
        if not identifier:
            continue
        record = get_or_create_identifier(db, identifier, id_type)
        record.total_message_count = (record.total_message_count or 0) + 1
        _add_source(record, "MESSAGE_ANALYSIS")
        if suspicious:
            record.suspicious_message_count = (record.suspicious_message_count or 0) + 1
            record.max_message_score = max(record.max_message_score or 0, analysis.risk_score)
            record.last_intent = analysis.intent
            record.last_amount = analysis.amount
            record.last_message_analysis_id = analysis.id
        score, band = compute_identifier_score(record)
        if record.status != "CONFIRMED_FRAUD":
            record.risk_score = score
            record.risk_band = band
        touched.append(record)
    db.flush()
    return touched


def record_report(db: Session, identifier: str, identifier_type: str, source: str = "USER") -> IdentifierRisk:
    record = get_or_create_identifier(db, identifier, identifier_type)
    record.report_count = (record.report_count or 0) + 1
    _add_source(record, "USER_REPORT" if source == "USER" else "PAYMENT_CANCEL")
    score, band = compute_identifier_score(record)
    if record.status != "CONFIRMED_FRAUD":
        record.risk_score = score
        record.risk_band = band
    db.flush()
    return record


def seed_known_fraud(db: Session, path: Path) -> int:
    """Load the seeded confirmed-fraud list. Idempotent."""
    if not path.exists():
        return 0
    payload = json.loads(path.read_text(encoding="utf-8"))
    count = 0
    for entry in payload.get("identifiers", []):
        normalised, id_type = classify_identifier(entry["identifier"])
        if not normalised:
            continue
        record = get_or_create_identifier(db, normalised, id_type or entry.get("type", "UPI"))
        if record.status == "CONFIRMED_FRAUD":
            continue
        record.status = "CONFIRMED_FRAUD"
        record.report_count = max(record.report_count or 0, int(entry.get("reports", 1)))
        record.notes = entry.get("note")
        _add_source(record, "SEED_LIST")
        record.risk_score, record.risk_band = compute_identifier_score(record)
        count += 1
    db.commit()
    return count
