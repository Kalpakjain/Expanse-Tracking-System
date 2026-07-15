"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";

import { createCategory, createTransaction, updateTransaction } from "@/lib/api";
import type { Category, CreateCategoryInput, CreateTransactionInput, PaymentAccount, Transaction } from "@/lib/types";

type ExpenseFormProps = {
  categories: Category[];
  accounts: PaymentAccount[];
  onCreated: () => Promise<void>;
  onCancel?: () => void;
  initialType?: "expense" | "income";
  transaction?: Transaction | null;
};

type ExpenseFormState = {
  type: "expense" | "income";
  account_id: string;
  account_name: string;
  category_id: string;
  amount: string;
  merchant_name: string;
  description: string;
  transaction_date: string;
  payment_method: string;
  notes: string;
};

const initialState: ExpenseFormState = {
  type: "expense",
  account_id: "",
  account_name: "Primary Wallet",
  category_id: "",
  amount: "",
  merchant_name: "",
  description: "",
  transaction_date: new Date().toISOString().slice(0, 10),
  payment_method: "UPI",
  notes: "",
};

const newCategoryValue = "**new**";

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function buildInitialState(
  transaction: Transaction | null | undefined,
  initialType: "expense" | "income",
): ExpenseFormState {
  if (!transaction) {
    return { ...initialState, type: initialType };
  }

  return {
    type: transaction.type,
    account_id: transaction.account_id ?? "",
    account_name: transaction.account_name,
    category_id: transaction.category_id,
    amount: String(transaction.amount),
    merchant_name: transaction.merchant_name,
    description: transaction.description,
    transaction_date: transaction.transaction_date,
    payment_method: transaction.payment_method,
    notes: transaction.notes,
  };
}

