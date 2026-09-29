import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api/client.js";
import PageHeader from "../components/PageHeader.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import TableWrap from "../components/TableWrap.jsx";

export default function SectionDetailsPage() {
  const { classId, sectionId } = useParams();
  const [detail, setDetail] = useState(null);
  const [students, setStudents] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const sectionDetail = await api(`/api/sections/${sectionId}/detail`);
        setDetail(sectionDetail);
        setStudents(await api(`/api/sections/${sectionId}/students?academicYearId=${sectionDetail.section.academicYearId}`));
      } catch (err) { setError(err.message); }
    }
    load();
  }, [sectionId]);

  const section = detail?.section;
  return (
    <div>
      <p className="breadcrumb">
        <Link to="/classes">Classes / Grades</Link> &gt;{" "}
        <Link to={`/classes/${classId}?academicYearId=${section?.academicYearId || ""}`}>{section?.className || "Class"}</Link> &gt; {section?.name || "Section"}
      </p>
      <PageHeader title={`${section?.className || "Class"} - Section ${section?.name || ""}`} description="Students enrolled in this section and academic year." />
      {error && <p className="error">{error}</p>}
      {section && <div className="card">
        <p><strong>Class:</strong> {section.className}</p>
        <p><strong>Section:</strong> {section.name}</p>
        <p><strong>Academic Year:</strong> {section.academicYearName}</p>
        <p><strong>Class Teacher:</strong> {section.classTeacherName || "Not assigned"}</p>
        <p><strong>Total Students:</strong> {students.length}</p>
      </div>}
      <TableWrap>
        <table>
          <thead><tr><th>Student Name</th><th>Admission ID</th><th>Class</th><th>Section</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>
            {students.map((student) => (
              <tr key={student.id}>
                <td>{student.firstName} {student.lastName}</td>
                <td>{student.admissionNumber}</td>
                <td>{student.className}</td>
                <td>{student.sectionName}</td>
                <td><StatusBadge value={student.status} /></td>
                <td><Link to={`/students/${student.id}?returnTo=/classes/${classId}/sections/${sectionId}`}><button type="button">View</button></Link></td>
              </tr>
            ))}
            {!students.length && <tr><td colSpan="6" className="muted">No students are enrolled in this section for the selected academic year.</td></tr>}
          </tbody>
        </table>
      </TableWrap>
    </div>
  );
}
