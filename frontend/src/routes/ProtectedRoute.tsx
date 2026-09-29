import React from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { SkeletonCard } from '../components/ui/LoadingSkeleton';
import { Button } from '../components/ui/Button';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-navy-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          <SkeletonCard className="p-8" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role restriction if specified
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    const getDashboardPath = () => {
      if (user.role === 'ADMIN') return '/admin/dashboard';
      if (user.role === 'STAFF') return '/staff/dashboard';
      return '/doctor/dashboard';
    };

    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-rose-200 shadow-xl p-8 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto shadow-sm">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
              403 • Access Denied
            </span>
            <h1 className="text-xl font-bold text-navy-950">
              Access Restricted
            </h1>
            <p className="text-sm text-navy-600 leading-relaxed">
              Your account <strong>{user.full_name}</strong> with role <strong>{user.role}</strong> does not have permission to access this page.
            </p>
            <p className="text-xs text-navy-500">
              Each portal is strictly role-isolated. Please use your assigned workspace dashboard.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              variant="primary"
              onClick={() => navigate(getDashboardPath(), { replace: true })}
              className="w-full sm:w-auto flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Go to My Dashboard</span>
            </Button>
            <Button
              variant="outline"
              onClick={async () => {
                await logout();
                navigate('/login');
              }}
              className="w-full sm:w-auto flex items-center justify-center gap-2 text-rose-600 border-rose-200 hover:bg-rose-50"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
