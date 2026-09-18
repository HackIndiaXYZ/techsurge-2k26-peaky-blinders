"use client";

import { Check, CircleAlert, ShieldCheck, WifiOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { analyzeMessage, errorMessage } from "@/lib/api";
import type { AnalyzeMessageResponse } from "@/lib/types";
import { formatInr } from "@/lib/utils";

type Scenario = {
  id: string;
  tab: string;
  title: string;
  message: string;
  payee: string;
};

// Only the message text is fixed here. The score, band, reasons and extracted
// entities come from the live PausePay backend for every scenario.
const scenarios: Scenario[] = [
  {
    id: "kyc",
    tab: "KYC fee demand",
    title: "A payment demand dressed up as compliance.",
    message: "Your bank KYC expires today. Pay ₹4,999 immediately to secureverify@upi or your account will be blocked.",
    payee: "Unknown sender · not in contacts",
  },
  {
    id: "merchant",
    tab: "New merchant",
    title: "New does not automatically mean dangerous.",
    message: "Star Mobile Repair: your repair is complete. Total ₹2,350. UPI: starmobile@okbizaxis. Collect anytime before 8 pm.",
    payee: "Star Mobile Repair · first payment",
  },
  {
    id: "hospital",
    tab: "Urgent genuine",
    title: "Urgency alone is not treated as a scam.",
    message: "Lakeview Hospital: admission deposit of ₹18,000 for patient Suresh K is due today so the admission can be completed. Pay to UPI lakeviewhospital@icici.",
    payee: "Lakeview Hospital · business",
  },
];

type State = { status: "loading" } | { status: "done"; result: AnalyzeMessageResponse } | { status: "error"; message: string };

export function ScenarioLab() {
  const [activeId, setActiveId] = useState(scenarios[0].id);
  const [results, setResults] = useState<Record<string, State>>({});
  const started = useRef<Set<string>>(new Set());
  const scenario = scenarios.find((item) => item.id === activeId) ?? scenarios[0];
  const state = results[scenario.id];

  useEffect(() => {
    // Each scenario is analysed once per page load; results are kept per tab.
    if (started.current.has(scenario.id)) return;
    started.current.add(scenario.id);
    setResults((prev) => ({ ...prev, [scenario.id]: { status: "loading" } }));
    analyzeMessage({ message: scenario.message, source: "MESSENGER_SIM", source_ref: `landing-${scenario.id}`, sender_label: scenario.payee })
      .then((result) => setResults((prev) => ({ ...prev, [scenario.id]: { status: "done", result } })))
      .catch((err) => {
        started.current.delete(scenario.id); // allow a retry when the tab is reopened
        setResults((prev) => ({ ...prev, [scenario.id]: { status: "error", message: errorMessage(err) } }));
      });
  }, [scenario]);

  const result = state?.status === "done" ? state.result : null;
  const level = result ? result.risk_band.toLowerCase() : "low";
  const levelWord = result ? (result.risk_band === "HIGH" ? "High" : result.risk_band === "MEDIUM" ? "Medium" : "Low") : "";

  return (
    <div className="scenario-lab">
      <div className="scenario-tabs" role="group" aria-label="Choose a demonstration scenario">
        {scenarios.map((item) => (
          <button type="button" key={item.id} className="scenario-tab" aria-pressed={item.id === activeId} onClick={() => setActiveId(item.id)}>
            {item.tab}
          </button>
        ))}
      </div>

      <div className="scenario-stage" aria-live="polite">
        <div className="scenario-stage__context">
          <span className="mono-label">Message context</span>
          <blockquote>“{scenario.message}”</blockquote>
          <dl className="payment-facts">
            <div>
              <dt>Amount</dt>
              <dd>{result?.entities.amount ? formatInr(result.entities.amount) : "—"}</dd>
            </div>
            <div>
              <dt>Recipient</dt>
              <dd>{result?.entities.upi_id ?? scenario.payee}</dd>
            </div>
          </dl>
        </div>

        <div className={`scenario-assessment scenario-assessment--${level}`}>
          {state?.status === "loading" && (
            <p className="check-line">
              <span className="spinner" aria-hidden="true" /> Checking payment context…
            </p>
          )}
          {state?.status === "error" && (
            <p className="notice notice--risk">
              <WifiOff size={16} aria-hidden="true" />
              <span>{state.message} Start the backend to run live scenarios.</span>
            </p>
          )}
          {result && (
            <>
              <div className="scenario-assessment__topline">
                <span className={`level-badge level-badge--${level}`}>
                  {result.risk_band === "LOW" ? <ShieldCheck size={16} /> : <CircleAlert size={16} />}
                  {levelWord} risk · {result.intent_label.toLowerCase()}
                </span>
                <span className="scenario-score">
                  {result.risk_score}
                  <small>/100</small>
                </span>
              </div>
              <h3>{scenario.title}</h3>
              <p>{result.summary}</p>
              <ul className="evidence-list">
                {(result.reasons.length ? result.reasons : ["No pressure, impersonation or fee signals detected", "No prior reports for this identifier"]).map((item) => (
                  <li key={item}>
                    <Check size={15} aria-hidden="true" /> {item}
                  </li>
                ))}
              </ul>
              <p className="latency">Live result · {Math.round(result.latency_ms)} ms · {result.engine_version}</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
