import { useEffect, useState } from "react";
import { api } from "../api/client.js";

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/api/dashboard/summary").then(setData).catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="error">{error}</p>;
  if (!data) return <p>Loading dashboard...</p>;

  return (
    <div>
      <h2>Administration Dashboard</h2>
      <div className="cards">
        <Stat title="Students" value={data.studentCount} />
        <Stat title="Active students" value={data.activeStudents} />
        <Stat title="Staff" value={data.staffCount} />
        <Stat title="Fee collected" value={data.totalCollected} />
        <Stat title="Outstanding" value={data.outstanding} />
        <Stat title="Unpaid invoices" value={data.unpaidInvoices} />
      </div>
      <h3>Alerts</h3>
      {data.alerts?.length ? (
        <ul>{data.alerts.map((a) => <li key={a}>{a}</li>)}</ul>
      ) : (
        <p className="muted">No pending administrative alerts.</p>
      )}
    </div>
  );
}

function Stat({ title, value }) {
  return (
    <div className="stat">
      <span>{title}</span>
      <strong>{value ?? 0}</strong>
    </div>
  );
}
