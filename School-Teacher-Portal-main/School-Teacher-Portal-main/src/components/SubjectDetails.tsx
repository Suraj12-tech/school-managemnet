import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTeacherSubjects, getClasses, type Subject, type ClassInfo } from '../services/mockData';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, BookOpen, Users, Activity, FilePlus, ChevronRight, BarChart } from 'lucide-react';
import { LoadingState } from './ui/LoadingState';
import { ErrorState } from './ui/ErrorState';

type Tab = 'overview' | 'classes' | 'assignments' | 'assessments' | 'performance';

export function SubjectDetails() {
  const { subjectId } = useParams();
  const navigate = useNavigate();
  const { currentTeacher } = useAuth();
  
  const [subject, setSubject] = useState<Subject | null>(null);
  const [allClasses, setAllClasses] = useState<ClassInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  useEffect(() => {
    if (!currentTeacher || !subjectId) return;
    Promise.all([
      getTeacherSubjects(currentTeacher.id),
      getClasses()
    ]).then(([data, cls]) => {
        const found = data.find(s => s.id === subjectId);
        setSubject(found || null);
        setAllClasses(cls);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [subjectId, currentTeacher]);

  if (loading) return <LoadingState message="Loading subject details..." />;
  if (error || !subject) return <ErrorState message="Could not load subject details." action={<button className="btn btn-secondary" onClick={() => navigate('/app/subjects')}>Go Back</button>} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <button className="btn btn-secondary" onClick={() => navigate('/app/subjects')} style={{ alignSelf: 'flex-start', border: 'none', padding: 0 }}>
        <ArrowLeft size={20} /> Back to My Subjects
      </button>

      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{
            width: '60px', height: '60px', borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--primary-color)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white'
          }}>
            <BookOpen size={30} />
          </div>
          <div>
            <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>{subject.name}</h1>
            <div style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Subject Workspace</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', overflowX: 'auto' }}>
        <button className={`btn ${activeTab === 'overview' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('overview')} style={{ border: activeTab === 'overview' ? undefined : 'none' }}>
          Overview
        </button>
        <button className={`btn ${activeTab === 'classes' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('classes')} style={{ border: activeTab === 'classes' ? undefined : 'none' }}>
          Classes
        </button>
        <button className={`btn ${activeTab === 'assignments' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('assignments')} style={{ border: activeTab === 'assignments' ? undefined : 'none' }}>
          Assignments
        </button>
        <button className={`btn ${activeTab === 'assessments' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('assessments')} style={{ border: activeTab === 'assessments' ? undefined : 'none' }}>
          Assessments
        </button>
        <button className={`btn ${activeTab === 'performance' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('performance')} style={{ border: activeTab === 'performance' ? undefined : 'none' }}>
          Performance
        </button>
      </div>

      {/* Tab Content */}
      <div style={{ minHeight: '400px' }}>
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
              <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <BookOpen size={32} color="var(--primary-color)" style={{ marginBottom: '1rem' }} />
                <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>{subject.classes.length} Classes</h3>
                <p style={{ color: 'var(--text-secondary)' }}>Currently enrolled</p>
              </div>
              <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <Users size={32} color="var(--secondary-color)" style={{ marginBottom: '1rem' }} />
                <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>{subject.studentsCount} Students</h3>
                <p style={{ color: 'var(--text-secondary)' }}>Total students across all classes</p>
              </div>
              <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <Activity size={32} color="var(--success)" style={{ marginBottom: '1rem' }} />
                <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Avg. Performance: B+</h3>
                <p style={{ color: 'var(--text-secondary)' }}>Across all assessments</p>
              </div>
            </div>
            
            <div>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Recent Activity in {subject.name}</h2>
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <div style={{ fontWeight: 500 }}>Midterm Exam Published</div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Grade 10-A</div>
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>2 days ago</div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontWeight: 500 }}>Assignment "Chapter 4 Exercises" Due</div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Grade 10-B</div>
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>5 days ago</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'classes' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h2 style={{ fontSize: '1.5rem' }}>Classes Taught</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {subject.classes.map(className => {
                const cls = allClasses.find(c => c.name === className);
                return (
                <div key={className} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h3 style={{ fontSize: '1.25rem' }}>{className}</h3>
                    <span className="badge badge-primary">Active</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                    <Users size={18} /> ~32 Students
                  </div>
                  <div style={{ marginTop: 'auto', paddingTop: '1rem' }}>
                    <button className="btn btn-secondary text-sm" style={{ padding: '0.4rem 0.8rem' }} onClick={() => navigate(cls ? `/app/classes/${cls.id}` : '/app/classes')}>
                      Go to Class Workspace <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'assignments' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.5rem' }}>Subject Assignments</h2>
              <button className="btn btn-primary" onClick={() => navigate('/app/assignments')}>
                <FilePlus size={18} /> New Assignment
              </button>
            </div>
            <div className="card">
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                Showing assignments across all classes for {subject.name}.
              </p>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--secondary-color)', borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ padding: '1rem' }}>Title</th>
                    <th style={{ padding: '1rem' }}>Class</th>
                    <th style={{ padding: '1rem' }}>Due Date</th>
                    <th style={{ padding: '1rem' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '1rem', fontWeight: 500 }}>Chapter 4 Exercises</td>
                    <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{subject.classes[0] || '10th A'}</td>
                    <td style={{ padding: '1rem' }}>Oct 15, 2026</td>
                    <td style={{ padding: '1rem' }}><span className="badge badge-success">Active</span></td>
                  </tr>
                  <tr>
                    <td style={{ padding: '1rem', fontWeight: 500 }}>Final Project Draft</td>
                    <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{subject.classes[0] || '10th A'}</td>
                    <td style={{ padding: '1rem' }}>Nov 02, 2026</td>
                    <td style={{ padding: '1rem' }}><span className="badge" style={{ background: 'var(--border-color)', color: 'var(--text-secondary)' }}>Closed</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'assessments' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.5rem' }}>Subject Assessments</h2>
              <button className="btn btn-primary" onClick={() => navigate('/app/exams')}>
                <FilePlus size={18} /> Schedule Assessment
              </button>
            </div>
            <div className="card">
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                Showing assessments and exams across all classes for {subject.name}.
              </p>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--secondary-color)', borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ padding: '1rem' }}>Assessment Title</th>
                    <th style={{ padding: '1rem' }}>Class</th>
                    <th style={{ padding: '1rem' }}>Date</th>
                    <th style={{ padding: '1rem' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '1rem', fontWeight: 500 }}>Midterm Examination</td>
                    <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{subject.classes[0] || '10th A'}</td>
                    <td style={{ padding: '1rem' }}>Oct 20, 2026</td>
                    <td style={{ padding: '1rem' }}><span className="badge badge-warning">Submitted</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'performance' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h2 style={{ fontSize: '1.5rem' }}>Performance Analytics</h2>
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><BarChart size={20} /> Class Comparisons</h3>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                {subject.classes.map((className) => (
                  <div key={className} style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontWeight: 500, marginBottom: '0.5rem' }}>{className}</div>
                    <div style={{ fontSize: '2rem', fontWeight: 600, color: 'var(--primary-color)' }}>
                      {Math.floor(Math.random() * 15 + 75)}%
                    </div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Average Score</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
