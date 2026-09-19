"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Blocks,
  Building2,
  Calendar as CalendarIcon,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  Code2,
  Command,
  Copy,
  CreditCard,
  ExternalLink,
  Eye,
  FolderKanban,
  Globe,
  Hash,
  Inbox,
  KeyRound,
  LayoutDashboard,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Play,
  PlusCircle,
  QrCode,
  RefreshCw,
  ScanLine,
  Search,
  Settings,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Sparkles,
  Terminal,
  Users,
  Webhook,
  X,
  Zap,
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
      { id: "search", title: "Search", icon: Search, shortcut: "⌘K" },
      { id: "home", title: "Home", icon: LayoutDashboard },
      { id: "inbox", title: "Inbox", icon: Inbox, badge: 12 },
      { id: "analytics", title: "Analytics", icon: Activity },
    ],
  },
  {
    heading: "Workspace",
    items: [
      {
        id: "projects",
        title: "Projects",
        icon: FolderKanban,
        children: [
          { id: "p-active", title: "Active Apps", icon: Hash },
          { id: "p-apply", title: "Apply for Custom API", icon: Sparkles },
        ],
      },
      { id: "calendar", title: "Calendar", icon: CalendarIcon },
      {
        id: "team",
        title: "Team",
        icon: Users,
        children: [
          { id: "t-design", title: "Designers", icon: Hash },
          { id: "t-eng", title: "Engineering", icon: Hash },
          { id: "t-product", title: "Product", icon: Hash },
        ],
      },
      {
        id: "customers",
        title: "Customers",
        icon: Globe,
        children: [
          { id: "c-enterprise", title: "Enterprise", icon: Hash },
          { id: "c-smb", title: "SMB", icon: Hash },
        ],
      },
      { id: "finance", title: "Finance", icon: CreditCard },
    ],
  },
  {
    heading: "Developers",
    items: [
      { id: "api", title: "API Keys", icon: Terminal },
      { id: "webhooks", title: "Webhooks", icon: Blocks },
    ],
  },
];

const mockBottomItems: NavItemData[] = [
  { id: "settings", title: "Settings", icon: Settings, shortcut: "⌘," },
  { id: "back-home", title: "Back to Home", icon: ArrowLeft },
];

const allItems = [...mockNavGroups.flatMap((g) => g.items), ...mockBottomItems];
const flattenItems = (items: NavItemData[]): NavItemData[] => {
  return items.reduce((acc, item) => {
    acc.push(item);
    if (item.children) acc.push(...flattenItems(item.children));
    return acc;
  }, [] as NavItemData[]);
};
const flatMockData = flattenItems(allItems);

export type CompanyApp = {
  id: string;
  name: string;
  packageName: string;
  plan: string;
  status: string;
  apiKey: string;
  secretKey: string;
};

export function GoogleGLogo({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
        fill="#4285F4"
      />
      <path
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
        fill="#34A853"
      />
      <path
        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
        fill="#FBBC05"
      />
      <path
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
        fill="#EA4335"
      />
    </svg>
  );
}

export function UpiChevronIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="UPI">
      {/* Saffron/Orange Triangle */}
      <polygon points="3,16 10,4 13.5,4 6.5,16" fill="#F47721" />
      {/* Green Triangle */}
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
  // Default: UPI P2P
  return (
    <div className="inline-flex items-center gap-1.5 font-mono text-[11px] text-zinc-300">
      <div className="w-5 h-5 rounded bg-white/[0.06] border border-white/10 flex items-center justify-center shrink-0">
        <UpiChevronIcon className="w-3.5 h-3.5" />
      </div>
      <span>{rail}</span>
    </div>
  );
}

const DEFAULT_WORKSPACES: CompanyApp[] = [
  {
    id: "pausepay_admin",
    name: "PausePay Admin",
    packageName: "in.pausepay.network",
    plan: "Global Administrator",
    status: "Active",
    apiKey: "pp_live_network_master_8a9b",
    secretKey: "pp_sec_live_master_99f2b1a",
  },
  {
    id: "gpay",
    name: "Google Pay",
    packageName: "com.google.android.apps.nbu.paisa.user",
    plan: "Enterprise API",
    status: "Active",
    apiKey: "pp_live_gpay_982f1b40c21e",
    secretKey: "pp_sec_live_a8910fbc716e91",
  },
  {
    id: "phonepe",
    name: "PhonePe",
    packageName: "com.phonepe.app",
    plan: "Enterprise API",
    status: "Active",
    apiKey: "pp_live_phonepe_44a2c8901",
    secretKey: "pp_sec_live_901bca72e34a",
  },
  {
    id: "paytm",
    name: "Paytm Payments",
    packageName: "net.one97.paytm",
    plan: "Pro Sandbox",
    status: "Sandbox",
    apiKey: "pp_test_paytm_88192a01",
    secretKey: "pp_sec_test_34190fa7b82",
  },
  {
    id: "cred",
    name: "CRED Pay",
    packageName: "com.dreamplug.androidapp",
    plan: "Enterprise Sandbox",
    status: "Sandbox",
    apiKey: "pp_test_cred_61028bc9",
    secretKey: "pp_sec_test_10928fab",
  },
];

type EvaluatedTransaction = {
  id: string;
  amount: string;
  rail: string;
  payee: string;
  decision: string;
  reason: string;
  time: string;
  type: "warn" | "allow" | "step_up";
  score: number;
  signals: string[];
  latencyMs: number;
};

