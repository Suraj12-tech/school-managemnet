import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client.js";
import { useAuth } from "../auth/AuthContext.jsx";
import ActionModal from "../components/ActionModal.jsx";
import PageHeader from "../components/PageHeader.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import TableWrap from "../components/TableWrap.jsx";

const empty = {
  staffId: "",
  payPeriod: "",
  basicSalary: "",
  allowances: "0",
  deductions: "0",
  status: "PENDING",
  paymentDate: "",
  paymentMethod: "",
  referenceNo: ""
};

const emptyFilters = { query: "", payPeriod: "", status: "ALL" };
const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" });
const formatAmount = (value) => currency.format(Number(value) || 0);

function periodLabel(value) {
  if (!value || !/^\d{4}-\d{2}$/.test(value)) return value || "—";
  const [year, month] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" })
    .format(new Date(year, month - 1, 1));
}

function dateLabel(value) {
  if (!value) return value;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return value;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(new Date(year, month - 1, day));
}

export default function PayrollPage() {
  const { can } = useAuth();
  const [rows, setRows] = useState([]);
  const [allRows, setAllRows] = useState([]);
  const [staff, setStaff] = useState([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [selected, setSelected] = useState(null);
  const [filters, setFilters] = useState(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState(emptyFilters);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load(nextFilters = appliedFilters, refreshPeriods = false) {
    setLoading(true);
    try {
      setError("");
      const params = new URLSearchParams();
      if (nextFilters.payPeriod) params.set("payPeriod", nextFilters.payPeriod);
      if (nextFilters.status !== "ALL") params.set("status", nextFilters.status);
      const query = params.toString();
      const payrollRows = await api(`/api/payroll${query ? `?${query}` : ""}`);
      setRows(payrollRows || []);
      if (refreshPeriods || !allRows.length) {
        const allPayrollRows = query ? await api("/api/payroll") : payrollRows;
        setAllRows(allPayrollRows || []);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(emptyFilters, true);
    if (can("staff", "view")) loadStaff();
  }, []);

  async function loadStaff() {
    if (!can("staff", "view")) return;
    try {
      setStaff(await api("/api/staff"));
    } catch (err) {
      setError(err.message);
    }
  }

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function closeForm() {
    setEditingId(null);
    setForm(empty);
    setShowForm(false);
  }

  async function save(event) {
    event.preventDefault();
    try {
      setError("");
      await api(editingId ? `/api/payroll/${editingId}` : "/api/payroll", editingId ? "PUT" : "POST", {
        ...form,
        staffId: Number(form.staffId),
        basicSalary: Number(form.basicSalary),
        allowances: Number(form.allowances || 0),
        deductions: Number(form.deductions || 0),
        paymentDate: form.paymentDate || undefined
      });
      closeForm();
      await load(appliedFilters, true);
    } catch (err) {
      setError(err.message);
    }
  }

  function edit(row) {
    setEditingId(row.id);
    setForm({
      staffId: row.staffId,
      payPeriod: row.payPeriod,
      basicSalary: row.basicSalary,
      allowances: row.allowances,
      deductions: row.deductions,
      status: row.status,
      paymentDate: row.paymentDate || "",
      paymentMethod: row.paymentMethod || "",
      referenceNo: row.referenceNo || ""
    });
    setShowForm(true);
  }

  async function remove(id) {
    if (!window.confirm("Delete this payroll record?")) return;
    try {
      setError("");
      await api(`/api/payroll/${id}`, "DELETE");
      await load(appliedFilters, true);
    } catch (err) {
      setError(err.message);
    }
  }

  function applyFilters(event) {
    event.preventDefault();
    setAppliedFilters({ ...filters });
    load(filters);
  }

  function resetFilters() {
    setFilters({ ...emptyFilters });
    setAppliedFilters({ ...emptyFilters });
    load(emptyFilters);
  }

  const periods = useMemo(() => [...new Set(allRows.map((row) => row.payPeriod).filter(Boolean))]
    .sort((first, second) => second.localeCompare(first)), [allRows]);
  const visibleRows = useMemo(() => {
    const search = appliedFilters.query.trim().toLowerCase();
    return rows.filter((row) =>
      `${row.staffName || ""} ${row.employeeId || ""}`.toLowerCase().includes(search));
  }, [rows, appliedFilters.query]);
  const sumSalary = (records) => records.reduce((sum, row) =>
    sum + Math.round((Number(row.netSalary) || 0) * 100), 0) / 100;
  const totalPayroll = sumSalary(visibleRows);
  const paidPayroll = sumSalary(visibleRows
    .filter((row) => row.status === "PAID")
  );
  const pendingPayroll = sumSalary(visibleRows.filter((row) => row.status === "PENDING"));
  const employeeCount = new Set(visibleRows.map((row) => row.staffId)).size;
  const hasFilters = Boolean(appliedFilters.query || appliedFilters.payPeriod || appliedFilters.status !== "ALL");
  const summaryAvailable = !loading && !error;

  return (
    <div className="payroll-page">
      <PageHeader
        title="Teacher & staff payroll"
        description="Manage one payroll record per staff member and pay period."
        actions={can("finance", "create") && <button type="button" onClick={() => {
          setEditingId(null);
          setForm(empty);
          setError("");
          setShowForm(true);
          loadStaff();
        }}>Create Payroll</button>}
      />
      {error && <p className="error">{error}</p>}

      <form className="card payroll-filters" onSubmit={applyFilters}>
        <label className="payroll-search">Search employee name or employee ID
          <input placeholder="Search employee name or employee ID" value={filters.query}
            onChange={(event) => setFilters((current) => ({ ...current, query: event.target.value }))} />
        </label>
        <div className="payroll-filter-grid">
          <label>Pay Period
            <select value={filters.payPeriod}
              onChange={(event) => setFilters((current) => ({ ...current, payPeriod: event.target.value }))}>
              <option value="">All Pay Periods</option>
              {periods.map((period) => <option key={period} value={period}>{periodLabel(period)}</option>)}
            </select>
          </label>
          <label>Status
            <select value={filters.status}
              onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}>
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="PAID">Paid</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </label>
        </div>
        <div className="row payroll-filter-actions">
          <button type="submit" disabled={loading}>Apply Filters</button>
          <button type="button" className="secondary" onClick={resetFilters} disabled={loading}>Reset</button>
        </div>
      </form>

      <section className="payroll-summary" aria-label="Payroll summary">
        <article className="stat-card"><span>Total Payroll</span><strong>{summaryAvailable ? formatAmount(totalPayroll) : "—"}</strong></article>
        <article className="stat-card"><span>Paid</span><strong>{summaryAvailable ? formatAmount(paidPayroll) : "—"}</strong></article>
        <article className="stat-card"><span>Pending</span><strong>{summaryAvailable ? formatAmount(pendingPayroll) : "—"}</strong></article>
        <article className="stat-card"><span>Employees</span><strong>{summaryAvailable ? employeeCount : "—"}</strong></article>
      </section>

      {loading ? <p className="muted">Loading payroll records...</p>
        : visibleRows.length ? <TableWrap><table className="payroll-table">
          <thead><tr><th>Employee</th><th>Pay Period</th><th>Basic</th><th>Allowances</th><th>Deductions</th><th>Net Salary</th><th>Payment Method</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>{visibleRows.map((row) => <tr key={row.id}>
            <td className="payroll-employee">{row.staffName || row.employeeId || "—"}<small>{row.employeeId || ""}</small></td>
            <td>{periodLabel(row.payPeriod)}</td>
            <td>{formatAmount(row.basicSalary)}</td>
            <td>{formatAmount(row.allowances)}</td>
            <td>{formatAmount(row.deductions)}</td>
            <td><strong>{formatAmount(row.netSalary)}</strong></td>
            <td className="payroll-payment-method">{row.paymentMethod || "—"}</td>
            <td><StatusBadge value={row.status} /></td>
            <td className="payroll-row-actions">
              <button type="button" className="secondary" onClick={() => setSelected(row)}>View</button>{" "}
              {can("finance", "edit") && <button type="button" className="secondary" onClick={() => edit(row)}>Edit</button>}{" "}
              {can("finance", "delete") && <button type="button" className="danger" onClick={() => remove(row.id)}>Delete</button>}
            </td>
          </tr>)}</tbody>
        </table></TableWrap>
          : <section className="card payroll-empty-state">
            <h3>No payroll records found.</h3>
            <p className="muted">{hasFilters
              ? "There are no payroll records matching the selected filters."
              : "There are currently no payroll records available."}</p>
            {hasFilters
              ? <button type="button" className="secondary" onClick={resetFilters}>Clear Filters</button>
              : can("finance", "create") && <button type="button" onClick={() => {
                setEditingId(null);
                setForm(empty);
                setShowForm(true);
                loadStaff();
              }}>Create Payroll</button>}
          </section>}

      <ActionModal open={showForm} title={editingId ? "Edit payroll" : "Create payroll"} onClose={closeForm}>
        <form className="card form-card payroll-form" onSubmit={save}>
          <label>Staff Member
            <select required value={form.staffId} onChange={(event) => update("staffId", event.target.value)}>
              <option value="">Select Staff Member</option>
              {staff.filter((row) => row.status === "ACTIVE").map((row) =>
                <option key={row.id} value={row.id}>{row.fullName} ({row.employeeId})</option>)}
            </select>
          </label>
          <label>Pay Period
            <input required type="month" value={form.payPeriod} onChange={(event) => update("payPeriod", event.target.value)} />
          </label>
          <label>Basic Salary
            <input required min="0" step="0.01" type="number" placeholder="Enter Basic Salary" value={form.basicSalary} onChange={(event) => update("basicSalary", event.target.value)} />
          </label>
          <label>Allowances
            <input min="0" step="0.01" type="number" placeholder="Enter Allowances" value={form.allowances} onChange={(event) => update("allowances", event.target.value)} />
          </label>
          <label>Deductions
            <input min="0" step="0.01" type="number" placeholder="Enter Deductions" value={form.deductions} onChange={(event) => update("deductions", event.target.value)} />
          </label>
          <label>Status
            <select value={form.status} onChange={(event) => update("status", event.target.value)}>
              <option value="PENDING">Pending</option>
              <option value="PAID">Paid</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </label>
          <label>Payment Date
            <input type="date" value={form.paymentDate} onChange={(event) => update("paymentDate", event.target.value)} />
          </label>
          <label>Payment Method
            <input placeholder="Enter Payment Method" value={form.paymentMethod} onChange={(event) => update("paymentMethod", event.target.value)} />
          </label>
          <label>Reference
            <input placeholder="Optional Reference" value={form.referenceNo} onChange={(event) => update("referenceNo", event.target.value)} />
          </label>
          <div className="row">
            <button type="submit">{editingId ? "Save changes" : "Create payroll"}</button>
            <button type="button" className="secondary" onClick={closeForm}>Cancel</button>
          </div>
        </form>
      </ActionModal>

      <ActionModal open={Boolean(selected)} title="Payroll Details" onClose={() => setSelected(null)} size="lg">
        {selected && (() => {
          const staffMember = staff.find((person) => String(person.id) === String(selected.staffId));
          const details = [
            ["Employee Name", selected.staffName],
            ["Employee ID", selected.employeeId],
            ["Department", staffMember?.departmentName],
            ["Designation", selected.designation || staffMember?.designation],
            ["Pay Period", periodLabel(selected.payPeriod)],
            ["Basic Salary", formatAmount(selected.basicSalary)],
            ["Allowances", formatAmount(selected.allowances)],
            ["Deductions", formatAmount(selected.deductions)],
            ["Net Salary", formatAmount(selected.netSalary)],
            ["Status", selected.status],
            ["Payment Date", dateLabel(selected.paymentDate)],
            ["Payment Method", selected.paymentMethod],
            ["Reference", selected.referenceNo]
          ].filter(([, value]) => value != null && value !== "");
          return <div className="payroll-detail-grid">
            {details.map(([label, value]) => <div key={label}>
              <span className="muted">{label}</span>
              {label === "Status" ? <StatusBadge value={value} /> : <strong>{value}</strong>}
            </div>)}
          </div>;
        })()}
      </ActionModal>
    </div>
  );
}
