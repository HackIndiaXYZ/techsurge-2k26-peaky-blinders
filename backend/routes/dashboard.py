from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from database import get_db
from models import FraudReport, IdentifierRisk, MessageAnalysis, PaymentVerification
from schemas import DashboardResponse, FraudReportOut, IdentifierRiskOut, MessageAnalysisOut, PaymentVerificationOut

router = APIRouter(tags=["dashboard"])


@router.get("/dashboard", response_model=DashboardResponse)
def dashboard(db: Session = Depends(get_db)) -> DashboardResponse:
    def count(stmt) -> int:
        return int(db.scalar(stmt) or 0)

    totals = {
        "analyses": count(select(func.count()).select_from(MessageAnalysis)),
        "high_risk_messages": count(select(func.count()).select_from(MessageAnalysis).where(MessageAnalysis.risk_band == "HIGH")),
        "verifications": count(select(func.count()).select_from(PaymentVerification)),
        "interrupted": count(select(func.count()).select_from(PaymentVerification).where(PaymentVerification.decision == "INTERRUPT")),
        "cancelled": count(select(func.count()).select_from(PaymentVerification).where(PaymentVerification.user_action.in_(["CANCELLED", "CANCELLED_REPORTED"]))),
        "continued_after_warning": count(select(func.count()).select_from(PaymentVerification).where(PaymentVerification.user_action == "CONTINUED_AFTER_WARNING")),
        "reports": count(select(func.count()).select_from(FraudReport)),
        "flagged_identifiers": count(select(func.count()).select_from(IdentifierRisk).where(IdentifierRisk.risk_band.in_(["SUSPICIOUS", "HIGH_RISK"]))),
    }

    recent_analyses = db.scalars(select(MessageAnalysis).order_by(MessageAnalysis.created_at.desc(), MessageAnalysis.id.desc()).limit(12)).all()
    recent_verifications = db.scalars(select(PaymentVerification).order_by(PaymentVerification.created_at.desc(), PaymentVerification.id.desc()).limit(12)).all()
    high_risk = db.scalars(
        select(IdentifierRisk).where(IdentifierRisk.risk_band.in_(["SUSPICIOUS", "HIGH_RISK"])).order_by(IdentifierRisk.risk_score.desc(), IdentifierRisk.updated_at.desc()).limit(12)
    ).all()
    cancelled = db.scalars(
        select(PaymentVerification).where(PaymentVerification.user_action.in_(["CANCELLED", "CANCELLED_REPORTED"])).order_by(PaymentVerification.acted_at.desc()).limit(8)
    ).all()
    continued = db.scalars(
        select(PaymentVerification).where(PaymentVerification.user_action == "CONTINUED_AFTER_WARNING").order_by(PaymentVerification.acted_at.desc()).limit(8)
    ).all()
    reports = db.scalars(select(FraudReport).order_by(FraudReport.created_at.desc()).limit(8)).all()

    return DashboardResponse(
        totals=totals,
        recent_analyses=[MessageAnalysisOut.model_validate(a) for a in recent_analyses],
        recent_verifications=[PaymentVerificationOut.model_validate(v) for v in recent_verifications],
        high_risk_identifiers=[IdentifierRiskOut.model_validate(i) for i in high_risk],
        cancelled_payments=[PaymentVerificationOut.model_validate(v) for v in cancelled],
        continued_payments=[PaymentVerificationOut.model_validate(v) for v in continued],
        reports=[FraudReportOut.model_validate(r) for r in reports],
    )
