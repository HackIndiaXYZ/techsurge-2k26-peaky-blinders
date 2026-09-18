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
