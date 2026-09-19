import type { IdentifierBand, RiskBand } from "./types";

/** ₹ with Indian digit grouping (₹2,50,000). */
export function formatInr(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || Number.isNaN(amount)) return "—";
  const hasPaise = Math.abs(amount - Math.round(amount)) > 1e-9;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: hasPaise ? 2 : 0,
    maximumFractionDigits: hasPaise ? 2 : 0,
  }).format(amount);
}

export function formatTime(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-IN", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" }).format(date);
}

/**
 * "2 min ago" / "8 min ago" — the timing cue the check list leans on to make
 * a request-then-payment sequence feel immediate. Falls back to a date once
 * the gap stops being interesting.
 */
export function relativeTime(iso: string | null | undefined): string {
  if (!iso) return "";
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return "";
  const seconds = Math.round((Date.now() - then.getTime()) / 1000);
  if (seconds < 0) return "just now";
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatTime(iso);
}

export const bandLabel: Record<RiskBand, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
};

export const identifierBandLabel: Record<IdentifierBand, string> = {
  UNKNOWN: "No record",
  LOW: "Seen in ordinary payments",
  SUSPICIOUS: "Suspicious",
  HIGH_RISK: "High risk",
};

/** Maps an identifier band onto the three-level visual scale. */
export function identifierBandToLevel(band: IdentifierBand): RiskBand | "none" {
  if (band === "HIGH_RISK") return "HIGH";
  if (band === "SUSPICIOUS") return "MEDIUM";
  if (band === "LOW") return "LOW";
  return "none";
}

export function displayIdentifier(identifier: string): string {
  if (identifier.startsWith("+91") && identifier.length === 13) {
    return `+91 ${identifier.slice(3, 8)} ${identifier.slice(8)}`;
  }
  return identifier;
}

export function humaniseAction(action: string | null): string {
  switch (action) {
    case "PAID":
      return "Paid";
    case "CANCELLED":
      return "Cancelled";
    case "CANCELLED_REPORTED":
      return "Cancelled & reported";
    case "CONTINUED_AFTER_WARNING":
      return "Continued after warning";
    default:
      return "No decision yet";
  }
}

export function classNames(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
