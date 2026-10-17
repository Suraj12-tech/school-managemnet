import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client.js";
import { useAuth } from "../auth/AuthContext.jsx";
import PageHeader from "../components/PageHeader.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import TableWrap from "../components/TableWrap.jsx";
import { exportCsv } from "../utils/exportCsv.js";

const REPORTS = [
  ["overall", "Overall Summary"],
  ["collections", "Fee Collection"],
  ["dues", "Outstanding Fees"],
  ["payroll", "Payroll"],
  ["expenses", "Expenses"],
  ["payments", "Payment Records"]
];

const emptyFilters = {
  academicYearId: "",
  from: "",
  to: "",
  staffId: "",
  classId: "",
  sectionId: "",
  status: "",
  category: ""
};

const money = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" });
const amount = (value) => money.format(Number(value) || 0);

function inDateRange(value, from, to) {
  return Boolean(value) && (!from || value >= from) && (!to || value <= to);
}

function payrollInDateRange(period, from, to) {
  if (!period || !/^\d{4}-\d{2}$/.test(period)) return false;
  const month = `${period}-01`;
  return inDateRange(month, from, to);
}

function sumAmounts(rows, field) {
  const cents = rows.reduce((total, row) => total + Math.round((Number(row[field]) || 0) * 100), 0);
  return cents / 100;
}

function addParams(filters, keys) {
  const params = new URLSearchParams();
  keys.forEach((key) => {
    if (filters[key]) params.set(key, filters[key]);
  });
  return params.toString();
}

