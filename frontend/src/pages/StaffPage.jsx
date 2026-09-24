import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import ActionModal from "../components/ActionModal.jsx";
import BulkImportModal from "../components/BulkImportModal.jsx";
import PageHeader from "../components/PageHeader.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import TableWrap from "../components/TableWrap.jsx";
import { exportCsv } from "../utils/exportCsv.js";

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
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [profileTab, setProfileTab] = useState("overview");

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

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  }

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
      closeForm();
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
    setShowForm(true);
  }

  async function view(staff) {
    try {
      setError("");
      setProfile(await api(`/api/staff/${staff.id}`));
      setProfileTab("overview");
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
  const staffImportKeys = new Set(rows.map((staff) => String(staff.employeeId || "").trim().toLowerCase()));
  function mapImportedStaff(row) {
    const departmentId = Number(row.departmentId);
    if (!Number.isInteger(departmentId) || departmentId <= 0) throw new Error("departmentId must be a positive number");
    return {
      employeeId: row.employeeId?.trim(),
      fullName: row.fullName?.trim(),
      designation: row.designation?.trim(),
      departmentId,
      email: row.email?.trim(),
      phone: row.phone?.trim() || undefined,
      status: row.status?.trim() || "ACTIVE"
    };
  }
  const visibleRows = rows.filter((staff) =>
    `${staff.employeeId} ${staff.fullName} ${staff.designation} ${staff.email}`.toLowerCase().includes(query.toLowerCase())
    && (statusFilter === "ALL" || staff.status === statusFilter)
  );

  return (
    <div>
      <PageHeader title="Staff" description="Maintain staff records and review teaching assignments." actions={<>
        <button type="button" onClick={openCreate}>Add Staff</button>
        <button type="button" className="secondary" onClick={() => setShowImport(true)}>Import CSV</button>
      </>} />
      {error && <p className="error">{error}</p>}
      <div className="card filter-bar">
        <input placeholder="Search staff" value={query} onChange={(e) => setQuery(e.target.value)} />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option value="ALL">All statuses</option><option>ACTIVE</option><option>INACTIVE</option></select>
        <button type="button" className="secondary" onClick={() => exportCsv("staff.csv", visibleRows.map((staff) => ({ employeeId: staff.employeeId, name: staff.fullName, designation: staff.designation, status: staff.status })))}>Export</button>
      </div>
      <ActionModal open={showForm} title={editingId ? "Edit staff" : "Create staff"} onClose={closeForm}>
        <form className="card form-card" onSubmit={save}>
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
            {editingId && <button type="button" className="secondary" onClick={closeForm}>Cancel</button>}
          </div>
        </form>
      </ActionModal>
      <BulkImportModal
        open={showImport}
        onClose={() => { setShowImport(false); load(); }}
        title="Import staff"
        columns={["employeeId", "fullName", "designation", "departmentId", "email", "phone", "status"]}
        requiredColumns={["employeeId", "fullName", "designation", "departmentId", "email"]}
        existingKeys={staffImportKeys}
        keyOf={(row) => row.employeeId?.trim().toLowerCase()}
        mapRow={mapImportedStaff}
        createRow={(payload) => api("/api/staff", "POST", payload)}
      />
      <TableWrap>
      <table>
        <thead><tr><th>Employee ID</th><th>Name</th><th>Designation</th><th>Department</th><th>Email</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>
          {visibleRows.map((staff) => <tr key={staff.id}>
            <td>{staff.employeeId}</td><td>{staff.fullName}</td><td>{staff.designation}</td>
            <td>{departmentLabel(staff)}</td><td>{staff.email}</td><td><StatusBadge value={staff.status} /></td>
            <td><button type="button" className="secondary" onClick={() => view(staff)}>View</button>{" "}
              <button type="button" className="secondary" onClick={() => edit(staff)}>Edit</button>{" "}
              <button type="button" onClick={() => toggleStatus(staff)}>
                {staff.status === "ACTIVE" ? "Deactivate" : "Activate"}
              </button></td>
          </tr>)}
          {!visibleRows.length && <tr><td colSpan="7" className="muted">No staff match the current filters.</td></tr>}
        </tbody>
      </table>
      </TableWrap>
      {profile && <div className="card">
        <h3>Staff Profile — {profile.employeeId}</h3>
        <div className="tabs" role="tablist">
          <button type="button" className={profileTab === "overview" ? "tab active" : "tab"} onClick={() => setProfileTab("overview")}>Overview</button>
          <button type="button" className={profileTab === "assignments" ? "tab active" : "tab"} onClick={() => setProfileTab("assignments")}>Assignments</button>
        </div>
        {profileTab === "overview" && <>
          <p><strong>Name:</strong> {profile.fullName}</p>
          <p><strong>Designation:</strong> {profile.designation}</p>
          <p><strong>Department:</strong> {departmentLabel(profile)}</p>
          <p><strong>Email:</strong> {profile.email} · <strong>Phone:</strong> {profile.phone || "—"}</p>
          <p><strong>Status:</strong> {profile.status}</p>
        </>}
        {profileTab === "assignments" && <>
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
        </>}
        <button type="button" className="secondary" onClick={() => setProfile(null)}>Close</button>
      </div>}
    </div>
  );
}
