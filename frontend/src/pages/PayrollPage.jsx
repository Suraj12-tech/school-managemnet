import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import PageHeader from "../components/PageHeader.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import TableWrap from "../components/TableWrap.jsx";

const empty = { staffId: "", payPeriod: "", basicSalary: "", allowances: "0", deductions: "0", status: "PENDING", paymentDate: "", paymentMethod: "", referenceNo: "" };

export default function PayrollPage() {
  const [rows, setRows] = useState([]);
  const [staff, setStaff] = useState([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  async function load() {
    try { setError(""); setRows(await api("/api/payroll")); setStaff(await api("/api/staff")); }
    catch (err) { setError(err.message); }
  }
  useEffect(() => { load(); }, []);
  function update(field, value) { setForm({ ...form, [field]: value }); }
  async function save(event) {
    event.preventDefault();
    try {
      setError("");
      await api(editingId ? `/api/payroll/${editingId}` : "/api/payroll", editingId ? "PUT" : "POST", {
        ...form, staffId: Number(form.staffId), basicSalary: Number(form.basicSalary),
        allowances: Number(form.allowances || 0), deductions: Number(form.deductions || 0),
        paymentDate: form.paymentDate || undefined
      });
      setForm(empty); setEditingId(null); await load();
    } catch (err) { setError(err.message); }
  }
  function edit(row) {
    setEditingId(row.id);
    setForm({ staffId: row.staffId, payPeriod: row.payPeriod, basicSalary: row.basicSalary,
      allowances: row.allowances, deductions: row.deductions, status: row.status,
      paymentDate: row.paymentDate || "", paymentMethod: row.paymentMethod || "", referenceNo: row.referenceNo || "" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  async function remove(id) {
    if (!window.confirm("Delete this payroll record?")) return;
    try { await api(`/api/payroll/${id}`, "DELETE"); await load(); } catch (err) { setError(err.message); }
  }
  const visibleRows = rows.filter((row) =>
    `${row.staffName} ${row.employeeId} ${row.payPeriod}`.toLowerCase().includes(query.toLowerCase())
    && (statusFilter === "ALL" || row.status === statusFilter)
  );
  return <div>
    <PageHeader title="Teacher & staff payroll" description="Manage one payroll record per staff member and pay period." />
    {error && <p className="error">{error}</p>}
    <div className="card filter-bar"><input placeholder="Search payroll" value={query} onChange={(e) => setQuery(e.target.value)} /><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option value="ALL">All statuses</option><option>PENDING</option><option>PAID</option><option>CANCELLED</option></select></div>
    <form className="card form-card" onSubmit={save}>
      <h3>{editingId ? "Edit payroll" : "Create payroll"}</h3>
      <select required value={form.staffId} onChange={(e) => update("staffId", e.target.value)}>
        <option value="">Staff member</option>{staff.filter((row) => row.status === "ACTIVE").map((row) => <option key={row.id} value={row.id}>{row.fullName} ({row.employeeId})</option>)}
      </select>
      <input required type="month" value={form.payPeriod} onChange={(e) => update("payPeriod", e.target.value)} />
      <input required min="0" step="0.01" type="number" placeholder="Basic salary" value={form.basicSalary} onChange={(e) => update("basicSalary", e.target.value)} />
      <input min="0" step="0.01" type="number" placeholder="Allowances" value={form.allowances} onChange={(e) => update("allowances", e.target.value)} />
      <input min="0" step="0.01" type="number" placeholder="Deductions" value={form.deductions} onChange={(e) => update("deductions", e.target.value)} />
      <select value={form.status} onChange={(e) => update("status", e.target.value)}><option>PENDING</option><option>PAID</option><option>CANCELLED</option></select>
      <input type="date" value={form.paymentDate} onChange={(e) => update("paymentDate", e.target.value)} />
      <input placeholder="Payment method" value={form.paymentMethod} onChange={(e) => update("paymentMethod", e.target.value)} />
      <input placeholder="Reference (optional)" value={form.referenceNo} onChange={(e) => update("referenceNo", e.target.value)} />
      <div className="row"><button>{editingId ? "Save changes" : "Create payroll"}</button>{editingId && <button type="button" className="secondary" onClick={() => { setEditingId(null); setForm(empty); }}>Cancel</button>}</div>
    </form>
    <TableWrap><table><thead><tr><th>Employee</th><th>Pay period</th><th>Basic</th><th>Allowances</th><th>Deductions</th><th>Net salary</th><th>Status</th><th>Actions</th></tr></thead>
      <tbody>{visibleRows.map((row) => <tr key={row.id}><td>{row.staffName || row.employeeId}</td><td>{row.payPeriod}</td><td>{Number(row.basicSalary).toFixed(2)}</td><td>{Number(row.allowances).toFixed(2)}</td><td>{Number(row.deductions).toFixed(2)}</td><td><strong>{Number(row.netSalary).toFixed(2)}</strong></td><td><StatusBadge value={row.status} /></td><td><button type="button" className="secondary" onClick={() => edit(row)}>Edit</button>{" "}<button type="button" onClick={() => remove(row.id)}>Delete</button></td></tr>)}{!visibleRows.length && <tr><td colSpan="8" className="muted">No payroll records found.</td></tr>}</tbody>
    </table></TableWrap>
  </div>;
}
