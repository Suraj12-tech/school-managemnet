import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, BookOpen } from "lucide-react";
import { teacherApi, type TeacherAssignment, type TeacherSubject } from "../services/teacherApi";
import { LoadingState } from "./ui/LoadingState";
import { ErrorState } from "./ui/ErrorState";
import { EmptyState } from "./ui/EmptyState";

export function SubjectDetails() {
  const { subjectId } = useParams();
  const navigate = useNavigate();
  const [subject, setSubject] = useState<TeacherSubject | null>(null);
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const id = Number(subjectId);
    if (!Number.isSafeInteger(id) || id <= 0) {
      setError(true);
      setLoading(false);
      return;
    }
    Promise.all([teacherApi.subject(id), teacherApi.assignments()])
      .then(([subjectData, allAssignments]) => {
        setSubject(subjectData);
        setAssignments(allAssignments.filter(assignment => assignment.subjectId === id));
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [subjectId]);

  if (loading) return <LoadingState message="Loading subject..." />;
  if (error || !subject) {
    return <ErrorState message="Subject not found in your active teaching scope." action={
      <button className="btn btn-secondary" onClick={() => navigate("/app/subjects")}>Back to subjects</button>
    } />;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <button className="btn btn-secondary" onClick={() => navigate("/app/subjects")} style={{ alignSelf: "flex-start" }}>
        <ArrowLeft size={18} /> Back to subjects
      </button>
      <section className="card">
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <BookOpen size={28} />
          <div>
            <h1 style={{ fontSize: "1.75rem", margin: 0 }}>{subject.name}</h1>
            <span style={{ color: "var(--text-secondary)" }}>{subject.code}</span>
          </div>
        </div>
        {subject.description && <p>{subject.description}</p>}
      </section>
      <section>
        <h2>Active teaching assignments</h2>
        {assignments.length ? (
          <div className="card">
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead><tr><th style={{ padding: "0.75rem" }}>Class</th><th style={{ padding: "0.75rem" }}>Section</th><th style={{ padding: "0.75rem" }}>Academic year</th></tr></thead>
              <tbody>
                {assignments.map(assignment => (
                  <tr key={assignment.id}>
                    <td style={{ padding: "0.75rem" }}>{assignment.className}</td>
                    <td style={{ padding: "0.75rem" }}>{assignment.sectionName ?? "All assigned sections"}</td>
                    <td style={{ padding: "0.75rem" }}>{assignment.academicYearName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No active assignments" description="This subject is no longer part of an active assignment." />
        )}
      </section>
    </div>
  );
}
