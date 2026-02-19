import type {
  FeatureExtraction,
  RiskBand,
  InterventionTier,
  RiskDriver,
  RiskWeights,
  SignalToggles,
} from "@/types";

const DRIVER_META: Record<
  string,
  {
    name: string;
    unit: string;
    explanation: (v: number) => string;
  }
> = {
  salaryDelay: {
    name: "Salary Delay",
    unit: "days",
    explanation: (v) =>
      `Salary credited ${v.toFixed(1)} days later than baseline. Delayed income inflow is a strong predictor of missed payments.`,
  },
  salaryDrop: {
    name: "Salary Drop",
    unit: "%",
    explanation: (v) =>
      `Salary amount dropped by ${v.toFixed(1)}%. A significant income reduction often precedes financial stress.`,
  },
  savingsDrawdown: {
    name: "Savings Drawdown",
    unit: "%",
    explanation: (v) =>
      `Account balance eroded by ${v.toFixed(1)}% week-over-week, indicating depletion of liquidity cushion.`,
  },
  utilityDelay: {
    name: "Utility Payment Delay",
    unit: "days",
    explanation: (v) =>
      `Utility bills paid ${v.toFixed(1)} days later than usual. Delayed essential payments signal cash scarcity.`,
  },
  lendingAppSpike: {
    name: "Lending App Activity",
    unit: "txns",
    explanation: (v) =>
      `${v.toFixed(0)} lending app transactions in last 14 days, suggesting active borrowing to cover expenses.`,
  },
  atmSpike: {
    name: "ATM Cash Spike",
    unit: "ratio",
    explanation: (v) =>
      `ATM withdrawals ${v.toFixed(2)}x above baseline. Cash hoarding behavior associated with financial anxiety.`,
  },
  discretionaryDrop: {
    name: "Discretionary Spend Drop",
    unit: "%",
    explanation: (v) =>
      `Discretionary spending fell ${v.toFixed(1)}%. Customers cut non-essentials before missing debt payments.`,
  },
  failedAutoDebit: {
    name: "Missed Repayment Risk",
    unit: "count",
    explanation: (v) =>
      `${v.toFixed(0)} expected loan repayment(s) not detected. Auto-debit failures are a direct delinquency signal.`,
  },
  volatility: {
    name: "Spending Volatility",
    unit: "index",
    explanation: (v) =>
      `Spending volatility index of ${v.toFixed(2)}. Erratic cash flows indicate financial instability.`,
  },
};

export function normalize(features: FeatureExtraction): Record<string, number> {
  return {
    salaryDelay: Math.min(features.salaryDelayDays / 10, 1),
    salaryDrop: Math.min(features.salaryDropPercent / 40, 1),
    savingsDrawdown: Math.min(features.savingsDrawdownPercent / 30, 1),
    utilityDelay: Math.min(features.utilityDelayDays / 10, 1),
    lendingAppSpike: Math.min(features.lendingAppTxnCount / 8, 1),
    atmSpike: Math.min(features.atmWithdrawalSpikeRatio / 3, 1),
    discretionaryDrop: Math.min(features.discretionarySpendDropPercent / 50, 1),
    failedAutoDebit: Math.min(features.failedAutoDebitCount / 2, 1),
    volatility: Math.min(features.spendingVolatilityIndex / 2, 1),
  };
}

export function calculateRiskScore(
  features: FeatureExtraction,
  weights: RiskWeights,
  signals: SignalToggles
): number {
  const norm = normalize(features);
  let score = 0;
  score += signals.salaryDelay ? norm.salaryDelay * weights.salaryDelay : 0;
  score += signals.salaryDrop ? norm.salaryDrop * weights.salaryDrop : 0;
  score += signals.savingsDrawdown ? norm.savingsDrawdown * weights.savingsDrawdown : 0;
  score += signals.utilityDelay ? norm.utilityDelay * weights.utilityDelay : 0;
  score += signals.lendingAppSpike ? norm.lendingAppSpike * weights.lendingAppSpike : 0;
  score += signals.atmSpike ? norm.atmSpike * weights.atmSpike : 0;
  score += signals.discretionaryDrop ? norm.discretionaryDrop * weights.discretionaryDrop : 0;
  score += signals.failedAutoDebit ? norm.failedAutoDebit * weights.failedAutoDebit : 0;
  score += signals.volatility ? norm.volatility * weights.volatility : 0;
  return Math.max(0, Math.min(1, score));
}

