import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import PageHeader from "../components/PageHeader.jsx";
import TableWrap from "../components/TableWrap.jsx";

const empty = { title: "", category: "", amount: "", expenseDate: "", description: "", status: "PENDING", paymentMethod: "", referenceNo: "" };

export default function ExpensesPage() {
  const [rows, setRows] = useState([]); const [form, setForm] = useState(empty); const [editingId, setEditingId] = useState(null); const [error, setError] = useState("");
  const [query, setQuery] = useState(""); const [statusFilter, setStatusFilter] = useState("ALL");
  async function load() { try { setRows(await api("/api/expenses")); } catch (err) { setError(err.message); } }
  useEffect(() => { load(); }, []);
  function update(field, value) { setForm({ ...form, [field]: value }); }
  async function save(event) {
    event.preventDefault();
    try { await api(editingId ? `/api/expenses/${editingId}` : "/api/expenses", editingId ? "PUT" : "POST", { ...form, amount: Number(form.amount) }); setForm(empty); setEditingId(null); await load(); }
    catch (err) { setError(err.message); }
  }
  function edit(row) { setEditingId(row.id); setForm({ title: row.title, category: row.category, amount: row.amount, expenseDate: row.expenseDate, description: row.description || "", status: row.status, paymentMethod: row.paymentMethod || "", referenceNo: row.referenceNo || "" }); }
  async function remove(id) { if (!window.confirm("Delete this expense?")) return; try { await api(`/api/expenses/${id}`, "DELETE"); await load(); } catch (err) { setError(err.message); } }
  const visibleRows = rows.filter((row) => `${row.title} ${row.category} ${row.description || ""}`.toLowerCase().includes(query.toLowerCase()) && (statusFilter === "ALL" || row.status === statusFilter));
  return <div><PageHeader title="Expenses" description="Track school operating expenses and their payment status." />{error && <p className="error">{error}</p>}
    <div className="card filter-bar"><input placeholder="Search expenses" value={query} onChange={(e) => setQuery(e.target.value)} /><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option value="ALL">All statuses</option><option>PENDING</option><option>PAID</option><option>CANCELLED</option></select></div>
    <form className="card form-card" onSubmit={save}><h3>{editingId ? "Edit expense" : "Create expense"}</h3>
      <input required placeholder="Expense title" value={form.title} onChange={(e) => update("title", e.target.value)} /><input required placeholder="Category" value={form.category} onChange={(e) => update("category", e.target.value)} /><input required min="0.01" step="0.01" type="number" placeholder="Amount" value={form.amount} onChange={(e) => update("amount", e.target.value)} /><input required type="date" value={form.expenseDate} onChange={(e) => update("expenseDate", e.target.value)} /><textarea placeholder="Description" value={form.description} onChange={(e) => update("description", e.target.value)} /><select value={form.status} onChange={(e) => update("status", e.target.value)}><option>PENDING</option><option>PAID</option><option>CANCELLED</option></select><input placeholder="Payment method" value={form.paymentMethod} onChange={(e) => update("paymentMethod", e.target.value)} /><input placeholder="Reference (optional)" value={form.referenceNo} onChange={(e) => update("referenceNo", e.target.value)} /><div className="row"><button>{editingId ? "Save changes" : "Create expense"}</button>{editingId && <button type="button" className="secondary" onClick={() => { setEditingId(null); setForm(empty); }}>Cancel</button>}</div>
    </form>
    <TableWrap><table><thead><tr><th>Date</th><th>Title</th><th>Category</th><th>Amount</th><th>Status</th><th>Payment method</th><th>Actions</th></tr></thead><tbody>{visibleRows.map((row) => <tr key={row.id}><td>{row.expenseDate}</td><td>{row.title}</td><td>{row.category}</td><td>{Number(row.amount).toFixed(2)}</td><td>{row.status}</td><td>{row.paymentMethod || "—"}</td><td><button type="button" className="secondary" onClick={() => edit(row)}>Edit</button>{" "}<button type="button" onClick={() => remove(row.id)}>Delete</button></td></tr>)}{!visibleRows.length && <tr><td colSpan="7" className="muted">No expenses found.</td></tr>}</tbody></table></TableWrap>
  </div>;
}
