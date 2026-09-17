import { useEffect, useState } from "react";
import { api } from "../api/client.js";

export default function YearsPage() {
  const [years, setYears] = useState([]);
  const [terms, setTerms] = useState([]);
  const [year, setYear] = useState({ name: "", startDate: "", endDate: "", currentYear: false });
  const [term, setTerm] = useState({ name: "", startDate: "", endDate: "", academicYearId: "" });

  async function load() {
    const y = await api("/api/academic-years");
    setYears(y);
    setTerms(await api("/api/terms"));
  }

  useEffect(() => { load(); }, []);

  async function saveYear(e) {
    e.preventDefault();
    await api("/api/academic-years", "POST", year);
    setYear({ name: "", startDate: "", endDate: "", currentYear: false });
    load();
  }

  async function makeCurrent(id) {
    await api("/api/academic-years/" + id + "/current", "POST");
    load();
  }

  async function saveTerm(e) {
    e.preventDefault();
    await api("/api/terms", "POST", { ...term, academicYearId: Number(term.academicYearId) });
    setTerm({ name: "", startDate: "", endDate: "", academicYearId: "" });
    load();
  }

  return (
    <div>
      <h2>Academic Year / Term Setup</h2>
      <form className="card" onSubmit={saveYear}>
        <h3>New year</h3>
        <input placeholder="2026-2027" value={year.name} onChange={(e) => setYear({ ...year, name: e.target.value })} />
        <input type="date" value={year.startDate} onChange={(e) => setYear({ ...year, startDate: e.target.value })} />
        <input type="date" value={year.endDate} onChange={(e) => setYear({ ...year, endDate: e.target.value })} />
        <button>Create year</button>
      </form>
      <table>
        <thead><tr><th>Name</th><th>Start</th><th>End</th><th>Current</th><th></th></tr></thead>
        <tbody>
          {years.map((y) => (
            <tr key={y.id}>
              <td>{y.name}</td><td>{y.startDate}</td><td>{y.endDate}</td>
              <td>{y.currentYear ? "Yes" : "No"}</td>
              <td>{!y.currentYear && <button onClick={() => makeCurrent(y.id)}>Set current</button>}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <form className="card" onSubmit={saveTerm}>
        <h3>New term</h3>
        <select value={term.academicYearId} onChange={(e) => setTerm({ ...term, academicYearId: e.target.value })}>
          <option value="">Select year</option>
          {years.map((y) => <option key={y.id} value={y.id}>{y.name}</option>)}
        </select>
        <input placeholder="Term 1" value={term.name} onChange={(e) => setTerm({ ...term, name: e.target.value })} />
        <input type="date" value={term.startDate} onChange={(e) => setTerm({ ...term, startDate: e.target.value })} />
        <input type="date" value={term.endDate} onChange={(e) => setTerm({ ...term, endDate: e.target.value })} />
        <button>Create term</button>
      </form>
      <ul>{terms.map((t) => <li key={t.id}>{t.name} (year #{t.academicYearId})</li>)}</ul>
    </div>
  );
}
