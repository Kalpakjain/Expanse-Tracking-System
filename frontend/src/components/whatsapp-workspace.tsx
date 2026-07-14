"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";

import {
  getNotificationPreferences,
  getNotificationPreview,
  updateNotificationPreferences,
} from "@/lib/api";
import type { NotificationPreferencesInput, NotificationPreview } from "@/lib/types";

export function WhatsAppWorkspace() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [dailyDigest, setDailyDigest] = useState(true);
  const [budgetAlerts, setBudgetAlerts] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(false);
  const [preferredSendHour, setPreferredSendHour] = useState("20");
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [isSaving, setIsSaving] = useState(false);
  const [preview, setPreview] = useState<NotificationPreview | null>(null);
  const [message, setMessage] = useState(
    "Loading your saved WhatsApp notification preferences..."
  );

  useEffect(() => {
    async function loadPreferences() {
      try {
        const preferences = await getNotificationPreferences();
        setPhoneNumber(preferences.phone_number);
        setDailyDigest(preferences.daily_digest_enabled);
        setBudgetAlerts(preferences.budget_alerts_enabled);
        setWeeklyReport(preferences.weekly_report_enabled);
        setPreferredSendHour(String(preferences.preferred_send_hour));
        setTimezone(preferences.timezone);
        setMessage("Saved settings loaded from the backend.");
      } catch {
        setMessage("Could not load settings yet. You can still save new ones.");
      }
    }

    void loadPreferences();
    void loadPreview();
  }, []);

  async function loadPreview() {
    try {
      const nextPreview = await getNotificationPreview();
      setPreview(nextPreview);
    } catch {
      setPreview(null);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setMessage("Saving WhatsApp preferences...");

    try {
      const payload: NotificationPreferencesInput = {
        phone_number: phoneNumber,
        daily_digest_enabled: dailyDigest,
        budget_alerts_enabled: budgetAlerts,
        weekly_report_enabled: weeklyReport,
        preferred_send_hour: Number(preferredSendHour),
        timezone,
        currency_code: "INR",
      };
      await updateNotificationPreferences(payload);
      await loadPreview();
      setMessage("Notification preferences saved to the backend.");
    } catch {
      setMessage("Could not save notification preferences right now.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="page-shell">
      <section className="hero">
        <article className="hero-card">
          <span className="eyebrow">WhatsApp Notification</span>
          <h1>Turn expense updates into timely nudges.</h1>
          <p>
            Configure alert preferences and preview the exact digest, budget, weekly, and recurring
            reminders generated from your local expense data.
          </p>
        </article>

        <aside className="hero-side">
          <div className="hero-card side-card">
            <h2>Local alert preview</h2>
            <p>
              Messages are generated from your real local expenses and budgets. The same payloads
              are ready for a WhatsApp provider during deployment.
            </p>
          </div>
        </aside>
      </section>

      <section className="grid content-grid">
        <article className="panel">
          <h2 className="section-title">Notification preferences</h2>
          <p className="section-copy">
            Configure how you want the system to talk to you once WhatsApp delivery is wired in.
          </p>

          <form className="expense-form" onSubmit={handleSubmit}>
            <label className="field">
              <span className="field-label">WhatsApp number</span>
              <input
                className="field-input"
                value={phoneNumber}
                onChange={(event) => setPhoneNumber(event.target.value)}
                placeholder="+91 98765 43210"
              />
            </label>

            <label className="toggle-row">
              <input
                checked={dailyDigest}
                onChange={(event) => setDailyDigest(event.target.checked)}
                type="checkbox"
              />
              <span>Send a daily expense digest</span>
            </label>

            <label className="toggle-row">
              <input
                checked={budgetAlerts}
                onChange={(event) => setBudgetAlerts(event.target.checked)}
                type="checkbox"
              />
              <span>Send alerts when a category crosses its limit</span>
            </label>

            <label className="toggle-row">
              <input
                checked={weeklyReport}
                onChange={(event) => setWeeklyReport(event.target.checked)}
                type="checkbox"
              />
              <span>Send a weekly financial summary</span>
            </label>

            <div className="field-row">
              <label className="field">
                <span className="field-label">Preferred send hour</span>
                <input
                  className="field-input"
                  type="number"
                  min="0"
                  max="23"
                  value={preferredSendHour}
                  onChange={(event) => setPreferredSendHour(event.target.value)}
                />
              </label>

              <label className="field">
                <span className="field-label">Timezone</span>
                <input
                  className="field-input"
                  value={timezone}
                  onChange={(event) => setTimezone(event.target.value)}
                />
              </label>
            </div>

            <div className="form-actions">
              <button className="button button-primary" type="submit" disabled={isSaving}>
                {isSaving ? "Saving..." : "Save notification settings"}
              </button>
              <span className="form-message">{message}</span>
            </div>
          </form>
        </article>

        <aside className="panel">
          <div className="form-heading-row">
            <div>
              <h2 className="section-title">Live message preview</h2>
              <p className="section-copy">
                Scheduled for {preview?.send_hour ?? preferredSendHour}:00 {preview?.timezone ?? timezone}.
              </p>
            </div>
            <button className="button button-secondary" type="button" onClick={() => void loadPreview()}>
              Refresh
            </button>
          </div>

          <div className="notification-preview-list">
            {preview?.messages.length ? (
              preview.messages.map((item) => (
                <article
                  className={`notification-preview-card notification-${item.severity}`}
                  key={`${item.kind}-${item.title}`}
                >
                  <div className="receipt-card-top">
                    <div>
                      <div className="item-title">{item.title}</div>
                      <div className="item-subtitle">{item.message}</div>
                    </div>
                    <span className={item.enabled ? "status-pill status-posted" : "status-pill"}>
                      {item.enabled ? "Enabled" : "Off"}
                    </span>
                  </div>
                </article>
              ))
            ) : (
              <div className="empty-state">No preview messages available yet.</div>
            )}
          </div>
        </aside>
      </section>
    </main>
  );
}
