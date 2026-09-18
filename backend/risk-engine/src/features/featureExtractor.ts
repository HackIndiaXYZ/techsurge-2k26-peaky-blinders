import type {
  PaymentContextBundle,
  RiskSignal,
  RiskMitigator,
} from "../types";

import type {
  ExtractedFeatures,
  FeatureExtractionResult,
} from "./types";

import {
  detectMistakenTransferClaim,
  detectRefundLanguage,
  detectUrgency,
  extractClaimedAmount,
  extractClaimedRecipient,
} from "./rules";

const HIGH_AMOUNT_RATIO = 3;

function normalize(value?: string): string | undefined {
  return value?.trim().toLowerCase();
}

function extractFeatures(
  context: PaymentContextBundle,
): FeatureExtractionResult {
  const signals: RiskSignal[] = [];
  const mitigators: RiskMitigator[] = [];

  const message = context.message;
  const payment = context.payment;
  const payee = context.payee;
  const payeeHistory = context.payeeHistory;
  const ledger = context.ledger;
  const timing = context.timing;
  const behaviour = context.behaviour;

  const messageText =
    (message as any)?.content ??
    message?.message?.content ??
    "";

  /*
   * ---------------------------------------------------------
   * 1. PAYMENT AMOUNT
   * ---------------------------------------------------------
   */

  const paymentAmount = payment.amount;
  const baselineAmount =
    behaviour?.behaviour?.averageTransactionAmount ??
    (behaviour as any)?.averageTransactionAmount ??
    0;

  const ratioToBaseline =
    baselineAmount > 0
      ? paymentAmount / baselineAmount
      : undefined;

  const isHighRelativeToBaseline =
    ratioToBaseline !== undefined &&
    ratioToBaseline >= HIGH_AMOUNT_RATIO;

  if (isHighRelativeToBaseline) {
    signals.push("HIGH_AMOUNT_RELATIVE_TO_BASELINE");
  }

  /*
   * ---------------------------------------------------------
   * 2. PAYEE
   * ---------------------------------------------------------
   */

  const transactionCount = payeeHistory?.transactionCount ?? 0;

  const isFirstTime =
    !payeeHistory?.established &&
    transactionCount === 0;

  if (isFirstTime) {
    signals.push("FIRST_TIME_PAYEE");
  }

  /*
   * ---------------------------------------------------------
   * 3. MESSAGE LANGUAGE
   * ---------------------------------------------------------
   */

  const isMistakenTransferClaim =
    detectMistakenTransferClaim(messageText);

  const hasUrgencyPressure =
    detectUrgency(messageText);

  const hasRefundLanguage =
    detectRefundLanguage(messageText);

  if (isMistakenTransferClaim) {
    signals.push("MISTAKEN_TRANSFER_CLAIM");
  }

  if (hasUrgencyPressure) {
    signals.push("URGENCY_PRESSURE");
  }

  if (hasRefundLanguage) {
    signals.push("REFUND_LANGUAGE");
  }

  /*
   * ---------------------------------------------------------
   * 4. PAYEE SOURCED FROM MESSAGE
   * ---------------------------------------------------------
   */

  const rawClaimedRecipient =
    (message as any)?.claimedRecipient ??
    message?.mentionedPayeeIdentifier ??
    extractClaimedRecipient(messageText);

  const claimedRecipient = normalize(rawClaimedRecipient);

  const paymentRecipient = normalize(
    (payment as any)?.payeeUpiId ??
    payee?.payee?.upiId ??
    (payee as any)?.upiId,
  );

  const payeeSourcedFromMessage =
    Boolean(claimedRecipient) &&
    Boolean(paymentRecipient) &&
    claimedRecipient === paymentRecipient;

  if (payeeSourcedFromMessage) {
    signals.push("PAYEE_SOURCED_FROM_MESSAGE");
  }

  /*
   * ---------------------------------------------------------
   * 5. COUNTERPARTY MISMATCH
   * ---------------------------------------------------------
   */

  const rawMessageSender =
    (message as any)?.senderIdentifier ??
    message?.message?.senderIdentifier;

  const messageSenderIdentifier = normalize(rawMessageSender);

  const counterpartyMismatch =
    Boolean(messageSenderIdentifier) &&
    Boolean(paymentRecipient) &&
    messageSenderIdentifier !== paymentRecipient;

  if (counterpartyMismatch) {
    signals.push("COUNTERPARTY_MISMATCH");
  }

  /*
   * ---------------------------------------------------------
   * 6. INBOUND CREDIT
   * ---------------------------------------------------------
   */

  const matchingIncomingCreditFound =
    (ledger as any)?.matchingIncomingCreditFound ??
    ledger?.hasMatchingIncomingPayment ??
    false;

  const inboundCreditUnverified =
    !matchingIncomingCreditFound;

  if (inboundCreditUnverified) {
    signals.push("INBOUND_CREDIT_UNVERIFIED");
    signals.push("NO_MATCHING_INCOMING_PAYMENT");
  }

  /*
   * ---------------------------------------------------------
   * 7. AMOUNT ECHO
   * ---------------------------------------------------------
   */

  const rawClaimedAmount =
    (message as any)?.claimedAmount ??
    message?.mentionedAmount ??
    extractClaimedAmount(messageText);

  const claimedAmount = rawClaimedAmount;

  const amountEcho =
    claimedAmount !== undefined &&
    claimedAmount === paymentAmount;

  if (amountEcho) {
    signals.push("AMOUNT_ECHO");
  }

  /*
   * ---------------------------------------------------------
   * 8. TIMING
   * ---------------------------------------------------------
   */

  const shortLatencyAfterMessage =
    timing?.isShortLatency ?? false;

  if (shortLatencyAfterMessage) {
    signals.push("SHORT_LATENCY_AFTER_MESSAGE");
  }

  /*
   * ---------------------------------------------------------
   * 9. MITIGATORS
   * ---------------------------------------------------------
   */

  if (payeeHistory?.established) {
    mitigators.push("ESTABLISHED_PAYEE");
  }

  if (matchingIncomingCreditFound) {
    mitigators.push("VERIFIED_INCOMING_PAYMENT");
  }

  if (payee?.isKnownContact || (payee?.payee?.relationship === "KNOWN_CONTACT")) {
    mitigators.push("KNOWN_CONTACT");
  }

  if (payee?.isVerifiedMerchant || (payee?.payee?.isVerified && payee?.payee?.relationship === "MERCHANT")) {
    mitigators.push("VERIFIED_MERCHANT_CONTEXT");
  }

  const features: ExtractedFeatures = {
    signals,
    mitigators,

    amount: {
      paymentAmount,
      baselineAmount,
      ratioToBaseline,
      isHighRelativeToBaseline,
    },

    payee: {
      isFirstTime,
      transactionCount,
      established: payeeHistory?.established ?? false,
      sourcedFromMessage: payeeSourcedFromMessage,
    },

    message: {
      exists: Boolean(message && (message.hasMessageContext || (message as any).content || message.message)),
      claimedAmount,
      claimedRecipient: rawClaimedRecipient,
      isMistakenTransferClaim,
      hasUrgencyPressure,
      hasRefundLanguage,
      amountEcho,
    },

    counterparty: {
      mismatch: counterpartyMismatch,
    },

    ledger: {
      matchingIncomingCreditFound,
      inboundCreditUnverified,
    },

    timing: {
      messageToPaymentSeconds:
        timing?.messageToPaymentSeconds,
      shortLatencyAfterMessage,
      unusualPaymentTime:
        timing?.isUnusualPaymentTime ?? false,
    },
  };

  return {
    features,
    signals,
    mitigators,
    context,
  };
}

export { extractFeatures };
