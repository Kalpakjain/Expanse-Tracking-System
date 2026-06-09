"use client";

import Link from "next/link";

import { ExpenseForm } from "@/components/expense-form";
import { formatCurrency } from "@/lib/format";
import { useFinanceDashboard } from "@/lib/use-finance-dashboard";

export function HomeWorkspace() {
  const {
    summary,
    transactions,
    categories,
    statusLabel,
    deletingTransactionId,
    loadDashboard,
    removeTransaction,
  } = useFinanceDashboard();

  const topTransactions = transactions.slice(0, 5);

  return (
    <main className="page-shell">
      <section className="hero">
        <article className="hero-card">
          <span className="eyebrow">Home</span>
          <h1>Track money daily, review it later.</h1>
          <p>
            Your home page stays focused on the flow you repeat most: add transactions, scan recent
            activity, and see whether your spending rhythm still feels healthy.
          </p>
          <div className="hero-actions">
            <span className="button button-primary">Backend connected</span>
            <span className="button button-secondary">{statusLabel}</span>
          </div>
        </article>

        <aside className="hero-side">
          <div className="hero-card side-card">
            <h2>Quick moves</h2>
            <p>Jump to deeper sections when you need category structure, reporting, or alerts.</p>
            <div className="hero-actions compact-actions">
              <Link className="button button-secondary" href="/categories">
                Manage categories
              </Link>
              <Link className="button button-secondary" href="/reports">
                Open reports
              </Link>
            </div>
          </div>
          <div className="hero-card side-card">
            <h2>What changed</h2>
            <p>
              Categories have moved off the home page, so this screen can stay lighter and more
              action-oriented.
            </p>
          </div>
        </aside>
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

      <section className="grid content-grid">
        <article className="panel">
          <h2 className="section-title">Recent transactions</h2>
          <p className="section-copy">
            Use this list as your day-to-day ledger. If something is wrong, you can remove it from
            here immediately.
          </p>
          <div className="list">
            {topTransactions.length ? (
              topTransactions.map((transaction) => (
                <div className="list-item" key={transaction.id}>
                  <div className="list-main">
                    <div>
                      <div className="item-title">{transaction.merchant_name}</div>
                      <div className="item-subtitle">
                        {transaction.category_name} • {transaction.payment_method} •{" "}
                        {transaction.transaction_date}
                      </div>
                      <div className="item-subtitle">
                        {transaction.description || "No description"}
                      </div>
                    </div>
                    <button
                      className="button button-tertiary"
                      type="button"
                      disabled={deletingTransactionId === transaction.id}
                      onClick={() => {
                        void removeTransaction(transaction.id);
                      }}
                    >
                      {deletingTransactionId === transaction.id ? "Deleting..." : "Delete"}
                    </button>
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
                No transactions yet. Add your first expense below to start tracking real data.
              </div>
            )}
          </div>
        </article>

        <aside className="panel">
          <h2 className="section-title">Home focus</h2>
          <p className="section-copy">
            This page is now the operational center of the app: fast entry, recent activity, and a
            quick read on whether the numbers still look right.
          </p>
          <div className="checklist">
            <div className="checklist-item">
              <span className="check">1</span>
              <div>
                <div className="item-title">Log daily expenses</div>
                <div className="item-subtitle">
                  Capture transactions while they are still fresh.
                </div>
              </div>
            </div>
            <div className="checklist-item">
              <span className="check">2</span>
              <div>
                <div className="item-title">Review recent activity</div>
                <div className="item-subtitle">
                  Keep the ledger clean without leaving the home screen.
                </div>
              </div>
            </div>
            <div className="checklist-item">
              <span className="check">3</span>
              <div>
                <div className="item-title">Branch into reports</div>
                <div className="item-subtitle">
                  Visit reports when you want category-level analysis and patterns.
                </div>
              </div>
            </div>
          </div>
        </aside>
      </section>

      <section className="grid content-grid">
        <ExpenseForm
          categories={categories}
          onCreated={async () => {
            await loadDashboard("Expense saved and dashboard refreshed from the database.");
          }}
        />

        <aside className="panel">
          <h2 className="section-title">What comes next</h2>
          <p className="section-copy">
            Your app now has a clearer front-end structure. The next high-value feature after this
            navigation split is budget tracking with monthly category limits.
          </p>
          <div className="hero-actions compact-actions">
            <Link className="button button-secondary" href="/categories">
              Visit categories
            </Link>
            <Link className="button button-secondary" href="/whatsapp-notifications">
              Open alerts
            </Link>
          </div>
        </aside>
      </section>
    </main>
  );
}
