import React, { useState } from "react";
import { motion } from "framer-motion";
import { Shield, Eye, EyeOff, Lock, User } from "lucide-react";
import { useApp } from "@/hooks/useAppStore";
import { log } from "@/utils/auditLogger";
import { setCurrentUser } from "@/utils/auditLogger";

const DEMO_USERS = [
  { username: "analyst", password: "demo123", name: "Rajan Mehta", role: "Risk Analyst" },
  { username: "admin", password: "admin123", name: "Priya Kapoor", role: "Portfolio Manager" },
];

export function LoginPage() {
  const { login } = useApp();
  const [username, setUsername] = useState("analyst");
  const [password, setPassword] = useState("demo123");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = DEMO_USERS.find(
      (u) => u.username === username && u.password === password
    );
    if (!user) {
      setError("Invalid credentials. Try analyst / demo123");
      return;
    }
    setError("");
    setLoading(true);
    setTimeout(() => {
      setCurrentUser(user.name);
      login(user.name, user.role);
      log("LOGIN", `User "${user.name}" logged in`, { role: user.role });
    }, 1000);
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
      {/* Left branding panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-lg leading-none">PreDelinq AI</p>
            <p className="text-blue-400 text-xs">Pre-Delinquency Intervention Engine</p>
          </div>
        </div>

        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-bold text-white leading-tight">
              Detect stress early.
              <br />
              <span className="text-blue-400">Explain risk clearly.</span>
              <br />
              Intervene proactively.
            </h1>
            <p className="text-blue-200/60 mt-4 text-sm leading-relaxed max-w-sm">
              Banking-grade pre-delinquency detection powered by behavioral signal analysis and explainable AI.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "ROC-AUC", value: "0.87" },
              { label: "Precision", value: "81%" },
              { label: "Recall", value: "80%" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl bg-white/5 border border-white/10 p-4">
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-blue-300/70 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-blue-400/40 text-xs">
          Banking-grade security · No protected attributes · Fully auditable
        </p>
      </div>

      {/* Right login form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-sm"
        >
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-8 shadow-2xl">
            <div className="mb-8 text-center">
              <div className="mx-auto w-12 h-12 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-white">Secure Sign In</h2>
              <p className="text-blue-300/60 text-sm mt-1">Risk Intelligence Platform</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-blue-200">Username</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/40 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="Username"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-blue-200">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400" />
                  <input
                    type={showPwd ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/40 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="Password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                  >
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-xs text-red-400 bg-red-400/10 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-lg bg-primary text-white font-semibold text-sm hover:bg-primary-glow transition-colors disabled:opacity-60 mt-2 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Authenticating...
                  </>
                ) : (
                  "Sign In to Platform"
                )}
              </button>
            </form>

            <div className="mt-5 pt-4 border-t border-white/10">
              <p className="text-[10px] text-blue-400/50 text-center">
                Demo: analyst / demo123 · admin / admin123
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
