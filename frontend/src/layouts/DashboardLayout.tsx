import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Stethoscope,
  Menu,
  X,
  Bell,
  LogOut,
  User as UserIcon,
  ChevronDown,
  Shield,
  Settings,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { BrandLogo } from '../components/common/BrandLogo';
import { ThemeToggle } from '../components/common/ThemeToggle';
import { GlobalPatientSearch } from '../components/common/GlobalPatientSearch';
import { cn } from '../utils/cn';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

export const DashboardLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const { info, success } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const navigationItems: NavItem[] = React.useMemo(() => {
    if (user?.role === 'STAFF') {
      return [
        { name: 'Dashboard', href: '/staff/dashboard', icon: LayoutDashboard },
        { name: 'Patients', href: '/patients', icon: Users },
      ];
    }
    if (user?.role === 'ADMIN') {
      return [
        { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
        { name: 'Patients', href: '/patients', icon: Users },
        { name: 'Consultations', href: '/consultations', icon: Stethoscope },
        {
          name: 'Admin Portal',
          href: '/admin',
          icon: Shield,
          badge: 'Admin',
        },
      ];
    }
    // DOCTOR default
    return [
      { name: 'Dashboard', href: '/doctor/dashboard', icon: LayoutDashboard },
      { name: 'Patients', href: '/patients', icon: Users },
      { name: 'Consultations', href: '/consultations', icon: Stethoscope },
    ];
  }, [user?.role]);

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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col md:flex-row transition-colors">
      {/* ─── DESKTOP SIDEBAR ─── */}
      <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-slate-900 border-r border-slate-200/90 dark:border-slate-800 shadow-xs shrink-0 min-h-screen sticky top-0 h-screen z-20 transition-colors">
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <BrandLogo size="md" />
        </div>

        {/* User Info Subheader */}
        <div className="px-5 py-3 bg-slate-50/70 dark:bg-slate-850/60 border-b border-slate-100 dark:border-slate-800 transition-colors">
          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{user?.full_name || user?.username || 'Clinical User'}</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {user?.role === 'ADMIN'
              ? 'Administrator • Clinical Portal'
              : user?.role === 'STAFF'
              ? 'Clinic Staff • Outpatient Center'
              : 'Consultant Physician • Clinical Practice'}
          </p>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-3 overflow-y-auto space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.href}
                to={item.href}
                className={({ isActive }) =>
                  cn(
                    'flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group',
                    isActive
                      ? 'bg-medical-50 dark:bg-medical-950/60 text-medical-800 dark:text-medical-300 font-semibold shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon
                        className={cn(
                          'w-4 h-4 shrink-0 transition-colors',
                          isActive ? 'text-medical-600 dark:text-medical-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300'
                        )}
                      />
                      <span className="truncate">{item.name}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
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
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/40">
          <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-750 shadow-card dark:shadow-none">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-medical-100 dark:bg-medical-900/60 text-medical-700 dark:text-medical-300 flex items-center justify-center font-bold text-xs shrink-0">
                {user?.full_name ? user.full_name.charAt(0) : 'U'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {user?.full_name || 'Dr. Rauf'}
                </p>
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-medical-700 dark:text-medical-400">
                  <Shield className="w-2.5 h-2.5" />
                  {user?.role || 'DOCTOR'}
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
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
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Slide-in Panel */}
          <div
            className="fixed inset-y-0 left-0 w-4/5 max-w-xs bg-white dark:bg-slate-900 shadow-2xl flex flex-col z-10 transform transition-transform duration-300 ease-in-out animate-in slide-in-from-left"
            role="dialog"
            aria-label="Mobile Navigation"
          >
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <BrandLogo size="sm" />
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors touch-target"
                aria-label="Close navigation drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Clinic Info */}
            <div className="px-4 py-2.5 bg-slate-50/80 dark:bg-slate-850/80 border-b border-slate-100 dark:border-slate-800">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Dr. Rauf Neurology</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Rawalpindi, Pakistan</p>
            </div>

            {/* Nav Links */}
            <nav className="flex-1 p-3 overflow-y-auto space-y-1">
              {navigationItems.map((item) => {
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
                          ? 'bg-medical-50 dark:bg-medical-950/60 text-medical-800 dark:text-medical-300 font-semibold shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                      )
                    }
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                      <span>{item.name}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </nav>

            {/* User Session in Drawer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-medical-100 dark:bg-medical-900/60 text-medical-700 dark:text-medical-300 flex items-center justify-center font-bold text-xs">
                    {user?.full_name ? user.full_name.charAt(0) : 'U'}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {user?.full_name || user?.username || 'User'}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">{user?.role || 'DOCTOR'}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 text-xs font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 rounded-lg transition-colors"
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
        {/* TOP NAVIGATION / HEADER */}
        <header className="sticky top-0 z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200/80 dark:border-slate-800 px-4 sm:px-6 h-16 flex items-center justify-between gap-4 shadow-xs transition-colors">
          {/* Left: Mobile menu toggle & Branding / Context */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors touch-target"
              aria-label="Open mobile navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="md:hidden">
              <BrandLogo size="sm" showSubtitle={false} />
            </div>
            <div className="hidden lg:block">
              <span className="text-xs font-semibold uppercase tracking-wider text-medical-700 dark:text-medical-300 bg-medical-50 dark:bg-medical-950/60 border border-medical-200/60 dark:border-medical-800/60 px-2.5 py-1 rounded-full">
                Clinical Portal • Rawalpindi
              </span>
            </div>
          </div>

          {/* Center: Global Patient Search Bar */}
          <div className="flex-1 max-w-md mx-2 sm:mx-4">
            <GlobalPatientSearch placeholder="Search ID, Name, Mobile, CNIC... (Ctrl+K)" />
          </div>

          {/* Right: Theme Toggle, Notifications & Profile menu */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Global Theme Toggle */}
            <ThemeToggle />

            {/* Notification Placeholder */}
            <button
              type="button"
              onClick={handleNotificationClick}
              className="relative p-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors touch-target"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-medical-500 ring-2 ring-white dark:ring-slate-900" />
            </button>

            {/* Profile Dropdown */}
            <div className="relative" ref={profileMenuRef}>
              <button
                type="button"
                onClick={() => setIsProfileMenuOpen((prev) => !prev)}
                className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors touch-target"
                aria-haspopup="true"
                aria-expanded={isProfileMenuOpen}
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-medical-600 dark:bg-medical-500 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  {user?.full_name ? user.full_name.charAt(0) : 'R'}
                </div>
                <div className="hidden sm:flex flex-col text-left leading-tight">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate max-w-[120px]">
                    {user?.full_name || 'Dr. Rauf'}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">
                    {user?.role || 'DOCTOR'}
                  </span>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400 dark:text-slate-500 hidden sm:block" />
              </button>

              {/* Profile Menu Dropdown */}
              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl py-1.5 z-30 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3.5 py-2 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-xs font-bold text-slate-950 dark:text-slate-50">{user?.full_name || 'Dr. Rauf'}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{user?.email || 'doctor@neurology.pk'}</p>
                  </div>

                  <button
                    type="button"
                    onClick={handleProfileClick}
                    className="w-full px-3.5 py-2 text-left text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2.5 transition-colors"
                  >
                    <UserIcon className="w-4 h-4 text-slate-400" />
                    <span>Profile</span>
                  </button>

                  {user?.role !== 'STAFF' && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        navigate('/settings');
                      }}
                      className="w-full px-3.5 py-2 text-left text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2.5 transition-colors"
                    >
                      <Settings className="w-4 h-4 text-slate-400" />
                      <span>Settings</span>
                    </button>
                  )}

                  <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full px-3.5 py-2 text-left text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2.5 transition-colors"
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
