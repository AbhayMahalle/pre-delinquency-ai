import type {
  CustomerProfile,
  AlertObject,
  AlertLevel,
  InterventionLog,
  InterventionTier,
} from "@/types";

function genId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

export function generateAlerts(customer: CustomerProfile): AlertObject[] {
  const alerts: AlertObject[] = [];
  const now = new Date().toISOString();

  const createAlert = (
    level: AlertLevel,
    title: string,
    detail: string,
    signals: string[],
    action: "Intervene" | "Review"
  ): AlertObject => ({
    alertId: genId("ALT"),
    customerId: customer.id,
    level,
    title,
    detail,
    signals,
    createdAt: now,
    read: false,
    action,
    priorityScore: Math.round(
      customer.riskScore * 100 +
        customer.failedAutoDebitCount * 20 +
        customer.salaryDelayDays * 2
    ),
  });

  // Band-level alerts
  if (customer.band === "Critical") {
    alerts.push(
      createAlert(
        "critical",
        `Critical Delinquency Risk — ${customer.id}`,
        `Customer risk score is ${(customer.riskScore * 100).toFixed(0)}/100. Estimated ${customer.estimatedDaysToDelinquency} days to potential default.`,
        customer.flags,
        "Intervene"
      )
    );
  } else if (customer.band === "High") {
    alerts.push(
      createAlert(
        "high",
        `High Risk Detected — ${customer.id}`,
        `Customer shows multiple stress signals. Risk score: ${(customer.riskScore * 100).toFixed(0)}/100.`,
        customer.flags,
        "Intervene"
      )
    );
  }

  // Specific signal alerts
  if (customer.salaryDelayDays > 5) {
    alerts.push(
      createAlert(
        "high",
        "Salary Delay Spike Detected",
        `Salary credited ${customer.salaryDelayDays.toFixed(1)} days late. Baseline breached significantly.`,
        ["Salary Delay Signal"],
        "Intervene"
      )
    );
  }

  if (customer.failedAutoDebitCount >= 1) {
    alerts.push(
      createAlert(
        "critical",
        "Auto-Debit Failure Risk",
        `${customer.failedAutoDebitCount} expected repayment(s) not detected. Immediate intervention required.`,
        ["Repayment Missed Risk"],
        "Intervene"
      )
    );
  }

  if (customer.lendingAppTxnCount >= 4) {
    alerts.push(
      createAlert(
        "high",
        "Borrowing App Dependence",
        `${customer.lendingAppTxnCount} lending app transactions in 14 days. Customer may be bridging income gaps with informal credit.`,
        ["Lending App Spike"],
        "Intervene"
      )
    );
  }

  if (customer.savingsDrawdownPercent > 15) {
    alerts.push(
      createAlert(
        "high",
        "Savings Drain Detected",
        `Account balance eroded by ${customer.savingsDrawdownPercent.toFixed(1)}% week-over-week.`,
        ["Savings Drawdown Signal"],
        "Review"
      )
    );
  }

  if (customer.netCashflow < 0) {
    alerts.push(
      createAlert(
        "medium",
        "Negative Cashflow Detected",
        `Customer spent more than received in the last 30 days. Net cashflow: ₹${customer.netCashflow.toFixed(0)}.`,
        ["Negative Cashflow"],
        "Review"
      )
    );
  }

  if (customer.debtBurdenRatio > 0.4) {
    alerts.push(
      createAlert(
        "medium",
        "High Debt-to-Income Ratio",
        `Debt burden ratio of ${(customer.debtBurdenRatio * 100).toFixed(0)}% exceeds safe threshold of 35%.`,
        ["High Debt Burden"],
        "Review"
      )
    );
  }

  return alerts;
}

const INTERVENTIONS_BY_TIER: Record<
  InterventionTier,
  Array<{ channel: InterventionLog["channel"]; message: string }>
> = {
  "Tier 0": [],
  "Tier 1": [
    {
      channel: "SMS",
      message:
        "Friendly reminder: Your EMI of ₹{amount} is due on {date}. Ensure your account has sufficient balance.",
    },
    {
      channel: "App Notification",
      message:
        "📊 Your personalized budgeting report is ready. View insights to improve financial health.",
    },
    {
      channel: "Email",
      message:
        "We've prepared a savings plan tailored to your income pattern. Explore options in your app.",
    },
  ],
  "Tier 2": [
    {
      channel: "SMS",
      message:
        "We understand you may need flexibility. You can shift your EMI date by up to 7 days. Call us or use the app.",
    },
    {
      channel: "App Notification",
      message:
        "Partial payment option now enabled for your account. Pay what you can today to avoid penalties.",
    },
    {
      channel: "Email",
      message:
        "Based on your spending patterns, we recommend a temporary credit limit adjustment to help manage your finances.",
    },
  ],
  "Tier 3": [
    {
      channel: "Call",
      message:
        "A relationship manager will call you within 24 hours to discuss a payment restructuring plan.",
    },
    {
      channel: "SMS",
      message:
        "You are eligible for a 1-month payment holiday. No penalties will apply. Contact us to activate.",
    },
    {
      channel: "Email",
      message:
        "We've prepared a debt restructuring proposal based on your financial situation. Review it in your portal.",
    },
  ],
};

export function generateInterventions(
  customer: CustomerProfile,
  operator: string
): InterventionLog[] {
  const templates = INTERVENTIONS_BY_TIER[customer.recommendedInterventionTier];
  return templates.map((t) => ({
    interventionId: genId("INT"),
    customerId: customer.id,
    tier: customer.recommendedInterventionTier,
    channel: t.channel,
    message: t.message,
    createdAt: new Date().toISOString(),
    status: "Triggered" as const,
    operator,
  }));
}

export function getInterventionText(tier: InterventionTier): string {
  const map: Record<InterventionTier, string> = {
    "Tier 0": "No immediate action required. Continue monitoring.",
    "Tier 1":
      "Soft digital nudge: Send budgeting insights, EMI reminder via SMS and App Notification.",
    "Tier 2":
      "Offer flexible EMI date shift, enable partial payment, and adjust credit limit temporarily.",
    "Tier 3":
      "Assign relationship manager call, offer payment holiday, initiate debt restructuring plan.",
  };
  return map[tier];
}
