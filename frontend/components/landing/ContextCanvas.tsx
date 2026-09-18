import { AlertTriangle, ArrowRight, Clock3, Landmark, MessageSquareText, UserRoundPlus } from "lucide-react";

export function ContextCanvas() {
  return (
    <figure className="context-canvas" aria-labelledby="context-canvas-title">
      <figcaption className="context-canvas__header">
        <div>
          <p className="mono-label">PausePay warning · simulated</p>
          <h2 id="context-canvas-title">Why this payment was paused</h2>
        </div>
        <span className="risk-chip"><AlertTriangle size={15} aria-hidden="true" /> High contextual risk</span>
      </figcaption>

      <div className="context-canvas__flow" aria-label="Evidence connected to the payment assessment">
        <article className="evidence-card evidence-card--message">
          <MessageSquareText size={18} aria-hidden="true" />
          <div>
            <span className="evidence-card__label">Message · 09:12 · unknown sender</span>
            <p>“Your bank KYC expires today. Pay ₹4,999 immediately to secureverify@upi.”</p>
          </div>
        </article>

        <span className="flow-arrow" aria-hidden="true"><ArrowRight size={18} /></span>

        <article className="evidence-card evidence-card--ledger">
          <Landmark size={18} aria-hidden="true" />
          <div>
            <span className="evidence-card__label">Message analysis</span>
            <p>KYC-fee pattern · urgency · account-blocking threat.</p>
          </div>
        </article>

        <article className="evidence-card evidence-card--payee">
          <UserRoundPlus size={18} aria-hidden="true" />
          <div>
            <span className="evidence-card__label">Payment attempt</span>
            <p>₹4,999 to secureverify@upi · same identifier and amount.</p>
          </div>
        </article>

        <article className="evidence-card evidence-card--time">
          <Clock3 size={18} aria-hidden="true" />
          <div>
            <span className="evidence-card__label">Risk store</span>
            <p>Identifier already marked suspicious from that message.</p>
          </div>
        </article>
      </div>

      <div className="context-canvas__result">
        <div>
          <span className="mono-label">Strongest reason</span>
          <p>This UPI ID and ₹4,999 amount match an earlier suspicious KYC message.</p>
        </div>
        <span className="score" aria-label="Risk score 100 out of 100">100<span>/100</span></span>
      </div>
    </figure>
  );
}
