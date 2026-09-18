import { AlertTriangle, ArrowRight, Clock3, Landmark, MessageSquareText, UserRoundPlus } from "lucide-react";

export function ContextCanvas() {
  return (
    <figure className="context-canvas" aria-labelledby="context-canvas-title">
      <figcaption className="context-canvas__header">
        <div>
          <p className="mono-label">Context review · synthetic</p>
          <h2 id="context-canvas-title">Why this payment was interrupted</h2>
        </div>
        <span className="risk-chip"><AlertTriangle size={15} aria-hidden="true" /> High contextual risk</span>
      </figcaption>

      <div className="context-canvas__flow" aria-label="Evidence connected to the payment assessment">
        <article className="evidence-card evidence-card--message">
          <MessageSquareText size={18} aria-hidden="true" />
          <div>
            <span className="evidence-card__label">Message · 10:26</span>
            <p>“I sent ₹5,000 by mistake. Return it now to Rahul.”</p>
          </div>
        </article>

        <span className="flow-arrow" aria-hidden="true"><ArrowRight size={18} /></span>

        <article className="evidence-card evidence-card--ledger">
          <Landmark size={18} aria-hidden="true" />
          <div>
            <span className="evidence-card__label">Ledger check</span>
            <p>No matching ₹5,000 incoming payment found.</p>
          </div>
        </article>

        <article className="evidence-card evidence-card--payee">
          <UserRoundPlus size={18} aria-hidden="true" />
          <div>
            <span className="evidence-card__label">Recipient</span>
            <p>New payee · different from the claimed sender.</p>
          </div>
        </article>

        <article className="evidence-card evidence-card--time">
          <Clock3 size={18} aria-hidden="true" />
          <div>
            <span className="evidence-card__label">Timing</span>
            <p>Payment started four minutes after the message.</p>
          </div>
        </article>
      </div>

      <div className="context-canvas__result">
        <div>
          <span className="mono-label">Strongest contradiction</span>
          <p>The claimed incoming payment cannot be verified.</p>
        </div>
        <span className="score" aria-label="Risk score 82 out of 100">82<span>/100</span></span>
      </div>
    </figure>
  );
}
