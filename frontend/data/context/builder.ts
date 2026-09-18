import type {
  Scenario,
} from "@/data/scenarios";

import type {
  PaymentContextPackage,
} from "./types";

export function buildPaymentContext(
  scenario: Scenario
): PaymentContextPackage {
  return {
    messageId:
      `${scenario.id}:message`,

    messageText:
      scenario.message.content,

    sender: {
      name:
        scenario.message.senderName,

      identifier:
        scenario.message.senderIdentifier,
    },

    timestamp:
      scenario.message.timestamp ??
      new Date().toISOString(),

    claimedAmount:
      scenario.payment.amount,

    claimedRecipient:
      scenario.payee.upiId,

    urgency:
      detectUrgency(
        scenario.message.content
      ),
  };
}

function detectUrgency(
  message: string
): boolean {
  const urgencyTerms = [
    "immediately",
    "urgent",
    "urgently",
    "right now",
    "asap",
  ];

  const normalized =
    message.toLowerCase();

  return urgencyTerms.some(
    (term) =>
      normalized.includes(term)
  );
}
