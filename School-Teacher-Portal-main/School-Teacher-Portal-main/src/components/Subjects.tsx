import { useState, useEffect } from 'react';
import { getTeacherSubjects, type Subject } from '../services/mockData';
import { useAuth } from '../contexts/AuthContext';
import { BookOpen, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LoadingState } from './ui/LoadingState';
import { ErrorState } from './ui/ErrorState';
import { EmptyState } from './ui/EmptyState';

export function Subjects() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const { currentTeacher } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentTeacher) return;
    getTeacherSubjects(currentTeacher.id)
      .then(data => {
        setSubjects(data);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [currentTeacher]);

  if (loading) return <LoadingState message="Loading subjects..." />;
  if (error) return <ErrorState message="Could not load subjects." action={<button className="btn btn-primary" onClick={() => window.location.reload()}>Try Again</button>} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>My Subjects</h1>
        <p>Manage the subjects you teach and view subject-specific performance.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {subjects.map(s => (
          <div key={s.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', cursor: 'pointer' }} onClick={() => navigate(`/app/subjects/${s.id}`)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{s.name}</h3>
              </div>
              <span className="badge badge-primary" style={{ display: 'flex', gap: '0.25rem' }}>
                <BookOpen size={14} /> Subject
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', color: 'var(--text-secondary)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <BookOpen size={18} style={{ marginTop: '0.1rem' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  {s.classes.map(c => <span key={c}>{c}</span>)}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', marginTop: 'auto', paddingTop: '1rem' }}>
              <button className="btn btn-secondary text-sm" style={{ padding: '0.4rem 0.8rem' }} onClick={() => navigate(`/app/subjects/${s.id}`)}>
                View Workspace <ChevronRight size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {!loading && subjects.length === 0 && !error && (
        <EmptyState 
          icon={<BookOpen size={48} />}
          title="No Subjects Assigned" 
          description="You are not currently assigned to teach any subjects." 
        />
      )}
    </div>
  );
}
