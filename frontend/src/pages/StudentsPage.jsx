import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState({
    admissionNumber: "", firstName: "", lastName: "", gender: "MALE", dateOfBirth: "", status: "ACTIVE"
  });
  const [error, setError] = useState("");

  async function load() {
    setStudents(await api("/api/students"));
  }
  useEffect(() => { load(); }, []);

  async function save(e) {
    e.preventDefault();
    setError("");
    try {
      await api("/api/students", "POST", form);
      setForm({ admissionNumber: "", firstName: "", lastName: "", gender: "MALE", dateOfBirth: "", status: "ACTIVE" });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <h2>Student List</h2>
      {error && <p className="error">{error}</p>}
      <form className="card" onSubmit={save}>
        <input placeholder="Admission no" value={form.admissionNumber} onChange={(e) => setForm({ ...form, admissionNumber: e.target.value })} />
        <input placeholder="First name" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
        <input placeholder="Last name" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
        <input type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} />
        <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
          <option>MALE</option><option>FEMALE</option>
        </select>
        <button>Create student</button>
      </form>
      <table>
        <thead><tr><th>Adm No</th><th>Name</th><th>Status</th><th>Section</th></tr></thead>
        <tbody>
          {students.map((s) => (
            <tr key={s.id}>
              <td><Link to={"/students/" + s.id}>{s.admissionNumber}</Link></td>
              <td>{s.firstName} {s.lastName}</td>
              <td>{s.status}</td>
              <td>{s.currentSectionId || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
