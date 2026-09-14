import { useEffect, useState } from "react";
import { api } from "../api/client.js";

export default function ReportsPage() {
  const [dues, setDues] = useState([]);
  const [collections, setCollections] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/api/reports/fee-dues").then(setDues).catch((e) => setError(e.message));
    api("/api/reports/collections").then(setCollections).catch((e) => setError(e.message));
  }, []);

  return (
    <div>
      <h2>Fee Dues & Collection Reports</h2>
      {error && <p className="error">{error}</p>}
      <h3>Outstanding dues</h3>
      <table>
        <thead><tr><th>Student</th><th>Outstanding</th></tr></thead>
        <tbody>{dues.map((d) => <tr key={d.id}><td>{d.studentId}</td><td>{d.outstanding}</td></tr>)}</tbody>
      </table>
      <h3>Collections (receipts)</h3>
      <ul>{collections.map((c) => <li key={c.id}>{c.receiptNumber} — {c.issuedOn}</li>)}</ul>
    </div>
  );
}
