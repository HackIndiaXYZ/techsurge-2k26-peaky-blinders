"use client";

import { ArrowLeft, Check, ChevronRight, CircleAlert, ShieldCheck, TriangleAlert, WifiOff } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PausePayMark } from "@/components/brand/PausePayMark";
import { AnalysisResult } from "@/components/risk/AnalysisResult";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { ApiUnavailableError, analyzeMessage, getConversations } from "@/lib/api";
import { useDemoSession } from "@/lib/demo-session";
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
  const { captureMessage } = useDemoSession();

  const [conversation, setConversation] = useState<Conversation | null | undefined>(undefined);
  const [states, setStates] = useState<Record<string, MessageState>>({});
  const [inspecting, setInspecting] = useState<AnalyzeMessageResponse | null>(null);
  const [handoff, setHandoff] = useState<{ active: boolean; result?: AnalyzeMessageResponse | null }>({ active: false });

  // The interstitial is the moment the demo explains itself: context leaves
  // Inbox and arrives in FLOW. Hold it briefly, then hand over.
  useEffect(() => {
    if (!handoff.active || !handoff.result || !conversation) return;
    const timer = setTimeout(() => {
      const href = payHref(handoff.result!, conversation);
      if (href) router.push(href);
    }, 1500);
    return () => clearTimeout(timer);
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
            .catch(() => {
              if (!cancelled) setStates((prev) => ({ ...prev, [m.id]: { status: "down" } }));
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

  /** Hands the message context to the shared session, then opens FLOW. */
  function reviewWithPausePay(result: AnalyzeMessageResponse, message: SimMessage) {
    if (!conversation) return;
    captureMessage({
      conversationId: conversation.id,
      senderName: conversation.name,
      senderHandle: conversation.handle,
      messageId: message.id,
      text: message.text,
      capturedAt: new Date().toISOString(),
      analysis: result,
    });
    setHandoff({ active: true, result });
  }

  if (conversation === undefined) {
    return <main className="px-5 pt-14 text-[13px] text-zinc-400">Loading…</main>;
  }

  if (conversation === null) {
    return (
      <main className="px-5 pt-14">
        <p className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-[13px] text-red-700">
          <WifiOff size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
          <span>Conversation unavailable. Check that the backend is running.</span>
        </p>
        <Link href="/app/inbox" className="mt-4 inline-flex items-center gap-1 text-[13px] font-semibold text-[#1A73E8]">
          <ArrowLeft size={14} aria-hidden="true" /> Back to inbox
        </Link>
      </main>
    );
  }

  return (
    <main className="relative flex h-full flex-col overflow-hidden bg-white">
      {/* Thread header */}
      <div className="flex shrink-0 items-center gap-2.5 border-b border-zinc-100 px-3 pb-3 pt-12">
        <button
          type="button"
          onClick={() => router.push("/app/inbox")}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-zinc-700 active:bg-zinc-100"
          aria-label="Back to inbox"
        >
          <ArrowLeft size={20} aria-hidden="true" />
        </button>
        <span
          className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-[12px] font-bold ${
            conversation.kind === "unknown" ? "bg-zinc-100 text-zinc-500" : "bg-[#E3EDFC] text-[#1A56DB]"
          }`}
          aria-hidden="true"
        >
          {initials(conversation.name)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[15px] font-semibold text-zinc-900">{conversation.name}</div>
          <div className="truncate text-[11.5px] text-zinc-500">
            {conversation.kind === "unknown" ? "Not in your contacts" : conversation.handle}
          </div>
        </div>
        <span
          className="flex shrink-0 items-center gap-1 rounded-full bg-[#EEF5FE] px-2 py-1 text-[10px] font-bold text-[#1A56DB]"
          title="PausePay is checking payment-related messages in this thread"
        >
          <PausePayMark size={11} decorative /> PausePay
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4" aria-live="polite">
        {conversation.messages.map((m) => {
          const state = m.direction === "in" ? states[m.id] : undefined;
          const result = state?.status === "done" ? state.result : null;
          const flagged = result && result.is_payment_related && result.risk_band === "HIGH";
          const review = result && result.is_payment_related && result.risk_band === "MEDIUM";
          const actionable = result && result.is_payment_related && payHref(result, conversation);
          const outgoing = m.direction === "out";

          return (
            <div key={m.id} className={`flex flex-col ${outgoing ? "items-end" : "items-start"}`}>
              <div
                className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-[14px] leading-snug ${
                  outgoing ? "rounded-br-md bg-[#1A73E8] text-white" : "rounded-bl-md bg-zinc-100 text-zinc-900"
                }`}
              >
                {m.text}
              </div>
              <span className="mt-1 px-1 font-mono text-[10px] tabular-nums text-zinc-400">{m.time}</span>

              {state?.status === "checking" && (
                <span className="mt-1 flex items-center gap-1.5 text-[11px] text-zinc-400">
                  <span className="h-3 w-3 animate-spin rounded-full border border-zinc-300 border-t-transparent" aria-hidden="true" />
                  Checking payment context…
                </span>
              )}

              {state?.status === "down" && (
                <span className="mt-1 flex items-center gap-1.5 text-[11px] text-zinc-400">
                  <WifiOff size={12} aria-hidden="true" /> PausePay verification temporarily unavailable.
                </span>
              )}

              {(flagged || review) && (
                <button
                  type="button"
                  onClick={() => setInspecting(result)}
                  className={`mt-1.5 flex max-w-[86%] items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-left text-[11.5px] font-medium ${
                    flagged ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {flagged ? <TriangleAlert size={13} className="shrink-0" /> : <CircleAlert size={13} className="shrink-0" />}
                  <span>{flagged ? "PausePay detected a risky payment request" : "PausePay suggests verifying this request"}</span>
                  <u className="shrink-0">Why?</u>
                </button>
              )}

              {/* The handoff into FLOW — the point where context crosses apps. */}
              {actionable && result && (
                <button
                  type="button"
                  onClick={() => reviewWithPausePay(result, m)}
                  className="mt-2 flex w-[86%] items-center gap-3 rounded-2xl border border-[#D6E6FC] bg-[#F7FAFF] p-3 text-left transition-transform active:scale-[0.99]"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white" aria-hidden="true">
                    <PausePayMark size={18} decorative />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-bold text-zinc-900">Review with PausePay</span>
                    <span className="block truncate text-[11.5px] text-zinc-500">
                      {result.entities.amount ? formatInr(result.entities.amount) : "Payment"} ·{" "}
                      {displayIdentifier(result.entities.upi_id ?? result.entities.phone_number ?? "")}
                    </span>
                  </span>
                  <ChevronRight size={16} className="shrink-0 text-zinc-400" aria-hidden="true" />
                </button>
              )}
            </div>
          );
        })}

        <p className="flex items-start gap-1.5 pt-2 text-[10.5px] leading-snug text-zinc-400">
          <ShieldCheck size={12} className="mt-px shrink-0" aria-hidden="true" />
          PausePay analyses payment-related context to identify suspicious payment requests. This messenger is simulated; no real chat app is being read.
        </p>
      </div>

      <BottomSheet open={inspecting !== null} onClose={() => setInspecting(null)} labelledBy="why-title">
        {inspecting && (
          <>
            <p className={`sheet__kicker sheet__kicker--${inspecting.risk_band.toLowerCase()}`}>
              {inspecting.risk_band === "LOW" ? <ShieldCheck size={15} aria-hidden="true" /> : <TriangleAlert size={15} aria-hidden="true" />}
              PausePay message check
            </p>
            <h2 id="why-title" style={{ marginBlockEnd: "var(--space-md)" }}>
              {inspecting.risk_band === "HIGH"
                ? "Why this was flagged"
                : inspecting.risk_band === "MEDIUM"
                  ? "Worth a second look"
                  : "Nothing suspicious found"}
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

      {/* Context handoff interstitial */}
      <div
        className={`absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#0F0F12] px-6 text-white transition-opacity duration-300 ${
          handoff.active ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden={!handoff.active}
      >
        <h2 className="mb-8 text-[12px] font-bold uppercase tracking-[0.18em] text-indigo-400">Context captured</h2>

        <div className="mb-8 w-full max-w-[200px] space-y-3 text-[15px] font-medium text-zinc-200">
          {["Message", "Amount", "Recipient", "Timestamp"].map((label) => (
            <div key={label} className="flex items-center gap-4">
              <Check size={18} className="text-emerald-400" aria-hidden="true" /> {label}
            </div>
          ))}
        </div>

        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mb-8 text-indigo-500/50" aria-hidden="true">
          <path d="M12 5v14M19 12l-7 7-7-7" />
        </svg>

        <div className="w-full max-w-[280px] rounded-2xl border border-white/10 bg-white/5 p-5 text-center shadow-xl">
          <div className="mb-1 text-2xl font-light">
            {handoff.result?.entities.amount ? formatInr(handoff.result.entities.amount) : "Payment"}
          </div>
          <div className="flex items-center justify-center gap-2 text-sm font-medium text-zinc-300">
            <span className="text-zinc-500">&rarr;</span>{" "}
            {conversation.name || displayIdentifier(handoff.result?.entities.upi_id ?? "")}
          </div>
        </div>

        <div className="absolute bottom-12 animate-pulse text-[12px] font-bold uppercase tracking-[0.18em] text-zinc-500">
          Opening FLOW…
        </div>
      </div>
    </main>
  );
}
