import { useEffect, useState } from "react";
import { api } from "../api/client.js";

const emptyFilters = { userId: "", module: "", action: "", from: "", to: "" };

export default function AuditPage() {
  const [rows, setRows] = useState([]);
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState(emptyFilters);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState("");

  async function load(next = filters) {
    const params = new URLSearchParams();
    Object.entries(next).forEach(([key, value]) => { if (value) params.set(key, value); });
    setRows(await api(`/api/audit-logs?${params.toString()}`));
  }

  useEffect(() => {
    Promise.all([api("/api/audit-logs/users"), api("/api/audit-logs")])
      .then(([userRows, auditRows]) => { setUsers(userRows); setRows(auditRows); })
      .catch((err) => setError(err.message));
  }, []);

  function apply(e) {
    e.preventDefault();
    setError("");
    load().catch((err) => setError(err.message));
  }

  function clear() {
    setFilters(emptyFilters);
    setError("");
    load(emptyFilters).catch((err) => setError(err.message));
  }

  return (
    <div>
      <h2>Audit Log</h2>
      {error && <p className="error">{error}</p>}
      <form className="card" onSubmit={apply}>
        <select value={filters.userId} onChange={(e) => setFilters({ ...filters, userId: e.target.value })}>
          <option value="">All users</option>
          {users.map((user) => <option key={user.id} value={user.id}>{user.name} ({user.email})</option>)}
        </select>
        <select value={filters.module} onChange={(e) => setFilters({ ...filters, module: e.target.value })}>
          <option value="">All modules</option>
          <option value="users">Users</option><option value="students">Students</option>
          <option value="staff">Staff</option><option value="classes">Classes</option>
          <option value="school">School</option><option value="fees">Fees</option>
          <option value="audit">Audit</option>
        </select>
        <select value={filters.action} onChange={(e) => setFilters({ ...filters, action: e.target.value })}>
          <option value="">All actions</option>
          {["CREATE", "EDIT", "DELETE", "LOGIN", "LOGOUT", "APPROVE", "FORGOT-PASSWORD", "RESET-PASSWORD"].map((action) =>
            <option key={action} value={action.toLowerCase()}>{action}</option>)}
        </select>
        <input type="date" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} />
        <input type="date" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} />
        <button type="submit">Apply Filters</button>
        <button type="button" onClick={clear}>Clear</button>
      </form>
      <table>
        <thead><tr><th>When</th><th>User</th><th>Module</th><th>Action</th><th>Entity</th><th>Details</th><th>View</th></tr></thead>
        <tbody>{rows.map((row) => <tr key={row.id}>
          <td>{row.createdAt}</td>
          <td>{row.userName || "System"}{row.userEmail ? ` (${row.userEmail})` : ""}</td>
          <td>{row.moduleName}</td><td>{row.actionName}</td>
          <td>{row.entityName} {row.entityId ? `#${row.entityId}` : ""}</td><td>{row.details}</td>
          <td><button type="button" onClick={() => setSelected(row)}>View</button></td>
        </tr>)}</tbody>
      </table>
      {selected && <div className="card">
        <h3>Audit Details</h3>
        <p>Timestamp: {selected.createdAt}</p>
        <p>User: {selected.userName || "System"} {selected.userEmail ? `(${selected.userEmail})` : ""}</p>
        <p>Module: {selected.moduleName}</p>
        <p>Action: {selected.actionName}</p>
        <p>Entity: {selected.entityName}</p>
        <p>Entity ID: {selected.entityId || "-"}</p>
        <p>Details: {selected.details || "-"}</p>
        <button type="button" onClick={() => setSelected(null)}>Close</button>
      </div>}
    </div>
  );
}
