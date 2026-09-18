"use client";

import { ArrowLeft, CircleAlert, Send, ShieldCheck, TriangleAlert, WifiOff } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AnalysisResult } from "@/components/risk/AnalysisResult";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { ApiUnavailableError, analyzeMessage, getConversations } from "@/lib/api";
import type { AnalyzeMessageResponse, Conversation, SimMessage } from "@/lib/types";
import { formatInr } from "@/lib/utils";

type MessageState = { status: "checking" } | { status: "done"; result: AnalyzeMessageResponse } | { status: "down" };

function initials(name: string): string {
  if (name.startsWith("+")) return "#";
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function payHref(result: AnalyzeMessageResponse, conversation: Conversation): string | null {
  const to = result.entities.upi_id ?? result.entities.phone_number;
  if (!to) return null;
  const params = new URLSearchParams({ to });
  if (result.entities.amount) params.set("amount", String(result.entities.amount));
  // Only a saved contact's name is trusted enough to prefill; unknown senders stay unnamed.
  if (conversation.kind !== "unknown" && to === conversation.handle) params.set("name", conversation.name);
  return `/app/pay?${params.toString()}`;
}

export default function ThreadPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [conversation, setConversation] = useState<Conversation | null | undefined>(undefined);
  const [states, setStates] = useState<Record<string, MessageState>>({});
  const [inspecting, setInspecting] = useState<AnalyzeMessageResponse | null>(null);

  useEffect(() => {
    let cancelled = false;
    getConversations()
      .then((all) => {
        if (cancelled) return;
        const found = all.find((c) => c.id === id) ?? null;
        setConversation(found);
        if (!found) return;
        // Every inbound message goes through the real analysis API. The backend
        // de-duplicates by message id so re-opening a thread never double-counts evidence.
        const inbound = found.messages.filter((m) => m.direction === "in");
        setStates(Object.fromEntries(inbound.map((m) => [m.id, { status: "checking" as const }])));
        inbound.forEach((m: SimMessage) => {
          analyzeMessage({ message: m.text, source: "MESSENGER_SIM", source_ref: m.id, sender_label: found.name })
            .then((result) => {
              if (!cancelled) setStates((prev) => ({ ...prev, [m.id]: { status: "done", result } }));
            })
            .catch((err) => {
              if (!cancelled) setStates((prev) => ({ ...prev, [m.id]: { status: err instanceof ApiUnavailableError ? "down" : "down" } }));
            });
        });
      })
      .catch(() => {
        if (!cancelled) setConversation(null);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (conversation === undefined) {
    return (
      <main className="app-content">
        <p className="empty">Loading…</p>
      </main>
    );
  }
  if (conversation === null) {
    return (
      <main className="app-content">
        <p className="notice notice--risk">
          <WifiOff size={16} aria-hidden="true" />
          <span>Conversation unavailable. Check that the backend is running.</span>
        </p>
        <Link className="link-button" href="/app/messages">
          <ArrowLeft size={14} aria-hidden="true" /> Back to messages
        </Link>
      </main>
    );
  }

  return (
    <main className="app-content app-content--flush">
      <div className="thread-header">
        <button type="button" className="icon-button" onClick={() => router.push("/app/messages")} aria-label="Back to messages">
          <ArrowLeft size={20} aria-hidden="true" />
        </button>
        <span className={`avatar avatar--${conversation.kind}`} aria-hidden="true">
          {initials(conversation.name)}
        </span>
        <div>
          <div className="thread-header__name">{conversation.name}</div>
          <div className="thread-header__handle">{conversation.kind === "unknown" ? "Not in your contacts" : conversation.handle}</div>
        </div>
        <span className="risk-pill risk-pill--none" title="PausePay is checking payment-related messages in this thread">
          <ShieldCheck size={11} aria-hidden="true" /> PausePay
        </span>
      </div>

      <div className="thread" aria-live="polite">
        {conversation.messages.map((m) => {
          const state = m.direction === "in" ? states[m.id] : undefined;
          const result = state?.status === "done" ? state.result : null;
          const flagged = result && result.is_payment_related && result.risk_band === "HIGH";
          const review = result && result.is_payment_related && result.risk_band === "MEDIUM";
          const href = result ? payHref(result, conversation) : null;
          return (
            <div
              key={m.id}
              className={`bubble-wrap bubble-wrap--${m.direction}${flagged ? " bubble-wrap--flagged" : ""}${review ? " bubble-wrap--review" : ""}`}
            >
              <div className={`bubble bubble--${m.direction}`}>{m.text}</div>
              <span className="bubble__time">{m.time}</span>

              {state?.status === "checking" && (
                <span className="bubble-flag bubble-flag--checking">
                  <span className="spinner" aria-hidden="true" /> <span>Checking payment context…</span>
                </span>
              )}
              {state?.status === "down" && (
                <span className="bubble-flag bubble-flag--down">
                  <WifiOff size={13} aria-hidden="true" /> <span>PausePay verification temporarily unavailable.</span>
                </span>
              )}
              {flagged && (
                <button type="button" className="bubble-flag" onClick={() => setInspecting(result)}>
                  <TriangleAlert size={14} aria-hidden="true" />
                  <span>PausePay detected a risky payment request</span>
                  <u>Why?</u>
                </button>
              )}
              {review && (
                <button type="button" className="bubble-flag bubble-flag--review" onClick={() => setInspecting(result)}>
                  <CircleAlert size={14} aria-hidden="true" />
                  <span>PausePay suggests verifying this request</span>
                  <u>Why?</u>
                </button>
              )}
              {result && result.is_payment_related && href && (
                <div className="bubble-actions">
                  <Link className="chip" href={href}>
                    <Send size={12} aria-hidden="true" />
                    Pay {result.entities.amount ? formatInr(result.entities.amount) : ""} via UPI
                  </Link>
                  {result.risk_band === "LOW" && (
                    <button type="button" className="chip" onClick={() => setInspecting(result)}>
                      <ShieldCheck size={12} aria-hidden="true" /> Checked
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="privacy-note" style={{ paddingInline: "var(--space-md)" }}>
        <ShieldCheck size={12} aria-hidden="true" />
        PausePay analyses payment-related context to identify suspicious payment requests. This messenger is simulated; no real chat app is being read.
      </p>

      <BottomSheet open={inspecting !== null} onClose={() => setInspecting(null)} labelledBy="why-title">
        {inspecting && (
          <>
            <p className={`sheet__kicker sheet__kicker--${inspecting.risk_band.toLowerCase()}`}>
              {inspecting.risk_band === "LOW" ? <ShieldCheck size={15} aria-hidden="true" /> : <TriangleAlert size={15} aria-hidden="true" />}
              PausePay message check
            </p>
            <h2 id="why-title" style={{ marginBlockEnd: "var(--space-md)" }}>
              {inspecting.risk_band === "HIGH" ? "Why this was flagged" : inspecting.risk_band === "MEDIUM" ? "Worth a second look" : "Nothing suspicious found"}
            </h2>
            <AnalysisResult result={inspecting} />
            <div className="sheet__actions">
              <button type="button" className="button button--ghost button--block" onClick={() => setInspecting(null)}>
                Close
              </button>
            </div>
          </>
        )}
      </BottomSheet>
    </main>
  );
}
