import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileQuestion, Home, ArrowLeft } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';

export const NotFoundPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleReturn = () => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-navy-50 flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-md w-full bg-white rounded-2xl border border-navy-200 shadow-xl p-8 text-center flex flex-col items-center">
        <div className="w-16 h-16 rounded-2xl bg-medical-50 border border-medical-200 text-medical-600 flex items-center justify-center mb-6 shadow-sm">
          <FileQuestion className="w-8 h-8" />
        </div>
        <p className="text-xs font-bold uppercase tracking-widest text-medical-700 mb-1">
          404 Error
        </p>
        <h1 className="text-2xl font-bold text-navy-950 tracking-tight mb-2">
          Page not found
        </h1>
        <p className="text-sm text-navy-600 leading-relaxed mb-8">
          The page or clinical route you're looking for doesn't exist or may have been moved.
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            className="w-full sm:flex-1"
          >
            Go Back
          </Button>
          <Button
            variant="primary"
            onClick={handleReturn}
            leftIcon={<Home className="w-4 h-4" />}
            className="w-full sm:flex-1"
          >
            {isAuthenticated ? 'Dashboard' : 'Sign In'}
          </Button>
        </div>
      </div>
    </div>
  );
};
