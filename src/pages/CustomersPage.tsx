import React, { useState, useMemo } from "react";
import { Search, Filter, Download, ArrowUpDown, TrendingUp, Plus } from "lucide-react";
import { useApp } from "@/hooks/useAppStore";
import { RiskBadge, RiskScoreBar } from "@/components/RiskBadge";
import type { RiskBand, CustomerStatus } from "@/types";

type SortKey = "riskScore" | "salaryDelayDays" | "savingsDrawdownPercent" | "estimatedDaysToDelinquency" | "age" | "name";

export function CustomersPage() {
  const { customers, navigate } = useApp();
  const [search, setSearch] = useState("");
  const [bandFilter, setBandFilter] = useState<RiskBand | "All">("All");
  const [statusFilter, setStatusFilter] = useState<CustomerStatus | "All">("All");
  const [empFilter, setEmpFilter] = useState<string>("All");
  const [cityFilter, setCityFilter] = useState<string>("All");
  const [sortKey, setSortKey] = useState<SortKey>("riskScore");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const filtered = useMemo(() => {
    let list = [...customers];
    if (search) list = list.filter((c) => c.id.toLowerCase().includes(search.toLowerCase()) || c.name.toLowerCase().includes(search.toLowerCase()));
    if (bandFilter !== "All") list = list.filter((c) => c.band === bandFilter);
    if (statusFilter !== "All") list = list.filter((c) => c.status === statusFilter);
    if (empFilter !== "All") list = list.filter((c) => c.employmentType === empFilter);
    if (cityFilter !== "All") list = list.filter((c) => c.city === cityFilter);
    list.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === "string" && typeof bv === "string") {
        return sortDir === "desc" ? bv.localeCompare(av) : av.localeCompare(bv);
      }
      return sortDir === "desc" ? (bv as number) - (av as number) : (av as number) - (bv as number);
    });
    return list;
  }, [customers, search, bandFilter, statusFilter, empFilter, cityFilter, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    else { setSortKey(key); setSortDir("desc"); }
  };

  const exportCSV = () => {
    const header = "id,name,band,riskScore,defaultProbability,salaryDelay,savingsDrawdown,lendingAppTxns,daysToDelinquency,status,lastUpdated";
    const rows = filtered.map((c) =>
      `${c.id},${c.name},${c.band},${(c.riskScore * 100).toFixed(1)},${c.predictedDefaultProbability},${c.salaryDelayDays.toFixed(1)},${c.savingsDrawdownPercent.toFixed(1)},${c.lendingAppTxnCount},${c.estimatedDaysToDelinquency},${c.status},${c.lastUpdated}`
    );
    const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "customers_export.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const uniqueCities = useMemo(() => Array.from(new Set(customers.map(c => c.city || "Unknown"))).sort(), [customers]);
  const uniqueEmpTypes = useMemo(() => Array.from(new Set(customers.map(c => c.employmentType || "Unknown"))).sort(), [customers]);

  const STATUS_COLORS: Record<CustomerStatus, string> = {
    Active: "bg-risk-low-bg text-risk-low",
    "Under Intervention": "bg-risk-medium-bg text-risk-medium",
    Resolved: "bg-muted text-muted-foreground",
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Customer Portfolio</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{customers.length} customers · {filtered.length} shown</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate("upload")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-foreground hover:bg-muted transition-colors">
            <Plus className="w-3.5 h-3.5" /> Add via CSV
          </button>
          <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary-glow transition-colors">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search customers…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring w-52"
          />
        </div>
        <select
          value={bandFilter}
          onChange={(e) => setBandFilter(e.target.value as RiskBand | "All")}
          className="px-3 py-1.5 text-xs rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="All">All Bands</option>
          {["Critical", "High", "Medium", "Low"].map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
        <select
          value={empFilter}
          onChange={(e) => setEmpFilter(e.target.value)}
          className="px-3 py-1.5 text-xs rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="All">All Employment</option>
          {uniqueEmpTypes.map((e) => <option key={e} value={e}>{e}</option>)}
        </select>
        <select
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
          className="px-3 py-1.5 text-xs rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="All">All Cities</option>
          {uniqueCities.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as CustomerStatus | "All")}
          className="px-3 py-1.5 text-xs rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="All">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Under Intervention">Under Intervention</option>
          <option value="Resolved">Resolved</option>
        </select>
      </div>

      {/* Table */}
      {customers.length === 0 ? (
        <div className="card-banking p-12 text-center">
          <TrendingUp className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-semibold text-foreground">No customers yet</p>
          <p className="text-sm text-muted-foreground mt-1">Upload a transaction CSV to get started</p>
          <button onClick={() => navigate("upload")} className="mt-4 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary-glow transition-colors">
            Upload CSV
          </button>
        </div>
      ) : (
        <div className="card-banking overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-3 py-2.5 text-left font-semibold text-muted-foreground">
                    <button onClick={() => toggleSort("name")} className="flex items-center gap-1 hover:text-foreground">
                      Customer <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="px-3 py-2.5 text-left font-semibold text-muted-foreground">
                    <button onClick={() => toggleSort("age")} className="flex items-center gap-1 hover:text-foreground">
                      Age <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="px-3 py-2.5 text-left font-semibold text-muted-foreground">Details</th>
                  <th className="px-3 py-2.5 text-left font-semibold text-muted-foreground">
                    <button onClick={() => toggleSort("riskScore")} className="flex items-center gap-1 hover:text-foreground">
                      Risk Score <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="px-3 py-2.5 text-left font-semibold text-muted-foreground">Band</th>
                  <th className="px-3 py-2.5 text-left font-semibold text-muted-foreground">Default Prob</th>
                  <th className="px-3 py-2.5 text-left font-semibold text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => navigate("customer-detail", c.id)}
                    className="border-b border-border/50 hover:bg-muted/40 cursor-pointer transition-colors"
                  >
                    <td className="px-3 py-2.5">
                      <p className="font-mono font-semibold text-foreground">{c.id}</p>
                      <p className="text-muted-foreground text-[10px]">{c.name}</p>
                    </td>
                    <td className="px-3 py-2.5 text-foreground">{c.age || "-"}</td>
                    <td className="px-3 py-2.5 text-[10px] text-muted-foreground">
                      <div>{c.occupation || "-"}</div>
                      <div>{c.city || "-"}</div>
                    </td>
                    <td className="px-3 py-2.5 w-32">
                      <RiskScoreBar score={c.riskScore} />
                    </td>
                    <td className="px-3 py-2.5"><RiskBadge band={c.band} /></td>
                    <td className="px-3 py-2.5 font-mono font-bold text-foreground">{c.predictedDefaultProbability}%</td>
                    <td className="px-3 py-2.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${STATUS_COLORS[c.status]}`}>
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
