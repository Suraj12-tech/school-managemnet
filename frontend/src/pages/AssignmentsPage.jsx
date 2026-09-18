import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import PageHeader from "../components/PageHeader.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import TableWrap from "../components/TableWrap.jsx";

const emptyForm = {
  staffId: "", subjectId: "", classId: "", sectionId: "", academicYearId: "",
  assignmentType: "SUBJECT_TEACHER", status: "ACTIVE"
};

export default function AssignmentsPage() {
  const [rows, setRows] = useState([]);
  const [staff, setStaff] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [years, setYears] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  async function load() {
    try {
      setError("");
      const [assignmentData, staffData, subjectData, classData, sectionData, yearData] = await Promise.all([
        api("/api/teacher-assignments"), api("/api/staff"), api("/api/subjects"),
        api("/api/classes"), api("/api/sections"), api("/api/academic-years")
      ]);
      setRows(assignmentData || []);
      setStaff(staffData || []);
      setSubjects(subjectData || []);
      setClasses(classData || []);
      setSections(sectionData || []);
      setYears(yearData || []);
    } catch (err) { setError(err.message); }
  }
  useEffect(() => { load(); }, []);

  async function save(event) {
    event.preventDefault();
    try {
      setError("");
      const payload = {
        ...form,
        staffId: Number(form.staffId),
        subjectId: form.assignmentType === "CLASS_TEACHER" ? undefined : Number(form.subjectId),
        classId: Number(form.classId),
        sectionId: form.sectionId ? Number(form.sectionId) : undefined,
        academicYearId: Number(form.academicYearId)
      };
      await api(editingId ? `/api/teacher-assignments/${editingId}` : "/api/teacher-assignments",
        editingId ? "PUT" : "POST", payload);
      setForm(emptyForm);
      setEditingId(null);
      await load();
    } catch (err) { setError(err.message); }
  }

  function edit(row) {
    setEditingId(row.id);
    setForm({
      staffId: String(row.staffId), subjectId: row.subjectId ? String(row.subjectId) : "",
      classId: String(row.classId), sectionId: row.sectionId ? String(row.sectionId) : "",
      academicYearId: String(row.academicYearId), assignmentType: row.assignmentType || "SUBJECT_TEACHER",
      status: row.status || "ACTIVE"
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function setStatus(row, status) {
    try {
      await api(`/api/teacher-assignments/${row.id}/status`, "PATCH", { status });
      await load();
    } catch (err) { setError(err.message); }
  }

  async function unassign(row) {
    if (!window.confirm(`Unassign ${row.teacherName || "this teacher"}?`)) return;
    try {
      await api(`/api/teacher-assignments/${row.id}`, "DELETE");
      await load();
    } catch (err) { setError(err.message); }
  }

  const filteredSections = sections.filter((section) =>
    (!form.classId || String(section.classId) === String(form.classId))
    && (!form.academicYearId || String(section.academicYearId) === String(form.academicYearId))
  );
  const visibleRows = rows.filter((row) =>
    `${row.teacherName} ${row.subjectName} ${row.className} ${row.sectionName} ${row.academicYearName}`.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div>
      <PageHeader title="Teacher assignments" description="Assign subject and class teachers for each academic year." />
      <p className="muted">Subject teachers require a subject; class teachers are assigned to one section.</p>
      {error && <p className="error">{error}</p>}
      <div className="card filter-bar"><input placeholder="Search assignments" value={query} onChange={(e) => setQuery(e.target.value)} /></div>
      <form className="card form-card" onSubmit={save}>
        <h3>{editingId ? "Edit assignment" : "New assignment"}</h3>
        <select required value={form.assignmentType}
          onChange={(e) => setForm({ ...form, assignmentType: e.target.value, subjectId: "" })}>
          <option value="SUBJECT_TEACHER">Subject Teacher</option>
          <option value="CLASS_TEACHER">Class Teacher</option>
        </select>
        <select required value={form.staffId} onChange={(e) => setForm({ ...form, staffId: e.target.value })}>
          <option value="">Teacher</option>
          {staff.filter((item) => item.status === "ACTIVE").map((item) =>
            <option key={item.id} value={item.id}>{item.fullName}</option>)}
        </select>
        {form.assignmentType === "SUBJECT_TEACHER" && (
          <select required value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })}>
            <option value="">Subject</option>
            {subjects.filter((item) => item.status === "ACTIVE").map((item) =>
              <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        )}
        <select required value={form.academicYearId}
          onChange={(e) => setForm({ ...form, academicYearId: e.target.value, sectionId: "" })}>
          <option value="">Academic Year</option>
          {years.filter((item) => item.status === "ACTIVE").map((item) =>
            <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
        <select required value={form.classId}
          onChange={(e) => setForm({ ...form, classId: e.target.value, sectionId: "" })}>
          <option value="">Class</option>
          {classes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
        <select required={form.assignmentType === "CLASS_TEACHER"} value={form.sectionId}
          onChange={(e) => setForm({ ...form, sectionId: e.target.value })}>
          <option value="">Section{form.assignmentType === "CLASS_TEACHER" ? "" : " (optional)"}</option>
          {filteredSections.filter((item) => item.status === "ACTIVE").map((item) =>
            <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
        <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
          <option>ACTIVE</option><option>INACTIVE</option>
        </select>
        <div className="row">
          <button>{editingId ? "Save changes" : "Assign teacher"}</button>
          {editingId && <button type="button" className="secondary"
            onClick={() => { setEditingId(null); setForm(emptyForm); }}>Cancel</button>}
        </div>
      </form>
      <TableWrap>
      <table>
        <thead><tr><th>Teacher</th><th>Subject</th><th>Class</th><th>Section</th><th>Academic Year</th><th>Type</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>
          {visibleRows.map((row) => <tr key={row.id}>
            <td>{row.teacherName || `#${row.staffId}`}</td>
            <td>{row.subjectName || "—"}</td><td>{row.className || `#${row.classId}`}</td>
            <td>{row.sectionName || "—"}</td><td>{row.academicYearName || `#${row.academicYearId}`}</td>
            <td>{row.assignmentType === "CLASS_TEACHER" ? "Class Teacher" : "Subject Teacher"}</td>
            <td><StatusBadge value={row.status} /></td>
            <td><button type="button" className="secondary" onClick={() => edit(row)}>Edit</button>{" "}
              {row.status === "ACTIVE"
                ? <button type="button" onClick={() => setStatus(row, "INACTIVE")}>Deactivate</button>
                : <button type="button" onClick={() => setStatus(row, "ACTIVE")}>Activate</button>}{" "}
              <button type="button" className="secondary" onClick={() => unassign(row)}>Unassign</button></td>
          </tr>)}{!visibleRows.length && <tr><td colSpan="8" className="muted">No assignments found.</td></tr>}
        </tbody>
      </table>
      </TableWrap>
    </div>
  );
}
