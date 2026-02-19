import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { useApp } from "@/hooks/useAppStore";
import { LoginPage } from "@/pages/LoginPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { UploadPage } from "@/pages/UploadPage";
import { CustomersPage } from "@/pages/CustomersPage";
import { CustomerDetailPage } from "@/pages/CustomerDetailPage";
import { AlertsPage } from "@/pages/AlertsPage";
import { ModelPage } from "@/pages/ModelPage";
import { AuditLogsPage } from "@/pages/AuditLogsPage";
import { SettingsPage } from "@/pages/SettingsPage";

const pageVariants = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
};

function PageRenderer() {
  const { currentPage } = useApp();
  const pageMap: Record<string, React.ReactNode> = {
    dashboard: <DashboardPage />,
    upload: <UploadPage />,
    customers: <CustomersPage />,
    "customer-detail": <CustomerDetailPage />,
    alerts: <AlertsPage />,
    model: <ModelPage />,
    audit: <AuditLogsPage />,
    settings: <SettingsPage />,
  };
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentPage}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.2 }}
        className="flex-1 overflow-auto"
      >
        {pageMap[currentPage] ?? <DashboardPage />}
      </motion.div>
    </AnimatePresence>
  );
}

export function AppLayout() {
  const { session } = useApp();

  if (!session?.loggedIn) return <LoginPage />;

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <TopBar />
        <PageRenderer />
      </div>
    </div>
  );
}
