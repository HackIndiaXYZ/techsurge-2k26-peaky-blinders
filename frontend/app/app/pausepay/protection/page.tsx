"use client";

import { Check, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";
import { PausePayShield } from "@/components/brand/PausePayShield";
import { errorMessage, getHealth } from "@/lib/api";
import type { HealthResponse } from "@/lib/types";

/** What PausePay reads when it scores a payment. */
const MONITORED = [
  { label: "Payment context", detail: "Recipient, amount and how the payment was started" },
  { label: "Message context", detail: "Payment requests analysed in the last 24 hours" },
  { label: "Recipient history", detail: "Whether you have paid this identifier before" },
  { label: "Transaction patterns", detail: "How this amount compares with your usual payments" },
  { label: "Bank ledger", detail: "Whether a claimed incoming credit actually arrived" },
];

export default function ProtectionPage() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getHealth()
      .then((h) => !cancelled && setHealth(h))
      .catch((err) => !cancelled && setError(errorMessage(err)));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="px-5 pb-6 pt-12">
      <h1 className="text-[26px] font-bold tracking-tight text-zinc-900">Protection</h1>
      <p className="mt-1 text-[13px] font-medium text-zinc-500">What PausePay looks at before a payment leaves.</p>

      <div className="my-6 flex justify-center">
        <PausePayShield size={132} />
      </div>

      <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
        {MONITORED.map((item, i) => (
          <div key={item.label} className={`flex gap-3 p-4 ${i > 0 ? "border-t border-zinc-100" : ""}`}>
            <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-600" aria-hidden="true">
              <Check size={13} strokeWidth={3} />
            </span>
            <span>
              <span className="block text-[14px] font-semibold text-zinc-900">{item.label}</span>
              <span className="block text-[12px] leading-snug text-zinc-500">{item.detail}</span>
            </span>
          </div>
        ))}
      </section>

      {/* Engine status — the honest version of "protection active". */}
      <section className="mt-5 rounded-2xl border border-zinc-200 bg-white p-4">
        <h2 className="mb-3 text-[11px] font-bold uppercase tracking-widest text-zinc-500">Engine</h2>
        {error && (
          <p className="flex items-start gap-2 text-[12.5px] text-red-700" role="alert">
            <WifiOff size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </p>
        )}
        {health && (
          <dl className="space-y-1.5 text-[12.5px]">
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500">Risk engine</dt>
              <dd className="font-medium tabular-nums text-zinc-900">{health.engine_version}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500">Intent model</dt>
              <dd className="font-medium tabular-nums text-zinc-900">{health.model_version ?? "not loaded"}</dd>
            </div>
            {health.metrics?.holdout && (
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500">Held-out accuracy</dt>
                <dd className="font-medium tabular-nums text-zinc-900">
                  {(health.metrics.holdout.intent_accuracy * 100).toFixed(1)}%
                </dd>
              </div>
            )}
          </dl>
        )}
      </section>

      <p className="mt-5 text-center text-[11px] leading-relaxed text-zinc-400">
        PausePay reports risk signals. It does not issue fraud verdicts, and the
        decision to pay always stays with you.
      </p>
    </main>
  );
}
