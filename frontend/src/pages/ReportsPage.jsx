import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import PageHeader from "../components/PageHeader.jsx";
import StatusBadge from "../components/StatusBadge.jsx";

export default function ReportsPage() {
  const [report, setReport] = useState({ dues: [], collections: [], summary: {} });
  const [years, setYears] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [filters, setFilters] = useState({ academicYearId: "", classId: "", sectionId: "", status: "", from: "", to: "" });
  const [receipt, setReceipt] = useState(null);
  const [error, setError] = useState("");

  async function load(nextFilters = filters) {
    const params = new URLSearchParams();
    Object.entries(nextFilters).forEach(([key, value]) => { if (value) params.set(key, value); });
    setReport(await api(`/api/reports/fee-dues?${params.toString()}`));
  }

  useEffect(() => {
    Promise.all([api("/api/academic-years"), api("/api/classes"), api("/api/sections")])
      .then(([yearRows, classRows, sectionRows]) => {
        setYears(yearRows); setClasses(classRows); setSections(sectionRows);
      })
      .then(() => load())
      .catch((err) => setError(err.message));
  }, []);

  function updateFilter(field, value) {
    setFilters({ ...filters, [field]: value });
  }

  function applyFilters(e) {
    e.preventDefault();
    setError("");
    load(filters).catch((err) => setError(err.message));
  }

  function clearFilters() {
    const empty = { academicYearId: "", classId: "", sectionId: "", status: "", from: "", to: "" };
    setFilters(empty);
    setError("");
    load(empty).catch((err) => setError(err.message));
  }

  const summary = report.summary || {};
  return (
    <div>
      <PageHeader title="Fee dues & collection reports" description="Filter balances and collections by academic period, class, and status." />
      {error && <p className="error">{error}</p>}
      <form className="card form-card" onSubmit={applyFilters}>
        <h3>Filters</h3>
        <select value={filters.academicYearId} onChange={(e) => updateFilter("academicYearId", e.target.value)}>
          <option value="">All academic years</option>
          {years.map((year) => <option key={year.id} value={year.id}>{year.name}</option>)}
        </select>
        <select value={filters.classId} onChange={(e) => updateFilter("classId", e.target.value)}>
          <option value="">All classes</option>
          {classes.map((schoolClass) => <option key={schoolClass.id} value={schoolClass.id}>{schoolClass.name}</option>)}
        </select>
        <select value={filters.sectionId} onChange={(e) => updateFilter("sectionId", e.target.value)}>
          <option value="">All sections</option>
          {sections.filter((section) => !filters.classId || String(section.classId) === String(filters.classId))
            .map((section) => <option key={section.id} value={section.id}>{section.name} ({section.className})</option>)}
        </select>
        <select value={filters.status} onChange={(e) => updateFilter("status", e.target.value)}>
          <option value="">All statuses</option><option>DUE</option><option>PARTIAL</option><option>PAID</option>
        </select>
        <input type="date" value={filters.from} onChange={(e) => updateFilter("from", e.target.value)} />
        <input type="date" value={filters.to} onChange={(e) => updateFilter("to", e.target.value)} />
        <button type="submit">Apply Filters</button>
        <button type="button" onClick={clearFilters}>Clear</button>
      </form>

      <h3>Collection Summary</h3>
      <div className="card">
        <strong>Total Due: {Number(summary.totalDue || 0).toFixed(2)}</strong>{" | "}
        <strong>Total Collected: {Number(summary.totalCollected || 0).toFixed(2)}</strong>{" | "}
        <strong>Total Concession: {Number(summary.totalConcession || 0).toFixed(2)}</strong>{" | "}
        <strong>Outstanding: {Number(summary.outstanding || 0).toFixed(2)}</strong>
      </div>

      <h3>Outstanding Dues</h3>
      <table>
        <thead><tr><th>Student</th><th>Class</th><th>Section</th><th>Total Due</th><th>Paid</th><th>Concession</th><th>Outstanding</th><th>Status</th></tr></thead>
        <tbody>{report.dues.map((row) => <tr key={row.id}>
          <td>{row.student || row.studentId}</td><td>{row.className || "-"}</td><td>{row.section || "-"}</td>
          <td>{Number(row.totalDue).toFixed(2)}</td><td>{Number(row.totalPaid).toFixed(2)}</td>
          <td>{Number(row.concessionAmount).toFixed(2)}</td><td>{Number(row.outstanding).toFixed(2)}</td><td><StatusBadge value={row.status} /></td>
        </tr>)}</tbody>
      </table>

      <h3>Collection / Receipt Report</h3>
      <table>
        <thead><tr><th>Receipt No</th><th>Date</th><th>Student</th><th>Amount</th><th>Payment Method</th><th>Invoice</th><th>View</th></tr></thead>
        <tbody>{report.collections.map((row) => <tr key={row.id}>
          <td>{row.receiptNumber}</td><td>{row.paymentDate || row.issuedOn}</td><td>{row.student || "-"}</td>
          <td>{Number(row.amount || 0).toFixed(2)}</td><td>{row.paymentMethod || "-"}</td><td>{row.invoiceNumber || "-"}</td>
          <td><button type="button" onClick={() => setReceipt(row)}>View</button></td>
        </tr>)}</tbody>
      </table>

      {receipt && <div className="card">
        <h3>Receipt {receipt.receiptNumber}</h3>
        <p>Date: {receipt.paymentDate || receipt.issuedOn}</p>
        <p>Student: {receipt.student || "-"}</p>
        <p>Invoice: {receipt.invoiceNumber || "-"}</p>
        <p>Amount: {receipt.amount || "-"}</p>
        <p>Payment method: {receipt.paymentMethod || "-"}</p>
        <button type="button" onClick={() => setReceipt(null)}>Close</button>
      </div>}
    </div>
  );
}
