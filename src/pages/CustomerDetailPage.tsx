import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, AlertTriangle, Clock, TrendingUp, Activity,
  MessageSquare, CheckCircle, Download, Copy,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from "recharts";
import { useApp } from "@/hooks/useAppStore";
import { getTransactionsForCustomer, getInterventions, getAlerts, upsertCustomer, addInterventions } from "@/utils/storage";
import { generateExplainability, generateComplianceNarrative } from "@/utils/riskEngine";
import { generateInterventions } from "@/utils/interventionEngine";
import { log } from "@/utils/auditLogger";
import { RiskBadge } from "@/components/RiskBadge";
import { useToast } from "@/hooks/use-toast";

const BAND_COLORS: Record<string, string> = {
  Low: "#22c55e", Medium: "#f59e0b", High: "#f97316", Critical: "#ef4444",
};

const CAT_COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#f97316"];

export function CustomerDetailPage() {
  const { selectedCustomerId, customers, navigate, session, refreshCustomers } = useApp();
  const { toast } = useToast();
  const [showInterventionModal, setShowInterventionModal] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [notes, setNotes] = useState("");
  const [notesInit, setNotesInit] = useState(false);

  const customer = customers.find((c) => c.id === selectedCustomerId);

  if (!customer) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">No customer selected.</p>
        <button onClick={() => navigate("customers")} className="mt-3 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium">
          Go to Customers
        </button>
      </div>
    );
  }

  if (!notesInit) { setNotes(customer.notes); setNotesInit(true); }

  const txns = getTransactionsForCustomer(customer.id);
  const interventions = getInterventions().filter((i) => i.customerId === customer.id);
  const alerts = getAlerts().filter((a) => a.customerId === customer.id);
  const settings = { weights: { salaryDelay: 0.18, salaryDrop: 0.12, savingsDrawdown: 0.18, utilityDelay: 0.08, lendingAppSpike: 0.12, atmSpike: 0.08, discretionaryDrop: 0.07, failedAutoDebit: 0.12, volatility: 0.05 }, signals: { salaryDelay: true, salaryDrop: true, savingsDrawdown: true, utilityDelay: true, lendingAppSpike: true, atmSpike: true, discretionaryDrop: true, failedAutoDebit: true, volatility: true } };
  const features = {
    salaryDelayDays: customer.salaryDelayDays, salaryDropPercent: customer.salaryDropPercent,
    savingsDrawdownPercent: customer.savingsDrawdownPercent, utilityDelayDays: customer.utilityDelayDays,
    lendingAppTxnCount: customer.lendingAppTxnCount, atmWithdrawalSpikeRatio: customer.atmWithdrawalSpikeRatio,
    discretionarySpendDropPercent: customer.discretionarySpendDropPercent, failedAutoDebitCount: customer.failedAutoDebitCount,
    spendingVolatilityIndex: customer.spendingVolatilityIndex, debtBurdenRatio: customer.debtBurdenRatio,
    netCashflow: customer.netCashflow, gamblingSpendRatio: 0, flags: customer.flags,
  };
  const drivers = generateExplainability(features, settings.weights, settings.signals);
  const narrative = generateComplianceNarrative(customer.id, customer.band, drivers, customer.riskScore);

  // Charts data
  const balanceTrend = txns.slice(-60).map((t) => ({ date: t.date.slice(5), balance: t.balance }));
  const dailySpend: Record<string, number> = {};
  for (const t of txns.slice(-30)) if (t.type === "debit") dailySpend[t.date] = (dailySpend[t.date] ?? 0) + t.amount;
  const spendData = Object.entries(dailySpend).slice(-14).map(([date, amount]) => ({ date: date.slice(5), amount }));

  const catTotals: Record<string, number> = {};
  for (const t of txns.filter((x) => x.type === "debit")) catTotals[t.category] = (catTotals[t.category] ?? 0) + t.amount;
  const catData = Object.entries(catTotals).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([name, value]) => ({ name, value }));

  const triggerInterventions = async () => {
    setTriggering(true);
    await new Promise((r) => setTimeout(r, 2000));
    const ints = generateInterventions(customer, session?.user.name ?? "Analyst");
    addInterventions(ints);
    const updated = { ...customer, status: "Under Intervention" as const };
    upsertCustomer(updated);
    log("INTERVENTION_TRIGGERED", `Interventions triggered for ${customer.id}`, { tier: customer.recommendedInterventionTier, count: ints.length });
    refreshCustomers();
    setTriggering(false);
    setShowInterventionModal(false);
    toast({ title: "Interventions triggered successfully", description: `${ints.length} actions dispatched via ${customer.recommendedInterventionTier}` });
  };

  const saveNotes = () => {
    upsertCustomer({ ...customer, notes });
    log("CUSTOMER_UPDATED", `Notes updated for ${customer.id}`, {});
    toast({ title: "Notes saved" });
  };

  const scoreColor = customer.band === "Critical" ? "text-risk-critical" : customer.band === "High" ? "text-risk-high" : customer.band === "Medium" ? "text-risk-medium" : "text-risk-low";

  return (
    <div className="p-6 space-y-5 max-w-[1400px]">
      <button onClick={() => navigate("customers")} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Customers
      </button>

      {/* Header */}
      <div className="card-banking p-5">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-start gap-4">
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center font-bold text-xl text-white`}
              style={{ backgroundColor: BAND_COLORS[customer.band] }}>
              {customer.riskScore >= 0.75 ? "🆘" : customer.riskScore >= 0.55 ? "🚨" : customer.riskScore >= 0.3 ? "⚠️" : "✅"}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-lg font-bold text-foreground">{customer.id}</span>
                <RiskBadge band={customer.band} />
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${customer.status === "Active" ? "bg-risk-low-bg text-risk-low" : customer.status === "Under Intervention" ? "bg-risk-medium-bg text-risk-medium" : "bg-muted text-muted-foreground"}`}>
                  {customer.status}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">{customer.name} · {customer.segment}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Last updated: {new Date(customer.lastUpdated).toLocaleString()} · Confidence: {(customer.dataConfidenceScore * 100).toFixed(0)}%</p>
            </div>
          </div>
          <div className="flex items-center gap-6 flex-wrap">
            <div className="text-center">
              <p className={`text-3xl font-bold ${scoreColor}`}>{(customer.riskScore * 100).toFixed(0)}</p>
              <p className="text-[10px] text-muted-foreground">RISK SCORE</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-foreground">{customer.predictedDefaultProbability}%</p>
              <p className="text-[10px] text-muted-foreground">DEFAULT PROB</p>
            </div>
            <div className={`text-center ${customer.estimatedDaysToDelinquency <= 14 ? "text-risk-critical" : "text-foreground"}`}>
              <p className="text-3xl font-bold">{customer.estimatedDaysToDelinquency}</p>
              <p className="text-[10px] text-muted-foreground">DAYS LEFT</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left col */}
        <div className="space-y-4">
          {/* Signals */}
          <div className="card-banking p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Risk Signals</h3>
            <div className="space-y-2">
              {[
                { label: "Salary Delay", value: `${customer.salaryDelayDays.toFixed(1)}d`, warning: customer.salaryDelayDays > 3 },
                { label: "Savings Drawdown", value: `${customer.savingsDrawdownPercent.toFixed(1)}%`, warning: customer.savingsDrawdownPercent > 8 },
                { label: "Utility Delay", value: `${customer.utilityDelayDays.toFixed(1)}d`, warning: customer.utilityDelayDays > 4 },
                { label: "Lending App TXNs", value: `${customer.lendingAppTxnCount}`, warning: customer.lendingAppTxnCount >= 3 },
                { label: "ATM Spike Ratio", value: `${customer.atmWithdrawalSpikeRatio.toFixed(2)}x`, warning: customer.atmWithdrawalSpikeRatio > 1.7 },
                { label: "Disc. Spend Drop", value: `${customer.discretionarySpendDropPercent.toFixed(1)}%`, warning: customer.discretionarySpendDropPercent > 20 },
                { label: "Failed Auto-Debit", value: `${customer.failedAutoDebitCount}`, warning: customer.failedAutoDebitCount >= 1 },
                { label: "Debt Burden", value: `${(customer.debtBurdenRatio * 100).toFixed(0)}%`, warning: customer.debtBurdenRatio > 0.35 },
              ].map((s) => (
                <div key={s.label} className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{s.label}</span>
                  <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${s.warning ? "bg-risk-critical-bg text-risk-critical" : "bg-risk-low-bg text-risk-low"}`}>
                    {s.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Flags */}
          {customer.flags.length > 0 && (
            <div className="card-banking p-4">
              <h3 className="text-sm font-semibold text-foreground mb-2">Triggered Signals</h3>
              <div className="flex flex-wrap gap-1.5">
                {customer.flags.map((f) => (
                  <span key={f} className="text-[10px] font-mono px-2 py-0.5 rounded bg-risk-critical-bg text-risk-critical border border-risk-critical/20">
                    {f}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Intervention */}
          <div className="card-banking p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-foreground">Intervention</h3>
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-primary/10 text-primary">{customer.recommendedInterventionTier}</span>
            </div>
            <p className="text-xs text-muted-foreground mb-3">{customer.recommendedInterventionText}</p>
            {customer.status !== "Under Intervention" && (
              <button onClick={() => setShowInterventionModal(true)} className="w-full py-2 rounded-lg bg-risk-critical text-white text-xs font-semibold hover:opacity-90 transition-opacity">
                ⚡ Trigger All Interventions
              </button>
            )}
            {customer.status === "Under Intervention" && (
              <div className="flex items-center gap-2 text-xs text-risk-medium">
                <CheckCircle className="w-3.5 h-3.5" /> Interventions active
              </div>
            )}
          </div>

          {/* Intervention history */}
          {interventions.length > 0 && (
            <div className="card-banking p-4">
              <h3 className="text-sm font-semibold text-foreground mb-2">Intervention History</h3>
              <div className="space-y-2">
                {interventions.map((iv) => (
                  <div key={iv.interventionId} className="text-xs border-l-2 border-primary pl-3">
                    <p className="font-semibold text-foreground">{iv.channel}</p>
                    <p className="text-muted-foreground text-[10px]">{new Date(iv.createdAt).toLocaleString()}</p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${iv.status === "Triggered" ? "bg-risk-medium-bg text-risk-medium" : "bg-risk-low-bg text-risk-low"}`}>
                      {iv.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="card-banking p-4">
            <h3 className="text-sm font-semibold text-foreground mb-2">Notes</h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full text-xs rounded-lg border border-input bg-background text-foreground p-2 resize-none focus:outline-none focus:ring-1 focus:ring-ring"
              placeholder="Add analyst notes…"
            />
            <button onClick={saveNotes} className="mt-2 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary-glow transition-colors">
              Save Notes
            </button>
          </div>
        </div>

        {/* Right col */}
        <div className="lg:col-span-2 space-y-4">
          {/* Balance trend */}
          <div className="card-banking p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Account Balance Trend</h3>
            {balanceTrend.length > 1 ? (
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={balanceTrend}>
                  <XAxis dataKey="date" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 9 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} />
                  <Tooltip formatter={(v: number) => [`₹${v.toLocaleString()}`, "Balance"]} />
                  <Line type="monotone" dataKey="balance" stroke="#3b82f6" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : <div className="h-[180px] flex items-center justify-center text-muted-foreground text-xs">Insufficient data</div>}
          </div>

          {/* Spending + Category */}
          <div className="grid grid-cols-2 gap-4">
            <div className="card-banking p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">Daily Spend (14d)</h3>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={spendData}>
                  <XAxis dataKey="date" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 9 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} />
                  <Tooltip formatter={(v: number) => [`₹${v.toLocaleString()}`, "Spend"]} />
                  <Bar dataKey="amount" fill="#ef4444" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="card-banking p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">Category Distribution</h3>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={catData} cx="50%" cy="50%" innerRadius={30} outerRadius={55} dataKey="value" paddingAngle={2}>
                    {catData.map((_, i) => <Cell key={i} fill={CAT_COLORS[i % CAT_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => [`₹${v.toLocaleString()}`, "Amount"]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Explainability */}
          <div className="card-banking p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Top Risk Drivers (SHAP-inspired)</h3>
            <div className="space-y-2.5">
              {drivers.map((d) => (
                <div key={d.featureKey}>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs font-medium text-foreground">{d.driverName}</span>
                    <span className="text-xs font-mono text-muted-foreground">{(d.contribution * 100).toFixed(1)}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${Math.min(d.contribution / 0.18 * 100, 100)}%` }} />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{d.explanation}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 p-3 rounded-lg bg-muted/50 border border-border">
              <p className="text-[10px] text-muted-foreground leading-relaxed">{narrative}</p>
            </div>
            <button
              onClick={() => { navigator.clipboard.writeText(narrative); toast({ title: "Copied to clipboard" }); }}
              className="mt-2 flex items-center gap-1.5 text-xs text-primary hover:underline"
            >
              <Copy className="w-3 h-3" /> Copy Compliance Explanation
            </button>
          </div>

          {/* Upload history */}
          {customer.uploadHistory.length > 1 && (
            <div className="card-banking p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">Risk Score History</h3>
              <ResponsiveContainer width="100%" height={120}>
                <LineChart data={customer.uploadHistory.map((h) => ({ date: h.timestamp.slice(0, 10), score: Math.round(h.riskScore * 100) }))}>
                  <XAxis dataKey="date" tick={{ fontSize: 9 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 9 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="score" stroke="#f97316" strokeWidth={2} dot />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Intervention Modal */}
      <AnimatePresence>
        {showInterventionModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-card rounded-2xl border border-border p-6 max-w-sm w-full shadow-2xl">
              {triggering ? (
                <div className="text-center py-4">
                  <svg className="animate-spin w-8 h-8 text-primary mx-auto mb-3" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <p className="font-semibold text-foreground">Dispatching interventions…</p>
                </div>
              ) : (
                <>
                  <h3 className="font-bold text-foreground mb-2">Confirm Intervention</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Trigger <strong>{customer.recommendedInterventionTier}</strong> interventions for customer <strong>{customer.id}</strong>?
                  </p>
                  <div className="flex gap-3">
                    <button onClick={triggerInterventions} className="flex-1 py-2 rounded-lg bg-risk-critical text-white text-sm font-semibold hover:opacity-90 transition-opacity">
                      Confirm
                    </button>
                    <button onClick={() => setShowInterventionModal(false)} className="flex-1 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors text-foreground">
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
