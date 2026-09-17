import { useEffect, useState } from "react";
import { api } from "../api/client.js";

export default function FeeHeadsPage() {
  const [rows, setRows] = useState([]);
  const empty = { name: "", code: "", description: "", status: "ACTIVE" };
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");

  async function load() { setRows(await api("/api/fee-heads")); }
  useEffect(() => { load(); }, []);

  async function save(e) {
    e.preventDefault();
    setError("");
    try {
      await api(editing ? `/api/fee-heads/${editing.id}` : "/api/fee-heads", editing ? "PUT" : "POST", form);
      setForm(empty);
      setEditing(null);
      await load();
    } catch (err) { setError(err.message || "Unable to save fee head"); }
  }

  async function changeStatus(row) {
    try {
      await api(`/api/fee-heads/${row.id}/status`, "PATCH", { status: row.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" });
      await load();
    } catch (err) { setError(err.message || "Unable to update status"); }
  }

  async function remove(row) {
    if (!window.confirm(`Delete ${row.name}?`)) return;
    try { await api(`/api/fee-heads/${row.id}`, "DELETE"); await load(); }
    catch (err) { setError(err.message || "Unable to delete fee head"); }
  }

  return (
    <div>
      <h2>Fee Heads</h2>
      <form className="card" onSubmit={save}>
        <input required placeholder="Tuition" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input required placeholder="TUI" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
        <input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option>ACTIVE</option><option>INACTIVE</option></select>
        <button>{editing ? "Update fee head" : "Add fee head"}</button>
        {editing && <button type="button" onClick={() => { setEditing(null); setForm(empty); }}>Cancel</button>}
      </form>
      {error && <div className="error">{error}</div>}
      <table>
        <thead><tr><th>Name</th><th>Code</th><th>Description</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>{rows.map((r) => <tr key={r.id}>
          <td>{r.name}</td><td>{r.code}</td><td>{r.description || "-"}</td><td>{r.status}</td>
          <td><button type="button" onClick={() => window.alert(`${r.name}\n${r.description || "No description"}`)}>View</button>{" "}
            <button type="button" onClick={() => { setEditing(r); setForm({ name: r.name, code: r.code, description: r.description || "", status: r.status || "ACTIVE" }); }}>Edit</button>{" "}
            <button type="button" onClick={() => changeStatus(r)}>{r.status === "ACTIVE" ? "Deactivate" : "Activate"}</button>{" "}
            <button type="button" onClick={() => remove(r)}>Delete</button></td>
        </tr>)}</tbody>
      </table>
    </div>
  );
}
