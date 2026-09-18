from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from config import settings
from database import get_db
from models import IdentifierRisk, MessageAnalysis, PaymentVerification
from schemas import AnalyzeMessageRequest, AnalyzeMessageResponse, HistoryResponse, IdentifierRiskOut, MessageAnalysisOut, PaymentVerificationOut
from schemas.api import UnknownIdentifierOut
from services import analysis_service
from services.entity_extractor import classify_identifier
from services.intent_detector import INTENT_LABELS, SCAM_INTENTS

router = APIRouter(tags=["analysis"])


@router.post("/analyze-message", response_model=AnalyzeMessageResponse)
def analyze_message(payload: AnalyzeMessageRequest, db: Session = Depends(get_db)) -> AnalyzeMessageResponse:
    try:
        analysis, records, entities, latency_ms, cached = analysis_service.analyze_message(
            db, payload.message, source=payload.source, source_ref=payload.source_ref, sender_label=payload.sender_label
        )
    except FileNotFoundError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    return AnalyzeMessageResponse(
        id=analysis.id,
        message=analysis.message,
        source=analysis.source,
        source_ref=analysis.source_ref,
        intent=analysis.intent,
        intent_label=INTENT_LABELS.get(analysis.intent, analysis.intent),
        intent_confidence=analysis.intent_confidence,
        is_payment_related=analysis.is_payment_related,
        is_suspicious_pattern=analysis.intent in SCAM_INTENTS,
        entities=entities,
        risk_score=analysis.risk_score,
        risk_band=analysis.risk_band,
        signals=analysis.signals,
        reasons=analysis.reasons,
        summary=analysis.summary,
        identifier_risks=[IdentifierRiskOut.model_validate(r) for r in records],
        created_at=analysis.created_at,
        latency_ms=round(latency_ms, 2),
        cached=cached,
        engine_version=settings.engine_version,
    )


@router.get("/risk/{identifier}", response_model=IdentifierRiskOut | UnknownIdentifierOut)
def get_risk(identifier: str, db: Session = Depends(get_db)):
    normalised, id_type = classify_identifier(identifier)
    if not normalised:
        raise HTTPException(status_code=422, detail="Enter a valid UPI ID (name@bank) or a 10-digit Indian mobile number.")
    record = db.scalar(select(IdentifierRisk).where(IdentifierRisk.identifier == normalised))
    if record is None:
        return UnknownIdentifierOut(identifier=normalised, identifier_type=id_type)
    return IdentifierRiskOut.model_validate(record)


@router.get("/analysis-history", response_model=HistoryResponse)
def analysis_history(limit: int = Query(default=25, ge=1, le=200), db: Session = Depends(get_db)) -> HistoryResponse:
    analyses = db.scalars(select(MessageAnalysis).order_by(MessageAnalysis.created_at.desc(), MessageAnalysis.id.desc()).limit(limit)).all()
    verifications = db.scalars(select(PaymentVerification).order_by(PaymentVerification.created_at.desc(), PaymentVerification.id.desc()).limit(limit)).all()
    return HistoryResponse(
        analyses=[MessageAnalysisOut.model_validate(a) for a in analyses],
        verifications=[PaymentVerificationOut.model_validate(v) for v in verifications],
    )


@router.get("/analysis/{analysis_id}", response_model=MessageAnalysisOut)
def get_analysis(analysis_id: int, db: Session = Depends(get_db)) -> MessageAnalysisOut:
    analysis = db.get(MessageAnalysis, analysis_id)
    if analysis is None:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return MessageAnalysisOut.model_validate(analysis)
