"use client";

import { ArrowLeft, Check, CircleAlert, Send, ShieldCheck, TriangleAlert, WifiOff } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AnalysisResult } from "@/components/risk/AnalysisResult";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { ApiUnavailableError, analyzeMessage, getConversations } from "@/lib/api";
import type { AnalyzeMessageResponse, Conversation, SimMessage } from "@/lib/types";
import { displayIdentifier, formatInr } from "@/lib/utils";

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
  return `/app/flow/pay?${params.toString()}`;
}

export default function ThreadPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [conversation, setConversation] = useState<Conversation | null | undefined>(undefined);
  const [states, setStates] = useState<Record<string, MessageState>>({});
  const [inspecting, setInspecting] = useState<AnalyzeMessageResponse | null>(null);
  const [handoff, setHandoff] = useState<{ active: boolean; result?: AnalyzeMessageResponse | null }>({ active: false });

  // When handoff is triggered, wait 1.5s then navigate
  useEffect(() => {
    if (handoff.active && handoff.result) {
      const timer = setTimeout(() => {
        const href = payHref(handoff.result!, conversation!);
        if (href) router.push(href);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [handoff, conversation, router]);

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
        <Link className="link-button" href="/app/inbox">
          <ArrowLeft size={14} aria-hidden="true" /> Back to messages
        </Link>
      </main>
    );
  }

  return (
    <main className="app-content app-content--flush">
      <div className="thread-header">
        <button type="button" className="icon-button" onClick={() => router.push("/app/inbox")} aria-label="Back to messages">
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
                <div className="mt-2 bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
                  <button 
                    type="button" 
                    className="w-full text-left p-3 flex items-center justify-between active:bg-zinc-50"
                    onClick={() => setHandoff({ active: true, result })}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center">
                        <ShieldCheck size={16} className="text-indigo-600" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-zinc-900">Review payment request</div>
                        <div className="text-xs text-zinc-500">with PausePay</div>
                      </div>
                    </div>
                    <ArrowLeft size={16} className="text-zinc-400 rotate-180" />
                  </button>
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

      {/* Context Handoff Interstitial */}
      <div 
        className={`absolute inset-0 z-50 bg-[#0F0F12] flex flex-col items-center justify-center text-white px-6 transition-all duration-300 ${
          handoff.active ? "animate-in fade-in opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <h2 className="text-[13px] font-bold uppercase tracking-widest text-indigo-400 mb-8">Context Captured</h2>
        
        <div className="space-y-3 text-[15px] font-medium text-zinc-200 w-full max-w-[200px] mb-8">
          <div className="flex items-center gap-4"><Check size={18} className="text-emerald-400" /> Message</div>
          <div className="flex items-center gap-4"><Check size={18} className="text-emerald-400" /> Amount</div>
          <div className="flex items-center gap-4"><Check size={18} className="text-emerald-400" /> Recipient</div>
          <div className="flex items-center gap-4"><Check size={18} className="text-emerald-400" /> Timestamp</div>
        </div>

        <div className="text-indigo-500/50 mb-8">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M19 12l-7 7-7-7"/></svg>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 w-full max-w-[280px] text-center shadow-xl">
          <div className="text-2xl font-light mb-1">
            {handoff.result?.entities.amount ? formatInr(handoff.result.entities.amount) : "Payment"}
          </div>
          <div className="text-sm font-medium text-zinc-300 flex items-center justify-center gap-2">
            <span className="text-zinc-500">&rarr;</span> {conversation?.name || displayIdentifier(handoff.result?.entities.upi_id || "")}
          </div>
        </div>

        <div className="absolute bottom-12 text-[12px] font-bold uppercase tracking-widest text-zinc-500 animate-pulse">
          Opening FLOW...
        </div>
      </div>
    </main>
  );
}
