import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";
import PageHeader from "../components/PageHeader.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import TableWrap from "../components/TableWrap.jsx";

const emptyForm = {
  admissionNumber: "", firstName: "", lastName: "", dateOfBirth: "", gender: "",
  email: "", phone: "", academicYearId: "", classId: "", sectionId: "", status: "ACTIVE"
};

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [years, setYears] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  async function load() {
    try {
      setError("");
      const studentData = await api("/api/students");
      setStudents(studentData || []);
      const [classResult, sectionResult, yearResult] = await Promise.allSettled([
        api("/api/classes"), api("/api/sections"), api("/api/academic-years")
      ]);
      if (classResult.status === "fulfilled") setClasses(classResult.value || []);
      if (sectionResult.status === "fulfilled") setSections(sectionResult.value || []);
      if (yearResult.status === "fulfilled") setYears(yearResult.value || []);
    } catch (err) { setError(err.message); }
  }
  useEffect(() => { load(); }, []);

  async function save(event) {
    event.preventDefault();
    try {
      setError("");
      const payload = {
        ...form,
        dateOfBirth: form.dateOfBirth || undefined,
        email: form.email || undefined,
        phone: form.phone || undefined,
        academicYearId: form.academicYearId ? Number(form.academicYearId) : undefined,
        classId: form.classId ? Number(form.classId) : undefined,
        sectionId: form.sectionId ? Number(form.sectionId) : undefined
      };
      await api(editingId ? `/api/students/${editingId}` : "/api/students", editingId ? "PUT" : "POST", payload);
      setForm(emptyForm);
      setEditingId(null);
      await load();
    } catch (err) { setError(err.message); }
  }

  function edit(student) {
    setEditingId(student.id);
    setForm({
      admissionNumber: student.admissionNumber || "", firstName: student.firstName || "",
      lastName: student.lastName || "", dateOfBirth: student.dateOfBirth || "",
      gender: student.gender || "", email: student.email || "", phone: student.phone || "",
      academicYearId: "", classId: "", sectionId: "", status: student.status || "ACTIVE"
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function toggleStatus(student) {
    try {
      await api(`/api/students/${student.id}/status`, "PATCH", {
        status: student.status === "ACTIVE" ? "INACTIVE" : "ACTIVE"
      });
      await load();
    } catch (err) { setError(err.message); }
  }

  const visibleSections = sections.filter((section) =>
    (!form.classId || String(section.classId) === String(form.classId))
    && (!form.academicYearId || String(section.academicYearId) === String(form.academicYearId))
  );
  const className = (id) => classes.find((item) => item.id === id)?.name || `#${id}`;
  const section = (id) => sections.find((item) => item.id === id);

  return (
    <div>
      <PageHeader title="Students" description="Maintain student records, enrollment, and account status." />
      {error && <p className="error">{error}</p>}
      <form className="card form-card" onSubmit={save}>
        <h3>{editingId ? "Edit student" : "Create student"}</h3>
        <input required placeholder="Admission No" value={form.admissionNumber}
          onChange={(e) => setForm({ ...form, admissionNumber: e.target.value })} />
        <input required placeholder="First Name" value={form.firstName}
          onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
        <input required placeholder="Last Name" value={form.lastName}
          onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
        <input type="date" max={today} value={form.dateOfBirth}
          onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} />
        <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
          <option value="">Gender</option><option>MALE</option><option>FEMALE</option><option>OTHER</option>
        </select>
        <input type="email" placeholder="Email (optional)" value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input placeholder="Mobile (optional)" value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        {!editingId && <>
          <select value={form.academicYearId} onChange={(e) => setForm({ ...form, academicYearId: e.target.value, classId: "", sectionId: "" })}>
            <option value="">Academic Year (optional)</option>
            {years.filter((year) => year.status !== "ARCHIVED").map((year) => <option key={year.id} value={year.id}>{year.name}</option>)}
          </select>
          <select value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value, sectionId: "" })}>
            <option value="">Class (optional)</option>
            {classes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
          <select value={form.sectionId} onChange={(e) => setForm({ ...form, sectionId: e.target.value })}>
            <option value="">Section (optional)</option>
            {visibleSections.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </>}
        <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
          <option>ACTIVE</option><option>INACTIVE</option>
        </select>
        <div className="row">
          <button>{editingId ? "Save changes" : "Create student"}</button>
          {editingId && <button type="button" className="secondary"
            onClick={() => { setEditingId(null); setForm(emptyForm); }}>Cancel</button>}
        </div>
      </form>
      <TableWrap>
      <table>
        <thead><tr><th>Admission No</th><th>Student Name</th><th>Class</th><th>Section</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>
          {students.map((student) => {
            const currentSection = section(student.currentSectionId);
            return <tr key={student.id}>
              <td><Link to={`/students/${student.id}`}>{student.admissionNumber}</Link></td>
              <td>{student.firstName} {student.lastName}</td>
              <td>{currentSection ? className(currentSection.classId) : "—"}</td>
              <td>{currentSection?.name || "—"}</td>
              <td><StatusBadge value={student.status} /></td>
              <td><button type="button" className="secondary" onClick={() => edit(student)}>View / edit</button>{" "}
                <button type="button" onClick={() => toggleStatus(student)}>
                  {student.status === "ACTIVE" ? "Deactivate" : "Activate"}
                </button></td>
            </tr>;
          })}
        </tbody>
      </table>
      </TableWrap>
    </div>
  );
}
