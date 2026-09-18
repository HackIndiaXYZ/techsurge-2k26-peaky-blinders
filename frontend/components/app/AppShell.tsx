"use client";

import { Activity, MessageSquareText, ScanSearch, Send } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { BackendProvider, BackendStatusPill } from "./BackendStatus";

const tabs = [
  { href: "/app/messages", label: "Messages", icon: MessageSquareText },
  { href: "/app/check", label: "Check", icon: ScanSearch },
  { href: "/app/pay", label: "Pay", icon: Send },
  { href: "/app/activity", label: "Activity", icon: Activity },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <BackendProvider>
      <div className="app-stage">
        <div className="app-frame">
          <header className="app-topbar">
            <Link className="app-topbar__brand" href="/" aria-label="PausePay home">
              <span className="brand__name">PausePay</span>
              <span className="brand__descriptor">Pause before you pay</span>
            </Link>
            <div className="app-topbar__actions">
              <BackendStatusPill />
              <ThemeToggle />
            </div>
          </header>

          {children}

          <nav className="app-tabbar" aria-label="PausePay sections">
            {tabs.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link key={href} href={href} className="app-tab" aria-current={active ? "page" : undefined}>
                  <Icon size={20} strokeWidth={active ? 2.2 : 1.8} aria-hidden="true" />
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </BackendProvider>
  );
}
