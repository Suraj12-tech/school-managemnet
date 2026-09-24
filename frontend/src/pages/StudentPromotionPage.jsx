import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client.js";
import PageHeader from "../components/PageHeader.jsx";
import TableWrap from "../components/TableWrap.jsx";

const emptyRequest = {
  fromAcademicYearId: "",
  toAcademicYearId: "",
  targetClassId: "",
  targetSectionId: ""
};

export default function StudentPromotionPage() {
  const [years, setYears] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [form, setForm] = useState(emptyRequest);
  const [preview, setPreview] = useState(null);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([api("/api/academic-years"), api("/api/classes"), api("/api/sections")])
      .then(([yearRows, classRows, sectionRows]) => {
        setYears(yearRows || []);
        setClasses(classRows || []);
        setSections(sectionRows || []);
      })
      .catch((err) => setError(err.message));
  }, []);

  const targetSections = useMemo(
    () => sections.filter((section) =>
      (!form.targetClassId || String(section.classId) === String(form.targetClassId))
      && (!form.toAcademicYearId || String(section.academicYearId) === String(form.toAcademicYearId))
      && section.status === "ACTIVE"
    ),
    [sections, form.targetClassId, form.toAcademicYearId]
  );

  function update(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
      ...(field === "targetClassId" || field === "toAcademicYearId" ? { targetSectionId: "" } : {})
    }));
    setPreview(null);
    setSummary(null);
  }

  async function loadPreview(event) {
    event.preventDefault();
    setError("");
    setSummary(null);
    setLoading(true);
    try {
      setPreview(await api("/api/student-promotions/preview", "POST", {
        ...form,
        fromAcademicYearId: Number(form.fromAcademicYearId),
        toAcademicYearId: Number(form.toAcademicYearId),
        targetClassId: Number(form.targetClassId),
        targetSectionId: Number(form.targetSectionId)
      }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function setStatus(studentId, status) {
    setPreview((current) => ({
      ...current,
      rows: current.rows.map((row) => row.studentId === studentId ? { ...row, status } : row)
    }));
  }

  async function confirm() {
    if (!preview || !window.confirm("Confirm promotion for the reviewed students?")) return;
    setError("");
    setLoading(true);
    try {
      setSummary(await api("/api/student-promotions/confirm", "POST", {
        ...form,
        fromAcademicYearId: Number(form.fromAcademicYearId),
        toAcademicYearId: Number(form.toAcademicYearId),
        targetClassId: Number(form.targetClassId),
        targetSectionId: Number(form.targetSectionId),
        decisions: preview.rows.map((row) => ({
          studentId: row.studentId,
          status: row.status,
          targetClassId: Number(form.targetClassId),
          targetSectionId: Number(form.targetSectionId)
        }))
      }));
      setPreview(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <PageHeader title="Student promotion" description="Create new academic-year enrollments without changing historical class or fee records." />
      {error && <p className="error">{error}</p>}
      <form className="card filter-bar" onSubmit={loadPreview}>
        <select required value={form.fromAcademicYearId} onChange={(e) => update("fromAcademicYearId", e.target.value)}>
          <option value="">From academic year</option>
          {years.map((year) => <option key={year.id} value={year.id}>{year.name}</option>)}
        </select>
        <select required value={form.toAcademicYearId} onChange={(e) => update("toAcademicYearId", e.target.value)}>
          <option value="">To academic year</option>
          {years.filter((year) => String(year.id) !== String(form.fromAcademicYearId) && year.status !== "ARCHIVED")
            .map((year) => <option key={year.id} value={year.id}>{year.name}</option>)}
        </select>
        <select required value={form.targetClassId} onChange={(e) => update("targetClassId", e.target.value)}>
          <option value="">Target class</option>
          {classes.map((schoolClass) => <option key={schoolClass.id} value={schoolClass.id}>{schoolClass.name}</option>)}
        </select>
        <select required value={form.targetSectionId} onChange={(e) => update("targetSectionId", e.target.value)}>
          <option value="">Target section</option>
          {targetSections.map((section) => <option key={section.id} value={section.id}>{section.name}</option>)}
        </select>
        <button disabled={loading}>{loading ? "Loading..." : "Preview promotion"}</button>
      </form>

      {preview && (
        <section className="card">
          <div className="row row-between">
            <h3>Review promotion</h3>
            <button type="button" onClick={confirm} disabled={loading}>Confirm promotion</button>
          </div>
          <TableWrap>
            <table>
              <thead><tr><th>Student</th><th>Current class</th><th>Current section</th><th>New class</th><th>New section</th><th>Status</th></tr></thead>
              <tbody>{preview.rows.map((row) => <tr key={row.studentId}>
                <td>{row.studentName} ({row.admissionNumber})</td>
                <td>{row.currentClass}</td><td>{row.currentSection}</td>
                <td>{row.newClass}</td><td>{row.newSection}</td>
                <td>
                  <select value={row.status} onChange={(e) => setStatus(row.studentId, e.target.value)}>
                    <option>PROMOTED</option><option>NOT_PROMOTED</option><option>TRANSFERRED</option><option>LEFT</option>
                  </select>
                  {row.issue && <small className="error">{row.issue}</small>}
                </td>
              </tr>)}</tbody>
            </table>
          </TableWrap>
        </section>
      )}

      {summary && (
        <div className="card">
          <h3>Promotion complete</h3>
          <p>{summary.totalProcessed} processed · {summary.promoted} promoted · {summary.notPromoted} not promoted · {summary.transferred} transferred · {summary.left} left · {summary.failed} failed</p>
        </div>
      )}
    </div>
  );
}
