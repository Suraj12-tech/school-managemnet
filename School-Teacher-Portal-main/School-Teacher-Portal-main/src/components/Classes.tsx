import { useState, useEffect } from 'react';
import { getClasses, type ClassInfo } from '../services/mockData';
import { Users, ChevronRight, UserCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LoadingState } from './ui/LoadingState';
import { ErrorState } from './ui/ErrorState';
import { EmptyState } from './ui/EmptyState';

export function Classes() {
  const { currentTeacher } = useAuth();
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    getClasses()
      .then(data => {
        if (currentTeacher?.classesTaught) {
          setClasses(data.filter(c => currentTeacher.classesTaught?.includes(c.id)));
        } else {
          setClasses(data);
        }
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [currentTeacher]);

  if (loading) return <LoadingState message="Loading classes..." />;
  if (error) return <ErrorState message="Could not load your classes." action={<button className="btn btn-primary" onClick={() => window.location.reload()}>Try Again</button>} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>My Classes</h1>
        <p>Manage your assigned classes, attendance, and student lists.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {classes.map(c => (
          <div key={c.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', cursor: 'pointer' }} onClick={() => navigate(`/app/classes/${c.id}`)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{c.name} - Section {c.section}</h3>
                <div style={{ color: 'var(--text-secondary)' }}>{c.subject}</div>
              </div>
              {c.isClassTeacher && (
                <span className="badge badge-success" style={{ display: 'flex', gap: '0.25rem' }}>
                  <UserCheck size={14} /> Class Teacher
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
              <Users size={18} /> {c.studentsCount} Students
            </div>

            <div style={{ display: 'flex', marginTop: 'auto', paddingTop: '1rem' }}>
              <button className="btn btn-secondary text-sm" style={{ padding: '0.4rem 0.8rem' }}>
                View Class Workspace <ChevronRight size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {!loading && classes.length === 0 && !error && (
        <EmptyState 
          icon={<Users size={48} />}
          title="No Classes Assigned" 
          description="You are not currently assigned as a teacher for any classes." 
        />
      )}
    </div>
  );
}

