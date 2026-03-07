import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Trophy, Heart, BarChart3, LogOut, Shield } from 'lucide-react';

export function AppLayout({ children }: { children: ReactNode }) {
  const { profile, signOut } = useAuth();
  const location = useLocation();

  const navItems = [
    { path: '/tippa', label: 'Tippa', icon: Trophy },
    { path: '/favoriter', label: 'Favoriter', icon: Heart },
    { path: '/resultat', label: 'Resultat', icon: BarChart3 },
    ...(profile?.is_admin ? [{ path: '/admin', label: 'Admin', icon: Shield }] : []),
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="container flex h-14 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-lg font-display font-bold text-gradient">DouzeBets</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:block">
              {profile?.nickname}
            </span>
            <button
              onClick={signOut}
              className="text-muted-foreground hover:text-foreground transition-colors p-2"
              title="Logga ut"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 container py-4 pb-20 md:pb-6">
        {children}
      </main>

      {/* Bottom nav (mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/90 backdrop-blur-xl md:hidden">
        <div className="flex justify-around py-2">
          {navItems.map(({ path, label, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 transition-colors ${
                isActive(path) ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Desktop sidebar nav */}
      <nav className="hidden md:flex fixed left-0 top-14 bottom-0 w-56 border-r border-border bg-background/50 flex-col p-4 gap-1">
        {navItems.map(({ path, label, icon: Icon }) => (
          <Link
            key={path}
            to={path}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium ${
              isActive(path)
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </Link>
        ))}
      </nav>

      {/* Desktop content offset */}
      <style>{`
        @media (min-width: 768px) {
          main { margin-left: 14rem; }
        }
      `}</style>
    </div>
  );
}
