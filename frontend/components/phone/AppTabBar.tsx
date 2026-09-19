"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";

/**
 * Per-app tab bar.
 *
 * Replaces the single shared tab bar the shell used to render. Each app owns
 * an instance, so the tabs a user sees always belong to the app they are in —
 * Inbox never shows PausePay's tabs, and vice versa.
 */

export interface Tab {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Falls back to exact-match on href when omitted. */
  match?: string;
}

interface Props {
  tabs: Tab[];
  /** Tints the active tab; defaults to the PausePay blue. */
  accentClassName?: string;
}

export function AppTabBar({ tabs, accentClassName = "text-[#1A73E8]" }: Props) {
  const pathname = usePathname();

  return (
    <nav
      className="z-20 flex shrink-0 justify-around border-t border-zinc-200/80 bg-white/94 px-2 pt-2 backdrop-blur-xl"
      aria-label="Primary"
    >
      {tabs.map((tab) => {
        const prefix = tab.match ?? tab.href;
        const current = prefix === tab.href ? pathname === tab.href : pathname.startsWith(prefix);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={current ? "page" : undefined}
            className={`flex min-w-[64px] flex-col items-center gap-1 rounded-lg py-1 transition-transform active:scale-95 ${
              current ? accentClassName : "text-zinc-400"
            }`}
          >
            <tab.icon size={21} strokeWidth={current ? 2.3 : 1.8} aria-hidden="true" />
            <span className={`text-[10px] leading-none ${current ? "font-bold" : "font-medium"}`}>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
