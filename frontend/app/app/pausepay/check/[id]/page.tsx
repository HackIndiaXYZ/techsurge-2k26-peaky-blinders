"use client";

import { ArrowLeft, Info, WifiOff } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { errorMessage, getDashboard } from "@/lib/api";
import { useDemoSession } from "@/lib/demo-session";
import type { PaymentVerification, RiskBand } from "@/lib/types";
import { displayIdentifier, formatInr, humaniseAction, relativeTime } from "@/lib/utils";

const TONE: Record<RiskBand, { label: string; ring: string; text: string; chip: string }> = {
  HIGH: { label: "High risk", ring: "stroke-red-500", text: "text-red-600", chip: "bg-red-50 text-red-700" },
  MEDIUM: { label: "Medium risk", ring: "stroke-amber-500", text: "text-amber-600", chip: "bg-amber-50 text-amber-700" },
  LOW: { label: "Low risk", ring: "stroke-emerald-500", text: "text-emerald-600", chip: "bg-emerald-50 text-emerald-700" },
};

/** Score dial — the "86 / 100" read from the concept. */
function ScoreDial({ score, band }: { score: number; band: RiskBand }) {
  const r = 52;
  const circumference = 2 * Math.PI * r;
  const filled = (Math.min(100, Math.max(0, score)) / 100) * circumference;

  return (
    <div className="relative mx-auto h-[132px] w-[132px]">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle cx="60" cy="60" r={r} className="stroke-zinc-200" strokeWidth="9" fill="none" />
        <circle
          cx="60"
          cy="60"
          r={r}
          className={TONE[band].ring}
          strokeWidth="9"
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${filled} ${circumference}`}
        />
      </svg>
      <div className="absolute inset-0 grid place-content-center text-center">
        <div className="text-[34px] font-bold leading-none tabular-nums text-zinc-900">{score}</div>
        <div className="mt-1 text-[11px] font-medium text-zinc-400">/ 100</div>
      </div>
    </div>
  );
}

export default function CheckDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { assessments } = useDemoSession();

  const [record, setRecord] = useState<PaymentVerification | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  // The full assessment, with signal weights, exists only for checks run in
  // this session. Anything older falls back to the persisted summary.
  const cached = assessments[Number(id)] ?? null;

  useEffect(() => {
    let cancelled = false;
    getDashboard()
      .then((d) => {
        if (cancelled) return;
        setRecord(d.recent_verifications.find((v) => String(v.id) === id) ?? null);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(errorMessage(err));
        setRecord(null);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const band: RiskBand = cached?.risk_band ?? record?.risk_band ?? "LOW";
  const score = cached?.risk_score ?? record?.risk_score ?? 0;
  const amount = cached?.amount ?? record?.amount ?? 0;
  const payee = cached?.payee_name ?? record?.payee_name ?? null;
  const identifier = cached?.identifier ?? record?.identifier ?? "";
  const reasons = cached?.reasons ?? record?.reasons ?? [];
  const tone = TONE[band];

  /** Positive-weight signals, heaviest first — the "+25 / +22 / +12" breakdown. */
  const weighted = useMemo(
    () =>
      (cached?.signals ?? [])
        .filter((s) => s.weight > 0)
        .sort((a, b) => b.weight - a.weight),
    [cached],
  );

  if (record === undefined) {
    return <main className="px-5 pt-14 text-[13px] text-zinc-400">Loading check…</main>;
  }

  if (record === null && !cached) {
    return (
      <main className="px-5 pt-14">
        <p className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-[13px] text-red-700">
          <WifiOff size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
          <span>{error ?? "This check is no longer available."}</span>
        </p>
        <button type="button" onClick={() => router.push("/app/pausepay/check")} className="mt-4 text-[13px] font-semibold text-[#1A73E8]">
          Back to checks
        </button>
      </main>
    );
  }

  return (
    <main className="pb-8">
      <div className="flex items-center gap-1 px-3 pt-12">
        <button
          type="button"
          onClick={() => router.push("/app/pausepay/check")}
          className="grid h-10 w-10 place-items-center rounded-full text-zinc-700 active:bg-zinc-100"
          aria-label="Back to checks"
        >
          <ArrowLeft size={20} aria-hidden="true" />
        </button>
        <span className="text-[15px] font-bold text-zinc-900">Payment check</span>
      </div>

      <div className="px-5 pt-4">
        <p className={`text-center text-[12px] font-bold uppercase tracking-[0.15em] ${tone.text}`}>{tone.label}</p>
        <div className="mt-4">
          <ScoreDial score={score} band={band} />
        </div>

        <div className="mt-5 rounded-2xl border border-zinc-200 bg-white p-4 text-center">
          <div className="text-[22px] font-bold text-zinc-900">{formatInr(amount)}</div>
          <div className="mt-0.5 text-[13px] font-medium text-zinc-600">{payee || "Unknown payee"}</div>
          <div className="text-[12px] text-zinc-400">{displayIdentifier(identifier)}</div>
          {record && (
            <div className="mt-2.5 flex items-center justify-center gap-2">
              <span className="text-[11px] text-zinc-400">{relativeTime(record.created_at)}</span>
              {record.user_action && (
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${tone.chip}`}>
                  {humaniseAction(record.user_action)}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Weighted breakdown — only available for this session's checks. */}
        {weighted.length > 0 ? (
          <section className="mt-6">
            <h2 className="mb-3 text-[11px] font-bold uppercase tracking-widest text-zinc-500">Why</h2>
            <ul className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
              {weighted.map((s, i) => (
                <li key={s.code} className={`flex items-start gap-3 p-3.5 ${i > 0 ? "border-t border-zinc-100" : ""}`}>
                  <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-bold tabular-nums ${tone.chip}`}>
                    +{s.weight}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[13.5px] font-semibold leading-snug text-zinc-900">{s.label}</span>
                    {s.evidence && <span className="block text-[12px] leading-snug text-zinc-500">{s.evidence}</span>}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ) : (
          reasons.length > 0 && (
            <section className="mt-6">
              <h2 className="mb-3 text-[11px] font-bold uppercase tracking-widest text-zinc-500">Why</h2>
              <ul className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
                {reasons.map((reason, i) => (
                  <li key={reason} className={`p-3.5 text-[13.5px] leading-snug text-zinc-800 ${i > 0 ? "border-t border-zinc-100" : ""}`}>
                    {reason}
                  </li>
                ))}
              </ul>
              <p className="mt-2.5 flex items-start gap-1.5 px-1 text-[11.5px] leading-snug text-zinc-400">
                <Info size={13} className="mt-px shrink-0" aria-hidden="true" />
                Signal weights are kept for checks run in this session. This one was
                restored from history, so only its reasons are shown.
              </p>
            </section>
          )
        )}

        {/* Timeline — comes straight off the live assessment. */}
        {cached?.timeline && cached.timeline.length > 0 && (
          <section className="mt-6">
            <h2 className="mb-3 text-[11px] font-bold uppercase tracking-widest text-zinc-500">Timeline</h2>
            <ol className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
              {cached.timeline.map((event, i) => (
                <li key={`${event.step}-${i}`} className={`flex items-baseline gap-3 p-3 ${i > 0 ? "border-t border-zinc-100" : ""}`}>
                  <span className="shrink-0 font-mono text-[11px] tabular-nums text-zinc-400">
                    {new Date(event.timestamp).toLocaleTimeString([], { hour12: false })}
                  </span>
                  <span className="text-[13px] text-zinc-800">{event.step}</span>
                </li>
              ))}
            </ol>
          </section>
        )}
      </div>
    </main>
  );
}
