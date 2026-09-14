import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import { api } from "../api/client.js";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("Admin@123");
  const [email, setEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      await login(username, password);
      navigate("/");
    } catch (err) {
      setError(err.message);
    }
  }

  async function forgot() {
    setError("");
    try {
      const data = await api("/api/auth/forgot-password", "POST", { email });
      setResetToken(data.resetToken);
      setInfo("Demo reset token is filled below. Use it with a new password.");
    } catch (err) {
      setError(err.message);
    }
  }

  async function reset() {
    setError("");
    try {
      await api("/api/auth/reset-password", "POST", { token: resetToken, newPassword });
      setInfo("Password updated. You can login now.");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="login-wrap">
      <form className="card login-card" onSubmit={onSubmit}>
        <h1>Admin Login</h1>
        <p className="muted">Stage 1 — Administration & Finance</p>
        {error && <p className="error">{error}</p>}
        {info && <p className="ok">{info}</p>}
        <label>Username</label>
        <input value={username} onChange={(e) => setUsername(e.target.value)} />
        <label>Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button type="submit">Login</button>
        <hr />
        <h3>Password reset</h3>
        <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <button type="button" className="secondary" onClick={forgot}>Send reset token</button>
        <input placeholder="Reset token" value={resetToken} onChange={(e) => setResetToken(e.target.value)} />
        <input placeholder="New password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        <button type="button" className="secondary" onClick={reset}>Reset password</button>
      </form>
    </div>
  );
}
