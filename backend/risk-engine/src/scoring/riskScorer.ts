import type {
  RiskMitigator,
  RiskSignal,
} from "../types";

import {
  SIGNAL_CATALOG,
} from "../signals";

import {
  RISK_WEIGHTS,
  MITIGATOR_WEIGHTS,
} from "./weights";

import {
  getRiskBand,
} from "./riskBand";

import type {
  RiskScoreResult,
  WeightedEvidence,
} from "./types";

const ENGINE_VERSION = "1.0.0";

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, score));
}

export function calculateRiskScore(
  signals: RiskSignal[],
  mitigators: RiskMitigator[],
): RiskScoreResult {
  const riskEvidence: WeightedEvidence[] = [];
  const mitigatingEvidence: WeightedEvidence[] = [];

  let rawScore = 0;

  /*
   * Risk evidence
   */
  for (const signal of signals) {
    const weight = RISK_WEIGHTS[signal];

    if (weight === undefined) {
      continue;
    }

    rawScore += weight;

    riskEvidence.push({
      signal,
      direction: "RISK",
      weight,
      contribution: weight,
      description: SIGNAL_CATALOG[signal].description,
    });
  }

  /*
   * Mitigating evidence
   */
  for (const mitigator of mitigators) {
    const weight = MITIGATOR_WEIGHTS[mitigator];

    if (weight === undefined) {
      continue;
    }

    rawScore += weight;

    mitigatingEvidence.push({
      signal: mitigator,
      direction: "MITIGATOR",
      weight,
      contribution: weight,
      description: SIGNAL_CATALOG[mitigator].description,
    });
  }

  const riskScore = clampScore(rawScore);

  return {
    rawScore,
    riskScore,
    riskBand: getRiskBand(riskScore),

    riskEvidence,
    mitigatingEvidence,

    triggeredSignals: signals,
    triggeredMitigators: mitigators,

    engineVersion: ENGINE_VERSION,
  };
}
