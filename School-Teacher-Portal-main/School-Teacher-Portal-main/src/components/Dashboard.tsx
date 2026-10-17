import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, CalendarDays, Clock, Users } from "lucide-react";
import {
  teacherApi,
  type TeacherAssignment,
  type TeacherClass,
  type TeacherProfile,
  type TeacherTimetableEntry
} from "../services/teacherApi";
import { useAuth } from "../contexts/AuthContext";
import { LoadingState } from "./ui/LoadingState";
import { ErrorState } from "./ui/ErrorState";
import { EmptyState } from "./ui/EmptyState";

export function Dashboard() {
  const { currentTeacher } = useAuth();
  const [profile, setProfile] = useState<TeacherProfile | null>(currentTeacher);
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [timetable, setTimetable] = useState<TeacherTimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      teacherApi.profile(),
      teacherApi.classes(),
      teacherApi.assignments(),
      teacherApi.timetable()
    ])
      .then(([profileData, classData, assignmentData, timetableData]) => {
        setProfile(profileData);
        setClasses(classData);
        setAssignments(assignmentData);
        setTimetable(timetableData);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState message="Loading your school workspace..." />;
  if (error || !profile) return <ErrorState message="Could not load your teacher workspace." />;

  const subjectNames = Array.from(new Set(assignments
    .map(assignment => assignment.subjectName)
    .filter((name): name is string => Boolean(name))));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <header>
        <h1 style={{ fontSize: "2rem", marginBottom: "0.25rem" }}>
          Welcome, {profile.fullName.split(" ")[0]}
        </h1>
        <p style={{ color: "var(--text-secondary)" }}>
          Active assignments for {profile.employeeId}
        </p>
        {subjectNames.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            {subjectNames.map(name => <span key={name} className="badge badge-primary">{name}</span>)}
          </div>
        )}
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
        <div className="card"><Users size={22} /><h2>{classes.length}</h2><p>Assigned classes</p></div>
        <div className="card"><BookOpen size={22} /><h2>{assignments.length}</h2><p>Active teaching assignments</p></div>
        <div className="card"><Clock size={22} /><h2>{timetable.length}</h2><p>Timetable periods</p></div>
      </div>

      <section>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <CalendarDays size={20} />
          <h2>Assigned timetable</h2>
        </div>
        {timetable.length ? (
          <div className="card" style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr><th style={{ padding: "0.75rem" }}>Day</th><th style={{ padding: "0.75rem" }}>Time</th><th style={{ padding: "0.75rem" }}>Class / section</th><th style={{ padding: "0.75rem" }}>Subject</th><th style={{ padding: "0.75rem" }}>Room</th></tr>
              </thead>
              <tbody>
                {timetable.map(entry => (
                  <tr key={entry.id}>
                    <td style={{ padding: "0.75rem" }}>{entry.dayOfWeek}</td>
                    <td style={{ padding: "0.75rem" }}>{entry.startTime ?? entry.periodName ?? `Period ${entry.periodNumber}`}{entry.endTime ? ` – ${entry.endTime}` : ""}</td>
                    <td style={{ padding: "0.75rem" }}>{entry.className} / {entry.sectionName}</td>
                    <td style={{ padding: "0.75rem" }}>{entry.subjectName ?? "—"}</td>
                    <td style={{ padding: "0.75rem" }}>{entry.room ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <EmptyState title="No timetable entries" description="No active timetable entry matches your current assignments." />}
      </section>

      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
        <button className="btn btn-primary" onClick={() => navigate("/app/classes")}>Open my classes</button>
        <button className="btn btn-secondary" onClick={() => navigate("/app/subjects")}>Open my subjects</button>
      </div>
    </div>
  );
}
