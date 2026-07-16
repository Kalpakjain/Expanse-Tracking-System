"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ChangeEvent } from "react";

import { BudgetForm } from "@/components/budget-form";
import { deleteBudget, getReportsOverview } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { useFinanceDashboard } from "@/lib/use-finance-dashboard";
import type { Budget, ReportsOverview, Transaction } from "@/lib/types";

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function budgetState(budget: Budget) {
  if (budget.utilization_percent > 100) {
    return { label: "Over budget", className: "budget-danger" };
  }
  if (budget.utilization_percent >= budget.alert_threshold_percent) {
    return { label: "Near limit", className: "budget-warning" };
  }
  return { label: "On track", className: "budget-healthy" };
}

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

type Granularity = "weekly" | "monthly" | "quarterly" | "yearly";

type ComparisonBucket = {
  label: string;
  current: number;
  previous: number;
};

function buildComparisonAnalysis(transactions: Transaction[], granularity: Granularity): ComparisonBucket[] {
  const today = new Date();
  const bucketCount = granularity === "weekly" ? 7 : granularity === "monthly" ? 6 : 4;

  function bucketStart(periodsBack: number, index: number): Date {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    if (granularity === "weekly") {
      const dayOfWeek = d.getDay();
      d.setDate(d.getDate() - dayOfWeek - periodsBack * 7 + index);
      d.setHours(0, 0, 0, 0);
    } else if (granularity === "monthly") {
      d.setDate(1);
      d.setMonth(d.getMonth() - periodsBack * bucketCount + index);
    } else if (granularity === "quarterly") {
      const currentQuarterStartMonth = Math.floor(d.getMonth() / 3) * 3;
      d.setDate(1);
      d.setMonth(currentQuarterStartMonth - periodsBack * bucketCount * 3 + index * 3);
    } else {
      d.setMonth(0, 1);
      d.setFullYear(d.getFullYear() - periodsBack * bucketCount + index);
    }
    return d;
  }

  function bucketEnd(start: Date): Date {
    const end = new Date(start);
    if (granularity === "weekly") end.setDate(end.getDate() + 1);
    else if (granularity === "monthly") end.setMonth(end.getMonth() + 1);
    else if (granularity === "quarterly") end.setMonth(end.getMonth() + 3);
    else end.setFullYear(end.getFullYear() + 1);
    return end;
  }

  function bucketLabel(d: Date): string {
    if (granularity === "weekly") {
      return d.toLocaleDateString(undefined, { weekday: "short" }) + " " + d.getDate();
    }
    if (granularity === "monthly") {
      return d.toLocaleDateString(undefined, { month: "short" });
    }
    if (granularity === "quarterly") {
      return `Q${Math.floor(d.getMonth() / 3) + 1} '${String(d.getFullYear()).slice(2)}`;
    }
    return String(d.getFullYear());
  }

  function sumExpensesInRange(start: Date, end: Date): number {
    return transactions
      .filter((t) => t.type === "expense")
      .filter((t) => {
        const txDate = new Date(t.transaction_date);
        return txDate >= start && txDate < end;
      })
      .reduce((sum, t) => sum + t.amount, 0);
  }

  return Array.from({ length: bucketCount }, (_, index) => {
    const currentStart = bucketStart(0, index);
    const previousStart = bucketStart(1, index);
    return {
      label: bucketLabel(currentStart),
      current: sumExpensesInRange(currentStart, bucketEnd(currentStart)),
      previous: sumExpensesInRange(previousStart, bucketEnd(previousStart)),
    };
  });
}

