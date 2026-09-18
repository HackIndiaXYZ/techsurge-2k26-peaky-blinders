import type {
  ID,
  ISODateString,
  PayeeRelationship,
} from "./common";

export interface Payee {
  id: ID;

  name: string;

  upiId?: string;

  relationship: PayeeRelationship;

  isVerified: boolean;

  createdAt: ISODateString;
}

export interface PayeeContext {
  payee: Payee;

  isFirstTime: boolean;

  transactionCount: number;

  lastTransactionAt?: ISODateString;

  totalHistoricalAmount: number;

  averageTransactionAmount: number;

  isKnownContact: boolean;

  isVerifiedMerchant: boolean;
}
