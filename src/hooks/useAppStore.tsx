import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { CustomerProfile, AlertObject, AppSession, AppSettings } from "@/types";
import {
  getSession, setSession, clearSession,
  getCustomers, saveCustomers, upsertCustomer,
  getAlerts, saveAlerts, addAlerts, getUnreadAlertsCount,
  getSettings, saveSettings,
} from "@/utils/storage";

interface AppStore {
  session: AppSession | null;
  customers: CustomerProfile[];
  alerts: AlertObject[];
  unreadCount: number;
  settings: AppSettings;
  currentPage: string;
  selectedCustomerId: string | null;
  isDark: boolean;
  login: (name: string, role: string) => void;
  logout: () => void;
  navigate: (page: string, customerId?: string) => void;
  refreshCustomers: () => void;
  refreshAlerts: () => void;
  updateSettings: (s: AppSettings) => void;
  toggleTheme: () => void;
}

const AppContext = createContext<AppStore | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [session, setSessionState] = useState<AppSession | null>(getSession);
  const [customers, setCustomers] = useState<CustomerProfile[]>(getCustomers);
  const [alerts, setAlerts] = useState<AlertObject[]>(getAlerts);
  const [unreadCount, setUnreadCount] = useState(getUnreadAlertsCount);
  const [settings, setSettingsState] = useState<AppSettings>(getSettings);
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(() => getSettings().theme === "dark");

  useEffect(() => {
    if (isDark) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [isDark]);

  const login = useCallback((name: string, role: string) => {
    const s = { loggedIn: true, user: { name, role } };
    setSession(s);
    setSessionState(s);
    setCurrentPage("dashboard");
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setSessionState(null);
    setCurrentPage("dashboard");
  }, []);

  const navigate = useCallback((page: string, customerId?: string) => {
    setCurrentPage(page);
    if (customerId !== undefined) setSelectedCustomerId(customerId);
  }, []);

  const refreshCustomers = useCallback(() => {
    setCustomers(getCustomers());
  }, []);

  const refreshAlerts = useCallback(() => {
    const a = getAlerts();
    setAlerts(a);
    setUnreadCount(a.filter((x) => !x.read).length);
  }, []);

  const updateSettings = useCallback((s: AppSettings) => {
    saveSettings(s);
    setSettingsState(s);
  }, []);

  const toggleTheme = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      const s = getSettings();
      saveSettings({ ...s, theme: next ? "dark" : "light" });
      return next;
    });
  }, []);

  return (
    <AppContext.Provider
      value={{
        session,
        customers,
        alerts,
        unreadCount,
        settings,
        currentPage,
        selectedCustomerId,
        isDark,
        login,
        logout,
        navigate,
        refreshCustomers,
        refreshAlerts,
        updateSettings,
        toggleTheme,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
