"use client";

import { ChevronRight, MessageSquareText, ShieldCheck, TriangleAlert, WifiOff } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { errorMessage, getDashboard } from "@/lib/api";
import type { DashboardResponse, RiskBand } from "@/lib/types";
import { displayIdentifier, formatInr, humaniseAction, relativeTime } from "@/lib/utils";

const TONE: Record<RiskBand, { dot: string; text: string }> = {
  HIGH: { dot: "bg-red-50 text-red-600", text: "text-red-600" },
  MEDIUM: { dot: "bg-amber-50 text-amber-600", text: "text-amber-600" },
  LOW: { dot: "bg-emerald-50 text-emerald-600", text: "text-emerald-600" },
};

export default function ChecksPage() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getDashboard()
      .then((d) => !cancelled && setData(d))
      .catch((err) => !cancelled && setError(errorMessage(err)));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="px-5 pb-6 pt-12">
      <h1 className="text-[26px] font-bold tracking-tight text-zinc-900">Checks</h1>
      <p className="mt-1 text-[13px] font-medium text-zinc-500">Every payment PausePay has evaluated.</p>

      <Link
        href="/app/pausepay/check/message"
        className="mt-5 flex items-center gap-3 rounded-2xl border border-[#D6E6FC] bg-[#F4F8FE] p-3.5 transition-transform active:scale-[0.99]"
      >
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-[#1A73E8]" aria-hidden="true">
          <MessageSquareText size={17} />
        </span>
        <span className="flex-1">
          <span className="block text-[14px] font-bold text-zinc-900">Check a message</span>
          <span className="block text-[11.5px] text-zinc-500">Paste any payment request to analyse it</span>
        </span>
        <ChevronRight size={17} className="text-zinc-400" aria-hidden="true" />
      </Link>

      {error && (
        <p className="mt-5 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-[13px] text-red-700" role="alert">
          <WifiOff size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
          <span>{error} Start the backend to load checks.</span>
        </p>
      )}

      {data === null && !error && <p className="mt-6 text-[13px] text-zinc-400">Loading checks…</p>}

      {data && data.recent_verifications.length === 0 && (
        <p className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5 text-center text-[13px] text-zinc-500">
          No payments checked yet.
        </p>
      )}

      <ul className="mt-5 space-y-2.5">
        {data?.recent_verifications.map((v) => {
          const tone = TONE[v.risk_band];
          const risky = v.risk_band !== "LOW";
          return (
            <li key={v.id}>
              <Link
                href={`/app/pausepay/check/${v.id}`}
                className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-3.5 transition-transform active:scale-[0.99]"
              >
                <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${tone.dot}`} aria-hidden="true">
                  {risky ? <TriangleAlert size={18} /> : <ShieldCheck size={18} />}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline gap-2">
                    <span className="text-[15px] font-bold text-zinc-900">{formatInr(v.amount)}</span>
                    <span className="truncate text-[12px] font-medium text-zinc-500">
                      {v.payee_name || displayIdentifier(v.identifier)}
                    </span>
                  </span>
                  <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${tone.text}`}>
                      {v.risk_band} · {v.risk_score}
                    </span>
                    <span className="text-[11px] text-zinc-400">{relativeTime(v.created_at)}</span>
                    {v.user_action && (
                      <span className="rounded-full bg-zinc-100 px-1.5 py-px text-[10px] font-semibold text-zinc-600">
                        {humaniseAction(v.user_action)}
                      </span>
                    )}
                  </span>
                </span>

                <ChevronRight size={17} className="shrink-0 text-zinc-300" aria-hidden="true" />
              </Link>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
