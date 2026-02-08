import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, User, Moon, Sun } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export default function Layout({ children }) {
  const { user, logout, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();

  if (!isAuthenticated) {
    return children;
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Subtle decorative blobs, dimmed for readability */}
      <div className="pointer-events-none absolute inset-0 opacity-30 dark:opacity-20">
        <div className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-accent/20 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute top-1/3 -right-12 h-64 w-64 rounded-full bg-secondary/20 blur-3xl" />
      </div>

      {/* Glassy navbar */}
      <nav className="sticky top-0 z-20 backdrop-blur-xl bg-card/70 dark:bg-card/60 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link to="/" className="text-lg font-semibold tracking-tight text-foreground hover:text-muted-foreground transition-colors" style={{fontFamily:'Gloria Hallelujah'}}>
              Tutor Lab
            </Link>
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 text-sm text-foreground">
                <User className="w-4 h-4" />
                <span className="truncate max-w-[200px]">{user?.email}</span>
              </div>
              <button
                onClick={toggleTheme}
                className="px-3 py-1.5 text-sm rounded-lg flex items-center gap-2 transition-colors border border-input bg-card text-foreground hover:bg-card/80"
                aria-label="Toggle theme"
                title={theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                {theme === 'dark' ? 'Light' : 'Dark'}
              </button>
              <button
                onClick={logout}
                className="px-3 py-1.5 text-sm rounded-lg flex items-center gap-2 transition-colors border border-input bg-destructive/10 text-destructive hover:bg-destructive/20"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="relative py-8">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-muted/30 via-transparent to-transparent" />
        <div className="relative">
          {children}
        </div>
      </main>
    </div>
  );
}
