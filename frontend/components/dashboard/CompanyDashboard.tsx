"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Blocks,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  Command,
  Copy,
  LayoutDashboard,
  PanelLeftClose,
  PanelLeftOpen,
  QrCode,
  Search,
  Terminal,
  Zap,
  Activity,
  Code2,
  List,
  ShieldAlert
} from "lucide-react";

export type NavItemData = {
  id: string;
  title: string;
  icon: React.ElementType;
  badge?: number | string;
  shortcut?: string;
  children?: NavItemData[];
};

export type NavGroupData = {
  heading?: string;
  items: NavItemData[];
};

const mockNavGroups: NavGroupData[] = [
  {
    items: [
      { id: "overview", title: "Overview", icon: LayoutDashboard },
      { id: "applications", title: "Applications", icon: Blocks },
      { id: "apikeys", title: "API Keys", icon: KeyRound },
      { id: "evaluations", title: "Evaluation Stream", icon: Activity },
    ],
  }
];

const mockBottomItems: NavItemData[] = [
  { id: "back-home", title: "Back to Home", icon: ArrowLeft },
];

const allItems = [...mockNavGroups.flatMap((g) => g.items), ...mockBottomItems];

export type CompanyApp = {
  id: string;
  name: string;
  status: string;
  apiKey: string;
};

export function UpiChevronIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="UPI">
      <polygon points="3,16 10,4 13.5,4 6.5,16" fill="#F47721" />
      <polygon points="7.5,16 14.5,4 18,4 11,16" fill="#0FA958" />
    </svg>
  );
}

export function renderRailBadge(rail: string) {
  if (rail.toUpperCase().includes("QR")) {
    return (
      <div className="inline-flex items-center gap-1.5 font-mono text-[11px] text-zinc-300">
        <div className="w-5 h-5 rounded bg-white/[0.06] border border-white/10 flex items-center justify-center shrink-0">
          <QrCode size={12} className="text-zinc-300" />
        </div>
        <span>{rail}</span>
      </div>
    );
  }
  if (rail.toUpperCase().includes("INTENT")) {
    return (
      <div className="inline-flex items-center gap-1.5 font-mono text-[11px] text-blue-300">
        <div className="w-5 h-5 rounded bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
          <Zap size={12} className="text-blue-400" />
        </div>
        <span>{rail}</span>
      </div>
    );
  }
  return (
    <div className="inline-flex items-center gap-1.5 font-mono text-[11px] text-zinc-300">
      <div className="w-5 h-5 rounded bg-white/[0.06] border border-white/10 flex items-center justify-center shrink-0">
        <UpiChevronIcon className="w-3.5 h-3.5" />
      </div>
      <span>{rail}</span>
    </div>
  );
}

// Ensure KeyRound is imported
import { KeyRound } from "lucide-react";

const DEFAULT_WORKSPACES: CompanyApp[] = [
  {
    id: "app-1",
    name: "FLOW Payments",
    status: "Connected · Demo",
    apiKey: "pp_demo_a4b9c1d2e4021",
  },
  {
    id: "app-2",
    name: "Kite Pay",
    status: "Demo",
    apiKey: "pp_demo_f8g7h6i5j8819",
  },
  {
    id: "app-3",
    name: "AceBank UPI",
    status: "Demo",
    apiKey: "pp_demo_k9l8m7n6o6203",
  },
];

type EvaluatedTransaction = {
  id: string;
  amount: string;
  rail: string;
  payee: string;
  decision: string;
  time: string;
  type: "warn" | "allow" | "step_up" | "interrupt";
  score: number;
};

const SYNTHETIC_TRANSACTIONS: EvaluatedTransaction[] = [
  {
    id: "tx-2",
    amount: "₹850",
    rail: "UPI P2P",
    payee: "neha.sharma@okhdfcbank",
    decision: "ALLOW",
    time: "14s ago",
    type: "allow",
    score: 8,
  },
  {
    id: "tx-3",
    amount: "₹3,200",
    rail: "UPI P2M QR",
    payee: "grocery_counter@ybl",
    decision: "REVIEW",
    time: "48s ago",
    type: "step_up",
    score: 74,
  },
  {
    id: "tx-4",
    amount: "₹450",
    rail: "UPI INTENT",
    payee: "zomato.order@icici",
    decision: "ALLOW",
    time: "1m ago",
    type: "allow",
    score: 4,
  },
  {
    id: "tx-5",
    amount: "₹12,000",
    rail: "UPI P2P",
    payee: "sneha.patel.456@oksbi",
    decision: "WARN",
    time: "2m ago",
    type: "warn",
    score: 86,
  },
];

