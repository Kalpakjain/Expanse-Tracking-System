"use client";

import { useCallback, useEffect, useState } from "react";

import { BudgetForm } from "@/components/budget-form";
import { deleteBudget, getReportsOverview } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { useFinanceDashboard } from "@/lib/use-finance-dashboard";
import type { ReportsOverview, Transaction } from "@/lib/types";

function buildCategorySpendBreakdown(transactions: Transaction[]) {
  const totals = new Map<string, { amount: number; count: number }>();

  for (const transaction of transactions) {
    if (transaction.type !== "expense") {
      continue;
    }

    const current = totals.get(transaction.category_name) ?? { amount: 0, count: 0 };
    totals.set(transaction.category_name, {
      amount: current.amount + transaction.amount,
      count: current.count + 1,
    });
  }

  return Array.from(totals.entries())
    .map(([name, metrics]) => ({ name, amount: metrics.amount, count: metrics.count }))
    .sort((left, right) => right.amount - left.amount);
}

export function ReportsWorkspace() {
  const { transactions, categories, statusLabel, loadDashboard } = useFinanceDashboard();
  const [overview, setOverview] = useState<ReportsOverview>({
    summary: {
      total_income: 0,
      total_expenses: 280,
      balance: -280,
      transaction_count: 1,
      category_count: 4,
    },
    category_breakdown: [],
    smart_insights: [],
    budgets: [],
    monthly_budget_total: 0,
    over_budget_count: 0,
    budgeted_categories: 0,
  });
  const [reportMessage, setReportMessage] = useState("Loading report overview...");
  const [deletingBudgetId, setDeletingBudgetId] = useState<string | null>(null);

  const fallbackBreakdown = buildCategorySpendBreakdown(transactions).map((entry) => {
    const matchingCategory = categories.find((category) => category.name === entry.name);
    return {
      category_id: entry.name,
      category_name: entry.name,
      category_color: matchingCategory?.color ?? "#0F766E",
      spent_amount: entry.amount,
      transaction_count: entry.count,
      budget_limit: null,
      remaining_amount: null,
      utilization_percent: null,
    };
  });

  const loadReports = useCallback(async (successMessage?: string) => {
    try {
      const nextOverview = await getReportsOverview();
      setOverview(nextOverview);
      setReportMessage(successMessage ?? "Report overview synced from the backend.");
    } catch {
      setReportMessage("Using local fallback report data while the reports API settles.");
    }
  }, []);

  useEffect(() => {
    void loadReports();
  }, [loadReports]);

  const breakdown = overview.category_breakdown.length ? overview.category_breakdown : fallbackBreakdown;
  async function handleDeleteBudget(budgetId: string) {
    setDeletingBudgetId(budgetId);
    try {
      await deleteBudget(budgetId);
      await Promise.all([
        loadDashboard("Budget deleted and dashboard refreshed from the database."),
        loadReports("Budget deleted and reports refreshed."),
      ]);
    } catch {
      setReportMessage("Could not delete the budget right now.");
    } finally {
      setDeletingBudgetId(null);
    }
  }

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
            <span className="button button-secondary">{reportMessage || statusLabel}</span>
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
              Budget controls are now live here. The next layer is trend charts and month-over-month
              comparisons without changing the information architecture again.
            </p>
          </div>
        </aside>
      </section>

      <section className="grid stats-grid">
        <article className="panel stat-card">
          <div className="stat-label">Income</div>
          <div className="stat-value">{formatCurrency(overview.summary.total_income, "INR")}</div>
          <div className="stat-footnote">Recorded so far</div>
        </article>
        <article className="panel stat-card">
          <div className="stat-label">Expenses</div>
          <div className="stat-value">{formatCurrency(overview.summary.total_expenses, "INR")}</div>
          <div className="stat-footnote">Recorded spend</div>
        </article>
        <article className="panel stat-card">
          <div className="stat-label">Net</div>
          <div className="stat-value">{formatCurrency(overview.summary.balance, "INR")}</div>
          <div className="stat-footnote">Balance to date</div>
        </article>
        <article className="panel stat-card">
          <div className="stat-label">Monthly budget pool</div>
          <div className="stat-value">{formatCurrency(overview.monthly_budget_total, "INR")}</div>
          <div className="stat-footnote">
            {overview.budgeted_categories} budgeted categories • {overview.over_budget_count} over budget
          </div>
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
                <div className="list-item" key={entry.category_id}>
                  <div>
                    <div className="item-title">{entry.category_name}</div>
                    <div className="item-subtitle">
                      {entry.transaction_count} transactions •{" "}
                      {entry.budget_limit !== null
                        ? `Budget ${formatCurrency(entry.budget_limit, "INR")}`
                        : "No budget configured"}
                    </div>
                    {entry.remaining_amount !== null ? (
                      <div className="item-subtitle">
                        Remaining {formatCurrency(entry.remaining_amount, "INR")} •{" "}
                        {entry.utilization_percent?.toFixed(1)}% used
                      </div>
                    ) : null}
                  </div>
                  <div className="amount-expense">{formatCurrency(entry.spent_amount, "INR")}</div>
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
          <h2 className="section-title">Smart insights</h2>
          <p className="section-copy">
            Backend-generated signals call out budget pressure, concentrated spend, and whether the
            app has enough data for stronger recommendations.
          </p>
          <div className="insight-list">
            {overview.smart_insights.map((insight) => (
              <div className={`insight-card insight-${insight.severity}`} key={insight.title}>
                <div className="item-title">{insight.title}</div>
                <div className="item-subtitle">{insight.message}</div>
              </div>
            ))}
          </div>
        </aside>
      </section>

      <section className="grid content-grid">
        <BudgetForm
          categories={categories}
          onCreated={async () => {
            await Promise.all([
              loadDashboard("Budget saved and dashboard refreshed from the database."),
              loadReports("Budget saved and reports refreshed."),
            ]);
          }}
        />

        <aside className="panel">
          <h2 className="section-title">Configured budgets</h2>
          <p className="section-copy">
            Use these to keep monthly rupee limits visible and actionable across your reporting flow.
          </p>
          <div className="list">
            {overview.budgets.length ? (
              overview.budgets.map((budget) => (
                <div className="list-item" key={budget.id}>
                  <div className="list-main">
                    <div>
                      <div className="item-title">
                        {budget.category_name} • {budget.month}/{budget.year}
                      </div>
                      <div className="item-subtitle">
                        Limit {formatCurrency(budget.limit_amount, budget.currency_code)} • Spent{" "}
                        {formatCurrency(budget.spent_amount, budget.currency_code)}
                      </div>
                      <div className="item-subtitle">
                        Remaining {formatCurrency(budget.remaining_amount, budget.currency_code)} •{" "}
                        {budget.utilization_percent.toFixed(1)}% used
                      </div>
                    </div>
                    <button
                      className="button button-tertiary"
                      type="button"
                      disabled={deletingBudgetId === budget.id}
                      onClick={() => {
                        void handleDeleteBudget(budget.id);
                      }}
                    >
                      {deletingBudgetId === budget.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                No budgets yet. Create a category budget here to unlock deeper reports and future alerts.
              </div>
            )}
          </div>
        </aside>
      </section>

      <section className="panel">
        <h2 className="section-title">Category library</h2>
        <p className="section-copy">
          Categories shape every report and smart insight, so keep this library aligned with how you
          actually spend.
        </p>
        <div className="badge-row">
          {categories.map((category) => (
            <span className="badge" key={category.id}>
              <span className="badge-dot" style={{ backgroundColor: category.color }} />
              {category.name}
            </span>
          ))}
        </div>
      </section>
    </main>
  );
}
