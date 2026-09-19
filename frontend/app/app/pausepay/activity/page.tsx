"use client";

import { Clock, MessageSquareText, ShieldAlert, ShieldCheck, WifiOff } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { errorMessage, getDashboard } from "@/lib/api";
import type { DashboardResponse } from "@/lib/types";
import { displayIdentifier, formatInr } from "@/lib/utils";

type TimelineEvent = {
  id: string;
  type: "message" | "payment";
  time: Date;
  title: string;
  subtitle: string;
  risk: "HIGH" | "MEDIUM" | "LOW" | "NONE";
};

/** Groups events under a day heading so a long session stays readable. */
function dayLabel(date: Date): string {
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();
  if (isToday) return "Today";
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString([], { day: "numeric", month: "short" });
}

export default function ActivityPage() {
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

  const groups = useMemo(() => {
    if (!data) return [];
    const events: TimelineEvent[] = [];

    data.recent_analyses.forEach((a) => {
      events.push({
        id: `a-${a.id}`,
        type: "message",
        time: new Date(a.created_at),
        title: "Message analysed",
        subtitle: a.intent.replace(/_/g, " ").toLowerCase() || "Payment request detected",
        risk: a.risk_band,
      });
    });

    data.recent_verifications.forEach((v) => {
      const who = v.payee_name || displayIdentifier(v.identifier);
      events.push({
        id: `v-${v.id}`,
        type: "payment",
        time: new Date(v.created_at),
        title: "Payment reviewed",
        subtitle: `${formatInr(v.amount)} · ${who}`,
        risk: v.risk_band,
      });
      if (v.user_action) {
        events.push({
          id: `va-${v.id}`,
          type: "payment",
          time: new Date(v.acted_at || v.created_at),
          title:
            v.user_action === "PAID"
              ? "Payment completed"
              : v.user_action.startsWith("CANCELLED")
                ? "Payment cancelled"
                : "Continued after warning",
          subtitle: `${formatInr(v.amount)} · ${who}`,
          risk: "NONE",
        });
      }
    });

    events.sort((a, b) => b.time.getTime() - a.time.getTime());

    const byDay = new Map<string, TimelineEvent[]>();
    for (const event of events) {
      const key = dayLabel(event.time);
      const bucket = byDay.get(key);
      if (bucket) bucket.push(event);
      else byDay.set(key, [event]);
    }
    return [...byDay.entries()];
  }, [data]);

  return (
    <main className="px-5 pb-6 pt-12">
      <h1 className="text-[26px] font-bold tracking-tight text-zinc-900">Activity</h1>
      <p className="mt-1 text-[13px] font-medium text-zinc-500">Everything PausePay has seen and done.</p>

      {error && (
        <p className="mt-5 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-[13px] text-red-700" role="alert">
          <WifiOff size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
          <span>{error} Start the backend to load activity.</span>
        </p>
      )}

      {data === null && !error && <p className="mt-6 text-[13px] text-zinc-400">Loading activity…</p>}

      {data && groups.length === 0 && (
        <div className="mt-10 flex flex-col items-center text-zinc-400">
          <Clock size={30} className="mb-3 opacity-50" aria-hidden="true" />
          <p className="text-[13px]">No recent activity</p>
        </div>
      )}

      {groups.map(([day, events]) => (
        <section key={day} className="mt-6">
          <h2 className="mb-3 ml-1 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-400">{day}</h2>
          <ol className="space-y-3">
            {events.map((event) => {
              const cancelled = event.title.includes("cancelled");
              const completed = event.title.includes("completed");
              const continued = event.title.includes("Continued");
              return (
                <li key={event.id} className="flex gap-3">
                  <span
                    className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${
                      event.type === "message"
                        ? "bg-[#EEF5FE] text-[#1A56DB]"
                        : cancelled
                          ? "bg-red-50 text-red-600"
                          : completed
                            ? "bg-emerald-50 text-emerald-600"
                            : continued
                              ? "bg-amber-50 text-amber-600"
                              : event.risk === "HIGH"
                                ? "bg-red-50 text-red-600"
                                : event.risk === "MEDIUM"
                                  ? "bg-amber-50 text-amber-600"
                                  : "bg-emerald-50 text-emerald-600"
                    }`}
                    aria-hidden="true"
                  >
                    {event.type === "message" ? (
                      <MessageSquareText size={16} />
                    ) : event.risk === "HIGH" ? (
                      <ShieldAlert size={16} />
                    ) : (
                      <ShieldCheck size={16} />
                    )}
                  </span>

                  <div className="min-w-0 flex-1 border-b border-zinc-100 pb-3">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-[14px] font-semibold text-zinc-900">{event.title}</span>
                      <span className="shrink-0 font-mono text-[10.5px] tabular-nums text-zinc-400">
                        {event.time.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-[12.5px] text-zinc-500 first-letter:uppercase">{event.subtitle}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </main>
  );
}
