import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import ActionModal from "../components/ActionModal.jsx";
import PageHeader from "../components/PageHeader.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import { exportCsv } from "../utils/exportCsv.js";

export default function FeeAccountsPage() {
  const [rows, setRows] = useState([]);
  const [years, setYears] = useState([]);
  const [students, setStudents] = useState([]);
  const [yearId, setYearId] = useState("");
  const [selected, setSelected] = useState(null);
  const [concession, setConcession] = useState({ studentId: "", amount: "", reason: "" });
  const [showConcessionForm, setShowConcessionForm] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

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

  function openConcessionForm() {
    setConcession({ studentId: "", amount: "", reason: "" });
    setShowConcessionForm(true);
  }

  function closeConcessionForm() {
    setShowConcessionForm(false);
    setConcession({ studentId: "", amount: "", reason: "" });
  }

  async function apply(e) {
    e.preventDefault();
    setError("");
    try {
      if (!yearId) throw new Error("Select an academic year");
      await api("/api/concessions", "POST", {
        studentId: Number(concession.studentId), academicYearId: Number(yearId),
        amount: Number(concession.amount), reason: concession.reason
      });
      closeConcessionForm();
      await load();
    } catch (err) { setError(err.message || "Unable to apply concession"); }
  }
  const visibleRows = rows.filter((row) =>
    `${row.student} ${row.academicYear} ${row.className} ${row.section}`.toLowerCase().includes(query.toLowerCase())
    && (statusFilter === "ALL" || row.status === statusFilter)
  );

  return (
    <div>
      <PageHeader title="Student fee accounts" description="Review balances, payments, concessions, and outstanding amounts." actions={<button type="button" onClick={openConcessionForm}>Add Concession</button>} />
      <select value={yearId} onChange={(e) => { setYearId(e.target.value); load(e.target.value); }}>
        <option value="">All years</option>
        {years.map((year) => <option key={year.id} value={year.id}>{year.name}</option>)}
      </select>
      {error && <div className="error">{error}</div>}
      <div className="card filter-bar"><input placeholder="Search student fee accounts" value={query} onChange={(e) => setQuery(e.target.value)} /><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option value="ALL">All statuses</option><option>DUE</option><option>PARTIAL</option><option>PAID</option></select><button type="button" className="secondary" onClick={() => exportCsv("fee-accounts.csv", visibleRows.map((row) => ({ student: row.student, academicYear: row.academicYear, totalDue: row.totalDue, paid: row.totalPaid, outstanding: row.outstanding, status: row.status })))}>Export</button></div>
      <ActionModal open={showConcessionForm} title="Apply concession" onClose={closeConcessionForm}>
        <form className="card form-card" onSubmit={apply}>
          <select required value={concession.studentId} onChange={(e) => setConcession({ ...concession, studentId: e.target.value })}>
            <option value="">Student</option>
            {students.map((student) => <option key={student.id} value={student.id}>{student.firstName} {student.lastName}</option>)}
          </select>
          <input required min="0.01" type="number" step="0.01" placeholder="Amount" value={concession.amount}
            onChange={(e) => setConcession({ ...concession, amount: e.target.value })} />
          <input required placeholder="Reason" value={concession.reason}
            onChange={(e) => setConcession({ ...concession, reason: e.target.value })} />
          <button>Apply concession</button>
          <button type="button" className="secondary" onClick={closeConcessionForm}>Cancel</button>
        </form>
      </ActionModal>
      <table>
        <thead><tr><th>Student</th><th>Academic Year</th><th>Total Due</th><th>Paid</th><th>Concession</th><th>Outstanding</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>{visibleRows.map((row) => <tr key={row.id}>
          <td>{row.student || row.studentId}</td><td>{row.academicYear || row.academicYearId}</td>
          <td>{Number(row.totalDue).toFixed(2)}</td><td>{Number(row.totalPaid).toFixed(2)}</td>
          <td>{Number(row.concessionAmount).toFixed(2)}</td><td><strong>{Number(row.outstanding).toFixed(2)}</strong></td>
          <td><StatusBadge value={row.status} /></td><td><button type="button" onClick={() => setSelected(row)}>View</button></td>
        </tr>)}{!visibleRows.length && <tr><td colSpan="8" className="muted">No fee accounts found.</td></tr>}</tbody>
      </table>
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
