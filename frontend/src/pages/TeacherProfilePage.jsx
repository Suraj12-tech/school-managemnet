import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import { api } from "../api/client.js";
import PageHeader from "../components/PageHeader.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import TableWrap from "../components/TableWrap.jsx";

const tabs = [
  ["overview", "Overview"],
  ["assignments", "Assignments"],
  ["timetable", "Timetable"],
  ["classes", "Classes"],
  ["students", "Students"]
];

const weekDays = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];

function assignmentTypeLabel(type) {
  return type === "CLASS_TEACHER" ? "Class Teacher" : "Subject Teacher";
}

export default function TeacherProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { can } = useAuth();
  const [staff, setStaff] = useState(null);
  const [years, setYears] = useState([]);
  const [academicYearId, setAcademicYearId] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [assignments, setAssignments] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [classCards, setClassCards] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabLoading, setTabLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [assignmentTypeFilter, setAssignmentTypeFilter] = useState("ALL");
  const [timetableDayFilter, setTimetableDayFilter] = useState("ALL");
  const [classFilter, setClassFilter] = useState("ALL");
  const [sectionFilter, setSectionFilter] = useState("ALL");
  const [subjectFilter, setSubjectFilter] = useState("ALL");

  const visibleTabs = tabs.filter(([value]) => {
    if (value === "assignments") return can("staff", "view");
    if (value === "timetable" || value === "classes") return can("classes", "view");
    if (value === "students") return can("classes", "view") && can("students", "view");
    return true;
  });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    Promise.all([
      api(`/api/staff/${id}/summary`),
      api("/api/academic-years")
    ]).then(([staffData, yearData]) => {
      if (cancelled) return;
      const availableYears = yearData || [];
      const currentOrFirst = availableYears.find((year) => year.currentYear)
        || availableYears.find((year) => year.status !== "ARCHIVED")
        || availableYears[0];
      setStaff(staffData);
      setYears(availableYears);
      setAcademicYearId((current) => current || (currentOrFirst ? String(currentOrFirst.id) : ""));
    }).catch((err) => {
      if (!cancelled) setError(err.message);
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => {
    if (!staff || !academicYearId || activeTab === "overview") {
      setTabLoading(false);
      return undefined;
    }
    let cancelled = false;
    setTabLoading(true);
    setError("");

    async function loadTab() {
      if (activeTab === "assignments") {
        const rows = await api(`/api/staff/${id}/assignments?academicYearId=${academicYearId}`);
        if (!cancelled) setAssignments(rows || []);
        return;
      }

      if (activeTab === "timetable") {
        const rows = await api(`/api/timetable?staffId=${id}&academicYearId=${academicYearId}`);
        if (!cancelled) setTimetable(rows || []);
        return;
      }

      const [assignmentRows, sectionRows] = await Promise.all([
        api(`/api/staff/${id}/assignments?academicYearId=${academicYearId}`),
        api("/api/sections")
      ]);
      if (cancelled) return;

      const activeAssignments = (assignmentRows || []).filter((assignment) => assignment.status === "ACTIVE");
      const yearSections = (sectionRows || []).filter((section) =>
        String(section.academicYearId) === String(academicYearId)
      );
      const assignmentsBySection = new Map();
      activeAssignments.forEach((assignment) => {
        const assignedSections = assignment.sectionId
          ? yearSections.filter((section) => String(section.id) === String(assignment.sectionId))
          : yearSections.filter((section) => String(section.classId) === String(assignment.classId));
        assignedSections.forEach((section) => {
          const sectionAssignments = assignmentsBySection.get(String(section.id)) || [];
          sectionAssignments.push(assignment);
          assignmentsBySection.set(String(section.id), sectionAssignments);
        });
      });

      const assignedSections = yearSections.filter((section) => assignmentsBySection.has(String(section.id)));
      const sectionStudents = await Promise.all(assignedSections.map(async (section) => ({
        section,
        rows: await api(`/api/sections/${section.id}/students?academicYearId=${academicYearId}`)
      })));
      if (cancelled) return;

      const studentRows = new Map();
      const cards = sectionStudents.map(({ section, rows }) => {
        const sectionAssignments = assignmentsBySection.get(String(section.id)) || [];
        const subjects = [...new Map(sectionAssignments
          .filter((assignment) => assignment.subjectId != null)
          .map((assignment) => [String(assignment.subjectId), {
            id: assignment.subjectId,
            name: assignment.subjectName || `#${assignment.subjectId}`
          }])).values()];
        const enrolled = (rows || []).filter((student) => student.enrollmentStatus === "ENROLLED");
        enrolled.forEach((student) => {
          const existing = studentRows.get(student.id) || {
            ...student,
            subjectNames: new Map()
          };
          subjects.forEach((subject) => existing.subjectNames.set(String(subject.id), subject.name));
          studentRows.set(student.id, existing);
        });
        return {
          ...section,
          roles: [...new Set(sectionAssignments.map((assignment) => assignment.assignmentType))],
          studentCount: enrolled.length
        };
      });

      setClassCards(cards);
      setStudents(Array.from(studentRows.values()).map((student) => ({
        ...student,
        subjectNames: Array.from(student.subjectNames.values())
      })));
    }

    loadTab().catch((err) => {
      if (!cancelled) setError(err.message);
    }).finally(() => {
      if (!cancelled) setTabLoading(false);
    });

    return () => { cancelled = true; };
  }, [activeTab, academicYearId, id, staff]);

  const filteredAssignments = useMemo(() => assignments.filter((assignment) => {
    const text = `${assignment.assignmentType} ${assignment.subjectName || ""} ${assignment.className || ""} ${assignment.sectionName || ""} ${assignment.status}`.toLowerCase();
    return text.includes(search.toLowerCase())
      && (assignmentTypeFilter === "ALL" || assignment.assignmentType === assignmentTypeFilter);
  }), [assignments, search, assignmentTypeFilter]);

  const filteredTimetable = useMemo(() => timetable
    .filter((entry) => entry.status === "ACTIVE")
    .filter((entry) => timetableDayFilter === "ALL" || entry.dayOfWeek === timetableDayFilter)
    .slice()
    .sort((a, b) => weekDays.indexOf(a.dayOfWeek) - weekDays.indexOf(b.dayOfWeek)
      || (a.periodNumber || 0) - (b.periodNumber || 0)), [timetable, timetableDayFilter]);

  const studentClasses = useMemo(() => [...new Map(students
    .map((student) => [String(student.classId), { id: student.classId, name: student.className }])).values()],
  [students]);
  const studentSections = useMemo(() => [...new Map(students
    .filter((student) => classFilter === "ALL" || String(student.classId) === classFilter)
    .map((student) => [String(student.sectionId), { id: student.sectionId, name: student.sectionName }])).values()],
  [students, classFilter]);
  const studentSubjects = useMemo(() => [...new Set(students.flatMap((student) => student.subjectNames))].sort(),
    [students]);
  const filteredStudents = useMemo(() => students.filter((student) => {
    const text = `${student.firstName} ${student.lastName} ${student.admissionNumber} ${student.className} ${student.sectionName}`.toLowerCase();
    return text.includes(search.toLowerCase())
      && (classFilter === "ALL" || String(student.classId) === classFilter)
      && (sectionFilter === "ALL" || String(student.sectionId) === sectionFilter)
      && (subjectFilter === "ALL" || student.subjectNames.includes(subjectFilter));
  }), [students, search, classFilter, sectionFilter, subjectFilter]);

  function openStudents(classId, sectionId) {
    setSearch("");
    setClassFilter(String(classId));
    setSectionFilter(String(sectionId));
    setSubjectFilter("ALL");
    setActiveTab("students");
  }

  if (loading && !staff) return <p>Loading teacher profile...</p>;
  if (!staff) return <div>{error && <p className="error">{error}</p>}<Link to="/staff">Back to Staff List</Link></div>;

  return (
    <div>
      <PageHeader
        title={staff.fullName}
        description={`${staff.designation || "Teacher"} · Employee ID ${staff.employeeId}`}
        actions={<>
          <Link to="/staff" className="teacher-profile-back">Back to Staff List</Link>
          {can("staff", "edit") && <button type="button" onClick={() => navigate(`/staff?edit=${staff.id}`)}>Edit Profile</button>}
        </>}
      />
      {error && <p className="error">{error}</p>}

      <section className="card teacher-profile-header">
        <div><span className="muted">Department</span><strong>{staff.departmentName || "—"}</strong></div>
        <div><span className="muted">Email</span><strong>{staff.email || "—"}</strong></div>
        <div><span className="muted">Phone</span><strong>{staff.phone || "—"}</strong></div>
        <div><span className="muted">Status</span><StatusBadge value={staff.status} /></div>
        <label className="teacher-year-select">
          <span className="muted">Academic Year</span>
          <select value={academicYearId} onChange={(event) => {
            setAcademicYearId(event.target.value);
            setSearch("");
            setClassFilter("ALL");
            setSectionFilter("ALL");
            setSubjectFilter("ALL");
          }}>
            {years.map((year) => <option key={year.id} value={year.id}>{year.name}</option>)}
          </select>
        </label>
      </section>

      <div className="tabs" role="tablist" aria-label="Teacher profile sections">
        {visibleTabs.map(([value, label]) => (
          <button key={value} type="button" role="tab" aria-selected={activeTab === value}
            className={activeTab === value ? "tab active" : "tab"}
            onClick={() => { setActiveTab(value); setSearch(""); }}>
            {label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && <section className="card teacher-overview-grid">
        <h3>Teacher information</h3>
        <div><span className="muted">Full Name</span><strong>{staff.fullName}</strong></div>
        <div><span className="muted">Employee ID</span><strong>{staff.employeeId}</strong></div>
        <div><span className="muted">Designation</span><strong>{staff.designation || "—"}</strong></div>
        <div><span className="muted">Department</span><strong>{staff.departmentName || "—"}</strong></div>
        <div><span className="muted">Email</span><strong>{staff.email || "—"}</strong></div>
        <div><span className="muted">Phone</span><strong>{staff.phone || "—"}</strong></div>
        <div><span className="muted">Status</span><StatusBadge value={staff.status} /></div>
      </section>}

      {tabLoading && <p className="muted">Loading {activeTab}...</p>}

      {activeTab === "assignments" && !tabLoading && <section className="card">
        <div className="teacher-filter-row">
          <input placeholder="Search assignments" value={search} onChange={(event) => setSearch(event.target.value)} />
          <select value={assignmentTypeFilter} onChange={(event) => setAssignmentTypeFilter(event.target.value)}>
            <option value="ALL">All assignment types</option>
            <option value="SUBJECT_TEACHER">Subject Teacher</option>
            <option value="CLASS_TEACHER">Class Teacher</option>
          </select>
        </div>
        <TableWrap>
          <table>
            <thead><tr><th>Type</th><th>Subject</th><th>Class</th><th>Section</th><th>Academic Year</th><th>Status</th></tr></thead>
            <tbody>{filteredAssignments.map((assignment) => <tr key={assignment.id}>
              <td>{assignmentTypeLabel(assignment.assignmentType)}</td>
              <td>{assignment.subjectName || "—"}</td>
              <td>{assignment.className || "—"}</td>
              <td>{assignment.sectionName || "All sections"}</td>
              <td>{assignment.academicYearName || "—"}</td>
              <td><StatusBadge value={assignment.status} /></td>
            </tr>)}
            {!filteredAssignments.length && <tr><td colSpan="6" className="muted">
              {assignments.length ? "No assignments match the current filters." : "No assignments for this academic year."}
            </td></tr>}
            </tbody>
          </table>
        </TableWrap>
      </section>}

      {activeTab === "timetable" && !tabLoading && <section className="card">
        <div className="teacher-filter-row">
          <label>Day
            <select value={timetableDayFilter} onChange={(event) => setTimetableDayFilter(event.target.value)}>
              <option value="ALL">All days</option>
              {weekDays.map((day) => <option key={day} value={day}>{day[0] + day.slice(1).toLowerCase()}</option>)}
            </select>
          </label>
        </div>
        {filteredTimetable.length ? <div className="teacher-timetable-grid">
          {weekDays.filter((day) => filteredTimetable.some((entry) => entry.dayOfWeek === day)).map((day) => (
            <section className="card teacher-day-card" key={day}>
              <h3>{day[0] + day.slice(1).toLowerCase()}</h3>
              {filteredTimetable.filter((entry) => entry.dayOfWeek === day).map((entry) => (
                <article className="teacher-period" key={entry.id}>
                  <strong>{entry.startTime || entry.periodName || `Period ${entry.periodNumber}`}
                    {entry.endTime ? ` - ${entry.endTime}` : ""}
                  </strong>
                  <span>{entry.subjectName || "—"}</span>
                  <span>{entry.className || "—"} - Section {entry.sectionName || "—"}</span>
                  <span className="muted">Room {entry.room || "—"}</span>
                </article>
              ))}
            </section>
          ))}
        </div> : <p className="muted">No timetable entries for this academic year.</p>}
      </section>}

      {activeTab === "classes" && !tabLoading && <section className="teacher-class-grid">
        {classCards.map((section) => (
          <article className="card teacher-class-card" key={section.id}>
            <h3>{section.className} - Section {section.name}</h3>
            <p>Students: {section.studentCount}</p>
            <p>{section.roles.map(assignmentTypeLabel).join(" · ")}</p>
            <button type="button" className="secondary" onClick={() => openStudents(section.classId, section.id)}>
              View Students
            </button>
          </article>
        ))}
        {!classCards.length && <p className="muted">No active class or section assignments for this academic year.</p>}
      </section>}

      {activeTab === "students" && !tabLoading && <section className="card">
        <div className="teacher-filter-row teacher-student-filters">
          <input placeholder="Search name, admission ID, class or section" value={search}
            onChange={(event) => setSearch(event.target.value)} />
          <select value={classFilter} onChange={(event) => {
            setClassFilter(event.target.value);
            setSectionFilter("ALL");
          }}>
            <option value="ALL">All classes</option>
            {studentClasses.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
          <select value={sectionFilter} onChange={(event) => setSectionFilter(event.target.value)}>
            <option value="ALL">All sections</option>
            {studentSections.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
          <select value={subjectFilter} onChange={(event) => setSubjectFilter(event.target.value)}>
            <option value="ALL">All subjects</option>
            {studentSubjects.map((subject) => <option key={subject} value={subject}>{subject}</option>)}
          </select>
        </div>
        <TableWrap>
          <table>
            <thead><tr><th>Student</th><th>Admission ID</th><th>Class</th><th>Section</th><th>Subject</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>{filteredStudents.map((student) => <tr key={student.id}>
              <td>{student.firstName} {student.lastName}</td>
              <td>{student.admissionNumber}</td>
              <td>{student.className}</td>
              <td>{student.sectionName}</td>
              <td>{student.subjectNames.join(", ") || "—"}</td>
              <td><StatusBadge value={student.status} /></td>
              <td><Link to={`/students/${student.id}?returnTo=${encodeURIComponent(`/staff/${id}`)}`}>View</Link></td>
            </tr>)}
            {!filteredStudents.length && <tr><td colSpan="7" className="muted">No students match the selected teacher assignments and filters.</td></tr>}
            </tbody>
          </table>
        </TableWrap>
      </section>}
    </div>
  );
}
