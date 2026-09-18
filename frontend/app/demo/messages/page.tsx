"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import {
  getScenario,
  type ScenarioId,
} from "@/data/scenarios";

import {
  buildPaymentContext,
  storePaymentContext,
} from "@/data/context";

import {
  MessageBubble,
} from "@/components/messages/MessageBubble";

import {
  PausePayReviewButton,
} from "@/components/messages/PausePayReviewButton";

function MessagesDemoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isAttaching, setIsAttaching] = useState(false);

  const scenarioId =
    (searchParams.get("scenario") ??
      "SCENARIO_ACCIDENTAL_TRANSFER") as ScenarioId;

  const scenario = getScenario(scenarioId);

  const handleReview = () => {
    setIsAttaching(true);

    const context = buildPaymentContext(scenario);
    storePaymentContext(context);

    setTimeout(() => {
      router.push(
        `/demo/payment?scenario=${scenario.id}&context=attached`
      );
    }, 500);
  };

  return (
    <>
      {isAttaching && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 px-5 py-4 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 animate-pulse rounded-full bg-zinc-300" />
              <div>
                <p className="text-sm font-medium text-zinc-200">
                  Context securely attached
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  Opening payment...
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-6 py-10">
        <header>
          <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">
            Demo Host App
          </p>

          <h1 className="mt-2 text-2xl font-semibold">
            MESSAGES
          </h1>
        </header>

        <section className="mt-12 flex-1">
          <p className="text-xs uppercase tracking-wider text-zinc-500">
            Conversation
          </p>

          <h2 className="mt-2 mb-8 text-xl font-medium">
            {scenario.message.senderName}
          </h2>

          <MessageBubble
            message={scenario.message}
          />
        </section>

        <PausePayReviewButton onReview={handleReview} />
      </div>
    </>
  );
}

export default function MessagesDemoPage() {
  return (
    <main className="min-h-screen bg-[#09090b] text-white">
      <Suspense fallback={<div>Loading...</div>}>
        <MessagesDemoContent />
      </Suspense>
    </main>
  );
}
