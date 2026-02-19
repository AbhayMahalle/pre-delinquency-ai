import React, { useState, useEffect } from "react";
import {
  Bell,
  Search,
  Sun,
  Moon,
  ChevronDown,
  LogOut,
  User,
} from "lucide-react";
import { useApp } from "@/hooks/useAppStore";
import { getCustomers } from "@/utils/storage";
import { useToast } from "@/hooks/use-toast";

const PAGE_TITLES: Record<string, string> = {
  dashboard: "Dashboard Overview",
  upload: "Upload Transactions",
  customers: "Customer Portfolio",
  alerts: "Alert Center",
  "customer-detail": "Customer Detail",
  model: "Model & Explainability",
  audit: "Audit Logs",
  settings: "Simulation Settings",
};

export function TopBar() {
  const { currentPage, unreadCount, navigate, logout, session, isDark, toggleTheme } = useApp();
  const [clock, setClock] = useState(new Date().toLocaleTimeString());
  const [search, setSearch] = useState("");
  const [showProfile, setShowProfile] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const t = setInterval(() => setClock(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(t);
  }, []);

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    const q = search.trim().toUpperCase();
    const customers = getCustomers();
    const found = customers.find(
      (c) => c.id.toUpperCase() === q || c.id.toUpperCase().includes(q)
    );
    if (found) {
      navigate("customer-detail", found.id);
      setSearch("");
    } else {
      toast({
        title: "Customer not found",
        description: `No customer matching "${q}"`,
        variant: "destructive",
      });
    }
  };

  const title = PAGE_TITLES[currentPage] ?? "PreDelinq AI";

  return (
    <header className="h-14 flex items-center justify-between px-5 border-b border-border bg-card flex-shrink-0 gap-4">
      {/* Left: Title + breadcrumb */}
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-xs text-muted-foreground">PreDelinq AI</span>
        <span className="text-xs text-muted-foreground">/</span>
        <span className="text-sm font-semibold text-foreground truncate">{title}</span>
      </div>

      {/* Center: Search */}
      <div className="flex-1 max-w-xs">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search customer ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleSearch}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      </div>

      {/* Right: clock, theme, bell, profile */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-mono text-muted-foreground tabular-nums">{clock}</span>

        <button
          onClick={toggleTheme}
          className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <button
          onClick={() => navigate("alerts")}
          className="relative p-1.5 rounded-lg hover:bg-muted transition-colors"
        >
          <Bell
            className={`w-4 h-4 ${unreadCount > 0 ? "text-risk-critical animate-[wiggle_0.5s_ease-in-out_infinite]" : "text-muted-foreground"}`}
          />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-risk-critical text-[9px] font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        {/* Profile dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowProfile((v) => !v)}
            className="flex items-center gap-1.5 p-1.5 rounded-lg hover:bg-muted transition-colors"
          >
            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
              <User className="w-3 h-3 text-primary-foreground" />
            </div>
            <span className="text-xs font-medium text-foreground hidden sm:block">
              {session?.user.name ?? "User"}
            </span>
            <ChevronDown className="w-3 h-3 text-muted-foreground" />
          </button>

          {showProfile && (
            <div className="absolute right-0 top-full mt-1 w-48 rounded-xl border border-border bg-card shadow-elevated z-50">
              <div className="px-3 py-2.5 border-b border-border">
                <p className="text-xs font-semibold text-foreground">{session?.user.name}</p>
                <p className="text-[10px] text-muted-foreground">{session?.user.role}</p>
              </div>
              <button
                onClick={() => { logout(); setShowProfile(false); }}
                className="flex items-center gap-2 w-full px-3 py-2 text-xs text-risk-critical hover:bg-muted rounded-b-xl transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
