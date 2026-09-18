const URGENCY_PATTERNS = [
  "immediately",
  "urgent",
  "urgently",
  "right now",
  "asap",
  "quickly",
  "please return",
];

const REFUND_PATTERNS = [
  "refund",
  "return the money",
  "return it",
  "send it back",
  "pay it back",
];

const MISTAKEN_TRANSFER_PATTERNS = [
  "accidentally sent",
  "accidentally transferred",
  "sent by mistake",
  "transferred by mistake",
  "wrongly sent",
  "wrong transfer",
];

export function containsAny(text: string, patterns: string[]): boolean {
  const normalized = text.toLowerCase();

  return patterns.some((pattern) =>
    normalized.includes(pattern.toLowerCase()),
  );
}

export function detectUrgency(text: string): boolean {
  return containsAny(text, URGENCY_PATTERNS);
}

export function detectRefundLanguage(text: string): boolean {
  return containsAny(text, REFUND_PATTERNS);
}

export function detectMistakenTransferClaim(text: string): boolean {
  return containsAny(text, MISTAKEN_TRANSFER_PATTERNS);
}

export function extractClaimedAmount(text: string): number | undefined {
  const match = text.match(/(?:₹|rs\.?|inr)\s*([\d,]+)/i);
  if (!match) return undefined;
  const num = parseFloat(match[1].replace(/,/g, ""));
  return isNaN(num) ? undefined : num;
}

export function extractClaimedRecipient(text: string): string | undefined {
  const match = text.match(/[a-zA-Z0-9.\-_]+@[a-zA-Z0-9]+/);
  return match ? match[0] : undefined;
}
