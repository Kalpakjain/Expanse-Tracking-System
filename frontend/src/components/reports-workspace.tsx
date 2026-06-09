"use client";

import { formatCurrency } from "@/lib/format";
import { useFinanceDashboard } from "@/lib/use-finance-dashboard";
import type { Transaction } from "@/lib/types";

function buildCategorySpendBreakdown(transactions: Transaction[]) {
  const totals = new Map<string, number>();

  for (const transaction of transactions) {
    if (transaction.type !== "expense") {
      continue;
    }

    const current = totals.get(transaction.category_name) ?? 0;
    totals.set(transaction.category_name, current + transaction.amount);
  }

  return Array.from(totals.entries())
    .map(([name, amount]) => ({ name, amount }))
    .sort((left, right) => right.amount - left.amount);
}

export function ReportsWorkspace() {
  const { summary, transactions, categories, statusLabel } = useFinanceDashboard();
  const breakdown = buildCategorySpendBreakdown(transactions);
  const avgExpense =
    summary.transaction_count > 0 ? summary.total_expenses / Math.max(1, breakdown.length) : 0;

  return (
    <main className="page-shell">
      <section className="hero">
        <article className="hero-card">
          <span className="eyebrow">Reports</span>
          <h1>See the patterns, not just the payments.</h1>
          <p>
            This page is where category context now lives. It turns raw entries into a spending
            story you can actually review and act on.
          </p>
          <div className="hero-actions">
            <span className="button button-primary">Reporting mode</span>
            <span className="button button-secondary">{statusLabel}</span>
          </div>
        </article>

        <aside className="hero-side">
          <div className="hero-card side-card">
            <h2>Moved from home</h2>
            <p>
              Category visibility now belongs here so the home page can stay focused on capture and
              cleanup.
            </p>
          </div>
          <div className="hero-card side-card">
            <h2>Next reporting layer</h2>
            <p>
              Budgets and charts will plug into this page next without needing another layout
              redesign.
            </p>
          </div>
        </aside>
      </section>

      <section className="grid stats-grid">
        <article className="panel stat-card">
          <div className="stat-label">Income</div>
          <div className="stat-value">{formatCurrency(summary.total_income, "INR")}</div>
          <div className="stat-footnote">Recorded so far</div>
        </article>
        <article className="panel stat-card">
          <div className="stat-label">Expenses</div>
          <div className="stat-value">{formatCurrency(summary.total_expenses, "INR")}</div>
          <div className="stat-footnote">Recorded spend</div>
        </article>
        <article className="panel stat-card">
          <div className="stat-label">Net</div>
          <div className="stat-value">{formatCurrency(summary.balance, "INR")}</div>
          <div className="stat-footnote">Balance to date</div>
        </article>
        <article className="panel stat-card">
          <div className="stat-label">Avg category spend</div>
          <div className="stat-value">{formatCurrency(avgExpense, "INR")}</div>
          <div className="stat-footnote">Expense categories only</div>
        </article>
      </section>

      <section className="grid content-grid">
        <article className="panel">
          <h2 className="section-title">Category spend breakdown</h2>
          <p className="section-copy">
            This is the first layer of reporting. It shows where the money is going by category.
          </p>
          <div className="list">
            {breakdown.length ? (
              breakdown.map((entry) => (
                <div className="list-item" key={entry.name}>
                  <div>
                    <div className="item-title">{entry.name}</div>
                    <div className="item-subtitle">Current expense total</div>
                  </div>
                  <div className="amount-expense">{formatCurrency(entry.amount, "INR")}</div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                No expense data yet. Add a few transactions on the home page to generate reports.
              </div>
            )}
          </div>
        </article>

        <aside className="panel">
          <h2 className="section-title">Category library</h2>
          <p className="section-copy">
            The categories you create shape every report. That is why they now live in the reports
            conversation as well as the dedicated categories page.
          </p>
          <div className="badge-row">
            {categories.map((category) => (
              <span className="badge" key={category.id}>
                <span className="badge-dot" style={{ backgroundColor: category.color }} />
                {category.name}
              </span>
            ))}
          </div>
        </aside>
      </section>
    </main>
  );
}
