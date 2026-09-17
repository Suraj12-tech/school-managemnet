import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import PasswordField from "../components/PasswordField.jsx";
import PageHeader from "../components/PageHeader.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import TableWrap from "../components/TableWrap.jsx";

const emptyForm = {
  username: "", email: "", password: "", fullName: "", phone: "", status: "ACTIVE",
  roleIds: [], scopes: []
};

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [selectedId, setSelectedId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    try {
      setError("");
      const [userData, roleData] = await Promise.all([api("/api/users"), api("/api/roles")]);
      setUsers(Array.isArray(userData) ? userData : []);
      setRoles(Array.isArray(roleData) ? roleData : []);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => { load(); }, []);

  function editUser(user) {
    setSelectedId(user.id);
    setMessage("");
    setForm({
      username: user.username || "",
      email: user.email || "",
      password: "",
      fullName: user.fullName || "",
      phone: user.phone || "",
      status: user.status || "ACTIVE",
      roleIds: (user.roles || []).map((role) => role.id),
      scopes: (user.scopes || []).map((scope) => ({
        scopeType: scope.scopeType,
        scopeId: scope.scopeId
      }))
    });
  }

  function toggleRole(id) {
    setForm((current) => ({
      ...current,
      roleIds: current.roleIds.includes(id)
        ? current.roleIds.filter((roleId) => roleId !== id)
        : [...current.roleIds, id]
    }));
  }

  function updateScope(index, field, value) {
    setForm((current) => ({
      ...current,
      scopes: current.scopes.map((scope, i) => i === index
        ? { ...scope, [field]: field === "scopeId" ? Number(value) : value }
        : scope)
    }));
  }

  async function save(event) {
    event.preventDefault();
    try {
      setError("");
      setMessage("");
      const payload = {
        ...form,
        password: form.password || undefined,
        scopes: form.scopes.filter((scope) => scope.scopeType && scope.scopeId)
      };
      await api(selectedId ? `/api/users/${selectedId}` : "/api/users", selectedId ? "PUT" : "POST", payload);
      setMessage(selectedId ? "User updated." : "User created.");
      setSelectedId(null);
      setForm(emptyForm);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function toggleStatus(user) {
    try {
      setError("");
      await api(`/api/users/${user.id}/status`, "PATCH", {
        status: user.status === "ACTIVE" ? "INACTIVE" : "ACTIVE"
      });
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <PageHeader title="Users" description="Manage administrator accounts, roles, access scopes, and status." />
      {error && <p className="error">{error}</p>}
      {message && <p className="ok">{message}</p>}
      <form className="card form-card" onSubmit={save}>
        <h3>{selectedId ? "Edit user" : "Create user"}</h3>
        <input required placeholder="Username" value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })} />
        <input required type="email" placeholder="Email" value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <PasswordField placeholder={selectedId ? "Temporary password (optional)" : "Temporary password"}
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <input required placeholder="Full name" value={form.fullName}
          onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
        <input placeholder="Phone" value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
        <strong>Assigned roles</strong>
        <div className="chips">
          {roles.map((role) => (
            <label key={role.id}>
              <input type="checkbox" checked={form.roleIds.includes(role.id)}
                onChange={() => toggleRole(role.id)} /> {role.name}
            </label>
          ))}
        </div>
        <strong>Assigned scope</strong>
        {form.scopes.map((scope, index) => (
          <div className="row" key={`${scope.scopeType}-${index}`}>
            <select value={scope.scopeType} onChange={(e) => updateScope(index, "scopeType", e.target.value)}>
              {["SCHOOL", "CAMPUS", "CLASS", "SECTION", "SUBJECT", "STUDENT"].map((type) =>
                <option key={type} value={type}>{type}</option>)}
            </select>
            <input required type="number" min="1" placeholder="Target ID" value={scope.scopeId}
              onChange={(e) => updateScope(index, "scopeId", e.target.value)} />
            <button type="button" className="secondary"
              onClick={() => setForm({ ...form, scopes: form.scopes.filter((_, i) => i !== index) })}>
              Remove
            </button>
          </div>
        ))}
        <button type="button" className="secondary"
          onClick={() => setForm({ ...form, scopes: [...form.scopes, { scopeType: "SCHOOL", scopeId: "" }] })}>
          Add scope
        </button>
        <div className="row">
          <button>{selectedId ? "Save changes" : "Create user"}</button>
          {selectedId && <button type="button" className="secondary"
            onClick={() => { setSelectedId(null); setForm(emptyForm); }}>Cancel</button>}
        </div>
      </form>
      <TableWrap>
      <table>
        <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Scope</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.fullName}</td>
              <td>{user.email}</td>
              <td>{(user.roles || []).map((role) => role.name).join(", ") || "—"}</td>
              <td>{(user.scopes || []).map((scope) => `${scope.scopeType}:${scope.scopeId}`).join(", ") || "—"}</td>
              <td><StatusBadge value={user.status} /></td>
              <td>
                <button className="secondary" onClick={() => editUser(user)}>View / edit</button>{" "}
                <button onClick={() => toggleStatus(user)}>
                  {user.status === "ACTIVE" ? "Deactivate" : "Activate"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </TableWrap>
    </div>
  );
}
