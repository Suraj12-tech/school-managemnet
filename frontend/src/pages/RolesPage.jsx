import { useEffect, useState, useMemo } from "react";
import { api } from "../api/client.js";
import ActionModal from "../components/ActionModal.jsx";
import PageHeader from "../components/PageHeader.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import {
  MODULE_DEFINITIONS,
  getPermissionLabel,
  getPermissionDescription,
  getModuleInfo
} from "../utils/permissionLabels.js";

const MODULE_ORDER = [
  "students",
  "staff",
  "classes",
  "subjects",
  "fees",
  "finance",
  "users",
  "school",
  "dashboard",
  "audit"
];

export default function RolesPage() {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [roleSearch, setRoleSearch] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [roleForm, setRoleForm] = useState({ name: "", description: "", sensitivity: "NORMAL" });
  const [editingRoleId, setEditingRoleId] = useState(null);
  const [showRoleForm, setShowRoleForm] = useState(false);

  async function load() {
    try {
      setError("");
      const [r, perms] = await Promise.all([
        api("/api/roles"),
        api("/api/permissions")
      ]);
      const rolesList = Array.isArray(r) ? r : [];
      setRoles(rolesList);
      setPermissions(Array.isArray(perms) ? perms : []);
      
      setSelected((prev) => {
        if (!prev && rolesList[0]) return rolesList[0];
        if (prev) {
          const updated = rolesList.find((item) => item.id === prev.id);
          return updated || rolesList[0] || null;
        }
        return null;
      });
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function hasPerm(id) {
    return selected?.permissions?.some((p) => p.id === id);
  }

  function toggle(id) {
    if (!selected) return;
    const current = selected.permissions || [];
    const next = hasPerm(id)
      ? current.filter((p) => p.id !== id)
      : [...current, permissions.find((p) => p.id === id)].filter(Boolean);
    setSelected({ ...selected, permissions: next });
  }

  function toggleModule(moduleKey, selectAll) {
    if (!selected) return;
    const modulePerms = permissions.filter((p) => p.getModuleName?.() === moduleKey || p.moduleName === moduleKey);
    const modulePermIds = new Set(modulePerms.map((p) => p.id));
    const current = selected.permissions || [];
    
    let next;
    if (selectAll) {
      const remaining = current.filter((p) => !modulePermIds.has(p.id));
      next = [...remaining, ...modulePerms];
    } else {
      next = current.filter((p) => !modulePermIds.has(p.id));
    }
    setSelected({ ...selected, permissions: next });
  }

  function selectAll() {
    if (!selected) return;
    setSelected({ ...selected, permissions: [...permissions] });
  }

  function deselectAll() {
    if (!selected) return;
    setSelected({ ...selected, permissions: [] });
  }

  function startRoleEdit(role) {
    setEditingRoleId(role.id);
    setRoleForm({ name: role.name || "", description: role.description || "", sensitivity: role.sensitivity || "NORMAL" });
    setShowRoleForm(true);
  }

  function openRoleForm() {
    setEditingRoleId(null);
    setRoleForm({ name: "", description: "", sensitivity: "NORMAL" });
    setShowRoleForm(true);
  }

  function cancelRoleEdit() {
    setEditingRoleId(null);
    setRoleForm({ name: "", description: "", sensitivity: "NORMAL" });
    setShowRoleForm(false);
  }

  async function saveRole(event) {
    event.preventDefault();
    try {
      setError("");
      const saved = await api(editingRoleId ? `/api/roles/${editingRoleId}` : "/api/roles",
        editingRoleId ? "PUT" : "POST", {
          ...roleForm,
          permissionIds: editingRoleId
            ? (selected?.permissions || []).map((permission) => permission.id)
            : []
        });
      setMessage(editingRoleId ? "Role updated." : "Role created.");
      cancelRoleEdit();
      await load();
      if (saved?.id) setSelected(saved);
    } catch (err) {
      setError(err.message);
    }
  }

  async function save() {
    if (!selected) return;
    try {
      setSaving(true);
      setError("");
      setMessage("");
      await api(`/api/roles/${selected.id}`, "PUT", {
        name: selected.name,
        description: selected.description,
        sensitivity: selected.sensitivity,
        permissionIds: (selected.permissions || []).map((p) => p.id)
      });
      setMessage(`Permissions successfully updated for role: ${selected.name}`);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  // Group and filter permissions by module
  const groupedPermissions = useMemo(() => {
    const map = new Map();

    // Initialize map in defined order
    MODULE_ORDER.forEach((mod) => map.set(mod, []));

    permissions.forEach((p) => {
      const mod = p.moduleName || "other";
      if (!map.has(mod)) {
        map.set(mod, []);
      }
      map.get(mod).push(p);
    });

    const result = [];
    map.forEach((perms, modKey) => {
      if (!perms.length) return;

      const modInfo = getModuleInfo(modKey);
      const filtered = perms.filter((p) => {
        const label = getPermissionLabel(p.moduleName, p.actionName);
        const desc = getPermissionDescription(p.moduleName, p.actionName, p.description);

        if (searchTerm) {
          const q = searchTerm.toLowerCase();
          const matchesLabel = label.toLowerCase().includes(q);
          const matchesDesc = desc.toLowerCase().includes(q);
          const matchesMod = modInfo.name.toLowerCase().includes(q);
          if (!matchesLabel && !matchesDesc && !matchesMod) return false;
        }

        if (categoryFilter !== "ALL") {
          const act = (p.actionName || "").toLowerCase();
          if (categoryFilter === "VIEW" && act !== "view") return false;
          if (categoryFilter === "ADD" && !["create", "add"].includes(act)) return false;
          if (categoryFilter === "EDIT" && !["edit", "update"].includes(act)) return false;
          if (categoryFilter === "REMOVE" && !["delete", "remove"].includes(act)) return false;
          if (categoryFilter === "APPROVE" && act !== "approve") return false;
          if (categoryFilter === "EXPORT" && act !== "export") return false;
          if (categoryFilter === "PUBLISH" && act !== "publish") return false;
        }

        return true;
      });

      if (filtered.length > 0) {
        result.push({
          moduleKey: modKey,
          moduleInfo: modInfo,
          permissions: filtered,
          totalInModule: perms.length,
          grantedInModule: perms.filter((p) => hasPerm(p.id)).length
        });
      }
    });

    return result;
  }, [permissions, selected?.permissions, searchTerm, categoryFilter]);

  const totalGranted = selected?.permissions?.length || 0;

  return (
    <div>
      <PageHeader
        title="Roles & permissions"
        description="Manage role-based access permissions and administrative capabilities across all school modules."
        actions={<button type="button" onClick={openRoleForm}>Add Role</button>}
      />

      {error && <p className="error">{error}</p>}
      {message && <p className="ok">{message}</p>}

      <div className="split">
        {/* Left Column: Roles Navigation List */}
        <div>
          <h3 style={{ margin: "0 0 10px", fontSize: "15px", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Select Role
          </h3>
          <input placeholder="Search roles" value={roleSearch} onChange={(e) => setRoleSearch(e.target.value)} />
          <ul className="role-list">
            {roles.filter((r) => `${r.name} ${r.description || ""}`.toLowerCase().includes(roleSearch.toLowerCase())).map((r) => {
              const isSelected = selected?.id === r.id;
              const grantedCount = r.permissions?.length || 0;
              return (
                <li
                  key={r.id}
                  className={`role-list-item${isSelected ? " selected" : ""}`}
                  onClick={() => {
                    setSelected(r);
                    setMessage("");
                    setError("");
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <strong>{r.name}</strong>
                    <StatusBadge value={r.sensitivity || "NORMAL"} />
                  </div>
                  {r.description && <span className="role-desc">{r.description}</span>}
                  <div style={{ marginTop: "4px", fontSize: "11px", color: "var(--muted)", fontWeight: 600 }}>
                    {isSelected ? totalGranted : grantedCount} of {permissions.length} permissions enabled
                  </div>
                </li>
              );
            })}
          </ul>
          <ActionModal open={showRoleForm} title={editingRoleId ? "Edit role" : "Create role"} onClose={cancelRoleEdit}>
            <form className="card form-card" onSubmit={saveRole}>
              <input required placeholder="Role name" value={roleForm.name} onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })} />
              <input placeholder="Description" value={roleForm.description} onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })} />
              <select value={roleForm.sensitivity} onChange={(e) => setRoleForm({ ...roleForm, sensitivity: e.target.value })}><option>NORMAL</option><option>FINANCIAL</option><option>HR_RESTRICTED</option></select>
              <button>{editingRoleId ? "Save role" : "Create role"}</button>
              <button type="button" className="secondary" onClick={cancelRoleEdit}>Cancel</button>
            </form>
          </ActionModal>
          {selected && <button type="button" className="secondary" onClick={() => startRoleEdit(selected)}>Edit selected role</button>}
        </div>

        {/* Right Column: Permission Management for Selected Role */}
        {selected ? (
          <div>
            {/* Header / Summary Card for Role */}
            <div className="card" style={{ padding: "16px 20px", marginBottom: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <h3 style={{ margin: 0, fontSize: "20px" }}>{selected.name}</h3>
                    <StatusBadge value={selected.sensitivity || "NORMAL"} />
                  </div>
                  <p style={{ margin: "4px 0 0", color: "var(--muted)", fontSize: "13px" }}>
                    {selected.description || "Configure access permissions for this role."}
                  </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--accent)" }}>
                    {totalGranted} of {permissions.length} Enabled
                  </span>
                  <button type="button" onClick={save} disabled={saving}>
                    {saving ? "Saving..." : "Save Permissions"}
                  </button>
                </div>
              </div>
            </div>

            {/* Filter & Search Toolbar */}
            <div className="perm-toolbar">
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, minWidth: "220px" }}>
                <input
                  type="text"
                  placeholder="Search permissions (e.g. View Students, Add Fees, Reports)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ width: "100%", maxWidth: "340px" }}
                />
                {searchTerm && (
                  <button type="button" className="linkish" onClick={() => setSearchTerm("")}>
                    Clear
                  </button>
                )}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  style={{ width: "150px" }}
                >
                  <option value="ALL">All Actions</option>
                  <option value="VIEW">View</option>
                  <option value="ADD">Add</option>
                  <option value="EDIT">Edit</option>
                  <option value="REMOVE">Remove</option>
                  <option value="APPROVE">Approve</option>
                  <option value="EXPORT">Export</option>
                  <option value="PUBLISH">Publish</option>
                </select>

                <button type="button" className="secondary" onClick={selectAll} style={{ fontSize: "12px", padding: "8px 12px" }}>
                  Grant All
                </button>
                <button type="button" className="secondary" onClick={deselectAll} style={{ fontSize: "12px", padding: "8px 12px" }}>
                  Revoke All
                </button>
              </div>
            </div>

            {/* Grouped Permissions by Module */}
            {groupedPermissions.length === 0 ? (
              <div className="card" style={{ textAlign: "center", padding: "32px", color: "var(--muted)" }}>
                No permissions match your search or filter criteria.
              </div>
            ) : (
              groupedPermissions.map((group) => {
                const isAllSelected = group.grantedInModule === group.totalInModule;
                return (
                  <div key={group.moduleKey} className="perm-module-card">
                    <div className="perm-module-header">
                      <div className="perm-module-title">
                        <span style={{ fontSize: "18px" }}>{group.moduleInfo.icon}</span>
                        <div>
                          <h4>{group.moduleInfo.name}</h4>
                          <span style={{ fontSize: "12px", color: "var(--muted)" }}>
                            {group.moduleInfo.description}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ fontSize: "12px", fontWeight: 700, color: group.grantedInModule > 0 ? "var(--accent)" : "var(--muted)" }}>
                          {group.grantedInModule} of {group.totalInModule} enabled
                        </span>
                        <button
                          type="button"
                          className="secondary"
                          style={{ fontSize: "11px", padding: "4px 8px" }}
                          onClick={() => toggleModule(group.moduleKey, !isAllSelected)}
                        >
                          {isAllSelected ? "Deselect All" : "Select All"}
                        </button>
                      </div>
                    </div>

                    <div className="perm-card-grid">
                      {group.permissions.map((p) => {
                        const checked = hasPerm(p.id);
                        const label = getPermissionLabel(p.moduleName, p.actionName);
                        const desc = getPermissionDescription(p.moduleName, p.actionName, p.description);

                        return (
                          <div
                            key={p.id}
                            className={`perm-card-item${checked ? " checked" : ""}`}
                            onClick={() => toggle(p.id)}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggle(p.id)}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <div className="perm-card-body">
                              <span className="perm-card-label">{label}</span>
                              <span className="perm-card-desc">{desc}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}

            {/* Bottom Save Action Bar */}
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "16px" }}>
              <button type="button" onClick={save} disabled={saving} style={{ padding: "10px 24px", fontSize: "15px" }}>
                {saving ? "Saving Changes..." : "Save Permissions"}
              </button>
            </div>
          </div>
        ) : (
          <div className="card" style={{ textAlign: "center", padding: "40px", color: "var(--muted)" }}>
            Please select a role from the left list to view and manage its permissions.
          </div>
        )}
      </div>
    </div>
  );
}
