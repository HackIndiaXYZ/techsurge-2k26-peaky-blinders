/**
 * Mark + "PausePay" lockup, as used in the app headers in `assets/all/6-8.png`.
 *
 * The text is real type rather than outlines so it inherits the surface's
 * colour and stays legible when the user scales text up.
 */

import { PausePayMark } from "./PausePayMark";

interface Props {
  size?: number;
  className?: string;
  /** Dark surfaces (the warning overlay) need the label to invert. */
  inverted?: boolean;
}

export function PausePayWordmark({ size = 28, className, inverted = false }: Props) {
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      <PausePayMark size={size} decorative />
      <span
        className={`font-semibold tracking-[-0.02em] ${inverted ? "text-white" : "text-zinc-900"}`}
        style={{ fontSize: size * 0.82 }}
      >
        PausePay
      </span>
    </span>
  );
}
