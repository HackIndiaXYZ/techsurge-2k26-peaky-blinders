import type {
  BehaviourContext,
  LedgerContext,
  MessageContext,
  PayeeContext,
  PaymentContext,
  PaymentContextBundle,
  PayeeHistory,
  TimingContext,
} from "../types";

import type {
  ContextAggregatorInput,
} from "./types";

function buildPaymentContext(
  payment: ContextAggregatorInput["payment"],
  payee: ContextAggregatorInput["payee"],
  behaviour: ContextAggregatorInput["behaviour"]
): PaymentContext {
  const baseline =
    behaviour.averageTransactionAmount;

  const amountRelativeToBaseline =
    baseline > 0
      ? payment.amount / baseline
      : 0;

  return {
    payment: {
      id: payment.id,
      userId: payment.userId,
      payeeId: payment.payeeId,
      amount: payment.amount,
      currency: "INR",
      timestamp: payment.timestamp,
      status: payment.status,
      description: payment.description,
    },
    payeeId: payee.id,
    amount: payment.amount,
    currency: "INR",
    timestamp: payment.timestamp,
    isFirstPaymentToPayee:
      payee.relationship === "NEW_PAYEE",
    amountRelativeToUserBaseline:
      amountRelativeToBaseline,
    recentTransactionCount:
      behaviour.recentPaymentCount,
  };
}

function buildMessageContext(
  message:
    | ContextAggregatorInput["messages"][number]
    | undefined,
  paymentTimestamp: string
): MessageContext {
  if (!message) {
    return {
      message: undefined,
      hasMessageContext: false,
      messageAgeSeconds: undefined,
      containsUrgencyLanguage: false,
      containsRefundLanguage: false,
      containsMistakenTransferClaim: false,
      mentionedAmount: undefined,
      mentionedPayeeName: undefined,
      mentionedPayeeIdentifier: undefined,
    };
  }

  const messageTime =
    new Date(message.timestamp).getTime();

  const paymentTime =
    new Date(paymentTimestamp).getTime();

  const ageSeconds = Math.max(
    0,
    (paymentTime - messageTime) / 1000
  );

  return {
    message: {
      id: message.id,
      userId: message.userId,
      channel: message.channel,
      senderName: message.senderName,
      senderIdentifier: message.senderIdentifier,
      content: message.content,
      timestamp: message.timestamp,
    },
    hasMessageContext: true,
    messageAgeSeconds: ageSeconds,
    containsUrgencyLanguage: false,
    containsRefundLanguage: false,
    containsMistakenTransferClaim: false,
    mentionedAmount: undefined,
    mentionedPayeeName: undefined,
    mentionedPayeeIdentifier: undefined,
  };
}

function findRelevantMessage(
  messages: ContextAggregatorInput["messages"],
  paymentTimestamp: string
) {
  const paymentTime =
    new Date(paymentTimestamp).getTime();

  return messages
    .filter(
      (message) =>
        new Date(
          message.timestamp
        ).getTime() <= paymentTime
    )
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() -
        new Date(a.timestamp).getTime()
    )[0];
}

function buildPayeeContext(
  payee: ContextAggregatorInput["payee"],
  history: ContextAggregatorInput["transactionHistory"]
): PayeeContext {
  const payeeTransactions =
    history.filter(
      (transaction) =>
        transaction.payeeId === payee.id
    );

  const amounts =
    payeeTransactions.map(
      (transaction) =>
        transaction.amount
    );

  const total =
    amounts.reduce(
      (sum, amount) =>
        sum + amount,
      0
    );

  const average =
    amounts.length > 0
      ? total / amounts.length
      : 0;

  return {
    payee: {
      id: payee.id,
      name: payee.name,
      upiId: payee.upiId,
      relationship: payee.relationship,
      isVerified: payee.isVerified,
      createdAt:
        payeeTransactions[0]?.timestamp ??
        new Date().toISOString(),
    },
    isFirstTime:
      payeeTransactions.length === 0,
    transactionCount:
      payeeTransactions.length,
    totalHistoricalAmount: total,
    averageTransactionAmount: average,
    isKnownContact:
      payee.relationship === "KNOWN_CONTACT",
    isVerifiedMerchant:
      payee.relationship === "MERCHANT" &&
      payee.isVerified,
  };
}

function buildPayeeHistory(
  payeeId: string,
  history: ContextAggregatorInput["transactionHistory"]
): PayeeHistory {
  const transactions =
    history.filter(
      (transaction) =>
        transaction.payeeId === payeeId
    );

  if (transactions.length === 0) {
    return {
      transactionCount: 0,
      totalAmount: 0,
      averageAmount: 0,
      lastTransactionAt: undefined,
      firstTransactionAt: undefined,
      established: false,
    };
  }

  const amounts =
    transactions.map(
      (transaction) =>
        transaction.amount
    );

  const totalAmount =
    amounts.reduce(
      (sum, amount) =>
        sum + amount,
      0
    );

  const timestamps =
    transactions
      .map(
        (transaction) =>
          transaction.timestamp
      )
      .sort();

  return {
    transactionCount: transactions.length,
    totalAmount,
    averageAmount:
      totalAmount / transactions.length,
    lastTransactionAt: timestamps.at(-1),
    firstTransactionAt: timestamps.at(0),
    established: transactions.length > 0,
  };
}

