import type { RiskBand } from "../types";

export function getRiskBand(score: number): RiskBand {
  if (score >= 60) {
    return "HIGH";
  }

  if (score >= 30) {
    return "MEDIUM";
  }

  return "LOW";
}
