import { useEffect, useState } from "react";
import { api } from "../api/client.js";

export default function FeeAccountsPage() {
  const [rows, setRows] = useState([]);
  const [years, setYears] = useState([]);
  const [yearId, setYearId] = useState("");
  const [concession, setConcession] = useState({ studentId: "", amount: "", reason: "Need" });

  async function load(id) {
    const query = id ? "?academicYearId=" + id : "";
    setRows(await api("/api/fee-accounts" + query));
  }
  useEffect(() => {
    api("/api/academic-years").then(setYears);
    load();
  }, []);

  async function apply(e) {
    e.preventDefault();
    await api("/api/concessions", "POST", {
      studentId: Number(concession.studentId),
      academicYearId: Number(yearId),
      amount: Number(concession.amount),
      reason: concession.reason
    });
    load(yearId);
  }

  return (
    <div>
      <h2>Student Fee Account</h2>
      <select value={yearId} onChange={(e) => { setYearId(e.target.value); load(e.target.value); }}>
        <option value="">All years</option>
        {years.map((y) => <option key={y.id} value={y.id}>{y.name}</option>)}
      </select>
      <table>
        <thead><tr><th>Student</th><th>Due</th><th>Paid</th><th>Concession</th><th>Outstanding</th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td>{r.studentId}</td><td>{r.totalDue}</td><td>{r.totalPaid}</td>
              <td>{r.concessionAmount}</td><td><strong>{r.outstanding}</strong></td>
            </tr>
          ))}
        </tbody>
      </table>
      <form className="card" onSubmit={apply}>
        <h3>Apply concession</h3>
        <input placeholder="Student ID" value={concession.studentId} onChange={(e) => setConcession({ ...concession, studentId: e.target.value })} />
        <input placeholder="Amount" value={concession.amount} onChange={(e) => setConcession({ ...concession, amount: e.target.value })} />
        <input placeholder="Reason" value={concession.reason} onChange={(e) => setConcession({ ...concession, reason: e.target.value })} />
        <button>Approve concession</button>
      </form>
    </div>
  );
}
