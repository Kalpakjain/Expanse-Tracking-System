"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";

import { SplitExpenseWizard } from "@/components/split/split-expense-wizard";
import { createGroup, getCurrentUser, getGroupBalances, listGroups } from "@/lib/api";
import type { Group } from "@/lib/types";

type GroupFormState = {
  name: string;
};

type GroupSummary = {
  group: Group;
  netBalance: number;
};

const initialState: GroupFormState = {
  name: "",
};

function memberInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function formatRs(amount: number) {
  return `Rs ${Math.abs(amount).toFixed(2)}`;
}

function balanceLabel(amount: number) {
  if (amount > 0) {
    return `You'll get ${formatRs(amount)}`;
  }
  if (amount < 0) {
    return `You'll pay ${formatRs(amount)}`;
  }
  return "Settled";
}

const avatarColors = ["#b0305c", "#1f2a44", "#a8823c", "#dfd5c7"];

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

export function SplitGroupsWorkspace() {
  const router = useRouter();
  const createPanelRef = useRef<HTMLDivElement | null>(null);
  const [groupSummaries, setGroupSummaries] = useState<GroupSummary[]>([]);
  const [form, setForm] = useState<GroupFormState>(initialState);
  const [memberInput, setMemberInput] = useState("");
  const [members, setMembers] = useState<string[]>([]);
  const [message, setMessage] = useState("Loading your groups...");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  const loadGroups = useCallback(async (successMessage?: string) => {
    try {
      const [currentUser, nextGroups] = await Promise.all([getCurrentUser(), listGroups()]);
      const nextSummaries = await Promise.all(
        nextGroups.map(async (group) => {
          const balances = await getGroupBalances(group.id);
          return {
            group,
            netBalance: balances.balances.find((balance) => balance.user_id === currentUser.id)?.net_balance ?? 0,
          };
        }),
      );
      setGroupSummaries(nextSummaries);
      setMessage(successMessage ?? "Groups synced from the backend.");
    } catch {
      setMessage("Could not load groups yet. Check that the backend is running.");
    }
  }, []);

  useEffect(() => {
    void loadGroups();
  }, [loadGroups]);

  const suggestedMembers = useMemo(() => {
    const uniqueNames = new Map<string, string>();
    groupSummaries.forEach(({ group }) => {
      group.members.forEach((member) => {
        const name = member.full_name.trim();
        if (name) {
          uniqueNames.set(name.toLowerCase(), name);
        }
      });
    });
    return Array.from(uniqueNames.values()).sort((first, second) => first.localeCompare(second));
  }, [groupSummaries]);

  const filteredSuggestions = useMemo(() => {
    const query = memberInput.trim().toLowerCase();
    return suggestedMembers
      .filter((name) => !members.some((member) => member.toLowerCase() === name.toLowerCase()))
      .filter((name) => !query || name.toLowerCase().includes(query))
      .slice(0, 5);
  }, [memberInput, members, suggestedMembers]);

  function addMember(name: string) {
    const nextName = name.trim();
    if (!nextName) {
      return;
    }
    setMembers((current) =>
      current.some((member) => member.toLowerCase() === nextName.toLowerCase()) ? current : [...current, nextName],
    );
    setMemberInput("");
  }

  function removeMember(name: string) {
    setMembers((current) => current.filter((member) => member !== name));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("Creating group...");

    try {
      await createGroup({
        name: form.name,
        member_names: members,
      });
      setForm(initialState);
      setMemberInput("");
      setMembers([]);
      await loadGroups("Group created with your member list.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not create the group.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="page-shell">
      <section className="page-header-compact">
        <div>
          <h1>Groups</h1>
          <p>Create and manage split groups</p>
        </div>
        <div className="page-header-actions">
          <button className="button button-primary" type="button" onClick={() => setIsWizardOpen(true)}>
            Split expense
          </button>
          <button
            className="button button-secondary"
            type="button"
            onClick={() => createPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
          >
            Create group
          </button>
          <span className="button button-secondary">{message}</span>
        </div>
      </section>

      <div className="split-card" ref={createPanelRef}>
          <div className="form-heading-row">
            <div>
              <h2 className="section-title">Create group</h2>
              <p className="section-copy">
                Add members one by one. Pick a suggested name or create a new member for this group.
              </p>
            </div>
          </div>

          <form className="expense-form" onSubmit={handleSubmit}>
            <label className="field">
              <span className="field-label">Group name</span>
              <input
                className="field-input"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Goa trip, Flatmates, Office lunch"
                required
              />
            </label>

            <label className="field">
              <span className="field-label">Add member</span>
              <input
                className="field-input"
                value={memberInput}
                onChange={(event) => setMemberInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addMember(memberInput);
                  }
                }}
                placeholder="Type a member name"
              />
            </label>

            <div className="member-picker-card">
              <div className="member-picker-header">
                <div>
                  <h3>Members ({members.length})</h3>
                  <p>These names will be saved inside the group.</p>
                </div>
              </div>

              <div className="member-list">
                {members.length ? (
                  members.map((member, index) => (
                    <div className="member-row" key={member}>
                      <div className="member-avatar">{memberInitials(member) || "M"}</div>
                      <div className="member-meta">
                        <span>{member}</span>
                        <small>{index === 0 ? "Member" : "Group member"}</small>
                      </div>
                      <button className="member-remove" type="button" onClick={() => removeMember(member)}>
                        Remove
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="empty-state compact-empty">No members added yet.</div>
                )}
              </div>

              <div className="member-suggestion-list">
                {filteredSuggestions.map((suggestion) => (
                  <button className="member-suggestion" type="button" key={suggestion} onClick={() => addMember(suggestion)}>
                    <span className="member-avatar subtle-avatar">{memberInitials(suggestion) || "M"}</span>
                    <span>{suggestion}</span>
                  </button>
                ))}
                <button
                  className="button button-primary member-add-button"
                  type="button"
                  onClick={() => addMember(memberInput)}
                  disabled={!memberInput.trim()}
                >
                  Add {memberInput.trim() ? `"${memberInput.trim()}"` : "new member"}
                </button>
              </div>
            </div>

            <div className="form-actions">
              <button className="button button-primary" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create group"}
              </button>
              <span className="form-message">{message}</span>
            </div>
          </form>
      </div>

      <div className="split-card">
          <h2 className="section-title">Your groups</h2>
          <p className="section-copy">Open a group to add expenses, settle up, and review balances.</p>
          <div className="split-groups-grid">
            {groupSummaries.length ? (
              groupSummaries.map(({ group, netBalance }, index) => (
                <div
                  className="group-card"
                  key={group.id}
                  onClick={() => router.push(`/split/groups/${group.id}`)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      router.push(`/split/groups/${group.id}`);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <div className="balance-row-name">
                    <div
                      className="group-icon-tile"
                      style={{
                        background: index % 2 === 0 ? "var(--primary)" : "var(--accent)",
                      }}
                    >
                      {index % 2 === 0 ? "G" : "S"}
                    </div>
                    <div>
                      <div className="item-title">{group.name}</div>
                      <div className="item-subtitle">{group.members.length} members</div>
                      {renderAvatarStack(group.members)}
                    </div>
                  </div>
                  <span className={netBalance >= 0 ? "balance-positive" : "balance-negative"}>
                    {balanceLabel(netBalance)}
                  </span>
                </div>
              ))
            ) : (
              <div className="empty-state">No groups yet. Create one to start splitting expenses.</div>
            )}
          </div>
      </div>

      {isWizardOpen ? (
        <SplitExpenseWizard
          onClose={() => setIsWizardOpen(false)}
          onCreated={() => {
            void loadGroups("Split expense saved.");
          }}
        />
      ) : null}
    </main>
  );
}
