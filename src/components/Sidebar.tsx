import React from "react";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Upload,
  Users,
  Bell,
  User,
  Brain,
  ScrollText,
  Settings,
  ChevronRight,
  Shield,
} from "lucide-react";
import { useApp } from "@/hooks/useAppStore";

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: () => number | null;
}

const NAV_ITEMS: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "upload", label: "Upload Transactions", icon: Upload },
  {
    id: "customers",
    label: "Customers",
    icon: Users,
    badge: function CustomerBadge() {
      return null; // handled dynamically below
    },
  },
  {
    id: "alerts",
    label: "Alerts",
    icon: Bell,
  },
  { id: "model", label: "Model & Explainability", icon: Brain },
  { id: "audit", label: "Audit Logs", icon: ScrollText },
  { id: "settings", label: "Simulation Settings", icon: Settings },
];

export function Sidebar() {
  const { currentPage, navigate, customers, unreadCount, selectedCustomerId } =
    useApp();

  return (
    <aside className="flex flex-col w-60 min-h-screen bg-sidebar border-r border-sidebar-border flex-shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-sidebar-border">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary">
          <Shield className="w-4 h-4 text-primary-foreground" />
        </div>
        <div>
          <p className="text-sm font-bold text-sidebar-foreground leading-none">
            PreDelinq AI
          </p>
          <p className="text-[10px] text-sidebar-muted mt-0.5">
            Risk Intelligence Platform
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = currentPage === item.id;
          const Icon = item.icon;
          let badge: number | null = null;
          if (item.id === "customers") badge = customers.length || null;
          if (item.id === "alerts") badge = unreadCount || null;

          return (
            <button
              key={item.id}
              onClick={() => navigate(item.id)}
              className={`sidebar-nav-item w-full ${isActive ? "active" : ""}`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1 text-left text-sm">{item.label}</span>
              {badge !== null && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none ${
                    item.id === "alerts"
                      ? "bg-risk-critical text-white"
                      : "bg-sidebar-accent text-white"
                  }`}
                >
                  {badge}
                </span>
              )}
              {isActive && (
                <ChevronRight className="w-3 h-3 opacity-60 flex-shrink-0" />
              )}
            </button>
          );
        })}

        {/* Customer detail link (appears when customer selected) */}
        {selectedCustomerId && (
          <button
            onClick={() => navigate("customer-detail")}
            className={`sidebar-nav-item w-full ${
              currentPage === "customer-detail" ? "active" : ""
            }`}
          >
            <User className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1 text-left text-xs truncate">
              {selectedCustomerId}
            </span>
          </button>
        )}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-sidebar-border space-y-3">
        <div className="flex items-center gap-2">
          <div className="pulse-dot flex-shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-risk-low" />
            <span className="pulse-dot-inner" />
          </div>
          <span className="text-xs text-sidebar-muted">System Operational</span>
        </div>
        <p className="text-[10px] text-sidebar-muted font-mono">v1.0 Prototype</p>
      </div>
    </aside>
  );
}
