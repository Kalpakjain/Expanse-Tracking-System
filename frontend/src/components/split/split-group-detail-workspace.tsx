"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";

import { SplitExpenseWizard } from "@/components/split/split-expense-wizard";
import {
  createSettlement,
  getGroup,
  getGroupBalances,
  listGroupExpenses,
  listSettlements,
} from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import type {
  Group,
  GroupBalanceRead,
  GroupExpense,
  Settlement,
} from "@/lib/types";

type SettlementFormState = {
  to_user_id: string;
  amount: string;
  note: string;
};

const initialSettlementForm: SettlementFormState = {
  to_user_id: "",
  amount: "",
  note: "",
};

const avatarColors = ["#b0305c", "#1f2a44", "#a8823c", "#dfd5c7"];

function formatRs(amount: number) {
  return `Rs ${Math.abs(amount).toFixed(2)}`;
}

function memberInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function renderAvatarStack(members: Group["members"]) {
  const visibleMembers = members.length > 4 ? members.slice(0, 3) : members.slice(0, 4);
  const hiddenCount = members.length - visibleMembers.length;

  return (
    <div className="avatar-stack">
      {visibleMembers.map((member, index) => (
        <div
          key={member.user_id}
          className="avatar-circle"
          style={{
            background: avatarColors[index % 4],
            color: index % 4 === 3 ? "#211f1b" : "#fbf6ec",
          }}
        >
          {memberInitials(member.full_name) || "M"}
        </div>
      ))}
      {hiddenCount > 0 ? (
        <div
          className="avatar-circle"
          style={{
            background: avatarColors[3],
            color: "#211f1b",
          }}
        >
          +{hiddenCount}
        </div>
      ) : null}
    </div>
  );
}

function renderBalanceAvatar(name: string, index: number) {
  return (
    <div
      className="avatar-circle avatar-circle-sm"
      style={{
        background: avatarColors[index % 4],
        color: index % 4 === 3 ? "#211f1b" : "#fbf6ec",
      }}
    >
      {memberInitials(name) || "M"}
    </div>
  );
}

export function SplitGroupDetailWorkspace({ groupId }: { groupId: string }) {
  const [group, setGroup] = useState<Group | null>(null);
  const [expenses, setExpenses] = useState<GroupExpense[]>([]);
  const [balances, setBalances] = useState<GroupBalanceRead>({ group_id: groupId, balances: [] });
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [settlementForm, setSettlementForm] = useState<SettlementFormState>(initialSettlementForm);
  const [message, setMessage] = useState("Loading group...");
  const [isSettlementSubmitting, setIsSettlementSubmitting] = useState(false);
  const [isExpenseWizardOpen, setIsExpenseWizardOpen] = useState(false);

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
    } catch {
      setMessage("Could not load this group yet.");
    }
  }, [groupId]);

  useEffect(() => {
    void loadGroup();
  }, [loadGroup]);

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
      <section className="page-header-compact">
        <div>
          <h1>{group?.name ?? "Group workspace"}</h1>
          <p>{group ? `${group.members.length} members, ${expenses.length} expenses` : "Loading group"}</p>
          {group ? renderAvatarStack(group.members) : null}
        </div>
        <div className="page-header-actions">
          <Link className="button button-secondary" href="/split/groups">Back to groups</Link>
          <button className="button button-primary" type="button" onClick={() => setIsExpenseWizardOpen(true)}>
            Add expense
          </button>
          <span className="button button-primary">{message}</span>
        </div>
      </section>

      <div className="split-card">
        <div>
          <h2 className="section-title">Balances</h2>
          <p className="section-copy">Positive means the group owes this person. Negative means this person owes.</p>
        </div>
        <div>
          {balances.balances.map((balance, index) => (
            <div className="balance-row" key={balance.user_id}>
              <div className="balance-row-name">
                {renderBalanceAvatar(balance.full_name, index)}
                <span>{balance.full_name}</span>
              </div>
              <span className={balance.net_balance >= 0 ? "balance-positive" : "balance-negative"}>
                {balance.net_balance >= 0
                  ? `You'll get ${formatRs(balance.net_balance)}`
                  : `You'll pay ${formatRs(balance.net_balance)}`}
              </span>
            </div>
          ))}
        </div>
      </div>

      <section className="grid content-grid">
        <article className="panel">
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
        </article>
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

      {isExpenseWizardOpen ? (
        <SplitExpenseWizard
          initialGroupId={groupId}
          onClose={() => setIsExpenseWizardOpen(false)}
          onCreated={() => {
            void loadGroup("Group expense saved.");
          }}
        />
      ) : null}
    </main>
  );
}
