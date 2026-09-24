import { useEffect, useState, useMemo } from "react";
import { api } from "../api/client.js";
import ActionModal from "../components/ActionModal.jsx";
import PageHeader from "../components/PageHeader.jsx";
import StatusBadge from "../components/StatusBadge.jsx";

const EVENT_TYPES = [
  { value: "SCHOOL_EVENT", label: "School Event", colorClass: "school_event" },
  { value: "HOLIDAY", label: "Holiday", colorClass: "holiday" },
  { value: "EXAM", label: "Exam", colorClass: "exam" },
  { value: "IMPORTANT_DATE", label: "Important Academic Date", colorClass: "important_date" },
  { value: "ACTIVITY", label: "Activity", colorClass: "activity" },
  { value: "OTHER", label: "Other", colorClass: "other" }
];

const emptyYear = { name: "", startDate: "", endDate: "", status: "RUNNING" };
const emptyTerm = { name: "", startDate: "", endDate: "", academicYearId: "", status: "ACTIVE" };
const emptyEvent = { title: "", eventType: "SCHOOL_EVENT", startDate: "", endDate: "", description: "", academicYearId: "", status: "ACTIVE" };

export default function YearsPage() {
  const [activeTab, setActiveTab] = useState("calendar"); // "calendar" | "years-terms"
  const [years, setYears] = useState([]);
  const [terms, setTerms] = useState([]);
  const [events, setEvents] = useState([]);

  // Academic Year & Term State
  const [year, setYear] = useState(emptyYear);
  const [term, setTerm] = useState(emptyTerm);
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedTerm, setSelectedTerm] = useState(null);
  const [editingYearId, setEditingYearId] = useState(null);
  const [editingTermId, setEditingTermId] = useState(null);
  const [showYearForm, setShowYearForm] = useState(false);
  const [showTermForm, setShowTermForm] = useState(false);

  // Calendar State
  const [calendarYearId, setCalendarYearId] = useState("");
  const [calendarView, setCalendarView] = useState("month"); // "month" | "list"
  const [currentDate, setCurrentDate] = useState(new Date());
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [eventForm, setEventForm] = useState(emptyEvent);
  const [editingEventId, setEditingEventId] = useState(null);
  const [showEventForm, setShowEventForm] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    try {
      setError("");
      const loadedYears = await api("/api/academic-years");
      setYears(loadedYears);
      setTerms(await api("/api/terms"));

      // Set default calendar academic year if not yet set
      const currentOrFirst = loadedYears.find((item) => item.currentYear) || loadedYears.find((item) => item.status !== "ARCHIVED") || loadedYears[0];
      if (currentOrFirst) {
        setCalendarYearId((prev) => prev || String(currentOrFirst.id));
        setTerm((current) => current.academicYearId ? current : { ...current, academicYearId: String(currentOrFirst.id) });
        setEventForm((current) => current.academicYearId ? current : { ...current, academicYearId: String(currentOrFirst.id) });
      }

      if (selectedYear) {
        const refreshed = loadedYears.find((item) => item.id === selectedYear.id);
        setSelectedYear(refreshed || null);
      }
    } catch (err) {
      setError(err.message);
    }
  }

  async function loadEvents(yearId, type) {
    if (!yearId) return;
    try {
      let url = `/api/calendar-events?academicYearId=${yearId}`;
      if (type) {
        url += `&eventType=${type}`;
      }
      const loadedEvents = await api(url);
      setEvents(loadedEvents);
      if (selectedEvent) {
        const refreshed = loadedEvents.find((item) => item.id === selectedEvent.id);
        setSelectedEvent(refreshed || null);
      }
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (calendarYearId) {
      loadEvents(calendarYearId, typeFilter);
    }
  }, [calendarYearId, typeFilter]);

  const activeAcademicYear = useMemo(() => {
    return years.find((y) => String(y.id) === String(calendarYearId)) || null;
  }, [years, calendarYearId]);

  // Adjust month view when calendar academic year changes
  useEffect(() => {
    if (activeAcademicYear?.startDate) {
      const yearStart = new Date(activeAcademicYear.startDate);
      const today = new Date();
      const yearEnd = new Date(activeAcademicYear.endDate);
      if (today >= yearStart && today <= yearEnd) {
        setCurrentDate(today);
      } else {
        setCurrentDate(yearStart);
      }
    }
  }, [calendarYearId]);

  // ==================== Academic Year Handlers ====================
  async function saveYear(e) {
    e.preventDefault();
    try {
      setError("");
      const payload = { ...year, status: year.status === "RUNNING" ? "ACTIVE" : "ARCHIVED" };
      await api(editingYearId ? "/api/academic-years/" + editingYearId : "/api/academic-years",
        editingYearId ? "PUT" : "POST", payload);
      setYear(emptyYear);
      setEditingYearId(null);
      setShowYearForm(false);
      setMessage(editingYearId ? "Academic year updated" : "Academic year created");
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function saveTerm(e) {
    e.preventDefault();
    try {
      setError("");
      const body = { ...term, academicYearId: Number(term.academicYearId) };
      await api(editingTermId ? "/api/terms/" + editingTermId : "/api/terms",
        editingTermId ? "PUT" : "POST", body);
      setTerm(emptyTerm);
      setEditingTermId(null);
      setShowTermForm(false);
      setMessage(editingTermId ? "Term updated" : "Term created");
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function setCurrent(id) {
    try {
      await api("/api/academic-years/" + id + "/current", "POST");
      setMessage("Current academic year updated");
      load();
    } catch (err) { setError(err.message); }
  }

  async function updateYearStatus(item) {
    try {
      const status = item.status === "ARCHIVED" ? "ACTIVE" : "ARCHIVED";
      await api("/api/academic-years/" + item.id + "/status", "PATCH", { status });
      setMessage("Academic year status updated");
      load();
    } catch (err) { setError(err.message); }
  }

  async function updateTermStatus(item) {
    try {
      const status = item.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
      await api("/api/terms/" + item.id + "/status", "PATCH", { status });
      setMessage("Term status updated");
      load();
    } catch (err) { setError(err.message); }
  }

  async function removeTerm(id) {
    if (!window.confirm("Delete this term? This cannot be undone.")) return;
    try {
      setError("");
      await api("/api/terms/" + id + "/delete", "POST");
      setMessage("Term deleted");
      load();
    } catch (err) { setError(err.message); }
  }

  function editYear(item) {
    setEditingYearId(item.id);
    setYear({
      name: item.name,
      startDate: item.startDate,
      endDate: item.endDate,
      status: item.status === "ARCHIVED" ? "END" : "RUNNING"
    });
    setShowYearForm(true);
  }

  function editTerm(item) {
    setEditingTermId(item.id);
    setTerm({
      name: item.name,
      startDate: item.startDate,
      endDate: item.endDate,
      academicYearId: String(item.academicYearId),
      status: item.status
    });
    setShowTermForm(true);
  }

  function cancelYearEdit() {
    setEditingYearId(null);
    setYear(emptyYear);
    setShowYearForm(false);
  }

  function cancelTermEdit() {
    setEditingTermId(null);
    setTerm(emptyTerm);
    setShowTermForm(false);
  }

  function yearDisplayStatus(item) {
    const today = new Date().toISOString().slice(0, 10);
    return item.status === "ARCHIVED" || item.endDate < today ? "END" : item.currentYear ? "RUNNING" : "END";
  }

  // ==================== Calendar Event Handlers ====================
  function openAddEvent(dateStr = "") {
    setError("");
    setEditingEventId(null);
    setEventForm({
      title: "",
      eventType: "SCHOOL_EVENT",
      startDate: dateStr || (activeAcademicYear ? activeAcademicYear.startDate : ""),
      endDate: dateStr || "",
      description: "",
      academicYearId: calendarYearId,
      status: "ACTIVE"
    });
    setShowEventForm(true);
  }

  function editEvent(evt) {
    setError("");
    setEditingEventId(evt.id);
    setEventForm({
      title: evt.title,
      eventType: evt.eventType,
      startDate: evt.startDate,
      endDate: evt.endDate || "",
      description: evt.description || "",
      academicYearId: String(evt.academicYearId),
      status: evt.status
    });
    setShowEventForm(true);
    setSelectedEvent(null);
  }

  function cancelEventEdit() {
    setEditingEventId(null);
    setEventForm(emptyEvent);
    setShowEventForm(false);
  }

  async function saveEvent(e) {
    e.preventDefault();
    try {
      setError("");
      const body = {
        ...eventForm,
        academicYearId: Number(eventForm.academicYearId),
        endDate: eventForm.endDate ? eventForm.endDate : eventForm.startDate
      };
      await api(editingEventId ? `/api/calendar-events/${editingEventId}` : "/api/calendar-events",
        editingEventId ? "PUT" : "POST", body);
      setShowEventForm(false);
      setEditingEventId(null);
      setEventForm(emptyEvent);
      setMessage(editingEventId ? "Calendar event updated" : "Calendar event created");
      loadEvents(calendarYearId, typeFilter);
    } catch (err) {
      setError(err.message);
    }
  }

  async function updateEventStatus(evt) {
    try {
      const status = evt.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
      await api(`/api/calendar-events/${evt.id}/status`, "PATCH", { status });
      setMessage("Event status updated");
      loadEvents(calendarYearId, typeFilter);
    } catch (err) {
      setError(err.message);
    }
  }

  async function removeEvent(id) {
    if (!window.confirm("Delete this calendar event? This cannot be undone.")) return;
    try {
      setError("");
      await api(`/api/calendar-events/${id}/delete`, "POST");
      setMessage("Calendar event deleted");
      setSelectedEvent(null);
      loadEvents(calendarYearId, typeFilter);
    } catch (err) {
      setError(err.message);
    }
  }

  // ==================== Calendar Calculation Helpers ====================
  const filteredEvents = useMemo(() => {
    return events.filter((evt) => {
      if (statusFilter !== "ALL" && evt.status !== statusFilter) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const matchTitle = evt.title?.toLowerCase().includes(q);
        const matchDesc = evt.description?.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc) return false;
      }
      return true;
    });
  }, [events, statusFilter, searchTerm]);

  const yearMonthString = currentDate.toLocaleString("default", { month: "long", year: "numeric" });

  function prevMonth() {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  }

  function nextMonth() {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  }

  function goToToday() {
    setCurrentDate(new Date());
  }

  // Generate the 35/42 calendar days for current month view
  const calendarDays = useMemo(() => {
    const yearNum = currentDate.getFullYear();
    const monthNum = currentDate.getMonth();
    const firstDayIndex = new Date(yearNum, monthNum, 1).getDay(); // 0 is Sun
    const totalDaysInMonth = new Date(yearNum, monthNum + 1, 0).getDate();
    const prevMonthTotalDays = new Date(yearNum, monthNum, 0).getDate();

    const days = [];

    // Previous month filler days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = prevMonthTotalDays - i;
      const date = new Date(yearNum, monthNum - 1, dayNum);
      const dateStr = date.toISOString().slice(0, 10);
      days.push({
        date,
        dateStr,
        dayNum,
        isCurrentMonth: false
      });
    }

    // Current month days
    for (let i = 1; i <= totalDaysInMonth; i++) {
      const date = new Date(yearNum, monthNum, i);
      const dateStr = `${yearNum}-${String(monthNum + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
      days.push({
        date,
        dateStr,
        dayNum: i,
        isCurrentMonth: true
      });
    }

    // Next month filler days (fill up to grid multiple of 7)
    const totalSlots = Math.ceil(days.length / 7) * 7;
    const remaining = totalSlots - days.length;
    for (let i = 1; i <= remaining; i++) {
      const date = new Date(yearNum, monthNum + 1, i);
      const dateStr = date.toISOString().slice(0, 10);
      days.push({
        date,
        dateStr,
        dayNum: i,
        isCurrentMonth: false
      });
    }

    const todayStr = new Date().toISOString().slice(0, 10);

    return days.map((d) => {
      const dayEvents = filteredEvents.filter((evt) => {
        const start = evt.startDate;
        const end = evt.endDate || evt.startDate;
        return d.dateStr >= start && d.dateStr <= end;
      });

      const isInsideYear = activeAcademicYear
        ? d.dateStr >= activeAcademicYear.startDate && d.dateStr <= activeAcademicYear.endDate
        : true;

      return {
        ...d,
        isToday: d.dateStr === todayStr,
        isInsideYear,
        events: dayEvents
      };
    });
  }, [currentDate, filteredEvents, activeAcademicYear]);

  function getEventTypeLabel(type) {
    const found = EVENT_TYPES.find((t) => t.value === type);
    return found ? found.label : type;
  }

  function getEventTypeBadge(type) {
    const found = EVENT_TYPES.find((t) => t.value === type);
    const cls = found ? found.colorClass : "other";
    return <span className={`event-badge event-${cls}`}>{found ? found.label : type}</span>;
  }

  return (
    <div>
      <PageHeader
        title="Academic year, terms & calendar"
        description="Manage academic years, terms, and the official school academic calendar."
      />

      {message && <p className="ok">{message}</p>}
      {error && <p className="error">{error}</p>}

      {/* Navigation Tabs */}
      <div className="tab-bar">
        <button
          type="button"
          className={`tab-btn${activeTab === "calendar" ? " active" : ""}`}
          onClick={() => setActiveTab("calendar")}
        >
          Academic Calendar
        </button>
        <button
          type="button"
          className={`tab-btn${activeTab === "years-terms" ? " active" : ""}`}
          onClick={() => setActiveTab("years-terms")}
        >
          Academic Years & Terms
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: ACADEMIC CALENDAR                                                 */}
      {/* ========================================================================= */}
      {activeTab === "calendar" && (
        <div>
          {/* Academic Year Selection Bar & Add Event CTA */}
          <div className="card" style={{ padding: "14px 18px", margin: "0 0 16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                <label style={{ margin: 0, fontWeight: 700 }}>Academic Year:</label>
                <select
                  value={calendarYearId}
                  onChange={(e) => {
                    setCalendarYearId(e.target.value);
                    setEventForm((prev) => ({ ...prev, academicYearId: e.target.value }));
                  }}
                  style={{ width: "200px" }}
                >
                  {years.map((y) => (
                    <option key={y.id} value={y.id}>
                      {y.name} {y.currentYear ? "(Current)" : ""} {y.status === "ARCHIVED" ? "[Archived]" : ""}
                    </option>
                  ))}
                </select>

                {activeAcademicYear && (
                  <span className="muted" style={{ fontSize: "13px" }}>
                    Duration: <strong>{activeAcademicYear.startDate}</strong> to <strong>{activeAcademicYear.endDate}</strong>
                    {" "}&middot; Status: <StatusBadge value={activeAcademicYear.status} />
                  </span>
                )}
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  onClick={() => openAddEvent()}
                  disabled={!activeAcademicYear || activeAcademicYear.status === "ARCHIVED"}
                >
                  + Add Event
                </button>
              </div>
            </div>
          </div>

          {/* Event Add/Edit Form */}
          {showEventForm && (
            <form className="card form-card" onSubmit={saveEvent} style={{ border: "2px solid var(--accent)" }}>
              <h3>{editingEventId ? "Edit calendar event" : "Add calendar event"}</h3>
              
              <div>
                <label>Academic Year *</label>
                <select
                  required
                  value={eventForm.academicYearId}
                  onChange={(e) => setEventForm({ ...eventForm, academicYearId: e.target.value })}
                  disabled={Boolean(editingEventId)}
                >
                  {years.filter((y) => y.status !== "ARCHIVED").map((y) => (
                    <option key={y.id} value={y.id}>{y.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label>Event Type / Category *</label>
                <select
                  required
                  value={eventForm.eventType}
                  onChange={(e) => setEventForm({ ...eventForm, eventType: e.target.value })}
                >
                  {EVENT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div className="field-span">
                <label>Event Title *</label>
                <input
                  required
                  placeholder="e.g. Independence Day, Annual Sports Meet, Mid-Term Exam"
                  value={eventForm.title}
                  onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                />
              </div>

              <div>
                <label>Start Date *</label>
                <input
                  required
                  type="date"
                  min={activeAcademicYear?.startDate}
                  max={activeAcademicYear?.endDate}
                  value={eventForm.startDate}
                  onChange={(e) => {
                    const newStart = e.target.value;
                    setEventForm({
                      ...eventForm,
                      startDate: newStart,
                      endDate: eventForm.endDate && eventForm.endDate < newStart ? newStart : eventForm.endDate
                    });
                  }}
                />
              </div>

              <div>
                <label>End Date (Optional for single-day event)</label>
                <input
                  type="date"
                  min={eventForm.startDate || activeAcademicYear?.startDate}
                  max={activeAcademicYear?.endDate}
                  value={eventForm.endDate}
                  onChange={(e) => setEventForm({ ...eventForm, endDate: e.target.value })}
                />
              </div>

              <div>
                <label>Status</label>
                <select
                  value={eventForm.status}
                  onChange={(e) => setEventForm({ ...eventForm, status: e.target.value })}
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>

              <div className="field-span">
                <label>Description / Notes (Optional)</label>
                <textarea
                  rows="2"
                  placeholder="Additional details, schedule notes, guidelines..."
                  value={eventForm.description}
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                />
              </div>

              <div className="row">
                <button>{editingEventId ? "Update Event" : "Create Event"}</button>
                <button type="button" className="secondary" onClick={cancelEventEdit}>Cancel</button>
              </div>
            </form>
          )}

          {/* Event Details Preview Modal / Box */}
          {selectedEvent && (
            <div className="card" style={{ borderLeft: "4px solid var(--accent)", background: "#fcfdfe" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    {getEventTypeBadge(selectedEvent.eventType)}
                    <StatusBadge value={selectedEvent.status} />
                  </div>
                  <h3 style={{ margin: "4px 0" }}>{selectedEvent.title}</h3>
                  <p style={{ margin: "4px 0", fontSize: "14px" }}>
                    <strong>Date:</strong> {selectedEvent.startDate}
                    {selectedEvent.endDate && selectedEvent.endDate !== selectedEvent.startDate ? ` to ${selectedEvent.endDate}` : " (Single Day)"}
                  </p>
                  {selectedEvent.description && (
                    <p style={{ margin: "6px 0 0", color: "#4a5d68", fontSize: "13px" }}>
                      {selectedEvent.description}
                    </p>
                  )}
                </div>
                <div style={{ display: "flex", gap: "6px" }}>
                  <button type="button" className="secondary" onClick={() => editEvent(selectedEvent)}>Edit</button>
                  <button type="button" onClick={() => updateEventStatus(selectedEvent)}>
                    {selectedEvent.status === "ACTIVE" ? "Deactivate" : "Activate"}
                  </button>
                  <button type="button" className="danger" onClick={() => removeEvent(selectedEvent.id)}>Delete</button>
                  <button type="button" className="secondary" onClick={() => setSelectedEvent(null)}>Close</button>
                </div>
              </div>
            </div>
          )}

          {/* Filter and View Controls */}
          <div className="calendar-controls">
            {calendarView === "month" ? (
              <div className="calendar-nav">
                <button type="button" className="secondary" onClick={prevMonth}>&larr; Prev</button>
                <h3>{yearMonthString}</h3>
                <button type="button" className="secondary" onClick={nextMonth}>Next &rarr;</button>
                <button type="button" className="secondary" onClick={goToToday}>Today</button>
              </div>
            ) : (
              <div>
                <input
                  type="text"
                  placeholder="Search events by title/notes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ width: "260px" }}
                />
              </div>
            )}

            <div className="calendar-filters">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                style={{ width: "170px" }}
              >
                <option value="">All Event Types</option>
                {EVENT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ width: "130px" }}
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>

              <div style={{ display: "inline-flex", borderRadius: "8px", overflow: "hidden", border: "1px solid var(--line)" }}>
                <button
                  type="button"
                  onClick={() => setCalendarView("month")}
                  style={{
                    borderRadius: 0,
                    padding: "8px 12px",
                    background: calendarView === "month" ? "var(--accent)" : "#fff",
                    color: calendarView === "month" ? "#fff" : "var(--text)"
                  }}
                >
                  Calendar Grid
                </button>
                <button
                  type="button"
                  onClick={() => setCalendarView("list")}
                  style={{
                    borderRadius: 0,
                    padding: "8px 12px",
                    background: calendarView === "list" ? "var(--accent)" : "#fff",
                    color: calendarView === "list" ? "#fff" : "var(--text)"
                  }}
                >
                  List View ({filteredEvents.length})
                </button>
              </div>
            </div>
          </div>

          {/* Month Grid View */}
          {calendarView === "month" && (
            <div>
              <div className="calendar-grid">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((dayName) => (
                  <div key={dayName} className="calendar-header-day">{dayName}</div>
                ))}

                {calendarDays.map((cell, idx) => {
                  let cellClasses = "calendar-day-cell";
                  if (!cell.isCurrentMonth) cellClasses += " other-month";
                  if (cell.isToday) cellClasses += " today";
                  if (!cell.isInsideYear) cellClasses += " outside-year";

                  return (
                    <div
                      key={idx}
                      className={cellClasses}
                      onClick={() => {
                        if (cell.isInsideYear && activeAcademicYear?.status !== "ARCHIVED") {
                          openAddEvent(cell.dateStr);
                        }
                      }}
                      title={cell.isInsideYear ? `Click to add event on ${cell.dateStr}` : "Outside academic year"}
                    >
                      <div className="calendar-day-header-bar">
                        <span className="calendar-day-number">{cell.dayNum}</span>
                        {cell.events.length > 0 && (
                          <span className="muted" style={{ fontSize: "10px", fontWeight: 700 }}>
                            {cell.events.length}
                          </span>
                        )}
                      </div>
                      <div className="calendar-day-events" onClick={(e) => e.stopPropagation()}>
                        {cell.events.slice(0, 3).map((evt) => {
                          const typeObj = EVENT_TYPES.find((t) => t.value === evt.eventType);
                          const cls = typeObj ? typeObj.colorClass : "other";
                          return (
                            <div
                              key={evt.id}
                              className={`calendar-event-item event-${cls}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedEvent(evt);
                              }}
                              title={`${evt.title} (${getEventTypeLabel(evt.eventType)}) - ${evt.status}`}
                              style={{ opacity: evt.status === "INACTIVE" ? 0.6 : 1 }}
                            >
                              {evt.title}
                            </div>
                          );
                        })}
                        {cell.events.length > 3 && (
                          <div
                            style={{ fontSize: "10px", color: "var(--accent)", fontWeight: 700, padding: "0 2px" }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setCalendarView("list");
                            }}
                          >
                            +{cell.events.length - 3} more...
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Event Type Legend */}
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center", marginTop: "12px", padding: "10px 14px", background: "#fff", borderRadius: "10px", border: "1px solid var(--line)" }}>
                <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--muted)" }}>LEGEND:</span>
                {EVENT_TYPES.map((t) => (
                  <span key={t.value} className={`event-badge event-${t.colorClass}`}>
                    {t.label}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* List / Table View */}
          {calendarView === "list" && (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Event Title</th>
                    <th>Type</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Status</th>
                    <th>Description</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEvents.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="muted" style={{ textAlign: "center", padding: "24px" }}>
                        No events found for the selected filters.
                      </td>
                    </tr>
                  ) : (
                    filteredEvents.map((evt) => (
                      <tr key={evt.id}>
                        <td>
                          <button
                            type="button"
                            className="linkish"
                            onClick={() => setSelectedEvent(evt)}
                          >
                            <strong>{evt.title}</strong>
                          </button>
                        </td>
                        <td>{getEventTypeBadge(evt.eventType)}</td>
                        <td>{evt.startDate}</td>
                        <td>{evt.endDate && evt.endDate !== evt.startDate ? evt.endDate : <span className="muted">Single day</span>}</td>
                        <td><StatusBadge value={evt.status} /></td>
                        <td style={{ maxWidth: "240px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {evt.description || <span className="muted">&mdash;</span>}
                        </td>
                        <td>
                          <button type="button" className="secondary" onClick={() => editEvent(evt)}>Edit</button>{" "}
                          <button type="button" onClick={() => updateEventStatus(evt)}>
                            {evt.status === "ACTIVE" ? "Deactivate" : "Activate"}
                          </button>{" "}
                          <button type="button" className="danger" onClick={() => removeEvent(evt.id)}>Delete</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ACADEMIC YEARS & TERMS                                            */}
      {/* ========================================================================= */}
      {activeTab === "years-terms" && (
        <div>
          <div className="page-actions">
            <button type="button" onClick={() => { setEditingYearId(null); setYear(emptyYear); setShowYearForm(true); }}>Add Academic Year</button>
            <button type="button" className="secondary" onClick={() => { setEditingTermId(null); setTerm({ ...emptyTerm, academicYearId: calendarYearId }); setShowTermForm(true); }}>Add Term</button>
          </div>
          <ActionModal open={showYearForm} title={editingYearId ? "Edit academic year" : "Create academic year"} onClose={cancelYearEdit}>
            <form className="card form-card" onSubmit={saveYear}>
              <input required placeholder="2026-2027" value={year.name} onChange={(e) => setYear({ ...year, name: e.target.value })} />
              <input required type="date" value={year.startDate} onChange={(e) => setYear({ ...year, startDate: e.target.value })} />
              <input required type="date" value={year.endDate} onChange={(e) => setYear({ ...year, endDate: e.target.value })} />
              <label>Academic year status</label>
              <select value={year.status} onChange={(e) => setYear({ ...year, status: e.target.value })}>
                <option value="RUNNING">Running</option><option value="END">End</option>
              </select>
              <div className="row">
                <button>{editingYearId ? "Update year" : "Create year"}</button>
                <button type="button" className="secondary" onClick={cancelYearEdit}>Cancel</button>
              </div>
            </form>
          </ActionModal>

          <h3>Academic Year List</h3>
          <table>
            <thead><tr><th>Academic Year</th><th>Start</th><th>End</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {years.map((item) => (
                <tr key={item.id}>
                  <td><button type="button" className="linkish" onClick={() => setSelectedYear(item)}>{item.name}</button></td>
                  <td>{item.startDate}</td><td>{item.endDate}</td><td>{yearDisplayStatus(item)}</td>
                  <td>
                    <button type="button" className="secondary" onClick={() => editYear(item)}>Edit</button>{" "}
                    {!item.currentYear && item.status === "ACTIVE" && <button type="button" onClick={() => setCurrent(item.id)}>Set current</button>}{" "}
                    <button type="button" onClick={() => updateYearStatus(item)}>
                      {item.status === "ARCHIVED" ? "Activate" : "Archive"}
                    </button>{" "}
                    <button
                      type="button"
                      className="secondary"
                      onClick={() => {
                        setCalendarYearId(String(item.id));
                        setActiveTab("calendar");
                      }}
                    >
                      View Calendar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {selectedYear && (
            <div className="card">
              <h3>{selectedYear.name}</h3>
              <p>{selectedYear.startDate} to {selectedYear.endDate}</p>
              <p>Status: {selectedYear.status} &middot; Current: {selectedYear.currentYear ? "Yes" : "No"}</p>
              <div className="row">
                <button
                  type="button"
                  onClick={() => {
                    setCalendarYearId(String(selectedYear.id));
                    setActiveTab("calendar");
                  }}
                >
                  View Year's Calendar
                </button>
                <button type="button" className="secondary" onClick={() => setSelectedYear(null)}>Close</button>
              </div>
            </div>
          )}

          <ActionModal open={showTermForm} title={editingTermId ? "Edit term" : "Create term"} onClose={cancelTermEdit}>
            <form className="card form-card" onSubmit={saveTerm}>
              <select required value={term.academicYearId} onChange={(e) => setTerm({ ...term, academicYearId: e.target.value })}>
                <option value="">Select year</option>
                {years.filter((item) => item.status !== "ARCHIVED").map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
              <input required placeholder="Term 1" value={term.name} onChange={(e) => setTerm({ ...term, name: e.target.value })} />
              <input required type="date" value={term.startDate} onChange={(e) => setTerm({ ...term, startDate: e.target.value })} />
              <input required type="date" value={term.endDate} onChange={(e) => setTerm({ ...term, endDate: e.target.value })} />
              <select value={term.status} onChange={(e) => setTerm({ ...term, status: e.target.value })}>
                <option>ACTIVE</option><option>INACTIVE</option>
              </select>
              <div className="row">
                <button>{editingTermId ? "Update term" : "Create term"}</button>
                <button type="button" className="secondary" onClick={cancelTermEdit}>Cancel</button>
              </div>
            </form>
          </ActionModal>

          <h3>Terms by Academic Year</h3>
          {years.map((yearItem) => {
            const yearTerms = terms.filter((item) => item.academicYearId === yearItem.id);
            return (
              <div className="card" key={yearItem.id}>
                <h3>{yearItem.name} <span className="muted">({yearDisplayStatus(yearItem)})</span></h3>
                <table>
                  <thead><tr><th>Term</th><th>Start</th><th>End</th><th>Status</th><th>Actions</th></tr></thead>
                  <tbody>
                    {yearTerms.length === 0 && <tr><td colSpan="5" className="muted">No terms added</td></tr>}
                    {yearTerms.map((item) => (
                      <tr key={item.id}>
                        <td><button type="button" className="linkish" onClick={() => setSelectedTerm(item)}>{item.name}</button></td>
                        <td>{item.startDate}</td><td>{item.endDate}</td><td><StatusBadge value={item.status === "ACTIVE" ? "RUNNING" : "END"} /></td>
                        <td>
                          <button type="button" className="secondary" onClick={() => editTerm(item)}>Edit</button>{" "}
                          <button type="button" onClick={() => updateTermStatus(item)}>{item.status === "ACTIVE" ? "Deactivate" : "Activate"}</button>{" "}
                          <button type="button" className="danger" onClick={() => removeTerm(item.id)}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
          {selectedTerm && (
            <div className="card">
              <h3>{selectedTerm.name}</h3>
              <p>Academic year: {years.find((item) => item.id === selectedTerm.academicYearId)?.name || `#${selectedTerm.academicYearId}`}</p>
              <p>{selectedTerm.startDate} to {selectedTerm.endDate} &middot; Status: {selectedTerm.status}</p>
              <button type="button" className="secondary" onClick={() => setSelectedTerm(null)}>Close</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
