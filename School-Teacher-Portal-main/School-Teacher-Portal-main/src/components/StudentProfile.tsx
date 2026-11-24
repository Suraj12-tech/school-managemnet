import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  getStudent, getClass, getStudentSubjects, getStudentAssignments, getStudentExams, getStudentRemarks,
  type Student, type ClassInfo, type StudentSubjectRecord, type StudentAssignmentRecord, type StudentExamRecord, type StudentRemark 
} from '../services/mockData';
import { useAuth } from '../contexts/AuthContext';
import { 
  User, ArrowLeft, Book, Clock, TrendingUp, MessageSquare, Plus, Edit3 
} from 'lucide-react';
import { LoadingState } from './ui/LoadingState';
import { ErrorState } from './ui/ErrorState';

type Tab = 'overview' | 'attendance' | 'academics' | 'assignments' | 'exams' | 'remarks';

export function StudentProfile() {
  const { classId, studentId } = useParams();
  const navigate = useNavigate();
  const { currentTeacher } = useAuth();
  
  const [student, setStudent] = useState<Student | null>(null);
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  
  const [subjects, setSubjects] = useState<StudentSubjectRecord[]>([]);
  const [assignments, setAssignments] = useState<StudentAssignmentRecord[]>([]);
  const [exams, setExams] = useState<StudentExamRecord[]>([]);
  const [remarks, setRemarks] = useState<StudentRemark[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  useEffect(() => {
    if (!studentId || !classId) return;
    Promise.all([
      getStudent(studentId),
      getClass(classId),
      getStudentSubjects(studentId),
      getStudentAssignments(studentId),
      getStudentExams(studentId),
      getStudentRemarks(studentId)
    ]).then(([s, c, subjs, assigns, exs, rems]) => {
      setStudent(s);
      setClassInfo(c);
      setSubjects(subjs);
      setAssignments(assigns);
      setExams(exs);
      setRemarks(rems);
      setLoading(false);
    }).catch(() => {
      setError(true);
      setLoading(false);
    });
  }, [studentId, classId]);

  if (loading) return <LoadingState message="Loading student profile..." />;
  if (error || !student || !classInfo) return <ErrorState message="Could not load student profile." action={<button className="btn btn-secondary" onClick={() => navigate(-1)}>Go Back</button>} />;

  const isClassTeacher = currentTeacher?.classesTaught?.includes(classInfo.name) || false;
  const isSubjectTeacher = subjects.some(s => currentTeacher?.subjects.includes(s.subjectName));
  const isAuthorized = isClassTeacher || isSubjectTeacher;

  if (!isAuthorized) {
    return <ErrorState message="You are not authorized to view this student's profile." action={<button className="btn btn-secondary" onClick={() => navigate(-1)}>Go Back</button>} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <button className="btn btn-secondary" onClick={() => navigate(`/app/classes/${classId}`)} style={{ alignSelf: 'flex-start', border: 'none', padding: 0 }}>
        <ArrowLeft size={20} /> Back to Class Workspace
      </button>

      {/* Student Header */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
        <div style={{
          width: '100px', height: '100px', borderRadius: '50%',
          backgroundColor: 'var(--primary-color)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', flexShrink: 0
        }}>
          <User size={50} />
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '2.5rem', margin: '0 0 0.5rem 0' }}>{student.name}</h1>
          <div style={{ display: 'flex', gap: '2rem', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
            <div><strong>Roll Number:</strong> {student.rollNumber}</div>
            <div><strong>Class:</strong> {classInfo?.name}</div>
            <div><strong>Attendance:</strong> {student.attendancePct || 92}%</div>
            <div><strong>Average:</strong> {student.academicAverage || 84}%</div>
            <div>
              <strong>Status:</strong> 
              <span style={{ 
                marginLeft: '0.5rem', 
                color: student.status === 'Needs Attention' || student.status === 'Critical' ? 'var(--danger)' : 'var(--success)' 
              }}>
                {student.status || 'Good'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)', overflowX: 'auto', paddingBottom: '0.5rem' }}>
        {(['overview', 'attendance', 'academics', 'assignments', 'exams', 'remarks'] as Tab[]).map(tab => (
          <button
            key={tab}
            className={`btn ${activeTab === tab ? 'btn-primary' : ''}`}
            style={{ 
              backgroundColor: activeTab === tab ? 'var(--primary-color)' : 'transparent',
              color: activeTab === tab ? 'white' : 'var(--text-primary)',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              textTransform: 'capitalize'
            }}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ backgroundColor: 'var(--surface-color)' }}>
        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            <div className="card">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                <TrendingUp size={20} /> Overall Performance
              </h3>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>{student.academicAverage || 84}%</div>
              <div style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Trending {student.recentPerformance || 'Up'}</div>
            </div>
            
            <div className="card">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                <Clock size={20} /> Attendance
              </h3>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: (student.attendancePct || 92) > 85 ? 'var(--success)' : 'var(--danger)' }}>
                {student.attendancePct || 92}%
              </div>
              <div style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Present in 46/50 sessions</div>
            </div>

            <div className="card">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                <Book size={20} /> Assignments
              </h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>Completed</span>
                <span style={{ fontWeight: 'bold', color: 'var(--success)' }}>12</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Pending</span>
                <span style={{ fontWeight: 'bold', color: 'var(--warning)' }}>{student.pendingAssignments || 2}</span>
              </div>
            </div>
            
            <div className="card">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                <MessageSquare size={20} /> Recent Remarks
              </h3>
              {remarks.slice(0,2).map(r => (
                <div key={r.id} style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>
                  <div style={{ fontWeight: 600 }}>{r.teacherName}</div>
                  <div style={{ color: 'var(--text-secondary)' }}>"{r.remark}"</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'attendance' && (
          <div className="card">
            <h3 style={{ marginBottom: '1.5rem' }}>Attendance Details</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
              <div style={{ padding: '1.5rem', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--success)' }}>46</div>
                <div>Present</div>
              </div>
              <div style={{ padding: '1.5rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--danger)' }}>3</div>
                <div>Absent</div>
              </div>
              <div style={{ padding: '1.5rem', backgroundColor: 'rgba(245, 158, 11, 0.1)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--warning)' }}>1</div>
                <div>Late</div>
              </div>
            </div>
            <h4>Recent Absences</h4>
            <table style={{ width: '100%', marginTop: '1rem', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                  <th style={{ padding: '0.75rem' }}>Date</th>
                  <th style={{ padding: '0.75rem' }}>Status</th>
                  <th style={{ padding: '0.75rem' }}>Reason/Leave</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '0.75rem' }}>12 Sep 2026</td>
                  <td style={{ padding: '0.75rem', color: 'var(--danger)' }}>Absent</td>
                  <td style={{ padding: '0.75rem' }}>Medical Leave (Approved)</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '0.75rem' }}>28 Aug 2026</td>
                  <td style={{ padding: '0.75rem', color: 'var(--danger)' }}>Absent</td>
                  <td style={{ padding: '0.75rem' }}>Unexcused</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'academics' && (
          <div className="card">
            <h3 style={{ marginBottom: '1.5rem' }}>Subject Performance</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-color)', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '1rem' }}>Subject</th>
                  <th style={{ padding: '1rem' }}>Score</th>
                  <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map(subj => {
                  const canEdit = currentTeacher?.subjects.includes(subj.subjectName);
                  return (
                    <tr key={subj.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '1rem', fontWeight: 500 }}>{subj.subjectName}</td>
                      <td style={{ padding: '1rem' }}>{subj.scorePct}%</td>
                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        {canEdit ? (
                          <button className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                            <Edit3 size={14} style={{ display: 'inline', marginRight: '0.25rem' }}/> Edit Marks
                          </button>
                        ) : (
                          <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}>View Only</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'assignments' && (
          <div className="card">
            <h3 style={{ marginBottom: '1.5rem' }}>Assignments</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-color)', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '1rem' }}>Assignment</th>
                  <th style={{ padding: '1rem' }}>Subject</th>
                  <th style={{ padding: '1rem' }}>Due Date</th>
                  <th style={{ padding: '1rem' }}>Status</th>
                  <th style={{ padding: '1rem' }}>Score</th>
                  <th style={{ padding: '1rem' }}>Feedback</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map(a => (
                  <tr key={a.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '1rem', fontWeight: 500 }}>{a.assignmentTitle}</td>
                    <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{a.subjectName}</td>
                    <td style={{ padding: '1rem' }}>{a.dueDate}</td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ 
                        color: a.status === 'Submitted' ? 'var(--success)' : a.status === 'Late' ? 'var(--warning)' : 'var(--danger)',
                        padding: '0.2rem 0.5rem',
                        backgroundColor: 'var(--bg-color)',
                        borderRadius: '12px',
                        fontSize: '0.85rem'
                      }}>{a.status}</span>
                    </td>
                    <td style={{ padding: '1rem', fontWeight: 'bold' }}>{a.score}</td>
                    <td style={{ padding: '1rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{a.feedback}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'exams' && (
          <div className="card">
            <h3 style={{ marginBottom: '1.5rem' }}>Examinations</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-color)', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '1rem' }}>Examination</th>
                  <th style={{ padding: '1rem' }}>Subject</th>
                  <th style={{ padding: '1rem' }}>Marks</th>
                  <th style={{ padding: '1rem' }}>Max Marks</th>
                  <th style={{ padding: '1rem' }}>Percentage</th>
                  <th style={{ padding: '1rem' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {exams.map(e => (
                  <tr key={e.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '1rem', fontWeight: 500 }}>{e.examTitle}</td>
                    <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{e.subjectName}</td>
                    <td style={{ padding: '1rem', fontWeight: 'bold' }}>{e.marksObtained}</td>
                    <td style={{ padding: '1rem' }}>{e.maxMarks}</td>
                    <td style={{ padding: '1rem' }}>{e.percentage}%</td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ color: e.status === 'Passed' ? 'var(--success)' : 'var(--danger)' }}>{e.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'remarks' && (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3>Academic Remarks</h3>
              {(isClassTeacher || currentTeacher?.role === 'Both') && (
                <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}>
                  <Plus size={16} /> Add Remark
                </button>
              )}
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {remarks.map(r => (
                <div key={r.id} style={{ padding: '1.5rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: 600 }}>{r.teacherName}</span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{r.date}</span>
                  </div>
                  <p style={{ margin: 0, color: 'var(--text-primary)', lineHeight: 1.5 }}>
                    "{r.remark}"
                  </p>
                </div>
              ))}
              {remarks.length === 0 && (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  No remarks have been added for this student.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
