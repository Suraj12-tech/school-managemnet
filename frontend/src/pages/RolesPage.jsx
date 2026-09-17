import { useEffect, useState } from "react";
import { api } from "../api/client.js";

export default function RolesPage() {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [selected, setSelected] = useState(null);

  async function load() {
    const r = await api("/api/roles");
    setRoles(r);
    setPermissions(await api("/api/permissions"));
    if (!selected && r[0]) setSelected(r[0]);
  }
  useEffect(() => { load(); }, []);

  function hasPerm(id) {
    return selected?.permissions?.some((p) => p.id === id);
  }

  function toggle(id) {
    const current = selected.permissions || [];
    const next = hasPerm(id) ? current.filter((p) => p.id !== id) : [...current, permissions.find((p) => p.id === id)];
    setSelected({ ...selected, permissions: next });
  }

  async function save() {
    await api("/api/roles/" + selected.id, "PUT", {
      name: selected.name,
      description: selected.description,
      sensitivity: selected.sensitivity,
      permissionIds: (selected.permissions || []).map((p) => p.id)
    });
    load();
  }

  return (
    <div>
      <h2>Role & Permission Management</h2>
      <p className="muted">Permissions are enforced on the backend, not only by hiding menu items.</p>
      <div className="split">
        <ul className="list">
          {roles.map((r) => (
            <li key={r.id}>
              <button className="linkish" onClick={() => setSelected(r)}>{r.name}</button>
              <div className="muted">{r.sensitivity}</div>
            </li>
          ))}
        </ul>
        {selected && (
          <div className="card">
            <h3>{selected.name}</h3>
            <div className="perm-grid">
              {permissions.map((p) => (
                <label key={p.id}>
                  <input type="checkbox" checked={hasPerm(p.id)} onChange={() => toggle(p.id)} />
                  {p.moduleName}:{p.actionName}
                </label>
              ))}
            </div>
            <button onClick={save}>Save permissions</button>
          </div>
        )}
      </div>
    </div>
  );
}
