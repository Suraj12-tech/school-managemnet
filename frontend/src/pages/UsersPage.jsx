import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import ActionModal from "../components/ActionModal.jsx";
import PasswordField from "../components/PasswordField.jsx";
import PageHeader from "../components/PageHeader.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import TableWrap from "../components/TableWrap.jsx";

const emptyForm = {
  username: "", email: "", password: "", fullName: "", phone: "", status: "ACTIVE",
  roleIds: [], scopes: [], staffId: ""
};

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [staffOptions, setStaffOptions] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [selectedId, setSelectedId] = useState(null);
  const [initialStaffId, setInitialStaffId] = useState("");
  const [staffLinkConflict, setStaffLinkConflict] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showForm, setShowForm] = useState(false);

  async function load() {
    try {
      setError("");
      const [userData, roleData, staffData] = await Promise.all([
        api("/api/users"), api("/api/roles"), api("/api/users/teacher-staff-options")
      ]);
      setUsers(Array.isArray(userData) ? userData : []);
      setRoles(Array.isArray(roleData) ? roleData : []);
      setStaffOptions(Array.isArray(staffData) ? staffData : []);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => { load(); }, []);

  function openCreate() {
    setSelectedId(null);
    setInitialStaffId("");
    setStaffLinkConflict(false);
    setMessage("");
    setForm(emptyForm);
    setShowForm(true);
  }

  function editUser(user) {
    setSelectedId(user.id);
    const linkedStaff = staffOptions.filter((staff) => staff.linkedUserId === user.id);
    const staffId = linkedStaff.length === 1 ? String(linkedStaff[0].id) : "";
    setInitialStaffId(staffId);
    setStaffLinkConflict(linkedStaff.length > 1);
    setMessage("");
    setForm({
      username: user.username || "",
      email: user.email || "",
      password: "",
      fullName: user.fullName || "",
      phone: user.phone || "",
      status: user.status || "ACTIVE",
      roleIds: (user.roles || []).map((role) => role.id),
      staffId,
      scopes: (user.scopes || []).map((scope) => ({
        scopeType: scope.scopeType,
        scopeId: scope.scopeId
      }))
    });
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setSelectedId(null);
    setInitialStaffId("");
    setStaffLinkConflict(false);
    setForm(emptyForm);
  }

  function toggleRole(id) {
    setForm((current) => ({
      ...current,
      roleIds: current.roleIds.includes(id)
        ? current.roleIds.filter((roleId) => roleId !== id)
        : [...current.roleIds, id]
    }));
  }

  function updateScope(index, field, value) {
    setForm((current) => ({
      ...current,
      scopes: current.scopes.map((scope, i) => i === index
        ? { ...scope, [field]: field === "scopeId" ? Number(value) : value }
        : scope)
    }));
  }

  async function save(event) {
    event.preventDefault();
    try {
      setError("");
      setMessage("");
      const { staffId, ...userFields } = form;
      const payload = {
        ...userFields,
        password: form.password || undefined,
        scopes: form.scopes.filter((scope) => scope.scopeType && scope.scopeId)
      };
      const savedUser = await api(selectedId ? `/api/users/${selectedId}` : "/api/users",
        selectedId ? "PUT" : "POST", payload);
      const userId = selectedId || savedUser.id;
      if (!selectedId) setSelectedId(userId);
      if (!staffLinkConflict && String(staffId || "") !== String(initialStaffId || "")) {
        if (staffId) {
          await api(`/api/users/${userId}/staff-link`, "PUT", { staffId: Number(staffId) });
        } else if (initialStaffId) {
          await api(`/api/users/${userId}/staff-link`, "DELETE");
        }
      }
      setMessage(selectedId ? "User updated." : "User created.");
      setInitialStaffId(staffId);
      closeForm();
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function toggleStatus(user) {
    try {
      setError("");
      await api(`/api/users/${user.id}/status`, "PATCH", {
        status: user.status === "ACTIVE" ? "INACTIVE" : "ACTIVE"
      });
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <PageHeader title="Users" description="Manage administrator accounts, roles, access scopes, and status." actions={<button type="button" onClick={openCreate}>Add User</button>} />
      {error && <p className="error">{error}</p>}
      {message && <p className="ok">{message}</p>}
      <ActionModal open={showForm} title={selectedId ? "Edit user" : "Create user"} onClose={closeForm}>
        <form className="card form-card" onSubmit={save}>
          <input required placeholder="Username" value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })} />
          <input required type="email" placeholder="Email" value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <PasswordField placeholder={selectedId ? "Temporary password (optional)" : "Temporary password"}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <input required placeholder="Full name" value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          <input placeholder="Phone" value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
          <strong>Linked Staff record</strong>
          {staffLinkConflict && <p className="error">Multiple Staff links are present. Resolve the conflict before changing this link.</p>}
          <select disabled={staffLinkConflict} value={form.staffId}
            onChange={(e) => setForm({ ...form, staffId: e.target.value })}>
            <option value="">No Staff link</option>
            {staffOptions.map((staff) => {
              const eligible = staff.status === "ACTIVE" && staff.staffCategory === "TEACHING";
              const linkedElsewhere = staff.linkedUserId && staff.linkedUserId !== selectedId;
              return <option key={staff.id} value={staff.id} disabled={!eligible || linkedElsewhere}>
                {staff.employeeId} — {staff.fullName}{eligible ? "" : " (ineligible)"}
                {linkedElsewhere ? " (linked to another user)" : ""}
              </option>;
            })}
          </select>
          <strong>Assigned roles</strong>
          <div className="chips">
            {roles.map((role) => (
              <label key={role.id}>
                <input type="checkbox" checked={form.roleIds.includes(role.id)}
                  onChange={() => toggleRole(role.id)} /> {role.name}
              </label>
            ))}
          </div>
          <strong>Assigned scope</strong>
          {form.scopes.map((scope, index) => (
            <div className="row" key={`${scope.scopeType}-${index}`}>
              <select value={scope.scopeType} onChange={(e) => updateScope(index, "scopeType", e.target.value)}>
                {["SCHOOL", "CAMPUS", "CLASS", "SECTION", "SUBJECT", "STUDENT"].map((type) =>
                  <option key={type} value={type}>{type}</option>)}
              </select>
              <input required type="number" min="1" placeholder="Target ID" value={scope.scopeId}
                onChange={(e) => updateScope(index, "scopeId", e.target.value)} />
              <button type="button" className="secondary"
                onClick={() => setForm({ ...form, scopes: form.scopes.filter((_, i) => i !== index) })}>
                Remove
              </button>
            </div>
          ))}
          <button type="button" className="secondary"
            onClick={() => setForm({ ...form, scopes: [...form.scopes, { scopeType: "SCHOOL", scopeId: "" }] })}>
            Add scope
          </button>
          <div className="row">
            <button>{selectedId ? "Save changes" : "Create user"}</button>
            {selectedId && <button type="button" className="secondary" onClick={closeForm}>Cancel</button>}
          </div>
        </form>
      </ActionModal>
      <TableWrap>
      <table>
        <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Staff</th><th>Scope</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.fullName}</td>
              <td>{user.email}</td>
              <td>{(user.roles || []).map((role) => role.name).join(", ") || "—"}</td>
              <td>{staffOptions.filter((staff) => staff.linkedUserId === user.id).map((staff) => staff.fullName).join(", ") || "—"}</td>
              <td>{(user.scopes || []).map((scope) => `${scope.scopeType}:${scope.scopeId}`).join(", ") || "—"}</td>
              <td><StatusBadge value={user.status} /></td>
              <td>
                <button className="secondary" onClick={() => editUser(user)}>Edit</button>{" "}
                <button onClick={() => toggleStatus(user)}>
                  {user.status === "ACTIVE" ? "Deactivate" : "Activate"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </TableWrap>
    </div>
  );
}
