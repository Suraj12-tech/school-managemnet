import { useState, useEffect } from 'react';
import { getClasses, type ClassInfo } from '../services/mockData';
import { LoadingState } from './ui/LoadingState';
import { ErrorState } from './ui/ErrorState';
import { 
  Users, AlertCircle, Clock, Tag, Calendar as CalendarIcon, 
  CheckCircle, FileText, AlertTriangle, ArrowRight 
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export function Dashboard() {
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentTeacher } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState(false);

  useEffect(() => {
    getClasses()
      .then(data => {
        setClasses(data);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, []);

  if (loading) return <LoadingState message="Loading dashboard..." />;
  if (error) return <ErrorState message="Could not load dashboard data." action={<button className="btn btn-primary" onClick={() => window.location.reload()}>Try Again</button>} />;

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  // Mocking an actual schedule rather than displaying 09:00 AM everywhere
  const scheduleTimes = ['08:30 AM', '10:00 AM', '11:30 AM', '01:00 PM'];
  const scheduleTypes = ['Take Attendance', 'Open Class', 'View Class', 'Take Attendance'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Welcome Section */}
      <div>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>
          Welcome back, {currentTeacher?.name.split(' ')[0]}
        </h1>
        <div style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CalendarIcon size={16} /> {today} | Academic Term 1, 2026-2027
        </div>
        
        {/* Display Subjects */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1rem' }}>
          {currentTeacher?.subjects?.map((sub, index) => (
            <span key={index} className="badge" style={{ backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Tag size={12} style={{ color: 'var(--primary-color)' }} /> {sub}
            </span>
          ))}
        </div>
      </div>

      {/* Quick Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '1rem', borderRadius: 'var(--radius-lg)', backgroundColor: 'rgba(79, 70, 229, 0.1)', color: 'var(--primary-color)' }}>
            <Users size={24} />
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{classes.length}</div>
            <div style={{ color: 'var(--text-secondary)' }}>Today's Classes</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '1rem', borderRadius: 'var(--radius-lg)', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)' }}>
            <AlertCircle size={24} />
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>2</div>
            <div style={{ color: 'var(--text-secondary)' }}>Attendance Pending</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '1rem', borderRadius: 'var(--radius-lg)', backgroundColor: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)' }}>
            <CheckCircle size={24} />
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>1</div>
            <div style={{ color: 'var(--text-secondary)' }}>Marks Pending</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '1rem', borderRadius: 'var(--radius-lg)', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}>
            <FileText size={24} />
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>17</div>
            <div style={{ color: 'var(--text-secondary)' }}>Assignments to Review</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
        
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Today's Schedule */}
          <div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={20} /> Today's Schedule
            </h2>
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              {classes.slice(0, 4).map((c, i) => {
                const action = scheduleTypes[i % scheduleTypes.length];
                return (
                  <div key={c.id} style={{ 
                    padding: '1.25rem', 
                    borderBottom: i < 3 ? '1px solid var(--border-color)' : 'none',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <span className="badge" style={{ backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', width: '85px', textAlign: 'center', display: 'inline-block' }}>
                        {scheduleTimes[i % scheduleTimes.length]}
                      </span>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '1.05rem' }}>{c.name} - Section {c.section}</div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{c.subject}</div>
                      </div>
                    </div>
                    <button 
                      className={`btn ${action === 'Take Attendance' ? 'btn-primary' : 'btn-secondary'} text-sm`} 
                      style={{ padding: '0.4rem 0.8rem' }}
                      onClick={() => navigate(`/app/classes/${c.id}`)}
                    >
                      {action}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Requires Attention */}
          <div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--danger)' }}>
              <AlertTriangle size={20} /> Requires Attention
            </h2>
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                <li style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: 500 }}>Grade 10-A attendance not submitted</span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Required by 09:00 AM</span>
                  </div>
                  <button className="btn btn-secondary text-sm" onClick={() => navigate('/app/attendance')}>Resolve <ArrowRight size={14} /></button>
                </li>
                <li style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: 500 }}>17 Algebra submissions pending review</span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>From assignment "Chapter 4"</span>
                  </div>
                  <button className="btn btn-secondary text-sm" onClick={() => navigate('/app/assignments')}>Review <ArrowRight size={14} /></button>
                </li>
                <li style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: 500 }}>Mid-Term Mathematics marks in Draft</span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Deadline: Tomorrow</span>
                  </div>
                  <button className="btn btn-secondary text-sm" onClick={() => navigate('/app/exams')}>Submit <ArrowRight size={14} /></button>
                </li>
                <li style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: 500 }}>Attendance correction requests awaiting action</span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>2 requests pending</span>
                  </div>
                  <button className="btn btn-secondary text-sm" onClick={() => navigate('/app/attendance?tab=correctionHistory')}>View <ArrowRight size={14} /></button>
                </li>
              </ul>
            </div>
          </div>

          {/* Upcoming */}
          <div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CalendarIcon size={20} /> Upcoming
            </h2>
            <div className="card">
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <li style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{ backgroundColor: 'var(--bg-color)', padding: '0.5rem', borderRadius: 'var(--radius-sm)', textAlign: 'center', minWidth: '60px', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Oct</div>
                    <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>15</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500 }}>Final Project Draft Due</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Assignment deadline for Grade 10-A</div>
                  </div>
                </li>
                <li style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{ backgroundColor: 'var(--bg-color)', padding: '0.5rem', borderRadius: 'var(--radius-sm)', textAlign: 'center', minWidth: '60px', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Oct</div>
                    <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>18</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500 }}>Physics Midterm Examination</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Upcoming assessment for Grade 11-Science</div>
                  </div>
                </li>
                <li style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{ backgroundColor: 'var(--bg-color)', padding: '0.5rem', borderRadius: 'var(--radius-sm)', textAlign: 'center', minWidth: '60px', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Oct</div>
                    <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>20</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500 }}>Parent-Teacher Conference</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Scheduled meeting block</div>
                  </div>
                </li>
              </ul>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
