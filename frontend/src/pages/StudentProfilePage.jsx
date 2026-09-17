import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api/client.js";
import PageHeader from "../components/PageHeader.jsx";

export default function StudentProfilePage() {
  const { id } = useParams();
  const [student, setStudent] = useState(null);
  const [sections, setSections] = useState([]);
  const [classes, setClasses] = useState([]);
  const [years, setYears] = useState([]);
  const [guardians, setGuardians] = useState([]);
  const [links, setLinks] = useState([]);
  const [docs, setDocs] = useState([]);
  const [history, setHistory] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [enroll, setEnroll] = useState({ sectionId: "", academicYearId: "", classId: "" });
  const [error, setError] = useState("");
  const [guardianId, setGuardianId] = useState("");
  const [guardianLink, setGuardianLink] = useState({ relationshipType: "FATHER", primaryGuardian: false, emergencyContact: false });
  const [doc, setDoc] = useState({ documentType: "BIRTH_CERTIFICATE", fileName: "" });

  async function load() {
    setStudent(await api("/api/students/" + id));
    setSections(await api("/api/sections"));
    setClasses(await api("/api/classes"));
    setYears(await api("/api/academic-years"));
    setGuardians(await api("/api/guardians"));
    setLinks(await api("/api/students/" + id + "/guardians"));
    setDocs(await api("/api/students/" + id + "/documents"));
    setHistory(await api("/api/students/" + id + "/history"));
    setEnrollments(await api("/api/students/" + id + "/enrollments"));
  }
  useEffect(() => { load(); }, [id]);

  async function save() {
    try {
      setError("");
      setStudent(await api("/api/students/" + id, "PUT", {
        admissionNumber: student.admissionNumber, firstName: student.firstName,
        lastName: student.lastName, dateOfBirth: student.dateOfBirth,
        gender: student.gender, email: student.email, phone: student.phone,
        status: student.status
      }));
    } catch (err) { setError(err.message); }
  }

  async function doEnroll() {
    try {
      setError("");
      await api("/api/enrollments", "POST", {
        studentId: Number(id), sectionId: Number(enroll.sectionId),
        academicYearId: Number(enroll.academicYearId), classId: Number(enroll.classId)
      });
      setEnroll({ sectionId: "", academicYearId: "", classId: "" });
      load();
    } catch (err) { setError(err.message); }
  }

  async function linkGuardian() {
    await api("/api/students/" + id + "/guardians", "POST", {
      guardianId: Number(guardianId), ...guardianLink
    });
    load();
  }

  async function unlinkGuardian(guardian) {
    await api("/api/students/" + id + "/guardians/" + guardian.guardianId, "DELETE");
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
      <PageHeader title={`Student profile — ${student.admissionNumber}`} description="Update the student record, enrollment, guardians, and documents." />
      {error && <p className="error">{error}</p>}
      <div className="profile-grid">
      <div className="card form-card">
        <h3>Student record</h3>
        <input value={student.admissionNumber} onChange={(e) => setStudent({ ...student, admissionNumber: e.target.value })} />
        <input value={student.firstName} onChange={(e) => setStudent({ ...student, firstName: e.target.value })} />
        <input value={student.lastName} onChange={(e) => setStudent({ ...student, lastName: e.target.value })} />
        <input type="date" value={student.dateOfBirth || ""} onChange={(e) => setStudent({ ...student, dateOfBirth: e.target.value })} />
        <select value={student.gender || ""} onChange={(e) => setStudent({ ...student, gender: e.target.value })}>
          <option value="">Gender</option><option>MALE</option><option>FEMALE</option><option>OTHER</option>
        </select>
        <input type="email" placeholder="Email" value={student.email || ""} onChange={(e) => setStudent({ ...student, email: e.target.value })} />
        <input value={student.phone || ""} onChange={(e) => setStudent({ ...student, phone: e.target.value })} />
        <select value={student.status} onChange={(e) => setStudent({ ...student, status: e.target.value })}>
          <option>ACTIVE</option><option>INACTIVE</option>
        </select>
        <button onClick={save}>Save profile</button>
      </div>
      <div className="card form-card">
        <h3>Enroll in section</h3>
        <select value={enroll.academicYearId} onChange={(e) => setEnroll({ ...enroll, academicYearId: e.target.value })}>
          <option value="">Year</option>
          {years.map((y) => <option key={y.id} value={y.id}>{y.name}</option>)}
        </select>
        <select value={enroll.classId} onChange={(e) => setEnroll({ ...enroll, classId: e.target.value, sectionId: "" })}>
          <option value="">Class</option>
          {classes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
        <select value={enroll.sectionId} onChange={(e) => setEnroll({ ...enroll, sectionId: e.target.value })}>
          <option value="">Section</option>
          {sections.filter((s) => !enroll.classId || String(s.classId) === String(enroll.classId))
            .filter((s) => !enroll.academicYearId || String(s.academicYearId) === String(enroll.academicYearId))
            .map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <button onClick={doEnroll}>Enroll</button>
      </div>
      <div className="card">
        <h3>Current enrollment</h3>
        {(() => {
          const current = enrollments.find((item) => item.sectionId === student.currentSectionId)
            || enrollments[enrollments.length - 1];
          const currentSection = sections.find((item) => item.id === current?.sectionId);
          const currentClass = classes.find((item) => item.id === currentSection?.classId);
          const currentYear = years.find((item) => item.id === current?.academicYearId);
          return current ? (
            <p>{currentYear?.name || `Year #${current.academicYearId}`} · {currentClass?.name || `Class #${currentSection?.classId}`} · Section {currentSection?.name || `#${current.sectionId}`} · {current.status}</p>
          ) : <p className="muted">No enrollment assigned.</p>;
        })()}
      </div>
      <div className="card form-card">
        <h3>Link guardian</h3>
        <select value={guardianId} onChange={(e) => setGuardianId(e.target.value)}>
          <option value="">Guardian</option>
          {guardians.map((g) => <option key={g.id} value={g.id}>{g.fullName}</option>)}
        </select>
        <select value={guardianLink.relationshipType} onChange={(e) => setGuardianLink({ ...guardianLink, relationshipType: e.target.value })}>
          <option>FATHER</option><option>MOTHER</option><option>LEGAL_GUARDIAN</option><option>OTHER</option>
        </select>
        <label><input type="checkbox" checked={guardianLink.primaryGuardian} onChange={(e) => setGuardianLink({ ...guardianLink, primaryGuardian: e.target.checked })} /> Primary guardian</label>
        <label><input type="checkbox" checked={guardianLink.emergencyContact} onChange={(e) => setGuardianLink({ ...guardianLink, emergencyContact: e.target.checked })} /> Emergency contact</label>
        <button onClick={linkGuardian}>Link</button>
        <ul>{links.map((l) => <li key={l.guardianId}>Guardian #{l.guardianId} — {l.relationshipType} {l.primaryGuardian ? "(primary)" : ""} {l.emergencyContact ? "(emergency)" : ""} <button className="secondary" onClick={() => unlinkGuardian(l)}>Remove</button></li>)}</ul>
      </div>
      <div className="card form-card">
        <h3>Document metadata</h3>
        <input placeholder="Type" value={doc.documentType} onChange={(e) => setDoc({ ...doc, documentType: e.target.value })} />
        <input placeholder="File name" value={doc.fileName} onChange={(e) => setDoc({ ...doc, fileName: e.target.value })} />
        <button onClick={addDoc}>Add</button>
        <ul>{docs.map((d) => <li key={d.id}>{d.documentType}: {d.fileName}</li>)}</ul>
      </div>
      </div>
      <div className="card">
        <h3>Academic-year history</h3>
        <ul className="list">{history.map((h) => <li key={h.id}>Year {h.academicYearId} class {h.classId} — {h.resultStatus}</li>)}</ul>
        {history.length === 0 && <p className="muted">No academic-year history yet.</p>}
      </div>
    </div>
  );
}
