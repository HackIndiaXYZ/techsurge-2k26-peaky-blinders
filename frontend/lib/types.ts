/** Types mirroring the FastAPI schemas in backend/schemas/api.py. */

export type RiskBand = "LOW" | "MEDIUM" | "HIGH";
export type IdentifierBand = "UNKNOWN" | "LOW" | "SUSPICIOUS" | "HIGH_RISK";
export type Decision = "ALLOW" | "REVIEW" | "INTERRUPT";
export type IdentifierType = "PHONE" | "UPI";
export type UserAction = "PAID" | "CANCELLED" | "CANCELLED_REPORTED" | "CONTINUED_AFTER_WARNING";
export type MessageSource = "MANUAL_CHECK" | "MESSENGER_SIM" | "API";

export interface Signal {
  code: string;
  label: string;
  weight: number;
  family?: string;
  evidence?: string;
}

export interface Entities {
  phone_number: string | null;
  upi_id: string | null;
  amount: number | null;
  amount_display: string | null;
  phone_numbers: string[];
  upi_ids: string[];
  urls: string[];
  keywords: string[];
}

export interface IdentifierRisk {
  identifier: string;
  identifier_type: IdentifierType | null;
  risk_score: number;
  risk_band: IdentifierBand;
  status: string;
  suspicious_message_count: number;
  total_message_count: number;
  max_message_score?: number;
  report_count: number;
  last_intent: string | null;
  last_amount: number | null;
  sources: string[];
  first_seen_at: string | null;
  updated_at: string | null;
}

export interface AnalyzeMessageRequest {
  message: string;
  source?: MessageSource;
  source_ref?: string;
  sender_label?: string;
}

export interface AnalyzeMessageResponse {
  id: number;
  message: string;
  source: string;
  source_ref: string | null;
  intent: string;
  intent_label: string;
  intent_confidence: number;
  is_payment_related: boolean;
  is_suspicious_pattern: boolean;
  entities: Entities;
  risk_score: number;
  risk_band: RiskBand;
  signals: Signal[];
  reasons: string[];
  summary: string;
  identifier_risks: IdentifierRisk[];
  created_at: string;
  latency_ms: number;
  cached: boolean;
  engine_version: string;
}

export interface MessageAnalysis {
  id: number;
  message: string;
  source: string;
  source_ref: string | null;
  sender_label: string | null;
  intent: string;
  intent_confidence: number;
  is_payment_related: boolean;
  phone_number: string | null;
  upi_id: string | null;
  amount: number | null;
  risk_score: number;
  risk_band: RiskBand;
  signals: Signal[];
  reasons: string[];
  summary: string;
  created_at: string;
}

export interface VerifyPayeeRequest {
  identifier: string;
  amount: number;
  payee_name?: string;
}

export interface MatchedMessage {
  id: number;
  excerpt: string;
  intent: string;
  intent_label: string;
  amount: number | null;
  amount_match: boolean;
  risk_score: number;
  risk_band: RiskBand;
  sender_label: string | null;
  source: string;
  created_at: string;
}

export interface LedgerEntry {
  id: number;
  entry_type: "CREDIT" | "DEBIT";
  amount: number;
  counterparty: string | null;
  description: string | null;
  reference_id: string | null;
  created_at: string;
}

export interface LedgerCheckResult {
  claim_amount: number;
  matched: boolean;
  matching_entry: LedgerEntry | null;
  unverified_incoming: boolean;
  summary: string;
}

export interface GraphNode {
  id: string;
  type: string;
  label: string;
  properties: Record<string, any>;
}

export interface GraphEdge {
  source: string;
  target: string;
  label: string;
  properties: Record<string, any>;
}

export interface ContextGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface TimelineEvent {
  step: string;
  timestamp: string;
}

export interface VerifyPayeeResponse {
  verification_id: number;
  identifier: string;
  identifier_type: IdentifierType;
  payee_name: string | null;
  amount: number;
  decision: Decision;
  risk_score: number;
  risk_band: RiskBand;
  title: string;
  summary: string;
  reasons: string[];
  signals: Signal[];
  matched_context: boolean;
  matched_message: MatchedMessage | null;
  identifier_risk: IdentifierRisk;
  latency_ms: number;
  engine_version: string;
  mitigators?: Signal[];
  families?: string[];
  override?: boolean;
  override_reason?: string | null;
  ledger_check?: LedgerCheckResult | null;
  context_graph?: ContextGraph | null;
  timeline?: TimelineEvent[];
}

export interface PaymentVerification {
  id: number;
  identifier: string;
  identifier_type: string;
  payee_name: string | null;
  amount: number;
  decision: Decision;
  risk_score: number;
  risk_band: RiskBand;
  matched_context: boolean;
  matched_message_analysis_id: number | null;
  reasons: string[];
  summary: string;
  user_action: UserAction | null;
  acted_at: string | null;
  created_at: string;
  timeline?: TimelineEvent[];
}

export interface FraudReport {
  id: number;
  identifier: string;
  identifier_type: string;
  reason: string | null;
  amount: number | null;
  source: string;
  created_at: string;
}

export interface ReportFraudRequest {
  identifier: string;
  reason?: string;
  amount?: number;
  verification_id?: number;
}

export interface ReportFraudResponse {
  report: FraudReport;
  identifier_risk: IdentifierRisk;
  message: string;
}

export interface HistoryResponse {
  analyses: MessageAnalysis[];
  verifications: PaymentVerification[];
}

export interface DashboardResponse {
  totals: Record<string, number>;
  recent_analyses: MessageAnalysis[];
  recent_verifications: PaymentVerification[];
  high_risk_identifiers: IdentifierRisk[];
  cancelled_payments: PaymentVerification[];
  continued_payments: PaymentVerification[];
  reports: FraudReport[];
}

export interface HoldoutMetrics {
  rows: number;
  intent_accuracy: number;
  intent_f1_macro: number;
  payment_related_accuracy: number;
  fraud_accuracy: number;
  fraud_precision: number;
  fraud_recall: number;
  fraud_f1: number;
}

export interface HealthResponse {
  status: string;
  model_loaded: boolean;
  model_version: string | null;
  engine_version: string;
  database: string;
  metrics: {
    model_version: string;
    dataset_rows: number;
    intent_accuracy: number;
    intent_f1_macro: number;
    fraud_precision: number;
    fraud_recall: number;
    holdout: HoldoutMetrics | null;
    avg_inference_latency_ms: number;
  } | null;
}

export interface SimMessage {
  id: string;
  direction: "in" | "out";
  text: string;
  time: string;
}

export interface Conversation {
  id: string;
  name: string;
  handle: string;
  kind: "contact" | "business" | "unknown";
  preview: string;
  messages: SimMessage[];
}
