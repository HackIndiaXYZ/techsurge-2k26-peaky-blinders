import { Check, CircleAlert } from "lucide-react";
import type { AnalyzeMessageResponse } from "@/lib/types";
import { displayIdentifier, formatInr } from "@/lib/utils";
import { IdentifierPill, RiskPill, ScoreBar, ScoreLockup } from "./RiskBadge";

/** Full breakdown of one analysed message. Used by the manual checker and the messenger "why" sheet. */
export function AnalysisResult({ result, showMessage = false }: { result: AnalyzeMessageResponse; showMessage?: boolean }) {
  const { entities } = result;
  const hasIdentifier = Boolean(entities.upi_id || entities.phone_number);

  return (
    <div>
      <div className="result-head">
        <div>
          <span className="mono-label">Payment intent</span>
          <h2>{result.is_payment_related ? result.intent_label : "No payment request"}</h2>
        </div>
        <ScoreLockup score={result.risk_score} band={result.risk_band} />
      </div>
      <ScoreBar score={result.risk_score} band={result.risk_band} />
      <RiskPill band={result.risk_band} />
      <p className="result-summary">{result.summary}</p>

      {showMessage && <blockquote className="sheet__evidence">{result.message}</blockquote>}

      {result.reasons.length > 0 && (
        <>
          <span className="mono-label section-label">Why PausePay flagged this</span>
          <ul className={`reason-list${result.risk_band === "LOW" ? " reason-list--safe" : ""}`}>
            {result.reasons.map((reason) => (
              <li key={reason}>
                {result.risk_band === "LOW" ? <Check size={14} aria-hidden="true" /> : <CircleAlert size={14} aria-hidden="true" />}
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </>
      )}

      <dl className="facts">
        <div>
          <dt>UPI ID</dt>
          <dd className="mono">{entities.upi_id ?? "—"}</dd>
        </div>
        <div>
          <dt>Phone</dt>
          <dd className="mono">{entities.phone_number ? displayIdentifier(entities.phone_number) : "—"}</dd>
        </div>
        <div>
          <dt>Amount</dt>
          <dd className="mono">{entities.amount !== null ? formatInr(entities.amount) : "—"}</dd>
        </div>
        <div>
          <dt>Model confidence</dt>
          <dd className="mono">{Math.round(result.intent_confidence * 100)}%</dd>
        </div>
      </dl>

      {hasIdentifier && (
        <>
          <span className="mono-label section-label">Identifier risk</span>
          {result.identifier_risks.length === 0 && <p className="empty">No stored history for this identifier.</p>}
          {result.identifier_risks.map((risk) => (
            <div className="identifier-row" key={risk.identifier}>
              <div>
                <code>{displayIdentifier(risk.identifier)}</code>
                <small>
                  {risk.suspicious_message_count} suspicious message{risk.suspicious_message_count === 1 ? "" : "s"} · {risk.report_count} report
                  {risk.report_count === 1 ? "" : "s"}
                </small>
              </div>
              <IdentifierPill band={risk.risk_band} />
            </div>
          ))}
        </>
      )}

      {result.signals.length > 0 && (
        <details>
          <summary className="link-button" style={{ marginBlockStart: "var(--space-md)" }}>
            Detected signals ({result.signals.length})
          </summary>
          <ul className="signal-list">
            {result.signals.map((signal) => (
              <li key={signal.code}>
                <span>{signal.label}</span>
                <span>+{signal.weight}</span>
              </li>
            ))}
          </ul>
        </details>
      )}

      <p className="latency">
        {result.cached ? "Stored result" : `Analysed in ${Math.round(result.latency_ms)} ms`} · {result.engine_version}
      </p>
    </div>
  );
}
