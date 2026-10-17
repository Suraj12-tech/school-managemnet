import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTeachers, type Teacher } from '../services/mockData';
import { Mail, GraduationCap, Tag, LogIn } from 'lucide-react';

export function PublicDirectory() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getTeachers().then(data => {
      setTeachers(data);
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: 'var(--bg-color)' }}>
      <div style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>Loading Directory...</div>
    </div>
  );

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: 'var(--bg-color)', 
      padding: '2rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '3rem'
    }}>
      {/* Header */}
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        padding: '1.5rem 3rem',
        backgroundColor: 'var(--surface-color)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-md)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: 'var(--radius-lg)',
            background: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '1.25rem'
          }}>SE</div>
          <div>
            <h1 style={{ fontSize: '1.5rem', margin: 0, fontWeight: 700, color: 'var(--text-primary)' }}>SchoolEnterprise</h1>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Public Teacher Directory</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            onClick={() => navigate('/login')}
            className="btn btn-secondary" 
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem' }}
          >
            <LogIn size={18} /> Login
          </button>
          <button 
            onClick={() => navigate('/login?mode=signup')}
            className="btn btn-primary" 
            style={{ padding: '0.75rem 1.5rem' }}
          >
            Sign Up
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <div style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h2 style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2 }}>
          Meet Our Outstanding Educators
        </h2>
        <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          Discover the passionate individuals dedicated to shaping the future. Our diverse team of experts brings a wealth of knowledge and inspiration to every classroom.
        </p>
      </div>

      {/* Directory Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', 
        gap: '2rem',
        maxWidth: '1200px',
        margin: '0 auto',
        width: '100%'
      }}>
        {teachers.map(teacher => (
          <div key={teacher.id} className="card" style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '1.5rem',
            padding: '2rem',
            transition: 'transform 0.2s',
            cursor: 'default'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <img 
                src={teacher.avatar} 
                alt={teacher.name} 
                style={{ 
                  width: '80px', 
                  height: '80px', 
                  borderRadius: '50%', 
                  backgroundColor: 'var(--border-color)',
                  border: '4px solid white',
                  boxShadow: 'var(--shadow-sm)'
                }} 
              />
              <div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                  {teacher.name}
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-color)', fontWeight: 500 }}>
                  <GraduationCap size={16} /> {teacher.role}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', backgroundColor: 'var(--bg-color)', borderRadius: 'var(--radius-md)' }}>
              <Mail size={18} style={{ color: 'var(--text-secondary)' }} />
              <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{teacher.email}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: 'auto' }}>
              <h4 style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', fontWeight: 600 }}>Subjects</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {teacher.subjects?.map((sub, idx) => (
                  <span key={idx} className="badge" style={{ 
                    backgroundColor: 'white', 
                    border: '1px solid var(--border-color)', 
                    color: 'var(--text-primary)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.35rem',
                    padding: '0.4rem 0.75rem'
                  }}>
                    <Tag size={12} style={{ color: 'var(--primary-color)' }} /> {sub}
                  </span>
                ))}
              </div>
            </div>

          </div>
        ))}
      </div>
      
      {/* Footer */}
      <footer style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)', marginTop: '2rem', borderTop: '1px solid var(--border-color)' }}>
        &copy; {new Date().getFullYear()} SchoolEnterprise. All rights reserved.
      </footer>
    </div>
  );
}
