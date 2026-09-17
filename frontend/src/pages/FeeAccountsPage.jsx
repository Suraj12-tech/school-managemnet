import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import PageHeader from "../components/PageHeader.jsx";
import StatusBadge from "../components/StatusBadge.jsx";

export default function FeeAccountsPage() {
  const [rows, setRows] = useState([]);
  const [years, setYears] = useState([]);
  const [students, setStudents] = useState([]);
  const [yearId, setYearId] = useState("");
  const [selected, setSelected] = useState(null);
  const [concession, setConcession] = useState({ studentId: "", amount: "", reason: "" });
  const [error, setError] = useState("");

  async function load(id = yearId) {
    const query = id ? `?academicYearId=${id}` : "";
    setRows(await api(`/api/fee-accounts${query}`));
  }
  useEffect(() => {
    Promise.all([api("/api/academic-years"), api("/api/students")])
      .then(([yearRows, studentRows]) => { setYears(yearRows); setStudents(studentRows); })
      .catch((err) => setError(err.message));
    load("").catch((err) => setError(err.message));
  }, []);

  async function apply(e) {
    e.preventDefault();
    setError("");
    try {
      if (!yearId) throw new Error("Select an academic year");
      await api("/api/concessions", "POST", {
        studentId: Number(concession.studentId), academicYearId: Number(yearId),
        amount: Number(concession.amount), reason: concession.reason
      });
      setConcession({ studentId: "", amount: "", reason: "" });
      await load();
    } catch (err) { setError(err.message || "Unable to apply concession"); }
  }

  return (
    <div>
      <PageHeader title="Student fee accounts" description="Review balances, payments, concessions, and outstanding amounts." />
      <select value={yearId} onChange={(e) => { setYearId(e.target.value); load(e.target.value); }}>
        <option value="">All years</option>
        {years.map((year) => <option key={year.id} value={year.id}>{year.name}</option>)}
      </select>
      {error && <div className="error">{error}</div>}
      <table>
        <thead><tr><th>Student</th><th>Academic Year</th><th>Total Due</th><th>Paid</th><th>Concession</th><th>Outstanding</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>{rows.map((row) => <tr key={row.id}>
          <td>{row.student || row.studentId}</td><td>{row.academicYear || row.academicYearId}</td>
          <td>{Number(row.totalDue).toFixed(2)}</td><td>{Number(row.totalPaid).toFixed(2)}</td>
          <td>{Number(row.concessionAmount).toFixed(2)}</td><td><strong>{Number(row.outstanding).toFixed(2)}</strong></td>
          <td><StatusBadge value={row.status} /></td><td><button type="button" onClick={() => setSelected(row)}>View</button></td>
        </tr>)}</tbody>
      </table>
      <form className="card form-card" onSubmit={apply}>
        <h3>Apply concession</h3>
        <select required value={concession.studentId} onChange={(e) => setConcession({ ...concession, studentId: e.target.value })}>
          <option value="">Student</option>
          {students.map((student) => <option key={student.id} value={student.id}>{student.firstName} {student.lastName}</option>)}
        </select>
        <input required min="0.01" type="number" step="0.01" placeholder="Amount" value={concession.amount}
          onChange={(e) => setConcession({ ...concession, amount: e.target.value })} />
        <input required placeholder="Reason" value={concession.reason}
          onChange={(e) => setConcession({ ...concession, reason: e.target.value })} />
        <button>Apply concession</button>
      </form>
      {selected && <div className="card">
        <h3>{selected.student} - {selected.academicYear}</h3>
        <p>Class: {selected.className || "-"} | Section: {selected.section || "-"}</p>
        <p>Due: {selected.totalDue} | Paid: {selected.totalPaid} | Concession: {selected.concessionAmount} | Outstanding: {selected.outstanding}</p>
        <h4>Fee-head breakdown</h4>
        <table><thead><tr><th>Fee Head</th><th>Due</th><th>Paid</th><th>Outstanding</th></tr></thead>
          <tbody>{(selected.breakdown || []).map((item) => <tr key={item.feeHead}><td>{item.feeHead}</td><td>{item.due}</td><td>{item.paid}</td><td>{item.outstanding}</td></tr>)}</tbody>
        </table>
        <h4>Payment history</h4>
        <table><thead><tr><th>Date</th><th>Receipt</th><th>Amount</th><th>Method</th><th>Status</th></tr></thead>
          <tbody>{(selected.payments || []).map((payment, index) => <tr key={`${payment.receiptNumber}-${index}`}><td>{payment.date}</td><td>{payment.receiptNumber || "-"}</td><td>{payment.amount}</td><td>{payment.method}</td><td><StatusBadge value={payment.status} /></td></tr>)}</tbody>
        </table>
        <button type="button" onClick={() => setSelected(null)}>Close</button>
      </div>}
    </div>
  );
}
