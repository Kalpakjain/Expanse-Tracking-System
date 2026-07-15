"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { createGroupExpense, getCurrentUser, getGroup, listGroups } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import {
  buildSplitPreview,
  getSplitInputTotal,
  validateSplitTotal,
  type SplitType,
} from "@/lib/split-utils";
import type { Group, User } from "@/lib/types";

type WizardStep = 1 | 2 | 3;

type SplitExpenseWizardProps = {
  initialGroupId?: string;
  onClose: () => void;
  onCreated: () => void;
};

const today = new Date().toISOString().slice(0, 10);
const splitTypes: SplitType[] = ["equal", "percentage", "custom"];
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

function avatarStyle(index: number) {
  return {
    background: avatarColors[index % 4],
    color: index % 4 === 3 ? "#211f1b" : "#fbf6ec",
  };
}

function renderAvatarStack(members: Group["members"]) {
  const visibleMembers = members.length > 4 ? members.slice(0, 3) : members.slice(0, 4);
  const hiddenCount = members.length - visibleMembers.length;

  return (
    <div className="avatar-stack">
      {visibleMembers.map((member, index) => (
        <div key={member.user_id} className="avatar-circle" style={avatarStyle(index)}>
          {memberInitials(member.full_name) || "M"}
        </div>
      ))}
      {hiddenCount > 0 ? (
        <div className="avatar-circle" style={avatarStyle(3)}>
          +{hiddenCount}
        </div>
      ) : null}
    </div>
  );
}

function renderAvatar(name: string, index: number) {
  return (
    <span className="avatar-circle avatar-circle-sm" style={avatarStyle(index)}>
      {memberInitials(name) || "M"}
    </span>
  );
}

