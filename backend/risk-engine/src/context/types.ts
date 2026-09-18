export interface ContextAggregatorInput {
  payment: {
    id: string;
    userId: string;
    payeeId: string;
    amount: number;
    currency: "INR";
    timestamp: string;
    status:
      | "PENDING"
      | "COMPLETED"
      | "FAILED"
      | "CANCELLED";
    description?: string;
  };

  messages: Array<{
    id: string;
    userId: string;
    senderName?: string;
    senderIdentifier?: string;
    content: string;
    channel:
      | "SMS"
      | "MESSAGING_APP"
      | "EMAIL"
      | "OTHER";
    timestamp: string;
  }>;

  payee: {
    id: string;
    name: string;
    upiId?: string;
    relationship:
      | "KNOWN_CONTACT"
      | "NEW_PAYEE"
      | "MERCHANT"
      | "UNKNOWN";
    isVerified: boolean;
  };

  transactionHistory: Array<{
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
  }>;

  ledgerEntries: Array<{
    id: string;
    userId: string;
    transactionId?: string;
    type: "CREDIT" | "DEBIT";
    amount: number;
    currency: "INR";
    timestamp: string;
    counterpartyId?: string;
    description?: string;
  }>;

  behaviour: {
    id: string;
    userId: string;
    recordedAt: string;
    averageTransactionAmount: number;
    averageDailyTransactionCount: number;
    typicalPaymentHour?: number;
    typicalPayeeCount: number;
    recentPaymentCount: number;
  };
}
