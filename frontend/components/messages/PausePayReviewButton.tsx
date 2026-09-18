"use client";

interface PausePayReviewButtonProps {
  onReview: () => void;
}

export function PausePayReviewButton({
  onReview,
}: PausePayReviewButtonProps) {
  return (
    <section className="mt-16 border-t border-zinc-900 pt-6">
      <button
        type="button"
        onClick={onReview}
        className="
          w-full
          rounded-xl
          border border-zinc-700
          bg-zinc-100
          px-5 py-4
          text-sm font-semibold
          text-zinc-950
          transition
          hover:bg-white
          active:scale-[0.99]
        "
      >
        Review with PausePay
      </button>

      <p className="mt-3 text-center text-xs text-zinc-600">
        Review this conversation before making a payment.
      </p>
    </section>
  );
}
