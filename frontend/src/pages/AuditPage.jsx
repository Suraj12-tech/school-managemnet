import { useEffect, useState } from "react";
import { api } from "../api/client.js";

export default function AuditPage() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    api("/api/audit-logs").then(setRows);
  }, []);

  return (
    <div>
      <h2>Audit Log</h2>
      <table>
        <thead><tr><th>When</th><th>User</th><th>Module</th><th>Action</th><th>Entity</th><th>Details</th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td>{r.createdAt}</td>
              <td>{r.userId}</td>
              <td>{r.moduleName}</td>
              <td>{r.actionName}</td>
              <td>{r.entityName} #{r.entityId}</td>
              <td>{r.details}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
