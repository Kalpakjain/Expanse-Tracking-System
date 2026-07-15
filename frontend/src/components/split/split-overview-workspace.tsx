"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { SplitExpenseWizard } from "@/components/split/split-expense-wizard";
import {
  getCurrentUser,
  getGroupBalances,
  listGroupExpenses,
  listGroups,
  listSettlements,
} from "@/lib/api";
import type { Group, GroupExpense, Settlement, User } from "@/lib/types";

type GroupSummary = {
  group: Group;
  netBalance: number;
};

type ActivityItem = {
  id: string;
  type: "expense" | "settlement";
  groupId: string;
  groupName: string;
  description: string;
  amount: number;
  date: string;
};

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

export function SplitOverviewWorkspace() {
  const [user, setUser] = useState<User | null>(null);
  const [groupSummaries, setGroupSummaries] = useState<GroupSummary[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [message, setMessage] = useState("Loading split summary...");
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  const loadSplitOverview = useCallback(async () => {
    try {
      const [currentUser, groups] = await Promise.all([getCurrentUser(), listGroups()]);
      const balanceResults = await Promise.all(
        groups.map(async (group) => {
          const balance = await getGroupBalances(group.id);
          const ownBalance = balance.balances.find((entry) => entry.user_id === currentUser.id)?.net_balance ?? 0;
          return { group, netBalance: ownBalance };
        }),
      );
      const activityResults = await Promise.all(
        groups.map(async (group) => {
          const [expenses, settlements] = await Promise.all([
            listGroupExpenses(group.id),
            listSettlements(group.id),
          ]);
          return [
            ...expenses.map((expense): ActivityItem => ({
              id: expense.id,
              type: "expense",
              groupId: group.id,
              groupName: group.name,
              description: `${expense.paid_by_name} paid for ${expense.description}`,
              amount: expense.amount,
              date: expense.created_at,
            })),
            ...settlements.map((settlement): ActivityItem => ({
              id: settlement.id,
              type: "settlement",
              groupId: group.id,
              groupName: group.name,
              description: `${settlement.from_user_name} paid ${settlement.to_user_name}`,
              amount: settlement.amount,
              date: settlement.settled_at,
            })),
          ];
        }),
      );

      setUser(currentUser);
      setGroupSummaries(balanceResults);
      setActivity(activityResults.flat().sort((first, second) => second.date.localeCompare(first.date)).slice(0, 8));
      setMessage("Split summary synced from the backend.");
    } catch {
      setMessage("Could not load split summary yet.");
    }
  }, []);

  useEffect(() => {
    void loadSplitOverview();
  }, [loadSplitOverview]);

  const totals = useMemo(
    () =>
      groupSummaries.reduce(
        (current, summary) => ({
          receive: current.receive + Math.max(summary.netBalance, 0),
          pay: current.pay + Math.max(-summary.netBalance, 0),
        }),
        { receive: 0, pay: 0 },
      ),
    [groupSummaries],
  );

  return (
    <main className="page-shell split-overview-page">
      <section className="page-header-compact">
        <div>
          <h1>Split</h1>
          <p>Shared expenses across all your groups</p>
        </div>
        <div className="page-header-actions">
          <button className="button button-primary split-action-button" type="button" onClick={() => setIsWizardOpen(true)}>
            Split expense
          </button>
          <Link className="button button-secondary split-action-button" href="/split/friends">Settle up</Link>
          <Link className="button button-primary split-action-button" href="/split/groups">+ Create group</Link>
        </div>
      </section>

      <div className="split-card">
        <div className="split-stat-grid">
          <div className="split-stat-positive">
            <div className="split-stat-label">You&apos;ll receive</div>
            <div className="split-stat-value">{formatRs(totals.receive)}</div>
          </div>
          <div className="split-stat-negative">
            <div className="split-stat-label">You&apos;ll pay</div>
            <div className="split-stat-value">{formatRs(totals.pay)}</div>
          </div>
        </div>
      </div>

      <section className="split-overview-grid">
        <div className="split-card">
          <h2>Your groups</h2>
          {groupSummaries.length ? (
            groupSummaries.map(({ group, netBalance }, index) => (
              <Link className="balance-row" href={`/split/groups/${group.id}`} key={group.id}>
                <div className="balance-row-name">
                  {renderAvatarStack(group.members)}
                  <span>
                    {group.name} • {group.members.length} members
                  </span>
                </div>
                <span className={netBalance >= 0 ? "balance-positive" : "balance-negative"}>
                  {balanceLabel(netBalance)}
                </span>
              </Link>
            ))
          ) : (
            <div className="empty-state">No split groups yet. Create one to start splitting expenses.</div>
          )}
        </div>

        <div className="split-card">
          <h2>Balances</h2>
          {groupSummaries.length ? (
            groupSummaries.map(({ group, netBalance }, index) => (
              <div className="balance-row" key={group.id}>
                <div className="balance-row-name">
                  {renderBalanceAvatar(group.name, index)}
                  <span>{group.name}</span>
                </div>
                <span className={netBalance >= 0 ? "balance-positive" : "balance-negative"}>
                  {balanceLabel(netBalance)}
                </span>
              </div>
            ))
          ) : (
            <div className="empty-state compact-empty">No balances yet.</div>
          )}
        </div>

        <div className="split-card">
          <h2>Recent activity</h2>
          {activity.length ? (
            activity.slice(0, 3).map((item, index) => (
              <div className="balance-row" key={`${item.type}-${item.id}`}>
                <div className="balance-row-name">
                  {renderBalanceAvatar(item.description, index)}
                  <span>
                    {item.description} • {item.groupName}
                  </span>
                </div>
                <span className={item.type === "settlement" ? "balance-positive" : "balance-negative"}>
                  {formatRs(item.amount)}
                </span>
              </div>
            ))
          ) : (
            <div className="empty-state compact-empty">No activity yet.</div>
          )}
          <p className="split-sync-note">{user ? `Signed in as ${user.full_name}. ` : ""}{message}</p>
        </div>
      </section>

      {isWizardOpen ? (
        <SplitExpenseWizard
          onClose={() => setIsWizardOpen(false)}
          onCreated={() => {
            void loadSplitOverview();
          }}
        />
      ) : null}
    </main>
  );
}
