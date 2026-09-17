import { useEffect, useState } from "react";
import { api } from "../api/client.js";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [students, setStudents] = useState([]);
  const [structures, setStructures] = useState([]);
  const [form, setForm] = useState({ studentId: "", feeStructureId: "", dueDate: "" });
  const [pay, setPay] = useState({ invoiceId: "", amount: "", method: "CASH", referenceNo: "" });
  const [error, setError] = useState("");

  async function load() {
    setInvoices(await api("/api/invoices"));
    setReceipts(await api("/api/receipts"));
    setStudents(await api("/api/students"));
    setStructures(await api("/api/fee-structures"));
  }
  useEffect(() => { load(); }, []);

  async function createInvoice(e) {
    e.preventDefault();
    setError("");
    try {
      await api("/api/invoices", "POST", {
        studentId: Number(form.studentId),
        feeStructureId: Number(form.feeStructureId),
        dueDate: form.dueDate
      });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function payInvoice(e) {
    e.preventDefault();
    setError("");
    try {
      await api("/api/payments", "POST", {
        invoiceId: Number(pay.invoiceId),
        amount: Number(pay.amount),
        method: pay.method,
        referenceNo: pay.referenceNo
      });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <h2>Invoice / Payment / Receipt</h2>
      {error && <p className="error">{error}</p>}
      <form className="card" onSubmit={createInvoice}>
        <h3>Create invoice from fee structure</h3>
        <select value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })}>
          <option value="">Student</option>
          {students.map((s) => <option key={s.id} value={s.id}>{s.admissionNumber} {s.firstName}</option>)}
        </select>
        <select value={form.feeStructureId} onChange={(e) => setForm({ ...form, feeStructureId: e.target.value })}>
          <option value="">Fee structure</option>
          {structures.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
        <button>Create invoice</button>
      </form>
      <table>
        <thead><tr><th>Number</th><th>Student</th><th>Total</th><th>Status</th></tr></thead>
        <tbody>
          {invoices.map((i) => (
            <tr key={i.id}><td>{i.invoiceNumber}</td><td>{i.studentId}</td><td>{i.totalAmount}</td><td>{i.status}</td></tr>
          ))}
        </tbody>
      </table>
      <form className="card" onSubmit={payInvoice}>
        <h3>Record payment (receipt is generated automatically)</h3>
        <select value={pay.invoiceId} onChange={(e) => setPay({ ...pay, invoiceId: e.target.value })}>
          <option value="">Invoice</option>
          {invoices.map((i) => <option key={i.id} value={i.id}>{i.invoiceNumber} ({i.status})</option>)}
        </select>
        <input placeholder="Amount" value={pay.amount} onChange={(e) => setPay({ ...pay, amount: e.target.value })} />
        <select value={pay.method} onChange={(e) => setPay({ ...pay, method: e.target.value })}>
          <option>CASH</option><option>UPI</option><option>BANK</option>
        </select>
        <button>Pay & generate receipt</button>
      </form>
      <h3>Receipts</h3>
      <ul>{receipts.map((r) => <li key={r.id}>{r.receiptNumber} on {r.issuedOn}</li>)}</ul>
    </div>
  );
}
