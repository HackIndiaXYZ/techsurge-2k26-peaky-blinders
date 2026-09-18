import type {
  Currency,
  ID,
  ISODateString,
  PaymentStatus,
} from "./common";

export interface Transaction {
  id: ID;

  userId: ID;

  payeeId: ID;

  amount: number;

  currency: Currency;

  timestamp: ISODateString;

  status: PaymentStatus;

  description?: string;
}

export interface PaymentContext {
  payment: Transaction;

  payeeId: ID;

  amount: number;

  currency: Currency;

  timestamp: ISODateString;

  isFirstPaymentToPayee: boolean;

  amountRelativeToUserBaseline: number;

  recentTransactionCount: number;
}