const INITIAL_TRANSACTIONS: EvaluatedTransaction[] = [
  {
    id: "tx-1",
    amount: "₹5,000",
    rail: "UPI P2P",
    payee: "arun.kumar.9821@okaxis",
    decision: "WARN (86/100)",
    reason: "Claimed incoming payment not found in bank statement.",
    time: "Just now",
    type: "warn",
    score: 86,
    signals: ["UNMATCHED_INCOMING_CREDIT_CLAIM", "NEW_UNVERIFIED_RECIPIENT", "PRESSURE_URGENCY_TIME_DELTA"],
    latencyMs: 14,
  },
  {
    id: "tx-2",
    amount: "₹850",
    rail: "UPI P2P",
    payee: "neha.sharma@okhdfcbank",
    decision: "ALLOW (8/100)",
    reason: "Known counterparty · Established transaction history.",
    time: "14s ago",
    type: "allow",
    score: 8,
    signals: ["KNOWN_COUNTERPARTY_HISTORY", "NORMAL_CADENCE"],
    latencyMs: 11,
  },
  {
    id: "tx-3",
    amount: "₹3,200",
    rail: "UPI P2M QR",
    payee: "grocery_counter@ybl",
    decision: "STEP-UP (74/100)",
    reason: "Scanned QR code routes to a personal account, not store terminal.",
    time: "48s ago",
    type: "step_up",
    score: 74,
    signals: ["MCC_ENTITY_MISMATCH", "PERSONAL_VPA_ON_MERCHANT_QR"],
    latencyMs: 16,
  },
  {
    id: "tx-4",
    amount: "₹450",
    rail: "UPI INTENT",
    payee: "zomato.order@icici",
    decision: "ALLOW (4/100)",
    reason: "Verified merchant terminal · Zero friction.",
    time: "1m ago",
    type: "allow",
    score: 4,
    signals: ["VERIFIED_MERCHANT_TERMINAL", "CLEAN_INTENT_TOKEN"],
    latencyMs: 9,
  },
  {
    id: "tx-5",
    amount: "₹12,000",
    rail: "UPI P2P",
    payee: "sneha.patel.456@oksbi",
    decision: "WARN (86/100)",
    reason: "Impersonation risk · Display name divergence on newly active VPA.",
    time: "2m ago",
    type: "warn",
    score: 86,
    signals: ["DISPLAY_NAME_ENTROPY", "HIGH_VALUE_FIRST_TX"],
    latencyMs: 12,
  },
  {
    id: "tx-6",
    amount: "₹1,850",
    rail: "UPI M QR",
    payee: "retail_store.9821@okaxis",
    decision: "ALLOW (12/100)",
    reason: "Verified merchant QR terminal · Match confirmed.",
    time: "4m ago",
    type: "allow",
    score: 12,
    signals: ["VERIFIED_MERCHANT_QR", "CLEAN_GEOHASH"],
    latencyMs: 10,
  },
];

