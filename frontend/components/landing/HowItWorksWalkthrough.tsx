"use client";

import Image, { type StaticImageData } from "next/image";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { gsap } from "gsap";
import { useCallback, useEffect, useRef, useState } from "react";
import screenOne from "@/assets/all/1.png.png";
import screenTwo from "@/assets/all/2.png";
import screenThree from "@/assets/all/3.png";
import screenFour from "@/assets/all/4.png";
import screenFive from "@/assets/all/5.png";
import screenSix from "@/assets/all/6.png";
import screenSeven from "@/assets/all/7.png";
import screenEight from "@/assets/all/8.png";

type WalkthroughStep = {
  image: StaticImageData;
  title: string;
  description: string;
  why: string;
  alt: string;
};

const steps: WalkthroughStep[] = [
  {
    image: screenOne,
    title: "Start from a protected payment app",
    description: "PausePay sits inside the payment experience and adds a safety layer before money leaves.",
    why: "Protection is present without changing how the user normally pays.",
    alt: "Google Pay home screen showing that PausePay protection is active",
  },
  {
    image: screenTwo,
    title: "Notice a new recipient",
    description: "The payment is for Arun Demo, a recipient with no previous transaction history.",
    why: "A first payment deserves more context than a familiar transfer.",
    alt: "Payment screen for Arun Demo marked as a new recipient with no previous payments",
  },
  {
    image: screenThree,
    title: "Recognise an unusual amount",
    description: "The ₹48,000 amount is much higher than the user’s recent payment pattern.",
    why: "The amount matters because it is evaluated against the user’s own history.",
    alt: "Payment amount screen showing forty-eight thousand rupees and an unusual-payment notice",
  },
  {
    image: screenFour,
    title: "Review before continuing",
    description: "The review screen brings the new recipient and unusually high amount into one clear summary.",
    why: "The warning appears while the user can still reconsider the transfer.",
    alt: "Review payment screen highlighting a new recipient and unusually high amount",
  },
  {
    image: screenFive,
    title: "Run the PausePay safety check",
    description: "PausePay checks recipient familiarity, amount patterns, and payment context.",
    why: "The assessment uses several relevant signals instead of one generic fraud score.",
    alt: "PausePay checking recipient familiarity, amount pattern, and payment context",
  },
  {
    image: screenSix,
    title: "Explain the detected risk",
    description: "The result names the three unusual signs: a new recipient, a high amount, and no payment history.",
    why: "A user can act on specific evidence, not an unexplained verdict.",
    alt: "PausePay risk screen explaining three unusual payment signals",
  },
  {
    image: screenSeven,
    title: "Verify before continuing",
    description: "If the user still wants to proceed, PausePay asks them to independently verify the recipient and UPI ID.",
    why: "Deliberate verification adds friction only where the context justifies it.",
    alt: "Verification checklist shown before continuing to the UPI PIN",
  },
  {
    image: screenEight,
    title: "Cancel the suspicious payment safely",
    description: "The payment is cancelled before authorization, and no money is sent to the unfamiliar recipient.",
    why: "The final decision remains with the user, supported by a clear explanation.",
    alt: "PausePay confirmation that the payment was cancelled and no money was sent",
  },
];

const LAST_STEP = steps.length - 1;

