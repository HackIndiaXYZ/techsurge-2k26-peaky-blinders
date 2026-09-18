import type {
  LedgerEntry,
  Message,
  Payee,
  Transaction,
  UserBehaviour,
} from "@prisma/client";

export interface PaymentDatabaseContext {
  payment: Transaction;

  payee: Payee;

  messages: Message[];

  ledgerEntries: LedgerEntry[];

  behaviour: UserBehaviour;
}
