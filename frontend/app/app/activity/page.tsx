"use client";

import { RefreshCw, WifiOff } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useBackend } from "@/components/app/BackendStatus";
import { IdentifierPill, RiskPill } from "@/components/risk/RiskBadge";
import { errorMessage, getDashboard } from "@/lib/api";
import type { DashboardResponse, MessageAnalysis, PaymentVerification } from "@/lib/types";
import { displayIdentifier, formatInr, formatTime, humaniseAction } from "@/lib/utils";

type View = "messages" | "payments" | "identifiers";

function AnalysisRow({ a }: { a: MessageAnalysis }) {
  return (
    <li className="record">
      <div>
        <div className="record__title">{a.sender_label ?? (a.source === "MANUAL_CHECK" ? "Manual check" : "Message")}</div>
        <div className="record__sub">{a.message}</div>
        <div className="record__sub">
          {a.upi_id ?? (a.phone_number ? displayIdentifier(a.phone_number) : "no identifier")}
          {a.amount ? ` · ${formatInr(a.amount)}` : ""} · {formatTime(a.created_at)}
        </div>
      </div>
      <div className="record__aside">
        <RiskPill band={a.risk_band} score={a.risk_score} />
        <span className="mono-label">{a.intent.replace(/_/g, " ").toLowerCase()}</span>
      </div>
    </li>
  );
}

function VerificationRow({ v }: { v: PaymentVerification }) {
  return (
    <li className="record">
      <div>
        <div className="record__title">
          {formatInr(v.amount)} → {displayIdentifier(v.identifier)}
        </div>
        <div className="record__sub">{v.summary}</div>
        <div className="record__sub">{formatTime(v.created_at)}</div>
      </div>
      <div className="record__aside">
        <RiskPill band={v.risk_band} score={v.risk_score} />
        <span className="mono-label">{humaniseAction(v.user_action)}</span>
      </div>
    </li>
  );
}

export default function ActivityPage() {
  const { status, health } = useBackend();
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<View>("payments");

  const load = useCallback(() => {
    getDashboard()
      .then((d) => {
        setData(d);
        setError(null);
      })
      .catch((err) => setError(errorMessage(err)));
  }, []);

  useEffect(() => {
    load();
  }, [load, status]);

  const totals = data?.totals ?? {};

  return (
    <main className="app-content">
      <div className="screen-title" style={{ display: "flex", justifyContent: "space-between", alignItems: "end", gap: "var(--space-sm)" }}>
        <div>
          <span className="mono-label">PausePay activity</span>
          <h1>Recent checks</h1>
        </div>
        <button type="button" className="button button--subtle" onClick={load} aria-label="Refresh">
          <RefreshCw size={14} aria-hidden="true" /> Refresh
        </button>
      </div>

      {error && (
        <p className="notice notice--risk" role="alert">
          <WifiOff size={16} aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}

      <div className="stat-grid">
        <div className="stat">
          <strong>{totals.analyses ?? "–"}</strong>
          <span>messages analysed</span>
        </div>
        <div className="stat">
          <strong>{totals.interrupted ?? "–"}</strong>
          <span>payments paused</span>
        </div>
        <div className="stat">
          <strong>{totals.cancelled ?? "–"}</strong>
          <span>cancelled &amp; reported</span>
        </div>
        <div className="stat">
          <strong>{totals.continued_after_warning ?? "–"}</strong>
          <span>continued after warning</span>
        </div>
      </div>

      <div className="segmented" role="group" aria-label="Choose a list">
        <button type="button" aria-pressed={view === "payments"} onClick={() => setView("payments")}>
          Payments
        </button>
        <button type="button" aria-pressed={view === "messages"} onClick={() => setView("messages")}>
          Messages
        </button>
        <button type="button" aria-pressed={view === "identifiers"} onClick={() => setView("identifiers")}>
          Flagged IDs
        </button>
      </div>

      {view === "payments" && (
        <>
          <span className="mono-label">Recent payment checks</span>
          <ul className="record-list">
            {data?.recent_verifications.length === 0 && <li className="empty">No payment checks yet. Try the Pay tab.</li>}
            {data?.recent_verifications.map((v) => <VerificationRow key={v.id} v={v} />)}
          </ul>
        </>
      )}

      {view === "messages" && (
        <>
          <span className="mono-label">Recent message analyses</span>
          <ul className="record-list">
            {data?.recent_analyses.length === 0 && <li className="empty">Nothing analysed yet. Open a thread or use Check.</li>}
            {data?.recent_analyses.map((a) => <AnalysisRow key={a.id} a={a} />)}
          </ul>
        </>
      )}

      {view === "identifiers" && (
        <>
          <span className="mono-label">High-risk &amp; reported identifiers</span>
          <ul className="record-list">
            {data?.high_risk_identifiers.length === 0 && <li className="empty">No flagged identifiers yet.</li>}
            {data?.high_risk_identifiers.map((r) => (
              <li className="record" key={r.identifier}>
                <div>
                  <div className="record__title">{displayIdentifier(r.identifier)}</div>
                  <div className="record__sub">
                    {r.suspicious_message_count} suspicious message{r.suspicious_message_count === 1 ? "" : "s"} · {r.report_count} report{r.report_count === 1 ? "" : "s"}
                    {r.status === "CONFIRMED_FRAUD" ? " · seeded confirmed-fraud list" : ""}
                    {r.last_intent ? ` · last: ${r.last_intent.replace(/_/g, " ").toLowerCase()}` : ""}
                  </div>
                </div>
                <div className="record__aside">
                  <IdentifierPill band={r.risk_band} />
                  <span className="mono-label">{r.risk_score}/100</span>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {health?.metrics && (
        <p className="latency">
          Model {health.metrics.model_version} · {health.metrics.dataset_rows} synthetic rows · holdout intent acc{" "}
          {health.metrics.holdout ? Math.round(health.metrics.holdout.intent_accuracy * 100) : "–"}% · {health.engine_version}
        </p>
      )}
    </main>
  );
}
