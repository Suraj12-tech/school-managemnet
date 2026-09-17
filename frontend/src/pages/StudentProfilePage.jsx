import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api/client.js";

export default function StudentProfilePage() {
  const { id } = useParams();
  const [student, setStudent] = useState(null);
  const [sections, setSections] = useState([]);
  const [years, setYears] = useState([]);
  const [guardians, setGuardians] = useState([]);
  const [links, setLinks] = useState([]);
  const [docs, setDocs] = useState([]);
  const [history, setHistory] = useState([]);
  const [enroll, setEnroll] = useState({ sectionId: "", academicYearId: "" });
  const [guardianId, setGuardianId] = useState("");
  const [doc, setDoc] = useState({ documentType: "BIRTH_CERTIFICATE", fileName: "" });

  async function load() {
    setStudent(await api("/api/students/" + id));
    setSections(await api("/api/sections"));
    setYears(await api("/api/academic-years"));
    setGuardians(await api("/api/guardians"));
    setLinks(await api("/api/students/" + id + "/guardians"));
    setDocs(await api("/api/students/" + id + "/documents"));
    setHistory(await api("/api/students/" + id + "/history"));
  }
  useEffect(() => { load(); }, [id]);

  async function save() {
    setStudent(await api("/api/students/" + id, "PUT", student));
  }

  async function doEnroll() {
    await api("/api/enrollments", "POST", {
      studentId: Number(id),
      sectionId: Number(enroll.sectionId),
      academicYearId: Number(enroll.academicYearId)
    });
    load();
  }

  async function linkGuardian() {
    await api("/api/students/" + id + "/guardians", "POST", { guardianId: Number(guardianId), primaryGuardian: true });
    load();
  }

  async function addDoc() {
    await api("/api/students/" + id + "/documents", "POST", doc);
    setDoc({ documentType: "BIRTH_CERTIFICATE", fileName: "" });
    load();
  }

  if (!student) return <p>Loading...</p>;

  return (
    <div>
      <h2>Student Profile — {student.admissionNumber}</h2>
      <div className="card">
        <input value={student.firstName} onChange={(e) => setStudent({ ...student, firstName: e.target.value })} />
        <input value={student.lastName} onChange={(e) => setStudent({ ...student, lastName: e.target.value })} />
        <input value={student.phone || ""} onChange={(e) => setStudent({ ...student, phone: e.target.value })} />
        <input value={student.address || ""} onChange={(e) => setStudent({ ...student, address: e.target.value })} />
        <button onClick={save}>Save profile</button>
      </div>
      <div className="card">
        <h3>Enroll in section</h3>
        <select value={enroll.academicYearId} onChange={(e) => setEnroll({ ...enroll, academicYearId: e.target.value })}>
          <option value="">Year</option>
          {years.map((y) => <option key={y.id} value={y.id}>{y.name}</option>)}
        </select>
        <select value={enroll.sectionId} onChange={(e) => setEnroll({ ...enroll, sectionId: e.target.value })}>
          <option value="">Section</option>
          {sections.map((s) => <option key={s.id} value={s.id}>{s.name} (class {s.classId})</option>)}
        </select>
        <button onClick={doEnroll}>Enroll</button>
      </div>
      <div className="card">
        <h3>Link guardian</h3>
        <select value={guardianId} onChange={(e) => setGuardianId(e.target.value)}>
          <option value="">Guardian</option>
          {guardians.map((g) => <option key={g.id} value={g.id}>{g.fullName}</option>)}
        </select>
        <button onClick={linkGuardian}>Link</button>
        <ul>{links.map((l) => <li key={l.guardianId}>Guardian #{l.guardianId} {l.primaryGuardian ? "(primary)" : ""}</li>)}</ul>
      </div>
      <div className="card">
        <h3>Document metadata</h3>
        <input placeholder="Type" value={doc.documentType} onChange={(e) => setDoc({ ...doc, documentType: e.target.value })} />
        <input placeholder="File name" value={doc.fileName} onChange={(e) => setDoc({ ...doc, fileName: e.target.value })} />
        <button onClick={addDoc}>Add</button>
        <ul>{docs.map((d) => <li key={d.id}>{d.documentType}: {d.fileName}</li>)}</ul>
      </div>
      <h3>Academic-year history</h3>
      <ul>{history.map((h) => <li key={h.id}>Year {h.academicYearId} class {h.classId} — {h.resultStatus}</li>)}</ul>
    </div>
  );
}
