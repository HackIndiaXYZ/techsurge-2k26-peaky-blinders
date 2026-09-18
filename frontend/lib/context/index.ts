import {
  getPaymentDatabaseContext,
} from "./aggregator";

import {
  mapDatabaseContextToDomain,
} from "./mapper";

import type {
  PaymentContextBundle,
} from "../../../backend/risk-engine/src/types";

export async function buildPaymentContext(
  paymentId: string
): Promise<PaymentContextBundle> {
  const databaseContext =
    await getPaymentDatabaseContext(paymentId);

  return mapDatabaseContextToDomain(
    databaseContext
  );
}
