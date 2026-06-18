"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";

import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from "@/lib/api";
import type { NotificationPreferencesInput } from "@/lib/types";

export function WhatsAppWorkspace() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [dailyDigest, setDailyDigest] = useState(true);
  const [budgetAlerts, setBudgetAlerts] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(false);
  const [preferredSendHour, setPreferredSendHour] = useState("20");
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [isSaving, setIsSaving] = useState(false);
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
  }, []);

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
            This section is the future home for daily summaries, budget threshold alerts, and quick
            spending reminders sent through WhatsApp.
          </p>
        </article>

        <aside className="hero-side">
          <div className="hero-card side-card">
            <h2>Current stage</h2>
            <p>
              Preference storage is live. The next backend step is scheduled delivery and WhatsApp
              provider integration.
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
          <h2 className="section-title">Planned alert types</h2>
          <div className="checklist">
            <div className="checklist-item">
              <span className="check">1</span>
              <div>
                <div className="item-title">Daily summary</div>
                <div className="item-subtitle">
                  A compact message with the day’s spending and key categories.
                </div>
              </div>
            </div>
            <div className="checklist-item">
              <span className="check">2</span>
              <div>
                <div className="item-title">Budget alerts</div>
                <div className="item-subtitle">
                  Notifications when a category gets close to or crosses a monthly limit.
                </div>
              </div>
            </div>
            <div className="checklist-item">
              <span className="check">3</span>
              <div>
                <div className="item-title">Recurring reminders</div>
                <div className="item-subtitle">
                  Nudge users about predictable bills or expenses that usually show up.
                </div>
              </div>
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}