function buildLedgerContext(
  payment: ContextAggregatorInput["payment"],
  entries: ContextAggregatorInput["ledgerEntries"]
): LedgerContext {
  const incoming =
    entries.filter(
      (entry) =>
        entry.type === "CREDIT"
    );

  const outgoing =
    entries.filter(
      (entry) =>
        entry.type === "DEBIT"
    );

  const matchingIncoming =
    incoming.find(
      (entry) =>
        entry.amount ===
        payment.amount
    );

  return {
    recentEntries: entries.map(
      (entry) => ({
        id: entry.id,
        userId: entry.userId,
        transactionId: entry.transactionId,
        type: entry.type,
        amount: entry.amount,
        currency: "INR",
        timestamp: entry.timestamp,
        counterpartyId: entry.counterpartyId,
        description: entry.description,
      })
    ),
    matchingIncomingPayment:
      matchingIncoming
        ? {
            id: matchingIncoming.id,
            userId: matchingIncoming.userId,
            transactionId: matchingIncoming.transactionId,
            type: matchingIncoming.type,
            amount: matchingIncoming.amount,
            currency: "INR",
            timestamp: matchingIncoming.timestamp,
            counterpartyId: matchingIncoming.counterpartyId,
            description: matchingIncoming.description,
          }
        : undefined,
    hasMatchingIncomingPayment:
      Boolean(matchingIncoming),
    matchingAmount: matchingIncoming?.amount,
    matchingCounterpartyId: matchingIncoming?.counterpartyId,
    recentIncomingCount: incoming.length,
    recentOutgoingCount: outgoing.length,
  };
}

function buildBehaviourContext(
  payment: ContextAggregatorInput["payment"],
  behaviour: ContextAggregatorInput["behaviour"]
): BehaviourContext {
  const baseline =
    behaviour.averageTransactionAmount;

  const deviation =
    baseline > 0
      ? payment.amount / baseline
      : 0;

  return {
    behaviour: {
      id: behaviour.id,
      userId: behaviour.userId,
      recordedAt: behaviour.recordedAt,
      averageTransactionAmount:
        behaviour.averageTransactionAmount,
      averageDailyTransactionCount:
        behaviour.averageDailyTransactionCount,
      typicalPaymentHour:
        behaviour.typicalPaymentHour,
      typicalPayeeCount:
        behaviour.typicalPayeeCount,
      recentPaymentCount:
        behaviour.recentPaymentCount,
    },
    currentAmountDeviation: deviation,
    isUnusualAmount: deviation >= 3,
    isUnusualTime: false,
    recentPaymentVelocity:
      behaviour.recentPaymentCount,
    isHighVelocity:
      behaviour.recentPaymentCount >= 5,
  };
}

function buildTimingContext(
  payment: ContextAggregatorInput["payment"],
  message:
    | ContextAggregatorInput["messages"][number]
    | undefined,
  behaviour: ContextAggregatorInput["behaviour"]
): TimingContext {
  const paymentDate =
    new Date(payment.timestamp);

  const paymentHour =
    paymentDate.getHours();

  let messageToPaymentSeconds:
    | number
    | undefined;

  if (message) {
    messageToPaymentSeconds =
      Math.max(
        0,
        (
          paymentDate.getTime() -
          new Date(
            message.timestamp
          ).getTime()
        ) / 1000
      );
  }

  const isShortLatency =
    messageToPaymentSeconds !==
      undefined &&
    messageToPaymentSeconds <= 300;

  const isUnusualPaymentTime =
    behaviour.typicalPaymentHour !==
      undefined &&
    Math.abs(
      paymentHour -
        behaviour.typicalPaymentHour
    ) >= 4;

  return {
    messageToPaymentSeconds,
    paymentHour,
    isShortLatency,
    isUnusualPaymentTime,
  };
}

export function contextAggregator(
  input: ContextAggregatorInput
): PaymentContextBundle {
  const {
    payment,
    messages,
    payee,
    transactionHistory,
    ledgerEntries,
    behaviour,
  } = input;

  const latestMessage =
    findRelevantMessage(
      messages,
      payment.timestamp
    );

  const paymentContext =
    buildPaymentContext(
      payment,
      payee,
      behaviour
    );

  const messageContext =
    buildMessageContext(
      latestMessage,
      payment.timestamp
    );

  const payeeContext =
    buildPayeeContext(
      payee,
      transactionHistory
    );

  const payeeHistory =
    buildPayeeHistory(
      payee.id,
      transactionHistory
    );

  const ledgerContext =
    buildLedgerContext(
      payment,
      ledgerEntries
    );

  const behaviourContext =
    buildBehaviourContext(
      payment,
      behaviour
    );

  const timing =
    buildTimingContext(
      payment,
      latestMessage,
      behaviour
    );

  return {
    message: messageContext,
    payment: paymentContext,
    transactionHistory,
    payee: payeeContext,
    payeeHistory,
    ledger: ledgerContext,
    behaviour: behaviourContext,
    timing,
  };
}
