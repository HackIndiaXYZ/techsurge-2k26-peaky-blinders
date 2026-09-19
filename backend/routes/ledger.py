"""Synthetic bank ledger API routes.

Provides endpoints to inspect, check, create and reset simulated bank ledger
entries so PausePay can evaluate claims about accidental transfers or refunds.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from schemas.api import CheckCreditRequest, LedgerCheckResponse, LedgerEntryCreate, LedgerEntryOut
from services import ledger_service

router = APIRouter(prefix="/ledger", tags=["ledger"])


@router.get("", response_model=list[LedgerEntryOut])
def get_ledger(db: Session = Depends(get_db)) -> list[LedgerEntryOut]:
    """List synthetic bank ledger entries ordered by most recent first."""
    entries = ledger_service.get_ledger_entries(db)
    return [LedgerEntryOut.model_validate(e) for e in entries]


@router.post("/check", response_model=LedgerCheckResponse)
def check_credit(payload: CheckCreditRequest, db: Session = Depends(get_db)) -> LedgerCheckResponse:
    """Verify if a claimed credit amount actually exists in the user's ledger."""
    result = ledger_service.check_incoming_credit(db, payload.amount, payload.sender_name)
    return LedgerCheckResponse(
        claim_amount=result.claim_amount,
        matched=result.matched,
        matching_entry=LedgerEntryOut.model_validate(result.matching_entry) if result.matching_entry else None,
        unverified_incoming=result.unverified_incoming,
        summary=result.summary,
    )


@router.post("/entries", response_model=LedgerEntryOut)
def add_entry(payload: LedgerEntryCreate, db: Session = Depends(get_db)) -> LedgerEntryOut:
    """Add a simulated ledger entry (useful for interactive demos and testing)."""
    entry = ledger_service.add_ledger_entry(
        db=db,
        entry_type=payload.entry_type,
        amount=payload.amount,
        counterparty=payload.counterparty,
        description=payload.description,
        reference_id=payload.reference_id,
    )
    return LedgerEntryOut.model_validate(entry)


@router.post("/reset", response_model=list[LedgerEntryOut])
def reset_ledger(db: Session = Depends(get_db)) -> list[LedgerEntryOut]:
    """Reset the synthetic ledger to default initial seed transactions."""
    ledger_service.reset_synthetic_ledger(db)
    entries = ledger_service.get_ledger_entries(db)
    return [LedgerEntryOut.model_validate(e) for e in entries]
