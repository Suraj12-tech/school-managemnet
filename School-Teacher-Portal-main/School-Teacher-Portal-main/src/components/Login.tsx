import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Mail } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

export function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await login(username.trim(), password);
      navigate("/app", { replace: true });
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Unable to sign in.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "grid",
      gridTemplateColumns: "minmax(320px, 1fr) minmax(320px, 1fr)",
      backgroundColor: "var(--bg-color)",
      padding: "1rem",
      gap: "1rem"
    }}>
      <section style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "2rem 4rem",
        backgroundColor: "var(--surface-color)",
        borderRadius: "var(--radius-xl)"
      }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 600 }}>SchoolEnterprise Teacher Portal</h2>
        <h1 style={{ fontSize: "3rem", fontWeight: 400, lineHeight: 1.1, marginBottom: "1rem" }}>
          Sign in to your account
        </h1>
        <p style={{ color: "var(--text-secondary)", maxWidth: 400, marginBottom: "2rem" }}>
          Use the account created and linked to your Staff record by a school administrator.
        </p>
        {error && <p role="alert" className="error">{error}</p>}
        <form onSubmit={handleLogin} style={{
          display: "flex",
          flexDirection: "column",
          gap: "1.25rem",
          maxWidth: 440
        }}>
          <label style={{ position: "relative" }}>
            <Mail size={18} aria-hidden="true" style={{
              position: "absolute", left: "1rem", top: "50%",
              transform: "translateY(-50%)", color: "var(--primary-color)"
            }} />
            <input
              autoComplete="username"
              required
              className="input-field w-full"
              placeholder="Username or email"
              style={{ paddingLeft: "3rem" }}
              value={username}
              onChange={event => setUsername(event.target.value)}
            />
          </label>
          <label style={{ position: "relative" }}>
            <Lock size={18} aria-hidden="true" style={{
              position: "absolute", left: "1rem", top: "50%",
              transform: "translateY(-50%)", color: "var(--text-secondary)"
            }} />
            <input
              autoComplete="current-password"
              required
              type="password"
              className="input-field w-full"
              placeholder="Password"
              style={{ paddingLeft: "3rem" }}
              value={password}
              onChange={event => setPassword(event.target.value)}
            />
          </label>
          <button disabled={isSubmitting} type="submit" className="btn btn-primary" style={{
            width: "100%", padding: "1rem", marginTop: "0.5rem"
          }}>
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </section>
      <aside style={{
        borderRadius: "var(--radius-xl)",
        backgroundImage: 'url("/bg-astronaut.png")',
        backgroundSize: "cover",
        backgroundPosition: "center",
        display: "flex",
        alignItems: "flex-end",
        padding: "2rem",
        color: "white"
      }}>
        <div className="glass" style={{ padding: "2rem", borderRadius: "var(--radius-xl)" }}>
          <h2 style={{ fontSize: "2rem", fontWeight: 400 }}>Your assigned school workspace</h2>
          <p style={{ lineHeight: 1.6 }}>
            Classes, subjects, student rosters, and active teaching assignments are provided by the school platform.
          </p>
        </div>
      </aside>
    </div>
  );
}
