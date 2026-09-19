/**
 * Home-screen app icons for the simulated phone.
 *
 * Three apps make up the demo: Inbox is where the social-engineering context
 * arrives, FLOW is where the payment is made, and PausePay is the safety layer
 * that connects the two. Each icon is a squircle tile plus a glyph; the
 * PausePay tile carries the real mark so the brand is recognisable from the
 * home screen onwards.
 */

import Link from "next/link";
import { PausePayMark } from "@/components/brand/PausePayMark";

export type AppId = "inbox" | "flow" | "pausepay";

/** iOS-style superellipse approximation — a plain rounded rect reads too soft. */
const SQUIRCLE = "22.37%";

const TILE: Record<AppId, { label: string; href: string; className: string }> = {
  inbox: {
    label: "Inbox",
    href: "/app/inbox",
    className: "bg-[linear-gradient(160deg,#5BD95B_0%,#22B14C_100%)]",
  },
  flow: {
    label: "FLOW",
    href: "/app/flow",
    className: "bg-[linear-gradient(160deg,#3B8BFF_0%,#1A56DB_100%)]",
  },
  pausepay: {
    label: "PausePay",
    href: "/app/pausepay",
    className: "bg-white ring-1 ring-black/5",
  },
};

function Glyph({ app, size }: { app: AppId; size: number }) {
  if (app === "pausepay") return <PausePayMark size={size * 0.56} decorative />;

  if (app === "inbox") {
    return (
      <svg viewBox="0 0 32 32" fill="none" style={{ width: size * 0.54, height: size * 0.54 }}>
        <path
          d="M16 5C9.4 5 4 9.5 4 15c0 3.1 1.7 5.9 4.4 7.7-.2 1.6-.9 3.2-2 4.5 2.3-.3 4.4-1.2 6.1-2.4 1.1.3 2.3.4 3.5.4 6.6 0 12-4.5 12-10S22.6 5 16 5z"
          fill="#fff"
        />
      </svg>
    );
  }

  // FLOW — a rupee mark, the clearest signal that this is the payment app.
  return (
    <svg viewBox="0 0 32 32" fill="none" style={{ width: size * 0.5, height: size * 0.5 }}>
      <path
        d="M9 6h14M9 12h14M18.5 6c3.6 0 5.5 2.4 5.5 5.2 0 3.4-2.6 5.6-6.6 5.6H9l9.8 9.2"
        stroke="#fff"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface Props {
  app: AppId;
  size?: number;
  /** Home screen shows the label; the dock does not. */
  showLabel?: boolean;
}

export function AppIcon({ app, size = 60, showLabel = true }: Props) {
  const tile = TILE[app];

  return (
    <Link
      href={tile.href}
      className="group flex w-[72px] flex-col items-center gap-1.5 outline-none"
      aria-label={`Open ${tile.label}`}
    >
      <span
        className={`grid place-items-center shadow-[0_2px_8px_rgba(15,23,42,0.18)] transition-transform duration-150 group-active:scale-90 group-focus-visible:ring-2 group-focus-visible:ring-white ${tile.className}`}
        style={{ width: size, height: size, borderRadius: SQUIRCLE }}
      >
        <Glyph app={app} size={size} />
      </span>
      {showLabel && (
        <span className="text-[11px] font-medium leading-tight text-zinc-700 drop-shadow-[0_1px_2px_rgba(255,255,255,0.8)]">
          {tile.label}
        </span>
      )}
    </Link>
  );
}
