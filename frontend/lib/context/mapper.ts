import type {
  PaymentContextBundle,
  PaymentContext,
  PayeeContext,
  MessageContext,
  LedgerContext,
  BehaviourContext,
} from "../../../backend/risk-engine/src/types";

import type { PaymentDatabaseContext } from "./types";

export function mapDatabaseContextToDomain(
  data: PaymentDatabaseContext
): PaymentContextBundle {
  const {
    payment,
    payee,
    messages,
    ledgerEntries,
    behaviour,
  } = data;

  // ---------------------------------------------
  // Payment
  // ---------------------------------------------

  const paymentContext: PaymentContext = {
    payment: {
      id: payment.id,
      userId: payment.userId,
      payeeId: payment.payeeId,
      amount: payment.amount,
      currency: "INR",
      timestamp: payment.timestamp.toISOString(),
      status: payment.status as any,
      description: payment.description ?? undefined,
    },

    payeeId: payee.id,

    amount: payment.amount,

    currency: "INR",

    timestamp: payment.timestamp.toISOString(),

    isFirstPaymentToPayee: payee.relationship === "NEW_PAYEE",

    amountRelativeToUserBaseline:
      payment.amount / behaviour.averageTransactionAmount,

    recentTransactionCount:
      behaviour.recentPaymentCount,
  };

  // ---------------------------------------------
  // Payee
  // ---------------------------------------------

  const payeeTransactionCount = 0;

  const payeeContext: PayeeContext = {
    payee: {
      id: payee.id,
      name: payee.name,
      upiId: payee.upiId ?? undefined,
      relationship: payee.relationship as any,
      isVerified: payee.isVerified,
      createdAt: payee.createdAt.toISOString(),
    },

    isFirstTime:
      payee.relationship === "NEW_PAYEE",

    transactionCount:
      payeeTransactionCount,

    totalHistoricalAmount: 0,

    averageTransactionAmount: 0,

    isKnownContact:
      payee.relationship === "KNOWN_CONTACT",

    isVerifiedMerchant:
      payee.relationship === "MERCHANT" &&
      payee.isVerified,
  };

  // ---------------------------------------------
  // Message
  // ---------------------------------------------

  const latestMessage = [...messages]
    .sort(
      (a, b) =>
        b.timestamp.getTime() -
        a.timestamp.getTime()
    )[0];

  const messageContext: MessageContext = {
    message: latestMessage
      ? {
          id: latestMessage.id,
          userId: latestMessage.userId,
          channel: latestMessage.channel as any,
          senderName:
            latestMessage.senderName ?? undefined,
          senderIdentifier:
            latestMessage.senderIdentifier ?? undefined,
          content: latestMessage.content,
          timestamp:
            latestMessage.timestamp.toISOString(),
        }
      : undefined,

    hasMessageContext: Boolean(latestMessage),

    messageAgeSeconds: latestMessage
      ? Math.max(
          0,
          (payment.timestamp.getTime() -
            latestMessage.timestamp.getTime()) /
            1000
        )
      : undefined,

    // These are context extraction fields.
    // Actual NLP/rule extraction comes later.
    containsUrgencyLanguage: false,

    containsRefundLanguage: false,

    containsMistakenTransferClaim: false,

    mentionedAmount: undefined,

    mentionedPayeeName: undefined,

    mentionedPayeeIdentifier: undefined,
  };

  // ---------------------------------------------
  // Ledger
  // ---------------------------------------------

  const incomingEntries = ledgerEntries.filter(
    (entry) => entry.type === "CREDIT"
  );

  const matchingIncomingPayment =
    incomingEntries.find(
      (entry) =>
        entry.amount === payment.amount
    );

  const ledgerContext: LedgerContext = {
    recentEntries: ledgerEntries.map(
      (entry) => ({
        id: entry.id,
        userId: entry.userId,
        transactionId:
          entry.transactionId ?? undefined,
        type: entry.type as any,
        amount: entry.amount,
        currency: "INR",
        timestamp:
          entry.timestamp.toISOString(),
        counterpartyId:
          entry.counterpartyId ?? undefined,
        description:
          entry.description ?? undefined,
      })
    ),

    matchingIncomingPayment:
      matchingIncomingPayment
        ? {
            id: matchingIncomingPayment.id,
            userId:
              matchingIncomingPayment.userId,
            transactionId:
              matchingIncomingPayment.transactionId ??
              undefined,
            type:
              matchingIncomingPayment.type as any,
            amount:
              matchingIncomingPayment.amount,
            currency: "INR",
            timestamp:
              matchingIncomingPayment.timestamp.toISOString(),
            counterpartyId:
              matchingIncomingPayment.counterpartyId ??
              undefined,
            description:
              matchingIncomingPayment.description ??
              undefined,
          }
        : undefined,

    hasMatchingIncomingPayment:
      Boolean(matchingIncomingPayment),

    matchingAmount:
      matchingIncomingPayment?.amount,

    matchingCounterpartyId:
      matchingIncomingPayment?.counterpartyId ?? undefined,

    recentIncomingCount:
      incomingEntries.length,

    recentOutgoingCount:
      ledgerEntries.filter(
        (entry) => entry.type === "DEBIT"
      ).length,
  };

  // ---------------------------------------------
  // Behaviour
  // ---------------------------------------------

  const amountDeviation =
    behaviour.averageTransactionAmount > 0
      ? payment.amount /
        behaviour.averageTransactionAmount
      : 0;

  const behaviourContext: BehaviourContext = {
    behaviour: {
      id: behaviour.id,
      userId: behaviour.userId,
      recordedAt:
        behaviour.recordedAt.toISOString(),

      averageTransactionAmount:
        behaviour.averageTransactionAmount,

      averageDailyTransactionCount:
        behaviour.averageDailyTransactionCount,

      typicalPaymentHour:
        behaviour.typicalPaymentHour ??
        undefined,

      typicalPayeeCount:
        behaviour.typicalPayeeCount,

      recentPaymentCount:
        behaviour.recentPaymentCount,
    },

    currentAmountDeviation:
      amountDeviation,

    isUnusualAmount:
      amountDeviation >= 3,

    isUnusualTime: false,

    recentPaymentVelocity:
      behaviour.recentPaymentCount,

    isHighVelocity:
      behaviour.recentPaymentCount >= 5,
  };

  return {
    message: messageContext,
    payment: paymentContext,
    transactionHistory: [],
    payee: payeeContext,
    payeeHistory: {
      transactionCount: payeeContext.transactionCount,
      totalAmount: payeeContext.totalHistoricalAmount,
      averageAmount: payeeContext.averageTransactionAmount,
      established: !payeeContext.isFirstTime,
    },
    ledger: ledgerContext,
    behaviour: behaviourContext,
    timing: {
      paymentHour: new Date(paymentContext.timestamp).getHours(),
      isShortLatency: false,
      isUnusualPaymentTime: false,
    },
  };
}
