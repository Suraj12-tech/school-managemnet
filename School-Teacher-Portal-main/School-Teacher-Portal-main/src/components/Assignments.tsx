import { useState, useEffect } from 'react';
import { getAssignments, createAssignment, type Assignment } from '../services/mockData';
import { BookOpen, Calendar, ChevronRight, FilePlus, Users } from 'lucide-react';
import { Modal } from './Modal';
import { useNavigate } from 'react-router-dom';
import { LoadingState } from './ui/LoadingState';
import { ErrorState } from './ui/ErrorState';
import { EmptyState } from './ui/EmptyState';
import { useNotification } from '../contexts/NotificationContext';

export function Assignments() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [classId, setClassId] = useState('10th A');
  const [description, setDescription] = useState('');
  const [publishDate, setPublishDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [attachments, setAttachments] = useState<string[]>([]);

  const loadData = () => {
    getAssignments()
      .then(data => {
        setAssignments(data);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    await createAssignment({
      title,
      subject,
      classId,
      description,
      attachments,
      publishDate,
      dueDate,
      submissionsCount: 0,
      totalStudents: 32, // Mock count
      status: 'Active'
    });
    showNotification('Assignment created successfully!', 'success');
    setIsNewModalOpen(false);
    setTitle('');
    setSubject('');
    setDescription('');
    setPublishDate('');
    setDueDate('');
    setAttachments([]);
    loadData();
  };

  const getStatusBadge = (status: Assignment['status']) => {
    if (status === 'Active') {
      return <span className="badge badge-success">Active</span>;
    }
    return <span className="badge" style={{ background: 'var(--border-color)', color: 'var(--text-secondary)' }}>Closed</span>;
  };

  if (loading) return <LoadingState message="Loading assignments..." />;
  if (error) return <ErrorState message="Could not load assignments." action={<button className="btn btn-primary" onClick={() => window.location.reload()}>Try Again</button>} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Assignments</h1>
          <p>Create, manage, and review student assignments.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsNewModalOpen(true)}>
          <FilePlus size={18} /> New Assignment
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
        {assignments.map(assignment => (
          <div key={assignment.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', cursor: 'pointer' }} onClick={() => navigate(`/app/assignments/${assignment.id}`)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem', fontWeight: 600 }}>{assignment.title}</h3>
                <div style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                   <BookOpen size={16} /> {assignment.subject} (Class {assignment.classId})
                </div>
              </div>
              {getStatusBadge(assignment.status)}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                <Calendar size={16} /> <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Due:</span> {new Date(assignment.dueDate).toLocaleDateString()}
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                     <Users size={14} /> Submissions
                   </div>
                   <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                     {assignment.submissionsCount} / {assignment.totalStudents}
                   </span>
                </div>
                <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--border-color)', borderRadius: '9999px', overflow: 'hidden' }}>
                  <div style={{ 
                    height: '100%', 
                    backgroundColor: assignment.status === 'Active' ? 'var(--primary-color)' : 'var(--text-secondary)', 
                    width: `${(assignment.submissionsCount / assignment.totalStudents) * 100}%` 
                  }}></div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', marginTop: 'auto', paddingTop: '1rem' }}>
              <button className="btn btn-secondary text-sm" style={{ padding: '0.4rem 0.8rem' }}>
                View Assignment Workspace <ChevronRight size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {!loading && assignments.length === 0 && !error && (
        <EmptyState 
          icon={<BookOpen size={48} />}
          title="No Assignments Found" 
          description="You have not created any assignments yet." 
          action={
            <button className="btn btn-primary" onClick={() => setIsNewModalOpen(true)}>
              <FilePlus size={18} /> Create First Assignment
            </button>
          }
        />
      )}

      <Modal isOpen={isNewModalOpen} onClose={() => setIsNewModalOpen(false)} title="Create New Assignment">
        <form onSubmit={handleCreateAssignment} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Title</label>
            <input required type="text" className="input-field" value={title} onChange={e => setTitle(e.target.value)} style={{ width: '100%' }} />
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Subject</label>
              <input required type="text" className="input-field" value={subject} onChange={e => setSubject(e.target.value)} style={{ width: '100%' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Class</label>
              <select className="input-field" value={classId} onChange={e => setClassId(e.target.value)} style={{ width: '100%' }}>
                <option value="10th A">10th A</option>
                <option value="10th B">10th B</option>
                <option value="11th Science">11th Science</option>
              </select>
            </div>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Description / Instructions</label>
            <textarea required rows={3} className="input-field" value={description} onChange={e => setDescription(e.target.value)} style={{ width: '100%' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Attachments</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setAttachments([...attachments, `file_${attachments.length+1}.pdf`])}>
                Add File
              </button>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{attachments.length} files attached</span>
            </div>
            {attachments.length > 0 && (
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                {attachments.map((a, i) => (
                  <span key={i} className="badge" style={{ background: 'var(--bg-color)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>{a}</span>
                ))}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Publish Date</label>
              <input type="date" className="input-field" value={publishDate} onChange={e => setPublishDate(e.target.value)} style={{ width: '100%' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Due Date</label>
              <input required type="date" className="input-field" value={dueDate} onChange={e => setDueDate(e.target.value)} style={{ width: '100%' }} />
            </div>
          </div>
          <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }}>Create Assignment</button>
        </form>
      </Modal>
    </div>
  );
}
