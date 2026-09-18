from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from config import settings
from database import get_db
from schemas import IdentifierRiskOut, PaymentDecisionRequest, PaymentVerificationOut, VerifyPayeeRequest, VerifyPayeeResponse
from schemas.api import UnknownIdentifierOut
from services import analysis_service
from services.analysis_service import InvalidIdentifier

router = APIRouter(tags=["payments"])


@router.post("/verify-payee", response_model=VerifyPayeeResponse)
def verify_payee(payload: VerifyPayeeRequest, db: Session = Depends(get_db)) -> VerifyPayeeResponse:
    try:
        verification, record, matched, latency_ms = analysis_service.verify_payee(db, payload.identifier, payload.amount, payload.payee_name)
    except InvalidIdentifier as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    identifier_risk = (
        IdentifierRiskOut.model_validate(record)
        if record is not None
        else UnknownIdentifierOut(identifier=verification.identifier, identifier_type=verification.identifier_type)
    )
    return VerifyPayeeResponse(
        verification_id=verification.id,
        identifier=verification.identifier,
        identifier_type=verification.identifier_type,
        payee_name=verification.payee_name,
        amount=verification.amount,
        decision=verification.decision,
        risk_score=verification.risk_score,
        risk_band=verification.risk_band,
        title=verification.title,
        summary=verification.summary,
        reasons=verification.reasons,
        signals=verification.signals,
        matched_context=verification.matched_context,
        matched_message=matched,
        identifier_risk=identifier_risk,
        latency_ms=round(latency_ms, 2),
        engine_version=settings.engine_version,
    )


@router.post("/payments/{verification_id}/decision", response_model=PaymentVerificationOut)
def record_decision(verification_id: int, payload: PaymentDecisionRequest, db: Session = Depends(get_db)) -> PaymentVerificationOut:
    verification = analysis_service.record_payment_decision(db, verification_id, payload.action)
    if verification is None:
        raise HTTPException(status_code=404, detail="Payment verification not found")
    return PaymentVerificationOut.model_validate(verification)
