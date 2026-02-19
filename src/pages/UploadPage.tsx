import React, { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, CheckCircle, XCircle, AlertCircle, ChevronRight, Download } from "lucide-react";
import { useApp } from "@/hooks/useAppStore";
import { parseCSV } from "@/utils/csvParser";
import { extractFeatures, detectSegment, computeDataConfidence } from "@/utils/featureExtractor";
import { calculateRiskScore, getBand, getInterventionTier, getDaysToDelinquency, generateExplainability } from "@/utils/riskEngine";
import { generateAlerts } from "@/utils/interventionEngine";
import { getInterventionText } from "@/utils/interventionEngine";
import { upsertCustomer, saveTransactionsForCustomer, addAlerts, getSettings, getCustomerById } from "@/utils/storage";
import { log } from "@/utils/auditLogger";
import { useToast } from "@/hooks/use-toast";
import type { CustomerProfile, Transaction } from "@/types";
import { downloadCSV } from "@/utils/csvGenerator";

const STEPS = [
  "Parsing CSV",
  "Cleaning & Normalizing Data",
  "Extracting Risk Features",
  "Scoring Delinquency Risk",
  "Generating Alerts & Interventions",
  "Saving Customer Portfolio",
];

export function UploadPage() {
  const { navigate, refreshCustomers, refreshAlerts, session } = useApp();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [txns, setTxns] = useState<Transaction[]>([]);
  const [processing, setProcessing] = useState(false);
  const [step, setStep] = useState(-1);
  const [doneCustomer, setDoneCustomer] = useState<CustomerProfile | null>(null);

  const processFile = useCallback(async (f: File) => {
    setFile(f);
    setErrors([]);
    setWarnings([]);
    setTxns([]);
    setDoneCustomer(null);
    const text = await f.text();
    const result = parseCSV(text);
    setErrors(result.errors);
    setWarnings(result.warnings);
    setTxns(result.transactions);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f && f.name.endsWith(".csv")) processFile(f);
  }, [processFile]);

  const runPipeline = async () => {
    if (!txns.length) return;
    setProcessing(true);
    const settings = getSettings();
    const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

    for (let i = 0; i < STEPS.length; i++) {
      setStep(i);
      await delay(350);
    }

    const customerId = txns[0].customerId;
    const features = extractFeatures(txns);
    const riskScore = calculateRiskScore(features, settings.weights, settings.signals);
    const band = getBand(riskScore);
    const tier = getInterventionTier(band);
    const days = getDaysToDelinquency(riskScore);
    const segment = detectSegment(txns);
    const confidence = computeDataConfidence(txns);
    const existing = getCustomerById(customerId);

    // Generate name
    const names = ["Arjun Sharma", "Priya Patel", "Vikram Mehta", "Sneha Rao", "Rahul Gupta"];
    const nameIdx = customerId.charCodeAt(customerId.length - 1) % names.length;

    const uploadEntry = {
      uploadId: `UP-${Date.now()}`,
      timestamp: new Date().toISOString(),
      riskScore,
      band,
      txnCount: txns.length,
    };

    const customer: CustomerProfile = {
      id: customerId,
      name: existing?.name ?? names[nameIdx],
      segment,
      riskScore,
      band,
      predictedDefaultProbability: Math.round(riskScore * 100),
      estimatedDaysToDelinquency: days,
      salaryDelayDays: features.salaryDelayDays,
      salaryDropPercent: features.salaryDropPercent,
      savingsDrawdownPercent: features.savingsDrawdownPercent,
      atmWithdrawalSpikeRatio: features.atmWithdrawalSpikeRatio,
      lendingAppTxnCount: features.lendingAppTxnCount,
      utilityDelayDays: features.utilityDelayDays,
      discretionarySpendDropPercent: features.discretionarySpendDropPercent,
      failedAutoDebitCount: features.failedAutoDebitCount,
      spendingVolatilityIndex: features.spendingVolatilityIndex,
      debtBurdenRatio: features.debtBurdenRatio,
      netCashflow: features.netCashflow,
      dataConfidenceScore: confidence,
      lastUpdated: new Date().toISOString(),
      recommendedInterventionTier: tier,
      recommendedInterventionText: getInterventionText(tier),
      flags: features.flags,
      notes: existing?.notes ?? "",
      status: existing?.status ?? "Active",
      uploadHistory: [...(existing?.uploadHistory ?? []), uploadEntry],
    };

    upsertCustomer(customer);
    saveTransactionsForCustomer(customerId, txns);
    const newAlerts = generateAlerts(customer);
    addAlerts(newAlerts);

    log("UPLOAD", `CSV uploaded for customer ${customerId}`, { txnCount: txns.length, fileName: file?.name });
    log("RISK_SCORE", `Risk scored: ${customerId} => ${band} (${(riskScore * 100).toFixed(1)})`, { riskScore, band });
    log("ALERT_GENERATED", `${newAlerts.length} alerts generated for ${customerId}`, { alertIds: newAlerts.map((a) => a.alertId) });

    refreshCustomers();
    refreshAlerts();
    setDoneCustomer(customer);
    setProcessing(false);
    setStep(-1);

    toast({
      title: `Customer ${customerId} scored ${band.toUpperCase()}`,
      description: `Risk score: ${(riskScore * 100).toFixed(0)}/100 · ${newAlerts.length} alerts generated`,
    });

    const isUpdate = !!existing;
    if (isUpdate) {
      toast({ title: "Customer updated", description: "New transaction batch processed." });
    }
  };

  const totalCredits = txns.filter((t) => t.type === "credit").reduce((s, t) => s + t.amount, 0);
  const totalDebits = txns.filter((t) => t.type === "debit").reduce((s, t) => s + t.amount, 0);

  return (
    <div className="p-6 max-w-4xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Upload Transactions</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Upload a customer CSV to run risk scoring pipeline
        </p>
      </div>

      {/* Drop zone */}
      {!processing && !doneCustomer && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => fileRef.current?.click()}
          className={`card-banking p-10 text-center cursor-pointer transition-all duration-200 border-2 border-dashed ${dragging ? "border-primary bg-accent" : "border-border hover:border-primary/50 hover:bg-muted/30"}`}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
          />
          <Upload className={`w-10 h-10 mx-auto mb-3 ${dragging ? "text-primary" : "text-muted-foreground"}`} />
          <p className="font-semibold text-foreground">
            {file ? file.name : "Drag & drop CSV here"}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {file ? `${(file.size / 1024).toFixed(1)} KB · ${txns.length} transactions detected` : "or click to browse files"}
          </p>
          <p className="text-xs text-muted-foreground mt-3 font-mono">
            Required columns: customer_id, date, amount, type, category, balance, merchant, channel
          </p>
        </div>
      )}

      {/* Sample download */}
      {!file && (
        <div className="card-banking p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">Need sample data?</p>
            <p className="text-xs text-muted-foreground">Use the Simulation Settings page to generate synthetic CSV</p>
          </div>
          <button
            onClick={() => navigate("settings")}
            className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary-glow transition-colors"
          >
            Generate CSV
          </button>
        </div>
      )}

      {/* Errors / Warnings */}
      {errors.length > 0 && (
        <div className="card-banking p-4 border-risk-critical/30 bg-risk-critical-bg">
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="w-4 h-4 text-risk-critical" />
            <span className="text-sm font-semibold text-risk-critical">Validation Errors</span>
          </div>
          {errors.map((e, i) => <p key={i} className="text-xs text-risk-critical font-mono ml-6">{e}</p>)}
        </div>
      )}

      {warnings.length > 0 && (
        <div className="card-banking p-4 border-risk-medium/30 bg-risk-medium-bg">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-risk-medium" />
            <span className="text-sm font-semibold text-risk-medium">Warnings</span>
          </div>
          {warnings.map((w, i) => <p key={i} className="text-xs text-risk-medium font-mono ml-6">{w}</p>)}
        </div>
      )}

      {/* Pipeline progress */}
      <AnimatePresence>
        {processing && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card-banking p-6"
          >
            <p className="text-sm font-semibold text-foreground mb-4">Processing Pipeline</p>
            <div className="space-y-2.5">
              {STEPS.map((s, i) => (
                <div key={s} className="flex items-center gap-3">
                  {i < step ? (
                    <CheckCircle className="w-4 h-4 text-risk-low flex-shrink-0" />
                  ) : i === step ? (
                    <svg className="animate-spin w-4 h-4 text-primary flex-shrink-0" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-border flex-shrink-0" />
                  )}
                  <span className={`text-sm ${i <= step ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                    Step {i + 1}: {s}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success */}
      {doneCustomer && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-banking p-6 border-risk-low/30"
        >
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle className="w-5 h-5 text-risk-low" />
            <div>
              <p className="font-semibold text-foreground">Pipeline Complete</p>
              <p className="text-xs text-muted-foreground">
                Customer {doneCustomer.id} scored as{" "}
                <span className="font-bold text-foreground">{doneCustomer.band.toUpperCase()}</span>{" "}
                risk ({(doneCustomer.riskScore * 100).toFixed(0)}/100)
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate("customer-detail", doneCustomer.id)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary-glow transition-colors"
            >
              View Customer Detail <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => { setFile(null); setTxns([]); setDoneCustomer(null); setErrors([]); setWarnings([]); }}
              className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors text-foreground"
            >
              Upload Another
            </button>
          </div>
        </motion.div>
      )}

      {/* Transactions preview */}
      {txns.length > 0 && !processing && !doneCustomer && errors.length === 0 && (
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="card-banking p-4">
              <p className="text-xs text-muted-foreground">Total Credits</p>
              <p className="text-lg font-bold text-risk-low">₹{totalCredits.toLocaleString()}</p>
            </div>
            <div className="card-banking p-4">
              <p className="text-xs text-muted-foreground">Total Debits</p>
              <p className="text-lg font-bold text-risk-critical">₹{totalDebits.toLocaleString()}</p>
            </div>
            <div className="card-banking p-4">
              <p className="text-xs text-muted-foreground">Net Cashflow</p>
              <p className={`text-lg font-bold ${totalCredits - totalDebits >= 0 ? "text-risk-low" : "text-risk-critical"}`}>
                ₹{(totalCredits - totalDebits).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Table preview */}
          <div className="card-banking overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">Transaction Preview (first 10 rows)</p>
              <span className="text-xs text-muted-foreground">{txns.length} total rows</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    {["Date", "Amount", "Type", "Category", "Balance", "Merchant", "Channel"].map((h) => (
                      <th key={h} className="px-3 py-2 text-left font-medium text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {txns.slice(0, 10).map((t) => (
                    <tr key={t.transactionId} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="px-3 py-2 font-mono text-foreground">{t.date}</td>
                      <td className={`px-3 py-2 font-mono font-semibold ${t.type === "credit" ? "text-risk-low" : "text-risk-critical"}`}>
                        {t.type === "credit" ? "+" : "-"}₹{t.amount.toLocaleString()}
                      </td>
                      <td className="px-3 py-2">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${t.type === "credit" ? "bg-risk-low-bg text-risk-low" : "bg-risk-critical-bg text-risk-critical"}`}>
                          {t.type}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-muted-foreground font-mono">{t.category}</td>
                      <td className="px-3 py-2 font-mono text-foreground">₹{t.balance.toLocaleString()}</td>
                      <td className="px-3 py-2 text-muted-foreground truncate max-w-[120px]">{t.merchant}</td>
                      <td className="px-3 py-2 text-muted-foreground">{t.channel}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <button
            onClick={runPipeline}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary-glow transition-colors flex items-center justify-center gap-2"
          >
            Run Risk Analysis Pipeline
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
