"use client";

import { ScanSearch, Send, ShieldCheck, WifiOff } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { AnalysisResult } from "@/components/risk/AnalysisResult";
import { analyzeMessage, ApiUnavailableError, errorMessage } from "@/lib/api";
import type { AnalyzeMessageResponse } from "@/lib/types";
import { formatInr } from "@/lib/utils";

const samples = [
  { label: "KYC fee", text: "Your KYC expires today. Pay ₹4,999 immediately to secureverify@upi or your account will be suspended." },
  { label: "Cashback claim", text: "Congratulations! You have received ₹25,000 cashback. Pay ₹499 processing charge to claim immediately. UPI: rewards.claim@upi" },
  { label: "Friend's dinner", text: "Bro send ₹250 for yesterday's dinner. UPI: arjun@oksbi" },
  { label: "Wrong transfer", text: "I accidentally sent ₹5,000 to your number by mistake. Please return it immediately to refund.desk@ybl." },
  { label: "Plain chat", text: "Went to the SBI branch for KYC today, took 40 minutes. Finally done." },
];

export default function CheckPage() {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ message: string; unavailable: boolean } | null>(null);
  const [result, setResult] = useState<AnalyzeMessageResponse | null>(null);

  async function submit(event?: React.FormEvent) {
    event?.preventDefault();
    if (!text.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      const analysis = await analyzeMessage({ message: text.trim(), source: "MANUAL_CHECK" });
      setResult(analysis);
    } catch (err) {
      setResult(null);
      setError({ message: errorMessage(err), unavailable: err instanceof ApiUnavailableError });
    } finally {
      setBusy(false);
    }
  }

  const payTarget = result?.entities.upi_id ?? result?.entities.phone_number ?? null;

  return (
    <main className="app-content">
      <div className="screen-title">
        <span className="mono-label">Manual verifier</span>
        <h1>Check a payment message</h1>
        <p>Paste any SMS, WhatsApp or email text that asks you to pay. PausePay will classify it, pull out the UPI ID, number and amount, and explain the risk.</p>
      </div>

      <form onSubmit={submit}>
        <div className="field">
          <label htmlFor="message-text">Message</label>
          <textarea
            id="message-text"
            className="textarea"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste the message here…"
            maxLength={4000}
            required
          />
          <span className="field__hint">Try a sample:</span>
          <div className="chip-row">
            {samples.map((s) => (
              <button key={s.label} type="button" className="chip" onClick={() => setText(s.text)}>
                {s.label}
              </button>
            ))}
          </div>
        </div>
        <button type="submit" className="button button--accent button--block" disabled={busy || !text.trim()}>
          {busy ? <span className="spinner" aria-hidden="true" /> : <ScanSearch size={16} aria-hidden="true" />}
          {busy ? "Checking payment context…" : "Analyze message"}
        </button>
      </form>

      {error && (
        <p className="notice notice--risk" style={{ marginBlockStart: "var(--space-md)" }} role="alert">
          <WifiOff size={16} aria-hidden="true" />
          <span>
            {error.message}
            {error.unavailable && " Start the backend (uvicorn main:app --port 8000) and try again."}
          </span>
        </p>
      )}

      {result && (
        <section className="card" style={{ marginBlockStart: "var(--space-md)" }} aria-live="polite">
          <AnalysisResult result={result} />
          {payTarget && result.is_payment_related && (
            <div className="button-row">
              <Link
                className="button button--ghost button--block"
                href={`/app/pay?to=${encodeURIComponent(payTarget)}${result.entities.amount ? `&amount=${result.entities.amount}` : ""}`}
              >
                <Send size={15} aria-hidden="true" />
                Simulate paying {result.entities.amount ? formatInr(result.entities.amount) : "this payee"}
              </Link>
            </div>
          )}
        </section>
      )}

      <p className="privacy-note">
        <ShieldCheck size={12} aria-hidden="true" />
        PausePay analyses payment-related context to identify suspicious payment requests. Messages you check here are stored in the local prototype database so later payments to the same UPI ID or number can be correlated.
      </p>
    </main>
  );
}
