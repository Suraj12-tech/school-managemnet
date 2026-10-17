import { useEffect, useState } from "react";
import { ArrowLeft, BookOpen, Calendar, Users } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { teacherApi, type TeacherAssignment } from "../services/teacherApi";
import { ErrorState } from "./ui/ErrorState";
import { LoadingState } from "./ui/LoadingState";

export function TeachingAssignmentDetails() {
  const { assignmentId } = useParams();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState<TeacherAssignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const id = Number(assignmentId);
    if (!Number.isSafeInteger(id) || id <= 0) {
      setError(true);
      setLoading(false);
      return;
    }
    teacherApi.assignment(id)
      .then(setAssignment)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [assignmentId]);

  if (loading) return <LoadingState message="Loading teaching assignment..." />;
  if (error || !assignment) {
    return <ErrorState message="Teaching assignment not found in your active scope." action={
      <button className="btn btn-secondary" onClick={() => navigate("/app/teaching-assignments")}>Back to assignments</button>
    } />;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <button className="btn btn-secondary" onClick={() => navigate("/app/teaching-assignments")} style={{ alignSelf: "flex-start" }}>
        <ArrowLeft size={18} /> Back to teaching assignments
      </button>
      <section className="card">
        <h1 style={{ fontSize: "1.75rem", marginTop: 0 }}>
          {assignment.assignmentType === "CLASS_TEACHER" ? "Class teacher assignment" : "Subject teacher assignment"}
        </h1>
        <p><BookOpen size={16} /> Class: {assignment.className}</p>
        <p><Users size={16} /> Section: {assignment.sectionName ?? "All assigned sections"}</p>
        <p><Calendar size={16} /> Academic year: {assignment.academicYearName}</p>
        {assignment.subjectName && <p>Subject: {assignment.subjectName}</p>}
        <p>Status: {assignment.status}</p>
      </section>
    </div>
  );
}
