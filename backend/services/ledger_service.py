"""In-memory or SQLite synthetic bank ledger.

Tracks simulated incoming (CREDIT) and outgoing (DEBIT) account entries
so PausePay can verify whether accidental-transfer or refund claims match
an actual incoming transaction.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Literal

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from models import LedgerEntry


@dataclass
class LedgerCheckResult:
    claim_amount: float
    matched: bool
    matching_entry: LedgerEntry | None
    unverified_incoming: bool
    summary: str

    def to_dict(self) -> dict:
        return {
            "claim_amount": self.claim_amount,
            "matched": self.matched,
            "matching_entry": (
                {
                    "id": self.matching_entry.id,
                    "entry_type": self.matching_entry.entry_type,
                    "amount": self.matching_entry.amount,
                    "counterparty": self.matching_entry.counterparty,
                    "description": self.matching_entry.description,
                    "reference_id": self.matching_entry.reference_id,
                    "created_at": self.matching_entry.created_at,
                }
                if self.matching_entry
                else None
            ),
            "unverified_incoming": self.unverified_incoming,
            "summary": self.summary,
        }


def amounts_match(a: float | None, b: float | None, tolerance: float = 0.01) -> bool:
    if a is None or b is None:
        return False
    return abs(a - b) <= max(1.0, tolerance * max(a, b))


def seed_synthetic_ledger(db: Session, force_reset: bool = False) -> int:
    """Populate default synthetic ledger entries if empty or on reset."""
    if force_reset:
        db.execute(delete(LedgerEntry))
        db.commit()
    else:
        existing_count = db.scalar(select(LedgerEntry.id).limit(1))
        if existing_count is not None:
            return 0

    now = datetime.now(timezone.utc)
    entries = [
        LedgerEntry(
            entry_type="CREDIT",
            amount=2000.0,
            counterparty="Salary / TechCorp Inc",
            description="Monthly payroll credit",
            reference_id="UPI/CR/20260918/001928",
            created_at=now,
        ),
        LedgerEntry(
            entry_type="DEBIT",
            amount=300.0,
            counterparty="rahul@oksbi",
            description="Lunch split payment",
            reference_id="UPI/DR/20260918/002104",
            created_at=now,
        ),
        LedgerEntry(
            entry_type="CREDIT",
            amount=1500.0,
            counterparty="Priya Sharma",
            description="Split weekend expenses",
            reference_id="UPI/CR/20260917/008812",
            created_at=now,
        ),
    ]
    for e in entries:
        db.add(e)
    db.commit()
    return len(entries)


def reset_synthetic_ledger(db: Session) -> int:
    """Reset the synthetic ledger to clean initial seed data."""
    return seed_synthetic_ledger(db, force_reset=True)


def add_ledger_entry(
    db: Session,
    entry_type: Literal["CREDIT", "DEBIT"],
    amount: float,
    counterparty: str | None = None,
    description: str | None = None,
    reference_id: str | None = None,
) -> LedgerEntry:
    """Create a simulated bank ledger entry for interactive demos and testing."""
    entry = LedgerEntry(
        entry_type=entry_type,
        amount=amount,
        counterparty=counterparty,
        description=description,
        reference_id=reference_id or f"UPI/{'CR' if entry_type == 'CREDIT' else 'DR'}/{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}",
        created_at=datetime.now(timezone.utc),
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


def check_incoming_credit(db: Session, amount: float | None, sender_name: str | None = None) -> LedgerCheckResult:
    """Verify if a claimed credit amount actually exists in the user's ledger."""
    if amount is None or amount <= 0:
        return LedgerCheckResult(
            claim_amount=0.0,
            matched=False,
            matching_entry=None,
            unverified_incoming=False,
            summary="No claim amount specified to verify against ledger.",
        )

    credits = db.scalars(
        select(LedgerEntry)
        .where(LedgerEntry.entry_type == "CREDIT")
        .order_by(LedgerEntry.created_at.desc())
    ).all()

    matched_entry = next((e for e in credits if amounts_match(e.amount, amount)), None)

    if matched_entry is not None:
        return LedgerCheckResult(
            claim_amount=amount,
            matched=True,
            matching_entry=matched_entry,
            unverified_incoming=False,
            summary=f"Matching incoming credit of ₹{amount:,.0f} found in ledger ({matched_entry.counterparty or 'Verified credit'}).",
        )

    return LedgerCheckResult(
        claim_amount=amount,
        matched=False,
        matching_entry=None,
        unverified_incoming=True,
        summary=f"No matching incoming ₹{amount:,.0f} credit found in your account ledger.",
    )


def get_ledger_entries(db: Session, limit: int = 50) -> list[LedgerEntry]:
    return db.scalars(
        select(LedgerEntry).order_by(LedgerEntry.created_at.desc()).limit(limit)
    ).all()

