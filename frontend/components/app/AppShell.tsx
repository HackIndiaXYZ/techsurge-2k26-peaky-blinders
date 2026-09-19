"use client";

import { Activity, IndianRupee, MessageSquareText, ScanSearch } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BackendProvider } from "./BackendStatus";

const tabs = [
  { href: "/app/messages", label: "Chats", match: "/app/messages", icon: MessageSquareText },
  { href: "/app/check", label: "Check", match: "/app/check", icon: ScanSearch },
  { href: "/app/pay/home", label: "Pay", match: "/app/pay", icon: IndianRupee },
  { href: "/app/activity", label: "Activity", match: "/app/activity", icon: Activity },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideTabs = /^\/app\/messages\/.+/.test(pathname) || pathname === "/app/pay";

  return (
    <BackendProvider>
      <div className="app-stage">
        <div className="app-device">
          <span className="app-hw app-hw--silent" aria-hidden="true" />
          <span className="app-hw app-hw--vol-up" aria-hidden="true" />
          <span className="app-hw app-hw--vol-down" aria-hidden="true" />
          <span className="app-hw app-hw--power" aria-hidden="true" />
          <div className="app-frame">
            <header className="app-statusbar" aria-hidden="true">
              <span className="app-statusbar__time">9:41</span>
              <span className="app-island" />
              <span className="app-statusbar__sys">
                <span className="app-sig" />
                <span className="app-wifi" />
                <span className="app-batt" />
              </span>
            </header>
            <div className="app-screen">{children}</div>
            {!hideTabs && (
              <nav className="app-tabbar" aria-label="Primary">
                {tabs.map((tab) => {
                  const current =
                    tab.match === "/app/messages"
                      ? pathname.startsWith("/app/messages")
                      : tab.match === "/app/pay"
                        ? pathname.startsWith("/app/pay")
                        : pathname.startsWith(tab.match);
                  return (
                    <Link
                      key={tab.href}
                      href={tab.href}
                      className="app-tab"
                      aria-current={current ? "page" : undefined}
                    >
                      <tab.icon size={22} strokeWidth={current ? 2.2 : 1.75} aria-hidden="true" />
                      {tab.label}
                    </Link>
                  );
                })}
              </nav>
            )}
            <div className="app-home-indicator" aria-hidden="true" />
          </div>
        </div>
      </div>
    </BackendProvider>
  );
}
