"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { getHealth } from "@/lib/api";
import type { HealthResponse } from "@/lib/types";

type Status = "checking" | "ok" | "down";

interface BackendState {
  status: Status;
  health: HealthResponse | null;
  refresh: () => void;
}

const BackendContext = createContext<BackendState>({ status: "checking", health: null, refresh: () => {} });

export function BackendProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Status>("checking");
  const [health, setHealth] = useState<HealthResponse | null>(null);

  const refresh = useCallback(() => {
    let cancelled = false;
    getHealth()
      .then((body) => {
        if (cancelled) return;
        setHealth(body);
        setStatus(body.status === "ok" ? "ok" : "down");
      })
      .catch(() => {
        if (!cancelled) setStatus("down");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const cancel = refresh();
    const timer = setInterval(refresh, 20000);
    return () => {
      cancel();
      clearInterval(timer);
    };
  }, [refresh]);

  return <BackendContext.Provider value={{ status, health, refresh }}>{children}</BackendContext.Provider>;
}

export function useBackend(): BackendState {
  return useContext(BackendContext);
}

export function BackendStatusPill() {
  const { status } = useBackend();
  const label = status === "ok" ? "Engine online" : status === "down" ? "Engine offline" : "Checking";
  return (
    <span className={`status-pill status-pill--${status}`} title="PausePay backend status" aria-live="polite">
      {label}
    </span>
  );
}
