export type ID = string;

export type ISODateString = string;

export type Currency = "INR";

export type RiskBand = "LOW" | "MEDIUM" | "HIGH";

export type UserDecision =
  | "GO_BACK"
  | "CONTINUE_ANYWAY"
  | null;

export type PaymentStatus =
  | "PENDING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";

export type LedgerEntryType =
  | "CREDIT"
  | "DEBIT";

export type PayeeRelationship =
  | "KNOWN_CONTACT"
  | "NEW_PAYEE"
  | "MERCHANT"
  | "UNKNOWN";

export type MessageChannel =
  | "SMS"
  | "MESSAGING_APP"
  | "EMAIL"
  | "OTHER";

export type RiskSignal =
  | "FIRST_TIME_PAYEE"
  | "HIGH_AMOUNT_RELATIVE_TO_BASELINE"
  | "SHORT_LATENCY_AFTER_MESSAGE"
  | "MISTAKEN_TRANSFER_CLAIM"
  | "URGENCY_PRESSURE"
  | "REFUND_LANGUAGE"
  | "PAYEE_SOURCED_FROM_MESSAGE"
  | "COUNTERPARTY_MISMATCH"
  | "NEW_PAYEE"
  | "INBOUND_CREDIT_UNVERIFIED"
  | "AMOUNT_ECHO"
  | "NO_MATCHING_INCOMING_PAYMENT";

export type RiskMitigator =
  | "ESTABLISHED_PAYEE"
  | "VERIFIED_INCOMING_PAYMENT"
  | "KNOWN_CONTACT"
  | "RECURRING_PAYMENT_PATTERN"
  | "VERIFIED_MERCHANT_CONTEXT";
