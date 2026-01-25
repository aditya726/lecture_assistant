import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, User } from 'lucide-react';

export default function Layout({ children }) {
  const { user, logout, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return children;
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800">
      {/* Soft gradient blobs for depth */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="absolute top-1/3 -right-12 h-64 w-64 rounded-full bg-indigo-400/10 blur-3xl" />
      </div>

      {/* Glassy navbar */}
      <nav className="sticky top-0 z-20 backdrop-blur-xl bg-white/10 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link to="/" className="text-lg font-semibold tracking-tight text-white/90 hover:text-white transition-colors">
              AI Learning Platform
            </Link>
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 text-sm text-white/80">
                <User className="w-4 h-4" />
                <span className="truncate max-w-[200px]">{user?.email}</span>
              </div>
              <button
                onClick={logout}
                className="px-3 py-1.5 text-sm text-rose-200/90 hover:text-white hover:bg-rose-500/20 rounded-lg flex items-center gap-2 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="relative py-8">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/5 via-transparent to-transparent" />
        <div className="relative">
          {children}
        </div>
      </main>
    </div>
  );
}
