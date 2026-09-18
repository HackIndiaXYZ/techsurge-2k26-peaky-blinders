export type ScenarioId =
  | "SCENARIO_ACCIDENTAL_TRANSFER";

export type ScenarioRiskExpectation =
  | "LOW"
  | "MEDIUM"
  | "HIGH";

export interface ScenarioMessage {
  senderName: string;
  senderIdentifier?: string;
  content: string;
  channel: "SMS" | "MESSAGING_APP" | "EMAIL" | "OTHER";
  timestamp?: string;
}

export interface ScenarioPayment {
  amount: number;
  currency: "INR";
  description?: string;
}

export interface ScenarioBehaviour {
  averageTransactionAmount: number;
  averageDailyTransactionCount: number;
  typicalPaymentHour?: number;
  typicalPayeeCount: number;
  recentPaymentCount: number;
}

export interface ScenarioLedger {
  incomingPayments: Array<{
    amount: number;
    counterpartyName?: string;
  }>;

  outgoingPayments: Array<{
    amount: number;
    counterpartyName?: string;
  }>;
}

export interface ScenarioPayee {
  name: string;
  upiId: string;
  relationship:
    | "KNOWN_CONTACT"
    | "NEW_PAYEE"
    | "MERCHANT"
    | "UNKNOWN";
  isVerified: boolean;
}

export interface Scenario {
  id: ScenarioId;

  name: string;

  description: string;

  category: string;

  expectedRisk: ScenarioRiskExpectation;

  message: ScenarioMessage;

  payment: ScenarioPayment;

  payee: ScenarioPayee;

  ledger: ScenarioLedger;

  behaviour: ScenarioBehaviour;
}
