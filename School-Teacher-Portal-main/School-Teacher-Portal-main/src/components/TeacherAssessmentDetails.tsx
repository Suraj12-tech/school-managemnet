import { useEffect, useState } from "react";
import { ArrowLeft, BookOpen, CalendarDays, ClipboardList } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { teacherApi, type TeacherAssessment } from "../services/teacherApi";
import { ErrorState } from "./ui/ErrorState";
import { LoadingState } from "./ui/LoadingState";

export function TeacherAssessmentDetails() {
  const { assessmentId } = useParams();
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState<TeacherAssessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const id = Number(assessmentId);
    if (!Number.isSafeInteger(id) || id <= 0) {
      setError(true);
      setLoading(false);
      return;
    }
    teacherApi.assessment(id)
      .then(setAssessment)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [assessmentId]);

  if (loading) return <LoadingState message="Loading assessment details..." />;
  if (error || !assessment) {
    return <ErrorState message="Assessment not found in your active teaching scope." action={
      <button className="btn btn-secondary" onClick={() => navigate("/app/assessments")}>Back to assessments</button>
    } />;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <button className="btn btn-secondary" onClick={() => navigate("/app/assessments")} style={{ alignSelf: "flex-start" }}>
        <ArrowLeft size={18} /> Back to assessments
      </button>
      <section className="card">
        <h1 style={{ fontSize: "1.75rem", marginTop: 0 }}>{assessment.title}</h1>
        <p><BookOpen size={16} /> {assessment.subjectName} - {assessment.className}</p>
        <p><ClipboardList size={16} /> {assessment.sectionName ?? "All assigned sections"}</p>
        <p><CalendarDays size={16} /> {new Date(`${assessment.assessmentDate}T00:00:00`).toLocaleDateString()} · {assessment.academicYearName}</p>
        <p>Maximum marks: {assessment.maxMarks}</p>
        <p>Status: {assessment.status}</p>
      </section>
      <p>Marks entry is not available yet.</p>
    </div>
  );
}
