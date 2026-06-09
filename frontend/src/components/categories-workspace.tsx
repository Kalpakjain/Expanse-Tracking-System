"use client";

import { CategoryForm } from "@/components/category-form";
import { useFinanceDashboard } from "@/lib/use-finance-dashboard";

export function CategoriesWorkspace() {
  const { categories, statusLabel, loadDashboard } = useFinanceDashboard();
  const expenseCategories = categories.filter((category) => category.type === "expense");
  const incomeCategories = categories.filter((category) => category.type === "income");

  return (
    <main className="page-shell">
      <section className="hero">
        <article className="hero-card">
          <span className="eyebrow">Categories</span>
          <h1>Shape the system around your real spending.</h1>
          <p>
            This section is for organizing your tracker. Create clean expense and income buckets so
            your reports stay understandable later.
          </p>
          <div className="hero-actions">
            <span className="button button-primary">{categories.length} categories live</span>
            <span className="button button-secondary">{statusLabel}</span>
          </div>
        </article>

        <aside className="hero-side">
          <div className="hero-card side-card">
            <h2>Category system</h2>
            <p>
              Expense categories help reporting, and income categories keep cash-in records as
              structured as cash-out records.
            </p>
          </div>
          <div className="hero-card side-card">
            <h2>Good practice</h2>
            <p>
              Keep categories broad enough to be useful, but specific enough to spot patterns
              quickly.
            </p>
          </div>
        </aside>
      </section>

      <section className="grid stats-grid">
        <article className="panel stat-card">
          <div className="stat-label">All categories</div>
          <div className="stat-value">{categories.length}</div>
          <div className="stat-footnote">Current category library</div>
        </article>
        <article className="panel stat-card">
          <div className="stat-label">Expense categories</div>
          <div className="stat-value">{expenseCategories.length}</div>
          <div className="stat-footnote">Used for spend tracking</div>
        </article>
        <article className="panel stat-card">
          <div className="stat-label">Income categories</div>
          <div className="stat-value">{incomeCategories.length}</div>
          <div className="stat-footnote">Used for incoming funds</div>
        </article>
        <article className="panel stat-card">
          <div className="stat-label">Seeded defaults</div>
          <div className="stat-value">{categories.filter((category) => category.is_default).length}</div>
          <div className="stat-footnote">Starter baseline categories</div>
        </article>
      </section>

      <section className="grid content-grid">
        <CategoryForm
          onCreated={async () => {
            await loadDashboard("Category created and category page refreshed.");
          }}
        />

        <aside className="panel">
          <h2 className="section-title">Current category set</h2>
          <p className="section-copy">
            These cards are the classification layer for the rest of the product.
          </p>
          <div className="category-grid">
            {categories.map((category) => (
              <article className="category-card" key={category.id}>
                <div className="category-card-top">
                  <span className="badge-dot large-dot" style={{ backgroundColor: category.color }} />
                  <span className="badge">{category.type}</span>
                </div>
                <h3 className="category-title">{category.name}</h3>
                <p className="item-subtitle">
                  Icon label: {category.icon} {category.is_default ? "• Default" : "• Custom"}
                </p>
              </article>
            ))}
          </div>
        </aside>
      </section>
    </main>
  );
}
