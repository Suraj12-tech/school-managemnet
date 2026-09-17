import { useEffect, useState } from "react";
import { api } from "../api/client.js";

export default function FeeHeadsPage() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({ name: "", code: "", description: "" });

  async function load() { setRows(await api("/api/fee-heads")); }
  useEffect(() => { load(); }, []);

  async function save(e) {
    e.preventDefault();
    await api("/api/fee-heads", "POST", form);
    setForm({ name: "", code: "", description: "" });
    load();
  }

  return (
    <div>
      <h2>Fee Heads</h2>
      <form className="card" onSubmit={save}>
        <input placeholder="Tuition" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input placeholder="TUI" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
        <input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <button>Add fee head</button>
      </form>
      <table>
        <thead><tr><th>Name</th><th>Code</th></tr></thead>
        <tbody>{rows.map((r) => <tr key={r.id}><td>{r.name}</td><td>{r.code}</td></tr>)}</tbody>
      </table>
    </div>
  );
}
