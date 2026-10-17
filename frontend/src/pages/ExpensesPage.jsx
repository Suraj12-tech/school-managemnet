import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import ActionModal from "../components/ActionModal.jsx";
import PageHeader from "../components/PageHeader.jsx";
import TableWrap from "../components/TableWrap.jsx";

const empty = { title: "", category: "", amount: "", expenseDate: "", description: "", status: "PENDING", paymentMethod: "", referenceNo: "" };

export default function ExpensesPage() {
  const [rows, setRows] = useState([]); const [form, setForm] = useState(empty); const [editingId, setEditingId] = useState(null); const [error, setError] = useState("");
  const [query, setQuery] = useState(""); const [statusFilter, setStatusFilter] = useState("ALL");
  const [showForm, setShowForm] = useState(false);
  async function load() { try { setRows(await api("/api/expenses")); } catch (err) { setError(err.message); } }
  useEffect(() => { load(); }, []);
  function update(field, value) { setForm({ ...form, [field]: value }); }
  function openCreate() { setEditingId(null); setForm(empty); setShowForm(true); }
  function openEdit(row) { setEditingId(row.id); setForm({ title: row.title, category: row.category, amount: row.amount, expenseDate: row.expenseDate, description: row.description || "", status: row.status, paymentMethod: row.paymentMethod || "", referenceNo: row.referenceNo || "" }); setShowForm(true); }
  function closeForm() { setShowForm(false); setEditingId(null); setForm(empty); }
  async function save(event) {
    event.preventDefault();
    try { await api(editingId ? `/api/expenses/${editingId}` : "/api/expenses", editingId ? "PUT" : "POST", { ...form, amount: Number(form.amount) }); closeForm(); await load(); }
    catch (err) { setError(err.message); }
  }
  async function remove(id) { if (!window.confirm("Delete this expense?")) return; try { await api(`/api/expenses/${id}`, "DELETE"); await load(); } catch (err) { setError(err.message); } }
  const visibleRows = rows.filter((row) => `${row.title} ${row.category} ${row.description || ""}`.toLowerCase().includes(query.toLowerCase()) && (statusFilter === "ALL" || row.status === statusFilter));
  const hasActiveFilters = query.trim() !== "" || statusFilter !== "ALL";
  return <div><PageHeader title="Expenses" description="Track school operating expenses and their payment status." actions={<button type="button" onClick={openCreate}>Add Expense</button>} />{error && <p className="error">{error}</p>}
    <div className="card filter-bar"><input placeholder="Search expenses" value={query} onChange={(e) => setQuery(e.target.value)} /><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option value="ALL">All statuses</option><option>PENDING</option><option>PAID</option><option>CANCELLED</option></select></div>
    <ActionModal open={showForm} title={editingId ? "Edit expense" : "Create Expense"} onClose={closeForm} size="lg">
      <form className="expense-form" onSubmit={save}>
        <label>Expense Title<input required placeholder="Enter expense title" value={form.title} onChange={(e) => update("title", e.target.value)} /></label>
        <label>Category<input required placeholder="Enter category" value={form.category} onChange={(e) => update("category", e.target.value)} /></label>
        <label>Amount<input required min="0.01" step="0.01" type="number" placeholder="Enter amount" value={form.amount} onChange={(e) => update("amount", e.target.value)} /></label>
        <label>Expense Date<input required type="date" value={form.expenseDate} onChange={(e) => update("expenseDate", e.target.value)} /></label>
        <label>Description<textarea placeholder="Enter description" value={form.description} onChange={(e) => update("description", e.target.value)} /></label>
        <label>Status<select value={form.status} onChange={(e) => update("status", e.target.value)}><option>PENDING</option><option>PAID</option><option>CANCELLED</option></select></label>
        <label>Payment Method<input placeholder="Enter payment method" value={form.paymentMethod} onChange={(e) => update("paymentMethod", e.target.value)} /></label>
        <label>Reference<input placeholder="Optional reference" value={form.referenceNo} onChange={(e) => update("referenceNo", e.target.value)} /></label>
        <div className="expense-form-actions">
          <button type="button" className="secondary" onClick={closeForm}>Cancel</button>
          <button type="submit">{editingId ? "Save changes" : "Create Expense"}</button>
        </div>
      </form>
    </ActionModal>
    {visibleRows.length ? <TableWrap><table><thead><tr><th>Date</th><th>Title</th><th>Category</th><th>Amount</th><th>Status</th><th>Payment method</th><th>Actions</th></tr></thead><tbody>{visibleRows.map((row) => <tr key={row.id}><td>{row.expenseDate}</td><td>{row.title}</td><td>{row.category}</td><td>{Number(row.amount).toFixed(2)}</td><td>{row.status}</td><td>{row.paymentMethod || "—"}</td><td><button type="button" className="secondary" onClick={() => openEdit(row)}>Edit</button>{" "}<button type="button" onClick={() => remove(row.id)}>Delete</button></td></tr>)}</tbody></table></TableWrap>
      : <section className="card expense-empty-state">
        <h3>No expenses found</h3>
        <p>{hasActiveFilters ? "There are no expenses matching the selected filters." : "There are currently no expense records."}</p>
        {hasActiveFilters
          ? <button type="button" className="secondary" onClick={() => { setQuery(""); setStatusFilter("ALL"); }}>Clear Filters</button>
          : <button type="button" onClick={openCreate}>Add Expense</button>}
      </section>}
  </div>;
}
