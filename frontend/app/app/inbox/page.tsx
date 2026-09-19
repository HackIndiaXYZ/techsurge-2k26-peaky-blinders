"use client";

import { Info, TriangleAlert, WifiOff } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { errorMessage, getConversations, getHistory } from "@/lib/api";
import type { Conversation, RiskBand } from "@/lib/types";

/** Avatar tints, kept stable per conversation kind. */
const AVATAR: Record<Conversation["kind"], string> = {
  contact: "bg-[#E3EDFC] text-[#1A56DB]",
  business: "bg-[#E4F3E8] text-[#177245]",
  unknown: "bg-zinc-100 text-zinc-500",
};

function initials(name: string): string {
  if (name.startsWith("+")) return "#";
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function InboxPage() {
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
    <main className="flex h-full flex-col overflow-y-auto bg-white">
      <div className="px-5 pb-3 pt-12">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-400">Simulated messenger</p>
        <h1 className="mt-1 text-[28px] font-bold tracking-tight text-zinc-900">Inbox</h1>
      </div>

      <p className="mx-5 mb-2 flex items-start gap-2 rounded-xl bg-[#EEF5FE] p-3 text-[11.5px] leading-snug text-[#1B4B8F]">
        <Info size={14} className="mt-px shrink-0" aria-hidden="true" />
        These threads are synthetic. PausePay checks payment-related messages through the same API a real message source would call.
      </p>

      {error && (
        <p className="mx-5 mt-2 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-[13px] text-red-700" role="alert">
          <WifiOff size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
          <span>{error} Start the backend to load conversations.</span>
        </p>
      )}

      {conversations === null && !error && <p className="px-5 py-4 text-[13px] text-zinc-400">Loading conversations…</p>}

      <ul className="mt-1">
        {conversations?.map((conv) => {
          const flag = flags[conv.id];
          const last = conv.messages[conv.messages.length - 1];
          return (
            <li key={conv.id}>
              <Link
                href={`/app/inbox/${conv.id}`}
                className="flex items-center gap-3 border-b border-zinc-100 px-5 py-3.5 transition-colors active:bg-zinc-50"
              >
                <span
                  className={`grid h-11 w-11 shrink-0 place-items-center rounded-full text-[13px] font-bold ${AVATAR[conv.kind]}`}
                  aria-hidden="true"
                >
                  {initials(conv.name)}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    <span className="truncate text-[15px] font-semibold text-zinc-900">{conv.name}</span>
                    {conv.kind === "unknown" && (
                      <span className="shrink-0 rounded-full bg-zinc-100 px-1.5 py-px text-[9.5px] font-semibold text-zinc-500">
                        Unknown
                      </span>
                    )}
                  </span>
                  <span className="mt-0.5 block truncate text-[13px] text-zinc-500">{conv.preview}</span>
                </span>

                <span className="flex shrink-0 flex-col items-end gap-1">
                  <span className="font-mono text-[11px] tabular-nums text-zinc-400">{last.time}</span>
                  {flag && (
                    <span
                      className={`flex items-center gap-0.5 rounded-full px-1.5 py-px text-[9.5px] font-bold ${
                        flag === "HIGH" ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"
                      }`}
                      aria-label={`PausePay flagged ${flag.toLowerCase()} risk`}
                    >
                      <TriangleAlert size={10} aria-hidden="true" /> {flag === "HIGH" ? "Risky" : "Review"}
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