function NavItem({
  item,
  activeId,
  onSelect,
}: {
  item: NavItemData;
  activeId: string;
  onSelect: (id: string) => void;
}) {
  const isActive = activeId === item.id;
  
  if (item.id === "back-home") {
    return (
      <Link href="/" className={`group flex items-center gap-2.5 px-2.5 py-[7px] rounded-[6px] cursor-pointer transition-all duration-150 select-none pressable text-white/50 hover:bg-white/5 hover:text-white`}>
         <item.icon className={`w-[16px] h-[16px] transition-colors text-white/50/70 group-hover:text-white`} strokeWidth={1.5} />
         <span className="text-[13px] tracking-wide truncate">{item.title}</span>
      </Link>
    );
  }

  return (
    <div
      className={`group flex items-center justify-between px-2.5 py-[7px] rounded-[6px] cursor-pointer transition-all duration-150 select-none pressable ${
        isActive
          ? "bg-white/10 text-white font-medium shadow-xs"
          : "text-white/50 hover:bg-white/5 hover:text-white"
      }`}
      onClick={() => onSelect(item.id)}
    >
      <div className="flex items-center gap-2.5">
        <item.icon
          className={`w-[16px] h-[16px] transition-colors ${
            isActive ? "text-white" : "text-white/50/70 group-hover:text-white"
          }`}
          strokeWidth={1.5}
        />
        <span className="text-[13px] tracking-wide truncate">{item.title}</span>
      </div>
    </div>
  );
}

