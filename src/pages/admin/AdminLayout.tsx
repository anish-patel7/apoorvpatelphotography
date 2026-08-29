import { useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, FolderOpen, Briefcase,
  GraduationCap, MessageSquareQuote, LogOut, Menu, X, ChevronRight, Film,
} from 'lucide-react';

const sidebarItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/leads', icon: Users, label: 'Leads / Inquiries' },
  { to: '/admin/portfolio', icon: FolderOpen, label: 'Portfolio' },
  { to: '/admin/services', icon: Briefcase, label: 'Services' },
  { to: '/admin/reels', icon: Film, label: 'Reels' },
  { to: '/admin/training', icon: GraduationCap, label: 'Training' },
  { to: '/admin/testimonials', icon: MessageSquareQuote, label: 'Testimonials' },
];

interface Props {
  children: ReactNode;
  onLogout: () => void;
}

export default function AdminLayout({ children, onLogout }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-background flex">
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-surface-container-low border-r border-outline-variant/20 transform transition-transform lg:translate-x-0 lg:static lg:block ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between p-4 border-b border-outline-variant/20">
          <h2 className="font-display text-lg text-on-surface">Admin</h2>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-on-surface-variant hover:text-on-surface">
            <X size={20} />
          </button>
        </div>

        <nav className="p-4 space-y-1">
          {sidebarItems.map(item => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-sm text-sm font-semibold transition-all ${
                isActive(item.to)
                  ? 'bg-tertiary/20 text-tertiary'
                  : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
              }`}
            >
              <item.icon size={18} />
              {item.label}
              {isActive(item.to) && <ChevronRight size={14} className="ml-auto" />}
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-outline-variant/20">
          <button
            onClick={onLogout}
            className="flex items-center gap-3 px-4 py-2.5 rounded-sm text-sm font-semibold text-on-surface-variant hover:bg-error/20 hover:text-error transition-all w-full"
          >
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <div className="flex-1 min-w-0">
        <header className="sticky top-0 z-30 bg-surface-container-low/95 backdrop-blur-sm border-b border-outline-variant/20 px-4 sm:px-6 py-4 flex items-center gap-4">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-on-surface-variant hover:text-on-surface">
            <Menu size={24} />
          </button>
          <h1 className="font-display text-xl font-semibold text-on-surface">Admin Dashboard</h1>
          <Link to="/" className="ml-auto text-sm text-tertiary hover:text-tertiary/80 font-semibold">← View Website</Link>
        </header>
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
