"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

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

function groupIcon(index: number) {
  return index % 2 === 0 ? "map" : "home";
}

export function SplitOverviewWorkspace() {
  const [user, setUser] = useState<User | null>(null);
  const [groupSummaries, setGroupSummaries] = useState<GroupSummary[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [message, setMessage] = useState("Loading split summary...");

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
      <section className="split-overview-header">
        <div>
          <h1>Split</h1>
          <p>Shared expenses across all your groups</p>
        </div>
        <div className="split-overview-actions">
          <Link className="button button-secondary split-action-button" href="/split/friends">Settle up</Link>
          <Link className="button button-primary split-action-button" href="/split/groups">+ Create group</Link>
        </div>
      </section>

      <section className="split-balance-grid">
        <article className="split-balance-card split-receive-card">
          <span>You&apos;ll receive</span>
          <strong>{formatRs(totals.receive)}</strong>
        </article>
        <article className="split-balance-card split-pay-card">
          <span>You&apos;ll pay</span>
          <strong>{formatRs(totals.pay)}</strong>
        </article>
      </section>

      <section className="split-overview-grid">
        <article>
          <h2>Your groups</h2>
          <div className="split-card-list">
            {groupSummaries.length ? (
              groupSummaries.map(({ group, netBalance }, index) => (
                <Link className="split-group-card" href={`/split/groups/${group.id}`} key={group.id}>
                  <span className="split-group-icon nav-icon" aria-hidden="true">{groupIcon(index)}</span>
                  <div className="split-group-meta">
                    <strong>{group.name}</strong>
                    <span>{group.members.length} members</span>
                  </div>
                  <div className={netBalance < 0 ? "split-pay-text" : "split-receive-text"}>{balanceLabel(netBalance)}</div>
                </Link>
              ))
            ) : (
              <div className="empty-state">No split groups yet. Create one to start splitting expenses.</div>
            )}
          </div>
        </article>

        <aside>
          <h2>Recent activity</h2>
          <div className="split-activity-card">
            {activity.length ? (
              activity.slice(0, 3).map((item) => (
                <div className="split-activity-preview-row" key={`${item.type}-${item.id}`}>
                  <span className="split-activity-dot nav-icon" aria-hidden="true">
                    {item.type === "settlement" ? "payments" : "receipt_long"}
                  </span>
                  <div>
                    <strong>{item.description}</strong>
                    <span>{item.groupName} • {item.date.slice(0, 10)}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state compact-empty">No activity yet.</div>
            )}
          </div>
          <p className="split-sync-note">{user ? `Signed in as ${user.full_name}. ` : ""}{message}</p>
        </aside>
      </section>
    </main>
  );
}