export function CompanyDashboard() {
  const [isOpen, setIsOpen] = useState(true);
  const [activeId, setActiveId] = useState("overview");
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Live transaction stream state
  const [transactions, setTransactions] = useState<EvaluatedTransaction[]>(SYNTHETIC_TRANSACTIONS);
  const [isLiveActive, setIsLiveActive] = useState(true);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLiveActive) {
      interval = setInterval(async () => {
        try {
          const res = await fetch("http://localhost:8000/api/dashboard");
          if (res.ok) {
            const data = await res.json();
            if (data.recent_verifications && data.recent_verifications.length > 0) {
              const liveTxns: EvaluatedTransaction[] = data.recent_verifications.map((v: any) => ({
                id: `live-${v.id}`,
                amount: `₹${v.amount.toLocaleString()}`,
                rail: v.identifier_type === "UPI" ? "UPI P2P" : "UPI",
                payee: v.payee_name || v.identifier,
                decision: v.decision,
                time: "just now",
                type: v.decision === "WARN" ? "warn" : v.decision === "INTERRUPT" ? "interrupt" : v.decision === "REVIEW" ? "step_up" : "allow",
                score: v.risk_score,
              }));
              
              setTransactions(liveTxns.slice(0, 8));
            }
          }
        } catch (error) {
          // Silent fail to synthetic
        }
      }, 5000); // poll every 5s
    }
    return () => clearInterval(interval);
  }, [isLiveActive]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  return (
    <div className="flex h-screen bg-[#0E0E10] text-white/90 font-sans overflow-hidden selection:bg-white/20">
      <aside
        className={`relative flex flex-col bg-[#131417] border-r border-white/5 transition-all duration-300 ease-in-out shrink-0 ${
          isOpen ? "w-[260px]" : "w-0 -translate-x-full"
        }`}
      >
        <div className="h-20 flex items-center px-6 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-3">
             <div className="w-6 h-6 rounded-[5px] bg-white flex items-center justify-center shrink-0">
                <span className="font-bold text-xs text-black">P</span>
             </div>
             <span className="font-semibold text-[15px] tracking-wide text-white">PausePay Partner</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 flex flex-col">
          {mockNavGroups.map((group, i) => (
            <div key={i} className="flex flex-col gap-1">
              {group.heading && (
                <div className="px-2 mb-1 text-[10px] font-semibold tracking-wider text-white/50 uppercase">
                  {group.heading}
                </div>
              )}
              {group.items.map((item) => (
                <NavItem key={item.id} item={item} activeId={activeId} onSelect={setActiveId} />
              ))}
            </div>
          ))}
          <div className="mt-auto pt-4 flex flex-col gap-1">
            {mockBottomItems.map((item) => (
              <NavItem key={item.id} item={item} activeId={activeId} onSelect={setActiveId} />
            ))}
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden bg-[#0E0E10] relative">
        <header className="h-20 flex items-center justify-between px-8 border-b border-white/5 shrink-0 bg-[#0E0E10]/80 backdrop-blur-md z-10">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 -ml-2 rounded-md text-white/50 hover:bg-white/5 hover:text-white transition-colors"
            >
              {isOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
            </button>
            <div className="h-5 w-px bg-white/10" />
            <h1 className="text-xl font-semibold tracking-tight text-white">
              {allItems.find((i) => i.id === activeId)?.title}
            </h1>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-4xl mx-auto pb-20">
            {activeId === "overview" && (
              <div className="space-y-8 animate-fade-in">
                <div>
                  <h2 className="text-xl font-medium tracking-tight mb-2 text-white">Evaluate payment context<br/>before completion.</h2>
                  <p className="text-white/50 text-sm">
                    Combine payment context and surrounding signals before money leaves the account.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="p-5 rounded-xl border border-white/10 bg-[#15161A] flex flex-col">
                      <h3 className="text-xs font-semibold mb-2 text-white/70 tracking-wider uppercase">User Experience</h3>
                      <p className="text-[13px] text-white/50 mb-6 leading-relaxed">Context starts in communication and follows the user into payment.</p>
                      
                      <div className="flex-1 flex flex-col items-center justify-center font-mono text-xs text-white/60 space-y-2">
                         <div className="px-3 py-1.5 rounded bg-white/5 border border-white/10">Inbox</div>
                         <div className="text-white/30">↓</div>
                         <div className="px-3 py-1.5 rounded bg-white/5 border border-white/10">FLOW Payment</div>
                         <div className="text-white/30">↓</div>
                         <div className="px-3 py-1.5 rounded bg-white/5 border border-white/10">PausePay Review</div>
                         <div className="text-white/30">↓</div>
                         <div className="px-3 py-2 rounded-md bg-orange-500/10 border border-orange-500/30 text-orange-400 font-bold shadow-[0_0_15px_rgba(249,115,22,0.1)] text-center leading-snug">
                            RISK + EVIDENCE<br/>
                            <span className="text-[10px] font-normal text-orange-400/80">HIGH · 86</span>
                         </div>
                         <div className="text-white/30">↓</div>
                         <div className="px-3 py-1.5 rounded bg-white/5 border border-white/10">User Decision</div>
                      </div>
                      <Link href="/app" className="mt-6 inline-flex items-center justify-center h-9 w-full bg-white text-black text-[13px] font-medium rounded-md hover:bg-white/90 transition-colors">
                         Open mobile demo →
                      </Link>
                   </div>
                   
                   <div className="p-5 rounded-xl border border-white/10 bg-[#15161A] flex flex-col">
                      <h3 className="text-xs font-semibold mb-2 text-white/70 tracking-wider uppercase">Platform Integration</h3>
                      <p className="text-[13px] text-white/50 mb-6 leading-relaxed">Bring PausePay into an existing payment flow through the API.</p>
                      
                      <div className="flex-1 flex flex-col items-center justify-center font-mono text-xs text-white/60 space-y-2">
                         <div className="px-3 py-1.5 rounded bg-white/5 border border-white/10">Payment App</div>
                         <div className="text-blue-400/70">↓ POST /v1/risk/evaluate</div>
                         <div className="px-3 py-1.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-300">PausePay Engine</div>
                         <div className="text-emerald-400/70">↓ Risk + Evidence</div>
                         <div className="px-3 py-1.5 rounded bg-white/5 border border-white/10">Your UI</div>
                      </div>
                      <Link href="/docs" className="mt-4 inline-flex items-center justify-center h-9 w-full bg-white/10 text-white text-[13px] font-medium rounded-md hover:bg-white/15 transition-colors border border-white/10">
                         View API integration →
                      </Link>
                   </div>
                </div>

                <div className="space-y-4 pt-4">
                  <div>
                     <h3 className="text-xs font-semibold text-white/70 tracking-wider uppercase mb-1">Evaluation</h3>
                     <p className="text-[13px] text-white/50">Synthetic evaluation dataset</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02] flex flex-col">
                       <div className="text-2xl font-bold tracking-tight text-white mb-1">98%</div>
                       <div className="text-[13px] font-medium text-white/80">Scam F1</div>
                       <div className="text-xs text-white/40 mt-1 leading-snug">52-message<br/>holdout</div>
                    </div>
                    <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02] flex flex-col">
                       <div className="text-2xl font-bold tracking-tight text-white mb-1">98.1%</div>
                       <div className="text-[13px] font-medium text-white/80">Intent accuracy</div>
                    </div>
                    <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02] flex flex-col">
                       <div className="text-2xl font-bold tracking-tight text-white mb-1">~2.45 ms</div>
                       <div className="text-[13px] font-medium text-white/80">Inference latency</div>
                    </div>
                  </div>
                </div>

                <div className="pt-8 mt-8 border-t border-white/10">
                  <h3 className="text-xs font-semibold text-white/70 tracking-wider uppercase mb-6">How PausePay fits into a payment flow</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                     <div>
                        <div className="text-[10px] font-bold text-white/30 mb-2">01</div>
                        <h4 className="text-sm font-medium text-white mb-2">CONTEXT</h4>
                        <p className="text-xs text-white/50 mb-4">Message + Payment Context</p>
                        <div className="font-mono text-[11px] text-white/40 space-y-1.5 pl-3 border-l-2 border-white/10">
                           <div>├─ Message</div>
                           <div>├─ Amount</div>
                           <div>├─ Recipient</div>
                           <div>├─ Timing</div>
                           <div>├─ Ledger</div>
                           <div>└─ Behavior</div>
                        </div>
                     </div>
                     <div className="relative">
                        <div className="hidden md:block absolute top-14 -left-6 w-8 h-px bg-white/10"></div>
                        <div className="hidden md:block absolute top-14 -left-6 w-1.5 h-1.5 border-t border-r border-white/30 transform rotate-45 -translate-y-1/2 translate-x-[30px]"></div>
                        
                        <div className="text-[10px] font-bold text-white/30 mb-2">02</div>
                        <h4 className="text-sm font-medium text-white mb-2">EVALUATE</h4>
                        <p className="text-xs text-white/50 mb-4">Risk Engine analyzes context</p>
                        <div className="font-mono text-[11px] text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-6 rounded-lg flex items-center justify-center text-center shadow-[0_0_15px_rgba(59,130,246,0.1)]">
                           PausePay<br/>Engine
                        </div>
                     </div>
                     <div className="relative">
                        <div className="hidden md:block absolute top-14 -left-6 w-8 h-px bg-white/10"></div>
                        <div className="hidden md:block absolute top-14 -left-6 w-1.5 h-1.5 border-t border-r border-white/30 transform rotate-45 -translate-y-1/2 translate-x-[30px]"></div>

                        <div className="text-[10px] font-bold text-white/30 mb-2">03</div>
                        <h4 className="text-sm font-medium text-white mb-2">RESPOND</h4>
                        <p className="text-xs text-white/50 mb-4">Risk + Evidence returned to your UI</p>
                        <div className="font-mono text-[11px] text-emerald-400 space-y-1.5 pl-3 border-l-2 border-emerald-500/20">
                           <div className="text-emerald-300">Risk Assessment</div>
                           <div className="text-emerald-500/50">├─ Score</div>
                           <div className="text-emerald-500/50">├─ Risk Band</div>
                           <div className="text-emerald-500/50">├─ Action</div>
                           <div className="text-emerald-500/50">└─ Evidence</div>
                        </div>
                     </div>
                  </div>
                </div>

                <div className="pt-8 mt-8 border-t border-white/10">
                  <h3 className="text-xs font-semibold text-white/70 tracking-wider uppercase mb-6">Deterministic Scoring Formula</h3>
                  
                  <div className="p-6 rounded-xl border border-white/10 bg-[#15161A] font-mono text-sm">
                     <div className="flex flex-col gap-4 text-white/60">
                        <p className="text-white/80 text-[13px] font-sans">The Risk Engine is fully explainable. The score is a bounded sum of integer-weighted signals and mitigators. There is no black-box ML scoring—models only provide intent classification as inputs.</p>
                        
                        <div className="bg-black/50 border border-white/10 p-5 rounded-lg text-[12px] leading-relaxed text-white overflow-x-auto shadow-inner">
                           <code>
                              <span className="text-blue-400 font-bold">raw_score</span> = <span className="text-emerald-400">∑(signal_weights)</span> + <span className="text-emerald-400">∑(mitigator_weights)</span><br/><br/>
                              <span className="text-blue-400 font-bold">final_score</span> = <span className="text-orange-400 font-bold">max</span>(0, <span className="text-orange-400 font-bold">min</span>(100, raw_score))<br/><br/>
                              <span className="text-blue-400 font-bold">risk_band</span> = <br/>
                              &nbsp;&nbsp;<span className="text-emerald-400">LOW</span> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;if final_score ≤ 34<br/>
                              &nbsp;&nbsp;<span className="text-yellow-400">MEDIUM</span> &nbsp;&nbsp;if final_score ≤ 64<br/>
                              &nbsp;&nbsp;<span className="text-red-400">HIGH</span> &nbsp;&nbsp;&nbsp;&nbsp;if final_score ≥ 65
                           </code>
                        </div>
                     </div>
                  </div>
                </div>
              </div>
            )}

            {activeId === "applications" && (
              <div className="space-y-6 animate-fade-in pt-2">
                <div className="grid gap-3">
                  {DEFAULT_WORKSPACES.map((app) => (
                    <div key={app.id} className="flex items-center justify-between p-4 rounded-xl border border-white/10 bg-[#15161A]">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                          <Blocks className="w-5 h-5 text-white/70" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-white">{app.name}</div>
                          <div className="text-xs text-white/50 mt-0.5">{app.status}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <code className="text-xs font-mono text-white/50/80 px-2 py-1 rounded bg-white/5 border border-white/5">
                          {app.apiKey.slice(0, 10)}••••••••
                        </code>
                        <button className="text-xs font-medium text-white/70 hover:text-white px-3 py-1.5 rounded-md hover:bg-white/10 transition-colors">
                           Manage
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeId === "apikeys" && (
              <div className="space-y-6 animate-fade-in pt-2">
                <div className="p-5 rounded-xl border border-white/10 bg-[#15161A]">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-sm font-medium">Demo Secret Key</div>
                    <div className="text-[10px] uppercase font-bold tracking-wider text-orange-400 bg-orange-400/10 px-2 py-1 rounded">
                      Demo credential — not a production secret
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 font-mono text-sm px-3 py-2.5 rounded-md bg-black/40 border border-white/10 text-white/90">
                      pp_demo_••••••••••••••••••••••••
                    </div>
                    <button 
                       onClick={() => handleCopy("pp_demo_test_key_12345")}
                       className="h-[42px] px-4 bg-white/10 hover:bg-white/20 text-white rounded-md font-medium text-sm transition-colors flex items-center gap-2 border border-white/10"
                    >
                      {copiedText === "pp_demo_test_key_12345" ? <Check size={16} /> : <Copy size={16} />}
                      Copy
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeId === "evaluations" && (
              <div className="space-y-6 animate-fade-in pt-2">
                <div className="flex items-center justify-end">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium">
                     <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                     {transactions[0]?.id.startsWith('live-') ? 'Live demo data' : 'Synthetic demo data'}
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-[#15161A] overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/[0.02]">
                        <th className="px-4 py-3 text-[11px] font-semibold text-white/50 uppercase tracking-wider">Amount</th>
                        <th className="px-4 py-3 text-[11px] font-semibold text-white/50 uppercase tracking-wider">Rail</th>
                        <th className="px-4 py-3 text-[11px] font-semibold text-white/50 uppercase tracking-wider">Payee</th>
                        <th className="px-4 py-3 text-[11px] font-semibold text-white/50 uppercase tracking-wider">Score</th>
                        <th className="px-4 py-3 text-[11px] font-semibold text-white/50 uppercase tracking-wider">Decision</th>
                        <th className="px-4 py-3 text-[11px] font-semibold text-white/50 uppercase tracking-wider text-right">Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {transactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-4 py-3.5 whitespace-nowrap text-[13px] font-medium text-white">{tx.amount}</td>
                          <td className="px-4 py-3.5 whitespace-nowrap">{renderRailBadge(tx.rail)}</td>
                          <td className="px-4 py-3.5 whitespace-nowrap text-[13px] text-white/50 truncate max-w-[200px]">{tx.payee}</td>
                          <td className="px-4 py-3.5 whitespace-nowrap text-[13px] font-mono font-medium text-white">{tx.score}</td>
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                tx.type === "warn" ? "bg-orange-500/10 text-orange-400 border border-orange-500/20" :
                                tx.type === "interrupt" ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                                tx.type === "step_up" ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20" :
                                "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            }`}>
                              {tx.decision}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap text-[12px] text-white/50 text-right">{tx.time}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}
