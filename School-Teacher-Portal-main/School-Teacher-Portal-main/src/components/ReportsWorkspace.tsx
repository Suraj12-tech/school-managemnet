import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { BarChart3, BookOpen, CalendarCheck, ClipboardList } from "lucide-react";
import { teacherApi, type TeacherReport, type TeacherSection } from "../services/teacherApi";
import { EmptyState } from "./ui/EmptyState";
import { ErrorState } from "./ui/ErrorState";
import { LoadingState } from "./ui/LoadingState";

function localDate(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function ReportsWorkspace() {
  const today = localDate(new Date());
  const [sections, setSections] = useState<TeacherSection[]>([]);
  const [sectionId, setSectionId] = useState("");
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [report, setReport] = useState<TeacherReport | null>(null);
  const [loadingSections, setLoadingSections] = useState(true);
  const [loadingReport, setLoadingReport] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    teacherApi.sections()
      .then(availableSections => {
        setSections(availableSections);
        if (availableSections.length > 0) setSectionId(String(availableSections[0].id));
      })
      .catch(reason => setError(reason instanceof Error ? reason.message : "Could not load authorized sections."))
      .finally(() => setLoadingSections(false));
  }, []);

  const loadReport = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const selectedSectionId = Number(sectionId);
    if (!Number.isSafeInteger(selectedSectionId) || selectedSectionId <= 0 || !fromDate || !toDate) {
      setError("Choose an authorized section and a valid date range.");
      return;
    }
    if (fromDate > toDate) {
      setError("The start date must be on or before the end date.");
      return;
    }

    setError("");
    setLoadingReport(true);
    setReport(null);
    try {
      setReport(await teacherApi.reports(selectedSectionId, fromDate, toDate));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not load the report.");
    } finally {
      setLoadingReport(false);
    }
  };

  if (loadingSections) return <LoadingState message="Loading your authorized sections..." />;
  if (error && sections.length === 0) return <ErrorState message={error} />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div>
        <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>Reports & Analytics</h1>
        <p style={{ color: "var(--text-secondary)" }}>
          Attendance totals, active teaching assignments, and published assessments from your current authorized scope.
        </p>
      </div>

      {sections.length === 0 ? (
        <EmptyState icon={<BarChart3 size={40} />} title="No authorized sections"
          description="Reports are available for sections in your active teaching assignments." />
      ) : (
        <>
          <form className="card" onSubmit={loadReport}
            style={{ display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "end" }}>
            <label style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              Section
              <select className="input-field" value={sectionId} onChange={event => setSectionId(event.target.value)}>
                {sections.map(section => <option key={section.id} value={section.id}>{section.name}</option>)}
              </select>
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              From
              <input className="input-field" type="date" value={fromDate}
                onChange={event => setFromDate(event.target.value)} required />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              To
              <input className="input-field" type="date" value={toDate}
                onChange={event => setToDate(event.target.value)} required />
            </label>
            <button className="btn btn-primary" type="submit" disabled={loadingReport}>
              {loadingReport ? "Loading..." : "Generate report"}
            </button>
          </form>

          {error && <ErrorState message={error} />}
          {loadingReport && <LoadingState message="Generating your report..." />}
          {report && (
            <>
              <section className="card">
                <h2 style={{ marginTop: 0 }}><CalendarCheck size={20} /> Attendance summary</h2>
                <p>{report.attendance.fromDate} to {report.attendance.toDate}</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "1rem" }}>
                  {[
                    ["Present", report.attendance.present],
                    ["Absent", report.attendance.absent],
                    ["Late", report.attendance.late],
                    ["Total recorded", report.attendance.totalRecorded]
                  ].map(([label, value]) => (
                    <div className="card" key={label} style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                      <span style={{ color: "var(--text-secondary)" }}>{label}</span>
                      <strong style={{ fontSize: "1.75rem" }}>{value}</strong>
                    </div>
                  ))}
                </div>
              </section>

              <section className="card">
                <h2 style={{ marginTop: 0 }}><ClipboardList size={20} /> Current teaching assignments</h2>
                {report.assignments.length === 0 ? <p>No current assignments found.</p> : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1rem" }}>
                    {report.assignments.map((assignment, index) => (
                      <div className="card" key={`${assignment.classId}-${assignment.sectionId}-${assignment.subjectId}-${assignment.academicYearId}-${index}`}>
                        <strong>{assignment.className}{assignment.sectionName ? ` - ${assignment.sectionName}` : ""}</strong>
                        <p>{assignment.subjectName ?? "Class teacher"} · {assignment.academicYearName}</p>
                        <small>{assignment.assignmentTypes.join(", ")}</small>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="card">
                <h2 style={{ marginTop: 0 }}><BookOpen size={20} /> Published assessments</h2>
                <p>{report.assessments.publishedCount} published assessment(s) in your active assignment scope.</p>
                {report.assessments.publishedAssessments.length > 0 && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1rem" }}>
                    {report.assessments.publishedAssessments.map(assessment => (
                      <div className="card" key={assessment.id}>
                        <strong>{assessment.title}</strong>
                        <p>{assessment.subjectName} · {assessment.className}</p>
                        <small>{assessment.assessmentDate} · {assessment.academicYearName} · {assessment.status}</small>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </>
      )}
    </div>
  );
}
