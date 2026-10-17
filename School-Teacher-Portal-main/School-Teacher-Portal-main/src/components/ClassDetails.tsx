import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Users } from "lucide-react";
import { teacherApi, type StudentRosterEntry, type TeacherAcademicYear, type TeacherClass, type TeacherSection } from "../services/teacherApi";
import { LoadingState } from "./ui/LoadingState";
import { ErrorState } from "./ui/ErrorState";
import { EmptyState } from "./ui/EmptyState";

interface SectionRoster {
  section: TeacherSection;
  students: StudentRosterEntry[];
  yearName: string;
}

export function ClassDetails() {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [schoolClass, setSchoolClass] = useState<TeacherClass | null>(null);
  const [rosters, setRosters] = useState<SectionRoster[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const id = Number(classId);
    if (!Number.isSafeInteger(id) || id <= 0) {
      setError(true);
      setLoading(false);
      return;
    }

    Promise.all([teacherApi.schoolClass(id), teacherApi.sections(), teacherApi.academicYears()])
      .then(async ([classData, allSections, years]) => {
        const assignedSections = allSections.filter(section => section.classId === id);
        const data = await Promise.all(assignedSections.map(async section => ({
          section,
          students: await teacherApi.students(section.id),
          yearName: years.find((year: TeacherAcademicYear) => year.id === section.academicYearId)?.name ?? ""
        })));
        setSchoolClass(classData);
        setRosters(data);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [classId]);

  if (loading) return <LoadingState message="Loading assigned sections..." />;
  if (error || !schoolClass) {
    return <ErrorState message="Could not load this class or it is outside your active teaching scope." action={
      <button className="btn btn-secondary" onClick={() => navigate("/app/classes")}>Back to classes</button>
    } />;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <button className="btn btn-secondary" onClick={() => navigate("/app/classes")} style={{ alignSelf: "flex-start" }}>
        <ArrowLeft size={18} /> Back to classes
      </button>
      <div>
        <h1 style={{ fontSize: "2rem", marginBottom: "0.25rem" }}>{schoolClass.name}</h1>
        <p>Read-only student rosters for sections within your active assignments.</p>
      </div>
      {rosters.map(({ section, students, yearName }) => (
        <section className="card" key={section.id}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
            <div>
              <h2 style={{ fontSize: "1.25rem", marginBottom: "0.25rem" }}>Section {section.name}</h2>
              <p style={{ margin: 0, color: "var(--text-secondary)" }}>{yearName}</p>
            </div>
            <span className="badge badge-primary"><Users size={14} /> {students.length} students</span>
          </div>
          {students.length ? (
            <div style={{ overflowX: "auto", marginTop: "1rem" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr>
                    <th style={{ padding: "0.75rem" }}>Student name</th>
                    <th style={{ padding: "0.75rem" }}>School student identifier</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student, index) => (
                    <tr key={`${student.studentIdentifier ?? "unknown"}-${index}`}>
                      <td style={{ padding: "0.75rem" }}>{student.fullName}</td>
                      <td style={{ padding: "0.75rem" }}>{student.studentIdentifier ?? "Not recorded"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <EmptyState icon={<Users size={36} />} title="No active students" description="No active student is currently enrolled in this assigned section." />}
        </section>
      ))}
      {!rosters.length && (
        <EmptyState icon={<Users size={40} />} title="No assigned sections" description="This class has no active section in your current assignments." />
      )}
    </div>
  );
}
