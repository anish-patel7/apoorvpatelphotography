import { useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, FolderOpen, Briefcase,
  GraduationCap, MessageSquareQuote, LogOut, Menu, X, ChevronRight, Film, Sun, Moon, Wrench,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

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
  /** Developer accounts only: link to the technical System Check page. */
  showSystemCheck?: boolean;
}

export default function AdminLayout({ children, onLogout, showSystemCheck = false }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();

  const basePath = location.pathname.startsWith('/admin/preview') ? '/admin/preview' : '/admin';
  const getHref = (to: string) => {
    if (basePath === '/admin/preview') {
      const sub = to.replace('/admin', '');
      return `${basePath}${sub}`;
    }
    return to;
  };

  const isActive = (itemTo: string) => {
    const fullTarget = getHref(itemTo);
    if (fullTarget === basePath) return location.pathname === basePath;
    return location.pathname.startsWith(fullTarget);
  };

  return (
    <div className="min-h-screen bg-background text-on-surface flex">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-surface-container-low border-r border-outline-variant/30 transform transition-transform duration-300 lg:translate-x-0 lg:static lg:block ${
          sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant/30">
          <div>
            <h2 className="font-display text-lg text-on-surface font-semibold tracking-wide">
              Apoorv Patel
            </h2>
            <p className="text-[11px] uppercase tracking-[0.15em] text-on-surface-variant font-medium">
              Admin Workspace
            </p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
            className="lg:hidden p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="p-3 space-y-1">
          {[...sidebarItems, ...(showSystemCheck ? [{ to: '/admin/system', icon: Wrench, label: 'System Check' }] : [])].map(item => {
            const active = isActive(item.to);
            return (
              <Link
                key={item.to}
                to={getHref(item.to)}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                  active
                    ? 'bg-tertiary/15 text-tertiary font-semibold border-l-2 border-tertiary pl-3'
                    : 'text-on-surface-variant hover:bg-surface-container/70 hover:text-on-surface font-medium'
                }`}
              >
                <item.icon size={18} className={active ? 'text-tertiary' : 'text-on-surface-variant'} />
                <span>{item.label}</span>
                {active && <ChevronRight size={14} className="ml-auto text-tertiary" />}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-outline-variant/30 bg-surface-container-low">
          <button
            onClick={onLogout}
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium text-on-surface-variant hover:bg-error/15 hover:text-error transition-all w-full"
          >
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 bg-surface-container-low/95 backdrop-blur-md border-b border-outline-variant/30 px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
              className="lg:hidden p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
            >
              <Menu size={22} />
            </button>
            <h1 className="font-display text-lg sm:text-xl font-semibold text-on-surface tracking-tight">
              Admin Portal
            </h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer border border-outline-variant/30"
              aria-label="Toggle theme"
              title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-tertiary hover:bg-tertiary/10 transition-colors border border-tertiary/30"
            >
              <span>← View Website</span>
            </Link>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
