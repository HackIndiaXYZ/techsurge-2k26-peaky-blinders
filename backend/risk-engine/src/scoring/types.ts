import type {
  PaymentContextBundle,
  RiskBand,
  RiskMitigator,
  RiskSignal,
} from "../types";

export interface WeightedEvidence {
  signal: RiskSignal | RiskMitigator;
  direction: "RISK" | "MITIGATOR";
  weight: number;
  contribution: number;
  description: string;
}

export interface RiskScoreResult {
  rawScore: number;
  riskScore: number;
  riskBand: RiskBand;

  riskEvidence: WeightedEvidence[];
  mitigatingEvidence: WeightedEvidence[];

  triggeredSignals: RiskSignal[];
  triggeredMitigators: RiskMitigator[];

  engineVersion: string;
}

export interface RiskEngineResult extends RiskScoreResult {
  context: PaymentContextBundle;
}
