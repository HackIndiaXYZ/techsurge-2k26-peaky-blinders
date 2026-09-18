"use client";

import { ArrowLeft, Check, CircleAlert, ShieldCheck, TriangleAlert, WifiOff, X } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { PausePayWarningSheet } from "@/components/payment/PausePayWarningSheet";
import { IdentifierPill } from "@/components/risk/RiskBadge";
import { ApiError, ApiUnavailableError, errorMessage, recordPaymentDecision, reportFraud, verifyPayee } from "@/lib/api";
import type { VerifyPayeeResponse } from "@/lib/types";
import { displayIdentifier, formatInr } from "@/lib/utils";

type Step = "payee" | "amount" | "confirm" | "paid" | "cancelled" | "continued";

const scenarios = [
  { label: "Rahul · ₹300", to: "rahul@oksbi", amount: "300", name: "Rahul Verma" },
  { label: "secureverify@upi · ₹4,999", to: "secureverify@upi", amount: "4999", name: "" },
  { label: "rewards.claim@upi · ₹499", to: "rewards.claim@upi", amount: "499", name: "" },
  { label: "Unknown payee · ₹1,200", to: "meera.iyer@okhdfcbank", amount: "1200", name: "Meera Iyer" },
];

const UPI_RE = /^[a-z0-9][a-z0-9._-]{1,63}@[a-z][a-z0-9]{1,31}$/i;
const PHONE_RE = /^(?:\+?91[\s-]?|0)?[6-9]\d{4}[\s-]?\d{5}$/;

function looksValid(value: string): boolean {
  const v = value.trim();
  return UPI_RE.test(v) || PHONE_RE.test(v);
}

