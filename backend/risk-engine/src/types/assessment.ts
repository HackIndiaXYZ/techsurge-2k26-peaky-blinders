import type {
  ID,
  ISODateString,
  RiskBand,
  RiskMitigator,
  RiskSignal,
  UserDecision,
} from "./common";

export interface Assessment {
  id: ID;

  paymentId: ID;

  timestamp: ISODateString;

  riskScore: number;

  riskBand: RiskBand;

  signals: RiskSignal[];

  mitigators: RiskMitigator[];

  explanation: string[];

  userDecision: UserDecision;

  outcome?: "PAYMENT_NOT_SENT" | "PAYMENT_COMPLETED_SIMULATION";

  engineVersion: string;

  processingTimeMs: number;
}
