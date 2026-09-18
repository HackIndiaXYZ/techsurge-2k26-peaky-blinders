import { PrismaClient } from "@prisma/client";
import { getScenario } from "../../frontend/data/scenarios/registry";
import type { ScenarioId } from "../../frontend/data/scenarios/types";

const prisma = new PrismaClient();

export async function seedScenario(scenarioId: ScenarioId) {
  const scenario = getScenario(scenarioId);
  
  console.log(`🌱 Seeding scenario: ${scenario.name}...`);

  await prisma.$transaction(async (tx) => {
    // 1. Clean existing demo data
    await tx.userDecision.deleteMany();
    await tx.assessment.deleteMany();
    await tx.ledgerEntry.deleteMany();
    await tx.message.deleteMany();
    await tx.transaction.deleteMany();
    await tx.userBehaviour.deleteMany();
    await tx.payee.deleteMany();
    await tx.user.deleteMany();

    // 2. Create demo user
    const user = await tx.user.create({
      data: {
        name: "Demo User",
        phone: "+91XXXXXXXXXX",
      },
    });

    // 3. Create payee
    const payee = await tx.payee.create({
      data: {
        userId: user.id,
        name: scenario.payee.name,
        upiId: scenario.payee.upiId,
        relationship: scenario.payee.relationship,
        isVerified: scenario.payee.isVerified,
      },
    });

    // 4. Create message
    const messageTimestamp = new Date(Date.now() - 60 * 1000);
    const message = await tx.message.create({
      data: {
        userId: user.id,
        channel: scenario.message.channel,
        senderName: scenario.message.senderName,
        senderIdentifier: scenario.message.senderIdentifier,
        content: scenario.message.content,
        timestamp: messageTimestamp,
      },
    });

    // 5. Create pending payment
    const paymentTimestamp = new Date();
    const transaction = await tx.transaction.create({
      data: {
        userId: user.id,
        payeeId: payee.id,
        amount: scenario.payment.amount,
        currency: scenario.payment.currency,
        timestamp: paymentTimestamp,
        status: "PENDING",
        description: scenario.payment.description,
      },
    });

    // 6. Create ledger entries
    // Outgoing
    await tx.ledgerEntry.create({
      data: {
        userId: user.id,
        transactionId: transaction.id,
        type: "DEBIT",
        amount: scenario.payment.amount,
        currency: scenario.payment.currency,
        timestamp: paymentTimestamp,
        counterpartyId: payee.id,
        description: `Pending payment to ${scenario.payment.recipientName}`,
      },
    });

    // Incoming (if any)
    for (const incoming of scenario.ledger.incomingPayments) {
      await tx.ledgerEntry.create({
        data: {
          userId: user.id,
          type: "CREDIT",
          amount: incoming.amount,
          currency: "INR",
          timestamp: new Date(paymentTimestamp.getTime() - 24 * 60 * 60 * 1000),
          description: `Incoming payment from ${incoming.counterpartyName ?? "Unknown"}`,
        },
      });
    }

    // 7. Create behaviour
    const behaviour = await tx.userBehaviour.create({
      data: {
        userId: user.id,
        averageTransactionAmount: scenario.behaviour.averageTransactionAmount,
        averageDailyTransactionCount: scenario.behaviour.averageDailyTransactionCount,
        typicalPaymentHour: scenario.behaviour.typicalPaymentHour,
        typicalPayeeCount: scenario.behaviour.typicalPayeeCount,
        recentPaymentCount: scenario.behaviour.recentPaymentCount,
      },
    });

    console.log(`\n✅ Scenario "${scenario.name}" seeded successfully.\n`);
    console.log("IDs:");
    console.log({
      userId: user.id,
      messageId: message.id,
      payeeId: payee.id,
      transactionId: transaction.id,
      behaviourId: behaviour.id,
    });
  });
}
