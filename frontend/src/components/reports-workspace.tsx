"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ChangeEvent } from "react";

import { getReportsOverview } from "@/lib/api";
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
      d.setMonth(d.getMonth() - periodsBack * bucketCount - (bucketCount - 1) + index);
    } else if (granularity === "quarterly") {
      const currentQuarterStartMonth = Math.floor(d.getMonth() / 3) * 3;
      d.setDate(1);
      d.setMonth(
        currentQuarterStartMonth - periodsBack * bucketCount * 3 - (bucketCount - 1) * 3 + index * 3
      );
    } else {
      d.setMonth(0, 1);
      d.setFullYear(d.getFullYear() - periodsBack * bucketCount - (bucketCount - 1) + index);
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

  function dateKey(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function sumExpensesInRange(start: Date, end: Date): number {
    const startKey = dateKey(start);
    const endKey = dateKey(end);
    return transactions
      .filter((t) => t.type === "expense")
      .filter((t) => {
        const txKey = dateKey(new Date(t.transaction_date));
        return txKey >= startKey && txKey < endKey;
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
  const { transactions, categories } = useFinanceDashboard();
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
  });
  const [reportMessage, setReportMessage] = useState("");
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
  const shouldShowOthers = spendingBreakdown.length > 2 && othersAmount > 0;

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
          <p>Categories and spending trends</p>
        </div>
      </section>

      {reportMessage ? <div className="toast-inline">{reportMessage}</div> : null}

      <section className="grid stats-grid">
        <article className="panel stat-card stat-card-income">
          <div className="stat-label">Income</div>
          <div className="stat-value">{formatCurrency(overview.summary.total_income, "INR")}</div>
        </article>
        <article className="panel stat-card stat-card-expenses">
          <div className="stat-label">Expenses</div>
          <div className="stat-value">{formatCurrency(overview.summary.total_expenses, "INR")}</div>
        </article>
        <article className="panel stat-card">
          <div className="stat-label">Net</div>
          <div className="stat-value">{formatCurrency(overview.summary.balance, "INR")}</div>
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
          <div className="spending-overview-subtitle">This period&apos;s spending</div>

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
                {shouldShowOthers ? (
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
                {shouldShowOthers ? (
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
                    <div className="item-subtitle">{entry.transaction_count} transactions</div>
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
            Backend-generated signals call out concentrated spend and whether the app has enough
            data for stronger recommendations.
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
