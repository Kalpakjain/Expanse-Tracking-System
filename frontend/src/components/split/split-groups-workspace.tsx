"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";

import { createGroup, listGroups } from "@/lib/api";
import type { Group } from "@/lib/types";

type GroupFormState = {
  name: string;
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

export function SplitGroupsWorkspace() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [form, setForm] = useState<GroupFormState>(initialState);
  const [memberInput, setMemberInput] = useState("");
  const [members, setMembers] = useState<string[]>([]);
  const [message, setMessage] = useState("Loading your groups...");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadGroups = useCallback(async (successMessage?: string) => {
    try {
      const nextGroups = await listGroups();
      setGroups(nextGroups);
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
    groups.forEach((group) => {
      group.members.forEach((member) => {
        const name = member.full_name.trim();
        if (name) {
          uniqueNames.set(name.toLowerCase(), name);
        }
      });
    });
    return Array.from(uniqueNames.values()).sort((first, second) => first.localeCompare(second));
  }, [groups]);

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
      <section className="hero">
        <article className="hero-card">
          <span className="eyebrow">Groups</span>
          <h1>Split shared expenses without losing track.</h1>
          <p>
            Create a group, add members by name, record shared spending, and review who owes whom
            without waiting for every person to create an account.
          </p>
          <div className="hero-actions">
            <span className="button button-primary">Split expenses</span>
            <span className="button button-secondary">{message}</span>
          </div>
        </article>

        <aside className="hero-side">
          <div className="hero-card side-card">
            <h2>Equal, percentage, custom</h2>
            <p>Choose the split style per expense and validate totals before submitting.</p>
          </div>
          <div className="hero-card side-card">
            <h2>Settle up</h2>
            <p>Record payments between members and keep balances readable.</p>
          </div>
        </aside>
      </section>

      <section className="grid content-grid">
        <section className="panel">
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
        </section>

        <aside className="panel">
          <h2 className="section-title">Your groups</h2>
          <p className="section-copy">Open a group to add expenses, settle up, and review balances.</p>
          <div className="list">
            {groups.length ? (
              groups.map((group) => (
                <Link className="list-item" href={`/split/groups/${group.id}`} key={group.id}>
                  <div>
                    <div className="item-title">{group.name}</div>
                    <div className="item-subtitle">
                      {group.members.length} members • Created {group.created_at.slice(0, 10)}
                    </div>
                  </div>
                  <span className="button button-secondary compact-button">Open</span>
                </Link>
              ))
            ) : (
              <div className="empty-state">No groups yet. Create one to start splitting expenses.</div>
            )}
          </div>
        </aside>
      </section>
    </main>
  );
}
