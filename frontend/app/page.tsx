import {
  ArrowDownRight,
  ArrowRight,
  Braces,
  CheckCircle2,
  Database,
  FileSearch,
  GitBranch,
  LockKeyhole,
  MessageSquareText,
  ShieldAlert,
  TimerReset,
  UserRoundCheck,
} from "lucide-react";
import { ContextCanvas } from "@/components/landing/ContextCanvas";
import { ScenarioLab } from "@/components/landing/ScenarioLab";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const workflow = [
  {
    number: "1.0",
    title: "Capture the intent.",
    body: "The amount, recipient, time, and payment source establish what the user is about to authorise.",
    icon: FileSearch,
    detail: "₹5,000 → rahul@upi",
  },
  {
    number: "2.0",
    title: "Assemble the context.",
    body: "Messages, ledger entries, payee history, and recent behaviour are considered as one connected story.",
    icon: GitBranch,
    detail: "5 evidence sources connected",
  },
  {
    number: "3.0",
    title: "Find contradictions.",
    body: "Named signals expose missing transfers, identity mismatches, pressure language, and suspicious timing.",
    icon: ShieldAlert,
    detail: "3 independent risk signals",
  },
  {
    number: "4.0",
    title: "Explain before acting.",
    body: "The system presents verifiable reasons and a recommended next step while keeping the final decision with the user.",
    icon: MessageSquareText,
    detail: "Cancel · review · continue",
  },
];

const auditSteps = [
  "Payment intent",
  "Context snapshot",
  "Extracted features",
  "Risk signals",
  "Mitigators",
  "Explanation",
  "User decision",
];

