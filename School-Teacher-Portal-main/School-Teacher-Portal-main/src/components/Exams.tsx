import { useState, useEffect } from 'react';
import { getExams, createExam, type Exam } from '../services/mockData';
import { ClipboardList, ChevronRight, FileText } from 'lucide-react';
import { Modal } from './Modal';
import { useNavigate } from 'react-router-dom';
import { LoadingState } from './ui/LoadingState';
import { ErrorState } from './ui/ErrorState';
import { EmptyState } from './ui/EmptyState';
import { useNotification } from '../contexts/NotificationContext';

export function Exams() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [classId, setClassId] = useState('C1');
  const [date, setDate] = useState('');
  const [maxMarks, setMaxMarks] = useState('100');

  const loadData = () => {
    getExams()
      .then(data => {
        setExams(data);
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

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    await createExam({
      title,
      subject,
      classId,
      date,
      maxMarks: Number(maxMarks),
      status: 'Draft'
    });
    showNotification('Assessment created successfully!', 'success');
    setIsNewModalOpen(false);
    setTitle('');
    setSubject('');
    setDate('');
    loadData();
  };

  const getStatusBadge = (status: Exam['status']) => {
    switch (status) {
      case 'Published': return <span className="badge badge-success">Published</span>;
      case 'Submitted': return <span className="badge badge-warning">Submitted</span>;
      default: return <span className="badge" style={{ background: 'var(--border-color)', color: 'var(--text-secondary)' }}>Draft</span>;
    }
  };

  if (loading) return <LoadingState message="Loading assessments..." />;
  if (error) return <ErrorState message="Could not load assessments." action={<button className="btn btn-primary" onClick={() => window.location.reload()}>Try Again</button>} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Exams & Marks</h1>
          <p>Manage assessments and enter marks for your classes.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsNewModalOpen(true)}>
          <FileText size={18} /> New Assessment
        </button>
      </div>

      <div className="table-responsive" style={{ backgroundColor: 'var(--bg-color)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--secondary-color)', borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '1rem' }}>Title</th>
              <th style={{ padding: '1rem' }}>Subject & Class</th>
              <th style={{ padding: '1rem' }}>Date</th>
              <th style={{ padding: '1rem' }}>Max Marks</th>
              <th style={{ padding: '1rem' }}>Status</th>
              <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {exams.map(exam => (
              <tr key={exam.id} style={{ borderBottom: '1px solid var(--border-color)', cursor: 'pointer' }} onClick={() => navigate(`/app/exams/${exam.id}`)}>
                <td style={{ padding: '1rem', fontWeight: 600 }}>{exam.title}</td>
                <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ClipboardList size={14} /> {exam.subject} (Class {exam.classId})
                  </div>
                </td>
                <td style={{ padding: '1rem' }}>
                  {new Date(exam.date).toLocaleDateString()}
                </td>
                <td style={{ padding: '1rem' }}>{exam.maxMarks}</td>
                <td style={{ padding: '1rem' }}>{getStatusBadge(exam.status)}</td>
                <td style={{ padding: '1rem', textAlign: 'right' }}>
                  <button className="btn btn-secondary text-sm" style={{ padding: '0.4rem 0.8rem' }} onClick={(e) => { e.stopPropagation(); navigate(`/app/exams/${exam.id}`); }}>
                    Manage <ChevronRight size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {exams.length === 0 && !loading && !error && (
              <tr>
                <td colSpan={6} style={{ padding: '2rem' }}>
                  <EmptyState 
                    icon={<ClipboardList size={48} />}
                    title="No Assessments Found"
                    description="You have not created any assessments yet."
                    action={<button className="btn btn-primary" onClick={() => setIsNewModalOpen(true)}>Create First Assessment</button>}
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isNewModalOpen} onClose={() => setIsNewModalOpen(false)} title="Schedule New Assessment">
        <form onSubmit={handleCreateExam} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Title</label>
            <input required type="text" value={title} onChange={e => setTitle(e.target.value)} style={{ width: '100%', padding: '0.5rem' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Subject</label>
            <input required type="text" value={subject} onChange={e => setSubject(e.target.value)} style={{ width: '100%', padding: '0.5rem' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Class</label>
            <select value={classId} onChange={e => setClassId(e.target.value)} style={{ width: '100%', padding: '0.5rem' }}>
              <option value="C1">Grade 10 - A</option>
              <option value="C2">Grade 10 - B</option>
              <option value="C3">Grade 11 - Science</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Date</label>
            <input required type="date" value={date} onChange={e => setDate(e.target.value)} style={{ width: '100%', padding: '0.5rem' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Maximum Marks</label>
            <input required type="number" value={maxMarks} onChange={e => setMaxMarks(e.target.value)} style={{ width: '100%', padding: '0.5rem' }} />
          </div>
          <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }}>Schedule Assessment</button>
        </form>
      </Modal>
    </div>
  );
}
