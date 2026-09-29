import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Activity,
  UserCheck,
  Stethoscope,
  FlaskConical,
  Pill,
  Clock,
  Scale,
  FileCheck,
  CalendarClock,
  Settings,
  Menu,
  X,
  LogOut,
  ShieldCheck,
  ExternalLink,
  ChevronRight,
  Users,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { ThemeToggle } from '../components/common/ThemeToggle';
import { cn } from '../utils/cn';

interface AdminNavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  shortName?: string;
}

const MASTER_DATA_NAV: AdminNavItem[] = [
  { name: 'Symptoms', href: '/admin/symptoms', icon: Activity },
  { name: 'Patient States', href: '/admin/patient-states', icon: UserCheck },
  { name: 'Medicines', href: '/admin/medicines', icon: Pill },
  { name: 'Frequencies', href: '/admin/frequencies', icon: Clock },
  { name: 'Dosages', href: '/admin/dosages', icon: Scale },
  { name: 'Instructions', href: '/admin/instructions', icon: FileCheck },
  { name: 'Diagnostic Tests', href: '/admin/diagnostic-tests', icon: FlaskConical },
  { name: 'Neurological Examinations', href: '/admin/neurological-examinations', icon: Stethoscope },
  { name: 'Follow-Up Options', href: '/admin/follow-ups', icon: CalendarClock },
];

export const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const { success } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile drawer on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Handle ESC key for mobile drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogout = async () => {
    await logout();
    success('Administrator logged out successfully.');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* ─── DESKTOP ADMIN SIDEBAR ─── */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-slate-200 border-r border-slate-800 shadow-xl shrink-0 min-h-screen sticky top-0 h-screen z-30">
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-sm shadow-inner">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                Admin Portal
              </div>
              <p className="text-[11px] text-slate-400">Master Data Control</p>
            </div>
          </div>
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 p-3 overflow-y-auto space-y-4 text-xs">
          {/* Main Dashboard */}
          <div className="space-y-1">
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Overview
            </p>
            <NavLink
              to="/admin/dashboard"
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium transition-all duration-150',
                  isActive
                    ? 'bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                )
              }
            >
              <LayoutDashboard className="w-4 h-4 text-emerald-400" />
              <span>Admin Dashboard</span>
            </NavLink>
            <NavLink
              to="/admin/users"
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium transition-all duration-150',
                  isActive
                    ? 'bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                )
              }
            >
              <Users className="w-4 h-4 text-emerald-400" />
              <span>User Management</span>
            </NavLink>
          </div>


          {/* Master Data Dropdown Management */}
          <div className="space-y-1">
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Master Data Dropdowns
            </p>
            {MASTER_DATA_NAV.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.href}
                  to={item.href}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center justify-between px-3.5 py-2 rounded-xl font-medium transition-all duration-150',
                      isActive
                        ? 'bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30 shadow-sm'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                    )
                  }
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="truncate">{item.name}</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 opacity-60" />
                </NavLink>
              );
            })}
          </div>

          {/* System & Clinic Configuration */}
          <div className="space-y-1">
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Settings & Report
            </p>
            <NavLink
              to="/admin/settings"
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium transition-all duration-150',
                  isActive
                    ? 'bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                )
              }
            >
              <Settings className="w-4 h-4 text-slate-400" />
              <span>Doctor / Clinic Settings</span>
            </NavLink>
          </div>
        </nav>

        {/* Footer: Doctor Portal Link & Admin Profile */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60 space-y-2">
          {/* Switch to Doctor Portal Link */}
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-800/70 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-medium transition-colors border border-slate-700/60"
            title="Open clinical doctor-facing consultation workspace"
          >
            <div className="flex items-center gap-2">
              <Stethoscope className="w-3.5 h-3.5 text-medical-400" />
              <span>Doctor Portal</span>
            </div>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </button>

          {/* Admin User Profile */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 border border-emerald-500/30">
                {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'A'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white truncate">
                  {user?.full_name || 'System Admin'}
                </p>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400">
                  <ShieldCheck className="w-2.5 h-2.5" />
                  ADMIN
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ─── MOBILE DRAWER & BACKDROP ─── */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <div
            className="fixed inset-y-0 left-0 w-4/5 max-w-xs bg-slate-900 text-slate-200 shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200"
            role="dialog"
            aria-label="Admin Navigation"
          >
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs border border-emerald-500/30">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                    Admin Portal
                  </p>
                  <p className="text-[10px] text-slate-400">Master Data Control</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-lg"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 p-3 overflow-y-auto space-y-3 text-xs">
              <NavLink
                to="/admin/dashboard"
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium transition-colors',
                    isActive
                      ? 'bg-emerald-500/20 text-emerald-300 font-semibold'
                      : 'text-slate-300 hover:bg-slate-800'
                  )
                }
              >
                <LayoutDashboard className="w-4 h-4 text-emerald-400" />
                <span>Admin Dashboard</span>
              </NavLink>

              <NavLink
                to="/admin/users"
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium transition-colors',
                    isActive
                      ? 'bg-emerald-500/20 text-emerald-300 font-semibold'
                      : 'text-slate-300 hover:bg-slate-800'
                  )
                }
              >
                <Users className="w-4 h-4 text-emerald-400" />
                <span>User Management</span>
              </NavLink>

              <div className="pt-2 border-t border-slate-800 space-y-1">

                <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Master Data Dropdowns
                </p>
                {MASTER_DATA_NAV.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.href}
                      to={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-3 px-3.5 py-2 rounded-xl font-medium transition-colors',
                          isActive
                            ? 'bg-emerald-500/20 text-emerald-300 font-semibold'
                            : 'text-slate-300 hover:bg-slate-800'
                        )
                      }
                    >
                      <Icon className="w-4 h-4 text-slate-400" />
                      <span>{item.name}</span>
                    </NavLink>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-slate-800 space-y-1">
                <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Settings
                </p>
                <NavLink
                  to="/admin/settings"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium transition-colors',
                      isActive
                        ? 'bg-emerald-500/20 text-emerald-300 font-semibold'
                        : 'text-slate-300 hover:bg-slate-800'
                    )
                  }
                >
                  <Settings className="w-4 h-4 text-slate-400" />
                  <span>Doctor / Clinic Settings</span>
                </NavLink>
              </div>
            </nav>

            <div className="p-3 border-t border-slate-800 bg-slate-950/80 space-y-2">
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  navigate('/dashboard');
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-medium"
              >
                <div className="flex items-center gap-2">
                  <Stethoscope className="w-3.5 h-3.5 text-medical-400" />
                  <span>Switch to Doctor Portal</span>
                </div>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MAIN CONTENT AREA ─── */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-xs px-4 sm:px-6 py-3 flex items-center justify-between transition-colors">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg md:hidden touch-target"
              aria-label="Open navigation drawer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-slate-900 dark:text-slate-100">Admin Portal</span>
              <span>/</span>
              <span className="capitalize text-slate-600 dark:text-slate-300 font-medium">
                {location.pathname.replace('/admin/', '').replace('/admin', 'Dashboard').replace('-', ' ')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Global Theme Toggle */}
            <ThemeToggle />

            {/* Quick Switch to Doctor Workspace */}
            <button
              onClick={() => navigate('/dashboard')}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors"
            >
              <Stethoscope className="w-3.5 h-3.5 text-medical-600 dark:text-medical-400" />
              <span>Doctor Portal</span>
            </button>

            {/* Admin Badge */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Administrator</span>
            </div>
          </div>
        </header>

        {/* Page Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
