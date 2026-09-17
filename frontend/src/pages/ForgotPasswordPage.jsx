import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PasswordField from "../components/PasswordField.jsx";
import { api } from "../api/client.js";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [requestLoading, setRequestLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetReady, setResetReady] = useState(false);

  async function requestToken(e) {
    e.preventDefault();
    setError("");
    setInfo("");
    setRequestLoading(true);
    try {
      const result = await api("/api/auth/forgot-password", "POST", { email: email.trim() });
      setResetReady(true);
      setInfo(result.message || "Reset instructions sent to your email.");
    } catch (err) {
      setError(err.message);
    } finally {
      setRequestLoading(false);
    }
  }

  async function resetPassword(e) {
    e.preventDefault();
    setError("");
    setInfo("");
    if (token.trim().length === 0) {
      setError("Reset token is required");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setResetLoading(true);
    try {
      await api("/api/auth/reset-password", "POST", {
        token: token.trim(), newPassword, confirmPassword
      });
      navigate("/login", { state: { message: "Password updated successfully. Please login with your new password." } });
    } catch (err) {
      setError(err.message);
    } finally {
      setResetLoading(false);
    }
  }

  return (
    <div className="login-wrap">
      <div className="card login-card">
        <div className="login-brand">
          <span className="brand-mark" aria-hidden="true">
            <svg className="nav-icon" viewBox="0 0 24 24">
              <path d="m3 9 9-5 9 5-9 5-9-5Z" />
              <path d="M6 11v5c2 2 10 2 12 0v-5M21 9v6" />
            </svg>
          </span>
          <div>
            <span className="page-eyebrow">School Enterprise</span>
            <h1>Reset password</h1>
          </div>
        </div>
        <p className="muted">Enter your email to receive a reset token, or skip ahead if you already have one.</p>
        {error && <p className="error" role="alert">{error}</p>}
        {info && <p className="ok" role="status">{info}</p>}

        {/* Step 1: Request token by email (shown initially or if user toggles back) */}
        {!resetReady && (
          <>
            <form onSubmit={requestToken}>
              <label htmlFor="email-input">Email Address</label>
              <input
                id="email-input"
                required
                type="email"
                autoComplete="email"
                placeholder="admin@school.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button type="submit" disabled={requestLoading}>
                {requestLoading ? "Sending..." : "Send Reset Instructions"}
              </button>
            </form>
            <hr />
            <p className="muted">Already have a reset token?</p>
            <button
              type="button"
              className="secondary"
              onClick={() => setResetReady(true)}
            >
              Enter Token Instead
            </button>
          </>
        )}

        {/* Step 2: Reset password with token */}
        {resetReady && (
          <>
            <form onSubmit={resetPassword}>
              <label htmlFor="token-input">Reset Token</label>
              <input
                id="token-input"
                required
                autoComplete="one-time-code"
                placeholder="Paste your reset token here"
                value={token}
                onChange={(e) => setToken(e.target.value)}
              />
              <label htmlFor="new-password-input">New Password</label>
              <PasswordField
                id="new-password-input"
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="At least 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <p className="muted">Password must be at least 8 characters.</p>
              <label htmlFor="confirm-password-input">Confirm New Password</label>
              <PasswordField
                id="confirm-password-input"
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <button type="submit" disabled={resetLoading}>
                {resetLoading ? "Updating..." : "Update Password"}
              </button>
            </form>
            <button
              type="button"
              className="secondary"
              onClick={() => {
                setResetReady(false);
                setToken("");
                setNewPassword("");
                setConfirmPassword("");
                setError("");
                setInfo("");
              }}
            >
              Request Token by Email Instead
            </button>
          </>
        )}

        <div className="login-footer">
          <Link to="/login">← Back to Login</Link>
        </div>
      </div>
    </div>
  );
}

