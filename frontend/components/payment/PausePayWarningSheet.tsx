"use client";

import { CircleAlert, Landmark, ShieldAlert, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { ScoreLockup } from "@/components/risk/RiskBadge";
import type { VerifyPayeeResponse } from "@/lib/types";
import { displayIdentifier, formatInr } from "@/lib/utils";

interface Props {
  open: boolean;
  verification: VerifyPayeeResponse;
  busy: "report" | "continue" | null;
  onCancelAndReport: () => void;
  onContinue: () => void;
  onDismiss: () => void;
}

/** The "pause before payment" moment. Shown for INTERRUPT (high) and REVIEW (medium) decisions. */
export function PausePayWarningSheet({ open, verification, busy, onCancelAndReport, onContinue, onDismiss }: Props) {
  const [confirming, setConfirming] = useState(false);
  const high = verification.decision === "INTERRUPT";
  const level = high ? "high" : "medium";
  const namedSignals = verification.signals.filter((s) => !["CONTEXT_MATCH", "AMOUNT_MATCH", "RECENT_MESSAGE"].includes(s.code)).slice(0, 4);
  const evidence = verification.matched_message;

  function handleContinue() {
    if (high && !confirming) {
      setConfirming(true);
      return;
    }
    onContinue();
  }

  return (
    <BottomSheet open={open} onClose={onDismiss} labelledBy="sheet-title" blocking>
      <p className={`sheet__kicker sheet__kicker--${level}`}>
        {high ? <TriangleAlert size={15} aria-hidden="true" /> : <CircleAlert size={15} aria-hidden="true" />}
        PausePay {high ? "warning" : "review"}
      </p>
      <h2 id="sheet-title" style={{ fontSize: "var(--text-md)", marginBottom: "0.5rem" }}>WHY PAUSEPAY PAUSED</h2>
      <p className="sheet__summary">{verification.summary}</p>

      <div className="sheet__score">
        <div>
          <span className="mono-label">Risk</span>
          <span style={{ fontSize: "var(--text-sm)", fontWeight: 620 }}>
            {formatInr(verification.amount)} → {displayIdentifier(verification.identifier)}
          </span>
        </div>
        <ScoreLockup score={verification.risk_score} band={verification.risk_band} />
      </div>

      {verification.ledger_check && verification.ledger_check.unverified_incoming && (
        <div className="notice notice--risk" style={{ margin: "var(--space-2) 0", display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
          <Landmark size={16} aria-hidden="true" style={{ flexShrink: 0, marginTop: "2px" }} />
          <div>
            <strong style={{ fontSize: "var(--text-xs)" }}>Simulated Bank Ledger Check</strong>
            <p style={{ margin: "2px 0 0 0", fontSize: "var(--text-xs)" }}>{verification.ledger_check.summary}</p>
          </div>
        </div>
      )}

      {evidence && (
        <blockquote className="sheet__evidence">
          <strong>
            Earlier message{evidence.sender_label ? ` from ${evidence.sender_label}` : ""} · {evidence.intent_label}
            {evidence.amount_match ? ` · same ${formatInr(evidence.amount)} amount` : ""}
          </strong>
          “{evidence.excerpt}”
        </blockquote>
      )}

      {namedSignals.length > 0 && (
        <div className="sheet__evidence-groups" style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "1rem", marginBottom: "1rem" }}>
          {/* Ledger Evidence (Hero Rule) */}
          {namedSignals.filter(s => s.code.includes("CREDIT") || s.code === "COUNTERPARTY_MISMATCH").map(s => (
            <div key={s.code} style={{ display: "flex", gap: "0.5rem", color: "var(--color-risk-fg)", fontWeight: 500, fontSize: "var(--text-sm)" }}>
              <TriangleAlert size={16} style={{ marginTop: 2 }} />
              <span>{s.evidence || s.label}</span>
            </div>
          ))}

          {/* Recipient Evidence */}
          {(() => {
            const recipientSignals = namedSignals.filter(s => s.family === "payee_identity" || s.code === "FIRST_TIME_PAYEE" || s.code === "ESCALATING_TO_NEW_PAYEE");
            if (recipientSignals.length === 0) return null;
            return (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <span className="mono-label section-label">Recipient</span>
                {recipientSignals.map(s => (
                  <p key={s.code} style={{ fontSize: "var(--text-sm)", margin: 0 }}>{s.evidence || s.label}</p>
                ))}
              </div>
            );
          })()}

          {/* Message Evidence */}
          {(() => {
            const msgSignals = namedSignals.filter(s => s.family === "social_engineering" || s.code.includes("MESSAGE"));
            if (msgSignals.length === 0) return null;
            return (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <span className="mono-label section-label">Message</span>
                {msgSignals.map(s => (
                  <p key={s.code} style={{ fontSize: "var(--text-sm)", margin: 0 }}>{s.evidence || s.label}</p>
                ))}
              </div>
            );
          })()}

          {/* Amount/Transaction Evidence */}
          {(() => {
            const amtSignals = namedSignals.filter(s => (s.family === "transaction" && s.code !== "FIRST_TIME_PAYEE" && s.code !== "ESCALATING_TO_NEW_PAYEE") || s.code.includes("AMOUNT"));
            if (amtSignals.length === 0) return null;
            return (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <span className="mono-label section-label">Amount & Timing</span>
                {amtSignals.map(s => (
                  <p key={s.code} style={{ fontSize: "var(--text-sm)", margin: 0 }}>{s.evidence || s.label}</p>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {verification.context_graph && verification.context_graph.nodes.length > 0 && (
        <details className="sheet__graph-details" style={{ margin: "var(--space-md) 0" }}>
          <summary className="link-button" style={{ fontSize: "var(--text-xs)" }}>
            ▸ See how PausePay connected this
          </summary>
          <div style={{ padding: "var(--space-sm) 0 var(--space-sm) var(--space-md)", borderLeft: "2px solid var(--color-border)", margin: "var(--space-sm) 0 0 var(--space-xs)", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <span className="mono-label section-label" style={{ marginBottom: "0.25rem" }}>CONTEXT</span>
            {verification.context_graph.nodes.map((node, i) => (
              <div key={node.id} style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                {i > 0 && <div style={{ color: "var(--color-muted)", fontSize: "0.7rem", paddingLeft: "0.5rem" }}>↓</div>}
                <div style={{ fontSize: "var(--text-sm)", fontWeight: 500, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  {node.label}
                </div>
              </div>
            ))}
          </div>
        </details>
      )}

      {confirming ? (
        <div className="sheet__actions">
          <p className="notice notice--risk">
            <TriangleAlert size={16} aria-hidden="true" />
            <span>PausePay considers this payment high risk. Do you still want to continue?</span>
          </p>
          <button type="button" className="button button--ghost button--block" onClick={onContinue} disabled={busy !== null}>
            {busy === "continue" ? <span className="spinner" aria-hidden="true" /> : null} Yes, continue anyway
          </button>
          <button type="button" className="button button--block" onClick={() => setConfirming(false)} disabled={busy !== null}>
            Go back
          </button>
        </div>
      ) : (
        <div className="sheet__actions">
          <button type="button" className="button button--risk button--block" onClick={onCancelAndReport} disabled={busy !== null}>
            {busy === "report" ? <span className="spinner" aria-hidden="true" /> : null} Cancel payment &amp; report
          </button>
          <button type="button" className="button button--ghost button--block" onClick={handleContinue} disabled={busy !== null}>
            {busy === "continue" ? <span className="spinner" aria-hidden="true" /> : null} Continue payment
          </button>
        </div>
      )}
      <p className="sheet__footnote">PausePay shows evidence; the decision stays with you.</p>
    </BottomSheet>
  );
}
