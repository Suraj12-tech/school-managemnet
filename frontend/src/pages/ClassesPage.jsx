import { useEffect, useState } from "react";
import { api } from "../api/client.js";

export default function ClassesPage() {
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [years, setYears] = useState([]);
  const [staff, setStaff] = useState([]);
  const [klass, setKlass] = useState({ name: "", gradeLevel: 1 });
  const [section, setSection] = useState({ name: "A", classId: "", academicYearId: "", classTeacherStaffId: "" });

  async function load() {
    setClasses(await api("/api/classes"));
    setSections(await api("/api/sections"));
    setYears(await api("/api/academic-years"));
    try { setStaff(await api("/api/staff")); } catch { setStaff([]); }
  }
  useEffect(() => { load(); }, []);

  async function saveClass(e) {
    e.preventDefault();
    await api("/api/classes", "POST", { ...klass, gradeLevel: Number(klass.gradeLevel) });
    load();
  }

  async function saveSection(e) {
    e.preventDefault();
    await api("/api/sections", "POST", {
      name: section.name,
      classId: Number(section.classId),
      academicYearId: Number(section.academicYearId),
      classTeacherStaffId: section.classTeacherStaffId ? Number(section.classTeacherStaffId) : null
    });
    load();
  }

  return (
    <div>
      <h2>Class & Section Management</h2>
      <form className="card" onSubmit={saveClass}>
        <h3>New class / grade</h3>
        <input placeholder="Class 1" value={klass.name} onChange={(e) => setKlass({ ...klass, name: e.target.value })} />
        <input type="number" value={klass.gradeLevel} onChange={(e) => setKlass({ ...klass, gradeLevel: e.target.value })} />
        <button>Create class</button>
      </form>
      <form className="card" onSubmit={saveSection}>
        <h3>New section</h3>
        <select value={section.classId} onChange={(e) => setSection({ ...section, classId: e.target.value })}>
          <option value="">Class</option>
          {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={section.academicYearId} onChange={(e) => setSection({ ...section, academicYearId: e.target.value })}>
          <option value="">Year</option>
          {years.map((y) => <option key={y.id} value={y.id}>{y.name}</option>)}
        </select>
        <input value={section.name} onChange={(e) => setSection({ ...section, name: e.target.value })} />
        <select value={section.classTeacherStaffId} onChange={(e) => setSection({ ...section, classTeacherStaffId: e.target.value })}>
          <option value="">Class teacher (optional)</option>
          {staff.map((s) => <option key={s.id} value={s.id}>{s.fullName}</option>)}
        </select>
        <button>Create section</button>
      </form>
      <table>
        <thead><tr><th>Section</th><th>Class ID</th><th>Year ID</th><th>Teacher ID</th></tr></thead>
        <tbody>
          {sections.map((s) => (
            <tr key={s.id}><td>{s.name}</td><td>{s.classId}</td><td>{s.academicYearId}</td><td>{s.classTeacherStaffId || "-"}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
