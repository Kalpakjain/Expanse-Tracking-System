"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";

import {
  createGroupExpense,
  createSettlement,
  getGroup,
  getGroupBalances,
  listGroupExpenses,
  listSettlements,
} from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import type {
  CreateGroupExpenseInput,
  Group,
  GroupBalanceRead,
  GroupExpense,
  Settlement,
} from "@/lib/types";

type ExpenseFormState = {
  amount: string;
  description: string;
  expense_date: string;
  paid_by: string;
  split_type: "equal" | "percentage" | "custom";
  splits: Record<string, string>;
};

type SettlementFormState = {
  to_user_id: string;
  amount: string;
  note: string;
};

const today = new Date().toISOString().slice(0, 10);

const initialExpenseForm: ExpenseFormState = {
  amount: "",
  description: "",
  expense_date: today,
  paid_by: "",
  split_type: "equal",
  splits: {},
};

const initialSettlementForm: SettlementFormState = {
  to_user_id: "",
  amount: "",
  note: "",
};

function validateSplitTotal(form: ExpenseFormState, group: Group | null) {
  if (!group || form.split_type === "equal") {
    return "";
  }

  const total = group.members.reduce((sum, member) => sum + Number(form.splits[member.user_id] || 0), 0);
  if (form.split_type === "percentage" && Math.abs(total - 100) > 0.5) {
    return "Percentage splits must total 100.";
  }
  if (form.split_type === "custom" && Math.abs(total - Number(form.amount || 0)) > 0.01) {
    return "Custom splits must total the expense amount.";
  }
  return "";
}

