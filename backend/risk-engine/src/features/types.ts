import type {
  PaymentContextBundle,
  RiskSignal,
  RiskMitigator,
} from "../types";

export interface ExtractedFeatures {
  signals: RiskSignal[];
  mitigators: RiskMitigator[];

  amount: {
    paymentAmount: number;
    baselineAmount: number;
    ratioToBaseline?: number;
    isHighRelativeToBaseline: boolean;
  };

  payee: {
    isFirstTime: boolean;
    transactionCount: number;
    established: boolean;
    sourcedFromMessage: boolean;
  };

  message: {
    exists: boolean;
    claimedAmount?: number;
    claimedRecipient?: string;
    isMistakenTransferClaim: boolean;
    hasUrgencyPressure: boolean;
    hasRefundLanguage: boolean;
    amountEcho: boolean;
  };

  counterparty: {
    mismatch: boolean;
  };

  ledger: {
    matchingIncomingCreditFound: boolean;
    inboundCreditUnverified: boolean;
  };

  timing: {
    messageToPaymentSeconds?: number;
    shortLatencyAfterMessage: boolean;
    unusualPaymentTime: boolean;
  };
}

export interface FeatureExtractionResult {
  features: ExtractedFeatures;
  signals: RiskSignal[];
  mitigators: RiskMitigator[];
  context: PaymentContextBundle;
}
