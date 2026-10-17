import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../api/client.js";
import ActionModal from "../components/ActionModal.jsx";
import PageHeader from "../components/PageHeader.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import TableWrap from "../components/TableWrap.jsx";
import { exportCsv } from "../utils/exportCsv.js";

const emptyInvoiceForm = { studentId: "", feeStructureId: "", dueDate: "" };
const emptyPaymentForm = { invoiceId: "", amount: "", method: "CASH", referenceNo: "" };
const amount = (value) => Number(value || 0).toFixed(2);

function classAndSection(row) {
  return [row.className, row.sectionName].filter(Boolean).join(" / ") || "Not assigned";
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [students, setStudents] = useState([]);
  const [structures, setStructures] = useState([]);
  const [sections, setSections] = useState([]);
  const [classes, setClasses] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [feeHeads, setFeeHeads] = useState([]);
  const [form, setForm] = useState(emptyInvoiceForm);
  const [pay, setPay] = useState(emptyPaymentForm);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [viewingInvoice, setViewingInvoice] = useState(null);
  const [showCreateInvoiceForm, setShowCreateInvoiceForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [academicYearFilter, setAcademicYearFilter] = useState("ALL");
  const [classFilter, setClassFilter] = useState("ALL");
  const [sectionFilter, setSectionFilter] = useState("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const requestedStatus = searchParams.get("status");
    if (requestedStatus === "OVERDUE") setStatusFilter("OVERDUE");
  }, [searchParams]);

  async function load() {
    const [invoiceRows, receiptRows, studentRows, structureRows] = await Promise.all([
      api("/api/invoices"),
      api("/api/receipts"),
      api("/api/students"),
      api("/api/fee-structures")
    ]);
    setInvoices(invoiceRows);
    setReceipts(receiptRows);
    setStudents(studentRows);
    setStructures(structureRows);

    const [sectionResult, classResult, yearResult, feeHeadResult] = await Promise.allSettled([
      api("/api/sections"),
      api("/api/classes"),
      api("/api/academic-years"),
      api("/api/fee-heads")
    ]);
    if (sectionResult.status === "fulfilled") setSections(sectionResult.value || []);
    if (classResult.status === "fulfilled") setClasses(classResult.value || []);
    if (yearResult.status === "fulfilled") setAcademicYears(yearResult.value || []);
    if (feeHeadResult.status === "fulfilled") setFeeHeads(feeHeadResult.value || []);
    return { receipts: receiptRows };
  }

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, []);

  const payableInvoices = useMemo(
    () => invoices.filter((invoice) => invoice.status === "UNPAID" || invoice.status === "PARTIAL"),
    [invoices]
  );
  const selectedInvoice = payableInvoices.find((invoice) => String(invoice.id) === String(pay.invoiceId));
  const selectedStructure = structures.find((structure) => String(structure.id) === String(form.feeStructureId));
  const activeFilterCount = [
    academicYearFilter !== "ALL",
    statusFilter !== "ALL",
    classFilter !== "ALL",
    sectionFilter !== "ALL",
    Boolean(dateFrom),
    Boolean(dateTo)
  ].filter(Boolean).length;
  const isOverdue = (invoice) => {
    const today = new Date().toISOString().slice(0, 10);
    return (invoice.status === "UNPAID" || invoice.status === "PARTIAL")
      && invoice.dueDate && invoice.dueDate < today;
  };
  const visibleInvoices = invoices.filter((invoice) => {
    const matchesQuery = `${invoice.invoiceNumber} ${invoice.student} ${invoice.feeStructure}`
      .toLowerCase().includes(query.trim().toLowerCase());
    const matchesStatus = statusFilter === "ALL"
      || (statusFilter === "OVERDUE" ? isOverdue(invoice) : invoice.status === statusFilter);
    const matchesYear = academicYearFilter === "ALL"
      || String(invoice.academicYearId) === academicYearFilter;
    const matchesClass = classFilter === "ALL" || String(invoice.classId) === classFilter;
    const matchesSection = sectionFilter === "ALL" || String(invoice.sectionId) === sectionFilter;
    const matchesFrom = !dateFrom || (invoice.dueDate && invoice.dueDate >= dateFrom);
    const matchesTo = !dateTo || (invoice.dueDate && invoice.dueDate <= dateTo);
    return matchesQuery && matchesStatus && matchesYear && matchesClass
      && matchesSection && matchesFrom && matchesTo;
  });

  function openCreateInvoiceForm() {
    setError("");
    setActionError("");
    setForm(emptyInvoiceForm);
    setShowCreateInvoiceForm(true);
  }

  function closeCreateInvoiceForm() {
    setShowCreateInvoiceForm(false);
    setActionError("");
    setForm(emptyInvoiceForm);
  }

  function openPaymentForm() {
    setError("");
    setActionError("");
    setPay(emptyPaymentForm);
    setShowPaymentForm(true);
  }

  function closePaymentForm() {
    setShowPaymentForm(false);
    setActionError("");
    setPay(emptyPaymentForm);
  }

  function clearFilters() {
    setStatusFilter("ALL");
    setAcademicYearFilter("ALL");
    setClassFilter("ALL");
    setSectionFilter("ALL");
    setDateFrom("");
    setDateTo("");
  }

  async function createInvoice(event) {
    event.preventDefault();
    setActionError("");
    try {
      await api("/api/invoices", "POST", {
        studentId: Number(form.studentId),
        feeStructureId: Number(form.feeStructureId),
        dueDate: form.dueDate
      });
      closeCreateInvoiceForm();
      await load();
    } catch (err) {
      setActionError(err.message);
    }
  }

  async function payInvoice(event) {
    event.preventDefault();
    setActionError("");
    if (!selectedInvoice) {
      setActionError("Select an unpaid or partially paid invoice.");
      return;
    }
    const paymentAmount = Number(pay.amount);
    if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
      setActionError("Payment amount must be greater than 0.");
      return;
    }
    if (paymentAmount > Number(selectedInvoice.outstanding)) {
      setActionError("Payment amount cannot exceed the outstanding amount.");
      return;
    }
    try {
      const receipt = await api("/api/payments", "POST", {
        invoiceId: Number(pay.invoiceId),
        amount: paymentAmount,
        method: pay.method,
        referenceNo: pay.referenceNo
      });
      closePaymentForm();
      const loaded = await load();
      const detailedReceipt = loaded.receipts.find((item) => item.receiptNumber === receipt.receiptNumber);
      setSelectedReceipt(detailedReceipt || receipt);
    } catch (err) {
      setActionError(err.message);
    }
  }

  async function viewInvoice(invoice) {
    setError("");
    try {
      const [items, payments] = await Promise.all([
        api(`/api/invoices/${invoice.id}/items`),
        api(`/api/invoices/${invoice.id}/payments`)
      ]);
      setViewingInvoice({ ...invoice, items, payments });
    } catch (err) {
      setError(err.message);
    }
  }

  const studentOption = (student) => {
    const section = sections.find((item) => String(item.id) === String(student.currentSectionId));
    const group = section
      ? `${section.className || "Class"} / ${section.name}`
      : "Not assigned";
    const year = section?.academicYearName ? ` · ${section.academicYearName}` : "";
    return `${student.admissionNumber} · ${student.firstName} ${student.lastName} · ${group}${year}`;
  };

  const sectionsForFilter = sections.filter((section) =>
    (classFilter === "ALL" || String(section.classId) === classFilter)
    && (academicYearFilter === "ALL" || String(section.academicYearId) === academicYearFilter)
  );
  const paymentReceipt = (paymentId) => receipts.find((receipt) => receipt.paymentId === paymentId);
  const currentStructure = viewingInvoice
    ? structures.find((structure) => String(structure.id) === String(viewingInvoice.feeStructureId))
    : null;

  return (
    <div className="invoice-page">
      <PageHeader
        title="Invoices, payments & receipts"
        description="Create invoices, record payments, and review issued receipts."
        actions={<>
          <button type="button" onClick={openCreateInvoiceForm}>Create Invoice</button>
          <button type="button" className="secondary" onClick={openPaymentForm}>Record Payment</button>
        </>}
      />
      {error && <p className="error">{error}</p>}
      {statusFilter === "OVERDUE" && (
        <div className="card overdue-filter-banner">
          <strong>Showing overdue invoices</strong>
          <span>Unpaid or partially paid invoices past their due date.</span>
        </div>
      )}

      <section className="card invoice-search-bar">
        <label className="invoice-search-field">
          Search invoices
          <input
            placeholder="Search by invoice number, student, or fee structure"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <div className="invoice-search-actions">
          <button type="button" className="secondary" onClick={() => setShowFilters((shown) => !shown)}>
            Filters{activeFilterCount ? ` (${activeFilterCount})` : ""}
          </button>
          <button
            type="button"
            className="secondary"
            onClick={() => exportCsv("invoices.csv", visibleInvoices.map((invoice) => ({
              invoice: invoice.invoiceNumber,
              student: invoice.student,
              class: classAndSection(invoice),
              total: invoice.totalAmount,
              paid: invoice.paidAmount,
              outstanding: invoice.outstanding,
              status: invoice.status
            })))}
          >
            Export
          </button>
        </div>
      </section>
      {showFilters && (
        <section className="card invoice-filter-panel">
          <label>Academic Year
            <select value={academicYearFilter} onChange={(event) => {
              setAcademicYearFilter(event.target.value);
              setSectionFilter("ALL");
            }}>
              <option value="ALL">All academic years</option>
              {academicYears.map((year) => <option key={year.id} value={year.id}>{year.name}</option>)}
            </select>
          </label>
          <label>Status
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="ALL">All statuses</option>
              <option value="OVERDUE">OVERDUE</option>
              <option>UNPAID</option><option>PARTIAL</option><option>PAID</option>
            </select>
          </label>
          <label>Class
            <select value={classFilter} onChange={(event) => {
              setClassFilter(event.target.value);
              setSectionFilter("ALL");
            }}>
              <option value="ALL">All classes</option>
              {classes.map((schoolClass) => <option key={schoolClass.id} value={schoolClass.id}>{schoolClass.name}</option>)}
            </select>
          </label>
          <label>Section
            <select value={sectionFilter} onChange={(event) => setSectionFilter(event.target.value)}>
              <option value="ALL">All sections</option>
              {sectionsForFilter.map((section) => (
                <option key={section.id} value={section.id}>{section.className} / {section.name}</option>
              ))}
            </select>
          </label>
          <label>Due Date From<input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} /></label>
          <label>Due Date To<input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} /></label>
          <button type="button" className="secondary invoice-clear-filters" onClick={clearFilters}>Clear filters</button>
        </section>
      )}

      <TableWrap>
        <table className="invoice-table">
          <thead><tr>
            <th>Invoice Number</th><th>Student</th><th>Class/Section</th><th>Due Date</th>
            <th>Total</th><th>Paid</th><th>Outstanding</th><th>Status</th><th>Actions</th>
          </tr></thead>
          <tbody>
            {visibleInvoices.map((invoice) => (
              <tr key={invoice.id}>
                <td>{invoice.invoiceNumber}</td>
                <td>{invoice.student || invoice.studentId}</td>
                <td>{classAndSection(invoice)}</td>
                <td>{invoice.dueDate || "Not set"}</td>
                <td>{amount(invoice.totalAmount)}</td>
                <td>{amount(invoice.paidAmount)}</td>
                <td>{amount(invoice.outstanding)}</td>
                <td><StatusBadge value={invoice.status} /></td>
                <td><button type="button" className="secondary" onClick={() => viewInvoice(invoice)}>View</button></td>
              </tr>
            ))}
            {!visibleInvoices.length && <tr><td colSpan="9" className="muted">No invoices match the current filters.</td></tr>}
          </tbody>
        </table>
      </TableWrap>

      <ActionModal
        open={showCreateInvoiceForm}
        title="Create Invoice"
        onClose={closeCreateInvoiceForm}
        size="lg"
      >
        <form className="invoice-form" onSubmit={createInvoice}>
          {actionError && <p className="error field-span">{actionError}</p>}
          <label>Student
            <select required value={form.studentId} onChange={(event) => setForm({ ...form, studentId: event.target.value })}>
              <option value="">Select a student</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>{studentOption(student)}</option>
              ))}
            </select>
          </label>
          <label>Fee Structure
            <select required value={form.feeStructureId} onChange={(event) => setForm({ ...form, feeStructureId: event.target.value })}>
              <option value="">Select a fee structure</option>
              {structures.filter((structure) => structure.status === "ACTIVE").map((structure) => (
                <option key={structure.id} value={structure.id}>
                  {structure.name} · {structure.className || "Class not specified"} · {structure.academicYear || "Year not specified"}
                </option>
              ))}
            </select>
          </label>
          <label className="field-span">Due Date
            <input required type="date" value={form.dueDate} onChange={(event) => setForm({ ...form, dueDate: event.target.value })} />
          </label>
          {selectedStructure && (
            <div className="invoice-preview field-span">
              <h3>Invoice total: {amount(selectedStructure.totalAmount)}</h3>
              <p>{selectedStructure.className || "Class not specified"} · {selectedStructure.academicYear || "Academic year not specified"}</p>
              {selectedStructure.items?.length > 0 && (
                <ul>{selectedStructure.items.map((item) => (
                  <li key={item.id}>{item.feeHead}: {amount(item.amount)}</li>
                ))}</ul>
              )}
            </div>
          )}
          <div className="invoice-form-actions field-span">
            <button type="button" className="secondary" onClick={closeCreateInvoiceForm}>Cancel</button>
            <button type="submit">Create Invoice</button>
          </div>
        </form>
      </ActionModal>

      <ActionModal
        open={Boolean(viewingInvoice)}
        title={viewingInvoice ? `Invoice ${viewingInvoice.invoiceNumber}` : "Invoice Details"}
        onClose={() => setViewingInvoice(null)}
        size="lg"
      >
        {viewingInvoice && (
          <div className="invoice-detail">
            <dl className="invoice-detail-grid">
              <div><dt>Invoice Number</dt><dd>{viewingInvoice.invoiceNumber}</dd></div>
              <div><dt>Student</dt><dd>{viewingInvoice.student || viewingInvoice.studentId}</dd></div>
              <div><dt>Class / Section</dt><dd>{classAndSection(viewingInvoice)}</dd></div>
              <div><dt>Academic Year</dt><dd>{viewingInvoice.academicYear || currentStructure?.academicYear || "Not specified"}</dd></div>
              <div><dt>Due Date</dt><dd>{viewingInvoice.dueDate || "Not set"}</dd></div>
              <div><dt>Total Amount</dt><dd>{amount(viewingInvoice.totalAmount)}</dd></div>
              <div><dt>Paid Amount</dt><dd>{amount(viewingInvoice.paidAmount)}</dd></div>
              <div><dt>Outstanding Amount</dt><dd>{amount(viewingInvoice.outstanding)}</dd></div>
              <div><dt>Status</dt><dd><StatusBadge value={viewingInvoice.status} /></dd></div>
            </dl>
            <section>
              <h3>Fee-wise breakdown</h3>
              {viewingInvoice.items.length
                ? <TableWrap><table><thead><tr><th>Fee Head</th><th>Amount</th></tr></thead><tbody>
                  {viewingInvoice.items.map((item) => (
                    <tr key={item.id}>
                      <td>{feeHeads.find((head) => head.id === item.feeHeadId)?.name || `Fee head #${item.feeHeadId}`}</td>
                      <td>{amount(item.amount)}</td>
                    </tr>
                  ))}
                </tbody></table></TableWrap>
                : <p className="muted">No fee breakdown is available.</p>}
            </section>
            <section>
              <h3>Payment history</h3>
              {viewingInvoice.payments.length
                ? <TableWrap><table><thead><tr>
                  <th>Date</th><th>Amount</th><th>Payment Method</th><th>Reference</th><th>Receipt</th>
                </tr></thead><tbody>{viewingInvoice.payments.map((payment) => {
                  const receipt = paymentReceipt(payment.id);
                  return <tr key={payment.id}>
                    <td>{payment.paidOn || "Not recorded"}</td>
                    <td>{amount(payment.amount)}</td>
                    <td>{payment.method || "Not recorded"}</td>
                    <td>{payment.referenceNo || "—"}</td>
                    <td>{receipt ? <button type="button" className="linkish" onClick={() => setSelectedReceipt(receipt)}>{receipt.receiptNumber}</button> : "—"}</td>
                  </tr>;
                })}</tbody></table></TableWrap>
                : <p className="muted">No payments have been recorded.</p>}
            </section>
            <div className="invoice-form-actions">
              <button type="button" className="secondary" onClick={() => setViewingInvoice(null)}>Close</button>
            </div>
          </div>
        )}
      </ActionModal>

      <ActionModal open={showPaymentForm} title="Record Payment" onClose={closePaymentForm} size="lg">
        <form className="invoice-form" onSubmit={payInvoice}>
          {actionError && <p className="error field-span">{actionError}</p>}
          <label className="field-span">Invoice
            <select required value={pay.invoiceId} onChange={(event) => setPay({ ...pay, invoiceId: event.target.value, amount: "" })}>
              <option value="">Select an unpaid or partially paid invoice</option>
              {payableInvoices.map((invoice) => (
                <option key={invoice.id} value={invoice.id}>
                  {invoice.invoiceNumber} · {invoice.student} · Due {amount(invoice.outstanding)}
                </option>
              ))}
            </select>
          </label>
          {selectedInvoice && (
            <dl className="invoice-payment-summary field-span">
              <div><dt>Invoice Number</dt><dd>{selectedInvoice.invoiceNumber}</dd></div>
              <div><dt>Student</dt><dd>{selectedInvoice.student || selectedInvoice.studentId}</dd></div>
              <div><dt>Class / Section</dt><dd>{classAndSection(selectedInvoice)}</dd></div>
              <div><dt>Total Amount</dt><dd>{amount(selectedInvoice.totalAmount)}</dd></div>
              <div><dt>Already Paid</dt><dd>{amount(selectedInvoice.paidAmount)}</dd></div>
              <div><dt>Outstanding Amount</dt><dd>{amount(selectedInvoice.outstanding)}</dd></div>
              <div><dt>Status</dt><dd><StatusBadge value={selectedInvoice.status} /></dd></div>
            </dl>
          )}
          <label>Payment Amount
            <input
              required
              min="0.01"
              max={selectedInvoice?.outstanding || undefined}
              step="0.01"
              type="number"
              placeholder="Enter payment amount"
              value={pay.amount}
              onChange={(event) => setPay({ ...pay, amount: event.target.value })}
            />
          </label>
          <label>Payment Method
            <select required value={pay.method} onChange={(event) => setPay({ ...pay, method: event.target.value })}>
              <option>CASH</option><option>UPI</option><option>BANK</option>
            </select>
          </label>
          <label className="field-span">Reference Number
            <input placeholder="Optional reference number" value={pay.referenceNo} onChange={(event) => setPay({ ...pay, referenceNo: event.target.value })} />
          </label>
          <div className="invoice-form-actions field-span">
            <button type="button" className="secondary" onClick={closePaymentForm}>Cancel</button>
            <button type="submit" disabled={!selectedInvoice}>Pay & Generate Receipt</button>
          </div>
        </form>
      </ActionModal>

      <section className="invoice-receipts">
        <h2>Receipts</h2>
        <TableWrap><table><thead><tr>
          <th>Receipt Number</th><th>Date</th><th>Invoice</th><th>Student</th><th>Amount</th><th>Payment Method</th><th>Actions</th>
        </tr></thead><tbody>
          {receipts.map((receipt) => (
            <tr key={receipt.id}>
              <td>{receipt.receiptNumber}</td><td>{receipt.paymentDate}</td><td>{receipt.invoiceNumber}</td>
              <td>{receipt.student}</td><td>{amount(receipt.amount)}</td><td>{receipt.paymentMethod || "Not recorded"}</td>
              <td><button type="button" className="secondary" onClick={() => setSelectedReceipt(receipt)}>View Receipt</button></td>
            </tr>
          ))}
          {!receipts.length && <tr><td colSpan="7" className="muted">No receipts have been issued.</td></tr>}
        </tbody></table></TableWrap>
      </section>

      <ActionModal open={Boolean(selectedReceipt)} title="Receipt Details" onClose={() => setSelectedReceipt(null)}>
        {selectedReceipt && (
          <div className="receipt-detail">
            <dl className="invoice-detail-grid">
              <div><dt>Receipt Number</dt><dd>{selectedReceipt.receiptNumber}</dd></div>
              <div><dt>Date</dt><dd>{selectedReceipt.paymentDate || selectedReceipt.issuedOn || "Not recorded"}</dd></div>
              <div><dt>Invoice</dt><dd>{selectedReceipt.invoiceNumber || "Not recorded"}</dd></div>
              <div><dt>Student</dt><dd>{selectedReceipt.student || "Not recorded"}</dd></div>
              <div><dt>Amount</dt><dd>{amount(selectedReceipt.amount)}</dd></div>
              <div><dt>Payment Method</dt><dd>{selectedReceipt.paymentMethod || "Not recorded"}</dd></div>
            </dl>
            <div className="invoice-form-actions">
              <button type="button" className="secondary" onClick={() => setSelectedReceipt(null)}>Close</button>
            </div>
          </div>
        )}
      </ActionModal>
    </div>
  );
}
