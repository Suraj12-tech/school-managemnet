import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client.js";
import PageHeader from "../components/PageHeader.jsx";
import StatusBadge from "../components/StatusBadge.jsx";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [students, setStudents] = useState([]);
  const [structures, setStructures] = useState([]);
  const [form, setForm] = useState({ studentId: "", feeStructureId: "", dueDate: "" });
  const [pay, setPay] = useState({ invoiceId: "", amount: "", method: "CASH", referenceNo: "" });
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [viewingInvoice, setViewingInvoice] = useState(null);
  const [error, setError] = useState("");

  async function load() {
    const [invoiceRows, receiptRows, studentRows, structureRows] = await Promise.all([
      api("/api/invoices"), api("/api/receipts"), api("/api/students"), api("/api/fee-structures")
    ]);
    setInvoices(invoiceRows);
    setReceipts(receiptRows);
    setStudents(studentRows);
    setStructures(structureRows);
    return { receipts: receiptRows };
  }
  useEffect(() => { load().catch((err) => setError(err.message)); }, []);

  const payableInvoices = useMemo(
    () => invoices.filter((invoice) => invoice.status === "UNPAID" || invoice.status === "PARTIAL"),
    [invoices]
  );
  const selectedInvoice = payableInvoices.find((invoice) => String(invoice.id) === String(pay.invoiceId));

  async function createInvoice(e) {
    e.preventDefault();
    setError("");
    try {
      await api("/api/invoices", "POST", {
        studentId: Number(form.studentId), feeStructureId: Number(form.feeStructureId), dueDate: form.dueDate
      });
      setForm({ studentId: "", feeStructureId: "", dueDate: "" });
      await load();
    } catch (err) { setError(err.message); }
  }

  async function payInvoice(e) {
    e.preventDefault();
    setError("");
    try {
      const receipt = await api("/api/payments", "POST", {
        invoiceId: Number(pay.invoiceId), amount: Number(pay.amount),
        method: pay.method, referenceNo: pay.referenceNo
      });
      setPay({ invoiceId: "", amount: "", method: "CASH", referenceNo: "" });
      const loaded = await load();
      const detailed = loaded.receipts.find((item) => item.receiptNumber === receipt.receiptNumber);
      setSelectedReceipt(detailed || receipt);
    } catch (err) { setError(err.message); }
  }

  async function viewInvoice(invoice) {
    try {
      const items = await api(`/api/invoices/${invoice.id}/items`);
      setViewingInvoice({ ...invoice, items });
    } catch (err) { setError(err.message); }
  }

  return (
    <div>
      <PageHeader title="Invoices, payments & receipts" description="Create invoices, record payments, and review issued receipts." />
      {error && <p className="error">{error}</p>}
      <form className="card form-card" onSubmit={createInvoice}>
        <h3>Create invoice from fee structure</h3>
        <select required value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })}>
          <option value="">Student</option>
          {students.map((student) => <option key={student.id} value={student.id}>{student.admissionNumber} {student.firstName} {student.lastName}</option>)}
        </select>
        <select required value={form.feeStructureId} onChange={(e) => setForm({ ...form, feeStructureId: e.target.value })}>
          <option value="">Fee structure</option>
          {structures.filter((structure) => structure.status === "ACTIVE").map((structure) =>
            <option key={structure.id} value={structure.id}>{structure.name} ({structure.totalAmount})</option>)}
        </select>
        <input required type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
        <button>Create invoice</button>
      </form>

      <table>
        <thead><tr><th>Invoice No</th><th>Student</th><th>Fee Structure</th><th>Total</th><th>Paid</th><th>Outstanding</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>{invoices.map((invoice) => (
          <tr key={invoice.id}>
            <td>{invoice.invoiceNumber}</td><td>{invoice.student || invoice.studentId}</td>
            <td>{invoice.feeStructure || invoice.feeStructureId || "-"}</td>
            <td>{Number(invoice.totalAmount).toFixed(2)}</td><td>{Number(invoice.paidAmount).toFixed(2)}</td>
            <td>{Number(invoice.outstanding).toFixed(2)}</td><td><StatusBadge value={invoice.status} /></td>
            <td><button type="button" onClick={() => viewInvoice(invoice)}>View</button></td>
          </tr>
        ))}</tbody>
      </table>
      {viewingInvoice && <div className="card">
        <h3>Invoice {viewingInvoice.invoiceNumber}</h3>
        <p>Student: {viewingInvoice.student} | Fee structure: {viewingInvoice.feeStructure || "-"}</p>
        <p>Total: {viewingInvoice.totalAmount} | Paid: {viewingInvoice.paidAmount} | Outstanding: {viewingInvoice.outstanding}</p>
        <ul>{(viewingInvoice.items || []).map((item) => <li key={item.id}>Fee head #{item.feeHeadId}: {item.amount}</li>)}</ul>
        <button type="button" onClick={() => setViewingInvoice(null)}>Close</button>
      </div>}

      <form className="card form-card" onSubmit={payInvoice}>
        <h3>Record payment</h3>
        <select required value={pay.invoiceId} onChange={(e) => setPay({ ...pay, invoiceId: e.target.value, amount: "" })}>
          <option value="">Unpaid or partial invoice</option>
          {payableInvoices.map((invoice) =>
            <option key={invoice.id} value={invoice.id}>{invoice.invoiceNumber} - {invoice.student} (Outstanding: {invoice.outstanding})</option>)}
        </select>
        {selectedInvoice && <p>Total: {selectedInvoice.totalAmount} | Already paid: {selectedInvoice.paidAmount} | Outstanding: {selectedInvoice.outstanding}</p>}
        <input required min="0.01" max={selectedInvoice?.outstanding || undefined} step="0.01" type="number"
          placeholder="Amount" value={pay.amount} onChange={(e) => setPay({ ...pay, amount: e.target.value })} />
        <select value={pay.method} onChange={(e) => setPay({ ...pay, method: e.target.value })}>
          <option>CASH</option><option>UPI</option><option>BANK</option>
        </select>
        <input placeholder="Reference number" value={pay.referenceNo} onChange={(e) => setPay({ ...pay, referenceNo: e.target.value })} />
        <button disabled={!selectedInvoice}>Pay & generate receipt</button>
      </form>

      <h3>Receipts</h3>
      <table>
        <thead><tr><th>Receipt No</th><th>Date</th><th>Invoice</th><th>Student</th><th>Amount</th><th>Method</th><th>Actions</th></tr></thead>
        <tbody>{receipts.map((receipt) => <tr key={receipt.id}>
          <td>{receipt.receiptNumber}</td><td>{receipt.paymentDate}</td><td>{receipt.invoiceNumber}</td>
          <td>{receipt.student}</td><td>{receipt.amount}</td><td>{receipt.paymentMethod}</td>
          <td><button type="button" onClick={() => setSelectedReceipt(receipt)}>View Receipt</button></td>
        </tr>)}</tbody>
      </table>
      {selectedReceipt && <div className="card">
        <h3>Receipt {selectedReceipt.receiptNumber}</h3>
        <p>Date: {selectedReceipt.paymentDate || selectedReceipt.issuedOn}</p>
        <p>Invoice: {selectedReceipt.invoiceNumber || "-"}</p>
        <p>Student: {selectedReceipt.student || "-"}</p>
        <p>Amount: {selectedReceipt.amount || "-"}</p>
        <p>Payment method: {selectedReceipt.paymentMethod || "-"}</p>
        <button type="button" onClick={() => setSelectedReceipt(null)}>Close</button>
      </div>}
    </div>
  );
}
