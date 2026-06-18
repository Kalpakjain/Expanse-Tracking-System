"use client";

const accounts = [
  { bank: "HDFC Bank", type: "Savings", balance: "₹82,450", status: "Synced 2 min ago", icon: "account_balance" },
  { bank: "ICICI Credit", type: "Credit Card", balance: "₹18,920 due", status: "Synced today", icon: "credit_card" },
  { bank: "UPI Wallet", type: "Wallet", balance: "₹4,250", status: "Live", icon: "account_balance_wallet" },
];

const institutions = ["State Bank of India", "HDFC Bank", "ICICI Bank", "Axis Bank", "Kotak Mahindra"];

export function BankConnectionsWorkspace() {
  return (
    <main className="page-shell">
      <section className="dashboard-hero">
        <div>
          <span className="eyebrow">Bank linking</span>
          <h1>Connect accounts for automatic tracking.</h1>
          <p>
            Link banks, cards, and wallets to sync transactions, reduce manual entry, and power
            real-time financial insights.
          </p>
          <div className="hero-actions">
            <span className="button button-primary">2 active links</span>
            <span className="button button-secondary">Secure consent flow ready</span>
          </div>
        </div>
        <div className="hero-balance-card">
          <div className="stat-label">Synced balance</div>
          <div className="hero-balance-value">₹1.05L</div>
          <div className="stat-footnote">Across bank, card, and wallet accounts</div>
        </div>
      </section>

      <section className="grid content-grid">
        <article className="panel">
          <h2 className="section-title">Connected accounts</h2>
          <p className="section-copy">A clean account overview modeled after the Stitch bank cards.</p>
          <div className="analysis-card-grid">
            {accounts.map((account) => (
              <div className="mini-analysis-card bank-card" key={account.bank}>
                <span className="nav-icon bank-icon" aria-hidden="true">{account.icon}</span>
                <div className="item-title">{account.bank}</div>
                <div className="item-subtitle">{account.type}</div>
                <div className="stat-value compact-stat">{account.balance}</div>
                <div className="stat-footnote">{account.status}</div>
              </div>
            ))}
          </div>
        </article>

        <aside className="panel">
          <h2 className="section-title">Link a new institution</h2>
          <p className="section-copy">Search and connect a bank through a consent-first flow.</p>
          <div className="list">
            {institutions.map((name) => (
              <div className="list-item" key={name}>
                <div>
                  <div className="item-title">{name}</div>
                  <div className="item-subtitle">OAuth-ready connection flow</div>
                </div>
                <span className="button button-secondary">Link</span>
              </div>
            ))}
          </div>
        </aside>
      </section>
    </main>
  );
}
