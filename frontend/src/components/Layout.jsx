import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, User, Moon, Sun, BookOpen, ScanLine, LayoutDashboard } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export default function Layout({ children }) {
  const { user, logout, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  // Landing page manages its own full-page layout (with its own nav)
  // so we ALWAYS pass through at "/" — for both auth and unauth users
  if (!isAuthenticated || location.pathname === '/') {
    return children;
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Decorative ambient blobs */}
      <div className="pointer-events-none absolute inset-0 opacity-20 dark:opacity-15">
        <div className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-[#d97757]/15 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-[#7ea389]/12 blur-3xl" />
        <div className="absolute top-1/3 -right-12 h-64 w-64 rounded-full bg-[#b89b67]/10 blur-3xl" />
      </div>

      {/* App Navbar — only for authenticated inner pages */}
      <nav
        className="sticky top-0 z-50 backdrop-blur-xl border-b"
        style={{
          background: 'rgba(17, 19, 21, 0.9)',
          borderColor: 'rgba(255,255,255,0.07)',
        }}
        role="navigation"
        aria-label="App navigation"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">

            {/* Left: Logo + links */}
            <div className="flex items-center gap-6">
              <Link
                to="/"
                className="flex items-center gap-2 text-white font-semibold text-sm tracking-tight hover:opacity-80 transition-opacity"
                id="app-nav-logo"
              >
                <span
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    background: '#d97757',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <BookOpen size={14} color="white" />
                </span>
                Lecture Assistant
              </Link>

              <div
                className="hidden md:flex items-center gap-1"
                style={{ borderLeft: '1px solid rgba(255,255,255,0.08)', paddingLeft: 20 }}
              >
                <NavLink to="/workspace" icon={<LayoutDashboard size={14} />} label="Workspace" active={location.pathname === '/workspace'} />
                <NavLink to="/notes" icon={<BookOpen size={14} />} label="Notes" active={location.pathname === '/notes'} />
                <NavLink to="/scanner" icon={<ScanLine size={14} />} label="Smart Scanner" active={location.pathname === '/scanner'} />
              </div>
            </div>

            {/* Right: user info + actions */}
            <div className="flex items-center gap-2">
              {/* User email */}
              <div
                className="hidden sm:flex items-center gap-2 text-xs font-medium"
                style={{ color: 'rgba(148,163,184,0.8)' }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: '#d97757',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 11,
                    fontWeight: 700,
                    color: 'white',
                    flexShrink: 0,
                  }}
                >
                  {user?.email?.[0]?.toUpperCase() || 'U'}
                </div>
                <span className="truncate max-w-[160px]">{user?.email}</span>
              </div>

              {/* Theme toggle */}
              <button
                id="theme-toggle-btn"
                onClick={toggleTheme}
                aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '5px 10px',
                  borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.09)',
                  background: 'rgba(255,255,255,0.04)',
                  color: 'rgba(148,163,184,0.85)',
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'background 0.2s, color 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#e2e8f0'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'rgba(148,163,184,0.85)'; }}
              >
                {theme === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
                <span className="hidden sm:inline">{theme === 'dark' ? 'Light' : 'Dark'}</span>
              </button>

              {/* Logout */}
              <button
                id="logout-btn"
                onClick={logout}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '5px 12px',
                  borderRadius: 8,
                  border: '1px solid rgba(239,68,68,0.2)',
                  background: 'rgba(239,68,68,0.08)',
                  color: '#f87171',
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.15)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
              >
                <LogOut size={13} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="relative">
        {children}
      </main>
    </div>
  );
}

/* ── Inner nav link helper ── */
function NavLink({ to, icon, label, active }) {
  return (
    <Link
      to={to}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '5px 12px',
        borderRadius: 8,
        fontSize: 13,
        fontWeight: 500,
        textDecoration: 'none',
        transition: 'background 0.15s, color 0.15s',
        background: active ? 'rgba(217,119,87,0.14)' : 'transparent',
        color: active ? '#f0b39e' : 'rgba(148,163,184,0.8)',
        border: active ? '1px solid rgba(217,119,87,0.28)' : '1px solid transparent',
      }}
    >
      {icon}
      {label}
    </Link>
  );
}
