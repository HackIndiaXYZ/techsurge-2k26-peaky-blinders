"use client";

import { ChevronRight, ShieldCheck, TriangleAlert, WifiOff } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { PausePayWordmark } from "@/components/brand/PausePayWordmark";
import { errorMessage, getDashboard } from "@/lib/api";
import type { DashboardResponse } from "@/lib/types";
import { displayIdentifier, formatInr, relativeTime } from "@/lib/utils";

export default function PausePayHome() {
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

  const reviewed = data?.totals.verifications ?? 0;
  const warnings = data?.totals.interrupted ?? 0;
  const recent = data?.recent_verifications.slice(0, 6) ?? [];

  return (
    <main className="px-5 pb-6 pt-12">
      <PausePayWordmark size={26} />
      <p className="mt-1.5 text-[13px] font-medium text-zinc-500">Your payment safety layer</p>

      {error && (
        <p className="mt-5 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-[13px] text-red-700" role="alert">
          <WifiOff size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
          <span>{error} Start the backend to load checks.</span>
        </p>
      )}

      {/* Protection summary */}
      <section className="mt-6 rounded-2xl border border-[#D6E6FC] bg-[linear-gradient(150deg,#EEF5FE_0%,#F7FAFF_100%)] p-5">
        <div className="flex items-center gap-2 text-[#1A73E8]">
          <ShieldCheck size={18} aria-hidden="true" />
          <span className="text-[15px] font-bold">Protection active</span>
        </div>
        <div className="mt-4 flex gap-8">
          <div>
            <div className="text-2xl font-bold tabular-nums text-zinc-900">{reviewed}</div>
            <div className="text-[11px] font-medium text-zinc-500">payments reviewed</div>
          </div>
          <div>
            <div className="text-2xl font-bold tabular-nums text-zinc-900">{warnings}</div>
            <div className="text-[11px] font-medium text-zinc-500">{warnings === 1 ? "warning" : "warnings"}</div>
          </div>
        </div>
      </section>

      {/* Recent checks */}
      <div className="mb-3 mt-7 flex items-center justify-between">
        <h2 className="text-[15px] font-bold text-zinc-900">Recent checks</h2>
        <Link href="/app/pausepay/check" className="text-[12px] font-semibold text-[#1A73E8]">
          See all
        </Link>
      </div>

      {data && recent.length === 0 && (
        <p className="rounded-2xl border border-zinc-200 bg-white p-5 text-center text-[13px] text-zinc-500">
          No payments checked yet. Open FLOW and start one.
        </p>
      )}

      <ul className="space-y-2.5">
        {recent.map((v) => {
          const high = v.risk_band === "HIGH";
          const medium = v.risk_band === "MEDIUM";
          return (
            <li key={v.id}>
              <Link
                href={`/app/pausepay/check/${v.id}`}
                className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-3.5 transition-transform active:scale-[0.99]"
              >
                <span
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${
                    high ? "bg-red-50 text-red-600" : medium ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"
                  }`}
                  aria-hidden="true"
                >
                  {high || medium ? <TriangleAlert size={18} /> : <ShieldCheck size={18} />}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline gap-2">
                    <span className="text-[15px] font-bold text-zinc-900">{formatInr(v.amount)}</span>
                    <span className="truncate text-[12px] font-medium text-zinc-500">
                      {v.payee_name || displayIdentifier(v.identifier)}
                    </span>
                  </span>
                  <span className="mt-0.5 flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider ${
                        high ? "text-red-600" : medium ? "text-amber-600" : "text-emerald-600"
                      }`}
                    >
                      {v.risk_band} risk
                    </span>
                    <span className="text-[11px] text-zinc-400">{relativeTime(v.created_at)}</span>
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
