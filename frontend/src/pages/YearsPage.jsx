import { useEffect, useState } from "react";
import { api } from "../api/client.js";

const emptyYear = { name: "", startDate: "", endDate: "", status: "RUNNING" };
const emptyTerm = { name: "", startDate: "", endDate: "", academicYearId: "", status: "ACTIVE" };

export default function YearsPage() {
  const [years, setYears] = useState([]);
  const [terms, setTerms] = useState([]);
  const [year, setYear] = useState(emptyYear);
  const [term, setTerm] = useState(emptyTerm);
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedTerm, setSelectedTerm] = useState(null);
  const [editingYearId, setEditingYearId] = useState(null);
  const [editingTermId, setEditingTermId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    try {
      setError("");
      const loadedYears = await api("/api/academic-years");
      setYears(loadedYears);
      setTerms(await api("/api/terms"));
      setTerm((current) => {
        if (current.academicYearId) return current;
        const activeYear = loadedYears.find((item) => item.status !== "ARCHIVED");
        return activeYear ? { ...current, academicYearId: String(activeYear.id) } : current;
      });
      if (selectedYear) {
        const refreshed = loadedYears.find((item) => item.id === selectedYear.id);
        setSelectedYear(refreshed || null);
      }
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => { load(); }, []);

  async function saveYear(e) {
    e.preventDefault();
    try {
      setError("");
      const payload = { ...year, status: year.status === "RUNNING" ? "ACTIVE" : "ARCHIVED" };
      await api(editingYearId ? "/api/academic-years/" + editingYearId : "/api/academic-years",
        editingYearId ? "PUT" : "POST", payload);
      setYear(emptyYear);
      setEditingYearId(null);
      setMessage(editingYearId ? "Academic year updated" : "Academic year created");
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function saveTerm(e) {
    e.preventDefault();
    try {
      setError("");
      const body = { ...term, academicYearId: Number(term.academicYearId) };
      await api(editingTermId ? "/api/terms/" + editingTermId : "/api/terms",
        editingTermId ? "PUT" : "POST", body);
      setTerm(emptyTerm);
      setEditingTermId(null);
      setMessage(editingTermId ? "Term updated" : "Term created");
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function setCurrent(id) {
    try {
      await api("/api/academic-years/" + id + "/current", "POST");
      setMessage("Current academic year updated");
      load();
    } catch (err) { setError(err.message); }
  }

  async function updateYearStatus(item) {
    try {
      const status = item.status === "ARCHIVED" ? "ACTIVE" : "ARCHIVED";
      await api("/api/academic-years/" + item.id + "/status", "PATCH", { status });
      setMessage("Academic year status updated");
      load();
    } catch (err) { setError(err.message); }
  }

  async function updateTermStatus(item) {
    try {
      const status = item.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
      await api("/api/terms/" + item.id + "/status", "PATCH", { status });
      setMessage("Term status updated");
      load();
    } catch (err) { setError(err.message); }
  }

  async function removeTerm(id) {
    try {
      setError("");
      await api("/api/terms/" + id + "/delete", "POST");
      setMessage("Term deleted");
      load();
    } catch (err) { setError(err.message); }
  }

  function editYear(item) {
    setEditingYearId(item.id);
    setYear({
      name: item.name,
      startDate: item.startDate,
      endDate: item.endDate,
      status: item.status === "ARCHIVED" ? "END" : "RUNNING"
    });
  }

  function editTerm(item) {
    setEditingTermId(item.id);
    setTerm({
      name: item.name,
      startDate: item.startDate,
      endDate: item.endDate,
      academicYearId: String(item.academicYearId),
      status: item.status
    });
  }

  function cancelYearEdit() {
    setEditingYearId(null);
    setYear(emptyYear);
  }

  function cancelTermEdit() {
    setEditingTermId(null);
    setTerm(emptyTerm);
  }

  function yearDisplayStatus(item) {
    const today = new Date().toISOString().slice(0, 10);
    return item.status === "ARCHIVED" || item.endDate < today ? "END" : item.currentYear ? "RUNNING" : "END";
  }

  return (
    <div>
      <h2>Academic Year / Term Setup</h2>
      {message && <p className="ok">{message}</p>}
      {error && <p className="error">{error}</p>}

      <form className="card" onSubmit={saveYear}>
        <h3>{editingYearId ? "Edit academic year" : "New academic year"}</h3>
        <input required placeholder="2026-2027" value={year.name} onChange={(e) => setYear({ ...year, name: e.target.value })} />
        <input required type="date" value={year.startDate} onChange={(e) => setYear({ ...year, startDate: e.target.value })} />
        <input required type="date" value={year.endDate} onChange={(e) => setYear({ ...year, endDate: e.target.value })} />
        <label>Academic year status</label>
        <select value={year.status} onChange={(e) => setYear({ ...year, status: e.target.value })}>
          <option value="RUNNING">Running</option><option value="END">End</option>
        </select>
        <div className="row">
          <button>{editingYearId ? "Update year" : "Create year"}</button>
          {editingYearId && <button type="button" className="secondary" onClick={cancelYearEdit}>Cancel</button>}
        </div>
      </form>

      <h3>Academic Year List</h3>
      <table>
        <thead><tr><th>Academic Year</th><th>Start</th><th>End</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>
          {years.map((item) => (
            <tr key={item.id}>
              <td><button type="button" className="linkish" onClick={() => setSelectedYear(item)}>{item.name}</button></td>
              <td>{item.startDate}</td><td>{item.endDate}</td><td>{yearDisplayStatus(item)}</td>
              <td>
                <button type="button" className="secondary" onClick={() => editYear(item)}>Edit</button>{" "}
                {!item.currentYear && item.status === "ACTIVE" && <button type="button" onClick={() => setCurrent(item.id)}>Set current</button>}{" "}
                <button type="button" onClick={() => updateYearStatus(item)}>
                  {item.status === "ARCHIVED" ? "Activate" : "Archive"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedYear && (
        <div className="card">
          <h3>{selectedYear.name}</h3>
          <p>{selectedYear.startDate} to {selectedYear.endDate}</p>
          <p>Status: {selectedYear.status} · Current: {selectedYear.currentYear ? "Yes" : "No"}</p>
          <button type="button" className="secondary" onClick={() => setSelectedYear(null)}>Close</button>
        </div>
      )}

      <form className="card" onSubmit={saveTerm}>
        <h3>{editingTermId ? "Edit term" : "New term"}</h3>
        <select required value={term.academicYearId} onChange={(e) => setTerm({ ...term, academicYearId: e.target.value })}>
          <option value="">Select year</option>
          {years.filter((item) => item.status !== "ARCHIVED").map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
        <input required placeholder="Term 1" value={term.name} onChange={(e) => setTerm({ ...term, name: e.target.value })} />
        <input required type="date" value={term.startDate} onChange={(e) => setTerm({ ...term, startDate: e.target.value })} />
        <input required type="date" value={term.endDate} onChange={(e) => setTerm({ ...term, endDate: e.target.value })} />
        <select value={term.status} onChange={(e) => setTerm({ ...term, status: e.target.value })}>
          <option>ACTIVE</option><option>INACTIVE</option>
        </select>
        <div className="row">
          <button>{editingTermId ? "Update term" : "Create term"}</button>
          {editingTermId && <button type="button" className="secondary" onClick={cancelTermEdit}>Cancel</button>}
        </div>
      </form>

      <h3>Terms by Academic Year</h3>
      {years.map((yearItem) => {
        const yearTerms = terms.filter((item) => item.academicYearId === yearItem.id);
        return (
          <div className="card" key={yearItem.id}>
            <h3>{yearItem.name} <span className="muted">({yearDisplayStatus(yearItem)})</span></h3>
            <table>
              <thead><tr><th>Term</th><th>Start</th><th>End</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {yearTerms.length === 0 && <tr><td colSpan="5" className="muted">No terms added</td></tr>}
                {yearTerms.map((item) => (
                  <tr key={item.id}>
                    <td><button type="button" className="linkish" onClick={() => setSelectedTerm(item)}>{item.name}</button></td>
                    <td>{item.startDate}</td><td>{item.endDate}</td><td>{item.status === "ACTIVE" ? "RUNNING" : "END"}</td>
                    <td><button type="button" className="secondary" onClick={() => editTerm(item)}>Edit</button>{" "}
                      <button type="button" onClick={() => updateTermStatus(item)}>{item.status === "ACTIVE" ? "Deactivate" : "Activate"}</button>{" "}
                      <button type="button" onClick={() => removeTerm(item.id)}>Delete</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
      {selectedTerm && (
        <div className="card">
          <h3>{selectedTerm.name}</h3>
          <p>Academic year: {years.find((item) => item.id === selectedTerm.academicYearId)?.name || `#${selectedTerm.academicYearId}`}</p>
          <p>{selectedTerm.startDate} to {selectedTerm.endDate} · Status: {selectedTerm.status}</p>
          <button type="button" className="secondary" onClick={() => setSelectedTerm(null)}>Close</button>
        </div>
      )}
    </div>
  );
}
