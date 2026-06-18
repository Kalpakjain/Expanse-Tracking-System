"use client";

import { useEffect, useMemo, useState } from "react";

import { AccountForm } from "@/components/account-form";
import { ExpenseForm } from "@/components/expense-form";
import { formatCurrency } from "@/lib/format";
import { useFinanceDashboard } from "@/lib/use-finance-dashboard";
import type { Category, PaymentAccount, Transaction } from "@/lib/types";

const chartFallbackColors = ["#2563EB", "#14B8A6", "#F97316", "#A855F7", "#EAB308", "#EF4444"];

function getMonthLabel(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  return new Intl.DateTimeFormat("en-IN", { month: "short", year: "2-digit" }).format(
    new Date(year, month - 1, 1),
  );
}

function buildMonthlyAnalysis(transactions: Transaction[]) {
  const monthlyTotals = new Map<string, { income: number; expense: number }>();

  for (const transaction of transactions) {
    const monthKey = transaction.transaction_date.slice(0, 7);
    const current = monthlyTotals.get(monthKey) ?? { income: 0, expense: 0 };
    if (transaction.type === "income") {
      current.income += transaction.amount;
    } else {
      current.expense += transaction.amount;
    }
    monthlyTotals.set(monthKey, current);
  }

  const today = new Date();
  return Array.from({ length: 6 }, (_, index) => {
    const monthDate = new Date(today.getFullYear(), today.getMonth() - (5 - index), 1);
    const monthKey = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, "0")}`;
    const totals = monthlyTotals.get(monthKey) ?? { income: 0, expense: 0 };
    return {
      monthKey,
      label: getMonthLabel(monthKey),
      income: totals.income,
      expense: totals.expense,
      balance: totals.income - totals.expense,
    };
  });
}

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

function buildPieGradient(categories: ReturnType<typeof buildCategoryAnalysis>) {
  const total = categories.reduce((sum, category) => sum + category.amount, 0);
  if (!total) {
    return "conic-gradient(#E5E7EB 0deg 360deg)";
  }

  let cursor = 0;
  const slices = categories.map((category) => {
    const start = cursor;
    const end = cursor + (category.amount / total) * 360;
    cursor = end;
    return `${category.color} ${start.toFixed(2)}deg ${end.toFixed(2)}deg`;
  });

  return `conic-gradient(${slices.join(", ")})`;
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

  function closeAccountForm() {
    setEditingAccount(null);
    setIsAccountFormOpen(false);
  }

  const topTransactions = transactions.slice(0, 6);
  const filteredTransactions =
    selectedAccountId === "all"
      ? transactions
      : transactions.filter((transaction) => transaction.account_id === selectedAccountId);
  const visibleTransactions = filteredTransactions.slice(0, 6);
  const monthlyAnalysis = useMemo(() => buildMonthlyAnalysis(filteredTransactions), [filteredTransactions]);
  const categoryAnalysis = useMemo(
    () => buildCategoryAnalysis(filteredTransactions, categories),
    [categories, filteredTransactions],
  );
  const maxMonthlyExpense = Math.max(...monthlyAnalysis.map((month) => month.expense), 1);
  const totalExpense = categoryAnalysis.reduce((sum, category) => sum + category.amount, 0);
  const pieGradient = buildPieGradient(categoryAnalysis);
  const topCategory = categoryAnalysis[0];

  return (
    <main className="page-shell">
      <section className="dashboard-hero">
        <div>
          <span className="eyebrow">Dashboard</span>
          <h1>Expense analysis at a glance.</h1>
          <p>
            Review monthly movement, category split, and recent spending. Add a new expense only
            when you need the form.
          </p>
          <div className="hero-actions">
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
            <span className="button button-secondary">{statusLabel}</span>
          </div>
        </div>

        <div className="hero-balance-card">
          <div className="stat-label">Net balance</div>
          <div className="hero-balance-value">{formatCurrency(summary.balance, "INR")}</div>
          <div className="stat-footnote">
            {summary.transaction_count} transactions across {summary.category_count} categories
          </div>
        </div>
      </section>

      <section className="grid stats-grid">
        <article className="panel stat-card">
          <div className="stat-label">Total income</div>
          <div className="stat-value">{formatCurrency(summary.total_income, "INR")}</div>
          <div className="stat-footnote">All recorded income so far</div>
        </article>
        <article className="panel stat-card">
          <div className="stat-label">Total expenses</div>
          <div className="stat-value">{formatCurrency(summary.total_expenses, "INR")}</div>
          <div className="stat-footnote">Current total spending</div>
        </article>
        <article className="panel stat-card">
          <div className="stat-label">Net balance</div>
          <div className="stat-value">{formatCurrency(summary.balance, "INR")}</div>
          <div className="stat-footnote">Income minus expenses</div>
        </article>
        <article className="panel stat-card">
          <div className="stat-label">Transactions</div>
          <div className="stat-value">{summary.transaction_count}</div>
          <div className="stat-footnote">{categories.length} categories available</div>
        </article>
      </section>

      <section className="panel account-strip">
        <div className="panel-header">
          <div>
            <h2 className="section-title">Payment accounts</h2>
            <p className="section-copy">Filter the dashboard by wallet, cash, bank, UPI, or card.</p>
          </div>
          <div className="account-toolbar">
            <select
              className="field-input account-filter"
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
            <button className="button button-primary compact-button" type="button" onClick={() => openAccountForm()}>
              Add Account
            </button>
          </div>
        </div>
        <div className="account-card-grid">
          {accounts.map((account) => (
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
          ))}
        </div>
      </section>

      <section className="grid content-grid">
        <article className="panel chart-panel">
          <div className="panel-header">
            <div>
              <h2 className="section-title">Month-wise expenses</h2>
              <p className="section-copy">Last six months of recorded spending.</p>
            </div>
          </div>
          <div className="bar-chart" aria-label="Month-wise expense chart">
            {monthlyAnalysis.map((month) => (
              <div className="bar-column" key={month.monthKey}>
                <div className="bar-track">
                  <span
                    className="bar-fill"
                    style={{ height: `${Math.max((month.expense / maxMonthlyExpense) * 100, 6)}%` }}
                  />
                </div>
                <div className="bar-label">{month.label}</div>
                <div className="bar-value">{formatCurrency(month.expense, "INR")}</div>
              </div>
            ))}
          </div>
        </article>

        <aside className="panel chart-panel">
          <h2 className="section-title">Category-wise split</h2>
          <p className="section-copy">
            {topCategory
              ? `${topCategory.name} is currently the largest category.`
              : "Add expenses to generate a category chart."}
          </p>
          <div className="pie-layout">
            <div className="pie-chart" style={{ background: pieGradient }}>
              <span>{categoryAnalysis.length}</span>
            </div>
            <div className="category-legend">
              {categoryAnalysis.slice(0, 5).map((category) => (
                <div className="legend-item" key={category.name}>
                  <span className="badge-dot" style={{ backgroundColor: category.color }} />
                  <span>{category.name}</span>
                  <strong>{totalExpense ? Math.round((category.amount / totalExpense) * 100) : 0}%</strong>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </section>

      <section className="grid content-grid">
        <article className="panel">
          <h2 className="section-title">Category cards</h2>
          <p className="section-copy">The most important category totals, ranked by spend.</p>
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

        <aside className="panel">
          <h2 className="section-title">Recent transactions</h2>
          <p className="section-copy">Latest records with edit and delete support.</p>
          <div className="list">
            {visibleTransactions.length ? (
              visibleTransactions.map((transaction) => (
                <div className="list-item" key={transaction.id}>
                  <div className="list-main">
                    <div>
                      <div className="item-title">{transaction.merchant_name}</div>
                      <div className="item-subtitle">
                        {transaction.category_name} • {transaction.account_display_name} •{" "}
                        {transaction.payment_method} •{" "}
                        {transaction.transaction_date}
                      </div>
                      <div className="item-subtitle">
                        {transaction.description || "No description"}
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
                  <div
                    className={
                      transaction.type === "expense" ? "amount-expense" : "amount-income"
                    }
                  >
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
