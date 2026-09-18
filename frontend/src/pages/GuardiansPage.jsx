import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import PageHeader from "../components/PageHeader.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import TableWrap from "../components/TableWrap.jsx";

const emptyForm = {
  fullName: "", relationType: "FATHER", phone: "", email: "", address: "",
  occupation: "", emergencyContact: false, status: "ACTIVE"
};

export default function GuardiansPage() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  async function load() {
    try { setError(""); setRows(await api("/api/guardians")); }
    catch (err) { setError(err.message); }
  }
  useEffect(() => { load(); }, []);

  async function save(e) {
    e.preventDefault();
    try {
      setError("");
      if (selected) await api("/api/guardians/" + selected.id, "PUT", form);
      else await api("/api/guardians", "POST", form);
      setForm(emptyForm);
      setSelected(null);
      load();
    } catch (err) { setError(err.message); }
  }

  async function inspect(id) {
    try { setSelected(await api("/api/guardians/" + id)); }
    catch (err) { setError(err.message); }
  }

  async function edit(row) {
    setSelected(row);
    try {
      const details = await api("/api/guardians/" + row.id);
      setSelected(details);
      setForm({ ...emptyForm, ...details });
    } catch (err) { setError(err.message); }
  }

  async function toggleStatus(row) {
    try {
      await api("/api/guardians/" + row.id + "/status", "PATCH",
        { status: row.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" });
      load();
      if (selected?.id === row.id) inspect(row.id);
    } catch (err) { setError(err.message); }
  }
  const visibleRows = rows.filter((row) =>
    `${row.fullName} ${row.email} ${row.phone}`.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div>
      <PageHeader title="Guardians" description="Manage guardian contact details and linked students." />
      {error && <p className="error">{error}</p>}
      <div className="card filter-bar"><input placeholder="Search guardians" value={query} onChange={(e) => setQuery(e.target.value)} /></div>
      <form className="card form-card" onSubmit={save}>
        <input required placeholder="Full name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
        <select value={form.relationType} onChange={(e) => setForm({ ...form, relationType: e.target.value })}>
          <option>FATHER</option><option>MOTHER</option><option>LEGAL_GUARDIAN</option><option>OTHER</option>
        </select>
        <input required placeholder="Mobile number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <input required type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input required placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        <input placeholder="Occupation (optional)" value={form.occupation || ""} onChange={(e) => setForm({ ...form, occupation: e.target.value })} />
        <label><input type="checkbox" checked={form.emergencyContact} onChange={(e) => setForm({ ...form, emergencyContact: e.target.checked })} /> Emergency contact</label>
        <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
          <option>ACTIVE</option><option>INACTIVE</option>
        </select>
        <div className="row"><button>{selected?.id ? "Update guardian" : "Save guardian"}</button>
          {selected && <button type="button" className="secondary" onClick={() => { setSelected(null); setForm(emptyForm); }}>Cancel</button>}</div>
      </form>
      <TableWrap>
      <table>
        <thead><tr><th>Name</th><th>Relation</th><th>Phone</th><th>Email</th><th>Students</th><th>Status</th><th /></tr></thead>
        <tbody>{visibleRows.map((g) => <tr key={g.id}>
          <td><button className="linkish" onClick={() => inspect(g.id)}>{g.fullName}</button></td>
          <td>{g.relationType}</td><td>{g.phone}</td><td>{g.email}</td><td>{g.linkedStudentCount}</td><td><StatusBadge value={g.status} /></td>
          <td><button className="secondary" onClick={() => edit(g)}>Edit</button> <button onClick={() => toggleStatus(g)}>{g.status === "ACTIVE" ? "Deactivate" : "Activate"}</button></td>
        </tr>)}{!visibleRows.length && <tr><td colSpan="7" className="muted">No guardians found.</td></tr>}</tbody>
      </table>
      </TableWrap>
      {selected?.students && <div className="card">
        <h3>{selected.fullName}</h3>
        <p>{selected.email} · {selected.phone} · {selected.address}</p>
        <p>Status: {selected.status} · Occupation: {selected.occupation || "-"}</p>
        <h4>Linked students</h4>
        <ul>{selected.students.map((s) => <li key={s.studentId}>{s.studentName} ({s.admissionNumber}) — {s.className || "-"} / {s.sectionName || "-"} — {s.relationshipType}{s.primaryGuardian ? " · Primary" : ""}{s.emergencyContact ? " · Emergency" : ""}</li>)}</ul>
      </div>}
    </div>
  );
}
