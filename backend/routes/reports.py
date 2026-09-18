from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from database import get_db
from models import FraudReport
from schemas import FraudReportOut, IdentifierRiskOut, ReportFraudRequest, ReportFraudResponse
from services import analysis_service
from services.analysis_service import InvalidIdentifier

router = APIRouter(tags=["reports"])


@router.post("/report-fraud", response_model=ReportFraudResponse)
def report_fraud(payload: ReportFraudRequest, db: Session = Depends(get_db)) -> ReportFraudResponse:
    try:
        report, record = analysis_service.report_fraud(db, payload.identifier, payload.reason, payload.amount, payload.verification_id)
    except InvalidIdentifier as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    kind = "UPI ID" if record.identifier_type == "UPI" else "number"
    return ReportFraudResponse(
        report=FraudReportOut.model_validate(report),
        identifier_risk=IdentifierRiskOut.model_validate(record),
        message=f"Thanks. This {kind} now has {record.report_count} report(s) and will be flagged in future checks.",
    )


@router.get("/reports", response_model=list[FraudReportOut])
def list_reports(db: Session = Depends(get_db)) -> list[FraudReportOut]:
    reports = db.scalars(select(FraudReport).order_by(FraudReport.created_at.desc()).limit(100)).all()
    return [FraudReportOut.model_validate(r) for r in reports]
