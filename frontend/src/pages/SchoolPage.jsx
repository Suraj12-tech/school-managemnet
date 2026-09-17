import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import PageHeader from "../components/PageHeader.jsx";

export default function SchoolPage() {
  const [school, setSchool] = useState(null);
  const [campuses, setCampuses] = useState([]);
  const [campusName, setCampusName] = useState("");
  const [campusAddress, setCampusAddress] = useState("");
  const [selectedCampus, setSelectedCampus] = useState(null);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    api("/api/school")
      .then((schoolData) => {
        if (active) setSchool(schoolData);
      })
      .catch((err) => {
        if (active) setError(err.message);
      });
    api("/api/campuses")
      .then((campusData) => {
        if (active) setCampuses(campusData);
      })
      .catch((err) => {
        if (active) setError(err.message);
      });
    return () => {
      active = false;
    };
  }, []);

  async function save(e) {
    e.preventDefault();
    try {
      const saved = await api("/api/school", "PUT", school);
      setSchool(saved);
      setMsg("School profile saved");
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }

  async function addCampus() {
    if (!campusName.trim()) return;
    try {
      const saved = await api("/api/campuses", "POST", {
        name: campusName.trim(),
        address: campusAddress.trim(),
        schoolId: school.id
      });
      setCampusName("");
      setCampusAddress("");
      setSelectedCampus(saved);
      setCampuses(await api("/api/campuses"));
      setMsg("Campus added");
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }

  if (!school) {
    return (
      <div>
        <PageHeader title="School profile" description="Manage the school identity and its campuses." />
        {error ? <p className="error">{error}</p> : <p>Loading school profile...</p>}
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="School profile" description="Manage the school identity and its campuses." />
      {msg && <p className="ok">{msg}</p>}
      {error && <p className="error">{error}</p>}
      <form className="card form-card" onSubmit={save}>
        <label>Name</label>
        <input value={school.name || ""} onChange={(e) => setSchool({ ...school, name: e.target.value })} />
        <label>Code</label>
        <input value={school.code || ""} onChange={(e) => setSchool({ ...school, code: e.target.value })} />
        <label>Address</label>
        <input value={school.address || ""} onChange={(e) => setSchool({ ...school, address: e.target.value })} />
        <label>Phone</label>
        <input value={school.phone || ""} onChange={(e) => setSchool({ ...school, phone: e.target.value })} />
        <label>Email</label>
        <input value={school.email || ""} onChange={(e) => setSchool({ ...school, email: e.target.value })} />
        <label>Website</label>
        <input value={school.website || ""} onChange={(e) => setSchool({ ...school, website: e.target.value })} />
        <button>Save school</button>
      </form>
      <h3>Campuses</h3>
      <div className="card">
        <input placeholder="Campus name" value={campusName} onChange={(e) => setCampusName(e.target.value)} />
        <input placeholder="Campus address (optional)" value={campusAddress} onChange={(e) => setCampusAddress(e.target.value)} />
        <button type="button" onClick={addCampus}>Add</button>
      </div>
      <ul className="list">
        {campuses.map((c) => (
          <li key={c.id}>
            <button className="linkish" onClick={() => setSelectedCampus(c)}>{c.name}</button>
            {c.address && <span className="muted"> — {c.address}</span>}
          </li>
        ))}
      </ul>
      {selectedCampus && (
        <div className="card">
          <h3>{selectedCampus.name} — School Profile</h3>
          <p><strong>School name:</strong> {school.name}</p>
          <p><strong>School code:</strong> {school.code}</p>
          <p><strong>School address:</strong> {school.address || "-"}</p>
          <p><strong>Phone:</strong> {school.phone || "-"}</p>
          <p><strong>Email:</strong> {school.email || "-"}</p>
          <p><strong>Website:</strong> {school.website || "-"}</p>
          <p><strong>Campus address:</strong> {selectedCampus.address || "-"}</p>
          <button type="button" className="secondary" onClick={() => setSelectedCampus(null)}>Close</button>
        </div>
      )}
    </div>
  );
}
