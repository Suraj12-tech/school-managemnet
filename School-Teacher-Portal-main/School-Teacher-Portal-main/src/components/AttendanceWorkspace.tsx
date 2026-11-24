import { useState, useEffect } from 'react';
import { getClasses, getAttendanceHistory, getAttendanceCorrections, saveAttendanceCorrection, type ClassInfo } from '../services/mockData';
import { Calendar, Clock, Edit3, AlertCircle, BarChart2 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LoadingState } from './ui/LoadingState';
import { ErrorState } from './ui/ErrorState';
import { EmptyState } from './ui/EmptyState';
import { useNotification } from '../contexts/NotificationContext';

export function AttendanceWorkspace() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialTab = (searchParams.get('tab') as 'entry' | 'history' | 'correction' | 'correctionHistory') || 'entry';
  const [activeTab, setActiveTab] = useState<'entry' | 'history' | 'correction' | 'correctionHistory'>(initialTab);
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [corrections, setCorrections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  // History filters
  const [historyDate, setHistoryDate] = useState('');
  const [historyPeriod, setHistoryPeriod] = useState('');
  const [historyClass, setHistoryClass] = useState('');
  const [historyView, setHistoryView] = useState<'all' | 'absent' | 'late' | 'monthly'>('all');

  // Correction Form
  const [corrClass, setCorrClass] = useState('');
  const [corrDate, setCorrDate] = useState('');
  const [corrStudent, setCorrStudent] = useState('');
  const [corrOriginal, setCorrOriginal] = useState('Absent');
  const [corrRequested, setCorrRequested] = useState('Present');
  const [corrReason, setCorrReason] = useState('');

  useEffect(() => {
    Promise.all([
      getClasses(),
      getAttendanceHistory(),
      getAttendanceCorrections()
    ]).then(([cls, hist, corrs]) => {
      setClasses(cls);
      setHistory(hist);
      setCorrections(corrs);
      setLoading(false);
    }).catch(() => {
      setError(true);
      setLoading(false);
    });
  }, []);

  const handleCorrectionSubmit = async () => {
    if (!corrClass || !corrDate || !corrStudent || !corrReason) {
      showNotification('Please fill in all fields', 'error');
      return;
    }
    await saveAttendanceCorrection({
      classId: corrClass,
      date: corrDate,
      studentId: corrStudent,
      originalStatus: corrOriginal,
      requestedStatus: corrRequested,
      reason: corrReason,
      requestedBy: 'Current Teacher',
      requestedTime: new Date().toISOString(),
      approvalStatus: 'Pending'
    });
    showNotification('Correction requested successfully', 'success');
    const newCorrs = await getAttendanceCorrections();
    setCorrections(newCorrs);
    setActiveTab('correctionHistory');
  };

  const filteredHistory = history.filter(h => {
    if (historyDate && h.date.split('T')[0] !== historyDate && h.date !== historyDate) return false;
    if (historyPeriod && h.period !== historyPeriod) return false;
    if (historyClass && h.classId !== historyClass) return false;
    return true;
  });

  const renderHistoryRecords = () => {
    if (historyView === 'monthly') {
      return (
        <div className="card">
          <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><BarChart2 size={18}/> Monthly Statistics</h3>
          <p>Total Sessions: {filteredHistory.length}</p>
          <p>Average Attendance: {
            filteredHistory.length > 0 
              ? Math.round(filteredHistory.reduce((acc, h) => acc + (h.records?.filter((r:any)=>r.status==='Present').length || 0) / (h.records?.length || 1), 0) / filteredHistory.length * 100) 
              : 0
          }%</p>
        </div>
      );
    }

    return filteredHistory.map(record => {
      const cls = classes.find(c => c.id === record.classId);
      const recordsToView = record.records?.filter((r: any) => {
        if (historyView === 'absent') return r.status === 'Absent';
        if (historyView === 'late') return r.status === 'Late';
        return true;
      }) || [];

      if (recordsToView.length === 0 && historyView !== 'all') return null;

      const presentCount = record.records?.filter((r: any) => r.status === 'Present').length || 0;
      const totalCount = record.records?.length || 0;

      return (
        <div key={record.id} className="card" style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
            <div>
              <strong>{cls ? `${cls.name} - ${cls.section}` : record.classId}</strong>
              <span style={{ color: 'var(--text-secondary)', marginLeft: '1rem' }}>{new Date(record.date).toLocaleDateString()} {record.period && `(${record.period})`}</span>
            </div>
            <div>
              <span style={{ color: 'var(--success)', fontWeight: 500 }}>{presentCount} / {totalCount} Present</span>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.5rem' }}>
            {recordsToView.map((r: any, idx: number) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', backgroundColor: 'var(--bg-color)', borderRadius: 'var(--radius-sm)' }}>
                <span>{r.studentId}</span>
                <span className={r.status === 'Present' ? 'text-success' : r.status === 'Absent' ? 'text-danger' : 'text-warning'}>{r.status}</span>
              </div>
            ))}
          </div>
        </div>
      );
    });
  };

  if (loading) return <LoadingState message="Loading attendance workspace..." />;
  if (error) return <ErrorState message="Could not load attendance data." action={<button className="btn btn-primary" onClick={() => window.location.reload()}>Try Again</button>} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Attendance Workspace</h1>
        <p>Manage daily attendance, view past records, and request corrections.</p>
      </div>

      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
        <button className={`btn ${activeTab === 'entry' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('entry')}>
          <Calendar size={18} /> Take Attendance
        </button>
        <button className={`btn ${activeTab === 'history' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('history')}>
          <Clock size={18} /> History & Stats
        </button>
        <button className={`btn ${activeTab === 'correction' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('correction')}>
          <Edit3 size={18} /> Request Correction
        </button>
        <button className={`btn ${activeTab === 'correctionHistory' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('correctionHistory')}>
          <AlertCircle size={18} /> Correction Status
        </button>
      </div>

      {activeTab === 'entry' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <h2 style={{ fontSize: '1.5rem' }}>Select a Class to Take Attendance</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
            {classes.map(c => (
              <div key={c.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem' }}>{c.name} - Section {c.section}</h3>
                  <div style={{ color: 'var(--text-secondary)' }}>{c.studentsCount} Students</div>
                </div>
                <button className="btn btn-primary" onClick={() => navigate(`/app/classes/${c.id}`)}>
                  Select & Mark
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Class</label>
              <select className="input-field" value={historyClass} onChange={e => setHistoryClass(e.target.value)}>
                <option value="">All Classes</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name} - {c.section}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Date</label>
              <input type="date" className="input-field" value={historyDate} onChange={e => setHistoryDate(e.target.value)} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Period</label>
              <select className="input-field" value={historyPeriod} onChange={e => setHistoryPeriod(e.target.value)}>
                <option value="">All Periods</option>
                <option value="Morning">Morning</option>
                <option value="Period 1">Period 1</option>
                <option value="Period 2">Period 2</option>
                <option value="Afternoon">Afternoon</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem' }}>View Mode</label>
              <select className="input-field" value={historyView} onChange={e => setHistoryView(e.target.value as any)}>
                <option value="all">Full List</option>
                <option value="absent">Absentees Only</option>
                <option value="late">Late Students</option>
                <option value="monthly">Monthly Stats</option>
              </select>
            </div>
          </div>
          <div>
            {filteredHistory.length === 0 ? (
              <EmptyState 
                icon={<Calendar size={48} />}
                title="No Records Found"
                description="There are no attendance records matching your current filters."
              />
            ) : (
              renderHistoryRecords()
            )}
          </div>
        </div>
      )}

      {activeTab === 'correction' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <h2 style={{ fontSize: '1.5rem' }}>Request Attendance Correction</h2>
          <div className="card" style={{ maxWidth: '600px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Select Class</label>
                <select className="input-field" style={{ width: '100%' }} value={corrClass} onChange={e => setCorrClass(e.target.value)}>
                  <option value="">Select a class...</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name} - {c.section}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Date of Attendance</label>
                <input type="date" className="input-field" style={{ width: '100%' }} value={corrDate} onChange={e => setCorrDate(e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Student ID (Roll No)</label>
                <input type="text" className="input-field" style={{ width: '100%' }} value={corrStudent} onChange={e => setCorrStudent(e.target.value)} placeholder="e.g. 22-01" />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Original Status</label>
                  <select className="input-field" style={{ width: '100%' }} value={corrOriginal} onChange={e => setCorrOriginal(e.target.value)}>
                    <option value="Present">Present</option>
                    <option value="Absent">Absent</option>
                    <option value="Late">Late</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Requested Status</label>
                  <select className="input-field" style={{ width: '100%' }} value={corrRequested} onChange={e => setCorrRequested(e.target.value)}>
                    <option value="Present">Present</option>
                    <option value="Absent">Absent</option>
                    <option value="Late">Late</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Reason for Correction</label>
                <textarea className="input-field" rows={4} style={{ width: '100%' }} value={corrReason} onChange={e => setCorrReason(e.target.value)} placeholder="Explain why the attendance record needs to be corrected..."></textarea>
              </div>
              <button className="btn btn-primary" onClick={handleCorrectionSubmit}>
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'correctionHistory' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <h2 style={{ fontSize: '1.5rem' }}>Correction Request History</h2>
          <div className="table-responsive" style={{ backgroundColor: 'var(--bg-color)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--secondary-color)', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '1rem' }}>Date</th>
                  <th style={{ padding: '1rem' }}>Class</th>
                  <th style={{ padding: '1rem' }}>Student</th>
                  <th style={{ padding: '1rem' }}>Change</th>
                  <th style={{ padding: '1rem' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {corrections.map(c => {
                  const cls = classes.find(cl => cl.id === c.classId);
                  return (
                    <tr key={c.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '1rem' }}>{new Date(c.requestedTime).toLocaleDateString()}</td>
                      <td style={{ padding: '1rem' }}>{cls ? cls.name : c.classId}</td>
                      <td style={{ padding: '1rem' }}>{c.studentId}</td>
                      <td style={{ padding: '1rem' }}>{c.originalStatus} → {c.requestedStatus}</td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{ 
                          color: c.approvalStatus === 'Approved' ? 'var(--success)' : c.approvalStatus === 'Rejected' ? 'var(--danger)' : 'var(--warning)',
                          backgroundColor: 'rgba(0,0,0,0.05)', padding: '0.2rem 0.5rem', borderRadius: '12px', fontSize: '0.85rem'
                        }}>
                          {c.approvalStatus}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {corrections.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                      No correction requests found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
