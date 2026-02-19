import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

const MODEL_METRICS = [
  { name: "ROC-AUC", value: 0.87 }, { name: "Accuracy", value: 0.85 },
  { name: "Precision", value: 0.81 }, { name: "Recall", value: 0.80 }, { name: "F1", value: 0.80 },
];

const MODEL_COMPARISON = [
  { model: "XGBoost", auc: 0.84, acc: 0.82, f1: 0.78 },
  { model: "LightGBM", auc: 0.85, acc: 0.83, f1: 0.79 },
  { model: "Ensemble", auc: 0.87, acc: 0.85, f1: 0.80 },
];

function CircleMetric({ name, value }: { name: string; value: number }) {
  const pct = Math.round(value * 100);
  const r = 30, circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="80" height="80" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
        <circle cx="40" cy="40" r={r} fill="none" stroke="hsl(var(--primary))" strokeWidth="8"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" transform="rotate(-90 40 40)" />
        <text x="40" y="44" textAnchor="middle" fontSize="14" fontWeight="700" fill="currentColor" className="fill-foreground">
          {pct}%
        </text>
      </svg>
      <span className="text-xs text-muted-foreground">{name}</span>
    </div>
  );
}

export function ModelPage() {
  return (
    <div className="p-6 space-y-5 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold text-foreground">Model & Explainability</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Ensemble delinquency prediction model — performance metrics and compliance</p>
      </div>

      {/* Metrics */}
      <div className="card-banking p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Model Performance Metrics</h3>
        <div className="flex justify-around flex-wrap gap-4">
          {MODEL_METRICS.map((m) => <CircleMetric key={m.name} name={m.name} value={m.value} />)}
        </div>
      </div>

      {/* Model comparison */}
      <div className="card-banking p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Model Comparison</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={MODEL_COMPARISON}>
            <XAxis dataKey="model" tick={{ fontSize: 11 }} />
            <YAxis domain={[0.7, 0.9]} tick={{ fontSize: 10 }} tickFormatter={(v) => (v * 100).toFixed(0) + "%"} />
            <Tooltip formatter={(v: number) => [(v * 100).toFixed(1) + "%"]} />
            <Legend iconType="circle" iconSize={8} />
            <Bar dataKey="auc" name="ROC-AUC" fill="#3b82f6" radius={[3, 3, 0, 0]} />
            <Bar dataKey="acc" name="Accuracy" fill="#22c55e" radius={[3, 3, 0, 0]} />
            <Bar dataKey="f1" name="F1 Score" fill="#f59e0b" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Confusion matrix */}
      <div className="card-banking p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Confusion Matrix (Validation Set)</h3>
        <div className="grid grid-cols-2 gap-2 max-w-xs">
          {[
            { label: "True Negative", value: "241,847", color: "bg-risk-low-bg text-risk-low" },
            { label: "False Positive", value: "12,306", color: "bg-risk-critical-bg text-risk-critical" },
            { label: "False Negative", value: "4,921", color: "bg-risk-high-bg text-risk-high" },
            { label: "True Positive", value: "48,437", color: "bg-risk-low-bg text-risk-low" },
          ].map((c) => (
            <div key={c.label} className={`rounded-xl p-4 text-center ${c.color}`}>
              <p className="text-lg font-bold">{c.value}</p>
              <p className="text-xs mt-0.5 opacity-80">{c.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Compliance */}
      <div className="card-banking p-5 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Explainability & Compliance</h3>
        {[
          { title: "SHAP-Inspired Explanations", desc: "Every prediction is broken down into per-feature contributions using a SHAP-inspired approach. Feature weights are fully auditable." },
          { title: "No Protected Attributes", desc: "Age, gender, religion, ethnicity, and geography are not used in any scoring model. Demographic neutrality enforced by design." },
          { title: "Bias Avoidance", desc: "All input features are behavioral financial signals derived solely from transaction patterns. No proxies for protected classes." },
          { title: "Human Override Required", desc: "All credit actions require human review before execution. This system provides decision support, not autonomous decisioning." },
          { title: "Full Auditability", desc: "Every prediction event, alert, and intervention is logged with actor, timestamp, and metadata for full regulatory audit trail." },
        ].map((item) => (
          <div key={item.title} className="flex items-start gap-3 p-3 rounded-lg bg-muted/40">
            <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-semibold text-foreground">{item.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Model monitoring */}
      <div className="card-banking p-5">
        <h3 className="text-sm font-semibold text-foreground mb-3">Model Monitoring (Simulated)</h3>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Feature Drift Score", value: "0.03", status: "Normal", ok: true },
            { label: "Prediction Stability", value: "98.2%", status: "Healthy", ok: true },
            { label: "Data Quality Score", value: "96.7%", status: "Healthy", ok: true },
          ].map((m) => (
            <div key={m.label} className="rounded-xl p-3 bg-muted/40 border border-border">
              <p className="text-xs text-muted-foreground">{m.label}</p>
              <p className="text-lg font-bold text-foreground mt-1">{m.value}</p>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${m.ok ? "bg-risk-low-bg text-risk-low" : "bg-risk-critical-bg text-risk-critical"}`}>
                {m.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
