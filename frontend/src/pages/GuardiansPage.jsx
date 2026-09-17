import { useEffect, useState } from "react";
import { api } from "../api/client.js";

export default function GuardiansPage() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({ fullName: "", relationType: "FATHER", phone: "", email: "", address: "" });

  async function load() { setRows(await api("/api/guardians")); }
  useEffect(() => { load(); }, []);

  async function save(e) {
    e.preventDefault();
    await api("/api/guardians", "POST", form);
    setForm({ fullName: "", relationType: "FATHER", phone: "", email: "", address: "" });
    load();
  }

  return (
    <div>
      <h2>Guardian Management</h2>
      <form className="card" onSubmit={save}>
        <input placeholder="Full name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
        <select value={form.relationType} onChange={(e) => setForm({ ...form, relationType: e.target.value })}>
          <option>FATHER</option><option>MOTHER</option><option>GUARDIAN</option>
        </select>
        <input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <button>Create guardian</button>
      </form>
      <table>
        <thead><tr><th>Name</th><th>Relation</th><th>Phone</th></tr></thead>
        <tbody>{rows.map((g) => <tr key={g.id}><td>{g.fullName}</td><td>{g.relationType}</td><td>{g.phone}</td></tr>)}</tbody>
      </table>
    </div>
  );
}
