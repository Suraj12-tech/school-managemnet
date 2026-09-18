import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client.js";
import PageHeader from "../components/PageHeader.jsx";

export default function DashboardPage() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/api/dashboard/summary").then(setData).catch((e) => setError(e.message));
  }, []);

  if (error) {
    return (
      <div>
        <PageHeader title="Administration dashboard" description="A quick view of school activity, collections, and items that need attention." />
        <p className="error">{error}</p>
      </div>
    );
  }
  if (!data) {
    return (
      <div>
        <PageHeader title="Administration dashboard" description="A quick view of school activity, collections, and items that need attention." />
        <p className="muted">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Administration dashboard" description="A quick view of school activity, collections, and items that need attention." />
      <div className="cards">
        <Stat title="Students" value={data.studentCount} />
        <Stat title="Active students" value={data.activeStudents} />
        <Stat title="Staff" value={data.staffCount} />
        <Stat title="Fee collected" value={data.totalCollected} />
        <Stat title="Outstanding" value={data.outstanding} />
        <Stat title="Unpaid invoices" value={data.unpaidInvoices} />
      </div>
      <div className="card">
        <h3>Alerts</h3>
        {data.alerts?.length ? (
          <ul className="list">{data.alerts.map((alert) => {
            const isOverdue = /^\d+ invoice\(s\) are overdue$/.test(alert);
            return (
              <li key={alert}>
                {isOverdue ? (
                  <button type="button" className="alert-action" onClick={() => navigate("/invoices?status=OVERDUE")}>
                    {alert}<span aria-hidden="true">View overdue invoices →</span>
                  </button>
                ) : alert}
              </li>
            );
          })}</ul>
        ) : (
          <p className="muted">No pending administrative alerts.</p>
        )}
      </div>
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
