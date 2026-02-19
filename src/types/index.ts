export type RiskBand = "Low" | "Medium" | "High" | "Critical";
export type InterventionTier = "Tier 0" | "Tier 1" | "Tier 2" | "Tier 3";
export type CustomerStatus = "Active" | "Under Intervention" | "Resolved";
export type AlertLevel = "critical" | "high" | "medium" | "low";
export type TxnChannel = "UPI" | "ATM" | "Card" | "NetBanking" | "Cash" | "AutoDebit";

export interface Transaction {
  transactionId: string;
  customerId: string;
  date: string;
  amount: number;
  type: "credit" | "debit";
  category: string;
  balance: number;
  merchant: string;
  channel: TxnChannel;
}

export interface UploadHistoryEntry {
  uploadId: string;
  timestamp: string;
  riskScore: number;
  band: RiskBand;
  txnCount: number;
}

export interface CustomerProfile {
  id: string;
  name: string;
  segment: "Salaried" | "Self-employed" | "Student" | "Retired";
  riskScore: number;
  band: RiskBand;
  predictedDefaultProbability: number;
  estimatedDaysToDelinquency: number;
  salaryDelayDays: number;
  salaryDropPercent: number;
  savingsDrawdownPercent: number;
  atmWithdrawalSpikeRatio: number;
  lendingAppTxnCount: number;
  utilityDelayDays: number;
  discretionarySpendDropPercent: number;
  failedAutoDebitCount: number;
  spendingVolatilityIndex: number;
  debtBurdenRatio: number;
  netCashflow: number;
  dataConfidenceScore: number;
  lastUpdated: string;
  recommendedInterventionTier: InterventionTier;
  recommendedInterventionText: string;
  flags: string[];
  notes: string;
  status: CustomerStatus;
  uploadHistory: UploadHistoryEntry[];
}

export interface AlertObject {
  alertId: string;
  customerId: string;
  level: AlertLevel;
  title: string;
  detail: string;
  signals: string[];
  createdAt: string;
  read: boolean;
  action: "Intervene" | "Review";
  priorityScore: number;
}

export interface InterventionLog {
  interventionId: string;
  customerId: string;
  tier: InterventionTier;
  channel: "SMS" | "Email" | "Call" | "App Notification";
  message: string;
  createdAt: string;
  status: "Triggered" | "Delivered" | "Acknowledged";
  operator: string;
}

export type AuditLogType =
  | "UPLOAD"
  | "RISK_SCORE"
  | "ALERT_GENERATED"
  | "INTERVENTION_TRIGGERED"
  | "CUSTOMER_UPDATED"
  | "RESET"
  | "LOGIN"
  | "LOGOUT";

export interface AuditLog {
  logId: string;
  type: AuditLogType;
  actor: string;
  description: string;
  timestamp: string;
  metadata: Record<string, unknown>;
}

export interface RiskDriver {
  driverName: string;
  featureKey: string;
  value: number;
  normalizedValue: number;
  contribution: number;
  explanation: string;
}

export interface RiskWeights {
  salaryDelay: number;
  salaryDrop: number;
  savingsDrawdown: number;
  utilityDelay: number;
  lendingAppSpike: number;
  atmSpike: number;
  discretionaryDrop: number;
  failedAutoDebit: number;
  volatility: number;
}

export interface SignalToggles {
  salaryDelay: boolean;
  salaryDrop: boolean;
  savingsDrawdown: boolean;
  utilityDelay: boolean;
  lendingAppSpike: boolean;
  atmSpike: boolean;
  discretionaryDrop: boolean;
  failedAutoDebit: boolean;
  volatility: boolean;
}

export interface AppSettings {
  weights: RiskWeights;
  signals: SignalToggles;
  theme: "light" | "dark";
}

export interface AppSession {
  loggedIn: boolean;
  user: { name: string; role: string };
}

export interface FeatureExtraction {
  salaryDelayDays: number;
  salaryDropPercent: number;
  savingsDrawdownPercent: number;
  utilityDelayDays: number;
  lendingAppTxnCount: number;
  atmWithdrawalSpikeRatio: number;
  discretionarySpendDropPercent: number;
  failedAutoDebitCount: number;
  spendingVolatilityIndex: number;
  debtBurdenRatio: number;
  netCashflow: number;
  gamblingSpendRatio: number;
  flags: string[];
}
