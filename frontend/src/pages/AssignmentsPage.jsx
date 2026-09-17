import { useEffect, useState } from "react";
import { api } from "../api/client.js";

export default function AssignmentsPage() {
  const [rows, setRows] = useState([]);
  const [staff, setStaff] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [years, setYears] = useState([]);
  const [form, setForm] = useState({ staffId: "", subjectId: "", classId: "", sectionId: "", academicYearId: "" });

  async function load() {
    setRows(await api("/api/teacher-assignments"));
    setStaff(await api("/api/staff"));
    setSubjects(await api("/api/subjects"));
    setClasses(await api("/api/classes"));
    setSections(await api("/api/sections"));
    setYears(await api("/api/academic-years"));
  }
  useEffect(() => { load(); }, []);

  async function save(e) {
    e.preventDefault();
    await api("/api/teacher-assignments", "POST", {
      staffId: Number(form.staffId),
      subjectId: Number(form.subjectId),
      classId: Number(form.classId),
      sectionId: form.sectionId ? Number(form.sectionId) : null,
      academicYearId: Number(form.academicYearId)
    });
    load();
  }

  return (
    <div>
      <h2>Teacher Assignment Management</h2>
      <p className="muted">A subject teacher only gets that subject — not every subject in the school.</p>
      <form className="card" onSubmit={save}>
        <select value={form.staffId} onChange={(e) => setForm({ ...form, staffId: e.target.value })}>
          <option value="">Staff</option>{staff.map((s) => <option key={s.id} value={s.id}>{s.fullName}</option>)}
        </select>
        <select value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })}>
          <option value="">Subject</option>{subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value })}>
          <option value="">Class</option>{classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={form.sectionId} onChange={(e) => setForm({ ...form, sectionId: e.target.value })}>
          <option value="">Section (optional)</option>{sections.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={form.academicYearId} onChange={(e) => setForm({ ...form, academicYearId: e.target.value })}>
          <option value="">Year</option>{years.map((y) => <option key={y.id} value={y.id}>{y.name}</option>)}
        </select>
        <button>Assign</button>
      </form>
      <table>
        <thead><tr><th>Staff</th><th>Subject</th><th>Class</th><th>Section</th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}><td>{r.staffId}</td><td>{r.subjectId}</td><td>{r.classId}</td><td>{r.sectionId || "-"}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
