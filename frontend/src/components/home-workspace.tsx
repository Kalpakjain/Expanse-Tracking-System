"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { AccountForm } from "@/components/account-form";
import { ExpenseForm } from "@/components/expense-form";
import { exportTransactionsCsv, importTransactionsCsv } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { useFinanceDashboard } from "@/lib/use-finance-dashboard";
import type { Category, PaymentAccount, Transaction } from "@/lib/types";

const chartFallbackColors = ["#B0305C", "#1F2A44", "#A8823C", "#D6426B", "#6D78CC", "#10B981"];

function buildCategoryAnalysis(transactions: Transaction[], categories: Category[]) {
  const categoryColors = new Map(categories.map((category) => [category.name, category.color]));
  const categoryTotals = new Map<string, { amount: number; count: number; color: string }>();

  for (const transaction of transactions) {
    if (transaction.type !== "expense") {
      continue;
    }
    const current = categoryTotals.get(transaction.category_name) ?? {
      amount: 0,
      count: 0,
      color:
        categoryColors.get(transaction.category_name) ??
        chartFallbackColors[categoryTotals.size % chartFallbackColors.length],
    };
    current.amount += transaction.amount;
    current.count += 1;
    categoryTotals.set(transaction.category_name, current);
  }

  return Array.from(categoryTotals.entries())
    .map(([name, metrics]) => ({ name, ...metrics }))
    .sort((left, right) => right.amount - left.amount);
}

function buildCurrentMonthSummary(transactions: Transaction[]) {
  const today = new Date();
  const currentMonthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

  return transactions.reduce(
    (totals, transaction) => {
      if (transaction.transaction_date.slice(0, 7) !== currentMonthKey) {
        return totals;
      }

      if (transaction.type === "income") {
        totals.income += transaction.amount;
      } else {
        totals.expense += transaction.amount;
      }
      totals.balance = totals.income - totals.expense;
      return totals;
    },
    { income: 0, expense: 0, balance: 0 },
  );
}

function buildRingSegments(categories: ReturnType<typeof buildCategoryAnalysis>) {
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const total = categories.reduce((sum, category) => sum + category.amount, 0);
  const gap = total ? circumference * 0.012 : 0;
  let cursor = 0;

  return categories.map((category) => {
    const rawLength = total ? (category.amount / total) * circumference : 0;
    const length = Math.max(rawLength - gap, 0);
    const offset = circumference - cursor;
    cursor += rawLength;
    return { ...category, radius, circumference, length, offset };
  });
}

