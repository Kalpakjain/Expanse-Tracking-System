"use client";

import { startTransition, useCallback, useEffect, useState } from "react";

import { deleteTransaction, getCategories, getSummary, getTransactions } from "@/lib/api";
import type { Category, DashboardSummary, Transaction } from "@/lib/types";

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
    account_name: "Primary Wallet",
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
  const [statusLabel, setStatusLabel] = useState("Using starter preview data while the API spins up.");
  const [deletingTransactionId, setDeletingTransactionId] = useState<string | null>(null);

  const loadDashboard = useCallback(async (successLabel?: string) => {
    try {
      const [nextSummary, nextTransactions, nextCategories] = await Promise.all([
        getSummary(),
        getTransactions(),
        getCategories(),
      ]);

      startTransition(() => {
        setSummary(nextSummary);
        setTransactions(nextTransactions.length ? nextTransactions : fallbackTransactions);
        setCategories(nextCategories.length ? nextCategories : fallbackCategories);
        setStatusLabel(successLabel ?? "Connected to the FastAPI starter API.");
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

  return {
    summary,
    transactions,
    categories,
    statusLabel,
    deletingTransactionId,
    loadDashboard,
    removeTransaction,
  };
}
