import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import PageHeader from "../components/PageHeader.jsx";

export default function ClassesPage() {
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [years, setYears] = useState([]);
  const [staff, setStaff] = useState([]);
  const [klass, setKlass] = useState({ name: "", numberOfClassrooms: 1 });
  const [section, setSection] = useState({
    name: "A", classId: "", academicYearId: "", classTeacherStaffId: "", status: "ACTIVE"
  });
  const [editingSectionId, setEditingSectionId] = useState(null);
  const [selectedClassDetails, setSelectedClassDetails] = useState(null);
  const [error, setError] = useState("");
  const sectionNames = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  async function loadSections() {
    setSections(await api("/api/sections"));
  }

  async function load() {
    try {
      setError("");
      setClasses(await api("/api/classes"));
      await loadSections();
      setYears(await api("/api/academic-years"));
      try { setStaff(await api("/api/staff")); } catch { setStaff([]); }
    } catch (err) { setError(err.message); }
  }
  useEffect(() => { load(); }, []);

  async function saveClass(e) {
    e.preventDefault();
    try {
      await api("/api/classes", "POST", { ...klass, numberOfClassrooms: Number(klass.numberOfClassrooms) });
      setKlass({ name: "", numberOfClassrooms: 1 });
      load();
    } catch (err) { setError(err.message); }
  }

  async function saveSection(e) {
    e.preventDefault();
    try {
      const payload = {
        name: section.name,
        classId: Number(section.classId),
        academicYearId: Number(section.academicYearId),
        classTeacherStaffId: section.classTeacherStaffId ? Number(section.classTeacherStaffId) : null,
        status: section.status
      };
      await api(
        editingSectionId ? `/api/sections/${editingSectionId}` : "/api/sections",
        editingSectionId ? "PUT" : "POST",
        editingSectionId ? { id: editingSectionId, ...payload } : payload
      );
      setSection({ name: "A", classId: "", academicYearId: "", classTeacherStaffId: "", status: "ACTIVE" });
      setEditingSectionId(null);
      setSelectedClassDetails(null);
      await load();
    } catch (err) { setError(err.message); }
  }

  function editSection(item) {
    setEditingSectionId(item.id);
    setSection({
      name: item.name,
      classId: String(item.classId),
      academicYearId: String(item.academicYearId),
      classTeacherStaffId: item.classTeacherStaffId ? String(item.classTeacherStaffId) : "",
      status: item.status || "ACTIVE"
    });
    setSelectedClassDetails(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function viewClass(item) {
    const classSections = sections.filter((candidate) =>
      String(candidate.classId) === String(item.classId)
      && String(candidate.academicYearId) === String(item.academicYearId)
    );
    setSelectedClassDetails({
      className: item.className || classes.find((c) => String(c.id) === String(item.classId))?.name || `Class ${item.classId}`,
      academicYearName: item.academicYearName || `Year ${item.academicYearId}`,
      status: classSections.every((candidate) => (candidate.status || "ACTIVE") === "ACTIVE") ? "ACTIVE" : "INACTIVE",
      sections: classSections,
      totalStudents: classSections.reduce((total, candidate) => total + Number(candidate.studentCount || 0), 0)
    });
  }

  function cancelEdit() {
    setEditingSectionId(null);
    setSection({ name: "A", classId: "", academicYearId: "", classTeacherStaffId: "", status: "ACTIVE" });
  }

  const selectedClass = classes.find((item) => String(item.id) === String(section.classId));
  const selectedYearSectionCount = sections.filter((item) =>
    String(item.classId) === String(section.classId)
    && String(item.academicYearId) === String(section.academicYearId)
    && item.id !== editingSectionId
  ).length;
  const sectionLimitReached = !editingSectionId
    && selectedClass
    && section.academicYearId
    && selectedYearSectionCount >= Number(selectedClass.numberOfClassrooms || 0);

  async function changeSectionStatus(id, status) {
    try {
      setError("");
      await api(`/api/sections/${id}/status`, "PATCH", { status });
      await load();
    } catch (err) { setError(err.message); }
  }

  async function deleteSection(id) {
    if (!window.confirm("Delete this section? Linked sections will be deactivated instead.")) return;
    try {
      setError("");
      await api(`/api/sections/${id}`, "DELETE");
      setSelectedClassDetails(null);
      await load();
    } catch (err) { setError(err.message); }
  }

  return (
    <div>
      <PageHeader title="Classes & sections" description="Create classes, organize sections, and assign class teachers." />
      {error && <p className="error">{error}</p>}
      <form className="card form-card" onSubmit={saveClass}>
        <h3>New class</h3>
        <input required placeholder="Class 1" value={klass.name} onChange={(e) => setKlass({ ...klass, name: e.target.value })} />
        <label>Number of classrooms</label>
        <input required min="1" type="number" value={klass.numberOfClassrooms} onChange={(e) => setKlass({ ...klass, numberOfClassrooms: e.target.value })} />
        <button>Create class</button>
      </form>
      <h3>Classes / Grades</h3>
      <table>
        <thead><tr><th>Class</th><th>Classrooms</th></tr></thead>
        <tbody>
          {classes.map((c) => <tr key={c.id}><td>{c.name}</td><td>{c.numberOfClassrooms}</td></tr>)}
        </tbody>
      </table>
      <form className="card form-card" onSubmit={saveSection}>
        <h3>{editingSectionId ? "Edit section" : "New section"}</h3>
        <select required value={section.classId} onChange={(e) => setSection({ ...section, classId: e.target.value })}>
          <option value="">Class</option>
          {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select required value={section.academicYearId} onChange={(e) => setSection({ ...section, academicYearId: e.target.value })}>
          <option value="">Year</option>
          {years.filter((y) => y.status !== "ARCHIVED").map((y) => <option key={y.id} value={y.id}>{y.name}</option>)}
        </select>
        <select value={section.name} onChange={(e) => setSection({ ...section, name: e.target.value })}>
          {sectionNames.map((name) => <option key={name} value={name}>{name}</option>)}
        </select>
        <select value={section.classTeacherStaffId} onChange={(e) => setSection({ ...section, classTeacherStaffId: e.target.value })}>
          <option value="">Class teacher (optional)</option>
          {staff.map((s) => <option key={s.id} value={s.id}>{s.fullName}</option>)}
        </select>
        <select value={section.status} onChange={(e) => setSection({ ...section, status: e.target.value })}>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
        {sectionLimitReached && (
          <p className="error">
            Alert: {selectedClass.name} already has {selectedYearSectionCount} section(s) for this academic year,
            but only {selectedClass.numberOfClassrooms} classroom(s) are available.
          </p>
        )}
        <button disabled={sectionLimitReached}>{editingSectionId ? "Save changes" : "Create section"}</button>
        {editingSectionId && <button type="button" onClick={cancelEdit}>Cancel</button>}
      </form>
      {selectedClassDetails && (
        <div className="card">
          <h3>Class Details</h3>
          <p><strong>Class:</strong> {selectedClassDetails.className}</p>
          <p><strong>Academic Year:</strong> {selectedClassDetails.academicYearName}</p>
          <p><strong>Status:</strong> {selectedClassDetails.status === "ACTIVE" ? "Active" : "Inactive"}</p>
          <h4>Sections</h4>
          <table>
            <thead>
              <tr><th>Section</th><th>Class Teacher</th><th>Students</th></tr>
            </thead>
            <tbody>
              {selectedClassDetails.sections.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.classTeacherName || "—"}</td>
                  <td>{item.studentCount ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p><strong>Total Sections:</strong> {selectedClassDetails.sections.length}</p>
          <p><strong>Total Students:</strong> {selectedClassDetails.totalStudents}</p>
        </div>
      )}
      <h3>Section List</h3>
      <table>
        <thead>
          <tr>
            <th>Section</th>
            <th>Class</th>
            <th>Academic Year</th>
            <th>Class Teacher</th>
            <th>Students</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {sections.map((s) => (
            <tr key={s.id}>
              <td>{s.name}</td>
              <td>{s.className || classes.find((c) => String(c.id) === String(s.classId))?.name || `Class ${s.classId}`}</td>
              <td>{s.academicYearName || `Year ${s.academicYearId}`}</td>
              <td>{s.classTeacherName || "Not assigned"}</td>
              <td>{s.studentCount ?? 0}</td>
              <td>
                <select
                  value={s.status || "ACTIVE"}
                  onChange={(e) => changeSectionStatus(s.id, e.target.value)}
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </td>
              <td>
                <button type="button" onClick={() => viewClass(s)}>View</button>{" "}
                <button type="button" onClick={() => editSection(s)}>Edit</button>{" "}
                <button type="button" onClick={() => deleteSection(s.id)}>Delete</button>
              </td>
            </tr>
          ))}
          {!sections.length && (
            <tr><td colSpan="7">No sections created yet.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