export function HomeWorkspace() {
  const {
    summary,
    transactions,
    categories,
    accounts,
    statusLabel,
    deletingTransactionId,
    deactivatingAccountId,
    loadDashboard,
    removeAccount,
    removeTransaction,
  } = useFinanceDashboard();
  const [isExpenseFormOpen, setIsExpenseFormOpen] = useState(false);
  const [isAccountFormOpen, setIsAccountFormOpen] = useState(false);
  const [transactionFormType, setTransactionFormType] = useState<"expense" | "income">("expense");
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editingAccount, setEditingAccount] = useState<PaymentAccount | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState("all");
  const [ledgerMessage, setLedgerMessage] = useState("");
  const [isImportingCsv, setIsImportingCsv] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("newExpense") === "1") {
      setTransactionFormType("expense");
      setIsExpenseFormOpen(true);
    }
    if (params.get("newIncome") === "1") {
      setTransactionFormType("income");
      setIsExpenseFormOpen(true);
    }
  }, []);

  function closeExpenseForm() {
    setIsExpenseFormOpen(false);
    setEditingTransaction(null);
    if (window.location.search.includes("newExpense=1") || window.location.search.includes("newIncome=1")) {
      window.history.replaceState({}, "", window.location.pathname);
    }
  }

  function openTransactionForm(type: "expense" | "income") {
    setEditingTransaction(null);
    setTransactionFormType(type);
    setIsExpenseFormOpen(true);
  }

  function openEditForm(transaction: Transaction) {
    setEditingTransaction(transaction);
    setTransactionFormType(transaction.type);
    setIsExpenseFormOpen(true);
  }

  function openAccountForm(account?: PaymentAccount) {
    setEditingAccount(account ?? null);
    setIsAccountFormOpen(true);
  }

  async function handleExportCsv() {
    setLedgerMessage("Preparing CSV export...");
    try {
      const blob = await exportTransactionsCsv();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "smart-expense-transactions.csv";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setLedgerMessage("CSV export downloaded.");
    } catch {
      setLedgerMessage("Could not export CSV right now.");
    }
  }

  async function handleImportCsv(file: File | null) {
    if (!file) {
      return;
    }
    setIsImportingCsv(true);
    setLedgerMessage("Importing CSV transactions...");
    try {
      const result = await importTransactionsCsv(file);
      await loadDashboard(`Imported ${result.imported_count} transactions from CSV.`);
      setLedgerMessage(`Imported ${result.imported_count}; skipped ${result.skipped_count}.`);
    } catch {
      setLedgerMessage("Could not import CSV. Check the column format and try again.");
    } finally {
      setIsImportingCsv(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  function closeAccountForm() {
    setEditingAccount(null);
    setIsAccountFormOpen(false);
  }

  const topTransactions = transactions.slice(0, 6);
  const filteredTransactions =
    selectedAccountId === "all"
      ? transactions
      : transactions.filter((transaction) => transaction.account_id === selectedAccountId);
  const categoryAnalysis = useMemo(
    () => buildCategoryAnalysis(filteredTransactions, categories),
    [categories, filteredTransactions],
  );
  const totalExpense = categoryAnalysis.reduce((sum, category) => sum + category.amount, 0);
  const topCategory = categoryAnalysis[0];
  const currentMonth = useMemo(() => buildCurrentMonthSummary(filteredTransactions), [filteredTransactions]);
  const monthlySavings = Math.max(currentMonth.income - currentMonth.expense, 0);
  const savingsRate = currentMonth.income
    ? Math.round((monthlySavings / currentMonth.income) * 100)
    : 0;

  return (
    <main className="page-shell">
      <section className="page-header-compact">
        <div>
          <h1>Dashboard</h1>
          <p>Your financial overview today</p>
        </div>
        <div className="page-header-actions">
          <span className="status-chip">
            <span className="material-symbols-outlined" aria-hidden="true">cloud_done</span>
            {statusLabel}
          </span>
          <button
            className="icon-button"
            type="button"
            aria-label="Refresh dashboard"
            title="Refresh dashboard"
            onClick={() => {
              void loadDashboard("Dashboard refreshed.");
            }}
          >
            <span className="material-symbols-outlined" aria-hidden="true">sync</span>
          </button>
        </div>
      </section>

      <section className="dashboard-overview-grid" aria-label="Dashboard summary">
        <article className="balance-card">
          <div className="balance-card-top">
            <span>Total balance</span>
            <span className="material-symbols-outlined" aria-hidden="true">visibility</span>
          </div>
          <strong>{formatCurrency(summary.balance, "INR")}</strong>
          <div className="balance-trend">
            <span className={summary.balance >= 0 ? "trend-pill trend-positive" : "trend-pill trend-negative"}>
              {summary.balance >= 0 ? "+" : "-"} {savingsRate}% savings
            </span>
            <span>this month</span>
          </div>
          <div className="dashboard-actions">
            <button
              className="button button-primary"
              type="button"
              onClick={() => openTransactionForm("expense")}
            >
              New Expense
            </button>
            <button
              className="button button-secondary"
              type="button"
              onClick={() => openTransactionForm("income")}
            >
              Add Income
            </button>
          </div>
        </article>

        <article className="metric-card">
          <div className="metric-icon income-icon">
            <span className="material-symbols-outlined" aria-hidden="true">payments</span>
          </div>
          <span>Monthly income</span>
          <strong>{formatCurrency(currentMonth.income, "INR")}</strong>
          <p>{formatCurrency(summary.total_income, "INR")} total recorded</p>
        </article>

        <article className="metric-card">
          <div className="metric-icon expense-icon">
            <span className="material-symbols-outlined" aria-hidden="true">trending_down</span>
          </div>
          <span>Monthly expenses</span>
          <strong>{formatCurrency(currentMonth.expense, "INR")}</strong>
          <p>{formatCurrency(summary.total_expenses, "INR")} total spending</p>
        </article>

        <article className="metric-card">
          <div className="metric-icon savings-icon">
            <span className="material-symbols-outlined" aria-hidden="true">savings</span>
          </div>
          <span>Monthly savings</span>
          <strong>{formatCurrency(monthlySavings, "INR")}</strong>
          <p>{summary.transaction_count} transactions tracked</p>
        </article>
      </section>

      <section className="dashboard-main-grid">
        <article className="panel chart-panel spending-card">
          <div className="panel-header">
            <div>
              <h2 className="section-title">Spending overview</h2>
              <p className="section-copy">
                {topCategory
                  ? `${topCategory.name} is your top spending category.`
                  : "Add transactions to unlock category insights."}
              </p>
            </div>
            <select
              className="field-input compact-select"
              value={selectedAccountId}
              onChange={(event) => setSelectedAccountId(event.target.value)}
              aria-label="Filter spending overview by account"
            >
              <option value="all">All accounts</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </div>
          <div className="spending-overview">
            <div className="ring-chart-wrap">
              <svg viewBox="0 0 200 200" className="ring-chart-svg">
                <circle cx="100" cy="100" r="80" fill="none" stroke="var(--line)" strokeWidth="20" />
                {buildRingSegments(categoryAnalysis).map((segment) => (
                  <circle
                    key={segment.name}
                    cx="100"
                    cy="100"
                    r={segment.radius}
                    fill="none"
                    stroke={segment.color}
                    strokeWidth="20"
                    strokeLinecap="round"
                    strokeDasharray={`${segment.length} ${segment.circumference}`}
                    strokeDashoffset={segment.offset}
                    transform="rotate(-90 100 100)"
                  />
                ))}
              </svg>
              <div className="ring-chart-center">
                <span className="ring-chart-label">This month expense</span>
                <strong className="ring-chart-value">{formatCurrency(totalExpense, "INR")}</strong>
              </div>
            </div>
            <div className="category-legend spending-legend">
              {categoryAnalysis.length ? (
                categoryAnalysis.slice(0, 6).map((category) => (
                  <div className="legend-item spending-row" key={category.name}>
                    <span className="badge-dot" style={{ backgroundColor: category.color }} />
                    <span>{category.name}</span>
                    <strong>{formatCurrency(category.amount, "INR")}</strong>
                    <em>{totalExpense ? Math.round((category.amount / totalExpense) * 100) : 0}%</em>
                  </div>
                ))
              ) : (
                <div className="empty-state">No category spend yet.</div>
              )}
            </div>
          </div>
        </article>

        <aside className="dashboard-side-stack">
          <article className="ai-insight-card">
            <div>
              <span className="material-symbols-outlined" aria-hidden="true">tips_and_updates</span>
              <h2>AI smart insight</h2>
            </div>
            <p>
              {topCategory
                ? `${topCategory.name} is leading your spend. Review it before your next purchase.`
                : "Add a few transactions and FinTrack AI will surface useful spending patterns."}
            </p>
            <button className="button insight-button" type="button" onClick={() => openTransactionForm("expense")}>
              Add new expense
            </button>
          </article>

          <article className="panel quick-actions-panel">
            <div className="panel-header">
              <h2 className="section-title">Quick actions</h2>
            </div>
            <div className="quick-actions-grid">
              <button type="button" onClick={() => openTransactionForm("expense")}>
                <span className="material-symbols-outlined" aria-hidden="true">add_card</span>
                Expense
              </button>
              <button type="button" onClick={() => openTransactionForm("income")}>
                <span className="material-symbols-outlined" aria-hidden="true">account_balance_wallet</span>
                Income
              </button>
              <button type="button" onClick={() => openAccountForm()}>
                <span className="material-symbols-outlined" aria-hidden="true">account_balance</span>
                Account
              </button>
              <button type="button" onClick={handleExportCsv}>
                <span className="material-symbols-outlined" aria-hidden="true">download</span>
                Export
              </button>
            </div>
          </article>
        </aside>
      </section>

      <section className="panel chart-panel">
          <h2 className="section-title">Recent transactions</h2>
          <p className="section-copy">Latest records with edit and delete support.</p>
          <div className="list">
            {topTransactions.length ? (
              topTransactions.map((transaction) => (
                <div className="list-item" key={transaction.id}>
                  <div className="list-main">
                    <div>
                      <div className="item-title">{transaction.merchant_name}</div>
                      <div className="item-subtitle">
                        {transaction.category_name} • {transaction.account_display_name} •{" "}
                        {transaction.payment_method}
                      </div>
                    </div>
                    <div className="row-actions">
                      <button
                        className="button button-secondary compact-button"
                        type="button"
                        onClick={() => openEditForm(transaction)}
                      >
                        Edit
                      </button>
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
              <div className="empty-state">
                No transactions yet. Use New Expense to start tracking real data.
              </div>
            )}
          </div>
      </section>

      <section className="grid content-grid">
        <article className="panel">
          <div className="panel-header">
            <div>
              <h2 className="section-title">Category cards</h2>
              <p className="section-copy">The most important category totals, ranked by spend.</p>
            </div>
            <div className="account-toolbar">
              <button className="button button-secondary compact-button" type="button" onClick={handleExportCsv}>
                Export CSV
              </button>
              <button
                className="button button-secondary compact-button"
                type="button"
                disabled={isImportingCsv}
                onClick={() => fileInputRef.current?.click()}
              >
                {isImportingCsv ? "Importing..." : "Import CSV"}
              </button>
              <input
                ref={fileInputRef}
                className="hidden-field"
                type="file"
                accept=".csv,text/csv"
                onChange={(event) => {
                  void handleImportCsv(event.target.files?.[0] ?? null);
                }}
              />
            </div>
          </div>
          {ledgerMessage ? <div className="form-message ledger-message">{ledgerMessage}</div> : null}
          <div className="analysis-card-grid">
            {categoryAnalysis.length ? (
              categoryAnalysis.slice(0, 4).map((category) => (
                <div className="mini-analysis-card" key={category.name}>
                  <span className="badge-dot large-dot" style={{ backgroundColor: category.color }} />
                  <div className="item-title">{category.name}</div>
                  <div className="stat-value compact-stat">{formatCurrency(category.amount, "INR")}</div>
                  <div className="stat-footnote">{category.count} transactions</div>
                </div>
              ))
            ) : (
              <div className="empty-state">No category spend yet.</div>
            )}
          </div>
        </article>

        <aside className="panel account-strip">
          <div className="panel-header">
            <div>
              <h2 className="section-title">Payment accounts</h2>
              <p className="section-copy">Filter by wallet, cash, bank, UPI, or card.</p>
            </div>
            <button className="button button-primary compact-button" type="button" onClick={() => openAccountForm()}>
              Add Account
            </button>
          </div>
          <select
            className="field-input account-filter account-filter-full"
            value={selectedAccountId}
            onChange={(event) => setSelectedAccountId(event.target.value)}
            aria-label="Filter by account"
          >
            <option value="all">All accounts</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
          <div className="account-card-grid compact-account-grid">
            {accounts.length ? (
              accounts.map((account) => (
                <div
                  className={
                    selectedAccountId === account.id ? "account-card account-card-active" : "account-card"
                  }
                  key={account.id}
                >
                  <button className="account-card-main" type="button" onClick={() => setSelectedAccountId(account.id)}>
                    <span className="badge-dot large-dot" style={{ backgroundColor: account.color }} />
                    <span className="item-title">{account.name}</span>
                    <strong>{formatCurrency(account.current_balance, account.currency_code)}</strong>
                    <span className="item-subtitle">
                      {account.type.replace("_", " ")}
                      {account.is_default ? " • default" : ""}
                    </span>
                  </button>
                  <div className="row-actions account-actions">
                    <button
                      className="button button-secondary compact-button"
                      type="button"
                      onClick={() => openAccountForm(account)}
                    >
                      Edit
                    </button>
                    <button
                      className="button button-tertiary compact-button"
                      type="button"
                      disabled={deactivatingAccountId === account.id || accounts.length <= 1}
                      onClick={() => {
                        void removeAccount(account.id);
                        if (selectedAccountId === account.id) {
                          setSelectedAccountId("all");
                        }
                      }}
                    >
                      {deactivatingAccountId === account.id ? "Removing..." : "Deactivate"}
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">No payment accounts yet. Add an account to track balances.</div>
            )}
          </div>
        </aside>
      </section>

      {isExpenseFormOpen ? (
        <div className="modal-backdrop" role="presentation">
          <div className="modal-panel" role="dialog" aria-modal="true" aria-label="New expense form">
            <ExpenseForm
              categories={categories}
              accounts={accounts}
              initialType={transactionFormType}
              transaction={editingTransaction}
              onCancel={closeExpenseForm}
              onCreated={async () => {
                await loadDashboard("Transaction saved and dashboard refreshed from the database.");
              }}
            />
          </div>
        </div>
      ) : null}

      {isAccountFormOpen ? (
        <div className="modal-backdrop" role="presentation">
          <div className="modal-panel" role="dialog" aria-modal="true" aria-label="Account form">
            <AccountForm
              account={editingAccount}
              onCancel={closeAccountForm}
              onSaved={async () => {
                await loadDashboard("Account saved and dashboard refreshed from the database.");
              }}
            />
          </div>
        </div>
      ) : null}
    </main>
  );
}
