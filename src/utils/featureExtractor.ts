import type { Transaction, FeatureExtraction } from "@/types";

const SALARY_CATEGORIES = ["salary", "income", "payroll"];
const UTILITY_CATEGORIES = [
  "utility",
  "electricity",
  "water",
  "gas",
  "mobile",
  "internet",
  "telecom",
];
const LENDING_CATEGORIES = [
  "lending_app",
  "loan_app",
  "instant_loan",
  "lending",
  "loan",
];
const ATM_CATEGORIES = ["atm_withdrawal", "atm", "cash_withdrawal"];
const DISCRETIONARY_CATEGORIES = ["entertainment", "shopping", "dining", "restaurant", "travel", "leisure"];
const LOAN_REPAYMENT_CATEGORIES = ["loan_repayment", "emi", "repayment", "mortgage"];
const GAMBLING_CATEGORIES = ["gambling", "lottery", "casino", "betting"];

function getDay(dateStr: string): number {
  return new Date(dateStr).getDate();
}

function daysBetween(d1: string, d2: string): number {
  return Math.abs(
    (new Date(d1).getTime() - new Date(d2).getTime()) / 86400000
  );
}

function getMonthKey(dateStr: string): string {
  return dateStr.slice(0, 7); // yyyy-mm
}

function isSalaryTxn(txn: Transaction): boolean {
  return (
    txn.type === "credit" &&
    (SALARY_CATEGORIES.some((c) => txn.category.includes(c)) ||
      SALARY_CATEGORIES.some((c) => txn.merchant.toLowerCase().includes(c)) ||
      txn.amount > 20000)
  );
}

