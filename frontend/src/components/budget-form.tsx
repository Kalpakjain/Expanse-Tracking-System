"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";

import { createBudget } from "@/lib/api";
import type { Category, CreateBudgetInput } from "@/lib/types";

type BudgetFormProps = {
  categories: Category[];
  onCreated: () => Promise<void>;
};

type BudgetFormState = {
  category_id: string;
  month: string;
  year: string;
  limit_amount: string;
  alert_threshold_percent: string;
};

const today = new Date();

const initialState: BudgetFormState = {
  category_id: "",
  month: String(today.getMonth() + 1),
  year: String(today.getFullYear()),
  limit_amount: "",
  alert_threshold_percent: "80",
};

export function BudgetForm({ categories, onCreated }: BudgetFormProps) {
  const [form, setForm] = useState<BudgetFormState>(initialState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("Create monthly category budgets in Indian rupees.");
  const expenseCategories = categories.filter((category) => category.type === "expense");

  useEffect(() => {
    if (!form.category_id && expenseCategories.length > 0) {
      setForm((current) => ({ ...current, category_id: expenseCategories[0].id }));
    }
  }, [expenseCategories, form.category_id]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.category_id) {
      setMessage("Select a category before saving a budget.");
      return;
    }

    setIsSubmitting(true);
    setMessage("Saving budget...");

    try {
      const payload: CreateBudgetInput = {
        category_id: form.category_id,
        month: Number(form.month),
        year: Number(form.year),
        limit_amount: Number(form.limit_amount),
        currency_code: "INR",
        alert_threshold_percent: Number(form.alert_threshold_percent),
      };

      await createBudget(payload);
      setForm({
        ...initialState,
        category_id: expenseCategories[0]?.id ?? "",
      });
      await onCreated();
      setMessage("Budget saved in rupees.");
    } catch {
      setMessage("Could not create the budget. It may already exist for that month.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="panel">
      <h2 className="section-title">Create budget</h2>
      <p className="section-copy">
        Set a monthly rupee limit for each expense category so reports and alerts become
        decision-ready.
      </p>

      <form className="expense-form" onSubmit={handleSubmit}>
        <label className="field">
          <span className="field-label">Category</span>
          <select
            className="field-input"
            value={form.category_id}
            onChange={(event) => setForm((current) => ({ ...current, category_id: event.target.value }))}
            required
          >
            {expenseCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>

        <div className="field-row">
          <label className="field">
            <span className="field-label">Month</span>
            <input
              className="field-input"
              type="number"
              min="1"
              max="12"
              value={form.month}
              onChange={(event) => setForm((current) => ({ ...current, month: event.target.value }))}
              required
            />
          </label>

          <label className="field">
            <span className="field-label">Year</span>
            <input
              className="field-input"
              type="number"
              min="2025"
              max="2100"
              value={form.year}
              onChange={(event) => setForm((current) => ({ ...current, year: event.target.value }))}
              required
            />
          </label>
        </div>

        <div className="field-row">
          <label className="field">
            <span className="field-label">Monthly limit (INR)</span>
            <input
              className="field-input"
              type="number"
              min="1"
              step="1"
              value={form.limit_amount}
              onChange={(event) =>
                setForm((current) => ({ ...current, limit_amount: event.target.value }))
              }
              placeholder="5000"
              required
            />
          </label>

          <label className="field">
            <span className="field-label">Alert threshold (%)</span>
            <input
              className="field-input"
              type="number"
              min="1"
              max="100"
              value={form.alert_threshold_percent}
              onChange={(event) =>
                setForm((current) => ({ ...current, alert_threshold_percent: event.target.value }))
              }
              required
            />
          </label>
        </div>

        <div className="form-actions">
          <button className="button button-primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Add budget"}
          </button>
          <span className="form-message">{message}</span>
        </div>
      </form>
    </section>
  );
}
