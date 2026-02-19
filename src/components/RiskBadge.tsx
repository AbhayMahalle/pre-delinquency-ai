import React from "react";
import type { RiskBand } from "@/types";

interface Props {
  band: RiskBand;
  className?: string;
}

const BAND_CLASSES: Record<RiskBand, string> = {
  Low: "risk-badge-low",
  Medium: "risk-badge-medium",
  High: "risk-badge-high",
  Critical: "risk-badge-critical",
};

const DOTS: Record<RiskBand, string> = {
  Low: "bg-risk-low",
  Medium: "bg-risk-medium",
  High: "bg-risk-high",
  Critical: "bg-risk-critical",
};

export function RiskBadge({ band, className = "" }: Props) {
  return (
    <span className={`${BAND_CLASSES[band]} ${className}`}>
      <span className={`inline-block w-1.5 h-1.5 rounded-full ${DOTS[band]}`} />
      {band}
    </span>
  );
}

export function RiskScoreBar({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color =
    score < 0.3
      ? "bg-risk-low"
      : score < 0.55
      ? "bg-risk-medium"
      : score < 0.75
      ? "bg-risk-high"
      : "bg-risk-critical";

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-mono font-semibold text-foreground w-8">
        {pct}%
      </span>
    </div>
  );
}
