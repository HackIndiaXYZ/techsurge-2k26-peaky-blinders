"use client";

import { MessageSquareText, QrCode, Smartphone, Building2, Landmark, History, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const recentPeople = [
  { name: "Aarav", initials: "A", color: "bg-blue-100 text-blue-700" },
  { name: "Priya", initials: "P", color: "bg-pink-100 text-pink-700" },
  { name: "Rahul", initials: "R", color: "bg-emerald-100 text-emerald-700" },
  { name: "Karan", initials: "K", color: "bg-amber-100 text-amber-700" },
];

export default function FlowHomePage() {
  const router = useRouter();

  return (
    <main className="flex flex-col h-full bg-[#f8f9fa] text-zinc-900 overflow-y-auto">
      {/* FLOW App Header */}
      <div className="px-5 pt-8 pb-4 bg-white shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">FLOW</h1>
          <p className="text-xs font-medium text-indigo-600 mt-0.5">Protected by PausePay</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center border border-zinc-200 shadow-sm text-sm font-bold text-zinc-700">
          U
        </div>
      </div>

      <div className="p-5 space-y-6">
        <h2 className="text-[22px] font-semibold text-zinc-900">Good evening, User</h2>

        {/* Demo Entry Point CTA */}
        <div 
          onClick={() => router.push("/app/messages")}
          className="bg-white border-2 border-indigo-100 rounded-2xl p-4 shadow-sm active:scale-[0.98] transition-transform cursor-pointer"
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
              <MessageSquareText size={20} className="text-indigo-600" />
            </div>
            <div>
              <h3 className="font-bold text-zinc-900">Payment request</h3>
              <p className="text-xs text-zinc-500 mt-1 mb-3">Review a payment from your messages.</p>
              <div className="inline-flex items-center text-xs font-semibold text-indigo-600">
                Open messages &rarr;
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h3 className="text-sm font-semibold text-zinc-900 mb-4">Pay anyone</h3>
          <div className="grid grid-cols-4 gap-3">
            {[
              { icon: QrCode, label: "Scan QR" },
              { icon: Smartphone, label: "Phone" },
              { icon: Building2, label: "UPI ID" },
              { icon: Landmark, label: "Bank" },
            ].map((action, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className="w-14 h-14 rounded-2xl bg-white border border-zinc-200 shadow-sm flex items-center justify-center text-indigo-600 active:bg-zinc-50">
                  <action.icon size={24} strokeWidth={1.5} />
                </div>
                <span className="text-[11px] font-medium text-zinc-600 text-center">{action.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent People */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-zinc-900">Recent people</h3>
            <button type="button" className="text-[11px] font-semibold text-indigo-600">See all</button>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {recentPeople.map((person, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5 shrink-0">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center font-semibold text-[17px] shadow-sm border border-black/5 ${person.color}`}>
                  {person.initials}
                </div>
                <span className="text-[11px] font-medium text-zinc-700">{person.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="mt-auto bg-white border-t border-zinc-200 flex justify-around p-3 pb-6">
        <Link href="/app/pay/home" className="flex flex-col items-center gap-1 text-indigo-600">
          <Building2 size={20} fill="currentColor" className="opacity-20" />
          <span className="text-[10px] font-bold">Home</span>
        </Link>
        <div className="flex flex-col items-center gap-1 text-zinc-400">
          <History size={20} />
          <span className="text-[10px] font-medium">History</span>
        </div>
        <Link href="/app/activity" className="flex flex-col items-center gap-1 text-zinc-400">
          <ShieldCheck size={20} />
          <span className="text-[10px] font-medium">Activity</span>
        </Link>
      </div>
    </main>
  );
}
