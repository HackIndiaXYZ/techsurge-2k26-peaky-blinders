"use client";

import { useEffect, useState } from "react";
import { getHealth } from "@/lib/api";
import type { HealthResponse } from "@/lib/types";

/** Live model metrics from /api/health. Shows the honest "pending" state until the backend answers. */
export function ModelMetrics() {
  const [health, setHealth] = useState<HealthResponse | null | "down">(null);

  useEffect(() => {
    let cancelled = false;
    getHealth()
      .then((h) => {
        if (!cancelled) setHealth(h);
      })
      .catch(() => {
        if (!cancelled) setHealth("down");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (health === null || health === "down" || !health.metrics) {
    return (
      <div className="metrics-pending" role="note">
        <span>Evaluation status</span>
        <strong>{health === "down" ? "Backend offline — metrics are read from the trained model, never typed in" : "Loading measured metrics…"}</strong>
        <small>Run `python scripts/train_model.py` to regenerate them.</small>
      </div>
    );
  }

  const m = health.metrics;
  const pct = (v: number) => `${(v * 100).toFixed(1)}%`;
  return (
    <div className="metrics-pending" role="note">
      <span>Measured on {m.dataset_rows.toLocaleString("en-IN")} synthetic rows · {m.model_version}</span>
      <strong>
        Intent accuracy {pct(m.intent_accuracy)} · macro-F1 {pct(m.intent_f1_macro)} · scam precision {pct(m.fraud_precision)} / recall {pct(m.fraud_recall)}
        {m.holdout ? ` · hand-written holdout (${m.holdout.rows} msgs): intent ${pct(m.holdout.intent_accuracy)}, scam F1 ${pct(m.holdout.fraud_f1)}` : ""}
      </strong>
      <small>{m.avg_inference_latency_ms.toFixed(1)} ms / message · stratified 80/20 split</small>
    </div>
  );
}
