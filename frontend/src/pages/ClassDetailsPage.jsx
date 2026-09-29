import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { api } from "../api/client.js";
import PageHeader from "../components/PageHeader.jsx";
import TableWrap from "../components/TableWrap.jsx";

export default function ClassDetailsPage() {
  const { classId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [klass, setKlass] = useState(null);
  const [sections, setSections] = useState([]);
  const [years, setYears] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api("/api/classes"), api("/api/sections"), api("/api/academic-years")])
      .then(([classes, sectionData, yearData]) => {
        setKlass((classes || []).find((item) => String(item.id) === String(classId)) || null);
        setSections((sectionData || []).filter((item) => String(item.classId) === String(classId)));
        setYears(yearData || []);
      })
      .catch((err) => setError(err.message));
  }, [classId]);

  const selectedYearId = searchParams.get("academicYearId")
    || years.find((year) => year.currentYear || year.isCurrentYear)?.id
    || years[0]?.id;
  const selectedYear = years.find((year) => String(year.id) === String(selectedYearId));
  const yearSections = useMemo(
    () => sections.filter((item) => String(item.academicYearId) === String(selectedYearId)),
    [sections, selectedYearId]
  );
  const totalStudents = yearSections.reduce((total, section) => total + Number(section.studentCount || 0), 0);

  return (
    <div>
      <p className="breadcrumb"><Link to="/classes">Classes / Grades</Link> &gt; {klass?.name || "Class details"}</p>
      <PageHeader title={`${klass?.name || "Class"} Details`} description="Review sections and enrolled students for an academic year." />
      {error && <p className="error">{error}</p>}
      <div className="card filter-bar">
        <label>Academic Year</label>
        <select
          value={selectedYearId || ""}
          onChange={(event) => setSearchParams({ academicYearId: event.target.value })}
        >
          {years.map((year) => <option key={year.id} value={year.id}>{year.name}</option>)}
        </select>
      </div>
      {klass && <div className="card">
        <p><strong>Class:</strong> {klass.name}</p>
        <p><strong>Academic Year:</strong> {selectedYear?.name || "—"}</p>
        <p><strong>Total Sections:</strong> {yearSections.length}</p>
        <p><strong>Total Students:</strong> {totalStudents}</p>
      </div>}
      <TableWrap>
        <table>
          <thead><tr><th>Section</th><th>Class Teacher</th><th>Students</th><th>Action</th></tr></thead>
          <tbody>
            {yearSections.map((section) => (
              <tr key={section.id}>
                <td>{section.name}</td>
                <td>{section.classTeacherName || "—"}</td>
                <td>{section.studentCount}</td>
                <td><Link to={`/classes/${classId}/sections/${section.id}`}><button type="button">View</button></Link></td>
              </tr>
            ))}
            {!yearSections.length && <tr><td colSpan="4" className="muted">No sections for this academic year.</td></tr>}
          </tbody>
        </table>
      </TableWrap>
    </div>
  );
}
