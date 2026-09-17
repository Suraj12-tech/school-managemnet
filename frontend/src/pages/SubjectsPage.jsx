import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import PageHeader from "../components/PageHeader.jsx";
import StatusBadge from "../components/StatusBadge.jsx";

const emptyDepartment = { name: "", code: "", description: "", status: "ACTIVE" };
const emptySubject = { name: "", code: "", departmentId: "", description: "", status: "ACTIVE" };

export default function SubjectsPage() {
  const [departments, setDepartments] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [years, setYears] = useState([]);
  const [department, setDepartment] = useState(emptyDepartment);
  const [subject, setSubject] = useState(emptySubject);
  const [editingDepartmentId, setEditingDepartmentId] = useState(null);
  const [editingSubjectId, setEditingSubjectId] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [mapping, setMapping] = useState({ classId: "", academicYearId: "" });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [departmentData, subjectData, classData, yearData] = await Promise.all([
        api("/api/departments"),
        api("/api/subjects"),
        api("/api/classes"),
        api("/api/academic-years")
      ]);
      setDepartments(departmentData);
      setSubjects(subjectData);
      setClasses(classData);
      setYears(yearData);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function clearFeedback() {
    setError("");
    setMessage("");
  }

  async function saveDepartment(e) {
    e.preventDefault();
    clearFeedback();
    try {
      await api(
        editingDepartmentId ? `/api/departments/${editingDepartmentId}` : "/api/departments",
        editingDepartmentId ? "PUT" : "POST",
        department
      );
      setDepartment(emptyDepartment);
      setEditingDepartmentId(null);
      setMessage(editingDepartmentId ? "Department updated" : "Department created");
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function saveSubject(e) {
    e.preventDefault();
    clearFeedback();
    try {
      await api(
        editingSubjectId ? `/api/subjects/${editingSubjectId}` : "/api/subjects",
        editingSubjectId ? "PUT" : "POST",
        { ...subject, departmentId: Number(subject.departmentId) }
      );
      setSubject(emptySubject);
      setEditingSubjectId(null);
      setMessage(editingSubjectId ? "Subject updated" : "Subject created");
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  function editDepartment(item) {
    setEditingDepartmentId(item.id);
    setDepartment({
      name: item.name || "",
      code: item.code || "",
      description: item.description || "",
      status: item.status || "ACTIVE"
    });
    setSelectedDepartment(null);
  }

  function editSubject(item) {
    setEditingSubjectId(item.id);
    setSubject({
      name: item.name || "",
      code: item.code || "",
      departmentId: String(item.departmentId || ""),
      description: item.description || "",
      status: item.status || "ACTIVE"
    });
    setSelectedSubject(null);
  }

  async function toggleDepartment(item) {
    clearFeedback();
    try {
      await api(`/api/departments/${item.id}/status`, "PATCH", {
        status: item.status === "ACTIVE" ? "INACTIVE" : "ACTIVE"
      });
      setMessage("Department status updated");
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function toggleSubject(item) {
    clearFeedback();
    try {
      await api(`/api/subjects/${item.id}/status`, "PATCH", {
        status: item.status === "ACTIVE" ? "INACTIVE" : "ACTIVE"
      });
      setMessage("Subject status updated");
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteDepartment(id) {
    if (!window.confirm("Delete this department? This cannot be undone.")) return;
    clearFeedback();
    try {
      await api(`/api/departments/${id}`, "DELETE");
      setMessage("Department deleted");
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteSubject(id) {
    if (!window.confirm("Delete this subject? This cannot be undone.")) return;
    clearFeedback();
    try {
      await api(`/api/subjects/${id}`, "DELETE");
      setMessage("Subject deleted");
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function viewDepartment(id) {
    clearFeedback();
    try {
      setSelectedDepartment(await api(`/api/departments/${id}`));
    } catch (err) {
      setError(err.message);
    }
  }

  async function viewSubject(id) {
    clearFeedback();
    try {
      setSelectedSubject(await api(`/api/subjects/${id}`));
    } catch (err) {
      setError(err.message);
    }
  }

  async function addMapping(e) {
    e.preventDefault();
    if (!selectedSubject) return;
    clearFeedback();
    try {
      await api(`/api/subjects/${selectedSubject.subject.id}/classes`, "POST", {
        classId: Number(mapping.classId),
        academicYearId: Number(mapping.academicYearId)
      });
      setMapping({ classId: "", academicYearId: "" });
      setMessage("Subject mapped to class");
      await viewSubject(selectedSubject.subject.id);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function removeMapping(item) {
    clearFeedback();
    try {
      await api(
        `/api/subjects/${item.subjectId}/classes/${item.classId}?academicYearId=${item.academicYearId}`,
        "DELETE"
      );
      setMessage("Subject-class mapping removed");
      await viewSubject(item.subjectId);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) return <p>Loading subjects and departments...</p>;

  return (
    <div>
      <PageHeader title="Departments & subjects" description="Organize the academic catalog and map subjects to classes." />
      {message && <p className="ok">{message}</p>}
      {error && <p className="error">{error}</p>}

      <form className="card form-card" onSubmit={saveDepartment}>
        <h3>{editingDepartmentId ? "Edit department" : "New department"}</h3>
        <input required placeholder="Department name" value={department.name}
          onChange={(e) => setDepartment({ ...department, name: e.target.value })} />
        <input placeholder="Code (optional)" value={department.code}
          onChange={(e) => setDepartment({ ...department, code: e.target.value })} />
        <textarea placeholder="Description (optional)" value={department.description}
          onChange={(e) => setDepartment({ ...department, description: e.target.value })} />
        <select value={department.status}
          onChange={(e) => setDepartment({ ...department, status: e.target.value })}>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
        <button>{editingDepartmentId ? "Save department" : "Create department"}</button>
        {editingDepartmentId && <button type="button" className="secondary"
          onClick={() => { setEditingDepartmentId(null); setDepartment(emptyDepartment); }}>Cancel</button>}
      </form>

      <h3>Departments</h3>
      <table>
        <thead><tr><th>Department</th><th>Subjects</th><th>Staff</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>
          {departments.map((item) => (
            <tr key={item.id}>
              <td>{item.name}</td>
              <td>{item.subjectCount}</td>
              <td>{item.staffCount}</td>
              <td><StatusBadge value={item.status} /></td>
              <td>
                <button type="button" onClick={() => viewDepartment(item.id)}>View</button>{" "}
                <button type="button" onClick={() => editDepartment(item)}>Edit</button>{" "}
                <button type="button" onClick={() => toggleDepartment(item)}>
                  {item.status === "ACTIVE" ? "Deactivate" : "Activate"}
                </button>{" "}
                <button type="button" onClick={() => deleteDepartment(item.id)}>Delete</button>
              </td>
            </tr>
          ))}
          {!departments.length && <tr><td colSpan="5">No departments created yet.</td></tr>}
        </tbody>
      </table>

      <form className="card form-card" onSubmit={saveSubject}>
        <h3>{editingSubjectId ? "Edit subject" : "New subject"}</h3>
        <input required placeholder="Subject name" value={subject.name}
          onChange={(e) => setSubject({ ...subject, name: e.target.value })} />
        <input required placeholder="Subject code" value={subject.code}
          onChange={(e) => setSubject({ ...subject, code: e.target.value })} />
        <select required value={subject.departmentId}
          onChange={(e) => setSubject({ ...subject, departmentId: e.target.value })}>
          <option value="">Department</option>
          {departments.filter((item) => item.status === "ACTIVE").map((item) => (
            <option key={item.id} value={item.id}>{item.name}</option>
          ))}
        </select>
        <textarea placeholder="Description (optional)" value={subject.description}
          onChange={(e) => setSubject({ ...subject, description: e.target.value })} />
        <select value={subject.status}
          onChange={(e) => setSubject({ ...subject, status: e.target.value })}>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
        <button>{editingSubjectId ? "Save subject" : "Create subject"}</button>
        {editingSubjectId && <button type="button" className="secondary"
          onClick={() => { setEditingSubjectId(null); setSubject(emptySubject); }}>Cancel</button>}
      </form>

      <h3>Subjects</h3>
      <table>
        <thead><tr><th>Subject</th><th>Code</th><th>Department</th><th>Classes</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>
          {subjects.map((item) => (
            <tr key={item.id}>
              <td>{item.name}</td>
              <td>{item.code}</td>
              <td>{item.departmentName}</td>
              <td>{item.classIds?.length || 0}</td>
              <td><StatusBadge value={item.status} /></td>
              <td>
                <button type="button" onClick={() => viewSubject(item.id)}>View</button>{" "}
                <button type="button" onClick={() => editSubject(item)}>Edit</button>{" "}
                <button type="button" onClick={() => toggleSubject(item)}>
                  {item.status === "ACTIVE" ? "Deactivate" : "Activate"}
                </button>{" "}
                <button type="button" onClick={() => deleteSubject(item.id)}>Delete</button>
              </td>
            </tr>
          ))}
          {!subjects.length && <tr><td colSpan="6">No subjects created yet.</td></tr>}
        </tbody>
      </table>

      {selectedDepartment && (
        <div className="card">
          <h3>{selectedDepartment.department.name} — Department Details</h3>
          <p><strong>Description:</strong> {selectedDepartment.department.description || "-"}</p>
          <p><strong>Status:</strong> {selectedDepartment.department.status}</p>
          <p><strong>Staff:</strong> {selectedDepartment.department.staffCount}</p>
          <h4>Associated subjects</h4>
          <p>{selectedDepartment.subjects.length
            ? selectedDepartment.subjects.map((item) => item.name).join(", ")
            : "No subjects assigned."}</p>
          <button type="button" className="secondary" onClick={() => setSelectedDepartment(null)}>Close</button>
        </div>
      )}

      {selectedSubject && (
        <div className="card">
          <h3>{selectedSubject.subject.name} — Subject Details</h3>
          <p><strong>Code:</strong> {selectedSubject.subject.code}</p>
          <p><strong>Department:</strong> {selectedSubject.subject.departmentName}</p>
          <p><strong>Description:</strong> {selectedSubject.subject.description || "-"}</p>
          <p><strong>Status:</strong> {selectedSubject.subject.status}</p>
          <p><strong>Assigned teachers:</strong> {selectedSubject.assignedTeacherNames.length
            ? selectedSubject.assignedTeacherNames.join(", ")
            : "None"}</p>
          <h4>Applicable classes</h4>
          <form onSubmit={addMapping}>
            <select required value={mapping.classId} onChange={(e) => setMapping({ ...mapping, classId: e.target.value })}>
              <option value="">Class</option>
              {classes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
            <select required value={mapping.academicYearId}
              onChange={(e) => setMapping({ ...mapping, academicYearId: e.target.value })}>
              <option value="">Academic year</option>
              {years.filter((item) => item.status !== "ARCHIVED").map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
            <button type="submit">Map class</button>
          </form>
          <ul className="list">
            {selectedSubject.classMappings.map((item) => (
              <li key={item.id}>
                {item.className} ({item.academicYearName}){" "}
                <button type="button" className="secondary" onClick={() => removeMapping(item)}>Remove</button>
              </li>
            ))}
            {!selectedSubject.classMappings.length && <li>No class mappings.</li>}
          </ul>
          <button type="button" className="secondary" onClick={() => setSelectedSubject(null)}>Close</button>
        </div>
      )}
    </div>
  );
}
