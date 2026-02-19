import type { Transaction, RiskBand } from "@/types";

const NAMES = [
  "Arjun Sharma", "Priya Patel", "Vikram Mehta", "Sneha Rao", "Rahul Gupta",
  "Ananya Singh", "Rohit Kumar", "Kavita Nair", "Suresh Iyer", "Deepa Joshi",
  "Arun Verma", "Meena Reddy", "Kiran Bose", "Pooja Agarwal", "Ravi Pillai",
];

function randomInt(min: number, max: number, seed: number = 0): number {
  const x = Math.sin(seed + min + max) * 10000;
  return Math.floor((x - Math.floor(x)) * (max - min + 1)) + min;
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function genId(): string {
  return `TXN-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

interface SyntheticOptions {
  customerId: string;
  riskLevel: RiskBand;
  days: number;
  numTransactions: number;
  includeSalary: boolean;
}

const CATEGORIES_BY_TYPE = {
  credit: ["salary", "transfer", "refund", "interest", "cashback"],
  debit: [
    "grocery", "utility", "dining", "shopping", "atm_withdrawal",
    "loan_repayment", "entertainment", "transfer", "insurance",
  ],
};

const HIGH_RISK_DEBIT_CATS = [
  "lending_app", "atm_withdrawal", "gambling", "loan_app",
];

const CHANNELS = ["UPI", "Card", "NetBanking", "ATM", "AutoDebit", "Cash"];

export function generateSyntheticCSV(opts: SyntheticOptions): string {
  const { customerId, riskLevel, days, numTransactions, includeSalary } = opts;
  const nameIdx = customerId.charCodeAt(customerId.length - 1) % NAMES.length;
  const customerName = NAMES[nameIdx];

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startDateStr = startDate.toISOString().slice(0, 10);

  const txns: Transaction[] = [];
  let balance = riskLevel === "Critical" ? 8000 : riskLevel === "High" ? 15000 : riskLevel === "Medium" ? 30000 : 60000;

  const avgSalary =
    riskLevel === "Critical" ? 25000 :
    riskLevel === "High" ? 35000 :
    riskLevel === "Medium" ? 45000 : 60000;

  // Generate monthly salary
  if (includeSalary) {
    for (let m = 0; m < Math.ceil(days / 30); m++) {
      const baseDay = riskLevel === "Critical" ? 12 + m * 4 : riskLevel === "High" ? 5 + m * 2 : 5;
      const salaryDate = addDays(startDateStr, m * 30 + baseDay);
      if (salaryDate <= new Date().toISOString().slice(0, 10)) {
        const amount = riskLevel === "Critical"
          ? avgSalary * (1 - 0.15 * m)
          : riskLevel === "High" ? avgSalary * (1 - 0.05 * m) : avgSalary;
        balance += amount;
        txns.push({
          transactionId: genId(),
          customerId,
          date: salaryDate,
          amount: Math.round(Math.max(amount, 15000)),
          type: "credit",
          category: "salary",
          balance: Math.round(balance),
          merchant: "Employer Corp",
          channel: "NetBanking",
        });
      }
    }
  }

  // Loan repayment monthly
  for (let m = 0; m < Math.ceil(days / 30); m++) {
    const repayDay = riskLevel === "Critical" ? 12 + m * 5 : 10;
    const repayDate = addDays(startDateStr, m * 30 + repayDay);
    if (repayDate <= new Date().toISOString().slice(0, 10) && riskLevel !== "Low") {
      const amount = 8000;
      balance -= amount;
      txns.push({
        transactionId: genId(),
        customerId,
        date: repayDate,
        amount,
        type: "debit",
        category: "loan_repayment",
        balance: Math.round(balance),
        merchant: "Bank EMI",
        channel: "AutoDebit",
      });
    }
  }

  // Fill with random transactions up to numTransactions
  const remaining = numTransactions - txns.length;
  const spread = days / Math.max(remaining, 1);

  for (let i = 0; i < remaining; i++) {
    const dayOffset = Math.round(i * spread + Math.random() * spread);
    const txnDate = addDays(startDateStr, Math.min(dayOffset, days - 1));

    const isDebit = Math.random() > 0.3;
    let category: string;
    let amount: number;
    let channel: string;

    if (isDebit) {
      if (riskLevel === "Critical" && Math.random() > 0.5) {
        category = HIGH_RISK_DEBIT_CATS[Math.floor(Math.random() * HIGH_RISK_DEBIT_CATS.length)];
      } else if (riskLevel === "High" && Math.random() > 0.65) {
        category = HIGH_RISK_DEBIT_CATS[Math.floor(Math.random() * 2)];
      } else {
        category = CATEGORIES_BY_TYPE.debit[Math.floor(Math.random() * CATEGORIES_BY_TYPE.debit.length)];
      }
      amount = riskLevel === "Critical"
        ? Math.round(Math.random() * 8000 + 500)
        : Math.round(Math.random() * 5000 + 200);
      channel = category === "atm_withdrawal" || category.includes("atm")
        ? "ATM"
        : CHANNELS[Math.floor(Math.random() * CHANNELS.length)];
      balance -= amount;
    } else {
      category = CATEGORIES_BY_TYPE.credit[Math.floor(Math.random() * CATEGORIES_BY_TYPE.credit.length)];
      amount = Math.round(Math.random() * 3000 + 100);
      channel = CHANNELS[Math.floor(Math.random() * CHANNELS.length)];
      balance += amount;
    }

    txns.push({
      transactionId: genId(),
      customerId,
      date: txnDate,
      amount,
      type: isDebit ? "debit" : "credit",
      category,
      balance: Math.round(Math.max(balance, 0)),
      merchant: `${category.charAt(0).toUpperCase() + category.slice(1)} Merchant`,
      channel: channel as Transaction["channel"],
    });
  }

  // Sort by date
  txns.sort((a, b) => a.date.localeCompare(b.date));

  const header = "transaction_id,customer_id,customer_name,date,amount,type,category,balance,merchant,channel";
  const rows = txns.map((t) =>
    `${t.transactionId},${customerId},${customerName},${t.date},${t.amount},${t.type},${t.category},${t.balance},${t.merchant},${t.channel}`
  );

  return [header, ...rows].join("\n");
}

export function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
