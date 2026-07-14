"use client";

import { useCallback, useEffect, useState } from "react";

import { AccountForm } from "@/components/account-form";
import { getAccounts } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import type { PaymentAccount } from "@/lib/types";

const typeIcons: Record<PaymentAccount["type"], string> = {
  bank: "account_balance",
  cash: "payments",
  credit_card: "credit_card",
  upi: "qr_code",
  wallet: "account_balance_wallet",
};

const institutions = ["State Bank of India", "HDFC Bank", "ICICI Bank", "Axis Bank", "Kotak Mahindra"];

export function BankConnectionsWorkspace() {
  const [accounts, setAccounts] = useState<PaymentAccount[]>([]);
  const [isAccountFormOpen, setIsAccountFormOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<PaymentAccount | null>(null);
  const [message, setMessage] = useState("Loading connected local accounts...");

  const loadAccounts = useCallback(async (nextMessage?: string) => {
    try {
      const nextAccounts = await getAccounts();
      setAccounts(nextAccounts);
      setMessage(nextMessage ?? "Local account connections loaded from the backend.");
    } catch {
      setMessage("Could not load local accounts yet.");
    }
  }, []);

  useEffect(() => {
    void loadAccounts();
  }, [loadAccounts]);

  const syncedBalance = accounts.reduce((sum, account) => sum + account.current_balance, 0);
  const bankLikeAccounts = accounts.filter((account) => ["bank", "credit_card", "upi", "wallet"].includes(account.type));
  const defaultAccount = accounts.find((account) => account.is_default);

  function openAccountForm(account?: PaymentAccount) {
    setEditingAccount(account ?? null);
    setIsAccountFormOpen(true);
  }

  function closeAccountForm() {
    setEditingAccount(null);
    setIsAccountFormOpen(false);
  }

  return (
    <main className="page-shell">
      <section className="dashboard-hero">
        <div>
          <span className="eyebrow">Bank linking</span>
          <h1>Connected accounts from your local ledger.</h1>
          <p>
            Manage bank, wallet, cash, UPI, and card accounts locally. These balances power the
            dashboard, receipts, and spending analysis.
          </p>
          <div className="hero-actions">
            <button className="button button-primary" type="button" onClick={() => openAccountForm()}>
              Add account
            </button>
            <span className="button button-secondary">{message}</span>
          </div>
        </div>
        <div className="hero-balance-card">
          <div className="stat-label">Synced local balance</div>
          <div className="hero-balance-value">{formatCurrency(syncedBalance, "INR")}</div>
          <div className="stat-footnote">
            {accounts.length} active accounts{defaultAccount ? ` • default: ${defaultAccount.name}` : ""}
          </div>
        </div>
      </section>

      <section className="grid stats-grid">
        <article className="panel stat-card">
          <div className="stat-label">Bank-like links</div>
          <div className="stat-value">{bankLikeAccounts.length}</div>
          <div className="stat-footnote">Bank, card, UPI, and wallet accounts</div>
        </article>
        <article className="panel stat-card">
          <div className="stat-label">Cash accounts</div>
          <div className="stat-value">{accounts.filter((account) => account.type === "cash").length}</div>
          <div className="stat-footnote">Manual cash balance tracking</div>
        </article>
        <article className="panel stat-card">
          <div className="stat-label">Default account</div>
          <div className="stat-value compact-stat">{defaultAccount?.name ?? "None"}</div>
          <div className="stat-footnote">Used for quick expense posting</div>
        </article>
        <article className="panel stat-card">
          <div className="stat-label">Connection mode</div>
          <div className="stat-value compact-stat">Local</div>
          <div className="stat-footnote">Ready for provider API credentials at deployment</div>
        </article>
      </section>

      <section className="grid content-grid">
        <article className="panel">
          <h2 className="section-title">Connected accounts</h2>
          <p className="section-copy">Real account records stored through the FastAPI backend.</p>
          <div className="analysis-card-grid">
            {accounts.map((account) => (
              <div className="mini-analysis-card bank-card" key={account.id}>
                <span className="nav-icon bank-icon" aria-hidden="true">
                  {typeIcons[account.type]}
                </span>
                <div className="item-title">{account.name}</div>
                <div className="item-subtitle">
                  {account.type.replace("_", " ")}
                  {account.institution_name ? ` • ${account.institution_name}` : ""}
                </div>
                <div className="stat-value compact-stat">
                  {formatCurrency(account.current_balance, account.currency_code)}
                </div>
                <div className="stat-footnote">{account.is_default ? "Default account" : "Active"}</div>
                <button className="button button-secondary compact-button" type="button" onClick={() => openAccountForm(account)}>
                  Edit
                </button>
              </div>
            ))}
          </div>
        </article>

        <aside className="panel">
          <h2 className="section-title">Institution templates</h2>
          <p className="section-copy">Use these as labels when creating local bank accounts.</p>
          <div className="list">
            {institutions.map((name) => (
              <div className="list-item" key={name}>
                <div>
                  <div className="item-title">{name}</div>
                  <div className="item-subtitle">Create as a local bank account</div>
                </div>
                <button className="button button-secondary" type="button" onClick={() => openAccountForm()}>
                  Add
                </button>
              </div>
            ))}
          </div>
        </aside>
      </section>

      {isAccountFormOpen ? (
        <div className="modal-backdrop" role="presentation">
          <div className="modal-panel" role="dialog" aria-modal="true" aria-label="Account form">
            <AccountForm account={editingAccount} onCancel={closeAccountForm} onSaved={loadAccounts} />
          </div>
        </div>
      ) : null}
    </main>
  );
}
