"use client";

import { useEffect, useRef } from "react";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  children: React.ReactNode;
  /** When true the scrim click and Escape are ignored (used for decisions the user must make explicitly). */
  blocking?: boolean;
}

/** Native-feeling bottom sheet: scrim, slide-up, Escape to dismiss, focus moved inside on open. */
export function BottomSheet({ open, onClose, labelledBy, children, blocking = false }: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const focusable = sheetRef.current?.querySelector<HTMLElement>("button, [href], input, textarea, [tabindex]:not([tabindex='-1'])");
    focusable?.focus();

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape" && !blocking) onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previouslyFocused?.focus?.();
    };
  }, [open, onClose, blocking]);

  if (!open) return null;

  return (
    <div
      className="sheet-scrim"
      onClick={(event) => {
        if (event.target === event.currentTarget && !blocking) onClose();
      }}
    >
      <div className="sheet" role="dialog" aria-modal="true" aria-labelledby={labelledBy} ref={sheetRef}>
        <div className="sheet__grip" aria-hidden="true" />
        {children}
      </div>
    </div>
  );
}
