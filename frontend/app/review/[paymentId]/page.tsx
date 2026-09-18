import Link from "next/link";

export default function PaymentReviewPlaceholder() {
  return (
    <main className="route-placeholder">
      <p className="mono-label">Product route reserved</p>
      <h1>Payment review is the next build phase.</h1>
      <p>The landing-page scenario laboratory currently demonstrates the assessment experience.</p>
      <Link className="button" href="/#demo">Open the scenario laboratory</Link>
    </main>
  );
}
