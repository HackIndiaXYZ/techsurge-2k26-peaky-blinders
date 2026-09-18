import type { RiskSignal, RiskMitigator } from "../types";

export type EvidenceDirection = "RISK" | "MITIGATOR";

export interface SignalDefinition {
  signal: RiskSignal | RiskMitigator;
  direction: EvidenceDirection;
  description: string;
  defaultWeight: number;
}
