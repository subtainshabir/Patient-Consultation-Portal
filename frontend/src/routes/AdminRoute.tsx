import React from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';

interface AdminRouteProps {
  children?: React.ReactNode;
}

export const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-navy-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-medical-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-navy-600">Verifying administrator authorization...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Strict check: only ADMIN role allowed
  if (user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-rose-200 shadow-xl p-8 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto shadow-sm">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
              403 • Forbidden
            </span>
            <h1 className="text-xl font-bold text-navy-950">
              Administrator Access Required
            </h1>
            <p className="text-sm text-navy-600 leading-relaxed">
              Your account <strong>{user.full_name}</strong> has role <strong>{user.role}</strong> and is not authorized to access the Admin Portal.
            </p>
            <p className="text-xs text-navy-500">
              The Admin Portal is protected and restricted to authorized administrators for managing clinical master data and system settings.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              variant="primary"
              onClick={() => navigate('/dashboard')}
              className="w-full sm:w-auto flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Doctor Portal</span>
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

  return children ? <>{children}</> : null;
};
