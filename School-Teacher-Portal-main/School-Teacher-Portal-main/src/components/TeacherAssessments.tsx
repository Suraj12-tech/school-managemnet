import { useEffect, useState } from "react";
import { BookOpen, CalendarDays, ChevronRight, ClipboardList } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { teacherApi, type TeacherAssessment } from "../services/teacherApi";
import { EmptyState } from "./ui/EmptyState";
import { ErrorState } from "./ui/ErrorState";
import { LoadingState } from "./ui/LoadingState";

export function TeacherAssessments() {
  const [assessments, setAssessments] = useState<TeacherAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    teacherApi.assessments()
      .then(setAssessments)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState message="Loading assessments in your active teaching scope..." />;
  if (error) return <ErrorState message="Could not load assessments in your active teaching scope." />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div>
        <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>Exams & Assessments</h1>
        <p>Published assessments connected to your active classes, sections, subjects, and academic years.</p>
      </div>
      {assessments.length ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
          {assessments.map(assessment => (
            <button
              key={assessment.id}
              type="button"
              className="card"
              onClick={() => navigate(`/app/assessments/${assessment.id}`)}
              style={{ textAlign: "left", cursor: "pointer", display: "flex", flexDirection: "column", gap: "0.75rem" }}
            >
              <strong style={{ fontSize: "1.15rem" }}>{assessment.title}</strong>
              <span><BookOpen size={16} /> {assessment.subjectName} - {assessment.className}</span>
              <span><ClipboardList size={16} /> {assessment.sectionName ?? "All assigned sections"}</span>
              <span><CalendarDays size={16} /> {new Date(`${assessment.assessmentDate}T00:00:00`).toLocaleDateString()} · {assessment.academicYearName}</span>
              <span style={{ marginTop: "auto" }}>View details <ChevronRight size={16} /></span>
            </button>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<ClipboardList size={40} />}
          title="No published assessments"
          description="Published assessments for your active teaching assignments will appear here."
        />
      )}
    </div>
  );
}