export function SplitExpenseWizard({ initialGroupId, onClose, onCreated }: SplitExpenseWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>(initialGroupId ? 2 : 1);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState(initialGroupId ?? "");
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [expenseDate, setExpenseDate] = useState(today);
  const [splitType, setSplitType] = useState<SplitType>("equal");
  const [splits, setSplits] = useState<Record<string, string>>({});
  const [paidBy, setPaidBy] = useState("");
  const [message, setMessage] = useState("Choose a group to split this expense.");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadWizardData = useCallback(async () => {
    try {
      const [user, nextGroups] = await Promise.all([getCurrentUser(), listGroups()]);
      setCurrentUser(user);
      setGroups(nextGroups);

      const matchingGroup = initialGroupId ? await getGroup(initialGroupId) : null;
      const nextSelected = matchingGroup ?? nextGroups.find((group) => group.id === selectedGroupId) ?? null;
      if (nextSelected) {
        setSelectedGroup(nextSelected);
        setSelectedGroupId(nextSelected.id);
      }
      setMessage(initialGroupId ? "Enter the expense details." : "Choose a group to split this expense.");
    } catch {
      setMessage("Could not load split groups yet.");
    }
  }, [initialGroupId, selectedGroupId]);

  useEffect(() => {
    void loadWizardData();
  }, [loadWizardData]);

  useEffect(() => {
    if (!selectedGroup) {
      return;
    }
    const userInGroup = selectedGroup.members.find((member) => member.user_id === currentUser?.id);
    setPaidBy((current) => current || userInGroup?.user_id || selectedGroup.members[0]?.user_id || "");
  }, [currentUser, selectedGroup]);

  const members = selectedGroup?.members ?? [];
  const splitForm = { amount, split_type: splitType, splits };
  const splitValidationMessage = validateSplitTotal(splitForm, members);
  const inputTotal = getSplitInputTotal(splitForm, members);
  const preview = useMemo(
    () => buildSplitPreview(Number(amount || 0), members, splitType, splits, paidBy),
    [amount, members, paidBy, splitType, splits],
  );
  const canReview = Boolean(selectedGroup && amount && description.trim() && expenseDate && paidBy && !splitValidationMessage);

  function selectGroup(group: Group) {
    setSelectedGroup(group);
    setSelectedGroupId(group.id);
    setCurrentStep(2);
    setMessage("Enter the expense details.");
  }

  async function handleSubmit() {
    if (!selectedGroup || splitValidationMessage) {
      return;
    }
    setIsSubmitting(true);
    setMessage("Saving split expense...");

    try {
      await createGroupExpense(selectedGroup.id, {
        paid_by: paidBy || null,
        amount: Number(amount),
        description,
        category_id: null,
        expense_date: expenseDate,
        split_type: splitType,
        splits:
          splitType === "equal"
            ? null
            : members.map((member) => ({
                user_id: member.user_id,
                value: Number(splits[member.user_id] || 0),
              })),
      });
      onCreated();
      onClose();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save the split expense.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="modal-backdrop split-wizard-backdrop" role="dialog" aria-modal="true">
      <section className="modal-panel split-wizard-panel">
        <div className="split-wizard-header">
          <div>
            <h2>Split expense</h2>
            <p>{message}</p>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close split expense wizard">
            <span className="material-symbols-outlined" aria-hidden="true">close</span>
          </button>
        </div>

        <div className="split-stepper" aria-label="Split expense steps">
          {[
            { step: 1, label: "Group" },
            { step: 2, label: "Split" },
            { step: 3, label: "Confirm" },
          ].map((item, index, steps) => {
            const isActive = currentStep >= item.step;
            return (
              <div className="step-fragment" key={item.step}>
                <div className={isActive ? "step-badge step-badge-active" : "step-badge"}>
                  {currentStep > item.step ? "✓" : item.step}
                </div>
                <span className={isActive ? "step-label-active" : "step-label"}>{item.label}</span>
                {index < steps.length - 1 ? <div className="step-connector" /> : null}
              </div>
            );
          })}
        </div>

        {currentStep === 1 ? (
          <div className="split-wizard-body">
            <div className="split-card-list">
              {groups.length ? (
                groups.map((group) => (
                  <button className="split-select-card" type="button" key={group.id} onClick={() => selectGroup(group)}>
                    {renderAvatarStack(group.members)}
                    <div>
                      <span className="group-card-name">{group.name}</span>
                      <span className="group-card-meta"> - {group.members.length} members</span>
                    </div>
                  </button>
                ))
              ) : (
                <div className="empty-state">No groups yet. Create one before adding split expenses.</div>
              )}
            </div>
          </div>
        ) : null}

        {currentStep === 2 && selectedGroup ? (
          <div className="split-wizard-body">
            <div className="field-row">
              <label className="field">
                <span className="field-label">Amount</span>
                <input
                  className="field-input"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  required
                />
              </label>
              <label className="field">
                <span className="field-label">Date</span>
                <input
                  className="field-input"
                  type="date"
                  value={expenseDate}
                  onChange={(event) => setExpenseDate(event.target.value)}
                  required
                />
              </label>
            </div>

            <label className="field">
              <span className="field-label">Description</span>
              <input
                className="field-input"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Dinner, cab, groceries"
                required
              />
            </label>

            <label className="field">
              <span className="field-label">Paid by</span>
              <select className="field-input" value={paidBy} onChange={(event) => setPaidBy(event.target.value)} required>
                {members.map((member) => (
                  <option key={member.user_id} value={member.user_id}>
                    {member.full_name}
                  </option>
                ))}
              </select>
            </label>

            <div className="segmented-control" role="group" aria-label="Split type">
              {splitTypes.map((type) => (
                <button
                  className={splitType === type ? "segment-active" : ""}
                  type="button"
                  key={type}
                  onClick={() => setSplitType(type)}
                >
                  {type}
                </button>
              ))}
            </div>

            {splitType !== "equal" ? (
              <div className="field-row">
                {members.map((member) => (
                  <label className="field" key={member.user_id}>
                    <span className="field-label">
                      {member.full_name} {splitType === "percentage" ? "(%)" : "(INR)"}
                    </span>
                    <input
                      className="field-input"
                      type="number"
                      min="0"
                      step="0.01"
                      value={splits[member.user_id] ?? ""}
                      onChange={(event) =>
                        setSplits((current) => ({ ...current, [member.user_id]: event.target.value }))
                      }
                      required
                    />
                  </label>
                ))}
              </div>
            ) : null}

            <div className="split-preview-card">
              <div className="panel-header">
                <div>
                  <h3 className="section-title">Live split preview</h3>
                  <p className="section-copy">
                    {splitType === "equal"
                      ? "Auto-split with paise assigned to payer."
                      : `${splitType === "percentage" ? "Percent" : "Amount"} total: ${inputTotal.toFixed(2)}`}
                  </p>
                </div>
                <span className={splitValidationMessage ? "amount-expense" : "amount-income"}>
                  {splitValidationMessage || "Valid split"}
                </span>
              </div>
              <div className="list">
                {preview.map((item, index) => (
                  <div className="list-item compact-list-item" key={item.user_id}>
                    <div className="split-person-row">
                      {renderAvatar(item.full_name, index)}
                      <div className="item-title">{item.full_name}</div>
                    </div>
                    <div className="amount-expense">{formatCurrency(item.amount_owed, "INR")}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {currentStep === 3 && selectedGroup ? (
          <div className="split-wizard-body">
            <div className="split-confirm-card">
              <div>
                <span className="stat-label">Group</span>
                <strong>{selectedGroup.name}</strong>
              </div>
              <div>
                <span className="stat-label">Amount</span>
                <strong>{formatCurrency(Number(amount || 0), "INR")}</strong>
              </div>
              <div>
                <span className="stat-label">Date</span>
                <strong>{expenseDate}</strong>
              </div>
              <div>
                <span className="stat-label">Description</span>
                <strong>{description}</strong>
              </div>
            </div>

            <div className="list">
              {preview.map((item, index) => {
                const payerReturn = item.user_id === paidBy ? Number(amount || 0) - item.amount_owed : 0;
                const label = item.user_id === paidBy ? `You'll get ${formatRs(payerReturn)}` : `You'll pay ${formatRs(item.amount_owed)}`;
                return (
                  <div className="list-item" key={item.user_id}>
                    <div className="split-person-row">
                      {renderAvatar(item.full_name, index)}
                      <div>
                        <div className="item-title">{item.full_name}</div>
                        <div className="item-subtitle">{item.user_id === paidBy ? "Paid this expense" : "Owes their share"}</div>
                      </div>
                    </div>
                    <div className={item.user_id === paidBy ? "amount-income" : "amount-expense"}>{label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        <div className="split-wizard-footer">
          <button
            className="button button-secondary"
            type="button"
            onClick={() => setCurrentStep((current) => (current === 3 ? 2 : 1))}
            disabled={currentStep === 1 || Boolean(initialGroupId && currentStep === 2)}
          >
            Back
          </button>
          {currentStep === 2 ? (
            <button className="button button-primary" type="button" disabled={!canReview} onClick={() => setCurrentStep(3)}>
              Review split
            </button>
          ) : null}
          {currentStep === 3 ? (
            <button className="button button-primary" type="button" disabled={isSubmitting} onClick={handleSubmit}>
              {isSubmitting ? "Adding..." : "Add expense"}
            </button>
          ) : null}
        </div>
      </section>
    </div>
  );
}
