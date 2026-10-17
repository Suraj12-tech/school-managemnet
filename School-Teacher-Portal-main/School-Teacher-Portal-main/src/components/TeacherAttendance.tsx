import { useEffect, useState, type FormEvent } from "react";
import { CalendarCheck } from "lucide-react";
import {
  teacherApi,
  type AttendanceStatus,
  type TeacherAttendanceEntry,
  type TeacherSection
} from "../services/teacherApi";
import { EmptyState } from "./ui/EmptyState";
import { ErrorState } from "./ui/ErrorState";
import { LoadingState } from "./ui/LoadingState";

function localDate(): string {
  const today = new Date();
  const offset = today.getTimezoneOffset() * 60_000;
  return new Date(today.getTime() - offset).toISOString().slice(0, 10);
}

function parseStatus(value: string): AttendanceStatus | "" {
  if (value === "PRESENT" || value === "ABSENT" || value === "LATE") return value;
  return "";
}

export function TeacherAttendance() {
  const [sections, setSections] = useState<TeacherSection[]>([]);
  const [classNames, setClassNames] = useState<Record<number, string>>({});
  const [yearNames, setYearNames] = useState<Record<number, string>>({});
  const [sectionId, setSectionId] = useState<number | null>(null);
  const [date, setDate] = useState(localDate);
  const [records, setRecords] = useState<TeacherAttendanceEntry[]>([]);
  const [canManageAttendance, setCanManageAttendance] = useState(false);
  const [statuses, setStatuses] = useState<Record<string, AttendanceStatus | "">>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([teacherApi.sections(), teacherApi.classes(), teacherApi.academicYears()])
      .then(([assignedSections, classes, years]) => {
        if (!active) return;
        const classIds = new Set(classes.map(schoolClass => schoolClass.id));
        const yearIds = new Set(years.map(year => year.id));
        setClassNames(Object.fromEntries(classes.map(schoolClass => [schoolClass.id, schoolClass.name])));
        setYearNames(Object.fromEntries(years.map(year => [year.id, year.name])));
        const authorizedSections = assignedSections.filter(section =>
          classIds.has(section.classId) && yearIds.has(section.academicYearId)
        );
        setSections(authorizedSections);
        setSectionId(authorizedSections[0]?.id ?? null);
      })
      .catch((loadError: unknown) => {
        if (active) setError(loadError instanceof Error ? loadError.message : "Could not load assigned sections.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (sectionId === null || !date) return;
    let active = true;
    setLoading(true);
    setError("");
    setNotice("");
    setCanManageAttendance(false);
    teacherApi.attendance(sectionId, date)
      .then(result => {
        if (!active) return;
        setRecords(result.records);
        setCanManageAttendance(result.canManageAttendance);
        setStatuses(Object.fromEntries(result.records.map(record => [
          record.studentIdentifier,
          record.status ?? ""
        ])));
      })
      .catch((loadError: unknown) => {
        if (active) setError(loadError instanceof Error ? loadError.message : "Could not load attendance.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [sectionId, date]);

  const selectedSection = sections.find(section => section.id === sectionId);

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (sectionId === null) return;
    const marked = records.flatMap(record => {
      const status = statuses[record.studentIdentifier];
      return status ? [{ studentIdentifier: record.studentIdentifier, status }] : [];
    });
    if (marked.length === 0) {
      setNotice("Select an attendance status for at least one student.");
      return;
    }
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const result = await teacherApi.saveAttendance({ sectionId, date, records: marked });
      setRecords(result.records);
      setStatuses(Object.fromEntries(result.records.map(record => [
        record.studentIdentifier,
        record.status ?? ""
      ])));
      setNotice("Attendance saved.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save attendance.");
    } finally {
      setSaving(false);
    }
  };

  if (loading && sections.length === 0) return <LoadingState message="Loading assigned attendance sections..." />;
  if (error && sections.length === 0) return <ErrorState message={error} />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div>
        <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>Attendance</h1>
        <p>Mark or update attendance for students in your active teaching assignments.</p>
      </div>

      {!sections.length ? (
        <EmptyState
          icon={<CalendarCheck size={40} />}
          title="No active assigned sections"
          description="Attendance is available only for sections in your current active assignments."
        />
      ) : (
        <>
          <section className="card" style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            <label style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <span>Assigned section</span>
              <select className="input-field" value={sectionId ?? ""} onChange={event => setSectionId(Number(event.target.value))}>
                {sections.map(section => (
                  <option key={section.id} value={section.id}>
                  {classNames[section.classId] ?? `Class ${section.classId}`} - {section.name}
                  {yearNames[section.academicYearId] ? ` (${yearNames[section.academicYearId]})` : ""}
                  </option>
                ))}
              </select>
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <span>Attendance date</span>
              <input className="input-field" type="date" value={date} onChange={event => setDate(event.target.value)} />
            </label>
          </section>

          {error && <p className="error" role="alert">{error}</p>}
          {notice && <p role="status">{notice}</p>}
              {!canManageAttendance && <p>Only the assigned class teacher can mark or update attendance for this section.</p>}
              {loading ? <LoadingState message="Loading section attendance..." /> : (
            <form onSubmit={save} className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
                <h2 style={{ margin: 0, fontSize: "1.25rem" }}>
                  {selectedSection ? `Section ${selectedSection.name}` : "Attendance roster"}
                </h2>
                <button className="btn btn-primary" type="submit" disabled={!canManageAttendance || saving || records.length === 0}>
                  {saving ? "Saving..." : "Save attendance"}
                </button>
              </div>
              {records.length ? (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                    <thead>
                      <tr>
                        <th style={{ padding: "0.75rem" }}>Student name</th>
                        <th style={{ padding: "0.75rem" }}>School student identifier</th>
                        <th style={{ padding: "0.75rem" }}>Attendance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {records.map(record => (
                        <tr key={record.studentIdentifier}>
                          <td style={{ padding: "0.75rem" }}>{record.fullName}</td>
                          <td style={{ padding: "0.75rem" }}>{record.studentIdentifier}</td>
                          <td style={{ padding: "0.75rem" }}>
                            <select
                              className="input-field"
                              aria-label={`Attendance for ${record.fullName}`}
                              value={statuses[record.studentIdentifier] ?? ""}
                              onChange={event => setStatuses(previous => ({
                                ...previous,
                                [record.studentIdentifier]: parseStatus(event.target.value)
                              }))}
                            >
                              <option value="">Not marked</option>
                              <option value="PRESENT">Present</option>
                              <option value="ABSENT">Absent</option>
                              <option value="LATE">Late</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState icon={<CalendarCheck size={36} />} title="No active students" description="This section has no active students to mark." />
              )}
            </form>
          )}
        </>
      )}
    </div>
  );
}
