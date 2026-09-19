import { ArrowDownRight, ArrowRight, Building2, Eye, LockKeyhole, ScanSearch, ShieldCheck, Smartphone } from "lucide-react";
import Image from "next/image";
import { UPINetwork } from "@/components/landing/UPINetwork";
import { ScenarioLab } from "@/components/landing/ScenarioLab";
import { ThemeLogo } from "@/components/ui/ThemeLogo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { ImageAutoSlider } from "@/components/ui/image-auto-slider";
import { HowItWorksWalkthrough } from "@/components/landing/HowItWorksWalkthrough";
import downloadBadge from "@/assets/download/single.png";

const steps = [
  { number: "01", icon: Eye, title: "Reads the context", body: "Message, amount, recipient and recent payment history." },
  { number: "02", icon: ScanSearch, title: "Finds contradictions", body: "Missing credits, changed recipients and pressure cues." },
  { number: "03", icon: ShieldCheck, title: "Explains the pause", body: "A clear reason appears before the UPI PIN screen." },
];

export default function HomePage() {
  return (
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>

      <header className="site-header site-header--simple">
        <a className="brand" href="#top" aria-label="PausePay home">
          <ThemeLogo />
        </a>
        <div className="header-actions">
          <a className="nav-item-companies" href="/companies" aria-label="Services for Companies">
            <Building2 size={15} />
            <span>Services for Companies</span>
            <span className="badge-enterprise">API</span>
          </a>
          <ThemeToggle />
          <a className="button button--compact" href="#demo">Try a scenario <ArrowRight size={16} /></a>
        </div>
      </header>

      <main id="main-content" className="landing-v2">
        <section className="hero hero--v2" id="top">
          <div className="hero__copy hero__copy--v2">
            <p className="eyebrow"><span aria-hidden="true" /> A safer layer for every UPI app</p>
            <h1>Think once.<br />Pay safely.</h1>
            <p className="hero__lede">
              PausePay catches suspicious context around a transfer and gives you one clear reason to stop—before money leaves.
            </p>
            <div className="hero__actions">
              {/* Opens the simulated phone at its home screen, so the three apps
                  are the first thing seen rather than one app mid-flow. */}
              <a className="button" href="/app"><Smartphone size={17} aria-hidden="true" /> Mobile view</a>
              <a className="button" href="#demo">Try a scam scenario <ArrowDownRight size={17} /></a>
              <HowItWorksWalkthrough />
            </div>
            <p className="hero__disclaimer"><LockKeyhole size={14} aria-hidden="true" /> Demo only. No bank account, UPI PIN or OTP is connected.</p>
          </div>
          <UPINetwork />
        </section>

        <section className="trust-strip" aria-label="Supported payment apps">
          <span>Google Pay</span><span>PhonePe</span><span>Paytm</span><span>BHIM</span><span>Amazon Pay</span><span>WhatsApp</span><strong>+ any UPI app</strong>
          <a href="/companies" className="text-xs font-semibold hover:underline inline-flex items-center gap-1 ml-3" style={{ color: "var(--color-accent)" }}>
            For Payment Companies &rarr;
          </a>
        </section>

        <section className="how section-shell" id="how-it-works" aria-labelledby="how-title">
          <div className="section-heading section-heading--compact">
            <div>
              <p className="mono-label">A pause with a reason</p>
              <h2 id="how-title">Three checks. One clear decision.</h2>
            </div>
            <p>Not another fraud score. Just the evidence that matters, while you can still act.</p>
          </div>
          <ol className="how-grid">
            {steps.map(({ number, icon: Icon, title, body }) => (
              <li key={number}>
                <span className="how-grid__number">{number}</span>
                <Icon size={21} aria-hidden="true" />
                <h3>{title}</h3>
                <p>{body}</p>
              </li>
            ))}
          </ol>
        </section>

        <ImageAutoSlider />

        <section className="demo-section demo-section--v2" id="demo" aria-labelledby="demo-title">
          <div className="section-shell">
            <div className="section-heading section-heading--on-accent section-heading--compact">
              <div>
                <p className="mono-label">Interactive demo</p>
                <h2 id="demo-title">See what PausePay notices.</h2>
              </div>
              <p>Compare a classic refund scam with payments that only look unusual.</p>
            </div>
            <ScenarioLab />
          </div>
        </section>

        <section className="closing section-shell" aria-labelledby="closing-title">
          <p className="mono-label">Safety without lock-in</p>
          <h2 id="closing-title">Your payment.<br />Your final call.</h2>
          <p>PausePay explains the risk. You decide whether to review, cancel or continue.</p>
          <a className="button" href="#demo">Run the demo <ArrowRight size={16} /></a>
        </section>
      </main>

      <footer className="site-footer site-footer--simple" id="download">
        <div className="footer-download">
          <div>
            <p className="mono-label">Pause before you pay</p>
            <h2>Take PausePay with you.</h2>
            <p>Get an extra moment of clarity before paying someone new.</p>
          </div>
          <div className="footer-download__badges" aria-label="Download PausePay">
            <a href="#download" aria-label="Download PausePay on Google Play or the App Store">
              <Image src={downloadBadge} alt="Get PausePay on Google Play or download it on the App Store" />
            </a>
          </div>
        </div>
        <div className="site-footer__bottom">
          <span className="brand__name">PausePay</span>
          <p>Contextual payment safety for UPI.</p>
          <span>Synthetic prototype · 2026</span>
        </div>
      </footer>
    </>
  );
}
