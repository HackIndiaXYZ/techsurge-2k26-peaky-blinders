import { describe, expect, it } from "vitest";

import { calculateRiskScore } from "../riskScorer";

describe("Deterministic Risk Engine", () => {
  it("classifies the primary scenario as HIGH risk", () => {
    const signals = [
      "FIRST_TIME_PAYEE",
      "HIGH_AMOUNT_RELATIVE_TO_BASELINE",
      "SHORT_LATENCY_AFTER_MESSAGE",
      "MISTAKEN_TRANSFER_CLAIM",
      "URGENCY_PRESSURE",
      "REFUND_LANGUAGE",
      "PAYEE_SOURCED_FROM_MESSAGE",
      "COUNTERPARTY_MISMATCH",
      "INBOUND_CREDIT_UNVERIFIED",
      "AMOUNT_ECHO",
      "NO_MATCHING_INCOMING_PAYMENT",
    ] as const;

    const result = calculateRiskScore(
      [...signals],
      [],
    );

    expect(result.rawScore).toBe(122);
    expect(result.riskScore).toBe(100);
    expect(result.riskBand).toBe("HIGH");
  });

  it("applies mitigating evidence", () => {
    const result = calculateRiskScore(
      [
        "FIRST_TIME_PAYEE",
        "URGENCY_PRESSURE",
      ],
      [
        "KNOWN_CONTACT",
        "ESTABLISHED_PAYEE",
      ],
    );

    expect(result.rawScore).toBe(2);
    expect(result.riskScore).toBe(2);
    expect(result.riskBand).toBe("LOW");
  });

  it("never returns a score below zero", () => {
    const result = calculateRiskScore(
      [],
      [
        "KNOWN_CONTACT",
        "ESTABLISHED_PAYEE",
        "VERIFIED_INCOMING_PAYMENT",
        "RECURRING_PAYMENT_PATTERN",
        "VERIFIED_MERCHANT_CONTEXT",
      ],
    );

    expect(result.riskScore).toBe(0);
    expect(result.riskBand).toBe("LOW");
  });
});
