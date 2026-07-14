"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import {
  forgotPassword,
  login,
  register,
  resendVerification,
  resetPassword,
  saveAuthSession,
  verifyEmail,
} from "@/lib/api";

type AuthMode = "login" | "register" | "forgot";
type AuthInfoSection = "home" | "service" | "about" | "contact";
type MessageTone = "neutral" | "success" | "error";

const infoSections: Record<AuthInfoSection, { title: string; body: string; points?: string[]; action?: string }> = {
  home: {
    title: "Login to see your dashboard",
    body: "Your expense summary, budgets, receipts, and alerts stay private until you sign in.",
    action: "Use the login form to continue.",
  },
  service: {
    title: "Services",
    body: "Everything needed to track and understand day-to-day spending.",
    points: ["Expense and income tracking", "Budgets and analytics", "Receipt review", "Smart reminders"],
  },
  about: {
    title: "Our motive",
    body: "We help users build a clear money habit: capture spending, control budgets, and make better monthly decisions.",
    points: ["Clarity over confusion", "Rupee-first planning", "Private financial workspace"],
  },
  contact: {
    title: "Contact",
    body: "Share your preferred email, phone number, or social links and I will add them here.",
    points: ["Email", "Phone", "LinkedIn", "GitHub"],
  },
};

export function AuthWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<AuthMode>("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [activeInfoSection, setActiveInfoSection] = useState<AuthInfoSection | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState("");
  const [pendingResetEmail, setPendingResetEmail] = useState("");
  const [resetPasswordValue, setResetPasswordValue] = useState("");
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<MessageTone>("neutral");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const messageClassName = `form-message auth-message auth-message-${messageTone}`;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessageTone("neutral");
    setMessage(mode === "login" ? "Signing in..." : "Creating account...");

    try {
      if (mode === "register") {
        const registration = await register({ email, password, full_name: fullName });
        setPendingVerificationEmail(registration.email);
        setPassword("");
        setVerificationCode("");
        setMessageTone("success");
        setMessage("Verification code sent to your email.");
        return;
      }

      const session = await login({ email, password });
      saveAuthSession(session, rememberMe);
      setPassword("");
      setMessageTone("success");
      setMessage(`Signed in as ${session.user.full_name}.`);
      const nextPath = searchParams.get("next") ?? "/";
      router.replace(nextPath);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "";
      setMessageTone("error");
      setMessage(
        errorMessage ||
          (mode === "login" ? "Could not sign in with those details." : "Could not create this account."),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleForgotPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessageTone("neutral");
    setMessage(pendingResetEmail ? "Resetting password..." : "Sending reset OTP...");

    try {
      if (pendingResetEmail) {
        const session = await resetPassword({
          email: pendingResetEmail,
          code: verificationCode,
          password: resetPasswordValue,
        });
        saveAuthSession(session, rememberMe);
        setVerificationCode("");
        setResetPasswordValue("");
        setPendingResetEmail("");
        setMessageTone("success");
        setMessage("Password updated. Opening your dashboard.");
        router.replace(searchParams.get("next") ?? "/");
        return;
      }

      const response = await forgotPassword(email);
      setPendingResetEmail(response.email);
      setVerificationCode("");
      setMessageTone("success");
      setMessage("Password reset OTP sent to your email.");
    } catch (error) {
      setMessageTone("error");
      setMessage(error instanceof Error ? error.message : "Could not complete password reset.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleVerifyEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessageTone("neutral");
    setMessage("Verifying email...");

    try {
      const session = await verifyEmail({
        email: pendingVerificationEmail || email,
        code: verificationCode,
      });
      saveAuthSession(session, rememberMe);
      setVerificationCode("");
      setPendingVerificationEmail("");
      setMessageTone("success");
      setMessage(`Email verified. Signed in as ${session.user.full_name}.`);
      router.replace(searchParams.get("next") ?? "/");
    } catch (error) {
      setMessageTone("error");
      setMessage(error instanceof Error ? error.message : "Could not verify this code.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResendCode() {
    const targetEmail = pendingVerificationEmail || email;
    if (!targetEmail) {
      setMessageTone("error");
      setMessage("Enter your email first.");
      return;
    }
    setIsSubmitting(true);
    setMessageTone("neutral");
    setMessage("Generating a new verification code...");

    try {
      const response = await resendVerification(targetEmail);
      setPendingVerificationEmail(response.email);
      setVerificationCode("");
      setMessageTone("success");
      setMessage("A new verification code was sent to your email.");
    } catch (error) {
      setMessageTone("error");
      setMessage(error instanceof Error ? error.message : "Could not resend verification code.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-landing">
        <article className="auth-visual-panel" aria-label="Budget tracking illustration">
          <nav className="auth-mini-nav" aria-label="Preview navigation">
            {(["home", "service", "about", "contact"] as AuthInfoSection[]).map((section) => (
              <button
                className={activeInfoSection === section ? "auth-mini-nav-active" : ""}
                key={section}
                type="button"
                onClick={() => setActiveInfoSection(section)}
              >
                {section === "home" ? "Home" : section === "service" ? "Service" : section === "about" ? "About" : "Contact"}
              </button>
            ))}
          </nav>
          {activeInfoSection ? (
            <div className="auth-info-stage">
              <span className="eyebrow">Budget Tracking</span>
              <h2>{infoSections[activeInfoSection].title}</h2>
              <p>{infoSections[activeInfoSection].body}</p>
              {infoSections[activeInfoSection].points ? (
                <div className="auth-info-points">
                  {infoSections[activeInfoSection].points?.map((point) => <span key={point}>{point}</span>)}
                </div>
              ) : null}
              {infoSections[activeInfoSection].action ? (
                <strong>{infoSections[activeInfoSection].action}</strong>
              ) : null}
              <button className="button button-secondary compact-button" type="button" onClick={() => setActiveInfoSection(null)}>
                Back to preview
              </button>
            </div>
          ) : (
            <div className="auth-illustration">
              <div className="coin-symbol">$</div>
              <div className="pie-shape" />
              <div className="phone-card">
                <span />
                <strong />
                <em />
                <b />
              </div>
              <div className="chart-card">
                <span />
                <span />
                <span />
              </div>
              <div className="calculator-grid">
                {Array.from({ length: 12 }).map((_, index) => (
                  <span key={index} />
                ))}
              </div>
            </div>
          )}
        </article>

        <article className="auth-card">
          <div className="auth-brand-row">
            <span className="site-brand-mark logo-mark" aria-hidden="true">
              <img src="/fintrack-logo-mark.png" alt="" />
            </span>
            <div>
              <strong className="brand-wordmark" aria-label="FinTrack AI">
                <span className="brand-fin">Fin</span>
                <span className="brand-track">Track</span>
                <span className="brand-ai">AI</span>
              </strong>
              <span>Smart Expense Tracker</span>
            </div>
          </div>

          {pendingVerificationEmail ? (
            <form className="expense-form auth-form" onSubmit={handleVerifyEmail}>
              <div>
                <h2 className="section-title">Verify your email</h2>
                <p className="section-copy">Enter the 6-digit code generated for your new account.</p>
              </div>
              <label className="field">
                <span className="field-label">Email</span>
                <input className="field-input" value={pendingVerificationEmail} readOnly />
              </label>

              <label className="field">
                <span className="field-label">Verification code</span>
                <input
                  className="field-input"
                  inputMode="numeric"
                  maxLength={6}
                  minLength={6}
                  value={verificationCode}
                  onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="6-digit code"
                  required
                />
              </label>

              <label className="toggle-row">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                />
                <span>Remember me on this device after verification</span>
              </label>

              <div className="form-actions">
                <button className="button button-primary" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Verifying..." : "Verify email"}
                </button>
                <button className="button button-secondary" type="button" onClick={handleResendCode} disabled={isSubmitting}>
                  Resend code
                </button>
              </div>
              {message ? <span className={messageClassName} key={message}>{message}</span> : null}
            </form>
          ) : (
          mode === "forgot" ? (
          <form className="expense-form auth-form" onSubmit={handleForgotPassword}>
            <div className="auth-form-heading">
              <h2 className="section-title">{pendingResetEmail ? "Set new password" : "Reset password"}</h2>
              <p className="section-copy">
                {pendingResetEmail
                  ? "Enter the OTP from your email and choose a new password."
                  : "Enter your account email and we will send a reset OTP."}
              </p>
            </div>

            <label className="field">
              <span className="field-label">Email</span>
              <input
                className="field-input"
                type="email"
                value={pendingResetEmail || email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                readOnly={Boolean(pendingResetEmail)}
                required
              />
            </label>

            {pendingResetEmail ? (
              <>
                <label className="field">
                  <span className="field-label">OTP</span>
                  <input
                    className="field-input"
                    inputMode="numeric"
                    maxLength={6}
                    minLength={6}
                    value={verificationCode}
                    onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="6-digit code"
                    required
                  />
                </label>
                <label className="field">
                  <span className="field-label">New password</span>
                  <span className="password-field">
                    <input
                      className="field-input"
                      type={showResetPassword ? "text" : "password"}
                      minLength={8}
                      value={resetPasswordValue}
                      onChange={(event) => setResetPasswordValue(event.target.value)}
                      placeholder="Minimum 8 characters"
                      required
                    />
                    <button
                      className="password-toggle"
                      type="button"
                      onClick={() => setShowResetPassword((isVisible) => !isVisible)}
                      aria-label={showResetPassword ? "Hide password" : "Show password"}
                      title={showResetPassword ? "Hide password" : "Show password"}
                    >
                      <span className="nav-icon" aria-hidden="true">
                        {showResetPassword ? "visibility_off" : "visibility"}
                      </span>
                    </button>
                  </span>
                </label>
              </>
            ) : null}

            <div className="form-actions">
              <button className="button button-primary auth-submit" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Please wait..." : pendingResetEmail ? "Reset password" : "Send OTP"}
              </button>
            </div>
            <button
              className="auth-text-link"
              type="button"
              onClick={() => {
                setMode("login");
                setPendingResetEmail("");
                setVerificationCode("");
                setResetPasswordValue("");
                setMessageTone("neutral");
                setMessage("");
              }}
            >
              Back to login
            </button>
            {message ? <span className={messageClassName} key={message}>{message}</span> : null}
          </form>
          ) : (
          <form className="expense-form auth-form" onSubmit={handleSubmit}>
            <div className="auth-form-heading">
              <h2 className="section-title">{mode === "login" ? "Welcome back" : "Create your account"}</h2>
              <p className="section-copy">
                {mode === "login"
                  ? "Login to continue to the dashboard."
                  : "Verify your email once, then start tracking expenses."}
              </p>
            </div>
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
              <span className="password-field">
                <input
                  className="field-input"
                  type={showPassword ? "text" : "password"}
                  minLength={8}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Minimum 8 characters"
                  required
                />
                <button
                  className="password-toggle"
                  type="button"
                  onClick={() => setShowPassword((isVisible) => !isVisible)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  <span className="nav-icon" aria-hidden="true">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </span>
            </label>

            <label className="toggle-row auth-remember">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
              />
              <span>Remember me on this device</span>
            </label>

            <div className="form-actions">
              <button className="button button-primary auth-submit" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Please wait..." : mode === "login" ? "Login" : "Create account"}
              </button>
            </div>
            <div className="auth-secondary-actions">
              {mode === "login" ? (
                <>
                  <button
                    className="auth-text-link"
                    type="button"
                    onClick={() => {
                      setMode("forgot");
                      setPendingVerificationEmail("");
                      setPendingResetEmail("");
                      setVerificationCode("");
                      setMessageTone("neutral");
                      setMessage("");
                    }}
                  >
                    Forgot password?
                  </button>
                  <p className="auth-inline-switch">
                    Not registered yet?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setMode("register");
                        setPendingVerificationEmail("");
                        setMessageTone("neutral");
                        setMessage("");
                      }}
                    >
                      Create account
                    </button>
                  </p>
                </>
              ) : (
                <button
                  className="auth-text-link"
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setPendingVerificationEmail("");
                    setMessageTone("neutral");
                    setMessage("");
                  }}
                >
                  Already registered? Login
                </button>
              )}
            </div>
            {message ? <span className={messageClassName} key={message}>{message}</span> : null}
          </form>
          )
          )}
        </article>
      </section>
    </main>
  );
}
