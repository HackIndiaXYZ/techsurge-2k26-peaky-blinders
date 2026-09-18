import type { BehaviourContext } from "./behaviour";
import type { LedgerContext } from "./ledger";
import type { MessageContext } from "./message";
import type { PayeeContext } from "./payee";
import type { PaymentContext } from "./transaction";

export interface PaymentContextBundle {
  message: MessageContext;

  payment: PaymentContext;

  payee: PayeeContext;

  ledger: LedgerContext;

  behaviour: BehaviourContext;
}
