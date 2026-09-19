"use client";

import { Activity, ScanSearch, ShieldCheck, Home } from "lucide-react";
import { usePathname } from "next/navigation";
import { AppTabBar, type Tab } from "@/components/phone/AppTabBar";

const tabs: Tab[] = [
  { href: "/app/pausepay", label: "Home", icon: Home },
  { href: "/app/pausepay/check", label: "Checks", icon: ScanSearch },
  { href: "/app/pausepay/activity", label: "Activity", icon: Activity },
  { href: "/app/pausepay/protection", label: "Protection", icon: ShieldCheck },
];

export default function PausePayAppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // A check's detail view is a pushed screen, not a tab destination.
  const hideTabs = /^\/app\/pausepay\/check\/.+/.test(pathname);

  return (
    <div className="flex h-full flex-col bg-[#F8F9FA]">
      <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      {!hideTabs && <AppTabBar tabs={tabs} />}
    </div>
  );
}
