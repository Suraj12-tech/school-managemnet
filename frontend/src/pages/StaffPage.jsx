import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { api } from "../api/client.js";
import ActionModal from "../components/ActionModal.jsx";
import BulkImportModal from "../components/BulkImportModal.jsx";
import PageHeader from "../components/PageHeader.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import TableWrap from "../components/TableWrap.jsx";
import { exportCsv } from "../utils/exportCsv.js";

const emptyForm = {
  employeeId: "", fullName: "", designation: "", staffCategory: "", departmentId: "", email: "", phone: "", status: "ACTIVE"
};

export default function StaffPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);

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
  useEffect(() => {
    const editId = new URLSearchParams(location.search).get("edit");
    const staff = rows.find((row) => String(row.id) === editId);
    if (staff) {
      edit(staff);
      navigate("/staff", { replace: true });
    }
  }, [location.search, rows]);

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
      staffCategory: staff.staffCategory || "", email: staff.email || "", phone: staff.phone || "", status: staff.status || "ACTIVE"
    });
    setShowForm(true);
  }

  async function toggleStatus(staff) {
    try {
      setError("");
      await api(`/api/staff/${staff.id}/status`, "PATCH", {
        status: staff.status === "ACTIVE" ? "INACTIVE" : "ACTIVE"
      });
      await load();
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
      staffCategory: row.staffCategory?.trim() || "",
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
        <button type="button" className="secondary" onClick={() => exportCsv("staff.csv", visibleRows.map((staff) => ({ employeeId: staff.employeeId, name: staff.fullName, designation: staff.designation, staffCategory: staff.staffCategory || "", status: staff.status })))}>Export</button>
      </div>
      <ActionModal open={showForm} title={editingId ? "Edit staff" : "Create staff"} onClose={closeForm}>
        <form className="card form-card" onSubmit={save}>
          <input required placeholder="Employee ID" value={form.employeeId}
            onChange={(e) => setForm({ ...form, employeeId: e.target.value })} />
          <input required placeholder="Full Name" value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          <input required placeholder="Designation" value={form.designation}
            onChange={(e) => setForm({ ...form, designation: e.target.value })} />
          <select value={form.staffCategory}
            onChange={(e) => setForm({ ...form, staffCategory: e.target.value })}>
            <option value="">Unclassified</option>
            <option value="TEACHING">Teaching</option>
            <option value="NON_TEACHING">Non-teaching</option>
          </select>
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
        columns={["employeeId", "fullName", "designation", "staffCategory", "departmentId", "email", "phone", "status"]}
        requiredColumns={["employeeId", "fullName", "designation", "departmentId", "email"]}
        existingKeys={staffImportKeys}
        keyOf={(row) => row.employeeId?.trim().toLowerCase()}
        mapRow={mapImportedStaff}
        createRow={(payload) => api("/api/staff", "POST", payload)}
      />
      <TableWrap>
      <table>
        <thead><tr><th>Employee ID</th><th>Name</th><th>Designation</th><th>Category</th><th>Department</th><th>Email</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>
          {visibleRows.map((staff) => <tr key={staff.id}>
            <td>{staff.employeeId}</td><td>{staff.fullName}</td><td>{staff.designation}</td>
            <td>{staff.staffCategory || "Unclassified"}</td>
            <td>{departmentLabel(staff)}</td><td>{staff.email}</td><td><StatusBadge value={staff.status} /></td>
            <td><Link className="teacher-list-action" to={`/staff/${staff.id}`}>View Profile</Link>{" "}
              <button type="button" className="secondary" onClick={() => edit(staff)}>Edit</button>{" "}
              <button type="button" onClick={() => toggleStatus(staff)}>
                {staff.status === "ACTIVE" ? "Deactivate" : "Activate"}
              </button></td>
          </tr>)}
          {!visibleRows.length && <tr><td colSpan="8" className="muted">No staff match the current filters.</td></tr>}
        </tbody>
      </table>
      </TableWrap>
    </div>
  );
}
