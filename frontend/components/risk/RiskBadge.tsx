import { CircleAlert, ShieldCheck, TriangleAlert } from "lucide-react";
import type { IdentifierBand, RiskBand } from "@/lib/types";
import { identifierBandLabel, identifierBandToLevel } from "@/lib/utils";

export function RiskPill({ band, score, compact = false }: { band: RiskBand; score?: number; compact?: boolean }) {
  const level = band.toLowerCase();
  const Icon = band === "HIGH" ? TriangleAlert : band === "MEDIUM" ? CircleAlert : ShieldCheck;
  const text = band === "HIGH" ? "High risk" : band === "MEDIUM" ? "Review" : "Low risk";
  return (
    <span className={`risk-pill risk-pill--${level}`}>
      <Icon size={12} aria-hidden="true" />
      {compact ? text : `${text}${score !== undefined ? ` · ${score}/100` : ""}`}
    </span>
  );
}

export function IdentifierPill({ band }: { band: IdentifierBand }) {
  const level = identifierBandToLevel(band);
  const cls = level === "none" ? "none" : level.toLowerCase();
  return <span className={`risk-pill risk-pill--${cls}`}>{identifierBandLabel[band]}</span>;
}

export function ScoreLockup({ score, band }: { score: number; band: RiskBand }) {
  const level = band.toLowerCase();
  return (
    <div className={`score-lockup score-lockup--${level}`} aria-label={`Risk score ${score} out of 100`}>
      <strong>{score}</strong>
      <small>/100</small>
    </div>
  );
}

export function ScoreBar({ score, band }: { score: number; band: RiskBand }) {
  return (
    <div className={`score-bar score-bar--${band.toLowerCase()}`} role="presentation">
      <span style={{ width: `${Math.max(2, Math.min(100, score))}%` }} />
    </div>
  );
}
