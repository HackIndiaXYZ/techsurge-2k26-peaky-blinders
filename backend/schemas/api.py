"""Request / response contracts for the PausePay API."""

from datetime import datetime, timezone
from typing import Annotated, Literal

from pydantic import AfterValidator, BaseModel, ConfigDict, Field, field_validator


def _ensure_utc(value: datetime) -> datetime:
    """SQLite drops tz info; every stored timestamp is UTC, so label it as such for clients."""
    return value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value


UtcDatetime = Annotated[datetime, AfterValidator(_ensure_utc)]

RiskBand = Literal["LOW", "MEDIUM", "HIGH"]
IdentifierBand = Literal["UNKNOWN", "LOW", "SUSPICIOUS", "HIGH_RISK"]
Decision = Literal["ALLOW", "REVIEW", "INTERRUPT"]
IdentifierType = Literal["PHONE", "UPI"]
UserAction = Literal["PAID", "CANCELLED", "CANCELLED_REPORTED", "CONTINUED_AFTER_WARNING"]
MessageSource = Literal["MANUAL_CHECK", "MESSENGER_SIM", "API"]


class Signal(BaseModel):
    code: str
    label: str
    weight: int
    family: str | None = None
    evidence: str | None = None


class Entities(BaseModel):
    phone_number: str | None = None
    upi_id: str | None = None
    amount: float | None = None
    amount_display: str | None = None
    phone_numbers: list[str] = Field(default_factory=list)
    upi_ids: list[str] = Field(default_factory=list)
    urls: list[str] = Field(default_factory=list)
    keywords: list[str] = Field(default_factory=list)


class IdentifierRiskOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    identifier: str
    identifier_type: IdentifierType
    risk_score: int
    risk_band: IdentifierBand
    status: str
    suspicious_message_count: int
    total_message_count: int
    max_message_score: int = 0
    report_count: int
    last_intent: str | None = None
    last_amount: float | None = None
    sources: list[str] = Field(default_factory=list)
    first_seen_at: UtcDatetime | None = None
    updated_at: UtcDatetime | None = None


class UnknownIdentifierOut(BaseModel):
    """Returned by GET /api/risk/{identifier} when nothing is on record."""

    identifier: str
    identifier_type: IdentifierType | None
    risk_score: int = 0
    risk_band: IdentifierBand = "UNKNOWN"
    status: str = "UNVERIFIED"
    suspicious_message_count: int = 0
    total_message_count: int = 0
    report_count: int = 0
    last_intent: str | None = None
    last_amount: float | None = None
    sources: list[str] = Field(default_factory=list)
    first_seen_at: UtcDatetime | None = None
    updated_at: UtcDatetime | None = None


# --- Message analysis -------------------------------------------------------


class AnalyzeMessageRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    source: MessageSource = "MANUAL_CHECK"
    source_ref: str | None = Field(default=None, max_length=128)
    sender_label: str | None = Field(default=None, max_length=128)

    @field_validator("message")
    @classmethod
    def _strip(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("message must not be blank")
        return value


class MessageAnalysisOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    message: str
    source: str
    source_ref: str | None = None
    sender_label: str | None = None
    intent: str
    intent_confidence: float
    is_payment_related: bool
    phone_number: str | None = None
    upi_id: str | None = None
    amount: float | None = None
    risk_score: int
    risk_band: RiskBand
    signals: list[Signal] = Field(default_factory=list)
    reasons: list[str] = Field(default_factory=list)
    summary: str
    created_at: UtcDatetime


class AnalyzeMessageResponse(BaseModel):
    id: int
    message: str
    source: str
    source_ref: str | None = None
    intent: str
    intent_label: str
    intent_confidence: float
    is_payment_related: bool
    is_suspicious_pattern: bool
    entities: Entities
    risk_score: int
    risk_band: RiskBand
    signals: list[Signal]
    reasons: list[str]
    summary: str
    identifier_risks: list[IdentifierRiskOut]
    created_at: UtcDatetime
    latency_ms: float
    cached: bool = False
    engine_version: str
    mitigators: list[Signal] = Field(default_factory=list)
    families: list[str] = Field(default_factory=list)
    override: bool = False
    override_reason: str | None = None


# --- Payee verification -----------------------------------------------------


class VerifyPayeeRequest(BaseModel):
    identifier: str = Field(min_length=3, max_length=128)
    amount: float = Field(gt=0, le=10_000_000)
    payee_name: str | None = Field(default=None, max_length=128)
    context: dict | None = None

    @field_validator("identifier")
    @classmethod
    def _strip_identifier(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("identifier must not be blank")
        return value


class MatchedMessage(BaseModel):
    id: int
    excerpt: str
    intent: str
    intent_label: str
    amount: float | None
    amount_match: bool
    risk_score: int
    risk_band: RiskBand
    sender_label: str | None = None
    source: str
    created_at: UtcDatetime


class LedgerEntryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    entry_type: str
    amount: float
    counterparty: str | None = None
    description: str | None = None
    reference_id: str | None = None
    created_at: UtcDatetime


class LedgerEntryCreate(BaseModel):
    entry_type: Literal["CREDIT", "DEBIT"] = "CREDIT"
    amount: float = Field(gt=0)
    counterparty: str | None = Field(default=None, max_length=128)
    description: str | None = Field(default=None, max_length=256)
    reference_id: str | None = Field(default=None, max_length=64)


class CheckCreditRequest(BaseModel):
    amount: float = Field(gt=0)
    sender_name: str | None = Field(default=None, max_length=128)


class LedgerCheckResponse(BaseModel):
    claim_amount: float = 0.0
    matched: bool = False
    matching_entry: LedgerEntryOut | None = None
    unverified_incoming: bool = False
    summary: str = ""


class GraphNode(BaseModel):
    id: str
    type: str
    label: str
    properties: dict = Field(default_factory=dict)


class GraphEdge(BaseModel):
    source: str
    target: str
    label: str
    properties: dict = Field(default_factory=dict)


class ContextGraph(BaseModel):
    nodes: list[GraphNode]
    edges: list[GraphEdge]


class VerifyPayeeResponse(BaseModel):
    verification_id: int
    identifier: str
    identifier_type: IdentifierType
    payee_name: str | None
    amount: float
    decision: Decision
    risk_score: int
    risk_band: RiskBand
    title: str
    summary: str
    reasons: list[str]
    signals: list[Signal]
    matched_context: bool
    matched_message: MatchedMessage | None = None
    identifier_risk: IdentifierRiskOut | UnknownIdentifierOut
    latency_ms: float
    engine_version: str
    mitigators: list[Signal] = Field(default_factory=list)
    families: list[str] = Field(default_factory=list)
    override: bool = False
    override_reason: str | None = None
    ledger_check: LedgerCheckResponse | None = None
    context_graph: ContextGraph | None = None
    timeline: list[dict] | None = None


class PaymentDecisionRequest(BaseModel):
    action: UserAction


class PaymentVerificationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    identifier: str
    identifier_type: str
    payee_name: str | None
    amount: float
    decision: Decision
    risk_score: int
    risk_band: RiskBand
    matched_context: bool
    matched_message_analysis_id: int | None = None
    reasons: list[str] = Field(default_factory=list)
    summary: str
    user_action: str | None = None
    acted_at: UtcDatetime | None = None
    created_at: UtcDatetime
    timeline: list[dict] | None = None


# --- Reporting --------------------------------------------------------------


class ReportFraudRequest(BaseModel):
    identifier: str = Field(min_length=3, max_length=128)
    reason: str | None = Field(default=None, max_length=500)
    amount: float | None = Field(default=None, ge=0)
    verification_id: int | None = None


class FraudReportOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    identifier: str
    identifier_type: str
    reason: str | None
    amount: float | None
    source: str
    created_at: UtcDatetime


class ReportFraudResponse(BaseModel):
    report: FraudReportOut
    identifier_risk: IdentifierRiskOut
    message: str


# --- History / dashboard ----------------------------------------------------


class HistoryResponse(BaseModel):
    analyses: list[MessageAnalysisOut]
    verifications: list[PaymentVerificationOut]


class DashboardResponse(BaseModel):
    totals: dict[str, int]
    recent_analyses: list[MessageAnalysisOut]
    recent_verifications: list[PaymentVerificationOut]
    high_risk_identifiers: list[IdentifierRiskOut]
    cancelled_payments: list[PaymentVerificationOut]
    continued_payments: list[PaymentVerificationOut]
    reports: list[FraudReportOut]


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    model_version: str | None
    engine_version: str
    database: str
    metrics: dict | None = None


# --- Simulated messenger ----------------------------------------------------


class SimMessageOut(BaseModel):
    id: str
    direction: Literal["in", "out"]
    text: str
    time: str


class ConversationOut(BaseModel):
    id: str
    name: str
    handle: str
    kind: Literal["contact", "business", "unknown"]
    preview: str
    messages: list[SimMessageOut]
