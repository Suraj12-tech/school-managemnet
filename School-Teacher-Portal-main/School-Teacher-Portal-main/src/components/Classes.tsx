import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Users } from "lucide-react";
import { teacherApi, type TeacherClass, type TeacherSection } from "../services/teacherApi";
import { LoadingState } from "./ui/LoadingState";
import { ErrorState } from "./ui/ErrorState";
import { EmptyState } from "./ui/EmptyState";

export function Classes() {
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [sections, setSections] = useState<TeacherSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([teacherApi.classes(), teacherApi.sections()])
      .then(([classData, sectionData]) => {
        setClasses(classData);
        setSections(sectionData);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState message="Loading assigned classes..." />;
  if (error) return <ErrorState message="Could not load your assigned classes." />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <div>
        <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>My Classes</h1>
        <p>Classes and active sections from your current teaching assignments.</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.5rem" }}>
        {classes.map(schoolClass => {
          const assignedSections = sections.filter(section => section.classId === schoolClass.id);
          return (
            <button
              type="button"
              key={schoolClass.id}
              className="card"
              onClick={() => navigate(`/app/classes/${schoolClass.id}`)}
              style={{ display: "flex", flexDirection: "column", gap: "1rem", textAlign: "left", cursor: "pointer" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2 style={{ fontSize: "1.25rem", margin: 0 }}>{schoolClass.name}</h2>
                <ChevronRight size={18} />
              </div>
              <div style={{ display: "flex", gap: "0.5rem", color: "var(--text-secondary)" }}>
                <Users size={18} />
                {assignedSections.length} assigned section{assignedSections.length === 1 ? "" : "s"}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {assignedSections.map(section => (
                  <span key={section.id} className="badge badge-primary">
                    Section {section.name}
                  </span>
                ))}
              </div>
            </button>
          );
        })}
      </div>
      {!classes.length && (
        <EmptyState
          icon={<Users size={48} />}
          title="No Classes Assigned"
          description="No active class or subject teaching assignment is available for your account."
        />
      )}
    </div>
  );
}
