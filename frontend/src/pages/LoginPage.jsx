import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import { getLoginErrorMessage } from "../auth/loginError.js";
import PasswordField from "../components/PasswordField.jsx";

export default function LoginPage() {
  const { login, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState(location.state?.message || "");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setInfo("");
    if (!username.trim() || !password) {
      setError("Username/email and password are required");
      return;
    }
    setLoading(true);
    try {
      const user = await login(username, password);
      const roles = Array.isArray(user.roles) ? user.roles : [];
      if (!roles.includes("ADMIN") && roles.some((role) => role === "CLASS_TEACHER" || role === "SUBJECT_TEACHER")) {
        await logout();
        setError("This is a teacher account. Please sign in through the Teacher Portal.");
        return;
      }
      navigate("/");
    } catch (err) {
      setError(getLoginErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-wrap">
      <form className="card login-card" onSubmit={onSubmit}>
        <div className="login-brand">
          <span className="brand-mark" aria-hidden="true">
            <svg className="nav-icon" viewBox="0 0 24 24">
              <path d="m3 9 9-5 9 5-9 5-9-5Z" />
              <path d="M6 11v5c2 2 10 2 12 0v-5M21 9v6" />
            </svg>
          </span>
          <div>
            <span className="page-eyebrow">School Enterprise</span>
            <h1>Admin login</h1>
          </div>
        </div>
        <p className="muted">Sign in to the administration and finance portal.</p>
        {error && <p className="error" role="alert">{error}</p>}
        {info && <p className="ok" role="status">{info}</p>}
        <label htmlFor="login-username">Username or email</label>
        <input
          id="login-username"
          required
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <label htmlFor="login-password">Password</label>
        <PasswordField
          id="login-password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit" disabled={loading}>
          {loading ? "Signing in..." : "Login"}
        </button>
        <div className="login-footer">
          <Link to="/forgot-password" className="forgot-password-link">Forgot password?</Link>
        </div>
      </form>
    </div>
  );
}
