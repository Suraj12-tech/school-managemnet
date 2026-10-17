import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, User } from "lucide-react";
import { teacherApi, type StudentRosterEntry } from "../services/teacherApi";
import { LoadingState } from "./ui/LoadingState";
import { ErrorState } from "./ui/ErrorState";

export function StudentProfile() {
  const { classId, studentId } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState<StudentRosterEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const id = Number(studentId);
    if (!Number.isSafeInteger(id) || id <= 0) {
      setError(true);
      setLoading(false);
      return;
    }
    teacherApi.student(id)
      .then(setStudent)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [studentId]);

  if (loading) return <LoadingState message="Loading student identity..." />;
  if (error || !student) {
    return <ErrorState message="Student not found in your active teaching scope." action={
      <button className="btn btn-secondary" onClick={() => navigate(`/app/classes/${classId}`)}>Back to class</button>
    } />;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <button className="btn btn-secondary" onClick={() => navigate(`/app/classes/${classId}`)} style={{ alignSelf: "flex-start" }}>
        <ArrowLeft size={18} /> Back to class
      </button>
      <section className="card" style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
        <User size={40} aria-hidden="true" />
        <div>
          <h1 style={{ fontSize: "1.75rem", margin: 0 }}>{student.fullName}</h1>
          <p style={{ color: "var(--text-secondary)" }}>
            School student identifier: {student.studentIdentifier ?? "Not recorded"}
          </p>
        </div>
      </section>
    </div>
  );
}
