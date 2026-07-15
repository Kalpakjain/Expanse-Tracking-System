"use client";

import { useMemo, useState } from "react";

import { formatCurrency } from "@/lib/format";
import { useFinanceDashboard } from "@/lib/use-finance-dashboard";

type TransactionTypeFilter = "all" | "income" | "expense";

export function TransactionsWorkspace() {
  const {
    transactions,
    categories,
    statusLabel,
    deletingTransactionId,
    removeTransaction,
    loadDashboard,
  } = useFinanceDashboard();
  const [typeFilter, setTypeFilter] = useState<TransactionTypeFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const filteredTransactions = useMemo(
    () =>
      transactions.filter((transaction) => {
        const matchesType = typeFilter === "all" || transaction.type === typeFilter;
        const matchesCategory = categoryFilter === "all" || transaction.category_id === categoryFilter;
        return matchesType && matchesCategory;
      }),
    [categoryFilter, transactions, typeFilter],
  );

  return (
    <main className="page-shell">
      <section className="dashboard-topbar">
        <div className="dashboard-welcome">
          <div className="dashboard-avatar">FT</div>
          <div>
            <p>Transactions</p>
            <h1>All ledger records in one place.</h1>
          </div>
        </div>
        <div className="dashboard-toolbar">
          <span className="status-chip">
            <span className="material-symbols-outlined" aria-hidden="true">cloud_done</span>
            {statusLabel}
          </span>
          <button
            className="icon-button"
            type="button"
            aria-label="Refresh transactions"
            title="Refresh transactions"
            onClick={() => {
              void loadDashboard("Transactions refreshed.");
            }}
          >
            <span className="material-symbols-outlined" aria-hidden="true">sync</span>
          </button>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2 className="section-title">Transaction history</h2>
            <p className="section-copy">{filteredTransactions.length} records shown.</p>
          </div>
          <div className="transaction-filter-row">
            <select
              className="field-input compact-select"
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value as TransactionTypeFilter)}
              aria-label="Filter by transaction type"
            >
              <option value="all">All types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
            <select
              className="field-input compact-select"
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
          </div>
        </div>

        <div className="list">
          {filteredTransactions.length ? (
            filteredTransactions.map((transaction) => (
              <div className="list-item" key={transaction.id}>
                <div className="list-main">
                  <div>
                    <div className="item-title">{transaction.merchant_name}</div>
                    <div className="item-subtitle">
                      {transaction.category_name} • {transaction.account_display_name} • {transaction.payment_method} •{" "}
                      {transaction.transaction_date}
                    </div>
                  </div>
                  <div className="row-actions">
                    <button
                      className="button button-tertiary compact-button"
                      type="button"
                      disabled={deletingTransactionId === transaction.id}
                      onClick={() => {
                        void removeTransaction(transaction.id);
                      }}
                    >
                      {deletingTransactionId === transaction.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
                <div className={transaction.type === "expense" ? "amount-expense" : "amount-income"}>
                  {transaction.type === "expense" ? "-" : "+"}
                  {formatCurrency(transaction.amount, transaction.currency_code)}
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">No transactions match these filters.</div>
          )}
        </div>
      </section>
    </main>
  );
}
