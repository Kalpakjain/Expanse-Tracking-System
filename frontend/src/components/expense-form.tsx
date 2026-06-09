"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";

import { createTransaction } from "@/lib/api";
import type { Category, CreateTransactionInput } from "@/lib/types";

type ExpenseFormProps = {
  categories: Category[];
  onCreated: () => Promise<void>;
};

type ExpenseFormState = {
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
  account_name: "Primary Wallet",
  category_id: "",
  amount: "",
  merchant_name: "",
  description: "",
  transaction_date: new Date().toISOString().slice(0, 10),
  payment_method: "UPI",
  notes: "",
};

export function ExpenseForm({ categories, onCreated }: ExpenseFormProps) {
  const [form, setForm] = useState<ExpenseFormState>(initialState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("Add your first real expense to move beyond the starter seed.");
  const expenseCategories = categories.filter((category) => category.type === "expense");

  useEffect(() => {
    if (!form.category_id && expenseCategories.length > 0) {
      setForm((current) => ({
        ...current,
        category_id: expenseCategories[0].id,
      }));
    }
  }, [expenseCategories, form.category_id]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.category_id) {
      setMessage("Please select a category first.");
      return;
    }

    setIsSubmitting(true);
    setMessage("Saving expense...");

    try {
      const payload: CreateTransactionInput = {
        account_name: form.account_name,
        category_id: form.category_id,
        type: "expense",
        amount: Number(form.amount),
        currency_code: "INR",
        merchant_name: form.merchant_name,
        description: form.description,
        transaction_date: form.transaction_date,
        payment_method: form.payment_method,
        notes: form.notes,
      };

      await createTransaction(payload);
      setForm({
        ...initialState,
        category_id: expenseCategories[0]?.id ?? "",
      });
      await onCreated();
      setMessage("Expense saved to the database.");
    } catch {
      setMessage("Could not save the expense yet. Check that the backend is running.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="panel">
      <h2 className="section-title">Add expense</h2>
      <p className="section-copy">
        This is the first real MVP flow: enter an expense, store it in the database, and refresh
        the dashboard immediately.
      </p>

      <form className="expense-form" onSubmit={handleSubmit}>
        <label className="field">
          <span className="field-label">Merchant</span>
          <input
            className="field-input"
            name="merchant_name"
            value={form.merchant_name}
            onChange={(event) =>
              setForm((current) => ({ ...current, merchant_name: event.target.value }))
            }
            placeholder="Groceries, Uber, Rent"
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
            <span className="field-label">Category</span>
            <select
              className="field-input"
              name="category_id"
              value={form.category_id}
              onChange={(event) =>
                setForm((current) => ({ ...current, category_id: event.target.value }))
              }
              required
            >
              {expenseCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
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

        <label className="field">
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
            {isSubmitting ? "Saving..." : "Save expense"}
          </button>
          <span className="form-message">{message}</span>
        </div>
      </form>
    </section>
  );
}
