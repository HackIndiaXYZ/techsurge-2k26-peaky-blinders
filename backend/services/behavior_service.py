"""User behavioral baseline profiling.

Models individual user transaction patterns:
  * Typical payment amount: ₹300–₹2,000 (baseline average: ₹800)
  * Typical hours: 9 AM–10 PM (09:00–22:00)
  * Payee familiarity: known contacts vs first-time payees
  * Velocity tracking: burst payment detection in short intervals
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from models import LedgerEntry, PaymentVerification
from services.entity_extractor import format_inr

# User Baseline Constants
DEFAULT_TYPICAL_AMOUNT = 800.0
DEFAULT_MIN_AMOUNT = 300.0
DEFAULT_MAX_AMOUNT = 2000.0
DEFAULT_HOUR_START = 9   # 9 AM
DEFAULT_HOUR_END = 22    # 10 PM

# Trusted contacts list (phone numbers, VPAs, names)
DEFAULT_TRUSTED_CONTACTS: dict[str, str] = {
    "rahul@oksbi": "Rahul Verma",
    "priya@okaxis": "Priya Sharma",
    "+919876543210": "Suresh K",
    "salary@techcorp": "TechCorp Inc",
    "lakeviewhospital@icici": "Lakeview Hospital",
}

# Verified merchant handles
DEFAULT_VERIFIED_MERCHANTS: set[str] = {
    "swiggy@icici",
    "zomato@hdfcbank",
    "amazonpay@apl",
    "uber@icici",
    "ola@sbi",
    "tatapower@icici",
    "bescom@sbi",
    "netflix@okhdfcbank",
}


@dataclass
class UserBaseline:
    typical_amount: float = DEFAULT_TYPICAL_AMOUNT
    typical_min_amount: float = DEFAULT_MIN_AMOUNT
    typical_max_amount: float = DEFAULT_MAX_AMOUNT
    typical_hour_start: int = DEFAULT_HOUR_START
    typical_hour_end: int = DEFAULT_HOUR_END
    new_payee_frequency: str = "low"
    trusted_contacts: dict[str, str] = field(default_factory=lambda: dict(DEFAULT_TRUSTED_CONTACTS))
    verified_merchants: set[str] = field(default_factory=lambda: set(DEFAULT_VERIFIED_MERCHANTS))

    def to_dict(self) -> dict[str, Any]:
        return {
            "typical_amount": self.typical_amount,
            "typical_min_amount": self.typical_min_amount,
            "typical_max_amount": self.typical_max_amount,
            "typical_range_display": f"{format_inr(self.typical_min_amount)} – {format_inr(self.typical_max_amount)}",
            "typical_hour_start": self.typical_hour_start,
            "typical_hour_end": self.typical_hour_end,
            "typical_hours_display": "9:00 AM – 10:00 PM",
            "new_payee_frequency": self.new_payee_frequency,
            "trusted_contacts_count": len(self.trusted_contacts),
            "summary": f"Typical transactions are {format_inr(self.typical_min_amount)}–{format_inr(self.typical_max_amount)} (avg {format_inr(self.typical_amount)}) to known contacts between 9 AM and 10 PM.",
        }


_baseline_profile = UserBaseline()


def get_baseline_profile() -> UserBaseline:
    return _baseline_profile


def reset_baseline_profile() -> UserBaseline:
    global _baseline_profile
    _baseline_profile = UserBaseline()
    return _baseline_profile


def get_payee_completed_payments(db: Session, identifier: str) -> int:
    """Count past completed payments to this recipient."""
    norm = identifier.strip().lower()
    verified_count = db.scalar(
        select(func.count(PaymentVerification.id))
        .where(
            func.lower(PaymentVerification.identifier) == norm,
            PaymentVerification.user_action.in_(["PAID", "CONTINUED_AFTER_WARNING"]),
        )
    )
    ledger_count = db.scalar(
        select(func.count(LedgerEntry.id))
        .where(
            LedgerEntry.entry_type == "DEBIT",
            func.lower(LedgerEntry.counterparty) == norm,
        )
    )
    return int((verified_count or 0) + (ledger_count or 0))


def get_recent_velocity_count(db: Session, window_minutes: int = 15, current_time: datetime | None = None) -> int:
    """Number of payment verifications created in the past N minutes."""
    now = current_time or datetime.now(timezone.utc)
    cutoff = now - timedelta(minutes=window_minutes)
    count = db.scalar(
        select(func.count(PaymentVerification.id))
        .where(PaymentVerification.created_at >= cutoff)
    )
    return int(count or 0)


def is_contact(identifier: str) -> bool:
    norm = identifier.strip().lower()
    return norm in {k.lower(): v for k, v in _baseline_profile.trusted_contacts.items()}


def is_merchant(identifier: str) -> bool:
    norm = identifier.strip().lower()
    return norm in {m.lower() for m in _baseline_profile.verified_merchants}


def evaluate_behavioral_context(
    db: Session,
    identifier: str,
    amount: float,
    current_time: datetime | None = None,
    explicit_context: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Calculate behavioral parameters and signals against the user baseline."""
    now = current_time or datetime.now(timezone.utc)
    hour = now.hour

    explicit = explicit_context or {}
    exp_behavior = explicit.get("behavior") or {}
    exp_payee = explicit.get("payee") or {}
    exp_payment = explicit.get("payment") or {}

    typical_amt = float(exp_behavior.get("typical_amount") or _baseline_profile.typical_amount)
    past_payments = exp_payee.get("previous_completed_payments")
    if past_payments is None:
        past_payments = get_payee_completed_payments(db, identifier)

    in_contacts = exp_payee.get("in_contacts")
    if in_contacts is None:
        in_contacts = is_contact(identifier)

    verified_merchant = exp_payee.get("verified_merchant")
    if verified_merchant is None:
        verified_merchant = is_merchant(identifier)

    # First time payee is true if 0 past payments and not in saved contacts
    is_first_time = exp_payee.get("is_first_time")
    if is_first_time is None:
        is_first_time = (past_payments == 0) and not in_contacts

    velocity = exp_behavior.get("recent_payment_count")
    if velocity is None:
        velocity = get_recent_velocity_count(db, window_minutes=15, current_time=now)

    payment_hour = exp_payment.get("payment_hour")
    if payment_hour is None:
        payment_hour = hour

    return {
        "behavior": {
            "typical_amount": typical_amt,
            "typical_min_amount": _baseline_profile.typical_min_amount,
            "typical_max_amount": _baseline_profile.typical_max_amount,
            "current_amount": amount,
            "typical_hour_start": _baseline_profile.typical_hour_start,
            "typical_hour_end": _baseline_profile.typical_hour_end,
            "recent_payment_count": velocity,
        },
        "payee": {
            "is_first_time": is_first_time,
            "in_contacts": in_contacts,
            "previous_completed_payments": past_payments,
            "established_payment_count": past_payments,
            "verified_merchant": verified_merchant,
        },
        "payment": {
            "payee": identifier,
            "payee_identifier": identifier,
            "amount": amount,
            "payment_hour": payment_hour,
        },
    }
