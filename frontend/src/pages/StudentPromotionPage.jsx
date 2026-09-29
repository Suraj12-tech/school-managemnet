import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client.js";
import PageHeader from "../components/PageHeader.jsx";
import TableWrap from "../components/TableWrap.jsx";

const emptyRequest = {
  fromAcademicYearId: "",
  toAcademicYearId: "",
  sourceClassId: ""
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
  const [loadingOptions, setLoadingOptions] = useState(true);

  useEffect(() => {
    Promise.all([api("/api/academic-years"), api("/api/classes"), api("/api/sections")])
      .then(([yearRows, classRows, sectionRows]) => {
        setYears(yearRows || []);
        setClasses(classRows || []);
        setSections(sectionRows || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoadingOptions(false));
  }, []);

  const sourceClasses = useMemo(() => {
    const availableClassIds = new Set(sections
      .filter((section) => String(section.academicYearId) === String(form.fromAcademicYearId)
        && section.status === "ACTIVE")
      .map((section) => String(section.classId)));
    return classes.filter((schoolClass) => availableClassIds.has(String(schoolClass.id)));
  }, [classes, sections, form.fromAcademicYearId]);
  const rowsBySection = useMemo(() => {
    if (!preview) return [];
    const grouped = new Map();
    preview.rows.forEach((row) => {
      const rows = grouped.get(row.currentSection) || [];
      rows.push(row);
      grouped.set(row.currentSection, rows);
    });
    return Array.from(grouped, ([sectionName, rows]) => ({ sectionName, rows }));
  }, [preview]);

  function update(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
      ...(field === "fromAcademicYearId" ? { sourceClassId: "" } : {})
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
        sourceClassId: Number(form.sourceClassId)
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
        sourceClassId: Number(form.sourceClassId),
        decisions: preview.rows.map((row) => ({
          studentId: row.studentId,
          status: row.status
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
      <PageHeader title="Student promotion" description="Promote a source class into the next class while preserving each student's section." />
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
        <select required value={form.sourceClassId} onChange={(e) => update("sourceClassId", e.target.value)}>
          <option value="">Source class</option>
          {sourceClasses.map((schoolClass) => <option key={schoolClass.id} value={schoolClass.id}>{schoolClass.name}</option>)}
        </select>
        <button disabled={loading || loadingOptions || !form.sourceClassId || !form.toAcademicYearId}>
          {loading ? "Loading..." : "Preview promotion"}
        </button>
      </form>

      {preview && (
        <section className="card">
          <h3>{preview.fromClass} → {preview.toClass}</h3>
          <p>
            {years.find((year) => String(year.id) === String(preview.fromAcademicYearId))?.name}
            {" → "}
            {years.find((year) => String(year.id) === String(preview.toAcademicYearId))?.name}
          </p>
          {preview.rows.some((row) => row.promotionBlocked && row.issue?.includes("not available")) && (
            <div className="error">
              <strong>Some target sections are missing.</strong>
              <p>Please create the required target section(s) before promoting the blocked students.</p>
            </div>
          )}
          {rowsBySection.map(({ sectionName, rows }) => {
            const targetSection = rows[0].newSection;
            const sectionBlocked = rows.every((row) => row.promotionBlocked);
            return (
              <div className="card" key={sectionName}>
                <h4>
                  Section {sectionName}: {preview.fromClass} - {sectionName} → {preview.toClass} - {targetSection || sectionName}
                </h4>
                <p>{rows.length} student(s)</p>
                {!targetSection && (
                  <p className="error">
                    Section {sectionName} is not available for {preview.toClass} in the target academic year.
                    Please create the section before promoting students.
                  </p>
                )}
                {sectionBlocked && targetSection && <p className="error">These students cannot be promoted.</p>}
              </div>
            );
          })}
          <div className="row row-between">
            <h3>Promotion preview</h3>
            <button
              type="button"
              onClick={confirm}
              disabled={loading || !preview.rows.some((row) => !row.promotionBlocked && row.status === "PROMOTED")}
            >
              Confirm promotion
            </button>
          </div>
          <TableWrap>
            <table>
              <thead><tr><th>Student</th><th>Current class</th><th>Current section</th><th>New class</th><th>New section</th><th>Status</th></tr></thead>
              <tbody>{preview.rows.map((row) => <tr key={row.studentId}>
                <td>{row.studentName} ({row.admissionNumber})</td>
                <td>{row.currentClass}</td><td>{row.currentSection}</td>
                <td>{row.newClass}</td><td>{row.newSection || "Not available"}</td>
                <td>
                  <select
                    value={row.status}
                    disabled={row.promotionBlocked}
                    onChange={(e) => setStatus(row.studentId, e.target.value)}
                  >
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
          <p>{summary.totalProcessed} processed · {summary.promoted} promoted · {summary.notPromoted} not promoted · {summary.transferred} transferred · {summary.left} left · {summary.failed} blocked or failed</p>
        </div>
      )}
    </div>
  );
}
