import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthContext.jsx";
import { api } from "../api/client.js";
import ActionModal from "../components/ActionModal.jsx";
import PageHeader from "../components/PageHeader.jsx";
import TableWrap from "../components/TableWrap.jsx";

const PERIOD_NUMBERS = Array.from({ length: 12 }, (_, index) => index + 1);

const emptyForm = {
  dayOfWeek: "",
  periodNumber: "1",
  subjectId: "",
  staffId: "",
  room: "",
  periodName: "",
  startTime: "",
  endTime: "",
  status: "ACTIVE"
};

export default function TimetablePage() {
  const { can } = useAuth();
  const [years, setYears] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [workingDays, setWorkingDays] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [entries, setEntries] = useState([]);
  const [academicYearId, setAcademicYearId] = useState("");
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loadingReferences, setLoadingReferences] = useState(true);
  const [workingDaysLoaded, setWorkingDaysLoaded] = useState(false);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [referenceError, setReferenceError] = useState("");

  const canRead = can("classes", "view");
  const canCreate = can("classes", "create");
  const canEdit = can("classes", "edit");
  const canDelete = can("classes", "delete");
  const canLoadFormChoices = can("school", "view")
    && can("staff", "view")
    && can("subjects", "view");
  const selectedSections = sections.filter((section) =>
    String(section.academicYearId) === academicYearId
    && String(section.classId) === classId
  );
  const eligibleAssignments = useMemo(() => assignments.filter((assignment) =>
    assignment.status === "ACTIVE"
    && String(assignment.academicYearId) === academicYearId
    && String(assignment.classId) === classId
    && (!assignment.sectionId || String(assignment.sectionId) === sectionId)
  ), [assignments, academicYearId, classId, sectionId]);
  const eligibleTeachers = useMemo(() => {
    const matching = eligibleAssignments.filter((assignment) =>
      !assignment.subjectId || String(assignment.subjectId) === form.subjectId
    );
    const uniqueTeachers = new Map();
    matching.forEach((assignment) => {
      if (!uniqueTeachers.has(assignment.staffId)) {
        uniqueTeachers.set(assignment.staffId, assignment.teacherName || `Teacher #${assignment.staffId}`);
      }
    });
    return [...uniqueTeachers.entries()];
  }, [eligibleAssignments, form.subjectId]);
  const filtersSelected = Boolean(academicYearId && classId && sectionId);

  useEffect(() => {
    let cancelled = false;

    async function loadReferences() {
      setLoadingReferences(true);
      setReferenceError("");
      setError("");
      try {
        const [days, classRows, sectionRows, yearRows, assignmentRows] = await Promise.all([
          api("/api/timetable/working-days"),
          api("/api/classes"),
          api("/api/sections"),
          can("school", "view") ? api("/api/academic-years") : Promise.resolve([]),
          can("staff", "view") ? api("/api/teacher-assignments") : Promise.resolve([])
        ]);
        if (cancelled) return;
        setWorkingDays(days?.days || []);
        setWorkingDaysLoaded(true);
        setClasses(classRows || []);
        setSections(sectionRows || []);
        setYears(yearRows || []);
        setAssignments(assignmentRows || []);
        if (!can("school", "view")) {
          setReferenceError("Academic year options require the school:view permission.");
        } else if (!can("staff", "view")) {
          setReferenceError("Teacher choices require the staff:view permission.");
        } else if (!can("subjects", "view")) {
          setReferenceError("Subject choices require the subjects:view permission.");
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoadingReferences(false);
      }
    }

    if (!canRead) {
      setLoadingReferences(false);
      return undefined;
    }
    loadReferences();
    return () => { cancelled = true; };
  }, [can, canRead]);

  useEffect(() => {
    let cancelled = false;

    async function loadEntries() {
      if (!filtersSelected || !canRead) {
        setEntries([]);
        setLoadingEntries(false);
        return;
      }
      setLoadingEntries(true);
      setError("");
      const params = new URLSearchParams({ academicYearId, classId, sectionId });
      try {
        const rows = await api(`/api/timetable?${params.toString()}`);
        if (!cancelled) setEntries(rows || []);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoadingEntries(false);
      }
    }

    loadEntries();
    return () => { cancelled = true; };
  }, [academicYearId, classId, sectionId, filtersSelected, canRead]);

  async function refreshAfterChange() {
    const [days, rows] = await Promise.all([
      api("/api/timetable/working-days"),
      filtersSelected
        ? api(`/api/timetable?${new URLSearchParams({ academicYearId, classId, sectionId }).toString()}`)
        : Promise.resolve([])
    ]);
    setWorkingDays(days?.days || []);
    setWorkingDaysLoaded(true);
    setEntries(rows || []);
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setSubjects([]);
    setShowForm(false);
  }

  async function openForm(entry = null, slot = null) {
    setError("");
    if (!canLoadFormChoices) {
      setError("Creating or editing entries requires school:view, staff:view, and subjects:view to load eligible choices.");
      return;
    }
    if (entry ? !canEdit : !canCreate) return;

    setEditingId(entry?.id || null);
    setForm(entry ? {
      dayOfWeek: entry.dayOfWeek,
      periodNumber: String(entry.periodNumber),
      subjectId: String(entry.subjectId),
      staffId: String(entry.staffId),
      room: entry.room || "",
      periodName: entry.periodName || "",
      startTime: entry.startTime || "",
      endTime: entry.endTime || "",
      status: entry.status || "ACTIVE"
    } : {
      ...emptyForm,
      dayOfWeek: slot?.dayOfWeek || workingDays[0] || "",
      periodNumber: String(slot?.periodNumber || 1)
    });
    setShowForm(true);
    setLoadingSubjects(true);
    try {
      const subjectRows = await api(`/api/classes/${classId}/subjects?academicYearId=${academicYearId}`);
      setSubjects((subjectRows || []).filter((subject) => subject.status === "ACTIVE"));
    } catch (err) {
      setError(err.message);
      setShowForm(false);
    } finally {
      setLoadingSubjects(false);
    }
  }

  async function save(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const payload = {
      classId: Number(classId),
      sectionId: Number(sectionId),
      academicYearId: Number(academicYearId),
      dayOfWeek: form.dayOfWeek,
      periodNumber: Number(form.periodNumber),
      periodName: form.periodName || null,
      startTime: form.startTime || null,
      endTime: form.endTime || null,
      subjectId: Number(form.subjectId),
      staffId: Number(form.staffId),
      room: form.room.trim() || null,
      status: form.status
    };
    try {
      await api(
        editingId ? `/api/timetable/${editingId}` : "/api/timetable",
        editingId ? "PUT" : "POST",
        payload
      );
      resetForm();
    } catch (err) {
      setError(err.message);
      setSaving(false);
      return;
    }
    try {
      await refreshAfterChange();
    } catch (err) {
      setError(`Entry saved, but the timetable could not be refreshed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }

  async function deleteEntry(entry) {
    if (!canDelete || !window.confirm(`Delete the Period ${entry.periodNumber} entry for ${entry.subjectName || "this subject"}?`)) return;
    setError("");
    try {
      await api(`/api/timetable/${entry.id}`, "DELETE");
    } catch (err) {
      setError(err.message);
      return;
    }
    try {
      await refreshAfterChange();
    } catch (err) {
      setError(`Entry deleted, but the timetable could not be refreshed: ${err.message}`);
    }
  }

  function changeAcademicYear(value) {
    setAcademicYearId(value);
    setClassId("");
    setSectionId("");
  }

  function changeClass(value) {
    setClassId(value);
    setSectionId("");
  }

  if (!canRead) {
    return <p className="error">You do not have permission to view the timetable.</p>;
  }

  return (
    <div>
      <PageHeader
        title="Timetable"
        description="View and manage the weekly timetable for a class section."
        actions={filtersSelected && canCreate && canLoadFormChoices && workingDays.length > 0
          ? <button type="button" onClick={() => openForm()}>Add timetable entry</button>
          : null}
      />
      {error && <p className="error" role="alert">{error}</p>}
      {referenceError && <p className="error" role="alert">{referenceError}</p>}
      <div className="card filter-bar timetable-filters">
        <label>
          Academic Year
          <select value={academicYearId} onChange={(event) => changeAcademicYear(event.target.value)} disabled={loadingReferences}>
            <option value="">Select academic year</option>
            {years.map((year) => <option key={year.id} value={year.id}>{year.name}</option>)}
          </select>
        </label>
        <label>
          Class
          <select value={classId} onChange={(event) => changeClass(event.target.value)} disabled={!academicYearId || loadingReferences}>
            <option value="">Select class</option>
            {classes.map((schoolClass) => <option key={schoolClass.id} value={schoolClass.id}>{schoolClass.name}</option>)}
          </select>
        </label>
        <label>
          Section
          <select value={sectionId} onChange={(event) => setSectionId(event.target.value)} disabled={!classId || loadingReferences}>
            <option value="">Select section</option>
            {selectedSections.map((section) => <option key={section.id} value={section.id}>{section.name}</option>)}
          </select>
        </label>
      </div>

      {loadingReferences ? <p className="muted">Loading timetable setup...</p>
        : !workingDaysLoaded ? (
          <p className="muted">Working-day configuration is unavailable.</p>
        ) : workingDays.length === 0 ? (
          <div className="card timetable-setup-message">
            <h3>No working days configured</h3>
            <p>Configure the school-wide timetable working days before displaying or editing a weekly timetable.</p>
          </div>
        ) : !filtersSelected ? (
          <p className="muted">Select an academic year, class, and section to view its weekly timetable.</p>
        ) : loadingEntries ? <p className="muted">Loading timetable...</p>
          : (
            <TableWrap>
              <table className="timetable-grid">
                <thead>
                  <tr>
                    <th scope="col">Period</th>
                    {workingDays.map((day) => <th scope="col" key={day}>{day}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {PERIOD_NUMBERS.map((periodNumber) => {
                    const periodEntries = entries.filter((entry) => Number(entry.periodNumber) === periodNumber);
                    const periodMetadata = periodEntries.find((entry) => entry.periodName || entry.startTime || entry.endTime);
                    const periodLabel = periodMetadata?.periodName
                      || [periodMetadata?.startTime, periodMetadata?.endTime].filter(Boolean).join(" - ")
                      || `Period ${periodNumber}`;
                    return (
                      <tr key={periodNumber}>
                        <th scope="row">{periodLabel}</th>
                        {workingDays.map((day) => {
                          const cellEntries = periodEntries.filter((entry) => entry.dayOfWeek === day);
                          return (
                            <td key={day}>
                              {cellEntries.map((entry) => (
                                <article className={`timetable-entry${entry.status === "INACTIVE" ? " is-inactive" : ""}`} key={entry.id}>
                                  <strong>{entry.subjectName || `Subject #${entry.subjectId}`}</strong>
                                  <span>{entry.teacherName || `Teacher #${entry.staffId}`}</span>
                                  {entry.room && <span>Room: {entry.room}</span>}
                                  {entry.status === "INACTIVE" && <span className="muted">Inactive</span>}
                                  <div className="timetable-entry-actions">
                                    {canEdit && canLoadFormChoices && <button type="button" className="secondary" onClick={() => openForm(entry)}>Edit</button>}
                                    {canDelete && <button type="button" className="danger" onClick={() => deleteEntry(entry)}>Delete</button>}
                                  </div>
                                </article>
                              ))}
                              {!cellEntries.length && canCreate && canLoadFormChoices && (
                                <button
                                  type="button"
                                  className="timetable-add-slot"
                                  aria-label={`Add entry ${day}, Period ${periodNumber}`}
                                  onClick={() => openForm(null, { dayOfWeek: day, periodNumber })}
                                >Add</button>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </TableWrap>
          )}
      {!loadingEntries && filtersSelected && workingDays.length > 0 && entries.length === 0 && (
        <p className="muted">No timetable entries have been saved for this section.</p>
      )}

      <ActionModal
        open={showForm}
        title={editingId ? "Edit timetable entry" : "Create timetable entry"}
        onClose={resetForm}
        size="lg"
      >
        {error && <p className="error" role="alert">{error}</p>}
        {loadingSubjects ? <p className="muted">Loading eligible subjects...</p> : (
          <form className="card form-card timetable-form" onSubmit={save}>
            <label>
              Working day
              <select required value={form.dayOfWeek} onChange={(event) => setForm({ ...form, dayOfWeek: event.target.value })}>
                {workingDays.map((day) => <option key={day} value={day}>{day}</option>)}
              </select>
            </label>
            <label>
              Period
              <select required value={form.periodNumber} onChange={(event) => setForm({ ...form, periodNumber: event.target.value })}>
                {PERIOD_NUMBERS.map((period) => <option key={period} value={period}>{period}</option>)}
              </select>
            </label>
            <label>
              Subject
              <select required value={form.subjectId} onChange={(event) => setForm({ ...form, subjectId: event.target.value, staffId: "" })}>
                <option value="">Select subject</option>
                {subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
              </select>
            </label>
            <label>
              Teacher
              <select required value={form.staffId} onChange={(event) => setForm({ ...form, staffId: event.target.value })}>
                <option value="">Select eligible teacher</option>
                {eligibleTeachers.map(([staffId, teacherName]) => <option key={staffId} value={staffId}>{teacherName}</option>)}
              </select>
            </label>
            <label>
              Room (optional)
              <input value={form.room} onChange={(event) => setForm({ ...form, room: event.target.value })} />
            </label>
            {!subjects.length && <p className="error field-span">No active subjects are mapped to this class and academic year.</p>}
            {!eligibleTeachers.length && <p className="error field-span">No active teacher assignment matches this section and subject.</p>}
            <p className="muted timetable-form-note">Period numbers are 1–12. No clock-time rules are applied.</p>
            <div className="row">
              <button disabled={saving || !subjects.length || !eligibleTeachers.length}>
                {saving ? "Saving..." : editingId ? "Save changes" : "Create entry"}
              </button>
              <button type="button" className="secondary" onClick={resetForm}>Cancel</button>
            </div>
          </form>
        )}
      </ActionModal>
    </div>
  );
}