export function ExpenseForm({
  categories,
  accounts,
  onCreated,
  onCancel,
  initialType = "expense",
  transaction,
}: ExpenseFormProps) {
  const [form, setForm] = useState<ExpenseFormState>(() => buildInitialState(transaction, initialType));
  const [localCategories, setLocalCategories] = useState<Category[]>(categories);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState(
    transaction ? "Update the transaction details and save." : "Add a new ledger entry.",
  );
  const availableCategories = localCategories.filter((category) => category.type === form.type);
  const isEditing = Boolean(transaction);

  useEffect(() => {
    setLocalCategories(categories);
  }, [categories]);

  useEffect(() => {
    if (form.category_id === newCategoryValue) {
      return;
    }
    const categoryStillMatches = availableCategories.some((category) => category.id === form.category_id);
    if ((!form.category_id || !categoryStillMatches) && availableCategories.length > 0) {
      setForm((current) => ({
        ...current,
        category_id: availableCategories[0].id,
      }));
    }
  }, [availableCategories, form.category_id]);

  useEffect(() => {
    if (!form.account_id && accounts.length > 0) {
      const defaultAccount = accounts.find((account) => account.is_default) ?? accounts[0];
      setForm((current) => ({
        ...current,
        account_id: defaultAccount.id,
        account_name: defaultAccount.name,
      }));
    }
  }, [accounts, form.account_id]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (form.category_id === newCategoryValue) {
      setMessage("Create the new category first.");
      return;
    }
    if (!form.category_id) {
      setMessage("Please select a category first.");
      return;
    }

    setIsSubmitting(true);
    setMessage(isEditing ? "Saving changes..." : "Saving transaction...");

    try {
      const selectedAccount = accounts.find((account) => account.id === form.account_id);
      const payload: CreateTransactionInput = {
        account_name: selectedAccount?.name ?? form.account_name,
        account_id: isUuid(form.account_id) ? form.account_id : null,
        category_id: form.category_id,
        type: form.type,
        amount: Number(form.amount),
        currency_code: "INR",
        merchant_name: form.merchant_name,
        description: form.description,
        transaction_date: form.transaction_date,
        payment_method: form.payment_method,
        notes: form.notes,
      };

      if (transaction) {
        await updateTransaction(transaction.id, payload);
      } else {
        await createTransaction(payload);
      }
      setForm({
        ...initialState,
        type: form.type,
        category_id: availableCategories[0]?.id ?? "",
        account_id: accounts[0]?.id ?? "",
        account_name: accounts[0]?.name ?? "Primary Wallet",
      });
      await onCreated();
      setMessage(isEditing ? "Transaction updated." : "Transaction saved to the database.");
      onCancel?.();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save the transaction yet.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCreateCategory() {
    const name = newCategoryName.trim();
    if (!name) {
      setMessage("Enter a category name first.");
      return;
    }

    setIsCreatingCategory(true);
    setMessage("Creating category...");
    try {
      const payload: CreateCategoryInput = {
        name,
        type: form.type,
        color: form.type === "expense" ? "#B0305C" : "#0F766E",
        icon: form.type === "expense" ? "receipt" : "wallet",
      };
      const category = await createCategory(payload);
      setLocalCategories((current) => [...current, category]);
      setForm((current) => ({ ...current, category_id: category.id }));
      setNewCategoryName("");
      setMessage("Category created and selected.");
    } catch {
      setMessage("Could not create category. It may already exist.");
    } finally {
      setIsCreatingCategory(false);
    }
  }

  return (
    <section className="expense-form-panel">
      <div className="form-heading-row">
        <div>
          <h2 className="section-title">
            {isEditing ? "Edit Transaction" : form.type === "income" ? "New Income" : "New Expense"}
          </h2>
          <p className="section-copy">
            {isEditing
              ? "Adjust the ledger entry and refresh the dashboard analysis."
              : "Record income or spending once, then let the dashboard update the analysis."}
          </p>
        </div>
        {onCancel ? (
          <button className="icon-button" type="button" aria-label="Close expense form" onClick={onCancel}>
            x
          </button>
        ) : null}
      </div>

      <form className="expense-form" onSubmit={handleSubmit}>
        <div className="segmented-control" role="group" aria-label="Transaction type">
          <button
            className={form.type === "expense" ? "segment-active" : ""}
            type="button"
            onClick={() => setForm((current) => ({ ...current, type: "expense", category_id: "" }))}
          >
            Expense
          </button>
          <button
            className={form.type === "income" ? "segment-active" : ""}
            type="button"
            onClick={() => setForm((current) => ({ ...current, type: "income", category_id: "" }))}
          >
            Income
          </button>
        </div>

        <label className="field">
          <span className="field-label">{form.type === "income" ? "Source" : "Merchant"}</span>
          <input
            className="field-input"
            name="merchant_name"
            value={form.merchant_name}
            onChange={(event) =>
              setForm((current) => ({ ...current, merchant_name: event.target.value }))
            }
            placeholder={form.type === "income" ? "Salary, freelance, refund" : "Groceries, Uber, Rent"}
            required
          />
        </label>

        <div className="field-row">
          <label className="field">
            <span className="field-label">Amount</span>
            <input
              className="field-input"
              name="amount"
              type="number"
              min="0.01"
              step="0.01"
              value={form.amount}
              onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
              placeholder="0.00"
              required
            />
          </label>

          <label className="field">
            <span className="field-label">Date</span>
            <input
              className="field-input"
              name="transaction_date"
              type="date"
              value={form.transaction_date}
              onChange={(event) =>
                setForm((current) => ({ ...current, transaction_date: event.target.value }))
              }
              required
            />
          </label>
        </div>

        <div className="field-row">
          <label className="field">
            <span className="field-label">Account</span>
            <select
              className="field-input"
              name="account_id"
              value={form.account_id}
              onChange={(event) => {
                const account = accounts.find((item) => item.id === event.target.value);
                setForm((current) => ({
                  ...current,
                  account_id: event.target.value,
                  account_name: account?.name ?? current.account_name,
                }));
              }}
              required
            >
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span className="field-label">Category</span>
            <select
              className="field-input"
              name="category_id"
              value={form.category_id}
              onChange={(event) => {
                setForm((current) => ({ ...current, category_id: event.target.value }));
                if (event.target.value !== newCategoryValue) {
                  setNewCategoryName("");
                }
              }}
              required
            >
              {availableCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
              <option value={newCategoryValue}>+ Add new category</option>
            </select>
          </label>

          <label className="field">
            <span className="field-label">Payment method</span>
            <input
              className="field-input"
              name="payment_method"
              value={form.payment_method}
              onChange={(event) =>
                setForm((current) => ({ ...current, payment_method: event.target.value }))
              }
              placeholder="UPI, Card, Cash"
              required
            />
          </label>
        </div>

        {form.category_id === newCategoryValue ? (
          <div className="inline-create-row">
            <label className="field">
              <span className="field-label">New {form.type} category</span>
              <input
                className="field-input"
                value={newCategoryName}
                onChange={(event) => setNewCategoryName(event.target.value)}
                placeholder={form.type === "expense" ? "Dining, Rent, Fitness" : "Salary, Freelance"}
              />
            </label>
            <button
              className="button button-primary compact-button"
              type="button"
              disabled={isCreatingCategory}
              onClick={() => {
                void handleCreateCategory();
              }}
            >
              {isCreatingCategory ? "Creating..." : "Create"}
            </button>
          </div>
        ) : null}

        <label className="field hidden-field">
          <span className="field-label">Account name</span>
          <input
            className="field-input"
            name="account_name"
            value={form.account_name}
            onChange={(event) =>
              setForm((current) => ({ ...current, account_name: event.target.value }))
            }
            placeholder="Primary Wallet"
            required
          />
        </label>

        <label className="field">
          <span className="field-label">Description</span>
          <input
            className="field-input"
            name="description"
            value={form.description}
            onChange={(event) =>
              setForm((current) => ({ ...current, description: event.target.value }))
            }
            placeholder="Optional short note"
          />
        </label>

        <label className="field">
          <span className="field-label">Notes</span>
          <textarea
            className="field-input field-textarea"
            name="notes"
            value={form.notes}
            onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
            placeholder="Anything useful to remember"
          />
        </label>

        <div className="form-actions">
          <button className="button button-primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : isEditing ? "Save changes" : "Save transaction"}
          </button>
          <span className="form-message">{message}</span>
        </div>
      </form>
    </section>
  );
}
