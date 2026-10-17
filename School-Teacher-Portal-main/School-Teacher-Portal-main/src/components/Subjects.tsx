import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, ChevronRight } from "lucide-react";
import { teacherApi, type TeacherSubject } from "../services/teacherApi";
import { LoadingState } from "./ui/LoadingState";
import { ErrorState } from "./ui/ErrorState";
import { EmptyState } from "./ui/EmptyState";

export function Subjects() {
  const [subjects, setSubjects] = useState<TeacherSubject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    teacherApi.subjects()
      .then(setSubjects)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState message="Loading assigned subjects..." />;
  if (error) return <ErrorState message="Could not load your assigned subjects." />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <div>
        <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>My Subjects</h1>
        <p>Only active subjects connected to your current assignments are shown.</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.5rem" }}>
        {subjects.map(subject => (
          <button
            type="button"
            key={subject.id}
            className="card"
            onClick={() => navigate(`/app/subjects/${subject.id}`)}
            style={{ display: "flex", justifyContent: "space-between", alignItems: "center", textAlign: "left", cursor: "pointer" }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <BookOpen size={20} />
              <span>
                <strong>{subject.name}</strong>
                <span style={{ display: "block", color: "var(--text-secondary)" }}>{subject.code}</span>
              </span>
            </span>
            <ChevronRight size={18} />
          </button>
        ))}
      </div>
      {!subjects.length && (
        <EmptyState icon={<BookOpen size={44} />} title="No Subjects Assigned"
          description="You do not have an active subject-teacher assignment." />
      )}
    </div>
  );
}
