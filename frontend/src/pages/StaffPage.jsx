import { useEffect, useState } from "react";
import { api } from "../api/client.js";

export default function StaffPage() {
  const [rows, setRows] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState({ employeeId: "", fullName: "", designation: "Teacher", departmentId: "", phone: "", email: "", status: "ACTIVE" });

  async function load() {
    setRows(await api("/api/staff"));
    try { setDepartments(await api("/api/departments")); } catch { setDepartments([]); }
  }
  useEffect(() => { load(); }, []);

  async function save(e) {
    e.preventDefault();
    await api("/api/staff", "POST", {
      ...form,
      departmentId: form.departmentId ? Number(form.departmentId) : null
    });
    load();
  }

  return (
    <div>
      <h2>Staff List</h2>
      <form className="card" onSubmit={save}>
        <input placeholder="Employee ID" value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} />
        <input placeholder="Full name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
        <input placeholder="Designation" value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} />
        <select value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value })}>
          <option value="">Department</option>
          {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <button>Create staff</button>
      </form>
      <table>
        <thead><tr><th>Emp ID</th><th>Name</th><th>Designation</th><th>Status</th></tr></thead>
        <tbody>{rows.map((s) => <tr key={s.id}><td>{s.employeeId}</td><td>{s.fullName}</td><td>{s.designation}</td><td>{s.status}</td></tr>)}</tbody>
      </table>
    </div>
  );
}
