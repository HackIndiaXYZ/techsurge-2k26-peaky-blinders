"use client";

import { Check, ChevronRight, ShieldAlert, TriangleAlert, User, MessageSquareText, BarChart2, Landmark, Link2 } from "lucide-react";
import Link from "next/link";
import { PausePayMark } from "@/components/brand/PausePayMark";
import type { VerifyPayeeResponse } from "@/lib/types";
import { displayIdentifier, formatInr } from "@/lib/utils";

interface Props {
  open: boolean;
  verification: VerifyPayeeResponse | null;
  busy: "report" | "continue" | null;
  onGoBack: () => void;      // "Go Back" CTA — calls cancelAndReport in parent
  onDismiss: () => void;     // back arrow — just closes the overlay
  onContinue: () => void;
}

export function PausePayWarningPage({ open, verification, busy, onGoBack, onDismiss, onContinue }: Props) {
  if (!verification) return null;
  
  const high = verification.decision === "INTERRUPT";
  const namedSignals = verification.signals.filter((s) => !["CONTEXT_MATCH", "AMOUNT_MATCH", "RECENT_MESSAGE"].includes(s.code)).slice(0, 4);

  return (
    <div 
      className={`absolute inset-0 z-50 bg-[#0F0F12] text-white overflow-y-auto pb-12 transition-all duration-500 cubic-bezier(0.32, 0.72, 0, 1) ${
        open ? "animate-in slide-in-from-bottom-8 fade-in opacity-100 translate-y-0" : "opacity-0 translate-y-12 pointer-events-none"
      }`}
    >
      {/* Top Navigation */}
      <div className="px-5 pt-14 pb-4 flex items-center">
        <button onClick={onDismiss} className="p-2 -ml-2 text-zinc-400">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
      </div>

      <div className="px-5">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center mb-3">
            <ShieldAlert size={24} className="text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight font-sans">PausePay</div>
          <p className="text-sm font-medium text-indigo-300 mt-1">Pause before you pay</p>
        </div>

        {/* Risk Level & Amount */}
        <div className="flex flex-col items-center text-center mb-10">
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest mb-6 ${high ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-amber-500/10 text-amber-400 border border-amber-500/20"}`}>
            <TriangleAlert size={14} />
            {high ? "High Risk" : "Medium Risk"}
          </div>
          
          <div className="text-[16px] font-medium text-white mb-8 max-w-[240px] leading-snug text-balance">
            We compared this payment with the context around it.
          </div>

          <div className="text-3xl font-light tracking-tight mb-2">
            {formatInr(verification.amount)}
          </div>
          <div className="font-semibold text-zinc-200">{verification.payee_name || "Payee"}</div>
          <div className="text-sm text-zinc-400">{displayIdentifier(verification.identifier)}</div>
        </div>

        {/* Why we paused */}
        <div className="mb-10">
          <div className="text-[13px] font-bold uppercase tracking-widest text-zinc-400 mb-5 px-1 text-center">Why PausePay paused</div>
          <div className="space-y-4">
            
            {/* Ledger */}
            {verification.ledger_check && verification.ledger_check.unverified_incoming && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-left">
                <div className="flex items-center gap-3 mb-3">
                  <Landmark size={20} className="text-indigo-400" />
                  <div className="text-[13px] font-bold uppercase tracking-widest text-indigo-400">Incoming payment</div>
                </div>
                <div className="text-[17px] font-light text-white mb-1.5">{formatInr(verification.amount)}</div>
                <div className="text-[14px] text-zinc-300 font-medium leading-relaxed">{verification.ledger_check.summary}</div>
              </div>
            )}
            
            {/* Recipient */}
            {(() => {
              const recipientSignals = namedSignals.filter(s => s.family === "payee_identity" || s.code === "FIRST_TIME_PAYEE" || s.code === "ESCALATING_TO_NEW_PAYEE");
              if (recipientSignals.length === 0) return null;
              return (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-left">
                  <div className="flex items-center gap-3 mb-3">
                    <User size={20} className="text-indigo-400" />
                    <div className="text-[13px] font-bold uppercase tracking-widest text-indigo-400">Recipient</div>
                  </div>
                  <div className="text-[17px] font-light text-white mb-1.5">{verification.payee_name || displayIdentifier(verification.identifier)}</div>
                  <div className="text-[14px] text-zinc-300 font-medium leading-relaxed">{recipientSignals[0].evidence || recipientSignals[0].label}</div>
                </div>
              );
            })()}

            {/* Message */}
            {(() => {
              const msgSignals = namedSignals.filter(s => s.family === "social_engineering" || s.code.includes("MESSAGE"));
              if (msgSignals.length === 0) return null;
              return (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-left">
                  <div className="flex items-center gap-3 mb-3">
                    <MessageSquareText size={20} className="text-indigo-400" />
                    <div className="text-[13px] font-bold uppercase tracking-widest text-indigo-400">Message</div>
                  </div>
                  {verification.matched_message && (
                    <div className="text-[17px] font-light text-white mb-1.5 leading-tight">"{verification.matched_message.excerpt}"</div>
                  )}
                  <div className="text-[14px] text-zinc-300 font-medium leading-relaxed">{msgSignals[0].evidence || msgSignals[0].label}</div>
                </div>
              );
            })()}

          </div>
        </div>

        {/* Context Graph (Mobile UI Timeline) */}
        <details className="mb-12 text-left bg-[#13131A] border border-white/10 rounded-3xl p-6 relative shadow-xl group [&_summary::-webkit-details-marker]:hidden">
          <summary className="text-[13px] font-bold uppercase tracking-widest text-indigo-300 flex items-center justify-between cursor-pointer list-none select-none outline-none">
            <div className="flex items-center gap-2">
              <Link2 size={16} strokeWidth={2.5} />
              How did PausePay connect this?
            </div>
            <svg className="w-5 h-5 text-indigo-500 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </summary>
          
          <div className="relative pl-7 space-y-7 mt-8 pt-8 border-t border-white/5 overflow-hidden animate-in slide-in-from-top-4 fade-in duration-300">
            {/* Subtle gradient effect */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/10 blur-3xl rounded-full pointer-events-none" />
            
            {/* Continuous Line */}
            <div className="absolute left-[9px] top-2 bottom-2 w-[3px] bg-indigo-900/40 rounded-full" />
            
            <div className="relative">
              <div className="absolute -left-[31px] top-1 w-5 h-5 rounded-full bg-indigo-500 ring-4 ring-[#13131A] flex items-center justify-center shadow-[0_0_16px_rgba(99,102,241,0.5)]">
                <div className="w-2 h-2 bg-white rounded-full" />
              </div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Message</div>
              <div className="text-[15px] font-medium text-white mt-1 leading-snug">"{verification.matched_message?.excerpt || "Payment requested"}"</div>
            </div>
            
            {verification.matched_message?.amount_match && (
              <div className="relative">
                <div className="absolute -left-[31px] top-1 w-5 h-5 rounded-full bg-zinc-800 ring-4 ring-[#13131A] flex items-center justify-center border border-zinc-600">
                  <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full" />
                </div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Requested amount</div>
                <div className="text-[15px] font-medium text-white mt-1">{formatInr(verification.matched_message.amount || 0)}</div>
              </div>
            )}
            
            {verification.ledger_check?.unverified_incoming && (
              <div className="relative">
                <div className="absolute -left-[31px] top-1 w-5 h-5 rounded-full bg-zinc-800 ring-4 ring-[#13131A] flex items-center justify-center border border-zinc-600">
                  <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full" />
                </div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Your account</div>
                <div className="text-[15px] font-medium text-white mt-1">No matching incoming credit</div>
              </div>
            )}

            <div className="relative">
              <div className="absolute -left-[31px] top-1 w-5 h-5 rounded-full bg-zinc-800 ring-4 ring-[#13131A] flex items-center justify-center border border-zinc-600">
                <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full" />
              </div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Payment</div>
              <div className="text-[15px] font-medium text-white mt-1">{formatInr(verification.amount)} &rarr; {displayIdentifier(verification.identifier)}</div>
            </div>

            <div className="relative">
              <div className="absolute -left-[31px] top-1 w-5 h-5 rounded-full bg-zinc-800 ring-4 ring-[#13131A] flex items-center justify-center border border-zinc-600">
                <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full" />
              </div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Recipient</div>
              <div className="text-[15px] font-medium text-white mt-1">{verification.signals.find(s => s.code === "FIRST_TIME_PAYEE") ? "First payment to this recipient" : "Known recipient"}</div>
            </div>
          </div>
        </details>

        {/* Actions */}
        <div className="space-y-3">
          <button 
            type="button" 
            onClick={onGoBack}
            disabled={busy !== null}
            className="w-full bg-white text-zinc-900 font-bold py-4 rounded-xl active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
          >
            {busy === "report" ? <span className="w-5 h-5 border-2 border-zinc-900/30 border-t-zinc-900 rounded-full animate-spin" /> : null}
            Go Back
          </button>
          <button 
            type="button"
            onClick={onContinue}
            disabled={busy !== null}
            className="w-full bg-transparent text-zinc-400 font-semibold py-4 rounded-xl active:text-zinc-300 transition-colors flex items-center justify-center gap-2"
          >
            {busy === "continue" ? <span className="w-5 h-5 border-2 border-zinc-400/30 border-t-zinc-400 rounded-full animate-spin" /> : null}
            Continue anyway
          </button>
        </div>

        {/* The second level of the explanation. FLOW states the risk in plain
            words; the full investigation — score, weighted signals, timeline —
            lives in the PausePay app, which is where a sceptical user goes
            next. */}
        <Link
          href={`/app/pausepay/check/${verification.verification_id}`}
          className="mt-5 flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-3.5 text-[13px] font-semibold text-indigo-300 transition-colors active:bg-white/10"
        >
          <PausePayMark size={16} tone="mono" decorative />
          View in PausePay
          <ChevronRight size={15} aria-hidden="true" />
        </Link>

        <div className="mt-6 text-center text-xs text-zinc-600">PausePay concept &middot; Simulated payment environment</div>
      </div>
    </div>
  );
}
