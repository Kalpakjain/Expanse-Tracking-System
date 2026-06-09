"use client";

import { useState } from "react";
import type { FormEvent } from "react";

import { createCategory } from "@/lib/api";
import type { CreateCategoryInput } from "@/lib/types";

type CategoryFormProps = {
  onCreated: () => Promise<void>;
};

const initialState: CreateCategoryInput = {
  name: "",
  type: "expense",
  color: "#0F766E",
  icon: "wallet",
};

export function CategoryForm({ onCreated }: CategoryFormProps) {
  const [form, setForm] = useState<CreateCategoryInput>(initialState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("Create custom categories for your own spending style.");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("Creating category...");

    try {
      await createCategory(form);
      setForm(initialState);
      await onCreated();
      setMessage("Category created.");
    } catch {
      setMessage("Could not create category. It may already exist.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="panel">
      <h2 className="section-title">Create category</h2>
      <p className="section-copy">
        Add your own spending buckets now, then reuse them while recording expenses.
      </p>

      <form className="expense-form" onSubmit={handleSubmit}>
        <div className="field-row">
          <label className="field">
            <span className="field-label">Name</span>
            <input
              className="field-input"
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              placeholder="Dining, Fitness, Freelance"
              required
            />
          </label>

          <label className="field">
            <span className="field-label">Type</span>
            <select
              className="field-input"
              value={form.type}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  type: event.target.value as CreateCategoryInput["type"],
                }))
              }
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </label>
        </div>

        <div className="field-row">
          <label className="field">
            <span className="field-label">Color</span>
            <input
              className="field-input"
              type="color"
              value={form.color}
              onChange={(event) => setForm((current) => ({ ...current, color: event.target.value }))}
            />
          </label>

          <label className="field">
            <span className="field-label">Icon label</span>
            <input
              className="field-input"
              value={form.icon}
              onChange={(event) => setForm((current) => ({ ...current, icon: event.target.value }))}
              placeholder="wallet"
              required
            />
          </label>
        </div>

        <div className="form-actions">
          <button className="button button-primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Add category"}
          </button>
          <span className="form-message">{message}</span>
        </div>
      </form>
    </section>
  );
}