function formatCompactCurrency(amount: number): string {
  if (amount >= 100000) return `Rs ${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `Rs ${(amount / 1000).toFixed(1)}k`;
  return `Rs ${Math.round(amount)}`;
}

function granularityLabel(granularity: Granularity): string {
  if (granularity === "weekly") return "week";
  if (granularity === "monthly") return "month";
  if (granularity === "quarterly") return "quarter";
  return "year";
}

function exportTransactionsToCsv(transactions: Transaction[]) {
  const header = "Date,Type,Category,Description,Amount\n";
  const rows = transactions
    .map((t) => `${t.transaction_date},${t.type},${t.category_name},"${(t.description ?? "").replace(/"/g, '""')}",${t.amount}`)
    .join("\n");
  const blob = new Blob([header + rows], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `transactions-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function ReportsWorkspace() {
  const { transactions, categories, loadDashboard } = useFinanceDashboard();
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
  const [reportMessage, setReportMessage] = useState("");
  const [deletingBudgetId, setDeletingBudgetId] = useState<string | null>(null);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [granularity, setGranularity] = useState<Granularity>("monthly");
  const [isTransitioning, setIsTransitioning] = useState(false);

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
      if (successMessage) {
        setReportMessage(successMessage);
      }
    } catch {
      setReportMessage("Using local fallback report data while the reports API settles.");
    }
  }, []);

  useEffect(() => {
    void loadReports();
  }, [loadReports]);

  useEffect(() => {
    if (!reportMessage) {
      return;
    }
    const timeoutId = window.setTimeout(() => setReportMessage(""), 3000);
    return () => window.clearTimeout(timeoutId);
  }, [reportMessage]);

  const breakdown = overview.category_breakdown.length ? overview.category_breakdown : fallbackBreakdown;
  const comparisonData = useMemo(
    () => buildComparisonAnalysis(transactions, granularity),
    [transactions, granularity],
  );
  const maxComparisonValue = Math.max(
    ...comparisonData.flatMap((bucket) => [bucket.current, bucket.previous]),
    1,
  );
  const totalCurrent = comparisonData.reduce((sum, bucket) => sum + bucket.current, 0);
  const totalPrevious = comparisonData.reduce((sum, bucket) => sum + bucket.previous, 0);
  const percentChange = totalPrevious > 0
    ? Math.round(((totalCurrent - totalPrevious) / totalPrevious) * 100)
    : null;
  const peakIndex = comparisonData.reduce(
    (best, bucket, index) => (bucket.current > comparisonData[best].current ? index : best),
    0,
  );
  const avgValue = comparisonData.reduce((sum, bucket) => sum + bucket.current, 0) / comparisonData.length;
  const avgLinePercent = Math.min((avgValue / maxComparisonValue) * 100, 100);
  const spendingBreakdown = [...breakdown].sort((left, right) => right.spent_amount - left.spent_amount);
  const totalSpend = spendingBreakdown.reduce((sum, entry) => sum + entry.spent_amount, 0);
  const topCategories = spendingBreakdown.slice(0, 2);
  const othersAmount = spendingBreakdown.slice(2).reduce((sum, entry) => sum + entry.spent_amount, 0);
  const filteredBudgets = overview.budgets.filter(
    (budget) => budget.month === selectedMonth && budget.year === selectedYear,
  );
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

  function handleGranularityChange(event: ChangeEvent<HTMLSelectElement>) {
    const nextGranularity = event.target.value as Granularity;
    setIsTransitioning(true);
    window.setTimeout(() => {
      setGranularity(nextGranularity);
      setIsTransitioning(false);
    }, 150);
  }

  function colorForCategory(name: string, fallbackIndex: number) {
    const match = categories.find((category) => category.name === name);
    if (match) {
      return match.color;
    }
    return ["#b0305c", "#a8823c", "#dfd5c7"][fallbackIndex % 3];
  }

  return (
    <main className="page-shell">
      <section className="page-header-compact">
        <div>
          <h1>Analytics</h1>
          <p>Budgets, categories, and trends</p>
        </div>
      </section>

      {reportMessage ? <div className="toast-inline">{reportMessage}</div> : null}

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

      <div className="analytics-hero-grid">
        <section className="panel chart-panel">
          <div className="panel-header">
            <div>
              <h2 className="section-title">Spending comparison</h2>
              <p className="section-copy">
                {percentChange === null
                  ? `Comparing this ${granularityLabel(granularity)} to last.`
                  : percentChange >= 0
                    ? `You spent ${percentChange}% more this ${granularityLabel(granularity)} than last.`
                    : `You spent ${Math.abs(percentChange)}% less this ${granularityLabel(granularity)} than last.`}
              </p>
            </div>
            <div className="chart-panel-actions">
              <select
                className="field-input compact-select"
                value={granularity}
                onChange={handleGranularityChange}
                aria-label="Select comparison granularity"
              >
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
              <button
                type="button"
                className="button button-secondary"
                onClick={() => exportTransactionsToCsv(transactions)}
              >
                Export CSV
              </button>
            </div>
          </div>

          <div className="chart-headline">{formatCurrency(totalCurrent, "INR")}</div>

          <div className="comparison-legend">
            <span className="legend-dot legend-dot-current" /> This {granularityLabel(granularity)}
            <span className="legend-dot legend-dot-previous" /> Last {granularityLabel(granularity)}
          </div>

          <div
            className={`bar-chart comparison-bar-chart ${isTransitioning ? "bar-chart-transitioning" : ""}`}
            aria-label="Spending comparison chart"
          >
            <div className="chart-avg-line" style={{ bottom: `${avgLinePercent}%` }} />
            {comparisonData.map((bucket, index) => (
              <div className="bar-column comparison-bar-group" key={bucket.label}>
                <div className="comparison-bar-pair">
                  <div className="bar-track">
                    <span
                      className="bar-fill bar-fill-previous"
                      style={{ height: `${Math.max((bucket.previous / maxComparisonValue) * 100, 2)}%` }}
                      title={`${formatCurrency(bucket.previous, "INR")} (${formatCompactCurrency(bucket.previous)})`}
                    />
                  </div>
                  <div className="bar-track">
                    <span
                      className={`bar-fill bar-fill-current ${index === peakIndex ? "bar-fill-peak" : "bar-fill-striped"}`}
                      style={{ height: `${Math.max((bucket.current / maxComparisonValue) * 100, 2)}%` }}
                      title={`${formatCurrency(bucket.current, "INR")} (${formatCompactCurrency(bucket.current)})`}
                    >
                      {index === peakIndex ? (
                        <span className="bar-peak-callout">{formatCurrency(bucket.current, "INR")}</span>
                      ) : null}
                    </span>
                  </div>
                </div>
                <div className="bar-label">{bucket.label}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="panel spending-overview-panel">
          <div className="spending-overview-header">Spending overview</div>
          <div className="spending-overview-total">
            {formatCurrency(totalSpend, "INR")}
            {percentChange !== null ? (
              <span className={percentChange >= 0 ? "spend-badge spend-badge-up" : "spend-badge spend-badge-down"}>
                {percentChange >= 0 ? "↑" : "↓"} {Math.abs(percentChange)}%
              </span>
            ) : null}
          </div>
          <div className="spending-overview-subtitle">
            From {formatCurrency(overview.monthly_budget_total, "INR")} budget
          </div>

          {totalSpend > 0 ? (
            <>
              <div className="spending-segmented-bar">
                {topCategories.map((category, index) => (
                  <div
                    key={category.category_id}
                    style={{
                      width: `${(category.spent_amount / totalSpend) * 100}%`,
                      background: colorForCategory(category.category_name, index),
                    }}
                  />
                ))}
                {othersAmount > 0 ? (
                  <div style={{ width: `${(othersAmount / totalSpend) * 100}%`, background: "var(--line)" }} />
                ) : null}
              </div>

              <div className="spending-legend-list">
                {topCategories.map((category, index) => (
                  <div className="spending-legend-row" key={category.category_id}>
                    <span>
                      <span
                        className="legend-dot"
                        style={{ background: colorForCategory(category.category_name, index) }}
                      />
                      {category.category_name}
                    </span>
                    <strong>{formatCurrency(category.spent_amount, "INR")}</strong>
                  </div>
                ))}
                {othersAmount > 0 ? (
                  <div className="spending-legend-row">
                    <span>
                      <span className="legend-dot" style={{ background: "var(--line)" }} />
                      Others
                    </span>
                    <strong>{formatCurrency(othersAmount, "INR")}</strong>
                  </div>
                ) : null}
              </div>
            </>
          ) : (
            <div className="empty-state">No spending recorded yet this period.</div>
          )}
        </section>
      </div>

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
          <div className="panel-header budget-header">
            <div>
              <h2 className="section-title">Configured budgets</h2>
              <p className="section-copy">Review limits, warnings, and utilization by month.</p>
            </div>
            <div className="budget-period-controls">
              <select
                className="field-input"
                value={selectedMonth}
                onChange={(event) => setSelectedMonth(Number(event.target.value))}
                aria-label="Budget month"
              >
                {monthNames.map((month, index) => (
                  <option key={month} value={index + 1}>
                    {month}
                  </option>
                ))}
              </select>
              <input
                className="field-input"
                type="number"
                min="2025"
                max="2100"
                value={selectedYear}
                onChange={(event) => setSelectedYear(Number(event.target.value))}
                aria-label="Budget year"
              />
            </div>
          </div>
          <div className="list">
            {filteredBudgets.length ? (
              filteredBudgets.map((budget) => {
                const state = budgetState(budget);
                return (
                <div className={`list-item budget-item ${state.className}`} key={budget.id}>
                  <div className="list-main">
                    <div>
                      <div className="item-title">
                        {budget.category_name} • {monthNames[budget.month - 1]} {budget.year}
                      </div>
                      <div className="item-subtitle">
                        Limit {formatCurrency(budget.limit_amount, budget.currency_code)} • Spent{" "}
                        {formatCurrency(budget.spent_amount, budget.currency_code)}
                      </div>
                      <div className="item-subtitle">
                        Remaining {formatCurrency(budget.remaining_amount, budget.currency_code)} •{" "}
                        {budget.utilization_percent.toFixed(1)}% used
                      </div>
                      <div className="budget-progress" aria-label={`${budget.utilization_percent}% used`}>
                        <span style={{ width: `${Math.min(budget.utilization_percent, 100)}%` }} />
                      </div>
                      <div className="budget-state-row">
                        <span className="budget-state-label">{state.label}</span>
                        <span className="item-subtitle">Alert at {budget.alert_threshold_percent}%</span>
                      </div>
                    </div>
                    <div className="row-actions">
                      <button
                        className="button button-secondary compact-button"
                        type="button"
                        onClick={() => setEditingBudget(budget)}
                      >
                        Edit
                      </button>
                      <button
                        className="button button-tertiary compact-button"
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
                </div>
                );
              })
            ) : (
              <div className="empty-state">
                No budgets for {monthNames[selectedMonth - 1]} {selectedYear}. Create one to begin tracking limits.
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

      {editingBudget ? (
        <div className="modal-backdrop" role="presentation">
          <div className="modal-panel" role="dialog" aria-modal="true" aria-label="Edit budget form">
            <BudgetForm
              budget={editingBudget}
              categories={categories}
              onCancel={() => setEditingBudget(null)}
              onCreated={async () => {
                await Promise.all([
                  loadDashboard("Budget updated and dashboard refreshed from the database."),
                  loadReports("Budget updated and reports refreshed."),
                ]);
              }}
            />
          </div>
        </div>
      ) : null}
    </main>
  );
}