function PayFlow() {
  const params = useSearchParams();
  const [step, setStep] = useState<Step>("payee");
  const [to, setTo] = useState(params.get("to") ?? "");
  const [name, setName] = useState(params.get("name") ?? "");
  const [amount, setAmount] = useState(params.get("amount") ?? "");
  const [touched, setTouched] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verification, setVerification] = useState<VerifyPayeeResponse | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [busy, setBusy] = useState<"report" | "continue" | "pay" | null>(null);
  const [error, setError] = useState<{ message: string; unavailable: boolean } | null>(null);
  const [reportNote, setReportNote] = useState<string | null>(null);

  useEffect(() => {
    if (params.get("to")) setStep("amount");
  }, [params]);

  const amountNumber = Number(amount);
  const amountValid = Number.isFinite(amountNumber) && amountNumber > 0 && amountNumber <= 10_000_000;

  function reset() {
    setStep("payee");
    setTo("");
    setName("");
    setAmount("");
    setVerification(null);
    setError(null);
    setReportNote(null);
    setTouched(false);
  }

  async function verify() {
    if (!amountValid || verifying) return;
    setVerifying(true);
    setError(null);
    try {
      const result = await verifyPayee({ identifier: to.trim(), amount: amountNumber, payee_name: name.trim() || undefined });
      setVerification(result);
      setStep("confirm");
      if (result.decision !== "ALLOW") setSheetOpen(true);
    } catch (err) {
      setError({ message: errorMessage(err), unavailable: err instanceof ApiUnavailableError });
      if (err instanceof ApiError && err.status === 422) setStep("payee");
    } finally {
      setVerifying(false);
    }
  }

  async function pay() {
    if (!verification) return;
    setBusy("pay");
    try {
      await recordPaymentDecision(verification.verification_id, "PAID");
      setStep("paid");
    } catch (err) {
      setError({ message: errorMessage(err), unavailable: err instanceof ApiUnavailableError });
    } finally {
      setBusy(null);
    }
  }

  async function cancelAndReport() {
    if (!verification) return;
    setBusy("report");
    try {
      const report = await reportFraud({ identifier: verification.identifier, verification_id: verification.verification_id, amount: verification.amount, reason: verification.summary });
      setReportNote(report.message);
      setSheetOpen(false);
      setStep("cancelled");
    } catch (err) {
      setError({ message: errorMessage(err), unavailable: err instanceof ApiUnavailableError });
    } finally {
      setBusy(null);
    }
  }

  async function continueAnyway() {
    if (!verification) return;
    setBusy("continue");
    try {
      await recordPaymentDecision(verification.verification_id, "CONTINUED_AFTER_WARNING");
      setSheetOpen(false);
      setStep("continued");
    } catch (err) {
      setError({ message: errorMessage(err), unavailable: err instanceof ApiUnavailableError });
    } finally {
      setBusy(null);
    }
  }

  const stepIndex = step === "payee" ? 0 : step === "amount" ? 1 : 2;

  const errorBlock = error && (
    <p className="notice notice--risk" role="alert" style={{ marginBlockStart: "var(--space-md)" }}>
      <WifiOff size={16} aria-hidden="true" />
      <span>
        {error.message}
        {error.unavailable && " The payment was not sent."}
      </span>
    </p>
  );

  if (step === "paid" || step === "continued" || step === "cancelled") {
    const cancelled = step === "cancelled";
    const continued = step === "continued";
    return (
      <main className="app-content">
        <div className="success">
          <span className={`success__icon${cancelled ? " success__icon--cancel" : continued ? " success__icon--warn" : ""}`} aria-hidden="true">
            {cancelled ? <X size={28} /> : continued ? <TriangleAlert size={28} /> : <Check size={28} />}
          </span>
          <h2>{cancelled ? "Payment cancelled" : "Payment simulated"}</h2>
          <p>
            {cancelled && `Identifier reported. ${reportNote ?? ""}`}
            {step === "paid" && `${formatInr(verification?.amount ?? amountNumber)} to ${displayIdentifier(verification?.identifier ?? to)} · PausePay check complete.`}
            {continued && `${formatInr(verification?.amount ?? amountNumber)} to ${displayIdentifier(verification?.identifier ?? to)}. You continued despite a PausePay warning; this choice has been recorded.`}
          </p>
          <span className="mono-label">No real money moved · synthetic UPI simulator</span>
          <div className="button-row" style={{ width: "100%" }}>
            <button type="button" className="button button--block" onClick={reset}>
              New payment
            </button>
            <Link className="button button--ghost button--block" href="/app/activity">
              View activity
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="app-content">
      <div className="screen-title">
        <span className="mono-label">Simulated UPI app</span>
        <h1>{step === "payee" ? "Pay someone" : step === "amount" ? "Enter amount" : "Confirm payment"}</h1>
      </div>
      <div className="stepper" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <span key={i} className={i === stepIndex ? "is-active" : i < stepIndex ? "is-done" : ""} />
        ))}
      </div>

      {step === "payee" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setTouched(true);
            if (looksValid(to)) setStep("amount");
          }}
        >
          <div className="field">
            <label htmlFor="payee">UPI ID or mobile number</label>
            <input
              id="payee"
              className="input"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="name@bank or 98765 43210"
              autoComplete="off"
              inputMode="email"
              aria-invalid={touched && !looksValid(to) ? "true" : undefined}
              required
            />
            {touched && !looksValid(to) && <span className="field__error">Enter a valid UPI ID (name@bank) or a 10-digit Indian mobile number.</span>}
          </div>
          <div className="field">
            <label htmlFor="payee-name">Name (optional)</label>
            <input id="payee-name" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="As shown by your bank" autoComplete="off" />
          </div>
          <span className="field__hint">Demo payees:</span>
          <div className="chip-row" style={{ marginBlock: "var(--space-xs) var(--space-md)" }}>
            {scenarios.map((s) => (
              <button
                key={s.to}
                type="button"
                className="chip"
                onClick={() => {
                  setTo(s.to);
                  setName(s.name);
                  setAmount(s.amount);
                  setTouched(false);
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
          <button type="submit" className="button button--accent button--block">
            Continue
          </button>
          {errorBlock}
        </form>
      )}

      {step === "amount" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            verify();
          }}
        >
          <div className="pay-summary">
            <span className="avatar" aria-hidden="true">
              {(name || to).slice(0, 2).toUpperCase()}
            </span>
            <span className="pay-summary__name">{name || "Payee"}</span>
            <span className="pay-summary__id">{displayIdentifier(to.trim())}</span>
          </div>
          <div className="field">
            <label htmlFor="amount">Amount (₹)</label>
            <input
              id="amount"
              className="input input--amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
              inputMode="decimal"
              placeholder="0"
              autoFocus
              required
            />
          </div>
          <button type="submit" className="button button--accent button--block" disabled={!amountValid || verifying}>
            {verifying ? <span className="spinner" aria-hidden="true" /> : <ShieldCheck size={16} aria-hidden="true" />}
            {verifying ? "Checking payment context…" : "Verify payee & pay"}
          </button>
          <button type="button" className="link-button" style={{ marginBlockStart: "var(--space-sm)" }} onClick={() => setStep("payee")}>
            <ArrowLeft size={14} aria-hidden="true" /> Change payee
          </button>
          {errorBlock}
          <p className="privacy-note">
            <ShieldCheck size={12} aria-hidden="true" />
            Before confirmation, PausePay checks this payee against messages it has analysed, fraud reports and identifier history. Nothing is sent to a real bank.
          </p>
        </form>
      )}

      {step === "confirm" && verification && (
        <div>
          <div className="pay-summary">
            <span className="avatar" aria-hidden="true">
              {(name || verification.identifier).slice(0, 2).toUpperCase()}
            </span>
            <span className="pay-summary__name">{name || "Payee"}</span>
            <span className="pay-summary__id">{displayIdentifier(verification.identifier)}</span>
            <span className="pay-summary__amount">{formatInr(verification.amount)}</span>
          </div>

          {verification.decision === "ALLOW" ? (
            <p className="check-line check-line--ok">
              <ShieldCheck size={14} aria-hidden="true" /> PausePay check complete · {Math.round(verification.latency_ms)} ms
            </p>
          ) : (
            <p className={`check-line ${verification.decision === "INTERRUPT" ? "check-line--high" : "check-line--review"}`}>
              {verification.decision === "INTERRUPT" ? <TriangleAlert size={14} aria-hidden="true" /> : <CircleAlert size={14} aria-hidden="true" />}
              {verification.title} · {verification.risk_score}/100
            </p>
          )}

          <section className="card card--muted">
            <div className="result-head">
              <h3>{verification.decision === "ALLOW" ? "What PausePay found" : "Paused before payment"}</h3>
              <IdentifierPill band={verification.identifier_risk.risk_band} />
            </div>
            <p className="result-summary">{verification.summary}</p>
          </section>

          <div className="button-row">
            {verification.decision === "ALLOW" ? (
              <button type="button" className="button button--accent button--block" onClick={pay} disabled={busy !== null}>
                {busy === "pay" ? <span className="spinner" aria-hidden="true" /> : null} Pay {formatInr(verification.amount)}
              </button>
            ) : (
              <button type="button" className="button button--ghost button--block" onClick={() => setSheetOpen(true)}>
                <TriangleAlert size={15} aria-hidden="true" /> Review PausePay warning
              </button>
            )}
            <button type="button" className="button button--ghost button--block" onClick={() => setStep("amount")} disabled={busy !== null}>
              Back
            </button>
          </div>
          {errorBlock}

          <PausePayWarningSheet
            open={sheetOpen}
            verification={verification}
            busy={busy === "pay" ? null : busy}
            onCancelAndReport={cancelAndReport}
            onContinue={continueAnyway}
            onDismiss={() => setSheetOpen(false)}
          />
        </div>
      )}
    </main>
  );
}

export default function PayPage() {
  return (
    <Suspense
      fallback={
        <main className="app-content">
          <p className="empty">Loading…</p>
        </main>
      }
    >
      <PayFlow />
    </Suspense>
  );
}
