"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";

import {
  clearAuthSession,
  getCurrentUser,
  login,
  register,
  saveAuthSession,
} from "@/lib/api";
import type { User } from "@/lib/types";

type AuthMode = "login" | "register";

export function AuthWorkspace() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [user, setUser] = useState<User | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("Use the demo workspace locally, or create your own account.");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    getCurrentUser()
      .then((currentUser) => setUser(currentUser))
      .catch(() => setUser(null));
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(mode === "login" ? "Signing in..." : "Creating account...");

    try {
      const session =
        mode === "login"
          ? await login({ email, password })
          : await register({ email, password, full_name: fullName });
      saveAuthSession(session);
      setUser(session.user);
      setPassword("");
      setMessage(`Signed in as ${session.user.full_name}.`);
    } catch {
      setMessage(mode === "login" ? "Could not sign in with those details." : "Could not create this account.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleSignOut() {
    clearAuthSession();
    setUser(null);
    setMessage("Signed out. The local demo workspace is still available.");
  }

  return (
    <main className="page-shell">
      <section className="dashboard-hero">
        <div>
          <span className="eyebrow">Account</span>
          <h1>Secure your expense workspace.</h1>
          <p>
            Create an account to keep expenses, budgets, receipts, and notification settings tied to
            your own profile.
          </p>
        </div>
        <div className="hero-balance-card">
          <div className="stat-label">Current session</div>
          <div className="hero-balance-value auth-session-name">
            {user ? user.full_name : "Demo mode"}
          </div>
          <div className="stat-footnote">{user ? user.email : "Local fallback account"}</div>
        </div>
      </section>

      <section className="grid content-grid auth-grid">
        <article className="panel">
          <div className="auth-tabs" role="tablist" aria-label="Account actions">
            <button
              className={mode === "login" ? "auth-tab active" : "auth-tab"}
              type="button"
              onClick={() => setMode("login")}
            >
              Sign in
            </button>
            <button
              className={mode === "register" ? "auth-tab active" : "auth-tab"}
              type="button"
              onClick={() => setMode("register")}
            >
              Create account
            </button>
          </div>

          <form className="expense-form" onSubmit={handleSubmit}>
            {mode === "register" ? (
              <label className="field">
                <span className="field-label">Full name</span>
                <input
                  className="field-input"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="Kalpak Jain"
                  required
                />
              </label>
            ) : null}

            <label className="field">
              <span className="field-label">Email</span>
              <input
                className="field-input"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
              />
            </label>

            <label className="field">
              <span className="field-label">Password</span>
              <input
                className="field-input"
                type="password"
                minLength={8}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Minimum 8 characters"
                required
              />
            </label>

            <div className="form-actions">
              <button className="button button-primary" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Please wait..." : mode === "login" ? "Sign in" : "Create account"}
              </button>
              {user ? (
                <button className="button button-secondary" type="button" onClick={handleSignOut}>
                  Sign out
                </button>
              ) : null}
            </div>
            <span className="form-message">{message}</span>
          </form>
        </article>

        <aside className="panel">
          <h2 className="section-title">What this unlocks</h2>
          <p className="section-copy">
            The backend now accepts bearer tokens and scopes transactions, budgets, receipts, and
            notification settings to the active user.
          </p>
          <div className="checklist">
            <div className="checklist-item">
              <span className="check">1</span>
              <div>
                <div className="item-title">Private ledger</div>
                <div className="item-subtitle">Expenses are tied to your account.</div>
              </div>
            </div>
            <div className="checklist-item">
              <span className="check">2</span>
              <div>
                <div className="item-title">Deployable sessions</div>
                <div className="item-subtitle">Tokens work with hosted frontend and API deployments.</div>
              </div>
            </div>
            <div className="checklist-item">
              <span className="check">3</span>
              <div>
                <div className="item-title">Demo fallback</div>
                <div className="item-subtitle">Local development stays easy without mandatory login.</div>
              </div>
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}
