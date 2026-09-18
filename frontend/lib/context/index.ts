import {
  contextAggregator,
} from "../../../backend/risk-engine/src/context";

import {
  loadContextInput,
} from "./prismaContextLoader";

export async function buildPaymentContext(
  paymentId: string
) {
  const input =
    await loadContextInput(paymentId);

  return contextAggregator(input);
}