export function SplitGroupDetailWorkspace({ groupId }: { groupId: string }) {
  const [group, setGroup] = useState<Group | null>(null);
  const [expenses, setExpenses] = useState<GroupExpense[]>([]);
  const [balances, setBalances] = useState<GroupBalanceRead>({ group_id: groupId, balances: [] });
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [expenseForm, setExpenseForm] = useState<ExpenseFormState>(initialExpenseForm);
  const [settlementForm, setSettlementForm] = useState<SettlementFormState>(initialSettlementForm);
  const [message, setMessage] = useState("Loading group...");
  const [isExpenseSubmitting, setIsExpenseSubmitting] = useState(false);
  const [isSettlementSubmitting, setIsSettlementSubmitting] = useState(false);

  const loadGroup = useCallback(async (successMessage?: string) => {
    try {
      const [nextGroup, nextExpenses, nextBalances, nextSettlements] = await Promise.all([
        getGroup(groupId),
        listGroupExpenses(groupId),
        getGroupBalances(groupId),
        listSettlements(groupId),
      ]);
      setGroup(nextGroup);
      setExpenses(nextExpenses);
      setBalances(nextBalances);
      setSettlements(nextSettlements);
      setMessage(successMessage ?? "Group synced from the backend.");
      setSettlementForm((current) => ({
        ...current,
        to_user_id: current.to_user_id || nextGroup.members[0]?.user_id || "",
      }));
      setExpenseForm((current) => ({
        ...current,
        paid_by: current.paid_by || nextGroup.members[0]?.user_id || "",
      }));
    } catch {
      setMessage("Could not load this group yet.");
    }
  }, [groupId]);

  useEffect(() => {
    void loadGroup();
  }, [loadGroup]);

  const splitValidationMessage = useMemo(() => validateSplitTotal(expenseForm, group), [expenseForm, group]);

  async function handleExpenseSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (splitValidationMessage) {
      setMessage(splitValidationMessage);
      return;
    }

    setIsExpenseSubmitting(true);
    setMessage("Saving group expense...");

    try {
      const payload: CreateGroupExpenseInput = {
        amount: Number(expenseForm.amount),
        description: expenseForm.description,
        category_id: null,
        expense_date: expenseForm.expense_date,
        split_type: expenseForm.split_type,
        splits:
          expenseForm.split_type === "equal" || !group
            ? null
            : group.members.map((member) => ({
                user_id: member.user_id,
                value: Number(expenseForm.splits[member.user_id] || 0),
              })),
      };
      await createGroupExpense(groupId, payload);
      setExpenseForm(initialExpenseForm);
      await loadGroup("Group expense saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save the group expense.");
    } finally {
      setIsExpenseSubmitting(false);
    }
  }

  async function handleSettlementSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSettlementSubmitting(true);
    setMessage("Recording settlement...");

    try {
      await createSettlement(groupId, {
        to_user_id: settlementForm.to_user_id,
        amount: Number(settlementForm.amount),
        note: settlementForm.note,
      });
      setSettlementForm({ ...initialSettlementForm, to_user_id: group?.members[0]?.user_id ?? "" });
      await loadGroup("Settlement recorded.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not record the settlement.");
    } finally {
      setIsSettlementSubmitting(false);
    }
  }

  return (
    <main className="page-shell">
      <section className="hero">
        <article className="hero-card">
          <span className="eyebrow">Split expenses</span>
          <h1>{group?.name ?? "Group workspace"}</h1>
          <p>Track shared spending, validate splits before submission, and record payments between members.</p>
          <div className="hero-actions">
            <Link className="button button-secondary" href="/split/groups">Back to groups</Link>
            <span className="button button-primary">{message}</span>
          </div>
        </article>

        <aside className="hero-side">
          <div className="hero-card side-card">
            <h2>Members</h2>
            <p>{group ? `${group.members.length} people in this group.` : "Loading members..."}</p>
          </div>
          <div className="hero-card side-card">
            <h2>Expenses</h2>
            <p>{expenses.length} shared expenses recorded.</p>
          </div>
        </aside>
      </section>

      <section className="panel grid">
        <div>
          <h2 className="section-title">Balances</h2>
          <p className="section-copy">Positive means the group owes this person. Negative means this person owes.</p>
        </div>
        <div className="analysis-card-grid">
          {balances.balances.map((balance) => (
            <article
              className={`mini-analysis-card ${
                balance.net_balance < 0 ? "budget-danger" : balance.net_balance > 0 ? "budget-healthy" : ""
              }`}
              key={balance.user_id}
            >
              <div className="item-title">{balance.full_name}</div>
              <div className={balance.net_balance < 0 ? "amount-expense" : "amount-income"}>
                {formatCurrency(balance.net_balance, "INR")}
              </div>
              <div className="stat-footnote">
                {balance.net_balance > 0
                  ? "Group owes them"
                  : balance.net_balance < 0
                    ? "They owe the group"
                    : "Settled"}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="grid content-grid">
        <article className="panel">
          <h2 className="section-title">Add expense</h2>
          <p className="section-copy">Use equal split for quick entries, or validate custom values before saving.</p>
          <form className="expense-form" onSubmit={handleExpenseSubmit}>
            <div className="field-row">
              <label className="field">
                <span className="field-label">Amount</span>
                <input
                  className="field-input"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={expenseForm.amount}
                  onChange={(event) => setExpenseForm((current) => ({ ...current, amount: event.target.value }))}
                  required
                />
              </label>
              <label className="field">
                <span className="field-label">Date</span>
                <input
                  className="field-input"
                  type="date"
                  value={expenseForm.expense_date}
                  onChange={(event) => setExpenseForm((current) => ({ ...current, expense_date: event.target.value }))}
                  required
                />
              </label>
            </div>

            <label className="field">
              <span className="field-label">Description</span>
              <input
                className="field-input"
                value={expenseForm.description}
                onChange={(event) => setExpenseForm((current) => ({ ...current, description: event.target.value }))}
                placeholder="Dinner, cab, groceries"
                required
              />
            </label>

            <label className="field">
              <span className="field-label">Paid by</span>
              <select
                className="field-input"
                value={expenseForm.paid_by}
                onChange={(event) => setExpenseForm((current) => ({ ...current, paid_by: event.target.value }))}
                required
              >
                {group?.members.map((member) => (
                  <option key={member.user_id} value={member.user_id}>
                    {member.full_name}
                  </option>
                ))}
              </select>
            </label>

            <div className="segmented-control" role="group" aria-label="Split type">
              {(["equal", "percentage", "custom"] as const).map((splitType) => (
                <button
                  className={expenseForm.split_type === splitType ? "segment-active" : ""}
                  type="button"
                  key={splitType}
                  onClick={() => setExpenseForm((current) => ({ ...current, split_type: splitType }))}
                >
                  {splitType}
                </button>
              ))}
            </div>

            {expenseForm.split_type !== "equal" && group ? (
              <div className="field-row">
                {group.members.map((member) => (
                  <label className="field" key={member.user_id}>
                    <span className="field-label">
                      {member.full_name} {expenseForm.split_type === "percentage" ? "(%)" : "(INR)"}
                    </span>
                    <input
                      className="field-input"
                      type="number"
                      min="0"
                      step="0.01"
                      value={expenseForm.splits[member.user_id] ?? ""}
                      onChange={(event) =>
                        setExpenseForm((current) => ({
                          ...current,
                          splits: { ...current.splits, [member.user_id]: event.target.value },
                        }))
                      }
                      required
                    />
                  </label>
                ))}
              </div>
            ) : null}

            <div className="form-actions">
              <button className="button button-primary" type="submit" disabled={isExpenseSubmitting}>
                {isExpenseSubmitting ? "Saving..." : "Add expense"}
              </button>
              <span className="form-message">{splitValidationMessage || message}</span>
            </div>
          </form>
        </article>

        <aside className="panel">
          <h2 className="section-title">Expense list</h2>
          <p className="section-copy">Every saved shared expense with resolved member splits.</p>
          <div className="list">
            {expenses.length ? (
              expenses.map((expense) => (
                <div className="list-item" key={expense.id}>
                  <div>
                    <div className="item-title">{expense.description}</div>
                    <div className="item-subtitle">
                      Paid by {expense.paid_by_name} • {expense.split_type} • {expense.expense_date}
                    </div>
                    <div className="item-subtitle">
                      {expense.splits.map((split) => `${split.full_name}: ${formatCurrency(split.amount_owed, "INR")}`).join(" • ")}
                    </div>
                  </div>
                  <div className="amount-expense">{formatCurrency(expense.amount, "INR")}</div>
                </div>
              ))
            ) : (
              <div className="empty-state">No group expenses yet.</div>
            )}
          </div>
        </aside>
      </section>

      <section className="grid content-grid">
        <article className="panel">
          <h2 className="section-title">Settle up</h2>
          <p className="section-copy">Record a payment you made to another member.</p>
          <form className="expense-form" onSubmit={handleSettlementSubmit}>
            <label className="field">
              <span className="field-label">I paid</span>
              <select
                className="field-input"
                value={settlementForm.to_user_id}
                onChange={(event) => setSettlementForm((current) => ({ ...current, to_user_id: event.target.value }))}
                required
              >
                {group?.members.map((member) => (
                  <option key={member.user_id} value={member.user_id}>
                    {member.full_name}
                  </option>
                ))}
              </select>
            </label>

            <div className="field-row">
              <label className="field">
                <span className="field-label">Amount</span>
                <input
                  className="field-input"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={settlementForm.amount}
                  onChange={(event) => setSettlementForm((current) => ({ ...current, amount: event.target.value }))}
                  required
                />
              </label>
              <label className="field">
                <span className="field-label">Note</span>
                <input
                  className="field-input"
                  value={settlementForm.note}
                  onChange={(event) => setSettlementForm((current) => ({ ...current, note: event.target.value }))}
                  placeholder="UPI, cash, bank transfer"
                />
              </label>
            </div>

            <div className="form-actions">
              <button className="button button-primary" type="submit" disabled={isSettlementSubmitting}>
                {isSettlementSubmitting ? "Saving..." : "Record settlement"}
              </button>
              <span className="form-message">{message}</span>
            </div>
          </form>
        </article>

        <aside className="panel">
          <h2 className="section-title">Settlements</h2>
          <p className="section-copy">Latest payments recorded inside this group.</p>
          <div className="list">
            {settlements.length ? (
              settlements.map((settlement) => (
                <div className="list-item" key={settlement.id}>
                  <div>
                    <div className="item-title">
                      {settlement.from_user_name} paid {settlement.to_user_name}
                    </div>
                    <div className="item-subtitle">
                      {settlement.note || "No note"} • {settlement.settled_at.slice(0, 10)}
                    </div>
                  </div>
                  <div className="amount-income">{formatCurrency(settlement.amount, "INR")}</div>
                </div>
              ))
            ) : (
              <div className="empty-state">No settlements recorded yet.</div>
            )}
          </div>
        </aside>
      </section>
    </main>
  );
}
