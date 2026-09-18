import { extractFeatures } from "../src/features";
import { contextAggregator } from "../src/context";
import type { ContextAggregatorInput } from "../src/context";

// Seeded accidental-transfer scenario data
const input: ContextAggregatorInput = {
  payment: {
    id: "tx-1",
    userId: "user-1",
    payeeId: "payee-1",
    amount: 5000,
    currency: "INR",
    timestamp: "2026-09-18T10:43:00.000Z",
    status: "PENDING",
    description: "Refund",
  },
  messages: [
    {
      id: "msg-1",
      userId: "user-1",
      senderName: "Amit",
      senderIdentifier: "amit@upi",
      channel: "MESSAGING_APP",
      timestamp: "2026-09-18T10:42:00.000Z",
      content:
        "Hey, I accidentally sent ₹5,000 to you. Please return it immediately to rahul@upi.",
    },
  ],
  payee: {
    id: "payee-1",
    name: "Rahul Sharma",
    upiId: "rahul@upi",
    relationship: "NEW_PAYEE",
    isVerified: false,
  },
  transactionHistory: [],
  ledgerEntries: [],
  behaviour: {
    id: "beh-1",
    userId: "user-1",
    recordedAt: "2026-09-18T00:00:00.000Z",
    averageTransactionAmount: 850,
    averageDailyTransactionCount: 3,
    typicalPaymentHour: 19,
    typicalPayeeCount: 8,
    recentPaymentCount: 2,
  },
};

const context = contextAggregator(input);
const result = extractFeatures(context);

console.log("=== Extracted Signals ===");
console.log(JSON.stringify(result.signals, null, 2));

console.log("\n=== Extracted Features ===");
console.log(JSON.stringify(result.features, null, 2));

const expectedSignals = [
  "FIRST_TIME_PAYEE",
  "HIGH_AMOUNT_RELATIVE_TO_BASELINE",
  "SHORT_LATENCY_AFTER_MESSAGE",
  "MISTAKEN_TRANSFER_CLAIM",
  "URGENCY_PRESSURE",
  "REFUND_LANGUAGE",
  "PAYEE_SOURCED_FROM_MESSAGE",
  "COUNTERPARTY_MISMATCH",
  "INBOUND_CREDIT_UNVERIFIED",
  "AMOUNT_ECHO",
  "NO_MATCHING_INCOMING_PAYMENT",
];

const missing = expectedSignals.filter((s) => !result.signals.includes(s as any));
if (missing.length > 0) {
  console.error("Missing signals:", missing);
  process.exit(1);
} else {
  console.log("\nAll 11 expected signals successfully extracted!");
}
