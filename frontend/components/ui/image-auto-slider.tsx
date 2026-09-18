import Image, { type StaticImageData } from "next/image";
import proofOne from "@/proofs/images/images (6).jpg";
import proofTwo from "@/proofs/images/images (7).jpg";
import proofThree from "@/proofs/images/randomly-received-money-on-upi-v0-y1he8dsog6nb1.webp";
import proofFour from "@/proofs/images/Screenshot 2026-09-18 203857.png";
import proofFive from "@/proofs/images/Screenshot 2026-09-18 204639.png";
import proofSix from "@/proofs/images/Select-_Unauthorized-Transaction_.jpeg.webp";
import proofSeven from "@/proofs/images/someone-sent-me-money-on-google-pay-mistakenly-v0-jm0przejgyxe1.webp";

type Proof = {
  src: StaticImageData;
  alt: string;
};

const proofs: Proof[] = [
  { src: proofOne, alt: "A real-world report about an unexpected digital payment" },
  { src: proofTwo, alt: "A payment safety discussion shared online" },
  { src: proofThree, alt: "A report about money unexpectedly received through UPI" },
  { src: proofFour, alt: "Screenshot documenting a suspicious payment message" },
  { src: proofFive, alt: "Screenshot showing a contextual payment-risk example" },
  { src: proofSix, alt: "Guidance for selecting an unauthorized transaction" },
  { src: proofSeven, alt: "A report about money mistakenly sent through Google Pay" },
];

function ProofGroup({ hidden = false }: { hidden?: boolean }) {
  return (
    <div className="proof-slider__group" aria-hidden={hidden || undefined}>
      {proofs.map((proof, index) => (
        <figure className="proof-card" key={`${hidden ? "copy" : "source"}-${proof.src.src}`}>
          <div className="proof-card__image">
            <Image
              src={proof.src}
              alt={hidden ? "" : proof.alt}
              sizes="(max-width: 48rem) 72vw, 21rem"
              placeholder="blur"
            />
          </div>
          <figcaption><span>{String(index + 1).padStart(2, "0")}</span> Community evidence</figcaption>
        </figure>
      ))}
    </div>
  );
}

export function ImageAutoSlider() {
  return (
    <section className="proofs" aria-labelledby="proofs-title">
      <div className="proofs__heading section-shell">
        <div>
          <p className="mono-label">The pattern in the wild</p>
          <h2 id="proofs-title">Real messages.<br />Real hesitation.</h2>
        </div>
        <p>Payment scams rarely look like scams at first. These reports show why context matters before a transfer is approved.</p>
      </div>

      <div className="proof-slider" role="region" aria-label="Community payment-safety reports">
        <div className="proof-slider__track">
          <ProofGroup />
          <ProofGroup hidden />
        </div>
      </div>
    </section>
  );
}
