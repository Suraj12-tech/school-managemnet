import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import PasswordField from "../components/PasswordField.jsx";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState(location.state?.message || "");

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setInfo("");
    if (!username.trim() || !password) {
      setError("Username/email and password are required");
      return;
    }
    try {
      await login(username, password);
      navigate("/");
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
        <input required value={username} onChange={(e) => setUsername(e.target.value)} />
        <label>Password</label>
        <PasswordField value={password} onChange={(e) => setPassword(e.target.value)} />
        <button type="submit">Login</button>
        <hr />
        <Link to="/forgot-password">Forgot password?</Link>
      </form>
    </div>
  );
}
