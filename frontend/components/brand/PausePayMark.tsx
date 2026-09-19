/**
 * The PausePay mark: a "P" whose counter is formed by two pause bars.
 *
 * Redrawn as vector from the concept mockups in `assets/all/` (5.png and 8.png
 * show it largest). Three elements share one diagonal gradient — azure at the
 * lower left through to indigo at the upper right — so the mark keeps its
 * depth at any size.
 *
 * `tone="mono"` renders in `currentColor` for places where the gradient would
 * fight the surface it sits on (dark warning screens, disabled states).
 */

"use client";

import { useId } from "react";

type Tone = "gradient" | "mono";

interface Props {
  size?: number;
  tone?: Tone;
  className?: string;
  /** Set when the mark is decorative next to a visible "PausePay" label. */
  decorative?: boolean;
}

export function PausePayMark({ size = 32, tone = "gradient", className, decorative = false }: Props) {
  // Distinct per instance so two marks on one page cannot share a gradient id,
  // and identical across server and client so hydration matches. React's ids
  // carry punctuation that has no business inside a `url(#…)`, so strip it.
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const bodyId = `pausepay-body-${id}`;
  const barsId = `pausepay-bars-${id}`;
  const fill = tone === "mono" ? "currentColor" : `url(#${bodyId})`;
  const barFill = tone === "mono" ? "#fff" : `url(#${barsId})`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      role={decorative ? "presentation" : "img"}
      aria-label={decorative ? undefined : "PausePay"}
      aria-hidden={decorative || undefined}
    >
      {tone === "gradient" && (
        <defs>
          <linearGradient id={bodyId} x1="5" y1="59" x2="54" y2="5" gradientUnits="userSpaceOnUse">
            <stop stopColor="#12A5F5" />
            <stop offset="0.42" stopColor="#2563EB" />
            <stop offset="1" stopColor="#4318C9" />
          </linearGradient>
          <linearGradient id={barsId} x1="26" y1="52" x2="46" y2="24" gradientUnits="userSpaceOnUse">
            <stop stopColor="#4C93FF" />
            <stop offset="1" stopColor="#7FB4FF" />
          </linearGradient>
        </defs>
      )}

      {/* Bowl — the shoulder, stopping well short of the stem's foot. */}
      <path d="M18 5h15c11.598 0 21 9.402 21 21s-9.402 21-21 21H18z" fill={fill} />

      {/* Stem — the long descender is what makes the silhouette read as "P". */}
      <rect x="5" y="5" width="15" height="54" rx="7.5" fill={fill} />

      {/* Pause bars — tinted, and dropping past the bowl to echo the descender. */}
      <g fill={barFill}>
        <rect x="26" y="24" width="8" height="28" rx="4" />
        <rect x="38" y="24" width="8" height="28" rx="4" />
      </g>
    </svg>
  );
}