export default function FinancialReportsPage() {
  const { can } = useAuth();
  const [reportType, setReportType] = useState(() => can("finance", "export") ? "overall" : "payroll");
  const [filters, setFilters] = useState(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState(emptyFilters);
  const [years, setYears] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [expenseOptions, setExpenseOptions] = useState([]);
  const [payrollOptions, setPayrollOptions] = useState([]);
  const [data, setData] = useState(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [optionsError, setOptionsError] = useState("");
  const [error, setError] = useState("");
  const availableReports = REPORTS.filter(([value]) =>
    value === "overall" ? can("finance", "export")
      : ["collections", "dues", "payments"].includes(value) ? can("fees", "export")
        : can("finance", "view"));

  useEffect(() => {
    let cancelled = false;
    const requests = [
      can("school", "view") ? api("/api/academic-years") : Promise.resolve([]),
      can("classes", "view") ? api("/api/classes") : Promise.resolve([]),
      can("classes", "view") ? api("/api/sections") : Promise.resolve([])
    ];
    Promise.allSettled(requests).then((results) => {
      if (cancelled) return;
      const [yearResult, classResult, sectionResult] = results;
      setYears(yearResult.status === "fulfilled" ? yearResult.value || [] : []);
      setClasses(classResult.status === "fulfilled" ? classResult.value || [] : []);
      setSections(sectionResult.status === "fulfilled" ? sectionResult.value || [] : []);
      const failedRequest = results.find((result) => result.status === "rejected");
      if (failedRequest?.status === "rejected") setOptionsError(failedRequest.reason.message);
    }).finally(() => {
      if (!cancelled) setOptionsLoading(false);
    });
    return () => { cancelled = true; };
  }, [can]);

  useEffect(() => {
    if (optionsLoading) return undefined;
    let cancelled = false;
    setLoading(true);
    setError("");
    setData(null);

    async function loadReport() {
      const yearFilter = ["overall", "collections", "payments"].includes(reportType)
        && appliedFilters.academicYearId
        ? years.find((year) => String(year.id) === String(appliedFilters.academicYearId))
        : null;
      let from = appliedFilters.from;
      let to = appliedFilters.to;
      if (yearFilter) {
        from = from || yearFilter.startDate || "";
        to = to || yearFilter.endDate || "";
      }
      const dateFilters = { from, to };
      let nextData;

      if (reportType === "overall") {
        const params = addParams({ ...appliedFilters, category: "" },
          ["academicYearId", "from", "to"]);
        nextData = { financial: await api(`/api/reports/financial?${params}`) };
      } else if (reportType === "collections" || reportType === "payments") {
        const params = addParams(appliedFilters,
          ["academicYearId", "classId", "sectionId", "from", "to"]);
        nextData = { financial: await api(`/api/reports/fee-dues?${params}`) };
      } else if (reportType === "dues") {
        const params = addParams(appliedFilters,
          ["academicYearId", "classId", "sectionId", "status"]);
        nextData = { financial: await api(`/api/reports/fee-dues?${params}`) };
      } else if (reportType === "payroll") {
        const staffQuery = appliedFilters.staffId
          ? `?staffId=${encodeURIComponent(appliedFilters.staffId)}`
          : "";
        const rows = await api(`/api/payroll${staffQuery}`);
        if (!appliedFilters.staffId && !cancelled) setPayrollOptions(rows || []);
        nextData = {
          payroll: (rows || []).filter((row) =>
            payrollInDateRange(row.payPeriod, dateFilters.from, dateFilters.to))
        };
      } else {
        const rows = await api("/api/expenses");
        if (!cancelled) setExpenseOptions(rows || []);
        nextData = {
          expenses: (rows || []).filter((row) =>
            inDateRange(row.expenseDate, dateFilters.from, dateFilters.to)
            && (!appliedFilters.category
              || appliedFilters.category.toLowerCase() === (row.category || "").toLowerCase()))
        };
      }
      if (!cancelled) setData(nextData);
    }

    loadReport().catch((err) => {
      if (!cancelled) {
        setData(null);
        setError(err.message);
      }
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [reportType, appliedFilters, optionsLoading, years]);

  useEffect(() => setQuery(""), [reportType]);

  const financial = data?.financial || { summary: {}, dues: [], collections: [] };
  const summary = financial.summary || {};
  const collections = financial.collections || [];
  const dues = financial.dues || [];
  const payroll = data?.payroll || [];
  const expenses = data?.expenses || [];

  const visibleCollections = useMemo(() => collections.filter((row) =>
    `${row.student || ""} ${row.receiptNumber || ""} ${row.invoiceNumber || ""}`
      .toLowerCase().includes(query.toLowerCase())), [collections, query]);
  const visibleDues = useMemo(() => dues.filter((row) =>
    `${row.student || ""} ${row.studentId || ""} ${row.className || ""} ${row.section || ""}`
      .toLowerCase().includes(query.toLowerCase())), [dues, query]);
  const visiblePayroll = useMemo(() => payroll.filter((row) =>
    `${row.staffName || ""} ${row.employeeId || ""} ${row.payPeriod || ""}`
      .toLowerCase().includes(query.toLowerCase())), [payroll, query]);
  const visibleExpenses = useMemo(() => expenses.filter((row) =>
    `${row.title || ""} ${row.category || ""} ${row.description || ""}`
      .toLowerCase().includes(query.toLowerCase())), [expenses, query]);
  const expenseCategories = useMemo(() =>
    [...new Set(expenseOptions.map((row) => row.category).filter(Boolean))].sort(),
  [expenseOptions]);
  const payrollStaff = useMemo(() =>
    [...new Map(payrollOptions.map((row) => [String(row.staffId), {
      id: row.staffId,
      name: row.staffName || row.employeeId || `Staff #${row.staffId}`,
      employeeId: row.employeeId
    }])).values()],
  [payrollOptions]);
  const availableSections = sections.filter((section) =>
    (!filters.academicYearId || String(section.academicYearId) === String(filters.academicYearId))
    && (!filters.classId || String(section.classId) === String(filters.classId)));

  function update(field, value) {
    setFilters((current) => ({
      ...current,
      [field]: value,
      ...(field === "classId" ? { sectionId: "" } : {})
    }));
  }

  function applyFilters(event) {
    event.preventDefault();
    setAppliedFilters({ ...filters });
  }

  function resetFilters() {
    setFilters({ ...emptyFilters });
    setAppliedFilters({ ...emptyFilters });
  }

  function viewRelatedReport(target) {
    if (["payroll", "expenses"].includes(target)
        && appliedFilters.academicYearId && !appliedFilters.from && !appliedFilters.to) {
      const year = years.find((item) => String(item.id) === String(appliedFilters.academicYearId));
      if (year) {
        const nextFilters = {
          ...filters,
          from: year.startDate || "",
          to: year.endDate || ""
        };
        setFilters(nextFilters);
        setAppliedFilters(nextFilters);
      }
    }
    setReportType(target);
  }

  function exportReport() {
    if (reportType === "overall") {
      exportCsv("financial-summary.csv", [{
        totalFeeCollection: summary.totalCollected || 0,
        outstandingStudentFees: summary.outstanding || 0,
        payroll: summary.totalPayroll || 0,
        expenses: summary.totalExpenses || 0,
        paymentRecords: collections.length
      }]);
    } else if (reportType === "collections" || reportType === "payments") {
      exportCsv(reportType === "collections" ? "fee-collection-report.csv" : "payment-records.csv",
        visibleCollections.map((row) => ({
          receiptNumber: row.receiptNumber,
          date: row.paymentDate || row.issuedOn,
          student: row.student,
          invoice: row.invoiceNumber,
          amount: row.amount,
          paymentMethod: row.paymentMethod
        })));
    } else if (reportType === "dues") {
      exportCsv("outstanding-fees-report.csv", visibleDues.map((row) => ({
        student: row.student,
        class: row.className,
        section: row.section,
        totalDue: row.totalDue,
        paid: row.totalPaid,
        concession: row.concessionAmount,
        outstanding: row.outstanding,
        status: row.status
      })));
    } else if (reportType === "payroll") {
      exportCsv("payroll-report.csv", visiblePayroll.map((row) => ({
        employee: row.staffName,
        employeeId: row.employeeId,
        payPeriod: row.payPeriod,
        basicSalary: row.basicSalary,
        allowances: row.allowances,
        deductions: row.deductions,
        netSalary: row.netSalary,
        status: row.status,
        paymentDate: row.paymentDate,
        paymentMethod: row.paymentMethod
      })));
    } else {
      exportCsv("expense-report.csv", visibleExpenses.map((row) => ({
        expense: row.title,
        category: row.category,
        date: row.expenseDate,
        amount: row.amount,
        paymentMethod: row.paymentMethod,
        status: row.status
      })));
    }
  }

  function summaryCard(label, value, target) {
    return <article className="stat-card financial-stat-card" key={label}>
      <span>{label}</span>
      <strong>{value}</strong>
      {target && availableReports.some(([value]) => value === target) && <button type="button" className="secondary"
        onClick={() => viewRelatedReport(target)}>View details</button>}
    </article>;
  }

  const reportTitle = REPORTS.find(([value]) => value === reportType)?.[1] || "Overall Summary";
  const activeFilters = [];
  if (["overall", "collections", "payments", "dues"].includes(reportType) && appliedFilters.academicYearId) {
    activeFilters.push(years.find((year) => String(year.id) === String(appliedFilters.academicYearId))?.name);
  }
  if (["overall", "collections", "payments", "payroll", "expenses"].includes(reportType)) {
    if (appliedFilters.from) activeFilters.push(`From ${appliedFilters.from}`);
    if (appliedFilters.to) activeFilters.push(`To ${appliedFilters.to}`);
  }
  if (["collections", "payments", "dues"].includes(reportType) && appliedFilters.classId) {
    activeFilters.push(classes.find((item) => String(item.id) === String(appliedFilters.classId))?.name);
  }
  if (["collections", "payments", "dues"].includes(reportType) && appliedFilters.sectionId) {
    const section = sections.find((item) => String(item.id) === String(appliedFilters.sectionId));
    activeFilters.push(section ? `Section ${section.name}` : null);
  }
  if (reportType === "dues" && appliedFilters.status) activeFilters.push(appliedFilters.status);
  if (reportType === "payroll" && appliedFilters.staffId) {
    activeFilters.push(payrollStaff.find((staff) => String(staff.id) === String(appliedFilters.staffId))?.name);
  }
  if (reportType === "expenses" && appliedFilters.category) activeFilters.push(appliedFilters.category);
  const hasVisibleRecords = reportType === "overall" || reportType === "collections" || reportType === "payments"
    ? visibleCollections.length > 0
    : reportType === "dues" ? visibleDues.length > 0
      : reportType === "payroll" ? visiblePayroll.length > 0
        : visibleExpenses.length > 0;

  return (
    <div className="financial-reports-page">
      <PageHeader title="Financial Reports" description="Choose a report to review its totals and the records behind them." />
      {error && <p className="error">{error}</p>}
      {optionsError && <p className="error">Some filter options could not be loaded: {optionsError}</p>}

      <section className="card financial-report-controls">
        <label className="financial-report-type">
          <span>Report Type</span>
          <select value={reportType} onChange={(event) => setReportType(event.target.value)}>
            {availableReports.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>

        <form className="financial-filter-form" onSubmit={applyFilters}>
          <h3>Report Filters</h3>
          <div className="financial-filter-grid">
            {["overall", "collections", "payments", "dues"].includes(reportType) && (
              <label>Academic Year
                <select value={filters.academicYearId} onChange={(event) => update("academicYearId", event.target.value)}>
                  <option value="">All Academic Years</option>
                  {years.map((year) => <option key={year.id} value={year.id}>{year.name}</option>)}
                </select>
              </label>
            )}
            {["collections", "payments"].includes(reportType) && can("classes", "view") && <>
              <label>Class
                <select value={filters.classId} onChange={(event) => update("classId", event.target.value)}>
                  <option value="">All Classes</option>
                  {classes.map((schoolClass) => <option key={schoolClass.id} value={schoolClass.id}>{schoolClass.name}</option>)}
                </select>
              </label>
              <label>Section
                <select value={filters.sectionId} onChange={(event) => update("sectionId", event.target.value)}>
                  <option value="">All Sections</option>
                  {availableSections.map((section) => <option key={section.id} value={section.id}>{section.name} ({section.className})</option>)}
                </select>
              </label>
            </>}
            {["overall", "collections", "payments", "payroll", "expenses"].includes(reportType) && <>
              <label>From Date
                <input type="date" value={filters.from} onChange={(event) => update("from", event.target.value)} />
              </label>
              <label>To Date
                <input type="date" value={filters.to} onChange={(event) => update("to", event.target.value)} />
              </label>
            </>}
            {reportType === "payroll" && <label>Staff Member
              <select value={filters.staffId} onChange={(event) => update("staffId", event.target.value)}>
                <option value="">All Staff</option>
                {payrollStaff.map((staff) => <option key={staff.id} value={staff.id}>
                  {staff.name}{staff.employeeId ? ` (${staff.employeeId})` : ""}
                </option>)}
              </select>
            </label>}
            {reportType === "dues" && can("classes", "view") && <>
              <label>Class
                <select value={filters.classId} onChange={(event) => update("classId", event.target.value)}>
                  <option value="">All Classes</option>
                  {classes.map((schoolClass) => <option key={schoolClass.id} value={schoolClass.id}>{schoolClass.name}</option>)}
                </select>
              </label>
              <label>Section
                <select value={filters.sectionId} onChange={(event) => update("sectionId", event.target.value)}>
                  <option value="">All Sections</option>
                  {availableSections.map((section) => <option key={section.id} value={section.id}>{section.name} ({section.className})</option>)}
                </select>
              </label>
              <label>Status
                <select value={filters.status} onChange={(event) => update("status", event.target.value)}>
                  <option value="">All Statuses</option>
                  <option>DUE</option><option>PARTIAL</option><option>PAID</option>
                </select>
              </label>
            </>}
            {reportType === "expenses" && <label>Expense Category
              <select value={filters.category} onChange={(event) => update("category", event.target.value)}>
                <option value="">All Categories</option>
                {expenseCategories.map((category) => <option key={category} value={category}>{category}</option>)}
              </select>
            </label>}
          </div>
          <div className="row financial-filter-actions">
            <button type="submit" disabled={loading}>Apply Filters</button>
            <button type="button" className="secondary" onClick={resetFilters} disabled={loading}>Reset</button>
          </div>
        </form>
      </section>

      <div className="row row-between financial-section-heading">
        <div>
          <h3>Summary</h3>
          <p className="muted">{reportTitle}{appliedFilters.academicYearId
            ? ` · ${years.find((year) => String(year.id) === String(appliedFilters.academicYearId))?.name || ""}`
            : " · All applicable periods"}</p>
          <p className="muted">Applied filters: {activeFilters.filter(Boolean).join(" · ") || "None"}</p>
        </div>
      </div>
      {loading ? <p className="muted">Loading report summary...</p> : <>
      {reportType === "overall" && <div className="stats-grid">
        {summaryCard("Total Fee Collection", amount(summary.totalCollected), "collections")}
        {summaryCard("Outstanding Student Fees", amount(summary.outstanding), "dues")}
        {summaryCard("Teacher/Staff Payroll", amount(summary.totalPayroll), "payroll")}
        {summaryCard("Total Expenses", amount(summary.totalExpenses), "expenses")}
        {summaryCard("Payment Records", String(collections.length), "payments")}
      </div>}
      {reportType === "collections" && <div className="stats-grid">
        {summaryCard("Total Collected", amount(summary.totalCollected))}
        {summaryCard("Transactions", String(collections.length))}
        {summaryCard("Average Payment", amount(collections.length
          ? Number(summary.totalCollected || 0) / collections.length : 0))}
      </div>}
      {reportType === "payments" && <div className="stats-grid">
        {summaryCard("Payment Records", String(collections.length))}
        {summaryCard("Total Payments", amount(summary.totalPayments ?? summary.totalCollected))}
      </div>}
      {reportType === "dues" && <div className="stats-grid">
        {summaryCard("Total Due", amount(summary.totalDue))}
        {summaryCard("Total Paid", amount(dues.reduce((total, row) => total + (Number(row.totalPaid) || 0), 0)))}
        {summaryCard("Concessions", amount(summary.totalConcession))}
        {summaryCard("Outstanding", amount(summary.outstanding))}
        {summaryCard("Student Accounts", String(dues.length))}
      </div>}
      {reportType === "payroll" && <div className="stats-grid">
        {summaryCard("Net Payroll", amount(sumAmounts(payroll, "netSalary")))}
        {summaryCard("Payroll Records", String(payroll.length))}
      </div>}
      {reportType === "expenses" && <div className="stats-grid">
        {summaryCard("Total Expenses", amount(sumAmounts(expenses, "amount")))}
        {summaryCard("Expense Records", String(expenses.length))}
      </div>}
      </>}

      <section className="card financial-records">
        <div className="row row-between financial-records-heading">
          <div>
            <h3>Detailed Records</h3>
            <p className="muted">{reportType === "overall" ? "Fee collection records included in the summary."
              : `${reportTitle} records matching the applied filters.`}</p>
          </div>
          <button type="button" className="secondary" onClick={exportReport} disabled={loading || !hasVisibleRecords}>
            Export {reportType === "overall" ? "Summary"
              : reportType === "collections" ? "Fee Collection"
                : reportType === "dues" ? "Outstanding Fees"
                  : reportType === "payroll" ? "Payroll"
                    : reportType === "expenses" ? "Expenses" : "Payment Records"}
          </button>
        </div>

        {!["overall"].includes(reportType) && <div className="financial-search">
          <label htmlFor="financial-report-search">Search {reportTitle}</label>
          <input id="financial-report-search" placeholder={
            reportType === "collections" ? "Student, admission ID or receipt number"
              : reportType === "dues" ? "Student or class"
                : reportType === "payroll" ? "Employee name or ID"
                  : reportType === "expenses" ? "Expense name or category"
                    : "Student, receipt or invoice number"
          } value={query} onChange={(event) => setQuery(event.target.value)} />
        </div>}

        {loading ? <p className="muted">Loading report records...</p>
          : error ? <p className="muted">Report records could not be loaded.</p>
            : !hasVisibleRecords ? <p className="muted">No records found for the selected filters.</p>
              : (reportType === "overall" || reportType === "collections" || reportType === "payments")
                ? <TableWrap><table>
                  <thead><tr><th>Receipt No</th><th>Date</th><th>Student</th><th>Amount</th><th>Payment Method</th><th>Invoice</th></tr></thead>
                  <tbody>{visibleCollections.map((row) => <tr key={row.id}>
                    <td>{row.receiptNumber || "—"}</td>
                    <td>{row.paymentDate || row.issuedOn || "—"}</td>
                    <td>{row.student || "—"}</td>
                    <td>{amount(row.amount)}</td>
                    <td>{row.paymentMethod || "—"}</td>
                    <td>{row.invoiceNumber || "—"}</td>
                  </tr>)}</tbody>
                </table></TableWrap>
                : reportType === "dues" ? <TableWrap><table>
                  <thead><tr><th>Student</th><th>Class</th><th>Section</th><th>Total Due</th><th>Paid</th><th>Concession</th><th>Outstanding</th><th>Status</th></tr></thead>
                  <tbody>{visibleDues.map((row) => <tr key={row.id}>
                    <td>{row.student || row.studentId}</td>
                    <td>{row.className || "—"}</td><td>{row.section || "—"}</td>
                    <td>{amount(row.totalDue)}</td><td>{amount(row.totalPaid)}</td>
                    <td>{amount(row.concessionAmount)}</td><td>{amount(row.outstanding)}</td>
                    <td><StatusBadge value={row.status} /></td>
                  </tr>)}</tbody>
                </table></TableWrap>
                  : reportType === "payroll" ? <TableWrap><table>
                    <thead><tr><th>Employee</th><th>Employee ID</th><th>Period</th><th>Basic Salary</th><th>Allowances</th><th>Deductions</th><th>Net Salary</th><th>Status</th></tr></thead>
                    <tbody>{visiblePayroll.map((row) => <tr key={row.id}>
                      <td>{row.staffName || "—"}</td><td>{row.employeeId || "—"}</td><td>{row.payPeriod}</td>
                      <td>{amount(row.basicSalary)}</td><td>{amount(row.allowances)}</td>
                      <td>{amount(row.deductions)}</td><td>{amount(row.netSalary)}</td>
                      <td><StatusBadge value={row.status} /></td>
                    </tr>)}</tbody>
                  </table></TableWrap>
                    : <TableWrap><table>
                      <thead><tr><th>Expense</th><th>Category</th><th>Date</th><th>Amount</th><th>Payment Method</th><th>Status</th></tr></thead>
                      <tbody>{visibleExpenses.map((row) => <tr key={row.id}>
                        <td>{row.title}</td><td>{row.category}</td><td>{row.expenseDate}</td>
                        <td>{amount(row.amount)}</td><td>{row.paymentMethod || "—"}</td>
                        <td><StatusBadge value={row.status} /></td>
                      </tr>)}</tbody>
                    </table></TableWrap>}
      </section>
    </div>
  );
}
