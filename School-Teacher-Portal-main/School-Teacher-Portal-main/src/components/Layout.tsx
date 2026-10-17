import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  CalendarCheck,
  ClipboardList,
  ClipboardCheck,
  BarChart3,
  LogOut,
  Bell,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function Layout() {
  const navigate = useNavigate();
  const { currentTeacher, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [logoutError, setLogoutError] = useState("");

  const handleLogout = async () => {
    setLogoutError("");
    try {
      await logout();
    } catch (error) {
      setLogoutError(error instanceof Error ? error.message : "Server logout failed.");
    } finally {
      navigate('/login');
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', position: 'relative' }}>
      {/* Mobile Overlay */}
      <div className={`mobile-overlay ${isSidebarOpen ? 'open' : ''}`} onClick={() => setIsSidebarOpen(false)}></div>

      {/* Sidebar */}
      <aside className={`sidebar-container ${isSidebarOpen ? 'open' : ''}`}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2.5rem', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold'
            }}>SE</div>
            <h2 className="sidebar-text" style={{ fontSize: '1.25rem', margin: 0 }}>School<br/>Enterprise</h2>
          </div>
          <button className="mobile-menu-btn btn-icon-circular" style={{ border: 'none' }} onClick={() => setIsSidebarOpen(false)}>
            <X size={24} />
          </button>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
          <NavLink onClick={() => setIsSidebarOpen(false)} to="/app" end className={({isActive}) => `btn btn-secondary ${isActive ? 'nav-link-active' : ''}`} style={{ border: 'none' }}>
            <LayoutDashboard size={20} /> <span className="sidebar-text">Dashboard</span>
          </NavLink>
          <NavLink onClick={() => setIsSidebarOpen(false)} to="/app/classes" className={({isActive}) => `btn btn-secondary ${isActive ? 'nav-link-active' : ''}`} style={{ border: 'none' }}>
            <Users size={20} /> <span className="sidebar-text">My Classes</span>
          </NavLink>
          <NavLink onClick={() => setIsSidebarOpen(false)} to="/app/subjects" className={({isActive}) => `btn btn-secondary ${isActive ? 'nav-link-active' : ''}`} style={{ border: 'none' }}>
            <BookOpen size={20} /> <span className="sidebar-text">My Subjects</span>
          </NavLink>
          <NavLink onClick={() => setIsSidebarOpen(false)} to="/app/attendance" className={({isActive}) => `btn btn-secondary ${isActive ? 'nav-link-active' : ''}`} style={{ border: 'none' }}>
            <CalendarCheck size={20} /> <span className="sidebar-text">Attendance</span>
          </NavLink>
          <NavLink onClick={() => setIsSidebarOpen(false)} to="/app/teaching-assignments" className={({isActive}) => `btn btn-secondary ${isActive ? 'nav-link-active' : ''}`} style={{ border: 'none' }}>
            <ClipboardList size={20} /> <span className="sidebar-text">My Assignments</span>
          </NavLink>
          <NavLink onClick={() => setIsSidebarOpen(false)} to="/app/assessments" className={({isActive}) => `btn btn-secondary ${isActive ? 'nav-link-active' : ''}`} style={{ border: 'none' }}>
            <ClipboardCheck size={20} /> <span className="sidebar-text">Exams & Assessments</span>
          </NavLink>
          <NavLink onClick={() => setIsSidebarOpen(false)} to="/app/reports" className={({isActive}) => `btn btn-secondary ${isActive ? 'nav-link-active' : ''}`} style={{ border: 'none' }}>
            <BarChart3 size={20} /> <span className="sidebar-text">Reports</span>
          </NavLink>
        </nav>

        {currentTeacher && (
          <div className="teacher-profile" style={{
            marginTop: 'auto',
            padding: '1rem',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <div aria-hidden="true" style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.1)', display: 'grid', placeItems: 'center', color: 'white' }}>
              {currentTeacher.fullName.slice(0, 1).toUpperCase()}
            </div>
            <div className="sidebar-text" style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ fontWeight: 600, fontSize: '0.875rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', color: 'white' }}>{currentTeacher.fullName}</div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>{currentTeacher.employeeId}</div>
            </div>
          </div>
        )}
        
        <button onClick={handleLogout} className="btn btn-secondary" style={{ marginTop: '1rem', width: '100%', border: 'none', color: 'var(--danger)' }}>
          <LogOut size={20} /> <span className="sidebar-text">Logout</span>
        </button>
      </aside>

      {/* Main Content Area */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', width: '100%', overflowX: 'hidden' }}>
        <header style={{
          height: '70px',
          padding: '0 2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'transparent'
        }}>
          <button className="mobile-menu-btn btn-icon-circular" style={{ border: 'none' }} onClick={() => setIsSidebarOpen(true)}>
            <Menu size={24} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginLeft: 'auto' }}>
            <button className="btn btn-secondary" style={{ padding: '0.5rem', borderRadius: '50%' }}>
              <Bell size={20} />
            </button>
          </div>
        </header>

        <div className="animate-fade-in main-content" style={{ padding: '2rem', flex: 1, overflowY: 'auto' }}>
          {logoutError && <p className="error" role="alert">{logoutError}</p>}
          <Outlet />
        </div>
      </main>

      <style>{`
        .active-nav {
          background-color: var(--primary-color) !important;
          color: white !important;
          box-shadow: var(--shadow-glow);
        }
      `}</style>
    </div>
  );
}
