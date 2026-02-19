import React, { useMemo, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Users, AlertTriangle, TrendingUp, TrendingDown, DollarSign,
  ArrowUpRight, Clock, Upload, Bell, Activity,
} from "lucide-react";
import {
  PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, BarChart, Bar, Legend,
} from "recharts";
import { useApp } from "@/hooks/useAppStore";
import { getAuditLogs, getInterventions } from "@/utils/storage";
import { RiskBadge } from "@/components/RiskBadge";
import type { RiskBand } from "@/types";

const BAND_COLORS: Record<RiskBand, string> = {
  Low: "#22c55e",
  Medium: "#f59e0b",
  High: "#f97316",
  Critical: "#ef4444",
};

function AnimatedCounter({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = value / 30;
    const timer = setInterval(() => {
      start += step;
      if (start >= value) { setDisplay(value); clearInterval(timer); }
      else setDisplay(Math.floor(start));
    }, 30);
    return () => clearInterval(timer);
  }, [value]);
  return <>{prefix}{display.toLocaleString()}{suffix}</>;
}

export function DashboardPage() {
  const { customers, alerts, navigate } = useApp();
  const logs = getAuditLogs().slice(0, 8);
  const interventions = getInterventions();

  const stats = useMemo(() => {
    const critical = customers.filter((c) => c.band === "Critical").length;
    const high = customers.filter((c) => c.band === "High").length;
    const medium = customers.filter((c) => c.band === "Medium").length;
    const low = customers.filter((c) => c.band === "Low").length;
    const avgProb = customers.length
      ? Math.round(customers.reduce((s, c) => s + c.predictedDefaultProbability, 0) / customers.length)
      : 0;
    const lossPrevent = customers.reduce((s, c) => s + c.riskScore * 50000, 0);
    return { critical, high, medium, low, avgProb, lossPrevent };
  }, [customers]);

  const bandDist = [
    { name: "Critical", value: stats.critical, color: BAND_COLORS.Critical },
    { name: "High", value: stats.high, color: BAND_COLORS.High },
    { name: "Medium", value: stats.medium, color: BAND_COLORS.Medium },
    { name: "Low", value: stats.low, color: BAND_COLORS.Low },
  ].filter((d) => d.value > 0);

  const alertDist = [
    { name: "Critical", value: alerts.filter((a) => a.level === "critical").length, color: BAND_COLORS.Critical },
    { name: "High", value: alerts.filter((a) => a.level === "high").length, color: BAND_COLORS.High },
    { name: "Medium", value: alerts.filter((a) => a.level === "medium").length, color: BAND_COLORS.Medium },
    { name: "Low", value: alerts.filter((a) => a.level === "low").length, color: BAND_COLORS.Low },
  ].filter((d) => d.value > 0);

  // Signal frequency
  const signalCount: Record<string, number> = {};
  for (const c of customers) {
    for (const f of c.flags) {
      signalCount[f] = (signalCount[f] ?? 0) + 1;
    }
  }
  const signalData = Object.entries(signalCount)
    .map(([name, count]) => ({ name: name.length > 20 ? name.slice(0, 18) + "…" : name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  // Risk trend from upload history
  const trendData: { date: string; avg: number }[] = [];
  const dateMap: Record<string, number[]> = {};
  for (const c of customers) {
    for (const h of c.uploadHistory) {
      const d = h.timestamp.slice(0, 10);
      if (!dateMap[d]) dateMap[d] = [];
      dateMap[d].push(h.riskScore * 100);
    }
  }
  for (const [date, scores] of Object.entries(dateMap).sort()) {
    trendData.push({ date, avg: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) });
  }

  const topAtRisk = [...customers].sort((a, b) => b.riskScore - a.riskScore).slice(0, 5);

  const KPI = ({
    icon: Icon,
    label,
    value,
    sub,
    color = "text-foreground",
    onClick,
  }: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: React.ReactNode;
    sub?: string;
    color?: string;
    onClick?: () => void;
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`kpi-card ${onClick ? "cursor-pointer" : ""}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center">
          <Icon className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
      </div>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </motion.div>
  );

  const noData = customers.length === 0;

  return (
    <div className="p-6 space-y-6 max-w-[1400px]">
      <div>
        <h1 className="text-xl font-bold text-foreground">Portfolio Overview</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Real-time pre-delinquency risk intelligence across your customer portfolio
        </p>
      </div>

      {noData && (
        <div className="card-banking p-10 text-center">
          <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-semibold text-foreground">No customer data yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Upload a CSV to begin risk scoring
          </p>
          <button
            onClick={() => navigate("upload")}
            className="mt-4 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary-glow transition-colors"
          >
            Upload Transactions
          </button>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <KPI icon={Users} label="Total Customers" value={<AnimatedCounter value={customers.length} />} />
        <KPI icon={AlertTriangle} label="Critical" value={<AnimatedCounter value={stats.critical} />} color="text-risk-critical" onClick={() => navigate("customers")} />
        <KPI icon={TrendingUp} label="High Risk" value={<AnimatedCounter value={stats.high} />} color="text-risk-high" onClick={() => navigate("customers")} />
        <KPI icon={Activity} label="Avg Default Prob" value={<AnimatedCounter value={stats.avgProb} suffix="%" />} color={stats.avgProb > 50 ? "text-risk-critical" : stats.avgProb > 30 ? "text-risk-high" : "text-foreground"} />
        <KPI icon={DollarSign} label="Loss Prevented (est.)" value={`₹${(stats.lossPrevent / 100000).toFixed(1)}L`} sub="Simulation estimate" />
        <KPI icon={Bell} label="Active Alerts" value={<AnimatedCounter value={alerts.filter((a) => !a.read).length} />} color="text-risk-medium" onClick={() => navigate("alerts")} />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Risk Distribution */}
        <div className="card-banking p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Risk Band Distribution</h3>
          {bandDist.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={bandDist} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={3}>
                  {bandDist.map((d) => <Cell key={d.name} fill={d.color} />)}
                </Pie>
                <Tooltip formatter={(v) => [v, "Customers"]} />
                <Legend iconType="circle" iconSize={8} formatter={(v) => <span className="text-xs text-foreground">{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </div>

        {/* Alert Severity */}
        <div className="card-banking p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Alert Severity Distribution</h3>
          {alertDist.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={alertDist} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={3}>
                  {alertDist.map((d) => <Cell key={d.name} fill={d.color} />)}
                </Pie>
                <Tooltip formatter={(v) => [v, "Alerts"]} />
                <Legend iconType="circle" iconSize={8} formatter={(v) => <span className="text-xs text-foreground">{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </div>

        {/* Risk Trend */}
        <div className="card-banking p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Portfolio Risk Trend</h3>
          {trendData.length > 1 ? (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={trendData}>
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} />
                <Tooltip />
                <Line type="monotone" dataKey="avg" stroke="#3b82f6" strokeWidth={2} dot={false} name="Avg Risk Score" />
              </LineChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </div>
      </div>

      {/* Signal bar chart */}
      {signalData.length > 0 && (
        <div className="card-banking p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Top Risk Signals Across Portfolio</h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={signalData} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={140} />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Customers" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Bottom row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Top at-risk */}
        <div className="card-banking p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">Top At-Risk Customers</h3>
            <button onClick={() => navigate("customers")} className="text-xs text-primary hover:underline">
              View all
            </button>
          </div>
          {topAtRisk.length > 0 ? (
            <div className="space-y-2.5">
              {topAtRisk.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted cursor-pointer transition-colors"
                  onClick={() => navigate("customer-detail", c.id)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground font-mono">{c.id}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{c.name}</p>
                  </div>
                  <RiskBadge band={c.band} />
                  <span className="text-xs font-bold text-foreground">
                    {(c.riskScore * 100).toFixed(0)}
                  </span>
                  <ArrowUpRight className="w-3 h-3 text-muted-foreground" />
                </div>
              ))}
            </div>
          ) : (
            <EmptyChart label="No customers yet" />
          )}
        </div>

        {/* Recent Activity */}
        <div className="card-banking p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Recent Activity</h3>
          {logs.length > 0 ? (
            <div className="space-y-2">
              {logs.map((l) => (
                <div key={l.logId} className="flex items-start gap-2.5 text-xs">
                  <div className="mt-0.5 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground font-medium truncate">{l.description}</p>
                    <p className="text-muted-foreground text-[10px] font-mono">
                      {new Date(l.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <span className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground flex-shrink-0">
                    {l.type}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyChart label="No activity yet" />
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyChart({ label = "No data yet" }: { label?: string }) {
  return (
    <div className="h-[180px] flex items-center justify-center text-muted-foreground text-xs">
      {label}
    </div>
  );
}
