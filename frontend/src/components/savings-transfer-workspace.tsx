"use client";

const rules = [
  { name: "Round-up savings", detail: "Move spare change after every card spend", amount: "₹1,240/mo" },
  { name: "Friday sweep", detail: "Transfer unused weekly dining budget", amount: "₹2,500/mo" },
  { name: "Emergency buffer", detail: "Auto-top-up until 3 months of expenses", amount: "68%" },
];

export function SavingsTransferWorkspace() {
  return (
    <main className="page-shell">
      <section className="dashboard-hero">
        <div>
          <span className="eyebrow">Savings automation</span>
          <h1>Transfer surplus before it disappears.</h1>
          <p>
            Turn budget leftovers and round-ups into automatic savings moves with reviewable rules.
          </p>
          <div className="hero-actions">
            <span className="button button-primary">Create transfer rule</span>
            <span className="button button-secondary">Next transfer: Friday</span>
          </div>
        </div>
        <div className="hero-balance-card">
          <div className="stat-label">Projected monthly savings</div>
          <div className="hero-balance-value">₹3,740</div>
          <div className="stat-footnote">From active automation rules</div>
        </div>
      </section>

      <section className="grid stats-grid">
        <article className="panel stat-card">
          <div className="stat-label">Savings vault</div>
          <div className="stat-value">₹1.42L</div>
          <div className="stat-footnote">Current protected balance</div>
        </article>
        <article className="panel stat-card">
          <div className="stat-label">Monthly target</div>
          <div className="stat-value">₹8,000</div>
          <div className="stat-footnote">47% projected completion</div>
        </article>
        <article className="panel stat-card">
          <div className="stat-label">Rules</div>
          <div className="stat-value">{rules.length}</div>
          <div className="stat-footnote">Active automations</div>
        </article>
        <article className="panel stat-card">
          <div className="stat-label">Risk</div>
          <div className="stat-value compact-stat">Low</div>
          <div className="stat-footnote">No cash-flow issue detected</div>
        </article>
      </section>

      <section className="panel">
        <h2 className="section-title">Active transfer rules</h2>
        <p className="section-copy">Reviewable automation, inspired by the Stitch savings flow.</p>
        <div className="list">
          {rules.map((rule) => (
            <div className="list-item" key={rule.name}>
              <div>
                <div className="item-title">{rule.name}</div>
                <div className="item-subtitle">{rule.detail}</div>
              </div>
              <strong>{rule.amount}</strong>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
