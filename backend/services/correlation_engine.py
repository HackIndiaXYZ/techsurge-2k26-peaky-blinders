"""Message → payment correlation.

When the user is about to pay an identifier, look for stored message analyses
that mention the same normalised identifier and pick the strongest one.
Amount agreement and recency are reported so the explanation can cite them.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone

from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from models import MessageAnalysis


@dataclass
class Correlation:
    message: MessageAnalysis | None
    amount_match: bool
    hours_since: float | None

    @property
    def matched(self) -> bool:
        return self.message is not None


def _hours_between(then: datetime, now: datetime) -> float:
    if then.tzinfo is None:
        then = then.replace(tzinfo=timezone.utc)
    return max(0.0, (now - then).total_seconds() / 3600)


def amounts_match(a: float | None, b: float | None, tolerance: float = 0.01) -> bool:
    if a is None or b is None:
        return False
    return abs(a - b) <= max(1.0, tolerance * max(a, b))


def correlate_payment(db: Session, identifier: str, amount: float, now: datetime | None = None) -> Correlation:
    """Find the strongest suspicious message that referenced this identifier."""
    now = now or datetime.now(timezone.utc)
    candidates = db.scalars(
        select(MessageAnalysis)
        .where(or_(MessageAnalysis.upi_id == identifier, MessageAnalysis.phone_number == identifier))
        .where(MessageAnalysis.is_payment_related.is_(True))
        .where(MessageAnalysis.risk_band.in_(["MEDIUM", "HIGH"]))
        .order_by(MessageAnalysis.risk_score.desc(), MessageAnalysis.created_at.desc())
        .limit(10)
    ).all()
    if not candidates:
        return Correlation(message=None, amount_match=False, hours_since=None)

    # Prefer an amount match when several suspicious messages exist; otherwise the riskiest.
    best = next((m for m in candidates if amounts_match(m.amount, amount)), candidates[0])
    return Correlation(
        message=best,
        amount_match=amounts_match(best.amount, amount),
        hours_since=_hours_between(best.created_at, now),
    )
