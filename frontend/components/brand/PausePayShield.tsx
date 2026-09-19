/**
 * The shield lockup from `assets/all/8.png` — the mark held inside a pale
 * shield, used on outcome screens ("Payment cancelled") and the PausePay app's
 * protection-active state.
 *
 * `rays` draws the radiating strokes from the mockup; drop them when the
 * shield sits inline next to body copy, where they read as visual noise.
 */

import { PausePayMark } from "./PausePayMark";

interface Props {
  size?: number;
  rays?: boolean;
  /** Renders the blue confirmation tick from the cancelled-payment screen. */
  check?: boolean;
  className?: string;
}

export function PausePayShield({ size = 140, rays = true, check = false, className }: Props) {
  return (
    <div
      className={`relative shrink-0 ${className ?? ""}`}
      style={{ width: size, height: size }}
      role="presentation"
    >
      <svg viewBox="0 0 120 120" fill="none" className="absolute inset-0 h-full w-full">
        {rays && (
          <g stroke="#BFD8FA" strokeWidth="4" strokeLinecap="round" opacity="0.85">
            <path d="M6 30 L18 37" />
            <path d="M1 56 L15 56" />
            <path d="M6 82 L18 75" />
            <path d="M114 30 L102 37" />
            <path d="M119 56 L105 56" />
            <path d="M114 82 L102 75" />
          </g>
        )}
        {/* Shield body — a flat pale fill so the mark stays the focal point. */}
        <path
          d="M60 10 L96 24 v30 c0 22-15 38-36 46-21-8-36-24-36-46V24z"
          fill="#DCEAFD"
          stroke="#C3DCFB"
          strokeWidth="1.5"
        />
      </svg>

      <div className="absolute inset-0 grid place-items-center">
        <PausePayMark size={size * 0.34} decorative />
      </div>

      {check && (
        <svg
          viewBox="0 0 32 32"
          fill="none"
          className="absolute"
          style={{ width: size * 0.3, height: size * 0.3, right: size * 0.1, bottom: size * 0.18 }}
        >
          <circle cx="16" cy="16" r="15" fill="#1A73E8" stroke="#fff" strokeWidth="2" />
          <path d="M10 16.5l4 4 8-8.5" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </div>
  );
}
