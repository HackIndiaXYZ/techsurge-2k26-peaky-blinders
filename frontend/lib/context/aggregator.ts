import { prisma } from "@/lib/prisma";

import type {
  PaymentDatabaseContext,
} from "./types";

export async function getPaymentDatabaseContext(
  paymentId: string
): Promise<PaymentDatabaseContext> {
  const payment =
    await prisma.transaction.findUnique({
      where: {
        id: paymentId,
      },
    });

  if (!payment) {
    throw new Error(
      `Payment ${paymentId} not found`
    );
  }

  const [
    payee,
    messages,
    ledgerEntries,
    behaviour,
  ] = await Promise.all([
    prisma.payee.findUnique({
      where: {
        id: payment.payeeId,
      },
    }),

    prisma.message.findMany({
      where: {
        userId: payment.userId,
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

  if (!payee) {
    throw new Error(
      `Payee ${payment.payeeId} not found`
    );
  }

  if (!behaviour) {
    throw new Error(
      `Behaviour profile for user ${payment.userId} not found`
    );
  }

  return {
    payment,
    payee,
    messages,
    ledgerEntries,
    behaviour,
  };
}
