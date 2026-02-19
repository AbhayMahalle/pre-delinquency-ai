import Papa from "papaparse";
import type { Transaction, TxnChannel } from "@/types";

export interface ParseResult {
  transactions: Transaction[];
  errors: string[];
  warnings: string[];
  rawRows: number;
}

const VALID_CHANNELS: TxnChannel[] = [
  "UPI",
  "ATM",
  "Card",
  "NetBanking",
  "Cash",
  "AutoDebit",
];

function generateId(prefix = "TXN"): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

function parseDate(raw: string): string | null {
  if (!raw) return null;
  // Try yyyy-mm-dd
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw.trim())) return raw.trim();
  // Try dd/mm/yyyy or dd-mm-yyyy
  const match = raw.trim().match(/^(\d{2})[/-](\d{2})[/-](\d{4})$/);
  if (match) return `${match[3]}-${match[2]}-${match[1]}`;
  // Try mm/dd/yyyy
  const match2 = raw.trim().match(/^(\d{2})[/-](\d{2})[/-](\d{4})$/);
  if (match2) return null;
  // Try ISO with time
  const d = new Date(raw.trim());
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return null;
}

export function parseCSV(csvText: string): ParseResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const transactions: Transaction[] = [];

  const result = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase().replace(/\s+/g, "_"),
  });

  const rawRows = result.data.length;

  if (rawRows === 0) {
    errors.push("CSV file is empty.");
    return { transactions, errors, warnings, rawRows };
  }

  const headers = Object.keys(result.data[0] || {});

  // Check required fields
  if (!headers.includes("customer_id")) {
    errors.push("Missing required column: customer_id");
    return { transactions, errors, warnings, rawRows };
  }
  if (!headers.includes("date")) {
    errors.push("Missing required column: date (format: yyyy-mm-dd)");
    return { transactions, errors, warnings, rawRows };
  }
  if (!headers.includes("amount")) {
    errors.push("Missing required column: amount");
    return { transactions, errors, warnings, rawRows };
  }
  if (!headers.includes("type")) {
    errors.push("Missing required column: type (credit/debit)");
    return { transactions, errors, warnings, rawRows };
  }

  // Check single customer_id
  const customerIds = [
    ...new Set(result.data.map((r) => r["customer_id"]?.trim())),
  ].filter(Boolean);
  if (customerIds.length > 1) {
    errors.push(
      `Upload must contain only one customer_id per file. Found: ${customerIds.join(", ")}`
    );
    return { transactions, errors, warnings, rawRows };
  }
  if (customerIds.length === 0) {
    errors.push("No valid customer_id found in file.");
    return { transactions, errors, warnings, rawRows };
  }

  if (!headers.includes("balance")) {
    warnings.push(
      "Column 'balance' missing — will compute running balance from transactions."
    );
  }
  if (!headers.includes("category")) {
    warnings.push("Column 'category' missing — will default to 'other'.");
  }
  if (!headers.includes("merchant")) {
    warnings.push("Column 'merchant' missing — will default to 'Unknown Merchant'.");
  }
  if (!headers.includes("channel")) {
    warnings.push("Column 'channel' missing — will default to 'UPI'.");
  }

  let runningBalance = 0;
  let balanceInitialized = false;

  for (let i = 0; i < result.data.length; i++) {
    const row = result.data[i];
    const rowNum = i + 2; // header = row 1

    const customerId = row["customer_id"]?.trim();
    if (!customerId) {
      warnings.push(`Row ${rowNum}: Empty customer_id, skipping.`);
      continue;
    }

    // Date
    const dateRaw = row["date"]?.trim();
    const date = parseDate(dateRaw);
    if (!date) {
      errors.push(
        `Row ${rowNum}: Invalid date "${dateRaw}". Expected format: yyyy-mm-dd`
      );
      return { transactions, errors, warnings, rawRows };
    }

    // Amount
    const amountRaw = row["amount"]?.trim();
    const amount = parseFloat(amountRaw?.replace(/[^0-9.-]/g, ""));
    if (isNaN(amount)) {
      errors.push(`Row ${rowNum}: Invalid amount "${amountRaw}"`);
      return { transactions, errors, warnings, rawRows };
    }

    // Type
    const typeRaw = row["type"]?.trim().toLowerCase();
    if (typeRaw !== "credit" && typeRaw !== "debit") {
      errors.push(
        `Row ${rowNum}: Invalid type "${row["type"]}". Must be "credit" or "debit"`
      );
      return { transactions, errors, warnings, rawRows };
    }

    // Balance
    let balance: number;
    if (headers.includes("balance") && row["balance"]) {
      balance = parseFloat(row["balance"].replace(/[^0-9.-]/g, ""));
      if (isNaN(balance)) {
        if (!balanceInitialized) runningBalance = 0;
        balance = runningBalance + (typeRaw === "credit" ? amount : -amount);
      }
    } else {
      balance = runningBalance + (typeRaw === "credit" ? amount : -amount);
    }
    runningBalance = balance;
    balanceInitialized = true;

    // Channel
    const channelRaw = row["channel"]?.trim() as TxnChannel;
    const channel: TxnChannel = VALID_CHANNELS.includes(channelRaw)
      ? channelRaw
      : "UPI";

    transactions.push({
      transactionId:
        row["transaction_id"]?.trim() || generateId(),
      customerId,
      date,
      amount,
      type: typeRaw as "credit" | "debit",
      category: row["category"]?.trim().toLowerCase() || "other",
      balance,
      merchant: row["merchant"]?.trim() || "Unknown Merchant",
      channel,
    });
  }

  // Sort by date ascending
  transactions.sort((a, b) => a.date.localeCompare(b.date));

  return { transactions, errors, warnings, rawRows };
}
