import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import PageHeader from "../components/PageHeader.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import TableWrap from "../components/TableWrap.jsx";

const emptyForm = {
  employeeId: "", fullName: "", designation: "", departmentId: "", email: "", phone: "", status: "ACTIVE"
};

export default function StaffPage() {
  const [rows, setRows] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");

  async function load() {
    try {
      setError("");
      const [staff, departmentData] = await Promise.all([
        api("/api/staff"), api("/api/departments")
      ]);
      setRows(staff || []);
      setDepartments(departmentData || []);
    } catch (err) { setError(err.message); }
  }
  useEffect(() => { load(); }, []);

  async function save(event) {
    event.preventDefault();
    try {
      setError("");
      const payload = {
        ...form,
        departmentId: Number.parseInt(form.departmentId, 10),
        phone: form.phone || undefined
      };
      await api(editingId ? `/api/staff/${editingId}` : "/api/staff",
        editingId ? "PUT" : "POST", payload);
      setForm(emptyForm);
      setEditingId(null);
      await load();
    } catch (err) { setError(err.message); }
  }

  function departmentLabel(staff) {
    return staff.departmentName
      || departments.find((department) => String(department.id) === String(staff.departmentId))?.name
      || "—";
  }

  function edit(staff) {
    setEditingId(staff.id);
    setForm({
      employeeId: staff.employeeId || "", fullName: staff.fullName || "",
      designation: staff.designation || "", departmentId: staff.departmentId || "",
      email: staff.email || "", phone: staff.phone || "", status: staff.status || "ACTIVE"
    });
    setProfile(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function view(staff) {
    try {
      setError("");
      setProfile(await api(`/api/staff/${staff.id}`));
    } catch (err) { setError(err.message); }
  }

  async function toggleStatus(staff) {
    try {
      setError("");
      await api(`/api/staff/${staff.id}/status`, "PATCH", {
        status: staff.status === "ACTIVE" ? "INACTIVE" : "ACTIVE"
      });
      await load();
      if (profile?.id === staff.id) await view(staff);
    } catch (err) { setError(err.message); }
  }

  return (
    <div>
      <PageHeader title="Staff" description="Maintain staff records and review teaching assignments." />
      {error && <p className="error">{error}</p>}
      <form className="card form-card" onSubmit={save}>
        <h3>{editingId ? "Edit staff" : "Create staff"}</h3>
        <input required placeholder="Employee ID" value={form.employeeId}
          onChange={(e) => setForm({ ...form, employeeId: e.target.value })} />
        <input required placeholder="Full Name" value={form.fullName}
          onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
        <input required placeholder="Designation" value={form.designation}
          onChange={(e) => setForm({ ...form, designation: e.target.value })} />
        <select required value={form.departmentId}
          onChange={(e) => setForm({ ...form, departmentId: e.target.value })}>
          <option value="">Department</option>
          {departments.filter((d) => d.status !== "INACTIVE").map((d) =>
            <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <input required type="email" placeholder="Email" value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input placeholder="Phone (optional)" value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
          <option>ACTIVE</option><option>INACTIVE</option>
        </select>
        <div className="row">
          <button>{editingId ? "Save changes" : "Create staff"}</button>
          {editingId && <button type="button" className="secondary"
            onClick={() => { setEditingId(null); setForm(emptyForm); }}>Cancel</button>}
        </div>
      </form>
      <TableWrap>
      <table>
        <thead><tr><th>Employee ID</th><th>Name</th><th>Designation</th><th>Department</th><th>Email</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>
          {rows.map((staff) => <tr key={staff.id}>
            <td>{staff.employeeId}</td><td>{staff.fullName}</td><td>{staff.designation}</td>
            <td>{departmentLabel(staff)}</td><td>{staff.email}</td><td><StatusBadge value={staff.status} /></td>
            <td><button type="button" className="secondary" onClick={() => view(staff)}>View</button>{" "}
              <button type="button" className="secondary" onClick={() => edit(staff)}>Edit</button>{" "}
              <button type="button" onClick={() => toggleStatus(staff)}>
                {staff.status === "ACTIVE" ? "Deactivate" : "Activate"}
              </button></td>
          </tr>)}
        </tbody>
      </table>
      </TableWrap>
      {profile && <div className="card">
        <h3>Staff Profile — {profile.employeeId}</h3>
        <p><strong>Name:</strong> {profile.fullName}</p>
        <p><strong>Designation:</strong> {profile.designation}</p>
        <p><strong>Department:</strong> {departmentLabel(profile)}</p>
        <p><strong>Email:</strong> {profile.email} · <strong>Phone:</strong> {profile.phone || "—"}</p>
        <p><strong>Status:</strong> {profile.status}</p>
        <h4>Subject / Class assignments</h4>
        {profile.assignments?.length ? <table>
          <thead><tr><th>Subject</th><th>Class</th><th>Section</th><th>Academic Year</th></tr></thead>
          <tbody>{profile.assignments.map((assignment) => <tr key={assignment.id}>
            <td>{assignment.subjectName || `#${assignment.subjectId}`}</td>
            <td>{assignment.className || `#${assignment.classId}`}</td>
            <td>{assignment.sectionName || "—"}</td>
            <td>{assignment.academicYearName || `#${assignment.academicYearId}`}</td>
          </tr>)}</tbody>
        </table> : <p className="muted">No assignments.</p>}
        <button type="button" className="secondary" onClick={() => setProfile(null)}>Close</button>
      </div>}
    </div>
  );
}
