import { useEffect, useState } from "react";
import { api } from "../api/client.js";

export default function FeeStructuresPage() {
  const [structures, setStructures] = useState([]);
  const [years, setYears] = useState([]);
  const [classes, setClasses] = useState([]);
  const [heads, setHeads] = useState([]);
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState("");
  const [form, setForm] = useState({ name: "", category: "GENERAL", academicYearId: "", classId: "" });
  const [item, setItem] = useState({ feeHeadId: "", amount: "" });

  async function load() {
    setStructures(await api("/api/fee-structures"));
    setYears(await api("/api/academic-years"));
    setClasses(await api("/api/classes"));
    setHeads(await api("/api/fee-heads"));
  }
  useEffect(() => { load(); }, []);

  async function save(e) {
    e.preventDefault();
    await api("/api/fee-structures", "POST", {
      ...form,
      academicYearId: Number(form.academicYearId),
      classId: Number(form.classId)
    });
    load();
  }

  async function openItems(id) {
    setSelected(id);
    setItems(await api("/api/fee-structures/" + id + "/items"));
  }

  async function addItem(e) {
    e.preventDefault();
    await api("/api/fee-structure-items", "POST", {
      feeStructureId: Number(selected),
      feeHeadId: Number(item.feeHeadId),
      amount: Number(item.amount)
    });
    openItems(selected);
  }

  return (
    <div>
      <h2>Fee Structure</h2>
      <form className="card" onSubmit={save}>
        <input placeholder="Class 1 General" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
          <option>GENERAL</option><option>STAFF_WARD</option><option>SCHOLARSHIP</option>
        </select>
        <select value={form.academicYearId} onChange={(e) => setForm({ ...form, academicYearId: e.target.value })}>
          <option value="">Year</option>{years.map((y) => <option key={y.id} value={y.id}>{y.name}</option>)}
        </select>
        <select value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value })}>
          <option value="">Class</option>{classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button>Create structure</button>
      </form>
      <ul>
        {structures.map((s) => (
          <li key={s.id}>
            <button className="linkish" onClick={() => openItems(s.id)}>{s.name} ({s.category})</button>
          </li>
        ))}
      </ul>
      {selected && (
        <form className="card" onSubmit={addItem}>
          <h3>Items for structure #{selected}</h3>
          <select value={item.feeHeadId} onChange={(e) => setItem({ ...item, feeHeadId: e.target.value })}>
            <option value="">Fee head</option>{heads.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
          </select>
          <input placeholder="Amount" value={item.amount} onChange={(e) => setItem({ ...item, amount: e.target.value })} />
          <button>Add item</button>
          <ul>{items.map((i) => <li key={i.id}>Head {i.feeHeadId}: {i.amount}</li>)}</ul>
        </form>
      )}
    </div>
  );
}
