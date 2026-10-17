import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client.js";
import PageHeader from "../components/PageHeader.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import TableWrap from "../components/TableWrap.jsx";

export default function GuardianProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [years, setYears] = useState([]);
  const [academicYearId, setAcademicYearId] = useState("");
  const [yearsLoaded, setYearsLoaded] = useState(false);
  const [guardian, setGuardian] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    api("/api/academic-years").then((yearRows) => {
      if (cancelled) return;
      const availableYears = yearRows || [];
      const currentOrFirst = availableYears.find((year) => year.currentYear)
        || availableYears.find((year) => year.status !== "ARCHIVED")
        || availableYears[0];
      setYears(availableYears);
      if (currentOrFirst) setAcademicYearId(String(currentOrFirst.id));
      setYearsLoaded(true);
    }).catch((err) => {
      if (!cancelled) {
        setError(err.message);
        setYearsLoaded(true);
      }
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!yearsLoaded) return undefined;
    let cancelled = false;
    setLoading(true);
    setError("");
    const yearQuery = academicYearId ? `?academicYearId=${academicYearId}` : "";
    api(`/api/guardians/${id}${yearQuery}`).then((data) => {
      if (!cancelled) setGuardian(data);
    }).catch((err) => {
      if (!cancelled) setError(err.message);
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [id, academicYearId, yearsLoaded]);

  if (loading) return <p>Loading guardian details...</p>;
  if (!guardian) return <div>{error && <p className="error">{error}</p>}<Link to="/guardians">Back to Guardians</Link></div>;

  const returnTo = `/guardians/${id}${academicYearId ? `?academicYearId=${academicYearId}` : ""}`;
  return (
    <div>
      <PageHeader
        title={guardian.fullName}
        description={`${guardian.relationType || "Guardian"} · ${guardian.status}`}
        actions={<>
          <Link to="/guardians" className="teacher-profile-back">Back to Guardians</Link>
          <button type="button" onClick={() => navigate(`/guardians?edit=${guardian.id}`)}>Edit Guardian</button>
        </>}
      />
      {error && <p className="error">{error}</p>}

      <section className="card guardian-information">
        <h3>Guardian Information</h3>
        <div><span className="muted">Full Name</span><strong>{guardian.fullName}</strong></div>
        <div><span className="muted">Relationship</span><strong>{guardian.relationType || "—"}</strong></div>
        <div><span className="muted">Phone</span><strong>{guardian.phone || "—"}</strong></div>
        <div><span className="muted">Email</span><strong>{guardian.email || "—"}</strong></div>
        <div><span className="muted">Address</span><strong>{guardian.address || "—"}</strong></div>
        <div><span className="muted">Occupation</span><strong>{guardian.occupation || "—"}</strong></div>
        <div><span className="muted">Emergency Contact</span><strong>{guardian.emergencyContact ? "Yes" : "No"}</strong></div>
        <div><span className="muted">Status</span><StatusBadge value={guardian.status} /></div>
      </section>

      <section className="card">
        <div className="row row-between guardian-students-heading">
          <h3>Associated Students</h3>
          {years.length > 0 && <label className="guardian-year-select">
            <span className="muted">Academic Year</span>
            <select value={academicYearId} onChange={(event) => setAcademicYearId(event.target.value)}>
              {years.map((year) => <option key={year.id} value={year.id}>{year.name}</option>)}
            </select>
          </label>}
        </div>
        {guardian.students?.length ? <TableWrap>
          <table>
            <thead><tr><th>Student</th><th>Admission ID</th><th>Class</th><th>Section</th><th>Relationship</th><th>Student Status</th><th>Action</th></tr></thead>
            <tbody>{guardian.students.map((student) => <tr key={student.studentId}>
              <td><Link to={`/students/${student.studentId}?returnTo=${encodeURIComponent(returnTo)}`}>{student.studentName}</Link></td>
              <td>{student.admissionNumber}</td>
              <td>{student.className || "—"}</td>
              <td>{student.sectionName || "—"}</td>
              <td>{student.relationshipType || guardian.relationType || "—"}
                {student.primaryGuardian ? " · Primary" : ""}
                {student.emergencyContact ? " · Emergency" : ""}
              </td>
              <td><StatusBadge value={student.studentStatus || "UNKNOWN"} /></td>
              <td><Link to={`/students/${student.studentId}?returnTo=${encodeURIComponent(returnTo)}`}>View Profile</Link></td>
            </tr>)}</tbody>
          </table>
        </TableWrap> : <p className="muted">No students are currently associated with this guardian.</p>}
      </section>
    </div>
  );
}
