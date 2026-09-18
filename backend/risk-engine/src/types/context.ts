  import type { BehaviourContext } from "./behaviour";
import type { LedgerContext } from "./ledger";
import type { MessageContext } from "./message";
import type { PayeeContext } from "./payee";
import type { PaymentContext } from "./transaction";

export interface TransactionHistoryItem {
  id: string;

  amount: number;

  currency: "INR";

  timestamp: string;

  status:
    | "PENDING"
    | "COMPLETED"
    | "FAILED"
    | "CANCELLED";

  payeeId: string;

  payeeName: string;

  payeeUpiId?: string;
}

export interface PayeeHistory {
  transactionCount: number;

  totalAmount: number;

  averageAmount: number;

  lastTransactionAt?: string;

  firstTransactionAt?: string;

  established: boolean;
}

export interface TimingContext {
  messageToPaymentSeconds?: number;

  paymentHour: number;

  isShortLatency: boolean;

  isUnusualPaymentTime: boolean;
}

export interface PaymentContextBundle {
  message: MessageContext;

  payment: PaymentContext;

  transactionHistory: TransactionHistoryItem[];

  payee: PayeeContext;

  payeeHistory: PayeeHistory;

  ledger: LedgerContext;

  behaviour: BehaviourContext;

  timing: TimingContext;
}
