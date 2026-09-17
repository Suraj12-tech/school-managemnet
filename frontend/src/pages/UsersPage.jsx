import { useEffect, useState } from "react";
import { api } from "../api/client.js";

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [form, setForm] = useState({
    username: "", email: "", password: "", fullName: "", phone: "", status: "ACTIVE", roleIds: []
  });
  const [error, setError] = useState("");

  async function load() {
    setUsers(await api("/api/users"));
    setRoles(await api("/api/roles"));
  }
  useEffect(() => { load(); }, []);

  function toggleRole(id) {
    setForm((f) => ({
      ...f,
      roleIds: f.roleIds.includes(id) ? f.roleIds.filter((x) => x !== id) : [...f.roleIds, id]
    }));
  }

  async function save(e) {
    e.preventDefault();
    setError("");
    try {
      await api("/api/users", "POST", {
        ...form,
        scopes: [{ scopeType: "SCHOOL", scopeId: 1 }]
      });
      setForm({ username: "", email: "", password: "", fullName: "", phone: "", status: "ACTIVE", roleIds: [] });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <h2>User Management</h2>
      {error && <p className="error">{error}</p>}
      <form className="card" onSubmit={save}>
        <input placeholder="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
        <input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input placeholder="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <input placeholder="Full name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
        <div className="chips">
          {roles.map((r) => (
            <label key={r.id}>
              <input type="checkbox" checked={form.roleIds.includes(r.id)} onChange={() => toggleRole(r.id)} /> {r.name}
            </label>
          ))}
        </div>
        <button>Create user</button>
      </form>
      <table>
        <thead><tr><th>Username</th><th>Name</th><th>Email</th><th>Status</th></tr></thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}><td>{u.username}</td><td>{u.fullName}</td><td>{u.email}</td><td>{u.status}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
