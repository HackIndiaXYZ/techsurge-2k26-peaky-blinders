"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import {
  getScenario,
  type ScenarioId,
} from "@/data/scenarios";

import {
  getPaymentContext,
  type PaymentContextPackage,
} from "@/data/context";

import { PaymentCard } from "@/components/payment/PaymentCard";

function PaymentDemoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const scenarioId =
    (searchParams.get("scenario") ??
      "SCENARIO_ACCIDENTAL_TRANSFER") as ScenarioId;

  const scenario = getScenario(scenarioId);

  const [
    paymentContext,
    setPaymentContext,
  ] = useState<PaymentContextPackage | null>(null);

  useEffect(() => {
    const context = getPaymentContext();
    setPaymentContext(context);
  }, []);

  const handleReviewPayment = () => {
    router.push(
      `/demo/review?scenario=${scenario.id}`
    );
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col px-6 py-10">
      {/* Header */}
      <header className="mb-12">
        <p className="text-xs font-medium uppercase tracking-[0.25em] text-zinc-500">
          Demo Host App
        </p>

        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          PAYMENT
        </h1>
      </header>

      {/* Context indicator */}
      {paymentContext && (
        <div className="mb-8 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-zinc-400" />
              <span className="text-sm text-zinc-300">
                Context attached
              </span>
            </div>
            <span className="text-xs text-zinc-600">
              1 message
            </span>
          </div>

          <p className="mt-3 text-sm leading-6 text-zinc-400">
            Message from{" "}
            <span className="text-zinc-200">
              {paymentContext.sender.name}
            </span>
            {" "}was attached to this payment review.
          </p>
        </div>
      )}

      {!paymentContext && (
        <div className="mb-8 rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
          <p className="text-sm text-zinc-400">
            No conversation context attached.
          </p>
        </div>
      )}

      {/* Payment */}
      <section className="flex-1">
        <div className="mb-6">
          <p className="text-xs uppercase tracking-wider text-zinc-600">
            Send Money
          </p>
        </div>

        <PaymentCard payment={scenario.payment} payee={scenario.payee} />
      </section>

      {/* Review */}
      <section className="mt-10">
        <button
          type="button"
          onClick={handleReviewPayment}
          className="
            w-full
            rounded-xl
            bg-zinc-100
            px-5
            py-4
            text-sm
            font-semibold
            text-zinc-950
            transition
            hover:bg-white
            active:scale-[0.99]
          "
        >
          Review Payment
        </button>

        <p className="mt-3 text-center text-xs leading-5 text-zinc-600">
          No payment will be sent during this demo.
        </p>
      </section>
    </div>
  );
}

export default function PaymentDemoPage() {
  return (
    <main className="min-h-screen bg-[#09090b] text-white">
      <Suspense fallback={<div>Loading...</div>}>
        <PaymentDemoContent />
      </Suspense>
    </main>
  );
}
