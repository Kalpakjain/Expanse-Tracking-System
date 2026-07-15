"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";

import { changePassword, clearAuthSession } from "@/lib/api";

type PasswordField = "current" | "new" | "confirm";
type MessageTone = "neutral" | "success" | "error";

export function SettingsWorkspace() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [visiblePasswords, setVisiblePasswords] = useState<Record<PasswordField, boolean>>({
    current: false,
    new: false,
    confirm: false,
  });
  const [message, setMessage] = useState("Keep your account secure with a strong password.");
  const [messageTone, setMessageTone] = useState<MessageTone>("neutral");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const messageClassName = `form-message auth-message auth-message-${messageTone}`;

  function togglePassword(field: PasswordField) {
    setVisiblePasswords((current) => ({ ...current, [field]: !current[field] }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessageTone("error");
      setMessage("New password and confirmation do not match.");
      return;
    }

    setIsSubmitting(true);
    setMessageTone("neutral");
    setMessage("Updating password...");

    try {
      await changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setMessageTone("success");
      setMessage("Password updated successfully.");
    } catch (error) {
      setMessageTone("error");
      setMessage(error instanceof Error ? error.message : "Could not update password.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleLogout() {
    clearAuthSession();
    router.replace("/account");
  }

  return (
    <main className="page-shell">
      <section className="hero">
        <article className="hero-card">
          <span className="eyebrow">Settings</span>
          <h1>Account controls.</h1>
          <p>Manage your password and sign out from this device when you are done.</p>
          <div className="hero-actions">
            <span className="button button-secondary">{message}</span>
          </div>
        </article>

        <aside className="hero-side">
          <div className="hero-card side-card">
            <h2>Password</h2>
            <p>Use at least 8 characters and avoid reusing your current password.</p>
          </div>
          <div className="hero-card side-card">
            <h2>Logout</h2>
            <p>Signing out clears the stored token from this browser.</p>
          </div>
        </aside>
      </section>

      <section className="grid content-grid">
        <section className="panel">
          <div className="form-heading-row">
            <div>
              <h2 className="section-title">Change password</h2>
              <p className="section-copy">Enter your current password before choosing a new one.</p>
            </div>
          </div>

          <form className="expense-form" onSubmit={handleSubmit}>
            <label className="field">
              <span className="field-label">Current password</span>
              <span className="password-field">
                <input
                  className="field-input"
                  type={visiblePasswords.current ? "text" : "password"}
                  minLength={8}
                  maxLength={128}
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  placeholder="Current password"
                  required
                />
                <button
                  className="password-toggle"
                  type="button"
                  onClick={() => togglePassword("current")}
                  aria-label={visiblePasswords.current ? "Hide password" : "Show password"}
                  title={visiblePasswords.current ? "Hide password" : "Show password"}
                >
                  <span className="nav-icon" aria-hidden="true">
                    {visiblePasswords.current ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </span>
            </label>

            <label className="field">
              <span className="field-label">New password</span>
              <span className="password-field">
                <input
                  className="field-input"
                  type={visiblePasswords.new ? "text" : "password"}
                  minLength={8}
                  maxLength={128}
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  placeholder="Minimum 8 characters"
                  required
                />
                <button
                  className="password-toggle"
                  type="button"
                  onClick={() => togglePassword("new")}
                  aria-label={visiblePasswords.new ? "Hide password" : "Show password"}
                  title={visiblePasswords.new ? "Hide password" : "Show password"}
                >
                  <span className="nav-icon" aria-hidden="true">
                    {visiblePasswords.new ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </span>
            </label>

            <label className="field">
              <span className="field-label">Confirm new password</span>
              <span className="password-field">
                <input
                  className="field-input"
                  type={visiblePasswords.confirm ? "text" : "password"}
                  minLength={8}
                  maxLength={128}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Repeat new password"
                  required
                />
                <button
                  className="password-toggle"
                  type="button"
                  onClick={() => togglePassword("confirm")}
                  aria-label={visiblePasswords.confirm ? "Hide password" : "Show password"}
                  title={visiblePasswords.confirm ? "Hide password" : "Show password"}
                >
                  <span className="nav-icon" aria-hidden="true">
                    {visiblePasswords.confirm ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </span>
            </label>

            <div className="form-actions">
              <button className="button button-primary" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Updating..." : "Update password"}
              </button>
              {message ? <span className={messageClassName}>{message}</span> : null}
            </div>
          </form>
        </section>

        <aside className="panel">
          <h2 className="section-title">Log out</h2>
          <p className="section-copy">
            Use this when you are finished on a shared or public device. Your data stays in your account.
          </p>
          <div className="form-actions">
            <button className="button button-secondary" type="button" onClick={handleLogout}>
              Log out
            </button>
          </div>
        </aside>
      </section>
    </main>
  );
}
