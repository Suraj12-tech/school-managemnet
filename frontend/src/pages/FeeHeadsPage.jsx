import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import ActionModal from "../components/ActionModal.jsx";
import PageHeader from "../components/PageHeader.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import TableWrap from "../components/TableWrap.jsx";

export default function FeeHeadsPage() {
  const [rows, setRows] = useState([]);
  const empty = { name: "", code: "", description: "", status: "ACTIVE" };
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  async function load() { setRows(await api("/api/fee-heads")); }
  useEffect(() => { load(); }, []);

  function openForm(row) {
    if (row) {
      setEditing(row);
      setForm({ name: row.name, code: row.code, description: row.description || "", status: row.status || "ACTIVE" });
    } else {
      setEditing(null);
      setForm(empty);
    }
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditing(null);
    setForm(empty);
  }

  async function save(e) {
    e.preventDefault();
    setError("");
    try {
      await api(editing ? `/api/fee-heads/${editing.id}` : "/api/fee-heads", editing ? "PUT" : "POST", form);
      closeForm();
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
  const visibleRows = rows.filter((row) => `${row.name} ${row.code} ${row.description || ""}`.toLowerCase().includes(query.toLowerCase()));

  return (
    <div>
      <PageHeader title="Fee heads" description="Define the charges used to build fee structures." actions={<button type="button" onClick={() => openForm()}>Add Fee Head</button>} />
      <ActionModal open={showForm} title={editing ? "Edit fee head" : "Create fee head"} onClose={closeForm}>
        <form className="card form-card" onSubmit={save}>
          <input required placeholder="Tuition" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input required placeholder="TUI" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
          <input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option>ACTIVE</option><option>INACTIVE</option></select>
          <button>{editing ? "Update fee head" : "Add fee head"}</button>
          {editing && <button type="button" className="secondary" onClick={closeForm}>Cancel</button>}
        </form>
      </ActionModal>
      <div className="card filter-bar"><input placeholder="Search fee heads" value={query} onChange={(e) => setQuery(e.target.value)} /></div>
      {error && <div className="error">{error}</div>}
      <TableWrap>
      <table>
        <thead><tr><th>Name</th><th>Code</th><th>Description</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>{visibleRows.map((r) => <tr key={r.id}>
          <td>{r.name}</td><td>{r.code}</td><td>{r.description || "-"}</td><td><StatusBadge value={r.status} /></td>
          <td><button type="button" onClick={() => window.alert(`${r.name}\n${r.description || "No description"}`)}>View</button>{" "}
            <button type="button" onClick={() => openForm(r)}>Edit</button>{" "}
            <button type="button" onClick={() => changeStatus(r)}>{r.status === "ACTIVE" ? "Deactivate" : "Activate"}</button>{" "}
            <button type="button" onClick={() => remove(r)}>Delete</button></td>
        </tr>)}{!visibleRows.length && <tr><td colSpan="5" className="muted">No fee heads found.</td></tr>}</tbody>
      </table>
      </TableWrap>
    </div>
  );
}