function getDateNDaysAgo(txns: Transaction[], days: number): string {
  if (txns.length === 0) return new Date().toISOString().slice(0, 10);
  const last = txns[txns.length - 1].date;
  const d = new Date(last);
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function std(arr: number[]): number {
  if (arr.length < 2) return 0;
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  const variance = arr.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / arr.length;
  return Math.sqrt(variance);
}

export function extractFeatures(txns: Transaction[]): FeatureExtraction {
  const flags: string[] = [];
  const sortedTxns = [...txns].sort((a, b) => a.date.localeCompare(b.date));
  const lastDate = sortedTxns[sortedTxns.length - 1]?.date ?? new Date().toISOString().slice(0, 10);

  const date14ago = getDateNDaysAgo(sortedTxns, 14);
  const date30ago = getDateNDaysAgo(sortedTxns, 30);
  const date60ago = getDateNDaysAgo(sortedTxns, 60);

  const last14 = sortedTxns.filter((t) => t.date >= date14ago);
  const prev14 = sortedTxns.filter((t) => t.date >= getDateNDaysAgo(sortedTxns, 28) && t.date < date14ago);
  const last30 = sortedTxns.filter((t) => t.date >= date30ago);
  const last60 = sortedTxns.filter((t) => t.date >= date60ago);

  // ------- 1. Salary delay -------
  const salaryTxns = sortedTxns.filter(isSalaryTxn);
  const byMonth = new Map<string, Transaction[]>();
  for (const t of salaryTxns) {
    const mk = getMonthKey(t.date);
    if (!byMonth.has(mk)) byMonth.set(mk, []);
    byMonth.get(mk)!.push(t);
  }
  const monthKeys = [...byMonth.keys()].sort();
  let salaryDelayDays = 0;
  if (monthKeys.length >= 2) {
    const prevDays = monthKeys
      .slice(0, -1)
      .map((mk) => {
        const arr = byMonth.get(mk)!;
        return Math.min(...arr.map((t) => getDay(t.date)));
      });
    const baseline = prevDays.reduce((a, b) => a + b, 0) / prevDays.length;
    const lastMonthKey = monthKeys[monthKeys.length - 1];
    const lastMonthTxns = byMonth.get(lastMonthKey)!;
    const currentDay = Math.min(...lastMonthTxns.map((t) => getDay(t.date)));
    salaryDelayDays = Math.max(0, currentDay - baseline);
    if (salaryDelayDays > 3) flags.push("Salary Delay Signal");
  }

  // ------- 2. Salary drop -------
  let salaryDropPercent = 0;
  if (monthKeys.length >= 2) {
    const prevSalaries = monthKeys.slice(0, -1).map((mk) => {
      const arr = byMonth.get(mk)!;
      return arr.reduce((s, t) => s + t.amount, 0);
    });
    const avgPrev = prevSalaries.reduce((a, b) => a + b, 0) / prevSalaries.length;
    const lastMk = monthKeys[monthKeys.length - 1];
    const currentSalary = byMonth.get(lastMk)!.reduce((s, t) => s + t.amount, 0);
    if (avgPrev > 0) {
      salaryDropPercent = Math.max(0, ((avgPrev - currentSalary) / avgPrev) * 100);
      if (salaryDropPercent > 10) flags.push("Salary Drop Signal");
    }
  }

  // ------- 3. Savings drawdown -------
  let savingsDrawdownPercent = 0;
  if (sortedTxns.length > 0) {
    const weekAgo = getDateNDaysAgo(sortedTxns, 7);
    const twoWeeksAgo = getDateNDaysAgo(sortedTxns, 14);
    const lastWeekTxns = sortedTxns.filter((t) => t.date >= weekAgo);
    const prevWeekTxns = sortedTxns.filter((t) => t.date >= twoWeeksAgo && t.date < weekAgo);
    if (lastWeekTxns.length > 0 && prevWeekTxns.length > 0) {
      const avgLast = lastWeekTxns.reduce((s, t) => s + t.balance, 0) / lastWeekTxns.length;
      const avgPrev = prevWeekTxns.reduce((s, t) => s + t.balance, 0) / prevWeekTxns.length;
      if (avgPrev > 0) {
        savingsDrawdownPercent = Math.max(0, ((avgPrev - avgLast) / avgPrev) * 100);
        if (savingsDrawdownPercent > 8) flags.push("Savings Drawdown Signal");
      }
    }
  }

  // ------- 4. Utility delay -------
  const utilityTxns = sortedTxns.filter((t) =>
    UTILITY_CATEGORIES.some((c) => t.category.includes(c))
  );
  const utilityByMonth = new Map<string, Transaction[]>();
  for (const t of utilityTxns) {
    const mk = getMonthKey(t.date);
    if (!utilityByMonth.has(mk)) utilityByMonth.set(mk, []);
    utilityByMonth.get(mk)!.push(t);
  }
  const utilityMonthKeys = [...utilityByMonth.keys()].sort();
  let utilityDelayDays = 0;
  if (utilityMonthKeys.length >= 2) {
    const prevDays = utilityMonthKeys.slice(0, -1).map((mk) => {
      const arr = utilityByMonth.get(mk)!;
      return Math.min(...arr.map((t) => getDay(t.date)));
    });
    const baseline = prevDays.reduce((a, b) => a + b, 0) / prevDays.length;
    const lastMk = utilityMonthKeys[utilityMonthKeys.length - 1];
    const currentDay = Math.min(...utilityByMonth.get(lastMk)!.map((t) => getDay(t.date)));
    utilityDelayDays = Math.max(0, currentDay - baseline);
    if (utilityDelayDays > 4) flags.push("Late Utility Payments");
  }

  // ------- 5. Lending app spike -------
  const lendingLast14 = last14.filter((t) =>
    LENDING_CATEGORIES.some((c) => t.category.includes(c))
  ).length;
  const lendingPrev14 = prev14.filter((t) =>
    LENDING_CATEGORIES.some((c) => t.category.includes(c))
  ).length;
  const lendingAppSpikeRatio =
    lendingPrev14 > 0 ? lendingLast14 / lendingPrev14 : lendingLast14 > 0 ? 3 : 0;
  if (lendingAppSpikeRatio > 1.5 || lendingLast14 >= 3) flags.push("Lending App Spike");

  // ------- 6. ATM withdrawal spike -------
  const atmLast14 = last14.filter((t) =>
    ATM_CATEGORIES.some((c) => t.category.includes(c)) || t.channel === "ATM"
  ).length;
  const atmBaseline30 = last30.filter((t) =>
    ATM_CATEGORIES.some((c) => t.category.includes(c)) || t.channel === "ATM"
  ).length / 2;
  const atmWithdrawalSpikeRatio = atmBaseline30 > 0 ? atmLast14 / atmBaseline30 : 0;
  if (atmWithdrawalSpikeRatio > 1.7) flags.push("Cash Hoarding Behavior");

  // ------- 7. Discretionary spend drop -------
  const discLast14 = last14
    .filter((t) => DISCRETIONARY_CATEGORIES.some((c) => t.category.includes(c)))
    .reduce((s, t) => s + t.amount, 0);
  const discPrev14 = prev14
    .filter((t) => DISCRETIONARY_CATEGORIES.some((c) => t.category.includes(c)))
    .reduce((s, t) => s + t.amount, 0);
  const discretionarySpendDropPercent =
    discPrev14 > 0 ? Math.max(0, ((discPrev14 - discLast14) / discPrev14) * 100) : 0;
  if (discretionarySpendDropPercent > 20) flags.push("Discretionary Spend Drop");

  // ------- 8. Failed auto-debit -------
  const loanRepayByMonth = new Map<string, Transaction[]>();
  for (const t of sortedTxns.filter((t) =>
    LOAN_REPAYMENT_CATEGORIES.some((c) => t.category.includes(c))
  )) {
    const mk = getMonthKey(t.date);
    if (!loanRepayByMonth.has(mk)) loanRepayByMonth.set(mk, []);
    loanRepayByMonth.get(mk)!.push(t);
  }
  const lrMonthKeys = [...loanRepayByMonth.keys()].sort();
  let failedAutoDebitCount = 0;
  if (lrMonthKeys.length >= 2) {
    const prevMonths = lrMonthKeys.slice(0, -1);
    const lastMonth = lrMonthKeys[lrMonthKeys.length - 1];
    if (prevMonths.length > 0 && !loanRepayByMonth.has(lastMonth)) {
      failedAutoDebitCount = 1;
    }
    const expectedDay =
      prevMonths.map((mk) => {
        const arr = loanRepayByMonth.get(mk)!;
        return Math.min(...arr.map((t) => getDay(t.date)));
      }).reduce((a, b) => a + b, 0) / prevMonths.length;
    const lastArr = loanRepayByMonth.get(lastMonth);
    if (lastArr) {
      const actualDay = Math.min(...lastArr.map((t) => getDay(t.date)));
      if (actualDay - expectedDay > 7) failedAutoDebitCount = 1;
    }
  }
  if (failedAutoDebitCount >= 1) flags.push("Repayment Missed Risk");

  // ------- 9. Volatility index -------
  const dailyDebits = new Map<string, number>();
  for (const t of last30) {
    if (t.type === "debit") {
      dailyDebits.set(t.date, (dailyDebits.get(t.date) ?? 0) + t.amount);
    }
  }
  const debitArr = [...dailyDebits.values()];
  const meanDebit = debitArr.length
    ? debitArr.reduce((a, b) => a + b, 0) / debitArr.length
    : 0;
  const spendingVolatilityIndex =
    meanDebit > 0 ? std(debitArr) / meanDebit : 0;
  if (spendingVolatilityIndex > 0.8) flags.push("High Volatility Spend");

  // ------- 10. Debt burden ratio -------
  const loanRepay30 = last30
    .filter((t) => LOAN_REPAYMENT_CATEGORIES.some((c) => t.category.includes(c)))
    .reduce((s, t) => s + t.amount, 0);
  const salary60 = last60.filter(isSalaryTxn).reduce((s, t) => s + t.amount, 0);
  const debtBurdenRatio = salary60 > 0 ? loanRepay30 / salary60 : 0;
  if (debtBurdenRatio > 0.35) flags.push("High Debt Burden");

  // ------- 11. Cashflow -------
  const totalCredits30 = last30.filter((t) => t.type === "credit").reduce((s, t) => s + t.amount, 0);
  const totalDebits30 = last30.filter((t) => t.type === "debit").reduce((s, t) => s + t.amount, 0);
  const netCashflow = totalCredits30 - totalDebits30;
  if (netCashflow < 0) flags.push("Negative Cashflow");

  // ------- 12. Gambling -------
  const gamblingLast30 = last30
    .filter((t) => GAMBLING_CATEGORIES.some((c) => t.category.includes(c)))
    .reduce((s, t) => s + t.amount, 0);
  const prev30 = sortedTxns.filter(
    (t) => t.date >= getDateNDaysAgo(sortedTxns, 60) && t.date < date30ago
  );
  const gamblingPrev30 = prev30
    .filter((t) => GAMBLING_CATEGORIES.some((c) => t.category.includes(c)))
    .reduce((s, t) => s + t.amount, 0);
  const gamblingSpendRatio = gamblingPrev30 > 0 ? gamblingLast30 / gamblingPrev30 : 0;
  if (gamblingSpendRatio > 2) flags.push("High Gambling Spend");

  return {
    salaryDelayDays,
    salaryDropPercent,
    savingsDrawdownPercent,
    utilityDelayDays,
    lendingAppTxnCount: lendingLast14,
    atmWithdrawalSpikeRatio,
    discretionarySpendDropPercent,
    failedAutoDebitCount,
    spendingVolatilityIndex,
    debtBurdenRatio,
    netCashflow,
    gamblingSpendRatio,
    flags,
  };
}

export function detectSegment(txns: Transaction[]): "Salaried" | "Self-employed" | "Student" | "Retired" {
  const salaryTxns = txns.filter((t) =>
    t.type === "credit" && SALARY_CATEGORIES.some((c) => t.category.includes(c))
  );
  const avgAmount = txns.filter((t) => t.type === "credit").reduce((s, t) => s + t.amount, 0) / Math.max(txns.length, 1);
  if (salaryTxns.length > 0) return "Salaried";
  if (avgAmount < 5000) return "Student";
  if (avgAmount > 15000) return "Self-employed";
  return "Retired";
}

export function computeDataConfidence(txns: Transaction[]): number {
  if (txns.length >= 90) return 0.95;
  if (txns.length >= 60) return 0.85;
  if (txns.length >= 30) return 0.75;
  if (txns.length >= 15) return 0.60;
  return 0.40;
}
