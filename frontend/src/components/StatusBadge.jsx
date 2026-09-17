export default function StatusBadge({ value }) {
  const label = String(value || "UNKNOWN");
  return <span className={`status-badge ${label.toLowerCase()}`}>{label}</span>;
}
