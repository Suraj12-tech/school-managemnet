import { useMemo, useState } from "react";
import ActionModal from "./ActionModal.jsx";

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (char === '"' && quoted && next === '"') {
      value += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(value.trim());
      value = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(value.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      value = "";
    } else {
      value += char;
    }
  }
  row.push(value.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

export default function BulkImportModal({ open, onClose, title, columns, requiredColumns, existingKeys, keyOf, mapRow, createRow }) {
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState([]);
  const [errors, setErrors] = useState([]);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);

  const validRows = useMemo(() => rows.filter((row) => !errors.some((error) => error.row === row.row)), [rows, errors]);

  function reset() {
    setFileName("");
    setRows([]);
    setErrors([]);
    setResult(null);
    setBusy(false);
  }

  function close() {
    reset();
    onClose();
  }

  function downloadTemplate() {
    const blob = new Blob([`${columns.join(",")}\n`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${title.toLowerCase().replace(/\s+/g, "-")}-template.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function readFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setResult(null);
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setRows([]);
      setErrors([{ row: 0, message: "Only CSV files are supported by this import workflow." }]);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => validate(parseCsv(String(reader.result || "")));
    reader.onerror = () => setErrors([{ row: 0, message: "The selected file could not be read." }]);
    reader.readAsText(file);
  }

  function validate(parsed) {
    if (!parsed.length) {
      setRows([]);
      setErrors([{ row: 0, message: "The CSV file is empty." }]);
      return;
    }
    const headers = parsed[0].map((header) => header.trim());
    const missing = requiredColumns.filter((column) => !headers.includes(column));
    if (missing.length) {
      setRows([]);
      setErrors([{ row: 1, message: `Missing required columns: ${missing.join(", ")}` }]);
      return;
    }
    const seen = new Set();
    const nextRows = parsed.slice(1).map((values, index) => {
      const data = Object.fromEntries(headers.map((header, column) => [header, values[column] || ""]));
      return { row: index + 2, data };
    });
    const nextErrors = [];
    nextRows.forEach((row) => {
      const missingValues = requiredColumns.filter((column) => !String(row.data[column] || "").trim());
      if (missingValues.length) nextErrors.push({ row: row.row, message: `Missing values: ${missingValues.join(", ")}` });
      const key = keyOf(row.data);
      if (key && (seen.has(key) || existingKeys.has(key))) {
        nextErrors.push({ row: row.row, message: "Duplicate record key." });
      }
      if (key) seen.add(key);
      try {
        const mapped = mapRow(row.data);
        row.payload = mapped;
        if (!mapped) nextErrors.push({ row: row.row, message: "Row could not be mapped." });
      } catch (error) {
        nextErrors.push({ row: row.row, message: error.message });
      }
    });
    setRows(nextRows);
    setErrors(nextErrors);
  }

  async function confirmImport() {
    setBusy(true);
    const failures = [];
    let created = 0;
    for (const row of validRows) {
      try {
        await createRow(row.payload);
        created += 1;
      } catch (error) {
        failures.push({ row: row.row, message: error.message });
      }
    }
    setResult({ total: rows.length, created, failed: failures.length, failures });
    setBusy(false);
  }

  return (
    <ActionModal open={open} title={title} onClose={close} size="lg">
      <div className="form-card">
        <p className="muted">Upload a CSV, review validation errors, then confirm creation. Existing records are not overwritten.</p>
        <div className="row">
          <input type="file" accept=".csv,text/csv" onChange={readFile} />
          <button type="button" className="secondary" onClick={downloadTemplate}>Download template</button>
        </div>
        {fileName && <p className="muted">Selected: {fileName}</p>}
        {errors.length > 0 && <div className="error"><strong>{errors.length} validation issue(s)</strong><ul>{errors.slice(0, 20).map((error, index) => <li key={`${error.row}-${index}`}>Row {error.row}: {error.message}</li>)}</ul></div>}
        {rows.length > 0 && <p>{rows.length} total rows · {validRows.length} ready to import · {errors.length} invalid</p>}
        {result && <div className={result.failed ? "error" : "ok"}><strong>Import result:</strong> {result.total} total, {result.created} created, {result.failed} failed{result.failures?.length ? ` (${result.failures.map((item) => `row ${item.row}: ${item.message}`).join("; ")})` : ""}</div>}
        <div className="row">
          <button type="button" disabled={!validRows.length || errors.length > 0 || busy} onClick={confirmImport}>{busy ? "Importing..." : "Confirm import"}</button>
          <button type="button" className="secondary" onClick={close}>Close</button>
        </div>
      </div>
    </ActionModal>
  );
}
