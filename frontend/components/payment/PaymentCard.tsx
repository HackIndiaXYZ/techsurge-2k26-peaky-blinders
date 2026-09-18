import type {
  ScenarioPayment,
} from "@/data/scenarios";

import type {
  ScenarioPayee,
} from "@/data/scenarios";

interface PaymentCardProps {
  payment: ScenarioPayment;
  payee: ScenarioPayee;
}

export function PaymentCard({
  payment,
  payee,
}: PaymentCardProps) {
  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
      <div>
        <p className="text-sm text-zinc-500">
          Paying
        </p>

        <h2 className="mt-2 text-xl font-medium">
          {payee.name}
        </h2>

        <p className="mt-1 font-mono text-sm text-zinc-500">
          {payee.upiId}
        </p>
      </div>

      <div className="mt-10">
        <p className="text-5xl font-semibold tracking-tight">
          ₹{payment.amount.toLocaleString("en-IN")}
        </p>
      </div>

      <div className="mt-10 border-t border-zinc-900 pt-6">
        <p className="text-xs uppercase tracking-wider text-zinc-600">
          Note
        </p>

        <p className="mt-2 text-sm text-zinc-300">
          {payment.description ?? "Payment"}
        </p>
      </div>
    </section>
  );
}