export function getBand(score: number): RiskBand {
  if (score < 0.3) return "Low";
  if (score < 0.55) return "Medium";
  if (score < 0.75) return "High";
  return "Critical";
}

export function getInterventionTier(band: RiskBand): InterventionTier {
  switch (band) {
    case "Low": return "Tier 0";
    case "Medium": return "Tier 1";
    case "High": return "Tier 2";
    case "Critical": return "Tier 3";
  }
}

export function getDaysToDelinquency(riskScore: number): number {
  // Deterministic based on score
  return Math.round(28 - riskScore * 14);
}

export function generateExplainability(
  features: FeatureExtraction,
  weights: RiskWeights,
  signals: SignalToggles
): RiskDriver[] {
  const norm = normalize(features);
  const rawValues: Record<string, number> = {
    salaryDelay: features.salaryDelayDays,
    salaryDrop: features.salaryDropPercent,
    savingsDrawdown: features.savingsDrawdownPercent,
    utilityDelay: features.utilityDelayDays,
    lendingAppSpike: features.lendingAppTxnCount,
    atmSpike: features.atmWithdrawalSpikeRatio,
    discretionaryDrop: features.discretionarySpendDropPercent,
    failedAutoDebit: features.failedAutoDebitCount,
    volatility: features.spendingVolatilityIndex,
  };
  const weightMap: Record<string, number> = {
    salaryDelay: weights.salaryDelay,
    salaryDrop: weights.salaryDrop,
    savingsDrawdown: weights.savingsDrawdown,
    utilityDelay: weights.utilityDelay,
    lendingAppSpike: weights.lendingAppSpike,
    atmSpike: weights.atmSpike,
    discretionaryDrop: weights.discretionaryDrop,
    failedAutoDebit: weights.failedAutoDebit,
    volatility: weights.volatility,
  };
  const signalMap: Record<string, boolean> = {
    salaryDelay: signals.salaryDelay,
    salaryDrop: signals.salaryDrop,
    savingsDrawdown: signals.savingsDrawdown,
    utilityDelay: signals.utilityDelay,
    lendingAppSpike: signals.lendingAppSpike,
    atmSpike: signals.atmSpike,
    discretionaryDrop: signals.discretionaryDrop,
    failedAutoDebit: signals.failedAutoDebit,
    volatility: signals.volatility,
  };

  const drivers: RiskDriver[] = Object.keys(DRIVER_META)
    .filter((k) => signalMap[k])
    .map((k) => {
      const nv = norm[k] ?? 0;
      const w = weightMap[k] ?? 0;
      const contribution = nv * w;
      const meta = DRIVER_META[k];
      return {
        driverName: meta.name,
        featureKey: k,
        value: rawValues[k] ?? 0,
        normalizedValue: nv,
        contribution,
        explanation: meta.explanation(rawValues[k] ?? 0),
      };
    });

  return drivers.sort((a, b) => b.contribution - a.contribution).slice(0, 5);
}

export function generateComplianceNarrative(
  customerId: string,
  band: RiskBand,
  drivers: RiskDriver[],
  riskScore: number
): string {
  const topDriverNames = drivers.slice(0, 3).map((d) => d.driverName.toLowerCase()).join(", ");
  const tierMap: Record<RiskBand, string> = {
    Low: "Tier 0 (No Immediate Action)",
    Medium: "Tier 1 (Soft Intervention)",
    High: "Tier 2 (Proactive Restructuring)",
    Critical: "Tier 3 (Urgent Human Outreach)",
  };
  return `Customer ${customerId} has been classified as ${band.toUpperCase()} risk with a composite risk score of ${(riskScore * 100).toFixed(1)}/100. ` +
    `The primary risk drivers are: ${topDriverNames}. ` +
    `This assessment was generated using a weighted ensemble of behavioral financial signals with full feature transparency. ` +
    `Recommended intervention: ${tierMap[band]}. ` +
    `No protected demographic attributes were used in this scoring. ` +
    `A human review is required before any credit action. This report is generated in compliance with model explainability requirements.`;
}
