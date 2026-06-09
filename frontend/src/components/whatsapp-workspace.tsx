"use client";

import { useState } from "react";
import type { FormEvent } from "react";

export function WhatsAppWorkspace() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [dailyDigest, setDailyDigest] = useState(true);
  const [budgetAlerts, setBudgetAlerts] = useState(true);
  const [message, setMessage] = useState(
    "Frontend section ready. Backend delivery wiring can come next."
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("Notification preferences saved in the UI concept. Backend integration is next.");
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
              The front-end settings experience is ready. The next backend step will be provider
              integration and scheduled messaging.
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

            <div className="form-actions">
              <button className="button button-primary" type="submit">
                Save notification settings
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
