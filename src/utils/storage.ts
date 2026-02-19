import type {
  CustomerProfile,
  Transaction,
  AlertObject,
  InterventionLog,
  AuditLog,
  AppSettings,
  AppSession,
} from "@/types";

const KEYS = {
  session: "preDelinq_session",
  customers: "preDelinq_customers",
  transactions: "preDelinq_transactions",
  alerts: "preDelinq_alerts",
  interventions: "preDelinq_interventions",
  auditLogs: "preDelinq_auditLogs",
  settings: "preDelinq_settings",
};

function get<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function set(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

// Session
export const getSession = (): AppSession | null =>
  get<AppSession | null>(KEYS.session, null);
export const setSession = (s: AppSession) => set(KEYS.session, s);
export const clearSession = () => localStorage.removeItem(KEYS.session);

// Customers
export const getCustomers = (): CustomerProfile[] =>
  get<CustomerProfile[]>(KEYS.customers, []);
export const saveCustomers = (customers: CustomerProfile[]) =>
  set(KEYS.customers, customers);
export const upsertCustomer = (customer: CustomerProfile) => {
  const list = getCustomers();
  const idx = list.findIndex((c) => c.id === customer.id);
  if (idx >= 0) list[idx] = customer;
  else list.push(customer);
  saveCustomers(list);
};
export const getCustomerById = (id: string) =>
  getCustomers().find((c) => c.id === id) ?? null;

// Transactions
export const getAllTransactions = (): Record<string, Transaction[]> =>
  get<Record<string, Transaction[]>>(KEYS.transactions, {});
export const getTransactionsForCustomer = (cid: string): Transaction[] =>
  getAllTransactions()[cid] ?? [];
export const saveTransactionsForCustomer = (
  cid: string,
  txns: Transaction[]
) => {
  const all = getAllTransactions();
  all[cid] = txns;
  set(KEYS.transactions, all);
};

// Alerts
export const getAlerts = (): AlertObject[] =>
  get<AlertObject[]>(KEYS.alerts, []);
export const saveAlerts = (alerts: AlertObject[]) => set(KEYS.alerts, alerts);
export const addAlerts = (newAlerts: AlertObject[]) => {
  const existing = getAlerts();
  const combined = [...newAlerts, ...existing];
  saveAlerts(combined);
};
export const getUnreadAlertsCount = () =>
  getAlerts().filter((a) => !a.read).length;
export const markAlertRead = (alertId: string) => {
  const alerts = getAlerts().map((a) =>
    a.alertId === alertId ? { ...a, read: true } : a
  );
  saveAlerts(alerts);
};
export const markAllAlertsRead = () => {
  saveAlerts(getAlerts().map((a) => ({ ...a, read: true })));
};

// Interventions
export const getInterventions = (): InterventionLog[] =>
  get<InterventionLog[]>(KEYS.interventions, []);
export const saveInterventions = (i: InterventionLog[]) =>
  set(KEYS.interventions, i);
export const addInterventions = (items: InterventionLog[]) => {
  saveInterventions([...items, ...getInterventions()]);
};

// Audit logs
export const getAuditLogs = (): AuditLog[] =>
  get<AuditLog[]>(KEYS.auditLogs, []);
export const saveAuditLogs = (logs: AuditLog[]) =>
  set(KEYS.auditLogs, logs);
export const addAuditLog = (log: AuditLog) => {
  saveAuditLogs([log, ...getAuditLogs()]);
};

// Settings
const DEFAULT_SETTINGS: AppSettings = {
  weights: {
    salaryDelay: 0.18,
    salaryDrop: 0.12,
    savingsDrawdown: 0.18,
    utilityDelay: 0.08,
    lendingAppSpike: 0.12,
    atmSpike: 0.08,
    discretionaryDrop: 0.07,
    failedAutoDebit: 0.12,
    volatility: 0.05,
  },
  signals: {
    salaryDelay: true,
    salaryDrop: true,
    savingsDrawdown: true,
    utilityDelay: true,
    lendingAppSpike: true,
    atmSpike: true,
    discretionaryDrop: true,
    failedAutoDebit: true,
    volatility: true,
  },
  theme: "light",
};
export const getSettings = (): AppSettings =>
  get<AppSettings>(KEYS.settings, DEFAULT_SETTINGS);
export const saveSettings = (s: AppSettings) => set(KEYS.settings, s);

// Reset
export const resetAllData = () => {
  Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
};

export { KEYS };
