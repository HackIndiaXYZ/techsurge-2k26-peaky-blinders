/**
 * PausePay API client.
 *
 * Every call goes to the FastAPI backend (NEXT_PUBLIC_PAUSEPAY_API_URL, default
 * http://127.0.0.1:8000). There is deliberately no fallback to local/fake
 * results: if the backend is unreachable the caller receives an
 * ApiUnavailableError and must show the "temporarily unavailable" state.
 */

import type {
  AnalyzeMessageRequest,
  AnalyzeMessageResponse,
  Conversation,
  DashboardResponse,
  HealthResponse,
  HistoryResponse,
  IdentifierRisk,
  PaymentVerification,
  ReportFraudRequest,
  ReportFraudResponse,
  UserAction,
  VerifyPayeeRequest,
  VerifyPayeeResponse,
} from "./types";

export const API_BASE_URL = (process.env.NEXT_PUBLIC_PAUSEPAY_API_URL ?? "http://127.0.0.1:8000").replace(/\/$/, "");
const DEFAULT_TIMEOUT_MS = 8000;

export const UNAVAILABLE_MESSAGE = "PausePay verification temporarily unavailable.";

export class ApiError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/** Backend unreachable, timed out, or returned 5xx. */
export class ApiUnavailableError extends Error {
  constructor(message = UNAVAILABLE_MESSAGE) {
    super(message);
    this.name = "ApiUnavailableError";
  }
}

function extractDetail(body: unknown): string | null {
  if (body && typeof body === "object" && "detail" in body) {
    const detail = (body as { detail: unknown }).detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail) && detail.length > 0) {
      const first = detail[0] as { msg?: string };
      if (first?.msg) return first.msg.replace(/^Value error, /, "");
    }
  }
  return null;
}

async function request<T>(path: string, init: RequestInit = {}, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", Accept: "application/json", ...(init.headers ?? {}) },
      signal: controller.signal,
      cache: "no-store",
    });
  } catch {
    clearTimeout(timer);
    throw new ApiUnavailableError();
  }
  clearTimeout(timer);

  if (response.status >= 500) {
    throw new ApiUnavailableError();
  }
  const body = (await response.json().catch(() => null)) as unknown;
  if (!response.ok) {
    throw new ApiError(extractDetail(body) ?? `Request failed (${response.status})`, response.status);
  }
  return body as T;
}

export function analyzeMessage(payload: AnalyzeMessageRequest): Promise<AnalyzeMessageResponse> {
  return request<AnalyzeMessageResponse>("/api/analyze-message", { method: "POST", body: JSON.stringify(payload) });
}

export function verifyPayee(payload: VerifyPayeeRequest): Promise<VerifyPayeeResponse> {
  return request<VerifyPayeeResponse>("/api/verify-payee", { method: "POST", body: JSON.stringify(payload) });
}

export function reportFraud(payload: ReportFraudRequest): Promise<ReportFraudResponse> {
  return request<ReportFraudResponse>("/api/report-fraud", { method: "POST", body: JSON.stringify(payload) });
}

export function recordPaymentDecision(verificationId: number, action: UserAction): Promise<PaymentVerification> {
  return request<PaymentVerification>(`/api/payments/${verificationId}/decision`, { method: "POST", body: JSON.stringify({ action }) });
}

export function getRisk(identifier: string): Promise<IdentifierRisk> {
  return request<IdentifierRisk>(`/api/risk/${encodeURIComponent(identifier)}`);
}

export function getHistory(limit = 25): Promise<HistoryResponse> {
  return request<HistoryResponse>(`/api/analysis-history?limit=${limit}`);
}

export function getDashboard(): Promise<DashboardResponse> {
  return request<DashboardResponse>("/api/dashboard");
}

export function getHealth(): Promise<HealthResponse> {
  return request<HealthResponse>("/api/health", {}, 4000);
}

export function getConversations(): Promise<Conversation[]> {
  return request<Conversation[]>("/api/conversations");
}

/** Human message for any error thrown by this module. */
export function errorMessage(error: unknown): string {
  if (error instanceof ApiUnavailableError) return error.message;
  if (error instanceof ApiError) return error.message;
  return UNAVAILABLE_MESSAGE;
}
