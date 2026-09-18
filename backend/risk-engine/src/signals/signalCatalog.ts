import type { RiskSignal, RiskMitigator } from "../types";
import type { SignalDefinition } from "./types";

export const SIGNAL_CATALOG: Record<
  RiskSignal | RiskMitigator,
  SignalDefinition
> = {
  FIRST_TIME_PAYEE: {
    signal: "FIRST_TIME_PAYEE",
    direction: "RISK",
    description: "The payment is being sent to a payee with no prior transaction history.",
    defaultWeight: 12,
  },

  HIGH_AMOUNT_RELATIVE_TO_BASELINE: {
    signal: "HIGH_AMOUNT_RELATIVE_TO_BASELINE",
    direction: "RISK",
    description: "The payment amount is substantially above the user's normal transaction baseline.",
    defaultWeight: 10,
  },

  SHORT_LATENCY_AFTER_MESSAGE: {
    signal: "SHORT_LATENCY_AFTER_MESSAGE",
    direction: "RISK",
    description: "The payment follows the relevant message within a short time window.",
    defaultWeight: 10,
  },

  MISTAKEN_TRANSFER_CLAIM: {
    signal: "MISTAKEN_TRANSFER_CLAIM",
    direction: "RISK",
    description: "The message claims that money was accidentally transferred.",
    defaultWeight: 8,
  },

  URGENCY_PRESSURE: {
    signal: "URGENCY_PRESSURE",
    direction: "RISK",
    description: "The message applies urgency or pressure to make the payment quickly.",
    defaultWeight: 10,
  },

  REFUND_LANGUAGE: {
    signal: "REFUND_LANGUAGE",
    direction: "RISK",
    description: "The message requests that money be returned or refunded.",
    defaultWeight: 5,
  },

  PAYEE_SOURCED_FROM_MESSAGE: {
    signal: "PAYEE_SOURCED_FROM_MESSAGE",
    direction: "RISK",
    description: "The payment recipient matches an identifier supplied in the message.",
    defaultWeight: 7,
  },

  COUNTERPARTY_MISMATCH: {
    signal: "COUNTERPARTY_MISMATCH",
    direction: "RISK",
    description: "The message sender and payment recipient are different counterparties.",
    defaultWeight: 20,
  },
  
  NEW_PAYEE: {
    signal: "NEW_PAYEE",
    direction: "RISK",
    description: "The payment is to a brand new payee that was just added.",
    defaultWeight: 10,
  },

  INBOUND_CREDIT_UNVERIFIED: {
    signal: "INBOUND_CREDIT_UNVERIFIED",
    direction: "RISK",
    description: "The claimed incoming payment cannot be verified in the available ledger context.",
    defaultWeight: 15,
  },

  AMOUNT_ECHO: {
    signal: "AMOUNT_ECHO",
    direction: "RISK",
    description: "The payment amount exactly matches the amount claimed in the message.",
    defaultWeight: 5,
  },

  NO_MATCHING_INCOMING_PAYMENT: {
    signal: "NO_MATCHING_INCOMING_PAYMENT",
    direction: "RISK",
    description: "No incoming ledger entry matching the claimed amount was found.",
    defaultWeight: 20,
  },

  KNOWN_CONTACT: {
    signal: "KNOWN_CONTACT",
    direction: "MITIGATOR",
    description: "The counterparty is an established known contact.",
    defaultWeight: -8,
  },

  ESTABLISHED_PAYEE: {
    signal: "ESTABLISHED_PAYEE",
    direction: "MITIGATOR",
    description: "The user has an established transaction history with the payee.",
    defaultWeight: -12,
  },

  VERIFIED_INCOMING_PAYMENT: {
    signal: "VERIFIED_INCOMING_PAYMENT",
    direction: "MITIGATOR",
    description: "A matching incoming payment was verified in the ledger.",
    defaultWeight: -20,
  },

  RECURRING_PAYMENT_PATTERN: {
    signal: "RECURRING_PAYMENT_PATTERN",
    direction: "MITIGATOR",
    description: "The payment matches an established recurring payment pattern.",
    defaultWeight: -10,
  },

  VERIFIED_MERCHANT_CONTEXT: {
    signal: "VERIFIED_MERCHANT_CONTEXT",
    direction: "MITIGATOR",
    description: "The payment occurs in a verified merchant context.",
    defaultWeight: -10,
  },
};
