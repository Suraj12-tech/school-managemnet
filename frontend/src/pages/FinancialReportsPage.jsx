import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import PageHeader from "../components/PageHeader.jsx";
import { exportCsv } from "../utils/exportCsv.js";

export default function FinancialReportsPage() {
  const [report, setReport] = useState({ summary: {} }); const [filters, setFilters] = useState({ academicYearId: "", from: "", to: "", category: "" }); const [years, setYears] = useState([]); const [error, setError] = useState("");
  async function load(next = filters) { const params = new URLSearchParams(); Object.entries(next).forEach(([key, value]) => value && params.set(key, value)); try { setReport(await api(`/api/reports/financial?${params}`)); } catch (err) { setError(err.message); } }
  useEffect(() => { api("/api/academic-years").then(setYears).then(() => load()).catch((err) => setError(err.message)); }, []);
  function update(field, value) { setFilters({ ...filters, [field]: value }); }
  function submit(event) { event.preventDefault(); load(filters); }
  const summary = report.summary || {};
  return <div><PageHeader title="Financial reports" description="Review fee collection, outstanding fees, payroll, expenses, and payment records." />{error && <p className="error">{error}</p>}
    <form className="card form-card" onSubmit={submit}><h3>Report filters</h3><select value={filters.academicYearId} onChange={(e) => update("academicYearId", e.target.value)}><option value="">All academic years</option>{years.map((year) => <option key={year.id} value={year.id}>{year.name}</option>)}</select><input type="date" value={filters.from} onChange={(e) => update("from", e.target.value)} /><input type="date" value={filters.to} onChange={(e) => update("to", e.target.value)} /><input placeholder="Expense category (optional)" value={filters.category} onChange={(e) => update("category", e.target.value)} /><button>Apply filters</button></form>
    <div className="stats-grid"><div className="stat-card"><span>Total fee collection</span><strong>{Number(summary.totalCollected || 0).toFixed(2)}</strong></div><div className="stat-card"><span>Outstanding student fees</span><strong>{Number(summary.outstanding || 0).toFixed(2)}</strong></div><div className="stat-card"><span>Teacher/staff payroll</span><strong>{Number(summary.totalPayroll || 0).toFixed(2)}</strong></div><div className="stat-card"><span>Total expenses</span><strong>{Number(summary.totalExpenses || 0).toFixed(2)}</strong></div><div className="stat-card"><span>Payment records</span><strong>{(report.collections || []).length}</strong></div></div>
    <button type="button" className="secondary" onClick={() => exportCsv("financial-summary.csv", [{ totalFeeCollection: summary.totalCollected, outstandingStudentFees: summary.outstanding, payroll: summary.totalPayroll, expenses: summary.totalExpenses, paymentRecords: (report.collections || []).length }])}>Export summary</button>
  </div>;
}
