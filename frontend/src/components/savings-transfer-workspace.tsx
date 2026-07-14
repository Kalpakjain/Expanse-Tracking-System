"use client";

import { useEffect, useMemo, useState } from "react";

import { getAccounts, getReportsOverview } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import type { PaymentAccount, ReportsOverview } from "@/lib/types";

type SavingsRule = {
  name: string;
  detail: string;
  amount: number;
  status: "ready" | "watch" | "blocked";
};

function buildSavingsRules(report: ReportsOverview | null, accounts: PaymentAccount[]): SavingsRule[] {
  if (!report) {
    return [];
  }

  const rules: SavingsRule[] = [];
  const positiveBudgetRemainders = report.category_breakdown
    .filter((category) => category.remaining_amount !== null && category.remaining_amount > 0)
    .sort((left, right) => (right.remaining_amount ?? 0) - (left.remaining_amount ?? 0));
  const totalAccountBalance = accounts.reduce((sum, account) => sum + account.current_balance, 0);
  const availableMonthlySurplus = Math.max(report.summary.balance, 0);

  if (positiveBudgetRemainders[0]) {
    const category = positiveBudgetRemainders[0];
    rules.push({
      name: `${category.category_name} budget sweep`,
      detail: `Move part of the unused ${category.category_name} budget into savings.`,
      amount: Math.round((category.remaining_amount ?? 0) * 0.5),
      status: "ready",
    });
  }

  rules.push({
    name: "Monthly surplus transfer",
    detail: "Save 20% of the current positive balance after recorded expenses.",
    amount: Math.round(availableMonthlySurplus * 0.2),
    status: availableMonthlySurplus > 0 ? "ready" : "blocked",
  });

  rules.push({
    name: "Emergency buffer top-up",
    detail: "Protect 5% of total account balance as a conservative buffer move.",
    amount: Math.round(Math.max(totalAccountBalance, 0) * 0.05),
    status: totalAccountBalance > 0 ? "watch" : "blocked",
  });

  return rules;
}

export function SavingsTransferWorkspace() {
  const [report, setReport] = useState<ReportsOverview | null>(null);
  const [accounts, setAccounts] = useState<PaymentAccount[]>([]);
  const [message, setMessage] = useState("Loading savings opportunities...");

  useEffect(() => {
    async function loadSavingsData() {
      try {
        const [nextReport, nextAccounts] = await Promise.all([getReportsOverview(), getAccounts()]);
        setReport(nextReport);
        setAccounts(nextAccounts);
        setMessage("Savings opportunities calculated from your local data.");
      } catch {
        setMessage("Could not calculate savings opportunities yet.");
      }
    }

    void loadSavingsData();
  }, []);

  const rules = useMemo(() => buildSavingsRules(report, accounts), [accounts, report]);
  const projectedMonthlySavings = rules
    .filter((rule) => rule.status !== "blocked")
    .reduce((sum, rule) => sum + Math.max(rule.amount, 0), 0);
  const savingsVault = accounts
    .filter((account) => ["bank", "wallet"].includes(account.type))
    .reduce((sum, account) => sum + Math.max(account.current_balance, 0), 0);
  const activeBudgetRemainder = report?.category_breakdown.reduce(
    (sum, category) => sum + Math.max(category.remaining_amount ?? 0, 0),
    0,
  ) ?? 0;
  const riskLevel = report && report.over_budget_count > 0 ? "High" : projectedMonthlySavings > 0 ? "Low" : "Watch";

  return (
    <main className="page-shell">
      <section className="dashboard-hero">
        <div>
          <span className="eyebrow">Savings automation</span>
          <h1>Transfer surplus before it disappears.</h1>
          <p>
            Savings rules are calculated from real budgets, account balances, and recorded expenses.
            Review the suggested amount before moving money outside the app.
          </p>
          <div className="hero-actions">
            <span className="button button-primary">{rules.length} local rules</span>
            <span className="button button-secondary">{message}</span>
          </div>
        </div>
        <div className="hero-balance-card">
          <div className="stat-label">Projected monthly savings</div>
          <div className="hero-balance-value">{formatCurrency(projectedMonthlySavings, "INR")}</div>
          <div className="stat-footnote">From active local rule suggestions</div>
        </div>
      </section>

      <section className="grid stats-grid">
        <article className="panel stat-card">
          <div className="stat-label">Savings vault</div>
          <div className="stat-value">{formatCurrency(savingsVault, "INR")}</div>
          <div className="stat-footnote">Positive bank and wallet balances</div>
        </article>
        <article className="panel stat-card">
          <div className="stat-label">Budget remainder</div>
          <div className="stat-value">{formatCurrency(activeBudgetRemainder, "INR")}</div>
          <div className="stat-footnote">Unused current-month budget room</div>
        </article>
        <article className="panel stat-card">
          <div className="stat-label">Rules</div>
          <div className="stat-value">{rules.length}</div>
          <div className="stat-footnote">Generated from report data</div>
        </article>
        <article className="panel stat-card">
          <div className="stat-label">Risk</div>
          <div className="stat-value compact-stat">{riskLevel}</div>
          <div className="stat-footnote">
            {report?.over_budget_count ? `${report.over_budget_count} budget issue(s)` : "No over-budget category"}
          </div>
        </article>
      </section>

      <section className="panel">
        <h2 className="section-title">Suggested transfer rules</h2>
        <p className="section-copy">Local recommendations only. Real bank transfer execution comes during provider deployment.</p>
        <div className="list">
          {rules.length ? (
            rules.map((rule) => (
              <div className="list-item" key={rule.name}>
                <div>
                  <div className="item-title">{rule.name}</div>
                  <div className="item-subtitle">{rule.detail}</div>
                  <div className="item-subtitle">Status: {rule.status}</div>
                </div>
                <strong>{formatCurrency(Math.max(rule.amount, 0), "INR")}</strong>
              </div>
            ))
          ) : (
            <div className="empty-state">Add budgets and expenses to generate savings suggestions.</div>
          )}
        </div>
      </section>
    </main>
  );
}
