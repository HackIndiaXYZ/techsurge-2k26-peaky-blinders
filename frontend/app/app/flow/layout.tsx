"use client";

import { CreditCard, History, Home } from "lucide-react";
import { usePathname } from "next/navigation";
import { AppTabBar, type Tab } from "@/components/phone/AppTabBar";

const tabs: Tab[] = [
  { href: "/app/flow", label: "Home", icon: Home },
  { href: "/app/flow/pay", label: "Payments", icon: CreditCard },
  { href: "/app/pausepay/activity", label: "Activity", icon: History },
];

export default function FlowAppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // The pay screen is a focused, full-height task; tabs would invite the user
  // to wander off mid-payment.
  const hideTabs = pathname === "/app/flow/pay";

  return (
    <div className="flex h-full flex-col bg-[#F8F9FA]">
      <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      {!hideTabs && <AppTabBar tabs={tabs} />}
    </div>
  );
}
