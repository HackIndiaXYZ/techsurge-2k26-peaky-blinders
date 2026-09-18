import type { Scenario } from "./types";

export const SCENARIO_ACCIDENTAL_TRANSFER: Scenario = {
  id: "SCENARIO_ACCIDENTAL_TRANSFER",

  name: "Accidental Transfer Scam",

  description:
    "A user receives a message claiming that ₹5,000 was sent accidentally and is asked to return it immediately.",

  category: "SOCIAL_ENGINEERING",

  expectedRisk: "HIGH",

  message: {
    senderName: "Amit",

    senderIdentifier: "amit@upi",

    channel: "MESSAGING_APP",
    
    timestamp: "2026-09-18T10:42:00+05:30",

    content:
      "Hey, I accidentally sent ₹5,000 to you. Please return it immediately to rahul@upi.",
  },

  payment: {
    amount: 5000,

    currency: "INR",

    description: "Refund",
  },

  payee: {
    name: "Rahul Sharma",

    upiId: "rahul@upi",

    relationship: "NEW_PAYEE",

    isVerified: false,
  },

  ledger: {
    incomingPayments: [],

    outgoingPayments: [],
  },

  behaviour: {
    averageTransactionAmount: 850,

    averageDailyTransactionCount: 3,

    typicalPaymentHour: 19,

    typicalPayeeCount: 8,

    recentPaymentCount: 2,
  },
};