export default function HomePage() {
  return (
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>

      <header className="site-header">
        <a className="brand" href="#top" aria-label="PausePay, home">
          <span className="brand__name">PausePay</span>
          <span className="brand__descriptor">Contextual payment safety</span>
        </a>
        <div className="header-actions">
          <ThemeToggle />
          <a className="button button--compact" href="#demo">Run the demo <ArrowRight size={16} /></a>
        </div>
      </header>

      <main id="main-content">
        <section className="hero" id="top">
          <div className="hero__copy">
            <p className="hero__kicker"><span aria-hidden="true" /> Pre-payment intervention · synthetic prototype</p>
            <h1>Pause before money leaves.</h1>
            <p className="hero__lede">
              PausePay examines the message, recipient, ledger, timing, and payment history around a transfer—then explains what does not add up before you confirm.
            </p>
            <div className="hero__actions">
              <a className="button" href="/demo/messages">Go to Real App <ArrowRight size={17} /></a>
              <a className="button" style={{ backgroundColor: 'var(--accent-color, #333)' }} href="#demo">Explore scenarios <ArrowDownRight size={17} /></a>
              <a className="text-link" href="#workflow">See how it reasons <ArrowRight size={16} /></a>
            </div>
            <p className="hero__disclaimer"><LockKeyhole size={15} aria-hidden="true" /> No real bank, UPI account, PIN, or OTP is connected.</p>
          </div>
          <ContextCanvas />
        </section>

        <section className="argument section-shell" aria-labelledby="argument-title">
          <p className="argument__lead">The transaction is authorised.</p>
          <h2 id="argument-title">The surrounding story may not be.</h2>
          <div className="argument__sequence" aria-label="Example payment contradiction">
            <div><MessageSquareText size={20} /><span>A message claims ₹5,000 was sent.</span></div>
            <ArrowRight className="sequence-arrow" aria-hidden="true" />
            <div><Database size={20} /><span>The ledger contains no such credit.</span></div>
            <ArrowRight className="sequence-arrow" aria-hidden="true" />
            <div><UserRoundCheck size={20} /><span>The return recipient is someone else.</span></div>
          </div>
        </section>

        <section className="workflow section-shell" id="workflow" aria-labelledby="workflow-title">
          <div className="section-heading">
            <div>
              <p className="mono-label">A contextual payment workflow</p>
              <h2 id="workflow-title">From payment intent to an explainable decision.</h2>
            </div>
            <p>Risk is built from connected evidence, not a single anomaly and never an opaque model verdict.</p>
          </div>

          <ol className="workflow-list">
            {workflow.map(({ number, title, body, icon: Icon, detail }) => (
              <li key={number} className="workflow-step">
                <span className="workflow-step__number">{number}</span>
                <div className="workflow-step__copy">
                  <h3>{title}</h3>
                  <p>{body}</p>
                </div>
                <div className="workflow-step__object">
                  <Icon size={20} aria-hidden="true" />
                  <span>{detail}</span>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="evidence-section section-shell" aria-labelledby="evidence-title">
          <div className="evidence-section__intro">
            <p className="mono-label">Evidence before score</p>
            <h2 id="evidence-title">A warning should be possible to verify.</h2>
            <p>The strongest evidence appears first. The numeric score remains available, but it never replaces the explanation.</p>
          </div>
          <div className="evidence-ledger">
            <div className="evidence-ledger__head"><span>Observed evidence</span><span>Contribution</span></div>
            <div><span>No matching incoming payment</span><strong>Strong contradiction</strong></div>
            <div><span>Recipient differs from claimed sender</span><strong>Identity mismatch</strong></div>
            <div><span>First payment to this recipient</span><strong>New payee</strong></div>
            <div><span>Payment follows the message by four minutes</span><strong>Short latency</strong></div>
            <div className="evidence-ledger__mitigator"><span>Verified or reassuring evidence</span><strong>None found</strong></div>
          </div>
        </section>

        <section className="demo-section" id="demo" aria-labelledby="demo-title">
          <div className="section-shell">
            <div className="section-heading section-heading--on-accent">
              <div>
                <p className="mono-label">Three scenarios · one consistent engine</p>
                <h2 id="demo-title">Detection matters. Restraint matters too.</h2>
              </div>
              <p>Compare a scam pattern with two legitimate lookalikes. The system must know when not to overreact.</p>
            </div>
            <ScenarioLab />
          </div>
        </section>

        <section className="audit section-shell" aria-labelledby="audit-title">
          <div className="audit__statement">
            <p className="mono-label">Inspectable by construction</p>
            <h2 id="audit-title">Every assessment leaves a trace.</h2>
            <p>Judges, developers, and future risk teams can reconstruct what the engine saw, which rules fired, what was shown, and what the user chose.</p>
          </div>
          <ol className="audit-track">
            {auditSteps.map((step, index) => (
              <li key={step}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <p>{step}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="evaluation section-shell" id="evaluation" aria-labelledby="evaluation-title">
          <div className="section-heading">
            <div>
              <p className="mono-label">Evaluation without theatre</p>
              <h2 id="evaluation-title">Measured against difficult negatives.</h2>
            </div>
            <p>Scam recall matters, but so does letting a genuine urgent payment proceed. The benchmark will report both.</p>
          </div>
          <div className="evaluation-grid">
            <article><Braces size={20} /><h3>Same engine</h3><p>The demo and offline benchmark use the same deterministic scoring logic.</p></article>
            <article><TimerReset size={20} /><h3>Versioned runs</h3><p>Every result records its dataset, engine version, and local scoring latency.</p></article>
            <article><CheckCircle2 size={20} /><h3>Honest metrics</h3><p>Precision, recall, false positives, false negatives, and category results—no invented claims.</p></article>
          </div>
          <div className="metrics-pending" role="note">
            <span>Evaluation status</span>
            <strong>Metrics pending first reproducible benchmark run</strong>
            <small>No placeholder performance claims are displayed.</small>
          </div>
        </section>

        <section className="safety section-shell" id="safety" aria-labelledby="safety-title">
          <div className="safety__heading">
            <p className="mono-label">Safety boundary</p>
            <h2 id="safety-title">A risk signal, never a fraud verdict.</h2>
          </div>
          <div className="safety__rules">
            <article><span>01</span><h3>Synthetic only</h3><p>No real banking data, credentials, UPI PINs, or OTPs enter the prototype.</p></article>
            <article><span>02</span><h3>User remains in control</h3><p>The system can interrupt and explain, but it does not autonomously block a payment.</p></article>
            <article><span>03</span><h3>Limits stay visible</h3><p>Synthetic results do not establish real-world fraud-detection performance.</p></article>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="site-footer__statement">
          <p>A warning should explain itself.</p>
          <a className="button button--light" href="#demo">Try a payment scenario <ArrowRight size={17} /></a>
        </div>
        <div className="site-footer__meta">
          <span className="brand__name">PausePay</span>
          <div>
            <a href="#workflow">How it works</a>
            <a href="#evaluation">Evaluation</a>
            <a href="#safety">Safety</a>
          </div>
          <span>Synthetic prototype · 2026</span>
        </div>
      </footer>
    </>
  );
}
