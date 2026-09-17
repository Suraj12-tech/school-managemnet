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

  async function requestToken(e) {
    e.preventDefault();
    setError("");
    setInfo("");
    try {
      const result = await api("/api/auth/forgot-password", "POST", { email });
      setToken("");
      setInfo(result.message || "Reset instructions sent to your email.");
    } catch (err) { setError(err.message); }
  }

  async function resetPassword(e) {
    e.preventDefault();
    setError("");
    setInfo("");
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    try {
      await api("/api/auth/reset-password", "POST", {
        token, newPassword, confirmPassword
      });
      navigate("/login", { state: { message: "Password updated successfully. Please login with your new password." } });
    } catch (err) { setError(err.message); }
  }

  return (
    <div className="login-wrap">
      <div className="card login-card">
        <h1>Reset Password</h1>
        {error && <p className="error">{error}</p>}
        {info && <p className="ok">{info}</p>}
        <form onSubmit={requestToken}>
          <label>Email</label>
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <button type="submit">Send reset token</button>
        </form>
        <hr />
        <form onSubmit={resetPassword}>
          <label>Reset token</label>
          <input required value={token} onChange={(e) => setToken(e.target.value)} />
          <label>New password</label>
          <PasswordField required minLength={8} value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)} />
          <label>Confirm new password</label>
          <PasswordField required minLength={8} value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)} />
          <button type="submit">Update password</button>
        </form>
        <Link to="/login">Back to login</Link>
      </div>
    </div>
  );
}
