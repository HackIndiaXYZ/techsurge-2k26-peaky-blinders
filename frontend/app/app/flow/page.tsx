"use client";

import { Building2, ChevronRight, Landmark, MessageSquareText, QrCode, Smartphone } from "lucide-react";
import Link from "next/link";
import { PausePayMark } from "@/components/brand/PausePayMark";

/**
 * FLOW — the simulated UPI app.
 *
 * Modelled on the reference screens in `assets/all/1-4.png`: a familiar
 * payment home so the PausePay intervention later reads as something that
 * happens *inside* an ordinary payment app, not as a different product.
 */

const QUICK_ACTIONS = [
  { icon: QrCode, label: "Scan QR" },
  { icon: Smartphone, label: "Phone" },
  { icon: Building2, label: "UPI ID" },
  { icon: Landmark, label: "Bank" },
];

const RECENT_PEOPLE = [
  { name: "Aarav", initials: "A", tint: "bg-[#EDE9FE] text-[#5B21B6]" },
  { name: "Priya", initials: "P", tint: "bg-[#FCE7F3] text-[#9D174D]" },
  { name: "Rahul", initials: "R", tint: "bg-[#D1FAE5] text-[#065F46]" },
  { name: "Karan", initials: "K", tint: "bg-[#DBEAFE] text-[#1E40AF]" },
  { name: "Sneha", initials: "S", tint: "bg-[#FEF3C7] text-[#92400E]" },
];

export default function FlowHomePage() {
  return (
    <main className="pb-6">
      <header className="flex items-center justify-between bg-white px-5 pb-4 pt-12">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight text-zinc-900">FLOW</h1>
          <p className="mt-0.5 text-[11px] font-semibold text-[#1A73E8]">Protected by PausePay</p>
        </div>
        <span className="grid h-10 w-10 place-items-center rounded-full border border-zinc-200 bg-zinc-100 text-[13px] font-bold text-zinc-700">
          U
        </span>
      </header>

      <div className="space-y-6 p-5">
        <h2 className="text-[20px] font-semibold text-zinc-900">Good evening, User</h2>

        {/* The demo's entry point — a judge who opens FLOW first still finds the story. */}
        <Link
          href="/app/inbox"
          className="flex items-start gap-3.5 rounded-2xl border border-[#D6E6FC] bg-white p-4 transition-transform active:scale-[0.99]"
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#EEF5FE] text-[#1A73E8]" aria-hidden="true">
            <MessageSquareText size={19} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[14.5px] font-bold text-zinc-900">Payment request</span>
            <span className="mt-0.5 block text-[12px] text-zinc-500">Review a payment from your messages.</span>
            <span className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold text-[#1A73E8]">
              Open Inbox <ChevronRight size={13} aria-hidden="true" />
            </span>
          </span>
        </Link>

        <section>
          <h3 className="mb-3.5 text-[13.5px] font-semibold text-zinc-900">Pay anyone</h3>
          <div className="grid grid-cols-4 gap-3">
            {QUICK_ACTIONS.map((action) => (
              <Link key={action.label} href="/app/flow/pay" className="flex flex-col items-center gap-2">
                <span className="grid h-14 w-14 place-items-center rounded-2xl border border-zinc-200 bg-white text-[#1A73E8] transition-transform active:scale-95">
                  <action.icon size={23} strokeWidth={1.6} aria-hidden="true" />
                </span>
                <span className="text-center text-[10.5px] font-medium text-zinc-600">{action.label}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Protection banner, mirroring the reference home screen. */}
        <Link
          href="/app/pausepay"
          className="flex items-center gap-3.5 rounded-2xl bg-[linear-gradient(135deg,#EEF2FF_0%,#F5F3FF_100%)] p-4 transition-transform active:scale-[0.99]"
        >
          <PausePayMark size={30} decorative />
          <span className="min-w-0 flex-1 border-l border-zinc-300/60 pl-3.5">
            <span className="block text-[13.5px] font-bold text-zinc-900">PausePay protection is active</span>
            <span className="block text-[11.5px] text-zinc-500">Get an extra moment before you pay</span>
          </span>
          <ChevronRight size={17} className="shrink-0 text-zinc-400" aria-hidden="true" />
        </Link>

        <section>
          <div className="mb-3.5 flex items-center justify-between">
            <h3 className="text-[13.5px] font-semibold text-zinc-900">Recent people</h3>
            <span className="text-[11.5px] font-semibold text-[#1A73E8]">See all</span>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-1">
            {RECENT_PEOPLE.map((person) => (
              <div key={person.name} className="flex shrink-0 flex-col items-center gap-1.5">
                <span
                  className={`grid h-14 w-14 place-items-center rounded-full border border-black/5 text-[17px] font-semibold ${person.tint}`}
                  aria-hidden="true"
                >
                  {person.initials}
                </span>
                <span className="text-[10.5px] font-medium text-zinc-700">{person.name}</span>
              </div>
            ))}
          </div>
        </section>

        <p className="pt-1 text-center text-[10px] font-medium uppercase tracking-[0.16em] text-zinc-400">
          FLOW is a simulated payment app · Demo only
        </p>
      </div>
    </main>
  );
}
