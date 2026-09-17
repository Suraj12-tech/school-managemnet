import { useEffect, useState } from "react";
import { api } from "../api/client.js";

export default function SubjectsPage() {
  const [departments, setDepartments] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [dept, setDept] = useState({ name: "", code: "" });
  const [subject, setSubject] = useState({ name: "", code: "", departmentId: "" });

  async function load() {
    setDepartments(await api("/api/departments"));
    setSubjects(await api("/api/subjects"));
  }
  useEffect(() => { load(); }, []);

  async function saveDept(e) {
    e.preventDefault();
    await api("/api/departments", "POST", dept);
    setDept({ name: "", code: "" });
    load();
  }

  async function saveSubject(e) {
    e.preventDefault();
    await api("/api/subjects", "POST", {
      ...subject,
      departmentId: subject.departmentId ? Number(subject.departmentId) : null
    });
    setSubject({ name: "", code: "", departmentId: "" });
    load();
  }

  return (
    <div>
      <h2>Subject & Department Management</h2>
      <form className="card" onSubmit={saveDept}>
        <h3>Department</h3>
        <input placeholder="Name" value={dept.name} onChange={(e) => setDept({ ...dept, name: e.target.value })} />
        <input placeholder="Code" value={dept.code} onChange={(e) => setDept({ ...dept, code: e.target.value })} />
        <button>Add department</button>
      </form>
      <form className="card" onSubmit={saveSubject}>
        <h3>Subject</h3>
        <select value={subject.departmentId} onChange={(e) => setSubject({ ...subject, departmentId: e.target.value })}>
          <option value="">Department (optional)</option>
          {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <input placeholder="Mathematics" value={subject.name} onChange={(e) => setSubject({ ...subject, name: e.target.value })} />
        <input placeholder="MATH" value={subject.code} onChange={(e) => setSubject({ ...subject, code: e.target.value })} />
        <button>Add subject</button>
      </form>
      <table>
        <thead><tr><th>Subject</th><th>Code</th><th>Dept ID</th></tr></thead>
        <tbody>{subjects.map((s) => <tr key={s.id}><td>{s.name}</td><td>{s.code}</td><td>{s.departmentId || "-"}</td></tr>)}</tbody>
      </table>
    </div>
  );
}
