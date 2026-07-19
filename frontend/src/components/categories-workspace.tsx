"use client";

import { CategoryForm } from "@/components/category-form";
import { useFinanceDashboard } from "@/lib/use-finance-dashboard";

export function CategoriesWorkspace() {
  const { categories, statusLabel, loadDashboard } = useFinanceDashboard();

  return (
    <main className="page-shell">
      <section className="page-header-compact">
        <div>
          <h1>Categories</h1>
          <p>{categories.length} categories configured</p>
        </div>
        <div className="page-header-actions">
          <span className="button button-primary">{categories.length} categories</span>
          <span className="button button-secondary">{statusLabel}</span>
        </div>
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
            {categories.length ? (
              categories.map((category) => (
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
              ))
            ) : (
              <div className="empty-state">No categories yet. Create your first category to classify transactions.</div>
            )}
          </div>
        </aside>
      </section>
    </main>
  );
}
