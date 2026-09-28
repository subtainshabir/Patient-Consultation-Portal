import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Stethoscope,
  Pill,
  ClipboardList,
  FlaskConical,
  Brain,
  Settings,
  Menu,
  X,
  Bell,
  LogOut,
  User as UserIcon,
  ChevronDown,
  Shield,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { BrandLogo } from '../components/common/BrandLogo';
import { cn } from '../utils/cn';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const NAVIGATION_ITEMS: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Patients', href: '/patients', icon: Users, badge: 'Phase 2' },
  { name: 'Consultations', href: '/consultations', icon: Stethoscope, badge: 'Phase 3' },
  { name: 'Medicines', href: '/medicines', icon: Pill },
  { name: 'Symptoms', href: '/symptoms', icon: ClipboardList },
  { name: 'Diagnostic Tests', href: '/diagnostic-tests', icon: FlaskConical },
  { name: 'Neurological Examination', href: '/neurological-examination', icon: Brain },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export const DashboardLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const { info, success } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Close mobile drawer on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Handle ESC key for mobile drawer & profile menu
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false);
        setIsProfileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    success('Logged out successfully.');
    navigate('/login');
  };

  const handleNotificationClick = () => {
    info('No new notifications.', 'Clinic Alerts');
  };

  const handleProfileClick = () => {
    setIsProfileMenuOpen(false);
    info(`Logged in as ${user?.full_name} (${user?.role})`, 'User Profile');
  };

  return (
    <div className="min-h-screen bg-navy-50 flex flex-col md:flex-row">
      {/* ─── DESKTOP SIDEBAR ─── */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-navy-200/90 shadow-sm shrink-0 min-h-screen sticky top-0 h-screen z-20">
        {/* Brand Header */}
        <div className="p-5 border-b border-navy-100 flex items-center justify-between">
          <BrandLogo size="md" />
        </div>

        {/* Doctor Info Subheader */}
        <div className="px-5 py-3 bg-navy-50/60 border-b border-navy-100/80">
          <p className="text-xs font-semibold text-navy-800">Dr. Rauf</p>
          <p className="text-[11px] text-navy-500">Consultant Neurologist • Rawalpindi</p>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-3 overflow-y-auto space-y-1">
          {NAVIGATION_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.href}
                to={item.href}
                className={({ isActive }) =>
                  cn(
                    'flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group',
                    isActive
                      ? 'bg-medical-50 text-medical-800 font-semibold shadow-sm'
                      : 'text-navy-600 hover:text-navy-950 hover:bg-navy-50'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon
                        className={cn(
                          'w-4 h-4 shrink-0 transition-colors',
                          isActive ? 'text-medical-600' : 'text-navy-400 group-hover:text-navy-700'
                        )}
                      />
                      <span className="truncate">{item.name}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-navy-100 text-navy-500">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* User Card at Bottom of Sidebar */}
        <div className="p-3 border-t border-navy-100 bg-navy-50/40">
          <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-navy-200/80 shadow-card">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-medical-100 text-medical-700 flex items-center justify-center font-bold text-xs shrink-0">
                {user?.full_name ? user.full_name.charAt(0) : 'U'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-navy-900 truncate">
                  {user?.full_name || 'Dr. Rauf'}
                </p>
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-medical-700">
                  <Shield className="w-2.5 h-2.5" />
                  {user?.role || 'DOCTOR'}
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 text-navy-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
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
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-navy-950/50 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Slide-in Panel */}
          <div
            className="fixed inset-y-0 left-0 w-4/5 max-w-xs bg-white shadow-2xl flex flex-col z-10 transform transition-transform duration-300 ease-in-out animate-in slide-in-from-left"
            role="dialog"
            aria-label="Mobile Navigation"
          >
            {/* Drawer Header */}
            <div className="p-4 border-b border-navy-100 flex items-center justify-between">
              <BrandLogo size="sm" />
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 text-navy-400 hover:text-navy-700 hover:bg-navy-100 rounded-lg transition-colors touch-target"
                aria-label="Close navigation drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Clinic Info */}
            <div className="px-4 py-2.5 bg-navy-50/80 border-b border-navy-100">
              <p className="text-xs font-semibold text-navy-800">Dr. Rauf Neurology</p>
              <p className="text-[11px] text-navy-500">Rawalpindi, Pakistan</p>
            </div>

            {/* Nav Links */}
            <nav className="flex-1 p-3 overflow-y-auto space-y-1">
              {NAVIGATION_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition-colors touch-target',
                        isActive
                          ? 'bg-medical-50 text-medical-800 font-semibold shadow-sm'
                          : 'text-navy-600 hover:text-navy-950 hover:bg-navy-50'
                      )
                    }
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5 text-navy-400" />
                      <span>{item.name}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-navy-100 text-navy-600">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </nav>

            {/* User Session in Drawer */}
            <div className="p-4 border-t border-navy-100 bg-navy-50/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-medical-100 text-medical-700 flex items-center justify-center font-bold text-xs">
                    {user?.full_name ? user.full_name.charAt(0) : 'U'}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-navy-900 truncate">
                      {user?.full_name || 'Dr. Rauf'}
                    </p>
                    <p className="text-[10px] text-navy-500">{user?.role || 'DOCTOR'}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 text-xs font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── MAIN APP WRAPPER ─── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* TOP NAVIGATION / HEADER (Section 9) */}
        <header className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-navy-200/80 px-4 sm:px-6 h-16 flex items-center justify-between gap-4 shadow-sm">
          {/* Left: Mobile menu toggle & Branding / Context */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 text-navy-600 hover:text-navy-950 hover:bg-navy-100 rounded-lg transition-colors touch-target"
              aria-label="Open mobile navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="md:hidden">
              <BrandLogo size="sm" showSubtitle={false} />
            </div>
            <div className="hidden md:block">
              <span className="text-xs font-semibold uppercase tracking-wider text-medical-700 bg-medical-50 border border-medical-200/60 px-2.5 py-1 rounded-full">
                Clinical Portal • Rawalpindi
              </span>
            </div>
          </div>

          {/* Right: Notifications & Profile menu */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Notification Placeholder */}
            <button
              type="button"
              onClick={handleNotificationClick}
              className="relative p-2 text-navy-500 hover:text-navy-700 hover:bg-navy-100 rounded-lg transition-colors touch-target"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-medical-500 ring-2 ring-white" />
            </button>

            {/* Profile Dropdown (Section 9) */}
            <div className="relative" ref={profileMenuRef}>
              <button
                type="button"
                onClick={() => setIsProfileMenuOpen((prev) => !prev)}
                className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-2 text-navy-700 hover:bg-navy-100 rounded-xl transition-colors touch-target"
                aria-haspopup="true"
                aria-expanded={isProfileMenuOpen}
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-medical-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                  {user?.full_name ? user.full_name.charAt(0) : 'R'}
                </div>
                <div className="hidden sm:flex flex-col text-left leading-tight">
                  <span className="text-xs font-bold text-navy-900 truncate max-w-[120px]">
                    {user?.full_name || 'Dr. Rauf'}
                  </span>
                  <span className="text-[10px] text-navy-500 uppercase font-semibold">
                    {user?.role || 'DOCTOR'}
                  </span>
                </div>
                <ChevronDown className="w-4 h-4 text-navy-400 hidden sm:block" />
              </button>

              {/* Profile Menu Dropdown */}
              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl border border-navy-200 shadow-xl py-1.5 z-30 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3.5 py-2 border-b border-navy-100">
                    <p className="text-xs font-bold text-navy-950">{user?.full_name || 'Dr. Rauf'}</p>
                    <p className="text-[11px] text-navy-500 truncate">{user?.email || 'doctor@neurology.pk'}</p>
                  </div>

                  <button
                    type="button"
                    onClick={handleProfileClick}
                    className="w-full px-3.5 py-2 text-left text-xs text-navy-700 hover:bg-navy-50 flex items-center gap-2.5 transition-colors"
                  >
                    <UserIcon className="w-4 h-4 text-navy-400" />
                    <span>Profile</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      navigate('/settings');
                    }}
                    className="w-full px-3.5 py-2 text-left text-xs text-navy-700 hover:bg-navy-50 flex items-center gap-2.5 transition-colors"
                  >
                    <Settings className="w-4 h-4 text-navy-400" />
                    <span>Settings</span>
                  </button>

                  <div className="my-1 border-t border-navy-100" />

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full px-3.5 py-2 text-left text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors"
                  >
                    <LogOut className="w-4 h-4 text-rose-500" />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* MAIN OUTLET CONTAINER */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
