"use client";

import { useState } from "react";
import type { FormEvent } from "react";

import { createAccount, updateAccount } from "@/lib/api";
import type { CreatePaymentAccountInput, PaymentAccount } from "@/lib/types";

type AccountFormProps = {
  account?: PaymentAccount | null;
  onCancel: () => void;
  onSaved: () => Promise<void>;
};

const accountTypes: CreatePaymentAccountInput["type"][] = ["wallet", "cash", "bank", "upi", "credit_card"];

function initialState(account?: PaymentAccount | null): CreatePaymentAccountInput {
  return {
    name: account?.name ?? "",
    type: account?.type ?? "wallet",
    institution_name: account?.institution_name ?? "",
    opening_balance: account?.opening_balance ?? 0,
    currency_code: account?.currency_code ?? "INR",
    color: account?.color ?? "#0051D5",
    is_default: account?.is_default ?? false,
  };
}

export function AccountForm({ account, onCancel, onSaved }: AccountFormProps) {
  const [form, setForm] = useState<CreatePaymentAccountInput>(() => initialState(account));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState(account ? "Update account details." : "Create a new payment account.");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(account ? "Saving account..." : "Creating account...");
    try {
      if (account) {
        await updateAccount(account.id, form);
      } else {
        await createAccount(form);
      }
      await onSaved();
      setMessage(account ? "Account updated." : "Account created.");
      onCancel();
    } catch {
      setMessage("Could not save this account. Check the details and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="expense-form-panel">
      <div className="form-heading-row">
        <div>
          <h2 className="section-title">{account ? "Edit Account" : "New Account"}</h2>
          <p className="section-copy">Manage wallets, cash, bank, UPI, and credit-card balances.</p>
        </div>
        <button className="icon-button" type="button" aria-label="Close account form" onClick={onCancel}>
          x
        </button>
      </div>

      <form className="expense-form" onSubmit={handleSubmit}>
        <label className="field">
          <span className="field-label">Account name</span>
          <input
            className="field-input"
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            placeholder="HDFC Bank, Cash, UPI"
            required
          />
        </label>

        <div className="field-row">
          <label className="field">
            <span className="field-label">Type</span>
            <select
              className="field-input"
              value={form.type}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  type: event.target.value as CreatePaymentAccountInput["type"],
                }))
              }
            >
              {accountTypes.map((type) => (
                <option key={type} value={type}>
                  {type.replace("_", " ")}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span className="field-label">Opening balance</span>
            <input
              className="field-input"
              type="number"
              step="0.01"
              value={form.opening_balance}
              onChange={(event) =>
                setForm((current) => ({ ...current, opening_balance: Number(event.target.value) }))
              }
            />
          </label>
        </div>

        <div className="field-row">
          <label className="field">
            <span className="field-label">Institution</span>
            <input
              className="field-input"
              value={form.institution_name}
              onChange={(event) =>
                setForm((current) => ({ ...current, institution_name: event.target.value }))
              }
              placeholder="Optional bank/provider"
            />
          </label>

          <label className="field">
            <span className="field-label">Color</span>
            <input
              className="field-input"
              type="color"
              value={form.color}
              onChange={(event) => setForm((current) => ({ ...current, color: event.target.value }))}
            />
          </label>
        </div>

        <label className="toggle-row">
          <input
            type="checkbox"
            checked={form.is_default}
            onChange={(event) => setForm((current) => ({ ...current, is_default: event.target.checked }))}
          />
          <span>Use as default account</span>
        </label>

        <div className="form-actions">
          <button className="button button-primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : account ? "Save changes" : "Create account"}
          </button>
          <span className="form-message">{message}</span>
        </div>
      </form>
    </section>
  );
}
