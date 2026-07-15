"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { listGroupExpenses, listGroups, listSettlements } from "@/lib/api";

type ActivityItem = {
  id: string;
  type: "expense" | "settlement";
  groupName: string;
  description: string;
  amount: number;
  date: string;
};

const pageSize = 8;

function formatRs(amount: number) {
  return `Rs ${Math.abs(amount).toFixed(2)}`;
}

export function SplitActivityWorkspace() {
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState("Loading split activity...");

  const loadActivity = useCallback(async () => {
    try {
      const groups = await listGroups();
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
              groupName: group.name,
              description: `${expense.paid_by_name} paid for ${expense.description}`,
              amount: expense.amount,
              date: expense.created_at,
            })),
            ...settlements.map((settlement): ActivityItem => ({
              id: settlement.id,
              type: "settlement",
              groupName: group.name,
              description: `${settlement.from_user_name} paid ${settlement.to_user_name}`,
              amount: settlement.amount,
              date: settlement.settled_at,
            })),
          ];
        }),
      );
      setActivity(activityResults.flat().sort((first, second) => second.date.localeCompare(first.date)));
      setPage(1);
      setMessage("Activity synced from the backend.");
    } catch {
      setMessage("Could not load split activity yet.");
    }
  }, []);

  useEffect(() => {
    void loadActivity();
  }, [loadActivity]);

  const pageCount = Math.max(1, Math.ceil(activity.length / pageSize));
  const visibleActivity = useMemo(
    () => activity.slice((page - 1) * pageSize, page * pageSize),
    [activity, page],
  );

  return (
    <main className="page-shell">
      <section className="page-header-compact">
        <div>
          <h1>Activity</h1>
          <p>Expenses and settlements</p>
        </div>
        <div className="page-header-actions">
          <span className="button button-secondary">{message}</span>
        </div>
      </section>

      <section className="panel">
        <div className="form-heading-row">
          <div>
            <h2 className="section-title">Recent activity</h2>
            <p className="section-copy">Expenses and settlements from all split groups.</p>
          </div>
          <span className="button button-secondary compact-button">Page {page} of {pageCount}</span>
        </div>

        <div className="list">
          {visibleActivity.length ? (
            visibleActivity.map((item) => (
              <div className="list-item" key={`${item.type}-${item.id}`}>
                <div className="split-activity-row">
                  <span className="split-activity-icon nav-icon" aria-hidden="true">
                    {item.type === "settlement" ? "payments" : "receipt_long"}
                  </span>
                  <div>
                    <div className="item-title">{item.description}</div>
                    <div className="item-subtitle">{item.groupName} • {item.date.slice(0, 10)}</div>
                  </div>
                </div>
                <div className={item.type === "settlement" ? "amount-income" : "amount-expense"}>
                  {formatRs(item.amount)}
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">No split activity yet.</div>
          )}
        </div>

        <div className="form-actions">
          <button
            className="button button-secondary compact-button"
            type="button"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={page <= 1}
          >
            Previous
          </button>
          <button
            className="button button-primary compact-button"
            type="button"
            onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
            disabled={page >= pageCount}
          >
            Next
          </button>
        </div>
      </section>
    </main>
  );
}
