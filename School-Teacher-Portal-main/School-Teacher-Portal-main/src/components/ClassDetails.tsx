import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getClass, getStudents, saveAttendance, getClassSubjects, type ClassInfo, type Student, type ClassSubject } from '../services/mockData';
import { useAuth } from '../contexts/AuthContext';
import { 
  Users, ArrowLeft, Calendar, LayoutDashboard, ClipboardList, BookOpen, 
  FileText, CheckCircle, TrendingUp, MessageSquare, Plus, Edit3, UserCheck, UserX, Activity,
  Search, ArrowUpRight, ArrowRight, ArrowDownRight 
} from 'lucide-react';
import { Modal } from './Modal';
import { LoadingState } from './ui/LoadingState';
import { ErrorState } from './ui/ErrorState';
import { useNotification } from '../contexts/NotificationContext';

type Tab = 'overview' | 'students' | 'attendance' | 'subjects' | 'assignments' | 'exams' | 'performance' | 'remarks';

export function ClassDetails() {
  const { classId } = useParams();
  const navigate = useNavigate();
  const { currentTeacher } = useAuth();
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<ClassSubject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const { showNotification } = useNotification();
  
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  
  // Student List Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [attendanceFilter, setAttendanceFilter] = useState('All');
  const [performanceFilter, setPerformanceFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);

  useEffect(() => {
    if (!classId) return;
    Promise.all([
      getClass(classId),
      getStudents(classId),
      getClassSubjects(classId)
    ]).then(([cls, stus, subjs]) => {
      setClassInfo(cls);
      setStudents(stus);
      
      // Access Control: Filter subjects if they are only a Subject Teacher
      if (cls && !cls.isClassTeacher && currentTeacher) {
        setSubjects(subjs.filter(s => currentTeacher.subjects.includes(s.subjectName)));
      } else {
        setSubjects(subjs);
      }
      
      setLoading(false);
    }).catch(() => {
      setError(true);
      setLoading(false);
    });
  }, [classId, currentTeacher]);

  const filteredStudents = students.filter(s => {
    if (searchQuery && !s.name.toLowerCase().includes(searchQuery.toLowerCase()) && !s.rollNumber.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    
    if (attendanceFilter !== 'All') {
      if (attendanceFilter === '< 80%' && s.attendancePct! >= 80) return false;
      if (attendanceFilter === '80% - 90%' && (s.attendancePct! < 80 || s.attendancePct! > 90)) return false;
      if (attendanceFilter === '> 90%' && s.attendancePct! <= 90) return false;
    }
    
    if (performanceFilter !== 'All' && s.recentPerformance !== performanceFilter) return false;
    if (statusFilter !== 'All' && s.status !== statusFilter) return false;
    
    return true;
  });

  const [attendance, setAttendance] = useState<Record<string, string>>({});
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendancePeriod, setAttendancePeriod] = useState('Morning');
  const [attendanceStep, setAttendanceStep] = useState<'mark' | 'review'>('mark');

  const openAttendance = () => {
    const initialAtt: Record<string, string> = {};
    students.forEach(s => initialAtt[s.id] = 'Present');
    setAttendance(initialAtt);
    setAttendanceStep('mark');
    setIsAttendanceModalOpen(true);
  };

  const handleStatusChange = (studentId: string, status: string) => {
    setAttendance(prev => ({ ...prev, [studentId]: status }));
  };

  const handleSaveAttendance = async () => {
    if (!classInfo) return;
    try {
      const records = students.map(s => ({ studentId: s.id, status: attendance[s.id] }));
      await saveAttendance(classInfo.id, records, attendancePeriod, attendanceDate);
      showNotification('Attendance saved successfully!', 'success');
      setIsAttendanceModalOpen(false);
      navigate('/app/attendance');
    } catch (err: any) {
      showNotification(err.message || 'Failed to save attendance.', 'error');
    }
  };

  if (loading) return <LoadingState message="Loading class workspace..." />;
  if (error || !classInfo) return <ErrorState message="Could not load class details." action={<button className="btn btn-secondary" onClick={() => navigate('/app/classes')}>Go Back</button>} />;

  const isClassTeacher = currentTeacher?.classesTaught?.includes(classInfo.name);
  const isSubjectTeacher = subjects.some(s => currentTeacher?.subjects.includes(s.subjectName));
  const isAuthorized = isClassTeacher || isSubjectTeacher;
  
  if (!isAuthorized) {
    return <ErrorState message="You are not authorized to view this class workspace." action={<button className="btn btn-secondary" onClick={() => navigate('/app/classes')}>Go Back</button>} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <button className="btn btn-secondary" onClick={() => navigate('/app/classes')} style={{ alignSelf: 'flex-start', border: 'none', padding: 0 }}>
        <ArrowLeft size={20} /> Back to My Classes
      </button>

      {/* Header Dashboard */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>{classInfo.name} - Section {classInfo.section}</h1>
            <div style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Class Teacher: <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{classInfo.teacherName}</span></div>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="btn btn-secondary" onClick={() => navigate('/app/assignments')}>
              <Plus size={18} /> Create Assignment
            </button>
            <button className="btn btn-primary" onClick={openAttendance}>
              <Calendar size={18} /> Take Attendance
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Total Students</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{classInfo.studentsCount}</div>
          </div>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Today's Attendance</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--success)' }}>{classInfo.todayAttendance}</div>
          </div>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Overall Attendance</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{classInfo.overallAttendance}</div>
          </div>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Pending Assignments</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--warning)' }}>{classInfo.pendingAssignments}</div>
          </div>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Upcoming Exams</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{classInfo.upcomingExams}</div>
          </div>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Academic Year</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{classInfo.academicYear}</div>
          </div>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Current Term</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{classInfo.currentTerm}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
        {[
          { id: 'overview', label: 'Overview', icon: LayoutDashboard },
          { id: 'students', label: 'Students', icon: Users },
          { id: 'attendance', label: 'Attendance', icon: ClipboardList },
          { id: 'subjects', label: 'Subjects', icon: BookOpen },
          { id: 'assignments', label: 'Assignments', icon: FileText },
          { id: 'exams', label: 'Exams & Marks', icon: CheckCircle },
          { id: 'performance', label: 'Performance', icon: TrendingUp },
          { id: 'remarks', label: 'Remarks', icon: MessageSquare }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as Tab)}
            className={`btn ${activeTab === tab.id ? 'btn-primary' : 'btn-secondary'}`}
            style={{ whiteSpace: 'nowrap', border: activeTab === tab.id ? undefined : 'none' }}
          >
            <tab.icon size={18} /> {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ minHeight: '400px' }}>
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
              
              <div className="card">
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                  <UserCheck size={20} /> Daily Attendance Snapshot
                </h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--success)' }}>{classInfo.todayAttendance}</div>
                    <div style={{ color: 'var(--text-secondary)' }}>Present Today</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--danger)' }}>2</div>
                    <div style={{ color: 'var(--text-secondary)' }}>Absent Today</div>
                  </div>
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <TrendingUp size={16} color="var(--success)" /> +1.2% from last week's average
                </div>
              </div>

              <div className="card">
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                  <FileText size={20} /> Recent Assignments
                </h3>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <li style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Algebra Worksheet</span>
                    <span style={{ color: 'var(--success)', fontWeight: 500 }}>28/32 Submitted</span>
                  </li>
                  <li style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Geometry Proofs</span>
                    <span style={{ color: 'var(--warning)', fontWeight: 500 }}>15/32 Submitted</span>
                  </li>
                </ul>
                <div>
                  <button className="btn btn-secondary text-sm" style={{ marginTop: '1rem', padding: '0.4rem 0.8rem' }} onClick={() => navigate('/app/assignments')}>View All Assignments</button>
                </div>
              </div>

              <div className="card">
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                  <Activity size={20} /> Class Performance Trend
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100px', backgroundColor: 'var(--bg-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)' }}>
                  Chart: Term 1 Average (82%)
                </div>
                <div style={{ marginTop: '1rem', fontSize: '0.9rem' }}>
                  Top Subject: <strong>Physics (88%)</strong> <br/>
                  Needs Attention: <strong>History (74%)</strong>
                </div>
              </div>

              <div className="card">
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                  <UserX size={20} /> Students Requiring Attention
                </h3>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <li style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{students[2]?.name || 'Student A'}</span>
                    <span style={{ color: 'var(--danger)', fontSize: '0.85rem', padding: '0.1rem 0.4rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '12px' }}>Low Attendance (75%)</span>
                  </li>
                  <li style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{students[5]?.name || 'Student B'}</span>
                    <span style={{ color: 'var(--warning)', fontSize: '0.85rem', padding: '0.1rem 0.4rem', backgroundColor: 'rgba(245, 158, 11, 0.1)', borderRadius: '12px' }}>Missing 2 Assignments</span>
                  </li>
                </ul>
              </div>

            </div>
          </div>
        )}

        {activeTab === 'students' && (
          <div>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: '1 1 250px' }}>
                <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input 
                  type="text" 
                  placeholder="Search by name or roll number..." 
                  className="input-field w-full" 
                  style={{ paddingLeft: '2.5rem' }} 
                  value={searchQuery} 
                  onChange={e => setSearchQuery(e.target.value)} 
                />
              </div>
              <select className="input-field" value={attendanceFilter} onChange={e => setAttendanceFilter(e.target.value)}>
                <option value="All">All Attendance</option>
                <option value="> 90%">{'>'} 90%</option>
                <option value="80% - 90%">80% - 90%</option>
                <option value="< 80%">&lt; 80%</option>
              </select>
              <select className="input-field" value={performanceFilter} onChange={e => setPerformanceFilter(e.target.value)}>
                <option value="All">All Performance</option>
                <option value="Up">Trending Up</option>
                <option value="Stable">Stable</option>
                <option value="Down">Trending Down</option>
              </select>
              <select className="input-field" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="All">All Statuses</option>
                <option value="Excellent">Excellent</option>
                <option value="Good">Good</option>
                <option value="Needs Attention">Needs Attention</option>
                <option value="Critical">Critical</option>
              </select>
            </div>

            <div className="table-responsive" style={{ backgroundColor: 'var(--bg-color)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--secondary-color)', borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ padding: '1rem' }}>Roll Number</th>
                    <th style={{ padding: '1rem' }}>Name</th>
                    <th style={{ padding: '1rem' }}>Attendance</th>
                    <th style={{ padding: '1rem' }}>Academic Avg</th>
                    <th style={{ padding: '1rem' }}>Pending Work</th>
                    <th style={{ padding: '1rem' }}>Trend</th>
                    <th style={{ padding: '1rem' }}>Status</th>
                    <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map(s => {
                    const getTrendIcon = () => {
                      if (s.recentPerformance === 'Up') return <ArrowUpRight size={16} color="var(--success)" />;
                      if (s.recentPerformance === 'Down') return <ArrowDownRight size={16} color="var(--danger)" />;
                      return <ArrowRight size={16} color="var(--text-secondary)" />;
                    };
                    
                    const getStatusBadge = () => {
                      if (s.status === 'Excellent') return <span style={{ color: 'var(--success)', padding: '0.2rem 0.5rem', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', fontSize: '0.85rem' }}>{s.status}</span>;
                      if (s.status === 'Good') return <span style={{ color: 'var(--text-primary)', padding: '0.2rem 0.5rem', backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: '12px', fontSize: '0.85rem' }}>{s.status}</span>;
                      if (s.status === 'Needs Attention') return <span style={{ color: 'var(--warning)', padding: '0.2rem 0.5rem', backgroundColor: 'rgba(245, 158, 11, 0.1)', borderRadius: '12px', fontSize: '0.85rem' }}>{s.status}</span>;
                      return <span style={{ color: 'var(--danger)', padding: '0.2rem 0.5rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '12px', fontSize: '0.85rem' }}>{s.status}</span>;
                    };

                    return (
                      <tr key={s.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{s.rollNumber}</td>
                        <td style={{ padding: '1rem', fontWeight: 500 }}>{s.name}</td>
                        <td style={{ padding: '1rem' }}>
                          <span style={{ color: (s.attendancePct || 0) < 80 ? 'var(--danger)' : 'inherit' }}>
                            {s.attendancePct}%
                          </span>
                        </td>
                        <td style={{ padding: '1rem', fontWeight: 600 }}>{s.academicAverage}%</td>
                        <td style={{ padding: '1rem' }}>
                          {s.pendingAssignments! > 0 ? (
                            <span style={{ color: 'var(--warning)' }}>{s.pendingAssignments} missing</span>
                          ) : (
                            <span style={{ color: 'var(--text-secondary)' }}>None</span>
                          )}
                        </td>
                        <td style={{ padding: '1rem' }}>{getTrendIcon()}</td>
                        <td style={{ padding: '1rem' }}>{getStatusBadge()}</td>
                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                          <button className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }} onClick={() => navigate(`/app/classes/${classInfo.id}/student/${s.id}`)}>
                            Academic View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredStudents.length === 0 && (
                    <tr>
                      <td colSpan={8} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        No students found matching your filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Subjects Tab */}
        {activeTab === 'subjects' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Assigned Subjects</h2>
              {!classInfo.isClassTeacher && (
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', backgroundColor: 'var(--bg-color)', padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-full)' }}>
                  Filtered: Subject Teacher View
                </span>
              )}
            </div>
            
            <div className="table-responsive" style={{ backgroundColor: 'var(--bg-color)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--secondary-color)', borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ padding: '1rem' }}>Subject Name</th>
                    <th style={{ padding: '1rem' }}>Subject Teacher</th>
                    <th style={{ padding: '1rem' }}>Recent Assessment</th>
                    <th style={{ padding: '1rem' }}>Class Average</th>
                    <th style={{ padding: '1rem' }}>Pending Activity</th>
                    <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {subjects.map(subj => {
                    const canEdit = currentTeacher?.subjects.includes(subj.subjectName) || false;
                    
                    return (
                      <tr key={subj.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '1rem', fontWeight: 500 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <BookOpen size={16} color="var(--primary-color)" />
                            {subj.subjectName}
                          </div>
                        </td>
                        <td style={{ padding: '1rem' }}>{subj.subjectTeacherName}</td>
                        <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{subj.recentAssessment}</td>
                        <td style={{ padding: '1rem', fontWeight: 600 }}>{subj.classAverage}</td>
                        <td style={{ padding: '1rem' }}>
                          {subj.pendingActivity !== 'None' ? (
                            <span style={{ color: 'var(--warning)', fontSize: '0.85rem', padding: '0.1rem 0.5rem', backgroundColor: 'rgba(245, 158, 11, 0.1)', borderRadius: '12px' }}>
                              {subj.pendingActivity}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--success)', fontSize: '0.85rem' }}>Up to date</span>
                          )}
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                          {canEdit ? (
                            <button className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }} onClick={() => navigate('/app/subjects')}>
                              <Edit3 size={14} style={{ display: 'inline', marginRight: '0.25rem' }} /> Manage
                            </button>
                          ) : (
                            <button className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                              View Only
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {subjects.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        No subjects found matching your access scope.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Placeholders for Stage 1 un-implemented complex tabs */}
        {['attendance', 'assignments', 'exams', 'performance', 'remarks'].includes(activeTab) && (
          <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Workspace Integration</h3>
            <p style={{ textAlign: 'center', maxWidth: '500px' }}>
              In a full production build, this tab renders contextual data scoped to {classInfo.name} - {classInfo.section}. 
              For Stage 1, please use the global sidebar navigation to manage these features, or interact with the Overview dashboard.
            </p>
            {activeTab === 'assignments' && (
              <button className="btn btn-primary" style={{ marginTop: '1.5rem' }} onClick={() => navigate('/app/assignments')}>
                Go to Global Assignments
              </button>
            )}
            {activeTab === 'exams' && (
              <button className="btn btn-primary" style={{ marginTop: '1.5rem' }} onClick={() => navigate('/app/exams')}>
                Go to Global Exams & Marks
              </button>
            )}
            {activeTab === 'attendance' && (
              <button className="btn btn-primary" style={{ marginTop: '1.5rem' }} onClick={() => navigate('/app/attendance')}>
                Go to Attendance History
              </button>
            )}
            {activeTab === 'remarks' && (
              <button className="btn btn-secondary" style={{ marginTop: '1.5rem' }}>
                <Edit3 size={18} /> Add Class Remark
              </button>
            )}
          </div>
        )}
      </div>

      {/* Attendance Modal */}
      <Modal 
        isOpen={isAttendanceModalOpen} 
        onClose={() => setIsAttendanceModalOpen(false)} 
        title={`Take Attendance: ${classInfo.name} - ${classInfo.section}`}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {attendanceStep === 'mark' ? (
            <>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem' }}>Date</label>
                  <input type="date" className="input-field" style={{ width: '100%' }} value={attendanceDate} onChange={e => setAttendanceDate(e.target.value)} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem' }}>Period</label>
                  <select className="input-field" style={{ width: '100%' }} value={attendancePeriod} onChange={e => setAttendancePeriod(e.target.value)}>
                    <option value="Morning">Morning Roll Call</option>
                    <option value="Period 1">Period 1</option>
                    <option value="Period 2">Period 2</option>
                    <option value="Afternoon">Afternoon Roll Call</option>
                  </select>
                </div>
              </div>
              <div style={{ maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                {students.map(s => (
                  <div key={s.id} style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: attendance[s.id] === 'Absent' ? 'rgba(239, 68, 68, 0.05)' : 'transparent' }}>
                    <span>{s.name} ({s.rollNumber})</span>
                    <select 
                      value={attendance[s.id] || 'Present'}
                      onChange={(e) => handleStatusChange(s.id, e.target.value)}
                      className={`input-field ${attendance[s.id] === 'Present' ? 'text-success' : attendance[s.id] === 'Absent' ? 'text-danger' : 'text-warning'}`}
                      style={{ width: '120px', padding: '0.25rem 0.5rem' }}
                    >
                      <option value="Present">Present</option>
                      <option value="Absent">Absent</option>
                      <option value="Late">Late</option>
                      <option value="Excused">Excused</option>
                    </select>
                  </div>
                ))}
              </div>
              <button className="btn btn-primary" onClick={() => setAttendanceStep('review')} style={{ marginTop: '1rem', width: '100%' }}>
                Review Attendance
              </button>
            </>
          ) : (
            <>
              <div style={{ backgroundColor: 'var(--bg-color)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <h3 style={{ marginBottom: '1rem' }}>Review Summary</h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span>Date:</span> <strong>{attendanceDate}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <span>Period:</span> <strong>{attendancePeriod}</strong>
                </div>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                  <div style={{ flex: 1, backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '0.5rem', borderRadius: 'var(--radius-sm)', textAlign: 'center', color: 'var(--success)' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{Object.values(attendance).filter(v => v === 'Present').length}</div>
                    <div style={{ fontSize: '0.8rem' }}>Present</div>
                  </div>
                  <div style={{ flex: 1, backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '0.5rem', borderRadius: 'var(--radius-sm)', textAlign: 'center', color: 'var(--danger)' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{Object.values(attendance).filter(v => v === 'Absent').length}</div>
                    <div style={{ fontSize: '0.8rem' }}>Absent</div>
                  </div>
                  <div style={{ flex: 1, backgroundColor: 'rgba(245, 158, 11, 0.1)', padding: '0.5rem', borderRadius: 'var(--radius-sm)', textAlign: 'center', color: 'var(--warning)' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{Object.values(attendance).filter(v => v === 'Late' || v === 'Excused').length}</div>
                    <div style={{ fontSize: '0.8rem' }}>Late/Excused</div>
                  </div>
                </div>
                
                {Object.entries(attendance).filter(([_, status]) => status !== 'Present').length > 0 && (
                  <div>
                    <strong style={{ display: 'block', marginBottom: '0.5rem' }}>Exceptions:</strong>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, maxHeight: '150px', overflowY: 'auto' }}>
                      {Object.entries(attendance).filter(([_, status]) => status !== 'Present').map(([id, status]) => {
                        const student = students.find(s => s.id === id);
                        return (
                          <li key={id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', borderBottom: '1px solid var(--border-color)' }}>
                            <span>{student?.name}</span>
                            <span className={status === 'Absent' ? 'text-danger' : 'text-warning'}>{status}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button className="btn btn-secondary" onClick={() => setAttendanceStep('mark')} style={{ flex: 1 }}>
                  Back
                </button>
                <button className="btn btn-primary" onClick={handleSaveAttendance} style={{ flex: 1 }}>
                  Submit Attendance
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
