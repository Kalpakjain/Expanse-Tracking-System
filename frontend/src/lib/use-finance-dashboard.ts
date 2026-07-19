"use client";

import { startTransition, useCallback, useEffect, useState } from "react";

import { deactivateAccount, deleteTransaction, getAccounts, getCategories, getSummary, getTransactions } from "@/lib/api";
import type { Category, DashboardSummary, PaymentAccount, Transaction } from "@/lib/types";

const fallbackSummary: DashboardSummary = {
  total_income: 0,
  total_expenses: 280,
  balance: -280,
  transaction_count: 1,
  category_count: 4,
};

const fallbackTransactions: Transaction[] = [
  {
    id: "seed-transaction",
    account_id: null,
    account_name: "Primary Wallet",
    account_display_name: "Primary Wallet",
    category_id: "seed-category",
    category_name: "Food",
    type: "expense",
    amount: 280,
    currency_code: "INR",
    merchant_name: "Local Grocery",
    description: "Weekly essentials",
    transaction_date: new Date().toISOString().slice(0, 10),
    payment_method: "UPI",
    notes: "Seed data for the dashboard preview",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const fallbackAccounts: PaymentAccount[] = [
  {
    id: "primary-wallet",
    name: "Primary Wallet",
    type: "wallet",
    institution_name: "",
    opening_balance: 0,
    current_balance: -280,
    currency_code: "INR",
    color: "#0051D5",
    is_default: true,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const fallbackCategories: Category[] = [
  {
    id: "food",
    name: "Food",
    type: "expense",
    color: "#D97706",
    icon: "utensils",
    is_default: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "transport",
    name: "Transport",
    type: "expense",
    color: "#2563EB",
    icon: "bus",
    is_default: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "bills",
    name: "Bills",
    type: "expense",
    color: "#7C3AED",
    icon: "receipt",
    is_default: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "salary",
    name: "Salary",
    type: "income",
    color: "#15803D",
    icon: "briefcase",
    is_default: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export function useFinanceDashboard() {
  const [summary, setSummary] = useState<DashboardSummary>(fallbackSummary);
  const [transactions, setTransactions] = useState<Transaction[]>(fallbackTransactions);
  const [categories, setCategories] = useState<Category[]>(fallbackCategories);
  const [accounts, setAccounts] = useState<PaymentAccount[]>(fallbackAccounts);
  const [statusLabel, setStatusLabel] = useState("Using local preview data while the API spins up.");
  const [deletingTransactionId, setDeletingTransactionId] = useState<string | null>(null);
  const [deactivatingAccountId, setDeactivatingAccountId] = useState<string | null>(null);

  const loadDashboard = useCallback(async (successLabel?: string) => {
    try {
      const [nextSummary, nextTransactions, nextCategories, nextAccounts] = await Promise.all([
        getSummary(),
        getTransactions(),
        getCategories(),
        getAccounts(),
      ]);

      startTransition(() => {
        setSummary(nextSummary);
        setTransactions(nextTransactions);
        setCategories(nextCategories);
        setAccounts(nextAccounts);
        setStatusLabel(successLabel ?? "Connected to the FastAPI backend.");
      });
    } catch {
      startTransition(() => {
        setStatusLabel("API not connected yet, so the dashboard is showing local preview data.");
      });
    }
  }, []);

  useEffect(() => {
    async function hydrate() {
      await loadDashboard();
    }

    void hydrate();
  }, [loadDashboard]);

  async function removeTransaction(transactionId: string) {
    setDeletingTransactionId(transactionId);
    try {
      await deleteTransaction(transactionId);
      await loadDashboard("Transaction deleted and dashboard refreshed from the database.");
    } catch {
      setStatusLabel("Could not delete the transaction right now.");
    } finally {
      setDeletingTransactionId(null);
    }
  }

  async function removeAccount(accountId: string) {
    setDeactivatingAccountId(accountId);
    try {
      await deactivateAccount(accountId);
      await loadDashboard("Account deactivated and dashboard refreshed from the database.");
    } catch {
      setStatusLabel("Could not deactivate the account right now.");
    } finally {
      setDeactivatingAccountId(null);
    }
  }

  return {
    summary,
    transactions,
    categories,
    accounts,
    statusLabel,
    deletingTransactionId,
    deactivatingAccountId,
    loadDashboard,
    removeTransaction,
    removeAccount,
  };
}
