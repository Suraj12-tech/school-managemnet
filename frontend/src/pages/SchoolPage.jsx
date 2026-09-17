import { useEffect, useState } from "react";
import { api } from "../api/client.js";

export default function SchoolPage() {
  const [school, setSchool] = useState(null);
  const [campuses, setCampuses] = useState([]);
  const [campusName, setCampusName] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    api("/api/school").then(setSchool);
    api("/api/campuses").then(setCampuses);
  }, []);

  async function save(e) {
    e.preventDefault();
    const saved = await api("/api/school", "PUT", school);
    setSchool(saved);
    setMsg("School profile saved");
  }

  async function addCampus() {
    await api("/api/campuses", "POST", { name: campusName, schoolId: school.id });
    setCampusName("");
    setCampuses(await api("/api/campuses"));
  }

  if (!school) return <p>Loading...</p>;

  return (
    <div>
      <h2>School Profile</h2>
      {msg && <p className="ok">{msg}</p>}
      <form className="card" onSubmit={save}>
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
        <button>Save school</button>
      </form>
      <h3>Campuses</h3>
      <div className="row">
        <input placeholder="Campus name" value={campusName} onChange={(e) => setCampusName(e.target.value)} />
        <button type="button" onClick={addCampus}>Add</button>
      </div>
      <ul>{campuses.map((c) => <li key={c.id}>{c.name}</li>)}</ul>
    </div>
  );
}
