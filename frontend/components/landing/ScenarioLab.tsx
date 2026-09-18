"use client";

import { Check, CircleAlert, ShieldCheck } from "lucide-react";
import { useState } from "react";

type Scenario = {
  id: string;
  tab: string;
  title: string;
  message: string;
  amount: string;
  payee: string;
  level: "High" | "Medium" | "Low";
  score: number;
  reason: string;
  evidence: string[];
};

const scenarios: Scenario[] = [
  {
    id: "refund",
    tab: "Fake refund",
    title: "The ledger contradicts the message.",
    message: "I transferred ₹5,000 by mistake. Please return it immediately to rahul@upi.",
    amount: "₹5,000",
    payee: "Rahul Sharma · new payee",
    level: "High",
    score: 82,
    reason: "Pause before paying. The claimed incoming transfer is not in the account history.",
    evidence: ["Incoming payment not found", "Different return recipient", "Urgency pressure"],
  },
  {
    id: "merchant",
    tab: "New merchant",
    title: "New does not automatically mean dangerous.",
    message: "Payment for the repair invoice shared at the store.",
    amount: "₹2,350",
    payee: "Northline Repairs · new merchant",
    level: "Medium",
    score: 34,
    reason: "Review the recipient once. No social-engineering or ledger contradiction was detected.",
    evidence: ["First payment to this merchant", "Amount slightly above usual", "No pressure language"],
  },
  {
    id: "hospital",
    tab: "Urgent genuine",
    title: "Urgency is weighed with reassuring evidence.",
    message: "Please pay the hospital deposit today so the admission can be completed.",
    amount: "₹18,000",
    payee: "Lakeview Hospital · established payee",
    level: "Low",
    score: 18,
    reason: "This payment matches an established recipient and prior legitimate payment pattern.",
    evidence: ["Established recipient", "Prior verified payments", "No identity mismatch"],
  },
];

export function ScenarioLab() {
  const [activeId, setActiveId] = useState(scenarios[0].id);
  const scenario = scenarios.find((item) => item.id === activeId) ?? scenarios[0];
  const levelClass = scenario.level.toLowerCase();

  return (
    <div className="scenario-lab">
      <div className="scenario-tabs" role="group" aria-label="Choose a demonstration scenario">
        {scenarios.map((item) => (
          <button
            type="button"
            key={item.id}
            className="scenario-tab"
            aria-pressed={item.id === activeId}
            onClick={() => setActiveId(item.id)}
          >
            {item.tab}
          </button>
        ))}
      </div>

      <div className="scenario-stage" aria-live="polite">
        <div className="scenario-stage__context">
          <span className="mono-label">Message context</span>
          <blockquote>“{scenario.message}”</blockquote>
          <dl className="payment-facts">
            <div><dt>Amount</dt><dd>{scenario.amount}</dd></div>
            <div><dt>Recipient</dt><dd>{scenario.payee}</dd></div>
          </dl>
        </div>

        <div className={`scenario-assessment scenario-assessment--${levelClass}`}>
          <div className="scenario-assessment__topline">
            <span className={`level-badge level-badge--${levelClass}`}>
              {scenario.level === "Low" ? <ShieldCheck size={16} /> : <CircleAlert size={16} />}
              {scenario.level} contextual risk
            </span>
            <span className="scenario-score">{scenario.score}<small>/100</small></span>
          </div>
          <h3>{scenario.title}</h3>
          <p>{scenario.reason}</p>
          <ul className="evidence-list">
            {scenario.evidence.map((item) => (
              <li key={item}><Check size={15} aria-hidden="true" /> {item}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
