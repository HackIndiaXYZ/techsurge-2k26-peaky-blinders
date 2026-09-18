import { prisma } from "@/lib/prisma";

import type {
  ContextAggregatorInput,
} from "../../../backend/risk-engine/src/context";

export async function loadContextInput(
  paymentId: string
): Promise<ContextAggregatorInput> {
  const payment =
    await prisma.transaction.findUnique({
      where: {
        id: paymentId,
      },
      include: {
        payee: true,
      },
    });

  if (!payment) {
    throw new Error(
      `Payment ${paymentId} not found`
    );
  }

  const [
    messages,
    transactions,
    ledgerEntries,
    behaviour,
  ] = await Promise.all([
    prisma.message.findMany({
      where: {
        userId: payment.userId,
      },
      orderBy: {
        timestamp: "desc",
      },
    }),

    prisma.transaction.findMany({
      where: {
        userId: payment.userId,
      },
      include: {
        payee: true,
      },
      orderBy: {
        timestamp: "desc",
      },
    }),

    prisma.ledgerEntry.findMany({
      where: {
        userId: payment.userId,
      },
      orderBy: {
        timestamp: "desc",
      },
    }),

    prisma.userBehaviour.findFirst({
      where: {
        userId: payment.userId,
      },
      orderBy: {
        recordedAt: "desc",
      },
    }),
  ]);

  if (!behaviour) {
    throw new Error(
      `Behaviour profile not found`
    );
  }

  return {
    payment: {
      id: payment.id,
      userId: payment.userId,
      payeeId: payment.payeeId,
      amount: payment.amount,
      currency: "INR",
      timestamp:
        payment.timestamp.toISOString(),
      status: payment.status as ContextAggregatorInput["payment"]["status"],
      description:
        payment.description ??
        undefined,
    },

    messages: messages.map(
      (message) => ({
        id: message.id,
        userId: message.userId,
        senderName:
          message.senderName ??
          undefined,
        senderIdentifier:
          message.senderIdentifier ??
          undefined,
        content:
          message.content,
        channel:
          message.channel as ContextAggregatorInput["messages"][number]["channel"],
        timestamp:
          message.timestamp.toISOString(),
      })
    ),

    payee: {
      id: payment.payee.id,
      name: payment.payee.name,
      upiId:
        payment.payee.upiId ??
        undefined,
      relationship:
        payment.payee.relationship as ContextAggregatorInput["payee"]["relationship"],
      isVerified:
        payment.payee.isVerified,
    },

    transactionHistory:
      transactions.map(
        (transaction) => ({
          id: transaction.id,
          amount:
            transaction.amount,
          currency: "INR",
          timestamp:
            transaction.timestamp.toISOString(),
          status:
            transaction.status as ContextAggregatorInput["transactionHistory"][number]["status"],
          payeeId:
            transaction.payeeId,
          payeeName:
            transaction.payee.name,
          payeeUpiId:
            transaction.payee.upiId ??
            undefined,
        })
      ),

    ledgerEntries:
      ledgerEntries.map(
        (entry) => ({
          id: entry.id,
          userId:
            entry.userId,
          transactionId:
            entry.transactionId ??
            undefined,
          type:
            entry.type as ContextAggregatorInput["ledgerEntries"][number]["type"],
          amount:
            entry.amount,
          currency: "INR",
          timestamp:
            entry.timestamp.toISOString(),
          counterpartyId:
            entry.counterpartyId ??
            undefined,
          description:
            entry.description ??
            undefined,
        })
      ),

    behaviour: {
      id: behaviour.id,
      userId:
        behaviour.userId,
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
  };
}
