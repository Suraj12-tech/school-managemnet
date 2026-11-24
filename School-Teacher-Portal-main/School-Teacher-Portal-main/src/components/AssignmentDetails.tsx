import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAssignment, getSubmissions, type Assignment, type Submission } from '../services/mockData';
import { ArrowLeft, BookOpen, Calendar, Users, CheckCircle, Clock, FileText, AlertCircle, Paperclip } from 'lucide-react';
import { LoadingState } from './ui/LoadingState';
import { ErrorState } from './ui/ErrorState';
import { useNotification } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';


type Tab = 'overview' | 'submissions' | 'feedback';

export function AssignmentDetails() {
  const { assignmentId } = useParams();
  const navigate = useNavigate();
  const { currentTeacher } = useAuth();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const { showNotification } = useNotification();

  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [feedback, setFeedback] = useState('');
  const [score, setScore] = useState<number | ''>('');

  useEffect(() => {
    if (!assignmentId) return;
    Promise.all([
      getAssignment(assignmentId),
      getSubmissions(assignmentId)
    ]).then(([asmt, subs]) => {
      setAssignment(asmt);
      setSubmissions(subs);
      setLoading(false);
    }).catch(() => {
      setError(true);
      setLoading(false);
    });
  }, [assignmentId]);

  const handleGradeSubmission = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubmission) return;
    
    const updatedSubmissions = submissions.map(s => 
      s.id === selectedSubmission.id 
        ? { ...s, status: 'Reviewed' as const, score: Number(score), feedback }
        : s
    );
    setSubmissions(updatedSubmissions);
    showNotification('Feedback and score saved successfully!', 'success');
    setSelectedSubmission(null);
  };

  const openGradingModal = (submission: Submission) => {
    setSelectedSubmission(submission);
    setFeedback(submission.feedback || '');
    setScore(submission.score ?? '');
  };

  if (loading) return <LoadingState message="Loading assignment details..." />;
  if (error || !assignment) return <ErrorState message="Could not load assignment details." action={<button className="btn btn-secondary" onClick={() => navigate('/app/assignments')}>Go Back</button>} />;

  const isAuthorized = currentTeacher?.subjects.includes(assignment.subject);

  const totalStudents = assignment.totalStudents || 32;
  const submittedCount = submissions.filter(s => s.status === 'Submitted').length;
  const pendingCount = submissions.filter(s => s.status === 'Pending').length;
  const lateCount = submissions.filter(s => s.status === 'Late').length;
  const reviewedCount = submissions.filter(s => s.status === 'Reviewed').length;
  const totalSubmittedOrReviewed = submittedCount + lateCount + reviewedCount;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <button className="btn btn-secondary" onClick={() => navigate('/app/assignments')} style={{ alignSelf: 'flex-start', border: 'none', padding: 0 }}>
        <ArrowLeft size={20} /> Back to Assignments
      </button>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>{assignment.title}</h1>
            <div style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '1.5rem', fontSize: '1rem', flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><BookOpen size={16} /> {assignment.subject} (Class {assignment.classId})</span>
              {assignment.publishDate && <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Calendar size={16} /> Published: {new Date(assignment.publishDate).toLocaleDateString()}</span>}
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-primary)', fontWeight: 500 }}><Calendar size={16} /> Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <span className={`badge ${assignment.status === 'Active' ? 'badge-success' : ''}`} style={assignment.status !== 'Active' ? { background: 'var(--border-color)', color: 'var(--text-secondary)'} : {}}>{assignment.status}</span>
          </div>
        </div>

        {/* Aggregate Info */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Total Submissions</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{totalSubmittedOrReviewed} / {totalStudents}</div>
          </div>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Submitted</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--success)' }}>{submittedCount}</div>
          </div>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Pending</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{pendingCount}</div>
          </div>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Late</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--danger)' }}>{lateCount}</div>
          </div>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Reviewed</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--primary-color)' }}>{reviewedCount}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
        <button className={`btn ${activeTab === 'overview' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('overview')} style={{ border: activeTab === 'overview' ? undefined : 'none' }}>
          <FileText size={18} /> Overview
        </button>
        <button className={`btn ${activeTab === 'submissions' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('submissions')} style={{ border: activeTab === 'submissions' ? undefined : 'none' }}>
          <Users size={18} /> Submissions
        </button>
        {isAuthorized && (
          <button className={`btn ${activeTab === 'feedback' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('feedback')} style={{ border: activeTab === 'feedback' ? undefined : 'none' }}>
            <CheckCircle size={18} /> Feedback & Grades
          </button>
        )}
      </div>

      {/* Tab Content */}
      <div style={{ minHeight: '400px' }}>
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="card">
              <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Instructions</h3>
              <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{assignment.description || 'No description provided.'}</p>
            </div>
            
            {assignment.attachments && assignment.attachments.length > 0 && (
              <div className="card">
                <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Paperclip size={20} /> Attachments
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {assignment.attachments.map((file, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', backgroundColor: 'var(--bg-color)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                      <FileText size={18} color="var(--primary-color)" />
                      <span style={{ fontWeight: 500 }}>{file}</span>
                      <button className="btn btn-secondary" style={{ marginLeft: 'auto', padding: '0.25rem 0.5rem', fontSize: '0.85rem' }}>Download</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'submissions' && (
          <div className="table-responsive" style={{ backgroundColor: 'var(--bg-color)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--secondary-color)', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '1rem' }}>Student ID</th>
                  <th style={{ padding: '1rem' }}>Submitted At</th>
                  <th style={{ padding: '1rem' }}>Status</th>
                  <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map(s => (
                  <tr key={s.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '1rem', fontWeight: 500 }}>{s.studentId}</td>
                    <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                      {s.submittedAt ? new Date(s.submittedAt).toLocaleString() : '-'}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      {s.status === 'Submitted' && <span className="badge badge-success"><CheckCircle size={14} /> Submitted</span>}
                      {s.status === 'Pending' && <span className="badge" style={{ background: 'var(--bg-color)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}><Clock size={14} /> Pending</span>}
                      {s.status === 'Late' && <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)' }}><AlertCircle size={14} /> Late</span>}
                      {s.status === 'Reviewed' && <span className="badge" style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary-color)' }}><CheckCircle size={14} /> Reviewed ({s.score})</span>}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      {isAuthorized && (
                        <button className="btn btn-secondary" onClick={() => { setActiveTab('feedback'); openGradingModal(s); }}>
                          {s.status === 'Reviewed' ? 'Edit Feedback' : 'Review & Grade'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'feedback' && isAuthorized && (
          <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '1.5rem', alignItems: 'start' }}>
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--secondary-color)', fontWeight: 600 }}>
                Needs Review
              </div>
              <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                {submissions.filter(s => s.status === 'Submitted' || s.status === 'Late').map(s => (
                  <div 
                    key={s.id} 
                    onClick={() => openGradingModal(s)}
                    style={{ 
                      padding: '1rem', 
                      borderBottom: '1px solid var(--border-color)', 
                      cursor: 'pointer',
                      backgroundColor: selectedSubmission?.id === s.id ? 'var(--primary-color)' : 'transparent',
                      color: selectedSubmission?.id === s.id ? 'white' : 'inherit'
                    }}
                  >
                    <div style={{ fontWeight: 500 }}>Student {s.studentId}</div>
                    <div style={{ fontSize: '0.85rem', marginTop: '0.25rem', opacity: 0.8 }}>
                      Status: {s.status}
                    </div>
                  </div>
                ))}
                {submissions.filter(s => s.status === 'Submitted' || s.status === 'Late').length === 0 && (
                  <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>All caught up!</div>
                )}
              </div>
            </div>

            <div className="card">
              {selectedSubmission ? (
                <div>
                  <h3 style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Providing Feedback for {selectedSubmission.studentId}</span>
                    <span className="badge" style={{ background: 'var(--bg-color)', border: '1px solid var(--border-color)' }}>{selectedSubmission.status}</span>
                  </h3>
                  
                  <div style={{ padding: '1rem', backgroundColor: 'var(--bg-color)', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', border: '1px solid var(--border-color)' }}>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <FileText size={16} /> Submission Content (Mock Attachment): <strong style={{ color: 'var(--primary-color)', cursor: 'pointer' }}>submission_v1.pdf</strong>
                    </p>
                  </div>

                  <form onSubmit={handleGradeSubmission} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Score</label>
                      <input required type="number" min="0" max="100" className="input-field" value={score} onChange={e => setScore(e.target.value ? Number(e.target.value) : '')} style={{ width: '100px' }} />
                      <span style={{ marginLeft: '0.5rem', color: 'var(--text-secondary)' }}>/ 100</span>
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Feedback</label>
                      <textarea rows={6} className="input-field" value={feedback} onChange={e => setFeedback(e.target.value)} style={{ width: '100%' }} placeholder="Provide constructive feedback and notes..."></textarea>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                      <button type="button" className="btn btn-secondary" onClick={() => setSelectedSubmission(null)}>Cancel</button>
                      <button type="submit" className="btn btn-primary">Save Feedback</button>
                    </div>
                  </form>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', color: 'var(--text-secondary)' }}>
                  <CheckCircle size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                  <p>Select a submission from the list to review and provide feedback.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
