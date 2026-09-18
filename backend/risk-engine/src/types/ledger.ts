import type {
  ID,
  ISODateString,
  LedgerEntryType,
  Currency,
} from "./common";

export interface LedgerEntry {
  id: ID;

  userId: ID;

  transactionId?: ID;

  type: LedgerEntryType;

  amount: number;

  currency: Currency;

  timestamp: ISODateString;

  counterpartyId?: ID;

  description?: string;
}

export interface LedgerContext {
  recentEntries: LedgerEntry[];

  matchingIncomingPayment?: LedgerEntry;

  hasMatchingIncomingPayment: boolean;

  matchingAmount?: number;

  matchingCounterpartyId?: ID;

  recentIncomingCount: number;

  recentOutgoingCount: number;
}
