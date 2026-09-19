"use client";

/**
 * Shared demo session — the thread that ties the three apps together.
 *
 * Inbox captures the message context, FLOW captures the payment and the
 * assessment, PausePay reads both back. Without this the three apps would be
 * three unrelated screens; with it they are one investigation seen from three
 * places.
 *
 * Deliberately client-only. The backend is already the source of truth (every
 * analysis and verification is persisted and has an id) — this holds the
 * *full* responses so PausePay can show detail the list endpoints omit.
 *
 * Specifically: `/api/dashboard` returns `PaymentVerificationOut`, which
 * carries `reasons` but not the weighted `signals`. Those only exist on the
 * live `verify-payee` response, so a check evaluated in this session shows its
 * full score breakdown and an older one falls back to reasons. See
 * `Backend/schemas/api.py` (PaymentVerificationOut) if that gap ever closes.
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { AnalyzeMessageResponse, UserAction, VerifyPayeeResponse } from "./types";

const STORAGE_KEY = "pausepay.demo-session.v1";

export interface MessageContext {
  conversationId: string;
  senderName: string;
  senderHandle: string;
  messageId: string;
  text: string;
  /** Wall-clock capture time, used for the "request arrived N seconds earlier" cue. */
  capturedAt: string;
  analysis: AnalyzeMessageResponse;
}

interface SessionState {
  messageContext: MessageContext | null;
  /** Keyed by verification_id. */
  assessments: Record<number, VerifyPayeeResponse>;
  decisions: Record<number, { action: UserAction; at: string }>;
  lastVerificationId: number | null;
}

const EMPTY: SessionState = {
  messageContext: null,
  assessments: {},
  decisions: {},
  lastVerificationId: null,
};

interface DemoSessionValue extends SessionState {
  captureMessage: (context: MessageContext) => void;
  captureAssessment: (assessment: VerifyPayeeResponse) => void;
  recordDecision: (verificationId: number, action: UserAction) => void;
  /** Seconds between the message landing and the payment being assessed. */
  latencySeconds: (assessedAt: string) => number | null;
  reset: () => void;
}

const DemoSessionContext = createContext<DemoSessionValue | null>(null);

function read(): SessionState {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    return raw ? { ...EMPTY, ...(JSON.parse(raw) as SessionState) } : EMPTY;
  } catch {
    // A corrupt or unreadable store must never break the demo.
    return EMPTY;
  }
}

export function DemoSessionProvider({ children }: { children: React.ReactNode }) {
  // Starts empty on both server and client so hydration matches; the stored
  // session is adopted on mount.
  const [state, setState] = useState<SessionState>(EMPTY);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(read());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Private-mode quota errors are not worth surfacing.
    }
  }, [state, hydrated]);

  const captureMessage = useCallback((context: MessageContext) => {
    setState((prev) => ({ ...prev, messageContext: context }));
  }, []);

  const captureAssessment = useCallback((assessment: VerifyPayeeResponse) => {
    setState((prev) => ({
      ...prev,
      assessments: { ...prev.assessments, [assessment.verification_id]: assessment },
      lastVerificationId: assessment.verification_id,
    }));
  }, []);

  const recordDecision = useCallback((verificationId: number, action: UserAction) => {
    setState((prev) => ({
      ...prev,
      decisions: { ...prev.decisions, [verificationId]: { action, at: new Date().toISOString() } },
    }));
  }, []);

  const reset = useCallback(() => setState(EMPTY), []);

  const latencySeconds = useCallback(
    (assessedAt: string) => {
      const captured = state.messageContext?.capturedAt;
      if (!captured) return null;
      const delta = (new Date(assessedAt).getTime() - new Date(captured).getTime()) / 1000;
      return Number.isFinite(delta) && delta >= 0 ? Math.round(delta) : null;
    },
    [state.messageContext],
  );

  const value = useMemo<DemoSessionValue>(
    () => ({ ...state, captureMessage, captureAssessment, recordDecision, latencySeconds, reset }),
    [state, captureMessage, captureAssessment, recordDecision, latencySeconds, reset],
  );

  return <DemoSessionContext.Provider value={value}>{children}</DemoSessionContext.Provider>;
}

export function useDemoSession(): DemoSessionValue {
  const ctx = useContext(DemoSessionContext);
  if (!ctx) throw new Error("useDemoSession must be used inside <DemoSessionProvider>");
  return ctx;
}
