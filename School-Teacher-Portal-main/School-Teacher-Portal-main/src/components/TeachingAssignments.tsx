import { useEffect, useState } from "react";
import { BookOpen, Calendar, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { teacherApi, type TeacherAssignment } from "../services/teacherApi";
import { EmptyState } from "./ui/EmptyState";
import { ErrorState } from "./ui/ErrorState";
import { LoadingState } from "./ui/LoadingState";

export function TeachingAssignments() {
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    teacherApi.assignments()
      .then(setAssignments)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState message="Loading your active teaching assignments..." />;
  if (error) return <ErrorState message="Could not load your active teaching assignments." />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div>
        <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>My Teaching Assignments</h1>
        <p>Active classes, sections, subjects, and academic years linked to your current account.</p>
      </div>
      {assignments.length ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
          {assignments.map(assignment => (
            <button
              key={assignment.id}
              type="button"
              className="card"
              onClick={() => navigate(`/app/teaching-assignments/${assignment.id}`)}
              style={{ textAlign: "left", cursor: "pointer", display: "flex", flexDirection: "column", gap: "0.75rem" }}
            >
              <strong style={{ fontSize: "1.15rem" }}>
                {assignment.assignmentType === "CLASS_TEACHER" ? "Class teacher" : assignment.subjectName ?? "Subject teacher"}
              </strong>
              <span><BookOpen size={16} /> {assignment.className}{assignment.sectionName ? ` - ${assignment.sectionName}` : ""}</span>
              <span><Calendar size={16} /> {assignment.academicYearName}</span>
              {assignment.subjectName && assignment.assignmentType === "CLASS_TEACHER" && (
                <span>Subject: {assignment.subjectName}</span>
              )}
              <span style={{ display: "flex", alignItems: "center", gap: "0.25rem", marginTop: "auto" }}>
                View details <ChevronRight size={16} />
              </span>
            </button>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<BookOpen size={40} />}
          title="No active teaching assignments"
          description="Your active teaching assignments will appear here."
        />
      )}
    </div>
  );
}
