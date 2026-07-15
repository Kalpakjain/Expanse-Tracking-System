"use client";

import { useCallback, useEffect, useState } from "react";

import { getFriendBalances } from "@/lib/api";
import type { GroupBalanceEntry } from "@/lib/types";

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
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

export function SplitFriendsWorkspace() {
  const [friends, setFriends] = useState<GroupBalanceEntry[]>([]);
  const [message, setMessage] = useState("Loading friends...");

  const loadFriends = useCallback(async () => {
    try {
      const nextFriends = await getFriendBalances();
      setFriends(nextFriends);
      setMessage("Friend balances synced from the backend.");
    } catch {
      setMessage("Could not load friend balances yet.");
    }
  }, []);

  useEffect(() => {
    void loadFriends();
  }, [loadFriends]);

  return (
    <main className="page-shell">
      <section className="page-header-compact">
        <div>
          <h1>Friends</h1>
          <p>Balances by person</p>
        </div>
        <div className="page-header-actions">
          <span className="button button-secondary">{message}</span>
        </div>
      </section>

      <section className="panel">
        <h2 className="section-title">All friends</h2>
        <p className="section-copy">Aggregated by the backend from group expenses and settlements.</p>
        <div className="list">
          {friends.length ? (
            friends.map((friend) => (
              <div className="list-item" key={friend.user_id}>
                <div className="split-person-row">
                  <span className="member-avatar">{initials(friend.full_name) || "F"}</span>
                  <div>
                    <div className="item-title">{friend.full_name}</div>
                    <div className="item-subtitle">Shared split member</div>
                  </div>
                </div>
                <div className={friend.net_balance < 0 ? "amount-expense" : "amount-income"}>
                  {balanceLabel(friend.net_balance)}
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">No friends yet. Add members inside a split group.</div>
          )}
        </div>
      </section>
    </main>
  );
}
