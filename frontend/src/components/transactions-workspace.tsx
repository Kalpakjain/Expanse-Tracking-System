"use client";

import { useMemo, useState } from "react";

import { ExpenseForm } from "@/components/expense-form";
import { formatCurrency } from "@/lib/format";
import type { Transaction } from "@/lib/types";
import { useFinanceDashboard } from "@/lib/use-finance-dashboard";

type TransactionTypeFilter = "all" | "income" | "expense";
type TransactionSort = "date-desc" | "date-asc" | "amount-desc" | "amount-asc" | "category";

function currentMonthRange(): { start: string; end: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

function formatDateLabel(dateKey: string) {
  return new Date(`${dateKey}T00:00:00`).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTimeLabel(timestamp: string) {
  return new Date(timestamp).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function transactionInitials(transaction: Transaction) {
  const label = transaction.merchant_name || transaction.category_name;
  const words = label.trim().split(/\s+/).filter(Boolean);
  if (!words.length) {
    return transaction.type === "income" ? "IN" : "EX";
  }
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }
  return words.slice(0, 2).map((word) => word[0]).join("").toUpperCase();
}

function compareTransactions(sortBy: TransactionSort) {
  return (left: Transaction, right: Transaction) => {
    if (sortBy === "date-asc") {
      return left.transaction_date.localeCompare(right.transaction_date);
    }
    if (sortBy === "amount-desc") {
      return right.amount - left.amount;
    }
    if (sortBy === "amount-asc") {
      return left.amount - right.amount;
    }
    if (sortBy === "category") {
      return left.category_name.localeCompare(right.category_name) || right.transaction_date.localeCompare(left.transaction_date);
    }
    return right.transaction_date.localeCompare(left.transaction_date) || right.created_at.localeCompare(left.created_at);
  };
}

export function TransactionsWorkspace() {
  const {
    transactions,
    categories,
    accounts,
    statusLabel,
    deletingTransactionId,
    removeTransaction,
    loadDashboard,
  } = useFinanceDashboard();
  const [typeFilter, setTypeFilter] = useState<TransactionTypeFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sortBy, setSortBy] = useState<TransactionSort>("date-desc");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);

  const filteredTransactions = useMemo(
    () =>
      transactions
        .filter((transaction) => {
          const matchesType = typeFilter === "all" || transaction.type === typeFilter;
          const matchesCategory = categoryFilter === "all" || transaction.category_id === categoryFilter;
          const matchesStart = !startDate || transaction.transaction_date >= startDate;
          const matchesEnd = !endDate || transaction.transaction_date <= endDate;
          return matchesType && matchesCategory && matchesStart && matchesEnd;
        })
        .sort(compareTransactions(sortBy)),
    [categoryFilter, endDate, sortBy, startDate, transactions, typeFilter],
  );

  async function confirmDelete() {
    if (!transactionToDelete) {
      return;
    }
    await removeTransaction(transactionToDelete.id);
    setTransactionToDelete(null);
    setOpenMenuId(null);
  }

  function setThisMonthRange() {
    const range = currentMonthRange();
    setStartDate(range.start);
    setEndDate(range.end);
  }

  return (
    <main className="page-shell transactions-page">
      <section className="transactions-panel">
        <div className="transactions-history-header">
          <div className="history-icon">
            <span className="material-symbols-outlined" aria-hidden="true">receipt_long</span>
          </div>
          <div>
            <h1>Transaction History</h1>
            <p>{filteredTransactions.length} records found</p>
          </div>
          <button
            className="icon-button transactions-refresh"
            type="button"
            title="Refresh transactions"
            aria-label="Refresh transactions"
            onClick={() => {
              void loadDashboard("Transactions refreshed.");
            }}
          >
            <span className="material-symbols-outlined" aria-hidden="true">sync</span>
          </button>
        </div>

        <div className="transactions-filter-bar" aria-label="Transaction filters and sorting">
          <label className="filter-control">
            <span className="material-symbols-outlined" aria-hidden="true">filter_alt</span>
            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value as TransactionTypeFilter)}
              aria-label="Filter by transaction type"
            >
              <option value="all">All types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </label>

          <label className="filter-control">
            <span className="material-symbols-outlined" aria-hidden="true">grid_view</span>
            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              aria-label="Filter by category"
            >
              <option value="all">All categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <div className="filter-control date-filter-control">
            <span className="material-symbols-outlined" aria-hidden="true">calendar_month</span>
            <input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              aria-label="Start date"
            />
            <span className="date-separator">-</span>
            <input
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              aria-label="End date"
            />
            {(startDate || endDate) ? (
              <button className="date-filter-link" type="button" onClick={() => {
                setStartDate("");
                setEndDate("");
              }}>
                All
              </button>
            ) : (
              <button className="date-filter-link" type="button" onClick={setThisMonthRange}>
                Month
              </button>
            )}
          </div>

          <label className="filter-control sort-control">
            <span>Sort by:</span>
            <select value={sortBy} onChange={(event) => setSortBy(event.target.value as TransactionSort)} aria-label="Sort transactions">
              <option value="date-desc">Date (Newest)</option>
              <option value="date-asc">Date (Oldest)</option>
              <option value="amount-desc">Amount (High)</option>
              <option value="amount-asc">Amount (Low)</option>
              <option value="category">Category</option>
            </select>
          </label>
        </div>

        <div className="transactions-divider" />

        <div className="transactions-list">
          {filteredTransactions.length ? (
            filteredTransactions.map((transaction) => (
              <article className="transaction-history-card" key={transaction.id}>
                <div className={`transaction-avatar transaction-avatar-${transaction.type}`}>
                  {transactionInitials(transaction)}
                </div>

                <div className="transaction-main">
                  <h2>{transaction.merchant_name}</h2>
                  <p>
                    <span className="material-symbols-outlined" aria-hidden="true">sell</span>
                    {transaction.category_name} <span aria-hidden="true">•</span> {transaction.account_display_name}{" "}
                    <span aria-hidden="true">•</span> {transaction.payment_method}
                  </p>
                </div>

                <span className={`transaction-category-pill transaction-category-${transaction.type}`}>
                  {transaction.category_name}
                </span>

                <div className="transaction-date-block">
                  <span>
                    <span className="material-symbols-outlined" aria-hidden="true">calendar_today</span>
                    {formatDateLabel(transaction.transaction_date)}
                  </span>
                  <span>
                    <span className="material-symbols-outlined" aria-hidden="true">schedule</span>
                    {formatTimeLabel(transaction.created_at)}
                  </span>
                </div>

                <div className={transaction.type === "expense" ? "transaction-amount expense" : "transaction-amount income"}>
                  {transaction.type === "expense" ? "-" : "+"} {formatCurrency(transaction.amount, transaction.currency_code)}
                </div>

                <div className="transaction-menu-wrap">
                  <button
                    className="transaction-menu-button"
                    type="button"
                    aria-label={`Open actions for ${transaction.merchant_name}`}
                    onClick={() => setOpenMenuId((current) => (current === transaction.id ? null : transaction.id))}
                  >
                    <span className="material-symbols-outlined" aria-hidden="true">more_vert</span>
                  </button>
                  {openMenuId === transaction.id ? (
                    <div className="transaction-menu" role="menu">
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setEditingTransaction(transaction);
                          setOpenMenuId(null);
                        }}
                      >
                        <span className="material-symbols-outlined" aria-hidden="true">edit</span>
                        Edit
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        className="danger-menu-item"
                        disabled={deletingTransactionId === transaction.id}
                        onClick={() => {
                          setTransactionToDelete(transaction);
                          setOpenMenuId(null);
                        }}
                      >
                        <span className="material-symbols-outlined" aria-hidden="true">delete</span>
                        Delete
                      </button>
                    </div>
                  ) : null}
                </div>
              </article>
            ))
          ) : (
            <div className="empty-state">No transactions match these filters.</div>
          )}
        </div>

        <div className="transactions-end-note">
          <span aria-hidden="true">-</span>
          You&apos;ve reached the end
          <span aria-hidden="true">-</span>
        </div>

        <p className="transactions-status">{statusLabel}</p>
      </section>

      {editingTransaction ? (
        <div className="modal-backdrop" role="presentation">
          <div className="modal-panel" role="dialog" aria-modal="true" aria-label="Edit transaction form">
            <ExpenseForm
              categories={categories}
              accounts={accounts}
              transaction={editingTransaction}
              onCancel={() => setEditingTransaction(null)}
              onCreated={async () => {
                await loadDashboard("Transaction updated and refreshed.");
                setEditingTransaction(null);
              }}
            />
          </div>
        </div>
      ) : null}

      {transactionToDelete ? (
        <div className="modal-backdrop" role="presentation">
          <div className="modal-panel confirmation-panel" role="dialog" aria-modal="true" aria-label="Confirm transaction deletion">
            <h2 className="section-title">Delete transaction?</h2>
            <p className="section-copy">
              This will permanently remove <strong>{transactionToDelete.merchant_name}</strong> from your ledger.
            </p>
            <div className="confirmation-actions">
              <button className="button button-secondary" type="button" onClick={() => setTransactionToDelete(null)}>
                Cancel
              </button>
              <button
                className="button button-primary danger-action"
                type="button"
                disabled={deletingTransactionId === transactionToDelete.id}
                onClick={() => {
                  void confirmDelete();
                }}
              >
                {deletingTransactionId === transactionToDelete.id ? "Deleting..." : "Delete transaction"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
