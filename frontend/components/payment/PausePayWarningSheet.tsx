"use client";

import { CircleAlert, ShieldAlert, TriangleAlert } from "lucide-react";
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
    <BottomSheet open={open} onClose={onDismiss} labelledBy="pausepay-warning-title" blocking>
      <p className={`sheet__kicker sheet__kicker--${level}`}>
        {high ? <TriangleAlert size={15} aria-hidden="true" /> : <CircleAlert size={15} aria-hidden="true" />}
        PausePay {high ? "warning" : "review"}
      </p>
      <h2 id="pausepay-warning-title">{verification.title}</h2>
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
        <>
          <span className="mono-label section-label">Detected signals</span>
          <ul className="reason-list">
            {namedSignals.map((signal) => (
              <li key={signal.code}>
                <ShieldAlert size={14} aria-hidden="true" />
                <span>{signal.label}</span>
              </li>
            ))}
          </ul>
        </>
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
