import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, Eye, ArrowUpRight, ArrowDownLeft, Home } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getTeachers } from '../services/mockData';

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  
  const [email, setEmail] = useState('amit.sharma@school.edu');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('mode') === 'signup') {
      setIsSignUp(true);
      setEmail('');
      setPassword('');
    }
  }, [location]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isSignUp) {
      if (!name) {
        setError('Name is required for sign up.');
        return;
      }
      // Mock sign up logic
      login({ 
        id: 'new-user', 
        name: name, 
        email, 
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`, 
        role: 'Class Teacher', 
        subjects: ['General'] 
      } as any);
      navigate('/app');
      return;
    }
    try {
      const teachers = await getTeachers();
      const input = email.trim().toLowerCase();
      const teacher = teachers.find(t => 
        (t.email.toLowerCase() === input || 
         (input === 'teacher' && (t.email.toLowerCase() === 'teacher@school.local' || t.id.toLowerCase() === 't6')) ||
         t.name.toLowerCase() === input) && 
        t.password === password
      );
      
      if (teacher) {
        login(teacher);
        navigate('/app');
      } else {
        setError('Invalid email or password');
      }
    } catch (err) {
      setError('Failed to connect to the server. Is it running?');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      backgroundColor: 'var(--bg-color)',
      padding: '1rem',
      gap: '1rem'
    }}>
      {/* Left Column - Form */}
      <div style={{ 
        flex: '1', 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '2rem 4rem',
        backgroundColor: 'var(--surface-color)',
        borderRadius: 'var(--radius-xl)'
      }}>
        {/* Header */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              SchoolEnterprise
            </h2>
            <button 
              onClick={() => navigate('/')}
              className="btn btn-secondary" 
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}
            >
              <Home size={18} /> Home
            </button>
          </div>
          
          <h1 style={{ fontSize: '3.5rem', fontWeight: 400, color: 'var(--text-primary)', lineHeight: '1.1', marginBottom: '1rem' }}>
            {isSignUp ? 'Create an Account' : <>Welcome to <br /> SchoolEnterprise</>}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '400px', marginBottom: '2rem' }}>
            Daily academic operations and teacher experience platform powered by modern technology.
          </p>
          
          {error && (
            <div style={{ color: 'red', marginBottom: '1rem', padding: '0.5rem', backgroundColor: '#fee2e2', borderRadius: '0.5rem' }}>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '400px' }}>
            {isSignUp && (
              <div style={{ position: 'relative' }}>
                <input 
                  type="text" 
                  required 
                  className="input-field w-full" 
                  placeholder="Full Name" 
                  style={{ paddingLeft: '1.25rem' }} 
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>
            )}
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary-color)' }} />
              <input 
                type="email" 
                required 
                className="input-field w-full" 
                placeholder="teacher@school.edu" 
                style={{ paddingLeft: '3rem' }} 
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>

            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input 
                type="password" 
                required 
                className="input-field w-full" 
                placeholder="Password" 
                style={{ paddingLeft: '3rem' }} 
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              <Eye size={18} style={{ position: 'absolute', right: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', cursor: 'pointer' }} />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem', marginTop: '0.5rem' }}>
              {isSignUp ? 'Sign Up' : 'Login'}
            </button>
            <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.95rem' }}>
              {isSignUp ? 'Already have an account?' : "Don't have an account?"} {' '}
              <span 
                style={{ color: 'var(--primary-color)', cursor: 'pointer', fontWeight: 600 }} 
                onClick={() => setIsSignUp(!isSignUp)}
              >
                {isSignUp ? 'Login' : 'Sign Up'}
              </span>
            </div>
            
          </form>
        </div>

        {/* Footer Card */}
        <div style={{ 
          marginTop: '4rem',
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          padding: '1rem 1.5rem',
          backgroundColor: 'var(--bg-color)',
          borderRadius: 'var(--radius-xl)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ display: 'flex' }}>
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px solid white', marginLeft: '-0px', backgroundColor: '#e2e8f0' }} />
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka" alt="User" style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px solid white', marginLeft: '-12px', backgroundColor: '#cbd5e1' }} />
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Jack" alt="User" style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px solid white', marginLeft: '-12px', backgroundColor: '#94a3b8' }} />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>Join with <span style={{ fontWeight: 700 }}>20k+ Users!</span></div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Let's see our happy teachers</div>
            </div>
          </div>
          <button className="btn-icon-circular">
            <ArrowUpRight size={20} />
          </button>
        </div>
      </div>

      {/* Right Column - Image & Glass Card */}
      <div style={{ 
        flex: '1', 
        borderRadius: 'var(--radius-xl)',
        backgroundImage: 'url("/bg-astronaut.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        padding: '2rem'
      }}>
        <div style={{ 
          position: 'absolute', 
          top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.2)' 
        }}></div>
        
        <h2 style={{ 
          position: 'absolute', 
          top: '3rem', 
          left: '3rem', 
          color: 'white', 
          fontSize: '2.5rem', 
          fontWeight: 300, 
          maxWidth: '500px',
          lineHeight: '1.2'
        }}>
          Revolutionizing the way we teach, grade, and experience school.
        </h2>

        {/* Glassmorphism Card */}
        <div className="glass" style={{
          padding: '2rem',
          borderRadius: 'var(--radius-xl)',
          width: '100%',
          zIndex: 10
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}>
               <div style={{ width: '48px', height: '48px', borderRadius: '50%', border: '1px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                 <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.2)' }}></div>
               </div>
               <div style={{
                 padding: '0.75rem 2.5rem',
                 borderRadius: '9999px',
                 border: '1px solid white',
                 color: 'white',
                 marginLeft: '-30px',
                 paddingLeft: '3rem'
               }}>
                 Managing
               </div>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn-icon-circular" style={{ borderColor: 'rgba(255,255,255,0.5)', color: 'white' }}>
                <ArrowDownLeft size={20} />
              </button>
              <button className="btn-icon-circular" style={{ borderColor: 'rgba(255,255,255,0.5)', color: 'white' }}>
                <ArrowUpRight size={20} />
              </button>
            </div>
          </div>
          
          <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '1.1rem', maxWidth: '500px', lineHeight: '1.6' }}>
            Create assignments, review attendance, and grade students effortlessly with our modern platform tailored for educators.
          </p>
        </div>
      </div>
    </div>
  );
}