export function HowItWorksWalkthrough() {
  const [stepIndex, setStepIndex] = useState(0);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const isAnimatingRef = useRef(false);
  const pointerStartRef = useRef<{ x: number; time: number; id: number } | null>(null);
  const scrollYRef = useRef(0);
  const bodyStyleRef = useRef<string | null>(null);
  const step = steps[stepIndex];

  const close = useCallback((animated = true) => {
    const dialog = dialogRef.current;
    if (!dialog?.open) return;

    const finish = () => {
      gsap.killTweensOf([surfaceRef.current, imageRef.current, copyRef.current]);
      dialog.close();
      setStepIndex(0);
      if (bodyStyleRef.current === null) document.body.removeAttribute("style");
      else document.body.setAttribute("style", bodyStyleRef.current);
      window.scrollTo(0, scrollYRef.current);
      triggerRef.current?.focus();
      isAnimatingRef.current = false;
    };

    if (!animated || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      finish();
      return;
    }

    isAnimatingRef.current = true;
    gsap.to(surfaceRef.current, { opacity: 0, transform: "scale(0.97)", duration: 0.18, ease: "power3.out", onComplete: finish });
  }, []);

  const open = () => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    scrollYRef.current = window.scrollY;
    bodyStyleRef.current = document.body.getAttribute("style");
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollYRef.current}px`;
    document.body.style.width = "100%";
    document.body.style.overflow = "hidden";
    dialog.showModal();
    requestAnimationFrame(() => {
      dialog.querySelector<HTMLButtonElement>(".walkthrough__close")?.focus();
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      gsap.fromTo(surfaceRef.current, { opacity: 0, transform: "scale(0.97)" }, { opacity: 1, transform: "scale(1)", duration: 0.25, ease: "power3.out", clearProps: "transform" });
    });
  };

  const moveTo = useCallback((target: number, animated = true) => {
    if (target < 0 || target > LAST_STEP || target === stepIndex || isAnimatingRef.current) return;
    const image = imageRef.current;
    const copy = copyRef.current;
    const direction = target > stepIndex ? 1 : -1;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!animated || reduceMotion || !image || !copy) {
      setStepIndex(target);
      return;
    }

    isAnimatingRef.current = true;
    gsap.killTweensOf([image, copy]);
    const timeline = gsap.timeline({
      defaults: { ease: "power3.out" },
      onComplete: () => { isAnimatingRef.current = false; },
    });

    timeline
      .to(image, { opacity: 0, transform: `translateX(${-direction * 7}%) scale(0.985)`, duration: 0.18 }, 0)
      .to(copy, { opacity: 0, transform: `translateX(${-direction * 4}%)`, duration: 0.16 }, 0.02)
      .add(() => setStepIndex(target))
      .set(image, { transform: `translateX(${direction * 7}%) scale(0.985)` })
      .set(copy, { transform: `translateX(${direction * 4}%)` })
      .to(image, { opacity: 1, transform: "translateX(0%) scale(1)", duration: 0.28, clearProps: "transform" })
      .to(copy, { opacity: 1, transform: "translateX(0%)", duration: 0.24, clearProps: "transform" }, "<0.04")
      .fromTo(copy.querySelectorAll("[data-walkthrough-copy]"), { opacity: 0, transform: "translateY(8px)" }, { opacity: 1, transform: "translateY(0px)", duration: 0.16, stagger: 0.04, clearProps: "transform" }, "<0.02");
  }, [stepIndex]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const onCancel = (event: Event) => {
      event.preventDefault();
      close(false);
    };
    dialog.addEventListener("cancel", onCancel);
    return () => dialog.removeEventListener("cancel", onCancel);
  }, [close]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!dialogRef.current?.open) return;
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        moveTo(stepIndex - 1, false);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        moveTo(stepIndex + 1, false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [moveTo, stepIndex]);

  useEffect(() => () => {
    gsap.killTweensOf([surfaceRef.current, imageRef.current, copyRef.current]);
    if (dialogRef.current?.open) {
      if (bodyStyleRef.current === null) document.body.removeAttribute("style");
      else document.body.setAttribute("style", bodyStyleRef.current);
      window.scrollTo(0, scrollYRef.current);
    }
  }, []);

  return (
    <>
      <button ref={triggerRef} type="button" className="text-link walkthrough-trigger" onClick={open}>
        See how it works <ArrowRight size={16} aria-hidden="true" />
      </button>

      <dialog ref={dialogRef} className="walkthrough" aria-labelledby="walkthrough-title" aria-describedby="walkthrough-description">
        <div ref={surfaceRef} className="walkthrough__surface">
          <button type="button" className="walkthrough__close" onClick={() => close()} aria-label="Close walkthrough">
            <X size={20} aria-hidden="true" />
            <span>Back to page</span>
          </button>

          <div className="walkthrough__layout">
            <div
              className="walkthrough__visual"
              onPointerDown={(event) => {
                if (pointerStartRef.current) return;
                pointerStartRef.current = { x: event.clientX, time: Date.now(), id: event.pointerId };
                event.currentTarget.setPointerCapture(event.pointerId);
              }}
              onPointerUp={(event) => {
                const start = pointerStartRef.current;
                pointerStartRef.current = null;
                if (!start || start.id !== event.pointerId) return;
                const distance = event.clientX - start.x;
                const velocity = Math.abs(distance) / Math.max(Date.now() - start.time, 1);
                if (Math.abs(distance) < 48 && velocity < 0.35) return;
                moveTo(stepIndex + (distance < 0 ? 1 : -1));
              }}
              onPointerCancel={() => { pointerStartRef.current = null; }}
            >
              <div ref={imageRef} className="walkthrough__phone">
                <Image src={step.image} alt={step.alt} priority sizes="(max-width: 48rem) 72vw, 29rem" />
              </div>
            </div>

            <div ref={copyRef} className="walkthrough__content">
              <p data-walkthrough-copy className="walkthrough__step">Step {String(stepIndex + 1).padStart(2, "0")} of {String(steps.length).padStart(2, "0")}</p>
              <h2 data-walkthrough-copy id="walkthrough-title">{step.title}</h2>
              <p data-walkthrough-copy id="walkthrough-description" className="walkthrough__description">{step.description}</p>
              <p data-walkthrough-copy className="walkthrough__why"><strong>Why this matters</strong>{step.why}</p>

              <div className="walkthrough__progress" aria-label={`Step ${stepIndex + 1} of ${steps.length}`}>
                {steps.map((item, index) => (
                  <button
                    key={item.title}
                    type="button"
                    className="walkthrough__dot"
                    aria-label={`Go to step ${index + 1}: ${item.title}`}
                    aria-current={index === stepIndex ? "step" : undefined}
                    onClick={() => moveTo(index)}
                  ><span /></button>
                ))}
              </div>

              <div className="walkthrough__controls">
                <button type="button" className="walkthrough__nav walkthrough__nav--previous" onClick={() => moveTo(stepIndex - 1)} disabled={stepIndex === 0}>
                  <ArrowLeft size={18} aria-hidden="true" /> Previous
                </button>
                <span className="walkthrough__position" aria-hidden="true">{stepIndex + 1} / {steps.length}</span>
                {stepIndex === LAST_STEP ? (
                  <button type="button" className="walkthrough__nav walkthrough__nav--next" onClick={() => close()}>
                    Back to PausePay <ArrowRight size={18} aria-hidden="true" />
                  </button>
                ) : (
                  <button type="button" className="walkthrough__nav walkthrough__nav--next" onClick={() => moveTo(stepIndex + 1)}>
                    Next <ArrowRight size={18} aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>
          </div>
          <p className="walkthrough__status" role="status" aria-live="polite">Step {stepIndex + 1} of {steps.length}: {step.title}</p>
        </div>
      </dialog>
    </>
  );
}