function WorkspaceSwitcher({
  workspaces,
  selected,
  onSelect,
  onOpenApply,
}: {
  workspaces: CompanyApp[];
  selected: string;
  onSelect: (ws: string) => void;
  onOpenApply: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const activeApp = workspaces.find((w) => w.name === selected) || workspaces[0];

  return (
    <div className="relative">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between px-2 py-2 mb-3 rounded-lg hover:bg-white/5 cursor-pointer transition-colors select-none group pressable"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-[7px] bg-white flex items-center justify-center shadow-sm shrink-0 p-1">
            {activeApp.name === "Google Pay" ? (
              <GoogleGLogo className="w-5 h-5" />
            ) : (
              <span className="font-bold text-[13px] text-black">{activeApp.name.charAt(0)}</span>
            )}
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-[13px] font-semibold leading-none mb-1 text-white truncate max-w-[120px]">
              {activeApp.name}
            </span>
            <span className="text-[11px] text-muted-foreground leading-none">
              {activeApp.plan}
            </span>
          </div>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground/50 group-hover:text-white/70 transition-transform duration-150 shrink-0 ${
            isOpen ? "rotate-180 text-white" : ""
          }`}
          strokeWidth={1.5}
        />
      </div>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-[52px] left-0 w-full bg-[#18191c] border border-white/10 rounded-xl shadow-2xl z-50 py-1.5 flex flex-col gap-0.5 animate-dropdown-enter">
            <div className="px-3 py-1 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
              Switch Workspace
            </div>
            {workspaces.map((ws) => (
              <div
                key={ws.id}
                onClick={() => {
                  onSelect(ws.name);
                  setIsOpen(false);
                }}
                className={`px-3 py-2 mx-1 text-[13px] rounded-md cursor-pointer transition-colors flex items-center justify-between pressable ${
                  selected === ws.name
                    ? "bg-white/10 text-white font-medium"
                    : "text-foreground/80 hover:bg-white/5"
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <div className="w-5 h-5 rounded bg-white flex items-center justify-center shrink-0 p-0.5 shadow-xs">
                    {ws.name === "Google Pay" ? (
                      <GoogleGLogo className="w-3.5 h-3.5" />
                    ) : (
                      <span className="text-[11px] font-bold text-black">{ws.name.charAt(0)}</span>
                    )}
                  </div>
                  <span className="truncate">{ws.name}</span>
                </div>
                {selected === ws.name && <Check size={13} className="text-white" />}
              </div>
            ))}
            <div className="h-px bg-white/10 my-1 mx-2" />
            <div
              onClick={() => {
                setIsOpen(false);
                onOpenApply();
              }}
              className="px-3 py-2 mx-1 text-[13px] text-white hover:bg-white/10 rounded-md cursor-pointer flex items-center gap-2 transition-colors font-medium pressable"
            >
              <span className="text-[16px] leading-none mb-0.5">+</span> Apply for Custom App API
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function NavItem({
  item,
  activeId,
  onSelect,
  level = 0,
}: {
  item: NavItemData;
  activeId: string;
  onSelect: (id: string) => void;
  level?: number;
}) {
  const isActive = activeId === item.id;
  const hasChildren = !!item.children;
  const [isOpen, setIsOpen] = useState(false);

  const handleClick = () => {
    if (hasChildren) {
      setIsOpen(!isOpen);
    } else {
      onSelect(item.id);
    }
  };

  return (
    <div className="flex flex-col w-full">
      <div
        className={`group flex items-center justify-between px-2.5 py-[7px] rounded-[6px] cursor-pointer transition-all duration-150 select-none pressable ${
          isActive
            ? "bg-white/10 text-white font-medium shadow-xs"
            : "text-muted-foreground hover:bg-white/5 hover:text-white"
        }`}
        style={{ paddingLeft: `${level * 12 + 10}px` }}
        onClick={handleClick}
      >
        <div className="flex items-center gap-2.5">
          <item.icon
            className={`w-[16px] h-[16px] transition-colors ${
              isActive ? "text-white" : "text-muted-foreground/70 group-hover:text-white"
            }`}
            strokeWidth={1.5}
          />
          <span className="text-[13px] tracking-wide truncate">{item.title}</span>
        </div>

        <div className="flex items-center gap-2">
          {item.shortcut && (
            <kbd className="hidden group-hover:inline-flex items-center justify-center h-5 px-1.5 text-[10px] font-medium font-mono text-muted-foreground/60 bg-white/5 border border-white/10 rounded-[4px]">
              {item.shortcut}
            </kbd>
          )}
          {item.badge && (
            <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-medium rounded-full bg-white/10 text-white">
              {item.badge}
            </span>
          )}
          {hasChildren && (
            <ChevronRight
              className={`w-3.5 h-3.5 text-muted-foreground/50 transition-transform duration-200 ${
                isOpen ? "rotate-90 text-white" : ""
              }`}
              strokeWidth={2}
            />
          )}
        </div>
      </div>

      {hasChildren && (
        <div
          className={`grid transition-[grid-template-rows,opacity] duration-200 ease-out ${
            isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          }`}
        >
          <div className="overflow-hidden min-h-0 relative flex flex-col gap-0.5 mt-0.5">
            <div
              className="absolute top-0 bottom-0 border-l border-white/5"
              style={{ left: `${level * 12 + 17.5}px` }}
            />
            {item.children!.map((child) => (
              <NavItem
                key={child.id}
                item={child}
                activeId={activeId}
                onSelect={onSelect}
                level={level + 1}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function CompanyDashboard() {
  const [isOpen, setIsOpen] = useState(true);
  const [activeId, setActiveId] = useState("analytics");
  const [workspaces, setWorkspaces] = useState<CompanyApp[]>(DEFAULT_WORKSPACES);
  const [activeWorkspace, setActiveWorkspace] = useState("PausePay Admin");
  const [inspectedApp, setInspectedApp] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Live transaction stream state
  const [transactions, setTransactions] = useState<EvaluatedTransaction[]>(INITIAL_TRANSACTIONS);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // Application Form State
  const [appForm, setAppForm] = useState({
    companyName: "",
    appName: "",
    packageName: "",
    platform: "Android / iOS",
    monthlyVolume: "1M - 10M txns/month",
    interventionPolicy: "Advisory (Non-blocking advice)",
    webhookUrl: "",
    contactEmail: "",
  });
  const [applicationSubmitted, setApplicationSubmitted] = useState(false);
  const [createdApp, setCreatedApp] = useState<CompanyApp | null>(null);

  const activeApp = workspaces.find((w) => w.name === activeWorkspace) || workspaces[0];
  const activeItem = flatMockData.find((i) => i.id === activeId);
  const activeTitle = activeItem ? activeItem.title : "Analytics";

  const getAppStats = (appName: string) => {
    if (appName === "PausePay Admin") return { volume: "₹11,816.6 Cr", scams: "354,580", txCount: 6, growth: "↑ 22.4%" };
    if (appName === "Google Pay") return { volume: "₹4,820.5 Cr", scams: "142,890", txCount: 6, growth: "↑ 18.4%" };
    if (appName === "PhonePe") return { volume: "₹3,950.2 Cr", scams: "115,230", txCount: 5, growth: "↑ 12.1%" };
    if (appName === "Paytm Payments") return { volume: "₹2,100.8 Cr", scams: "84,010", txCount: 4, growth: "↑ 8.3%" };
    if (appName === "CRED Pay") return { volume: "₹945.1 Cr", scams: "12,450", txCount: 3, growth: "↑ 24.5%" };
    return { volume: "₹0.0 Cr", scams: "0", txCount: 0, growth: "—" };
  };
  const targetStatsName = inspectedApp || activeWorkspace;
  const activeStats = getAppStats(targetStatsName);

  // Keyboard shortcut for Command Palette (⌘K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (activeWorkspace !== "PausePay Admin") {
      const allowedIds = ["search", "api", "webhooks", "settings", "back-home", "analytics", "home"];
      if (!allowedIds.includes(activeId)) {
        setActiveId("analytics");
      }
    }
  }, [activeWorkspace, activeId]);

  const displayNavGroups = mockNavGroups.map(group => {
    if (activeWorkspace !== "PausePay Admin") {
      const allowedIds = ["search", "api", "webhooks", "analytics", "home"];
      const filteredItems = group.items.filter(item => allowedIds.includes(item.id));
      return { ...group, items: filteredItems };
    }
    return group;
  }).filter(group => group.items.length > 0);

  const handleSelect = (id: string) => {
    if (id === "analytics") {
      setInspectedApp(null);
    }
    if (id === "p-apply") {
      setApplicationSubmitted(false);
      setAppForm({
        companyName: "",
        appName: "",
        packageName: "",
        platform: "Android / iOS",
        monthlyVolume: "1M - 10M txns/month",
        interventionPolicy: "Advisory (Non-blocking advice)",
        webhookUrl: "",
        contactEmail: "",
      });
    }
    if (id === "search") {
      setIsSearchOpen(true);
      return;
    }
    if (id === "back-home") {
      window.location.href = "/";
      return;
    }
    setActiveId(id);
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleSimulateNewEvent = () => {
    setIsSimulating(true);
    setTimeout(() => {
      const isScam = Math.random() > 0.4;
      const newTx: EvaluatedTransaction = isScam
        ? {
            id: "tx-" + Date.now(),
            amount: "₹" + (Math.floor(Math.random() * 8) + 2) * 1000,
            rail: "UPI P2P",
            payee: `fast_refund_${Math.floor(Math.random() * 899 + 100)}@paytm`,
            decision: "WARN (89/100)",
            reason: "Simulated overpayment mismatch. Claimed credit not reflected in account.",
            time: "Just now",
            type: "warn",
            score: 89,
            signals: ["UNMATCHED_INCOMING_CREDIT_CLAIM", "VELOCITY_ANOMALY"],
            latencyMs: 13,
          }
        : {
            id: "tx-" + Date.now(),
            amount: "₹" + (Math.floor(Math.random() * 50) + 10) * 10,
            rail: "UPI P2M QR",
            payee: "swiggy.instant@hdfcbank",
            decision: "ALLOW (5/100)",
            reason: "Regular verified merchant checkout. Frictionless pass.",
            time: "Just now",
            type: "allow",
            score: 5,
            signals: ["VERIFIED_MERCHANT", "NORMAL_PAYMENT_CADENCE"],
            latencyMs: 10,
          };

      setTransactions([newTx, ...transactions.slice(0, 4)]);
      setIsSimulating(false);
    }, 380);
  };

  const handleApplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = "app_" + Math.random().toString(36).substring(2, 7);
    const newCompany: CompanyApp = {
      id,
      name: appForm.appName || appForm.companyName || "Custom Fintech",
      packageName: appForm.packageName || "com.custom.upi",
      plan: "Custom API Sandbox",
      status: "Active Sandbox",
      apiKey: `pp_test_${id}_${Math.random().toString(36).substring(2, 10)}`,
      secretKey: `pp_sec_test_${Math.random().toString(36).substring(2, 14)}`,
    };

    setWorkspaces([...workspaces, newCompany]);
    setCreatedApp(newCompany);
    setApplicationSubmitted(true);
  };

  return (
    /* Edge-to-edge root container covering the entire viewport */
    <div className="flex w-screen h-screen overflow-hidden bg-[#0f1012] text-[#ededed] font-sans antialiased fixed inset-0 z-50">
      {/* SIDEBAR */}
      <aside
        className={`h-full transition-all duration-200 ease-out shrink-0 overflow-hidden bg-[#16171a] border-r border-white/[0.07] ${
          isOpen ? "w-[260px] opacity-100" : "w-0 opacity-0 border-none"
        }`}
      >
        <div className="flex flex-col w-[260px] h-full p-3 font-sans">
          {/* Workspace Switcher */}
          <WorkspaceSwitcher
            workspaces={workspaces}
            selected={activeWorkspace}
            onSelect={(name) => {
              setActiveWorkspace(name);
              setInspectedApp(null);
            }}
            onOpenApply={() => {
              setActiveId("p-apply");
              setApplicationSubmitted(false);
            }}
          />

          {/* Navigation Groups */}
          <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] flex flex-col gap-4 mt-1">
            {displayNavGroups.map((group, idx) => (
              <div key={idx} className="flex flex-col gap-0.5">
                {group.heading && (
                  <span className="px-2.5 mb-1 text-[11px] font-semibold tracking-wider text-muted-foreground/50 uppercase">
                    {group.heading}
                  </span>
                )}
                {group.items.map((item) => (
                  <NavItem
                    key={item.id}
                    item={item}
                    activeId={activeId}
                    onSelect={handleSelect}
                  />
                ))}
              </div>
            ))}
          </div>

          {/* Bottom Nav Items */}
          <div className="mt-auto pt-4 border-t border-white/[0.07] flex flex-col gap-0.5">
            {mockBottomItems.map((item) => (
              <NavItem
                key={item.id}
                item={item}
                activeId={activeId}
                onSelect={handleSelect}
              />
            ))}
          </div>
        </div>
      </aside>

      {/* MAIN CANVAS AREA */}
      <div className="flex-1 bg-[#0f1012] flex flex-col min-w-0 transition-all duration-200 h-full overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-14 border-b border-white/[0.07] flex items-center px-6 justify-between bg-[#141518] shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-1.5 rounded-md text-muted-foreground hover:bg-white/5 hover:text-white transition-colors pressable"
              title={isOpen ? "Collapse Sidebar" : "Expand Sidebar"}
            >
              {isOpen ? (
                <PanelLeftClose className="w-[18px] h-[18px]" strokeWidth={1.5} />
              ) : (
                <PanelLeftOpen className="w-[18px] h-[18px]" strokeWidth={1.5} />
              )}
            </button>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="truncate">{activeWorkspace}</span>
              <span>/</span>
              <span className="font-medium text-white truncate">{activeTitle}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Command Palette Trigger */}
            <div
              onClick={() => setIsSearchOpen(true)}
              className="w-64 h-8 bg-white/[0.04] border border-white/[0.06] rounded-md hidden md:flex items-center px-3 text-xs text-muted-foreground cursor-pointer hover:bg-white/[0.07] transition-all pressable"
            >
              <Search size={14} className="mr-2 text-muted-foreground/60" />
              <span>Search API, logs, or metrics...</span>
              <kbd className="ml-auto text-[10px] font-mono px-1 py-0.5 rounded bg-white/10">⌘K</kbd>
            </div>

            {/* Apply for API Quick Action */}
            <button
              type="button"
              onClick={() => {
                setActiveId("p-apply");
                setApplicationSubmitted(false);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white text-black hover:bg-white/90 shadow-xs transition-all pressable"
            >
              <Sparkles size={13} /> Apply for API
            </button>

            {/* User Profile Avatar */}
            <div
              className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center cursor-pointer pressable overflow-hidden bg-white shadow-xs p-1"
              title={activeWorkspace}
            >
              {activeWorkspace === "Google Pay" ? (
                <GoogleGLogo className="w-4.5 h-4.5" />
              ) : (
                <span className="text-xs font-bold text-black">{activeWorkspace.charAt(0)}</span>
              )}
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="p-6 lg:p-8 flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {/* VIEW 1: ANALYTICS (EXACT VIEW MATCHING SCREENSHOT WITH EXPANDABLE ROWS) */}
          {(activeId === "analytics" || activeId === "home") && (
            <div className="max-w-6xl mx-auto space-y-5 animate-tab-enter">
              {/* Header Status Bar / Live Indicator */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)] animate-pulse" />
                  <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                    PausePay Contextual Risk Engine · Real-time Stream
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {inspectedApp && activeWorkspace === "PausePay Admin" && (
                    <button
                      onClick={() => {
                        setInspectedApp(null);
                        setActiveId("projects");
                      }}
                      className="px-2 py-1 text-[11px] font-medium bg-white/10 hover:bg-white/15 text-white rounded-md transition-all pressable mr-2"
                    >
                      &larr; Back to Projects
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleSimulateNewEvent}
                    disabled={isSimulating}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-muted-foreground hover:text-white transition-all pressable disabled:opacity-50"
                  >
                    <RefreshCw size={11} className={isSimulating ? "animate-spin" : ""} />
                    <span>Simulate Incoming Event</span>
                  </button>
                  <span className="text-xs font-mono text-muted-foreground/80 px-2 py-0.5 rounded bg-white/[0.04]">
                    Avg Latency: 14.2ms
                  </span>
                </div>
              </div>

              {/* Top 2 Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Card 1: Protected Volume */}
                <div className="h-32 bg-[#16171a] rounded-xl border border-white/[0.08] shadow-sm p-5 flex flex-col justify-between hover:border-white/15 transition-all">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="font-semibold uppercase tracking-wider text-[11px]">
                      Protected Volume ({targetStatsName === "PausePay Admin" ? "Network Total" : targetStatsName})
                    </span>
                    <CreditCard size={15} className="text-muted-foreground/60" />
                  </div>
                  <div>
                    <div className="text-2xl lg:text-3xl font-bold tracking-tight text-white">
                      {activeStats.volume}
                    </div>
                    <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
                      <span>{activeStats.growth}</span>
                      <span className="text-muted-foreground">evaluated pre-PIN transactions</span>
                    </p>
                  </div>
                </div>

                {/* Card 2: Scam Interventions */}
                <div className="h-32 bg-[#16171a] rounded-xl border border-white/[0.08] shadow-sm p-5 flex flex-col justify-between hover:border-white/15 transition-all">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="font-semibold uppercase tracking-wider text-[11px]">
                      Scam Interventions
                    </span>
                    <ShieldCheck size={15} className="text-emerald-400" />
                  </div>
                  <div>
                    <div className="text-2xl lg:text-3xl font-bold tracking-tight text-white">
                      {activeStats.scams}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1.5">
                      <span className="text-emerald-400 font-medium">99.4% precision</span>
                      <span>· Zero false declines</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Large Bottom Card with Interactive Rows */}
              <div className="w-full bg-[#16171a] rounded-xl border border-white/[0.08] shadow-sm p-5 lg:p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-semibold text-white">
                      Live Evaluated Transactions & Explanations
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Click any transaction to inspect context feature vector and signal breakdown
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveId("p-apply")}
                    className="text-xs text-white/80 hover:text-white font-medium hover:underline flex items-center gap-1 pressable"
                  >
                    Apply for Custom App API &rarr;
                  </button>
                </div>

                <div className="w-full h-[1px] bg-white/[0.07] mb-3" />

                {/* Column Headers matching mockup */}
                <div className="hidden sm:flex items-center justify-between w-full px-4 py-2.5 text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wider border-b border-white/[0.06] mb-2 select-none gap-4">
                  <div className="w-36 shrink-0">Amount · Time</div>
                  <div className="w-32 shrink-0">Payment Rail</div>
                  <div className="flex-1 min-w-0">Recipient & Context</div>
                  <div className="w-32 shrink-0 hidden md:block text-right pr-2">Risk Score</div>
                  <div className="w-28 shrink-0 text-right">Decision</div>
                  <div className="w-6 shrink-0"></div>
                </div>

                {/* The Transaction Rows */}
                <div className="flex flex-col gap-2">
                  {activeStats.txCount === 0 ? (
                    <div className="text-center py-10 text-muted-foreground text-sm border border-dashed border-white/10 rounded-xl bg-white/[0.02]">
                      No transactions evaluated yet. Ensure your API key is integrated correctly.
                    </div>
                  ) : transactions.slice(0, activeStats.txCount).map((row) => {
                    const isExpanded = expandedRowId === row.id;
                    const payeeInitial = row.payee.charAt(0).toLowerCase();
                    return (
                      <div
                        key={row.id}
                        className={`flex flex-col rounded-xl border transition-all ${
                          isExpanded
                            ? "bg-[#18191c] border-white/15 shadow-lg"
                            : "bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04] hover:border-white/12"
                        }`}
                      >
                        <div
                          onClick={() => setExpandedRowId(isExpanded ? null : row.id)}
                          className="w-full px-4 py-3 flex items-center justify-between cursor-pointer text-xs select-none gap-4 pressable group"
                        >
                          {/* Col 1: Amount & Time */}
                          <div className="flex items-center gap-3 w-36 shrink-0">
                            <span
                              className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                                row.type === "warn"
                                  ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse"
                                  : row.type === "step_up"
                                  ? "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]"
                                  : "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"
                              }`}
                            />
                            <div>
                              <div className="font-semibold text-white tracking-tight text-[13px]">
                                {row.amount}
                              </div>
                              <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                                {row.time}
                              </div>
                            </div>
                          </div>

                          {/* Col 2: Rail with Official UPI / QR Icon */}
                          <div className="w-32 shrink-0 hidden sm:flex items-center">
                            {renderRailBadge(row.rail)}
                          </div>

                          {/* Col 3: Payee VPA with Avatar Pill & Subtitle Context */}
                          <div className="flex items-center gap-3 flex-1 min-w-0 pr-2">
                            <div className="w-7 h-7 rounded-full bg-white/[0.08] border border-white/10 flex items-center justify-center text-[11px] font-bold text-white/90 shrink-0 font-mono shadow-xs">
                              {payeeInitial}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-white truncate text-xs">
                                {row.payee}
                              </div>
                              <div className="text-[11px] text-muted-foreground/70 truncate mt-0.5">
                                {row.reason}
                              </div>
                            </div>
                          </div>

                          {/* Col 4: Risk Meter & Score */}
                          <div className="w-32 shrink-0 hidden md:flex flex-col items-end pr-2 gap-1">
                            <div className="flex items-center gap-1.5 font-mono text-[11px]">
                              <span className="text-muted-foreground/70 text-[10px] uppercase font-semibold">Risk</span>
                              <span
                                className={`font-bold ${
                                  row.type === "warn"
                                    ? "text-red-400"
                                    : row.type === "step_up"
                                    ? "text-amber-300"
                                    : "text-emerald-400"
                                }`}
                              >
                                {row.score}
                              </span>
                              <span className="text-muted-foreground/40 text-[10px]">/100</span>
                            </div>
                            {/* Visual Risk Gauge Meter */}
                            <div className="w-20 h-1.5 bg-white/[0.08] rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${
                                  row.type === "warn"
                                    ? "bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.6)]"
                                    : row.type === "step_up"
                                    ? "bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.6)]"
                                    : "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]"
                                }`}
                                style={{ width: `${Math.min(100, Math.max(10, row.score))}%` }}
                              />
                            </div>
                          </div>

                          {/* Col 5: Decision / Status Badge */}
                          <div className="w-28 shrink-0 flex items-center justify-end">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide shadow-xs ${
                                row.type === "warn"
                                  ? "bg-red-500/15 text-red-400 border border-red-500/30"
                                  : row.type === "step_up"
                                  ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                                  : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                              }`}
                            >
                              {row.type === "warn" && <AlertTriangle size={11} />}
                              {row.type === "step_up" && <Clock size={11} />}
                              {row.type === "allow" && <Check size={11} />}
                              <span>{row.type === "warn" ? "WARN" : row.type === "step_up" ? "STEP-UP" : "ALLOW"}</span>
                            </span>
                          </div>

                          {/* Col 6: Expand Caret Button */}
                          <div className="w-6 shrink-0 flex items-center justify-center">
                            <div
                              className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors text-muted-foreground group-hover:text-white ${
                                isExpanded ? "text-white bg-white/10" : ""
                              }`}
                            >
                              <ChevronDown
                                size={14}
                                className={`transition-transform duration-200 ${
                                  isExpanded ? "rotate-180 text-white" : ""
                                }`}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Inline Inspection Drawer */}
                        {isExpanded && (
                          <div className="p-4 bg-black/60 border-t border-white/[0.08] text-xs space-y-3.5 animate-tab-enter">
                            {/* Explainable AI Decision Banner */}
                            <div
                              className={`p-3 rounded-lg border flex items-start gap-3 ${
                                row.type === "warn"
                                  ? "bg-red-500/10 border-red-500/25 text-red-200"
                                  : row.type === "step_up"
                                  ? "bg-amber-500/10 border-amber-500/25 text-amber-200"
                                  : "bg-emerald-500/10 border-emerald-500/25 text-emerald-200"
                              }`}
                            >
                              <div className="mt-0.5 shrink-0">
                                {row.type === "warn" ? (
                                  <ShieldAlert className="w-4 h-4 text-red-400" />
                                ) : row.type === "step_up" ? (
                                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                                ) : (
                                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                                )}
                              </div>
                              <div>
                                <div className="font-semibold text-white text-xs">
                                  {row.type === "warn"
                                    ? "High Risk Anomaly Intercepted"
                                    : row.type === "step_up"
                                    ? "Biometric or Step-Up Challenge Required"
                                    : "Transaction Verified & Cleared"}
                                </div>
                                <p className="text-[12px] opacity-90 mt-0.5 leading-relaxed">
                                  {row.reason}
                                </p>
                              </div>
                            </div>

                            {/* 4-Metric Diagnosis Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-[11px]">
                              <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                                <span className="text-muted-foreground/70 block text-[10px] uppercase font-semibold">
                                  Calibrated Risk Score
                                </span>
                                <span
                                  className={`font-mono font-bold text-sm ${
                                    row.type === "warn"
                                      ? "text-red-400"
                                      : row.type === "step_up"
                                      ? "text-amber-300"
                                      : "text-emerald-400"
                                  }`}
                                >
                                  {row.score} / 100
                                </span>
                              </div>
                              <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                                <span className="text-muted-foreground/70 block text-[10px] uppercase font-semibold">
                                  Engine Response Latency
                                </span>
                                <span className="font-mono font-bold text-white text-sm">
                                  {row.latencyMs}ms
                                </span>
                              </div>
                              <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                                <span className="text-muted-foreground/70 block text-[10px] uppercase font-semibold mb-1">
                                  Payment Rail
                                </span>
                                <div>{renderRailBadge(row.rail)}</div>
                              </div>
                              <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                                <span className="text-muted-foreground/70 block text-[10px] uppercase font-semibold">
                                  Intervention Policy
                                </span>
                                <span className="font-mono font-bold text-white text-sm">
                                  {row.type.toUpperCase()}
                                </span>
                              </div>
                            </div>

                            {/* Context Signals Cloud */}
                            <div className="space-y-1.5 pt-1">
                              <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1.5">
                                <Sparkles size={11} className="text-amber-400" />
                                <span>Real-Time Context Signals Evaluated</span>
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {row.signals.map((sig, sidx) => (
                                  <span
                                    key={sidx}
                                    className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/[0.04] border border-white/[0.08] text-white/90"
                                  >
                                    {sig}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* VIEW 2: CALENDAR VIEW */}
          {activeId === "calendar" && (
            <div className="max-w-6xl mx-auto space-y-5 animate-tab-enter">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">Risk Schedule & Compliance Audits</h2>
                  <p className="text-xs text-muted-foreground">
                    Scheduled automated compliance reports and rule evaluations for {activeWorkspace}.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveId("analytics")}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/10 text-white hover:bg-white/15 pressable"
                >
                  &larr; Switch to Analytics
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {[
                  { title: "Daily Batch Aggregation", time: "00:00 IST", status: "Automated", desc: "Aggregates counterparty frequency patterns across UPI rails." },
                  { title: "NPCI Compliance Log Export", time: "Every Sunday", status: "Active", desc: "Pre-payment scam prevention audit log generation for ombudsman." },
                  { title: "Model Threshold Sync", time: "Continuous", status: "Live", desc: "Pushes calibrated risk bands to the client-side Edge SDK." },
                ].map((item, idx) => (
                  <div key={idx} className="p-4 bg-[#16171a] rounded-xl border border-white/[0.08] space-y-2 hover:border-white/15 transition-all">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-white">{item.title}</span>
                      <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-1.5 py-0.5 rounded">{item.status}</span>
                    </div>
                    <div className="text-xs text-muted-foreground font-mono">{item.time}</div>
                    <p className="text-[11px] text-muted-foreground/80">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VIEW 3: ACTIVE APPS */}
          {(activeId === "projects" || activeId === "p-active") && (
            <div className="max-w-6xl mx-auto space-y-5 animate-tab-enter">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">Active Apps</h2>
                  <p className="text-xs text-muted-foreground">
                    Current applications using the PausePay verification layer API.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setActiveId("p-apply");
                    setApplicationSubmitted(false);
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white text-black hover:bg-white/90 pressable"
                >
                  + Add New App
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {workspaces.map((app) => (
                  <div key={app.id} className="p-5 bg-[#16171a] rounded-xl border border-white/[0.08] hover:border-white/15 transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-[8px] bg-white flex items-center justify-center p-1.5 shrink-0">
                            {app.name === "Google Pay" ? (
                              <GoogleGLogo className="w-full h-full" />
                            ) : (
                              <span className="font-bold text-black text-lg">{app.name.charAt(0)}</span>
                            )}
                          </div>
                          <div className="overflow-hidden">
                            <h3 className="font-semibold text-white truncate">{app.name}</h3>
                            <div className="text-xs text-muted-foreground font-mono mt-0.5 truncate">{app.packageName}</div>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2 mt-4 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Status</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${app.status.includes("Active") ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"}`}>
                            {app.status.toUpperCase()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Plan</span>
                          <span className="text-white font-medium">{app.plan}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">API Key</span>
                          <code className="text-white font-mono bg-white/[0.04] px-1.5 py-0.5 rounded truncate max-w-[120px]">
                            {app.apiKey}
                          </code>
                        </div>
                      </div>
                    </div>
                    <div className="mt-5 pt-4 border-t border-white/[0.06] flex gap-2">
                      <button onClick={() => { setInspectedApp(app.name); setActiveId("analytics"); }} className="flex-1 py-2 text-xs font-semibold bg-white/10 hover:bg-white/15 text-white rounded-lg pressable transition-colors">
                        View Analytics
                      </button>
                      <button onClick={() => { setActiveWorkspace(app.name); setActiveId("api"); }} className="flex-1 py-2 text-xs font-semibold bg-white/5 hover:bg-white/10 text-white rounded-lg pressable transition-colors">
                        Manage Keys
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VIEW 4: APPLY FOR CUSTOM API */}
          {activeId === "p-apply" && (
            <div className="max-w-3xl mx-auto space-y-5 animate-tab-enter">
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-white">
                  Apply for Custom App PausePay API
                </h2>
                <p className="text-xs text-muted-foreground">
                  Register your UPI application, bank app, or neo-banking wallet to receive dedicated sandbox and production credentials.
                </p>
              </div>

              {!applicationSubmitted ? (
                <form
                  onSubmit={handleApplySubmit}
                  className="bg-[#16171a] p-6 rounded-xl border border-white/[0.08] shadow-sm space-y-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1.5">
                      <label className="text-muted-foreground font-medium">Company Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Google India Digital Services Pvt Ltd"
                        value={appForm.companyName}
                        onChange={(e) => setAppForm({ ...appForm, companyName: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white placeholder:text-muted-foreground/40 text-xs focus:outline-hidden focus:ring-1 focus:ring-white/30"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-muted-foreground font-medium">Payment App Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Google Pay (GPay)"
                        value={appForm.appName}
                        onChange={(e) => setAppForm({ ...appForm, appName: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white placeholder:text-muted-foreground/40 text-xs focus:outline-hidden focus:ring-1 focus:ring-white/30"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-muted-foreground font-medium">Package / Bundle ID</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. com.google.android.apps.nbu.paisa.user"
                        value={appForm.packageName}
                        onChange={(e) => setAppForm({ ...appForm, packageName: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white placeholder:text-muted-foreground/40 text-xs font-mono focus:outline-hidden focus:ring-1 focus:ring-white/30"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-muted-foreground font-medium">Developer Contact Email</label>
                      <input
                        type="email"
                        required
                        placeholder="upi-security@google.com"
                        value={appForm.contactEmail}
                        onChange={(e) => setAppForm({ ...appForm, contactEmail: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white placeholder:text-muted-foreground/40 text-xs focus:outline-hidden focus:ring-1 focus:ring-white/30"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2 border-t border-white/[0.07]">
                    <div className="space-y-1.5">
                      <label className="text-muted-foreground font-medium">Monthly UPI Volume</label>
                      <select
                        value={appForm.monthlyVolume}
                        onChange={(e) => setAppForm({ ...appForm, monthlyVolume: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white text-xs focus:outline-hidden focus:ring-1 focus:ring-white/30"
                      >
                        <option>Startup / Pilot (&lt; 100K txns/month)</option>
                        <option>Growth Tier (100K - 1M txns/month)</option>
                        <option>Scale Tier (1M - 10M txns/month)</option>
                        <option>Enterprise Rail (10M+ txns/month)</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-muted-foreground font-medium">Integration Mode</label>
                      <select
                        value={appForm.interventionPolicy}
                        onChange={(e) => setAppForm({ ...appForm, interventionPolicy: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white text-xs focus:outline-hidden focus:ring-1 focus:ring-white/30"
                      >
                        <option>Advisory (Non-blocking advice)</option>
                        <option>PausePay Native Bottom Sheet</option>
                        <option>Step-Up Cooling (60s timer on high risk)</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs pt-2 border-t border-white/[0.07]">
                    <label className="text-muted-foreground font-medium">Webhook URL for Alert Callbacks</label>
                    <input
                      type="url"
                      placeholder="https://api.pay.google.com/v1/pausepay-alerts"
                      value={appForm.webhookUrl}
                      onChange={(e) => setAppForm({ ...appForm, webhookUrl: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white placeholder:text-muted-foreground/40 text-xs font-mono focus:outline-hidden focus:ring-1 focus:ring-white/30"
                    />
                  </div>

                  <div className="pt-3 border-t border-white/[0.07] flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground">
                      Instant Sandbox Provisioning · Sub-25ms response time
                    </span>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-lg text-xs font-semibold bg-white text-black hover:bg-white/90 shadow-sm transition-all pressable"
                    >
                      Generate API Keys
                    </button>
                  </div>
                </form>
              ) : (
                /* Success Screen */
                <div className="bg-[#16171a] p-6 rounded-xl border border-emerald-500/30 shadow-sm space-y-4 animate-tab-enter">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                      <Check size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">
                        API Credentials Provisioned for {createdApp?.name}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Your custom app is now active in the workspace switcher above.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 text-xs bg-black/40 p-4 rounded-lg border border-white/[0.06]">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[10px] uppercase font-bold text-muted-foreground">
                          Sandbox Publishable Key
                        </div>
                        <code className="text-xs font-mono text-white font-semibold">
                          {createdApp?.apiKey}
                        </code>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(createdApp?.apiKey || "", "app_pk")}
                        className="p-1.5 rounded hover:bg-white/10 text-muted-foreground hover:text-white pressable"
                      >
                        {copiedText === "app_pk" ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                      </button>
                    </div>

                    <div className="h-px bg-white/[0.06]" />

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[10px] uppercase font-bold text-muted-foreground">
                          Sandbox Secret Key
                        </div>
                        <code className="text-xs font-mono text-white font-semibold">
                          {createdApp?.secretKey}
                        </code>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(createdApp?.secretKey || "", "app_sk")}
                        className="p-1.5 rounded hover:bg-white/10 text-muted-foreground hover:text-white pressable"
                      >
                        {copiedText === "app_sk" ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setInspectedApp(createdApp?.name || null);
                        setActiveId("analytics");
                      }}
                      className="px-4 py-2 rounded-lg text-xs font-semibold bg-white text-black hover:bg-white/90 shadow-sm pressable"
                    >
                      View in Analytics Stream
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveWorkspace(createdApp?.name || "");
                        setActiveId("api");
                      }}
                      className="px-4 py-2 rounded-lg text-xs font-semibold bg-white/10 text-white hover:bg-white/15 pressable"
                    >
                      API Documentation
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* VIEW 4: API KEYS */}
          {activeId === "api" && (
            <div className="max-w-3xl mx-auto space-y-5 animate-tab-enter">
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-white">API Credentials & Endpoints</h2>
                <p className="text-xs text-muted-foreground">
                  Authenticate context requests for {activeWorkspace}.
                </p>
              </div>

              <div className="bg-[#16171a] p-5 rounded-xl border border-white/[0.08] space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-white">Publishable API Key (Client SDK)</div>
                    <div className="text-[11px] text-muted-foreground">Safe for mobile app builds</div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/10 text-white">
                    PUBLIC
                  </span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-black/40 border border-white/10">
                  <code className="font-mono text-white text-xs">{activeApp.apiKey}</code>
                  <button
                    type="button"
                    onClick={() => handleCopy(activeApp.apiKey, "pk_active")}
                    className="p-1 rounded text-muted-foreground hover:text-white pressable"
                  >
                    {copiedText === "pk_active" ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>

              <div className="bg-[#16171a] p-5 rounded-xl border border-white/[0.08] space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-white">Secret API Key (Server-to-Server)</div>
                    <div className="text-[11px] text-muted-foreground">Keep confidential</div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300">
                    SECRET
                  </span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-black/40 border border-white/10">
                  <code className="font-mono text-white text-xs">{activeApp.secretKey}</code>
                  <button
                    type="button"
                    onClick={() => handleCopy(activeApp.secretKey, "sk_active")}
                    className="p-1 rounded text-muted-foreground hover:text-white pressable"
                  >
                    {copiedText === "sk_active" ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>

              <div className="bg-[#16171a] p-5 rounded-xl border border-white/[0.08] space-y-3 text-xs">
                <div className="font-semibold text-white">cURL Quickstart Request</div>
                <pre className="p-3 bg-black/40 rounded-lg border border-white/10 text-[11px] font-mono text-white/90 overflow-x-auto leading-relaxed">
{`curl -X POST https://api.pausepay.in/v2/evaluate/context \\
  -H "Authorization: Bearer ${activeApp.apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 5000,
    "payee_vpa": "arun@okaxis",
    "payee_is_new": true,
    "claimed_incoming_message_present": true,
    "incoming_bank_credit_verified": false
  }'`}
                </pre>
              </div>
            </div>
          )}

          {/* VIEW 5: WEBHOOKS */}
          {activeId === "webhooks" && (
            <div className="max-w-3xl mx-auto space-y-5 animate-tab-enter">
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-white">Webhook Endpoints</h2>
                <p className="text-xs text-muted-foreground">
                  Receive immediate notifications when high-risk social engineering scams are triggered.
                </p>
              </div>

              <div className="bg-[#16171a] p-5 rounded-xl border border-white/[0.08] space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="text-muted-foreground font-medium">Active Webhook Callback URL</label>
                  <input
                    type="url"
                    readOnly
                    value="https://api.yourcompany.com/v1/pausepay-alerts"
                    className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white font-mono text-xs"
                  />
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-emerald-400 font-medium">● 200 OK · 100% Delivery SLA</span>
                  <button
                    type="button"
                    onClick={() => alert("Test scam alert webhook dispatched!")}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white text-black hover:bg-white/90 pressable"
                  >
                    Send Test Alert
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 6: INBOX, TEAM, CUSTOMERS, FINANCE, SETTINGS */}
          {(activeId === "inbox" || activeId === "team" || activeId === "customers" || activeId === "finance" || activeId === "settings") && (
            <div className="max-w-3xl mx-auto py-10 text-center space-y-3 animate-tab-enter">
              <h3 className="text-lg font-semibold text-white capitalize">{activeId} View</h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Configured for {activeWorkspace}. Switch to{" "}
                <button
                  onClick={() => setActiveId("analytics")}
                  className="text-white underline hover:opacity-80"
                >
                  Analytics
                </button>{" "}
                to see live evaluations or{" "}
                <button
                  onClick={() => setActiveId("p-apply")}
                  className="text-white underline hover:opacity-80"
                >
                  Apply for Custom API
                </button>{" "}
                to enroll a new app.
              </p>
            </div>
          )}
        </main>
      </div>

      {/* SEARCH COMMAND PALETTE (⌘K Modal with Search Filtering) */}
      {isSearchOpen && (
        <div className="absolute inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/70 backdrop-blur-sm px-4">
          <div className="absolute inset-0" onClick={() => setIsSearchOpen(false)} />
          <div className="relative w-full max-w-xl bg-[#16171a] border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-modal-enter">
            <div className="flex items-center px-4 border-b border-white/10">
              <Search className="w-[18px] h-[18px] text-muted-foreground/70 mr-3 shrink-0" strokeWidth={1.5} />
              <input
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent py-4 outline-none text-[14px] text-white placeholder:text-muted-foreground/50"
                placeholder="Search projects, API keys, or actions..."
              />
              <kbd
                onClick={() => setIsSearchOpen(false)}
                className="hidden sm:inline-flex items-center justify-center h-5 px-1.5 ml-2 text-[10px] font-medium font-mono text-muted-foreground/70 bg-white/10 rounded-[4px] cursor-pointer hover:text-white"
              >
                ESC
              </kbd>
              <button
                onClick={() => setIsSearchOpen(false)}
                className="ml-3 p-1 rounded-md text-muted-foreground/70 hover:text-white transition-colors"
              >
                <X className="w-[18px] h-[18px]" strokeWidth={1.5} />
              </button>
            </div>

            <div className="p-2 max-h-64 overflow-y-auto space-y-1">
              {[
                { title: "View Live Analytics Stream", tab: "analytics", icon: Activity },
                { title: "Apply for Custom App API", tab: "p-apply", icon: Sparkles },
                { title: "Inspect API Credentials", tab: "api", icon: Terminal },
                { title: "Configure Webhook Alerts", tab: "webhooks", icon: Blocks },
                { title: "Switch to Google Pay (GPay)", ws: "Google Pay", icon: Building2 },
                { title: "Switch to PhonePe", ws: "PhonePe", icon: Building2 },
              ]
                .filter((cmd) => cmd.title.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((cmd, cidx) => {
                  const Icon = cmd.icon;
                  return (
                    <div
                      key={cidx}
                      onClick={() => {
                        if (cmd.tab) setActiveId(cmd.tab);
                        if (cmd.ws) setActiveWorkspace(cmd.ws);
                        setIsSearchOpen(false);
                      }}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-foreground/80 hover:bg-white/5 hover:text-white cursor-pointer transition-colors pressable"
                    >
                      <Icon size={14} className="text-muted-foreground" />
                      <span>{cmd.title}</span>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
