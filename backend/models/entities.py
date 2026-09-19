"""ORM tables for the PausePay risk store."""

from datetime import datetime, timezone

from sqlalchemy import JSON, Boolean, DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class MessageAnalysis(Base):
    """One analysed message: classifier output, extracted entities and the risk assessment."""

    __tablename__ = "message_analyses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    source: Mapped[str] = mapped_column(String(32), default="MANUAL_CHECK")  # MANUAL_CHECK | MESSENGER_SIM | API
    source_ref: Mapped[str | None] = mapped_column(String(128), index=True)  # e.g. simulated message id
    sender_label: Mapped[str | None] = mapped_column(String(128))

    intent: Mapped[str] = mapped_column(String(48), index=True)
    intent_confidence: Mapped[float] = mapped_column(Float)
    is_payment_related: Mapped[bool] = mapped_column(Boolean, default=False)

    phone_number: Mapped[str | None] = mapped_column(String(32), index=True)
    upi_id: Mapped[str | None] = mapped_column(String(128), index=True)
    amount: Mapped[float | None] = mapped_column(Float)
    urls: Mapped[list] = mapped_column(JSON, default=list)
    keywords: Mapped[list] = mapped_column(JSON, default=list)

    risk_score: Mapped[int] = mapped_column(Integer, index=True)
    risk_band: Mapped[str] = mapped_column(String(16), index=True)
    signals: Mapped[list] = mapped_column(JSON, default=list)  # [{code, label, weight}]
    reasons: Mapped[list] = mapped_column(JSON, default=list)
    summary: Mapped[str] = mapped_column(Text, default="")

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, index=True)

    __table_args__ = (UniqueConstraint("source", "source_ref", name="uq_message_source_ref"),)


class IdentifierRisk(Base):
    """Accumulated risk profile for a phone number or UPI ID."""

    __tablename__ = "identifier_risks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    identifier: Mapped[str] = mapped_column(String(128), unique=True, index=True)
    identifier_type: Mapped[str] = mapped_column(String(8))  # PHONE | UPI

    risk_score: Mapped[int] = mapped_column(Integer, default=0)
    risk_band: Mapped[str] = mapped_column(String(16), default="UNKNOWN")  # UNKNOWN | LOW | SUSPICIOUS | HIGH_RISK
    status: Mapped[str] = mapped_column(String(24), default="UNVERIFIED")  # UNVERIFIED | CONFIRMED_FRAUD | TRUSTED

    suspicious_message_count: Mapped[int] = mapped_column(Integer, default=0)
    total_message_count: Mapped[int] = mapped_column(Integer, default=0)
    max_message_score: Mapped[int] = mapped_column(Integer, default=0)  # strongest message risk seen
    report_count: Mapped[int] = mapped_column(Integer, default=0)
    last_intent: Mapped[str | None] = mapped_column(String(48))
    last_amount: Mapped[float | None] = mapped_column(Float)
    last_message_analysis_id: Mapped[int | None] = mapped_column(ForeignKey("message_analyses.id"), nullable=True)
    sources: Mapped[list] = mapped_column(JSON, default=list)  # e.g. ["MESSAGE_ANALYSIS", "USER_REPORT", "SEED_LIST"]
    notes: Mapped[str | None] = mapped_column(Text)

    first_seen_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    last_message_analysis: Mapped["MessageAnalysis | None"] = relationship(foreign_keys=[last_message_analysis_id])


class FraudReport(Base):
    __tablename__ = "fraud_reports"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    identifier: Mapped[str] = mapped_column(String(128), index=True)
    identifier_type: Mapped[str] = mapped_column(String(8))
    reason: Mapped[str | None] = mapped_column(Text)
    amount: Mapped[float | None] = mapped_column(Float)
    source: Mapped[str] = mapped_column(String(32), default="USER")  # USER | PAYMENT_CANCEL | SEED
    payment_verification_id: Mapped[int | None] = mapped_column(ForeignKey("payment_verifications.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, index=True)


class PaymentVerification(Base):
    """A pre-payment check performed by the UPI simulator, plus the user's eventual decision."""

    __tablename__ = "payment_verifications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    identifier: Mapped[str] = mapped_column(String(128), index=True)
    identifier_type: Mapped[str] = mapped_column(String(8))
    payee_name: Mapped[str | None] = mapped_column(String(128))
    amount: Mapped[float] = mapped_column(Float)

    decision: Mapped[str] = mapped_column(String(16))  # ALLOW | REVIEW | INTERRUPT
    risk_score: Mapped[int] = mapped_column(Integer)
    risk_band: Mapped[str] = mapped_column(String(16))
    matched_context: Mapped[bool] = mapped_column(Boolean, default=False)
    matched_message_analysis_id: Mapped[int | None] = mapped_column(ForeignKey("message_analyses.id"), nullable=True)
    signals: Mapped[list] = mapped_column(JSON, default=list)
    reasons: Mapped[list] = mapped_column(JSON, default=list)
    summary: Mapped[str] = mapped_column(Text, default="")

    # Filled in when the user acts on the (possibly interrupted) payment.
    user_action: Mapped[str | None] = mapped_column(String(24), index=True)  # PAID | CANCELLED_REPORTED | CONTINUED_AFTER_WARNING | CANCELLED
    acted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, index=True)
    timeline: Mapped[list] = mapped_column(JSON, default=list)

    matched_message_analysis: Mapped["MessageAnalysis | None"] = relationship(foreign_keys=[matched_message_analysis_id])


class LedgerEntry(Base):
    """Synthetic user bank account transaction entry."""

    __tablename__ = "ledger_entries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    entry_type: Mapped[str] = mapped_column(String(16))  # CREDIT | DEBIT
    amount: Mapped[float] = mapped_column(Float)
    counterparty: Mapped[str | None] = mapped_column(String(128))
    description: Mapped[str | None] = mapped_column(String(256))
    reference_id: Mapped[str | None] = mapped_column(String(64), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, index=True)
