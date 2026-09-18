import type {
  PaymentContextPackage,
} from "./types";

const STORAGE_KEY =
  "pausepay:payment-context";

export function storePaymentContext(
  context: PaymentContextPackage
): void {
  if (typeof window === "undefined") {
    return;
  }

  sessionStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(context)
  );
}

export function getPaymentContext():
  | PaymentContextPackage
  | null {
  if (typeof window === "undefined") {
    return null;
  }

  const stored =
    sessionStorage.getItem(STORAGE_KEY);

  if (!stored) {
    return null;
  }

  try {
    return JSON.parse(
      stored
    ) as PaymentContextPackage;
  } catch {
    sessionStorage.removeItem(
      STORAGE_KEY
    );

    return null;
  }
}

export function clearPaymentContext(): void {
  if (typeof window === "undefined") {
    return;
  }

  sessionStorage.removeItem(
    STORAGE_KEY
  );
}
