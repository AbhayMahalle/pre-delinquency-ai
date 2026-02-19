import React, { useState } from "react";
import { Download, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { getAuditLogs, saveAuditLogs } from "@/utils/storage";
import { log } from "@/utils/auditLogger";
import type { AuditLogType } from "@/types";

export function AuditLogsPage() {
  const [logs, setLogs] = useState(getAuditLogs);
  const [typeFilter, setTypeFilter] = useState<AuditLogType | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const TYPES: (AuditLogType | "ALL")[] = ["ALL", "LOGIN", "UPLOAD", "RISK_SCORE", "ALERT_GENERATED", "INTERVENTION_TRIGGERED", "CUSTOMER_UPDATED", "RESET", "LOGOUT"];

  const filtered = logs
    .filter((l) => typeFilter === "ALL" || l.type === typeFilter)
    .filter((l) => !search || l.description.toLowerCase().includes(search.toLowerCase()) || l.actor.toLowerCase().includes(search.toLowerCase()));

  const exportLogs = () => {
    const blob = new Blob([JSON.stringify(filtered, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "audit_logs.json"; a.click();
    URL.revokeObjectURL(url);
  };

  const clearLogs = () => {
    if (!confirm("Clear all audit logs? This cannot be undone.")) return;
    saveAuditLogs([]);
    log("RESET", "Audit logs cleared", {});
    setLogs(getAuditLogs());
  };

  const TYPE_COLORS: Record<string, string> = {
    LOGIN: "bg-risk-low-bg text-risk-low", LOGOUT: "bg-muted text-muted-foreground",
    UPLOAD: "bg-primary/10 text-primary", RISK_SCORE: "bg-risk-medium-bg text-risk-medium",
    ALERT_GENERATED: "bg-risk-high-bg text-risk-high", INTERVENTION_TRIGGERED: "bg-risk-critical-bg text-risk-critical",
    CUSTOMER_UPDATED: "bg-primary/10 text-primary", RESET: "bg-risk-critical-bg text-risk-critical",
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Audit Logs</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{logs.length} total events logged</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportLogs} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary-glow transition-colors">
            <Download className="w-3.5 h-3.5" /> Export JSON
          </button>
          <button onClick={clearLogs} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-risk-critical/30 text-risk-critical text-xs font-medium hover:bg-risk-critical-bg transition-colors">
            <Trash2 className="w-3.5 h-3.5" /> Clear
          </button>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap">
        <input
          type="text"
          placeholder="Search logs…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-1.5 text-xs rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring w-52"
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as AuditLogType | "ALL")}
          className="px-3 py-1.5 text-xs rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        >
          {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div className="card-banking overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                {["Timestamp", "Type", "Actor", "Description", "Details"].map((h) => (
                  <th key={h} className="px-3 py-2.5 text-left font-semibold text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">No audit logs found</td>
                </tr>
              ) : (
                filtered.map((l) => (
                  <React.Fragment key={l.logId}>
                    <tr
                      className="border-b border-border/50 hover:bg-muted/30 cursor-pointer"
                      onClick={() => setExpanded(expanded === l.logId ? null : l.logId)}
                    >
                      <td className="px-3 py-2.5 font-mono text-muted-foreground whitespace-nowrap">
                        {new Date(l.timestamp).toLocaleString()}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono ${TYPE_COLORS[l.type] ?? "bg-muted text-muted-foreground"}`}>
                          {l.type}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-foreground">{l.actor}</td>
                      <td className="px-3 py-2.5 text-foreground max-w-xs truncate">{l.description}</td>
                      <td className="px-3 py-2.5">
                        {Object.keys(l.metadata).length > 0 && (
                          expanded === l.logId
                            ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                            : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                        )}
                      </td>
                    </tr>
                    {expanded === l.logId && Object.keys(l.metadata).length > 0 && (
                      <tr className="border-b border-border/50 bg-muted/20">
                        <td colSpan={5} className="px-3 py-2">
                          <pre className="text-[10px] font-mono text-muted-foreground whitespace-pre-wrap bg-muted rounded p-2 max-h-32 overflow-y-auto">
                            {JSON.stringify(l.metadata, null, 2)}
                          </pre>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
