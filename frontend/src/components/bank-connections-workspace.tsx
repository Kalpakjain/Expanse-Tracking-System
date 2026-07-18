"use client";

import { useCallback, useEffect, useState } from "react";

import { AccountForm } from "@/components/account-form";
import { deactivateAccount, getAccounts } from "@/lib/api";
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

  function openAccountForm(account?: PaymentAccount) {
    setEditingAccount(account ?? null);
    setIsAccountFormOpen(true);
  }

  function closeAccountForm() {
    setEditingAccount(null);
    setIsAccountFormOpen(false);
  }

  async function handleDeactivate(accountId: string) {
    if (!window.confirm("Deactivate this account? It will no longer appear in your active balances.")) return;
    try {
      await deactivateAccount(accountId);
      await loadAccounts("Account deactivated.");
    } catch {
      setMessage("Could not deactivate this account.");
    }
  }

  return (
    <main className="page-shell">
      <div className="page-header-compact">
        <div>
          <h1>Accounts</h1>
          <p className="page-header-subtitle">Manage your wallets, bank, and card balances</p>
        </div>
        <button className="button button-primary" type="button" onClick={() => openAccountForm()}>
          + Add account
        </button>
      </div>

      <div className="balance-summary-card">
        <div>
          <div className="balance-summary-label">Combined balance</div>
          <div className="balance-summary-value">{formatCurrency(syncedBalance, "INR")}</div>
          <div className="balance-summary-footnote">
            Across {accounts.length} active account{accounts.length === 1 ? "" : "s"}
          </div>
        </div>
        <div className="balance-summary-avatars">
          {accounts.slice(0, 4).map((account, i) => (
            <div
              key={account.id}
              className="balance-summary-avatar"
              style={{ background: ["var(--primary)", "var(--accent)", "var(--secondary)", "var(--line)"][i % 4] }}
            >
              {account.name.charAt(0).toUpperCase()}
            </div>
          ))}
        </div>
      </div>

      {message ? <div className="toast-inline">{message}</div> : null}

      <section className="grid content-grid">
        <article className="panel">
          <h2 className="section-title">Connected accounts</h2>
          <p className="section-copy">Real account records stored through the FastAPI backend.</p>
          <div className="account-grid">
            {accounts.map((account) => (
              <div className="account-card" key={account.id}>
                {account.is_default && <span className="account-card-badge">DEFAULT</span>}
                <div
                  className="account-card-icon"
                  style={{
                    background: {
                      bank: "var(--secondary)",
                      cash: "var(--accent)",
                      upi: "var(--primary)",
                      credit_card: "#8f2450",
                      wallet: "var(--primary)",
                    }[account.type],
                  }}
                >
                  <span className="nav-icon" aria-hidden="true">{typeIcons[account.type]}</span>
                </div>
                <div className="account-card-name">{account.name}</div>
                <div className="account-card-subtitle">
                  {account.type.replace("_", " ")}
                  {account.institution_name ? ` - ${account.institution_name}` : ""}
                </div>
                <div className="account-card-balance">{formatCurrency(account.current_balance, account.currency_code)}</div>
                <div className="account-card-actions">
                  <button className="button button-secondary compact-button" type="button" onClick={() => openAccountForm(account)}>
                    Edit
                  </button>
                  <button className="button button-danger-outline compact-button" type="button" onClick={() => handleDeactivate(account.id)}>
                    Deactivate
                  </button>
                </div>
              </div>
            ))}
            <button type="button" className="account-card account-card-add" onClick={() => openAccountForm()}>
              <span className="account-card-add-icon">+</span>
              Add another account
            </button>
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
