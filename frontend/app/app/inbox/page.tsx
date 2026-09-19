"use client";

import { Info, TriangleAlert, WifiOff } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { errorMessage, getConversations, getHistory } from "@/lib/api";
import type { Conversation, RiskBand } from "@/lib/types";

function initials(name: string): string {
  if (name.startsWith("+")) return "#";
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[] | null>(null);
  const [flags, setFlags] = useState<Record<string, RiskBand>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getConversations()
      .then((data) => {
        if (!cancelled) setConversations(data);
      })
      .catch((err) => {
        if (!cancelled) setError(errorMessage(err));
      });
    // Previously analysed simulated messages: show a quiet indicator on the thread row.
    getHistory(100)
      .then((history) => {
        if (cancelled) return;
        const next: Record<string, RiskBand> = {};
        for (const a of history.analyses) {
          if (a.source !== "MESSENGER_SIM" || !a.source_ref || a.risk_band === "LOW") continue;
          const conv = a.source_ref.split("-").slice(0, -1).join("-");
          if (!next[conv] || (a.risk_band === "HIGH" && next[conv] !== "HIGH")) next[conv] = a.risk_band;
        }
        setFlags(next);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="app-content app-content--flush">
      <div className="screen-title" style={{ paddingInline: "var(--space-md)" }}>
        <span className="mono-label">Simulated messenger</span>
        <h1>Messages</h1>
      </div>
      <p className="sim-banner">
        <Info size={14} aria-hidden="true" />
        These threads are synthetic. PausePay checks payment-related messages through the same API a real message source would call.
      </p>

      {error && (
        <p className="notice notice--risk" style={{ marginInline: "var(--space-md)" }}>
          <WifiOff size={16} aria-hidden="true" />
          <span>{error} Start the backend to load conversations.</span>
        </p>
      )}

      {conversations === null && !error && <p className="empty" style={{ paddingInline: "var(--space-md)" }}>Loading conversations…</p>}

      <ul className="conv-list">
        {conversations?.map((conv) => {
          const flag = flags[conv.id];
          const last = conv.messages[conv.messages.length - 1];
          return (
            <li key={conv.id}>
              <Link className="conv-row" href={`/app/inbox/${conv.id}`}>
                <span className={`avatar avatar--${conv.kind}`} aria-hidden="true">
                  {initials(conv.name)}
                </span>
                <span className="conv-row__body">
                  <span className="conv-row__name">
                    <span className="conv-row__label">{conv.name}</span>
                    {conv.kind === "unknown" && <span className="risk-pill risk-pill--none">Unknown sender</span>}
                  </span>
                  <span className="conv-row__preview">{conv.preview}</span>
                </span>
                <span className="conv-row__meta">
                  <span>{last.time}</span>
                  {flag && (
                    <span className={`risk-pill risk-pill--${flag.toLowerCase()}`} aria-label={`PausePay flagged ${flag.toLowerCase()} risk`}>
                      <TriangleAlert size={11} aria-hidden="true" /> {flag === "HIGH" ? "Risky" : "Review"}
                    </span>
                  )}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
