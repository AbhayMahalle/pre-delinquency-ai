import React, { useState } from "react";
import { Download, Trash2, RefreshCw } from "lucide-react";
import { getSettings, saveSettings, resetAllData } from "@/utils/storage";
import { generateSyntheticCSV, downloadCSV } from "@/utils/csvGenerator";
import { useApp } from "@/hooks/useAppStore";
import { log } from "@/utils/auditLogger";
import { useToast } from "@/hooks/use-toast";
import type { RiskBand } from "@/types";

export function SettingsPage() {
  const { updateSettings, logout } = useApp();
  const { toast } = useToast();
  const [settings, setSettings] = useState(getSettings);
  const [synth, setSynth] = useState({
    customerId: "C-SYN001",
    riskLevel: "High" as RiskBand,
    days: 90,
    numTransactions: 120,
    includeSalary: true,
  });

  const handleWeightChange = (key: string, val: number) => {
    const newWeights = { ...settings.weights, [key]: val };
    const s = { ...settings, weights: newWeights };
    setSettings(s);
    saveSettings(s);
    updateSettings(s);
  };

  const handleSignalToggle = (key: string) => {
    const newSignals = { ...settings.signals, [key]: !(settings.signals as unknown as Record<string, boolean>)[key] };
    const s = { ...settings, signals: newSignals };
    setSettings(s);
    saveSettings(s);
    updateSettings(s);
  };

  const generateCSV = () => {
    const csv = generateSyntheticCSV(synth);
    downloadCSV(csv, `${synth.customerId}_${synth.riskLevel}_transactions.csv`);
    toast({ title: "CSV downloaded", description: `${synth.numTransactions} transactions generated for ${synth.customerId}` });
  };

  const handleReset = () => {
    if (!confirm("Clear ALL data? This will reset customers, alerts, and audit logs.")) return;
    log("RESET", "Full system reset performed", {});
    resetAllData();
    toast({ title: "System reset", description: "All data cleared. Please log in again." });
    setTimeout(() => logout(), 1500);
  };

  const WEIGHT_LABELS: Record<string, string> = {
    salaryDelay: "Salary Delay", salaryDrop: "Salary Drop", savingsDrawdown: "Savings Drawdown",
    utilityDelay: "Utility Delay", lendingAppSpike: "Lending App Spike", atmSpike: "ATM Withdrawal Spike",
    discretionaryDrop: "Discretionary Drop", failedAutoDebit: "Failed Auto-Debit", volatility: "Volatility Index",
  };

  const totalWeight = Object.values(settings.weights).reduce((a, b) => a + b, 0);

  return (
    <div className="p-6 space-y-5 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold text-foreground">Simulation Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Configure risk weights, signal toggles, and generate synthetic data</p>
      </div>

      {/* Risk Weights */}
      <div className="card-banking p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground">Risk Signal Weights</h3>
          <span className={`text-xs font-mono px-2 py-0.5 rounded ${Math.abs(totalWeight - 1) < 0.01 ? "bg-risk-low-bg text-risk-low" : "bg-risk-high-bg text-risk-high"}`}>
            Total: {(totalWeight * 100).toFixed(0)}% {Math.abs(totalWeight - 1) > 0.01 && "(should be 100%)"}
          </span>
        </div>
        <div className="space-y-4">
          {Object.entries(settings.weights).map(([key, val]) => (
            <div key={key}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-foreground">{WEIGHT_LABELS[key]}</span>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-mono text-muted-foreground w-8 text-right`}>
                    {(val * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
              <input
                type="range"
                min={0} max={0.5} step={0.01}
                value={val}
                onChange={(e) => handleWeightChange(key, parseFloat(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none bg-muted cursor-pointer accent-primary"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Signal Toggles */}
      <div className="card-banking p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Signal Toggles</h3>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(settings.signals).map(([key, enabled]) => (
            <label key={key} className="flex items-center justify-between p-3 rounded-lg border border-border cursor-pointer hover:bg-muted/40 transition-colors">
              <span className="text-xs font-medium text-foreground">{WEIGHT_LABELS[key]}</span>
              <button
                onClick={() => handleSignalToggle(key)}
                className={`relative inline-flex h-5 w-9 rounded-full transition-colors ${enabled ? "bg-primary" : "bg-muted"}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform mt-0.5 ${enabled ? "translate-x-4 ml-0.5" : "translate-x-0.5"}`} />
              </button>
            </label>
          ))}
        </div>
      </div>

      {/* Synthetic CSV Generator */}
      <div className="card-banking p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Synthetic CSV Generator</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Customer ID</label>
            <input
              type="text"
              value={synth.customerId}
              onChange={(e) => setSynth({ ...synth, customerId: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Risk Level</label>
            <select
              value={synth.riskLevel}
              onChange={(e) => setSynth({ ...synth, riskLevel: e.target.value as RiskBand })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {["Low", "Medium", "High", "Critical"].map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Duration (days)</label>
            <select
              value={synth.days}
              onChange={(e) => setSynth({ ...synth, days: parseInt(e.target.value) })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {[30, 60, 90, 180].map((d) => <option key={d} value={d}>{d} days</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Transactions</label>
            <select
              value={synth.numTransactions}
              onChange={(e) => setSynth({ ...synth, numTransactions: parseInt(e.target.value) })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {[50, 80, 120, 200].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>
        <label className="flex items-center gap-2 mt-3 cursor-pointer">
          <input
            type="checkbox"
            checked={synth.includeSalary}
            onChange={(e) => setSynth({ ...synth, includeSalary: e.target.checked })}
            className="rounded border-input accent-primary"
          />
          <span className="text-xs text-foreground">Include monthly salary transactions</span>
        </label>
        <button
          onClick={generateCSV}
          className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary-glow transition-colors"
        >
          <Download className="w-4 h-4" /> Download CSV
        </button>
      </div>

      {/* Reset */}
      <div className="card-banking p-5 border-risk-critical/20">
        <h3 className="text-sm font-semibold text-risk-critical mb-2">Danger Zone</h3>
        <p className="text-xs text-muted-foreground mb-3">Clear all customers, transactions, alerts, audit logs, and session data. This action is irreversible.</p>
        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-risk-critical text-white text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          <Trash2 className="w-4 h-4" /> Clear All Data
        </button>
      </div>
    </div>
  );
}
