import React, { useState } from "react";
import { Bell, Check, Trash2, Filter, Search } from "lucide-react";
import { useApp } from "@/hooks/useAppStore";
import { markAlertRead, markAllAlertsRead, saveAlerts, getAlerts } from "@/utils/storage";
import type { AlertLevel } from "@/types";
import { formatDistanceToNow } from "date-fns";

const LEVEL_ICON: Record<AlertLevel, string> = {
  critical: "🆘", high: "🚨", medium: "⚠️", low: "ℹ️",
};
const LEVEL_BORDER: Record<AlertLevel, string> = {
  critical: "alert-border-critical", high: "alert-border-high", medium: "alert-border-medium", low: "alert-border-low",
};

export function AlertsPage() {
  const { alerts, navigate, refreshAlerts } = useApp();
  const [filter, setFilter] = useState<AlertLevel | "all">("all");
  const [search, setSearch] = useState("");

  const filtered = alerts
    .filter((a) => filter === "all" || a.level === filter)
    .filter((a) => !search || a.customerId.toLowerCase().includes(search.toLowerCase()) || a.title.toLowerCase().includes(search.toLowerCase()));

  const counts = {
    critical: alerts.filter((a) => a.level === "critical").length,
    high: alerts.filter((a) => a.level === "high").length,
    medium: alerts.filter((a) => a.level === "medium").length,
    low: alerts.filter((a) => a.level === "low").length,
  };

  const markRead = (id: string) => { markAlertRead(id); refreshAlerts(); };
  const markAll = () => { markAllAlertsRead(); refreshAlerts(); };
  const clearRead = () => {
    const unread = getAlerts().filter((a) => !a.read);
    saveAlerts(unread);
    refreshAlerts();
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Alert Center</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{alerts.filter((a) => !a.read).length} unread alerts</p>
        </div>
        <div className="flex gap-2">
          <button onClick={markAll} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-foreground hover:bg-muted transition-colors">
            <Check className="w-3.5 h-3.5" /> Mark All Read
          </button>
          <button onClick={clearRead} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-risk-critical hover:bg-risk-critical-bg transition-colors">
            <Trash2 className="w-3.5 h-3.5" /> Clear Read
          </button>
        </div>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { level: "critical" as AlertLevel, label: "Critical", count: counts.critical, color: "text-risk-critical bg-risk-critical-bg" },
          { level: "high" as AlertLevel, label: "High", count: counts.high, color: "text-risk-high bg-risk-high-bg" },
          { level: "medium" as AlertLevel, label: "Medium", count: counts.medium, color: "text-risk-medium bg-risk-medium-bg" },
          { level: "low" as AlertLevel, label: "Low", count: counts.low, color: "text-risk-low bg-risk-low-bg" },
        ].map((s) => (
          <button
            key={s.level}
            onClick={() => setFilter(filter === s.level ? "all" : s.level)}
            className={`card-banking p-3 text-center hover:opacity-80 transition-opacity ${filter === s.level ? "ring-2 ring-primary" : ""}`}
          >
            <p className={`text-xl font-bold ${s.color.split(" ")[0]}`}>{s.count}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by customer or title…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring w-60"
          />
        </div>
      </div>

      {/* Alert cards */}
      {filtered.length === 0 ? (
        <div className="card-banking p-12 text-center">
          <Bell className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-semibold text-foreground">No alerts</p>
          <p className="text-sm text-muted-foreground mt-1">Alerts will appear after CSV upload and risk scoring</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((alert) => (
            <div
              key={alert.alertId}
              className={`card-banking p-4 ${LEVEL_BORDER[alert.level]} ${!alert.read ? "bg-card" : "opacity-60"}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <span className="text-lg mt-0.5 flex-shrink-0">{LEVEL_ICON[alert.level]}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-foreground">{alert.title}</p>
                      {!alert.read && <span className="w-1.5 h-1.5 rounded-full bg-risk-critical flex-shrink-0" />}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{alert.detail}</p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {alert.signals.map((s) => (
                        <span key={s} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{s}</span>
                      ))}
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-[10px] text-muted-foreground">
                        {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground">Priority: {alert.priorityScore}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <button
                    onClick={() => navigate("customer-detail", alert.customerId)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${alert.action === "Intervene" ? "bg-risk-critical text-white hover:opacity-90" : "border border-border text-foreground hover:bg-muted"}`}
                  >
                    {alert.action === "Intervene" ? "⚡ Intervene" : "🔍 Review"}
                  </button>
                  {!alert.read && (
                    <button onClick={() => markRead(alert.alertId)} className="px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:bg-muted transition-colors">
                      Mark Read
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
