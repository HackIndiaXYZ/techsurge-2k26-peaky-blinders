"use client";

import { ArrowLeft, Clock, MessageSquareText, ShieldAlert, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { getDashboard } from "@/lib/api";
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

export default function ActivityPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardResponse | null>(null);

  useEffect(() => {
    getDashboard().then(setData).catch(console.error);
  }, []);

  const timeline = useMemo(() => {
    if (!data) return [];
    const events: TimelineEvent[] = [];

    data.recent_analyses.forEach((a) => {
      events.push({
        id: `a-${a.id}`,
        type: "message",
        time: new Date(a.created_at),
        title: "Message analyzed",
        subtitle: a.intent.replace(/_/g, " ").toLowerCase() || "Payment request detected",
        risk: a.risk_band,
      });
    });

    data.recent_verifications.forEach((v) => {
      events.push({
        id: `v-${v.id}`,
        type: "payment",
        time: new Date(v.created_at),
        title: "Payment review",
        subtitle: `${formatInr(v.amount)} · ${v.payee_name || displayIdentifier(v.identifier)}`,
        risk: v.risk_band,
      });
      if (v.user_action) {
        events.push({
          id: `va-${v.id}`,
          type: "payment",
          time: new Date(v.acted_at || v.created_at),
          title: v.user_action === "PAID" ? "Payment completed" : v.user_action === "CANCELLED" ? "Payment cancelled" : "Payment continued",
          subtitle: `${formatInr(v.amount)} · ${v.payee_name || displayIdentifier(v.identifier)}`,
          risk: "NONE",
        });
      }
    });

    return events.sort((a, b) => b.time.getTime() - a.time.getTime());
  }, [data]);

  return (
    <main className="flex flex-col h-full bg-[#f8f9fa] text-zinc-900 overflow-y-auto">
      <div className="px-5 pt-14 pb-4 flex items-center justify-between sticky top-0 bg-[#f8f9fa]/90 backdrop-blur-md z-10">
        <button onClick={() => router.back()} className="p-2 -ml-2 text-zinc-900 active:bg-zinc-100 rounded-full transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div className="font-bold text-lg tracking-tight">Activity</div>
        <div className="w-10 h-10" />
      </div>

      <div className="px-5 pb-8 flex-1">
        {timeline.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-zinc-400">
            <Clock size={32} className="mb-4 opacity-50" />
            <p className="text-sm">No recent activity</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4 ml-1">Today</div>
              <div className="space-y-4">
                {timeline.map((event) => (
                  <div key={event.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 border-white shadow-sm shrink-0
                        ${event.type === "message" ? "bg-indigo-50 text-indigo-600" : 
                          event.title.includes("cancelled") ? "bg-red-50 text-red-600" :
                          event.title.includes("completed") ? "bg-emerald-50 text-emerald-600" :
                          event.title.includes("continued") ? "bg-amber-50 text-amber-600" :
                          event.risk === "HIGH" ? "bg-red-50 text-red-600" :
                          event.risk === "MEDIUM" ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"}`}
                      >
                        {event.type === "message" ? <MessageSquareText size={18} /> : 
                         event.risk === "HIGH" ? <ShieldAlert size={18} /> : <ShieldCheck size={18} />}
                      </div>
                      <div className="w-0.5 h-full bg-zinc-200 mt-2 rounded-full hidden last:block" />
                    </div>
                    <div className="flex-1 pb-4 border-b border-zinc-100 last:border-0 last:pb-0">
                      <div className="flex justify-between items-start mb-1">
                        <div className="font-semibold text-zinc-900">{event.title}</div>
                        <div className="text-[11px] font-medium text-zinc-500 mt-0.5">
                          {event.time.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                        </div>
                      </div>
                      <div className="text-sm text-zinc-600 font-medium">{event.subtitle}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-auto text-center p-6 text-[10px] uppercase tracking-widest font-bold text-zinc-400">
        Simulated Phone Environment
      </div>
    </main>
  );
}
