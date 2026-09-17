import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import PageHeader from "../components/PageHeader.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import TableWrap from "../components/TableWrap.jsx";

const emptyForm = { name: "", category: "GENERAL", academicYearId: "", classId: "", status: "ACTIVE", items: [] };

export default function FeeStructuresPage() {
  const [structures, setStructures] = useState([]);
  const [years, setYears] = useState([]);
  const [classes, setClasses] = useState([]);
  const [heads, setHeads] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [error, setError] = useState("");

  async function load() {
    const [structureRows, yearRows, classRows, headRows] = await Promise.all([
      api("/api/fee-structures"), api("/api/academic-years"),
      api("/api/classes"), api("/api/fee-heads")
    ]);
    setStructures(structureRows);
    setYears(yearRows);
    setClasses(classRows);
    setHeads(headRows.filter((head) => head.status === "ACTIVE"));
  }
  useEffect(() => { load().catch((err) => setError(err.message)); }, []);

  function setItem(index, field, value) {
    const items = form.items.map((item, i) => i === index ? { ...item, [field]: value } : item);
    setForm({ ...form, items });
  }

  function total(items) {
    return items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }

  async function save(e) {
    e.preventDefault();
    setError("");
    try {
      if (!form.items.length) throw new Error("Add at least one fee item");
      await api(editing ? `/api/fee-structures/${editing.id}` : "/api/fee-structures",
        editing ? "PUT" : "POST", {
          ...form,
          academicYearId: Number(form.academicYearId),
          classId: Number(form.classId),
          items: form.items.map((item) => ({ feeHeadId: Number(item.feeHeadId), amount: Number(item.amount) }))
        });
      setForm(emptyForm);
      setEditing(null);
      await load();
    } catch (err) { setError(err.message || "Unable to save fee structure"); }
  }

  async function open(row) {
    try { setViewing(await api(`/api/fee-structures/${row.id}`)); }
    catch (err) { setError(err.message); }
  }

  function edit(row) {
    setEditing(row);
    setForm({
      name: row.name, category: row.category, academicYearId: String(row.academicYearId),
      classId: String(row.classId), status: row.status || "ACTIVE",
      items: (row.items || []).map((item) => ({ feeHeadId: String(item.feeHeadId), amount: item.amount }))
    });
    setViewing(null);
  }

  async function changeStatus(row) {
    try {
      await api(`/api/fee-structures/${row.id}/status`, "PATCH",
        { status: row.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" });
      await load();
    } catch (err) { setError(err.message || "Unable to update status"); }
  }

  async function remove(row) {
    if (!window.confirm(`Delete ${row.name}?`)) return;
    try { await api(`/api/fee-structures/${row.id}`, "DELETE"); await load(); }
    catch (err) { setError(err.message || "Unable to delete fee structure"); }
  }

  return (
    <div>
      <PageHeader title="Fee structures" description="Combine fee heads into charges for a class and academic year." />
      <form className="card form-card" onSubmit={save}>
        <input required placeholder="Structure name" value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <select required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
          <option>GENERAL</option><option>STAFF_WARD</option><option>SCHOLARSHIP</option>
        </select>
        <select required value={form.academicYearId} onChange={(e) => setForm({ ...form, academicYearId: e.target.value })}>
          <option value="">Academic year</option>
          {years.map((year) => <option key={year.id} value={year.id}>{year.name}</option>)}
        </select>
        <select required value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value })}>
          <option value="">Class</option>
          {classes.map((schoolClass) => <option key={schoolClass.id} value={schoolClass.id}>{schoolClass.name}</option>)}
        </select>
        <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
          <option>ACTIVE</option><option>INACTIVE</option>
        </select>
        <h4>Fee items</h4>
        {form.items.map((item, index) => (
          <div className="form-row" key={index}>
            <select required value={item.feeHeadId} onChange={(e) => setItem(index, "feeHeadId", e.target.value)}>
              <option value="">Fee head</option>
              {heads.map((head) => <option key={head.id} value={head.id}>{head.name} ({head.code})</option>)}
            </select>
            <input required min="0" type="number" step="0.01" placeholder="Amount" value={item.amount}
              onChange={(e) => setItem(index, "amount", e.target.value)} />
            <button type="button" onClick={() => setForm({ ...form, items: form.items.filter((_, i) => i !== index) })}>Remove</button>
          </div>
        ))}
        <button type="button" onClick={() => setForm({ ...form, items: [...form.items, { feeHeadId: "", amount: "" }] })}>Add fee head</button>
        <strong>Total: {total(form.items).toFixed(2)}</strong>
        <button>{editing ? "Update structure" : "Create structure"}</button>
        {editing && <button type="button" onClick={() => { setEditing(null); setForm(emptyForm); }}>Cancel</button>}
      </form>
      {error && <div className="error">{error}</div>}
      <TableWrap>
      <table>
        <thead><tr><th>Name</th><th>Category</th><th>Academic Year</th><th>Class</th><th>Total Amount</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>{structures.map((row) => <tr key={row.id}>
          <td>{row.name}</td><td>{row.category}</td><td>{row.academicYear || row.academicYearId}</td>
          <td>{row.className || row.classId}</td><td>{Number(row.totalAmount || 0).toFixed(2)}</td><td><StatusBadge value={row.status} /></td>
          <td><button type="button" onClick={() => open(row)}>View</button>{" "}
            <button type="button" onClick={() => edit(row)}>Edit</button>{" "}
            <button type="button" onClick={() => changeStatus(row)}>{row.status === "ACTIVE" ? "Deactivate" : "Activate"}</button>{" "}
            <button type="button" onClick={() => remove(row)}>Delete</button></td>
        </tr>)}</tbody>
      </table>
      </TableWrap>
      {viewing && <div className="card">
        <h3>{viewing.name}</h3>
        <p>{viewing.category} | {viewing.academicYear} | {viewing.className} | Total: {Number(viewing.totalAmount || 0).toFixed(2)}</p>
        <ul>{(viewing.items || []).map((item) => <li key={item.id}>{item.feeHead}: {Number(item.amount).toFixed(2)}</li>)}</ul>
        <button type="button" onClick={() => setViewing(null)}>Close</button>
      </div>}
    </div>
  );
}
