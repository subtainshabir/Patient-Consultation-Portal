import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Eye, EyeOff, Lock, User as UserIcon, ShieldAlert, Award, MapPin, Activity } from 'lucide-react';

import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { authService } from '../services/authService';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { BrandLogo } from '../components/common/BrandLogo';
import { ApiError } from '../services/api';

const loginSchema = z.object({
  username_or_email: z
    .string()
    .min(1, 'Email or username is required.')
    .max(100, 'Username or email cannot exceed 100 characters.'),
  password: z
    .string()
    .min(1, 'Password is required.')
    .max(100, 'Password cannot exceed 100 characters.'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';

  // Section 2: Check if initial administrator setup is required
  useEffect(() => {
    let isMounted = true;
    async function checkSetup() {
      try {
        const res = await authService.getSetupStatus();
        if (res.setup_required && isMounted) {
          navigate('/setup', { replace: true });
        }
      } catch {
        // Fallback to normal login screen if check fails
      }
    }
    checkSetup();
    return () => {
      isMounted = false;
    };
  }, [navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username_or_email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setAuthError(null);
    try {
      const loggedInUser = await login(data);
      success('Authentication successful. Welcome to the portal.', 'Login Successful');

      // Section 5: Redirect according to the user's role
      if (loggedInUser.role === 'ADMIN') {
        navigate(from && from !== '/dashboard' && from !== '/login' ? from : '/admin/dashboard', { replace: true });
      } else if (loggedInUser.role === 'STAFF') {
        navigate(from && from !== '/dashboard' && from !== '/login' ? from : '/staff/dashboard', { replace: true });
      } else {
        navigate(from && from !== '/dashboard' && from !== '/login' ? from : '/doctor/dashboard', { replace: true });
      }
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setAuthError(err.message || 'Invalid username or password.');
      } else {
        setAuthError('Invalid username or password.');
      }
      toastError('Unable to sign in. Please verify your credentials.', 'Authentication Failed');
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-3xl border border-navy-200 shadow-2xl overflow-hidden my-4">
      <div className="grid grid-cols-1 md:grid-cols-2">
        {/* ─── LEFT COLUMN: CLINICAL BRANDING (Desktop) ─── */}
        <div className="bg-gradient-to-br from-medical-900 via-medical-800 to-navy-900 p-8 sm:p-12 text-white flex flex-col justify-between relative overflow-hidden">
          {/* Subtle neural background pattern */}
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <svg className="w-full h-full" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="100" cy="100" r="80" stroke="white" strokeWidth="2" strokeDasharray="6 6" />
              <circle cx="300" cy="200" r="120" stroke="white" strokeWidth="2" strokeDasharray="4 4" />
              <path d="M100 100L300 200" stroke="white" strokeWidth="2" />
              <circle cx="200" cy="320" r="60" stroke="white" strokeWidth="2" />
            </svg>
          </div>

          <div className="relative z-10">
            <BrandLogo size="lg" variant="dark" />

            <div className="mt-8 sm:mt-12 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-medical-500/20 border border-medical-400/30 text-medical-200 text-xs font-semibold uppercase tracking-wider">
                <Activity className="w-3.5 h-3.5" />
                Specialized Clinical Practice
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight text-white">
                Clinical Consultation & Prescription Management
              </h2>
              <p className="text-sm text-medical-100/90 leading-relaxed">
                A dedicated, secure platform designed for outpatient consultation, neurological examination, and prescription documentation.
              </p>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-medical-700/50 space-y-2 relative z-10">
            <div className="flex items-center gap-2 text-xs text-medical-100">
              <Award className="w-4 h-4 text-medical-300 shrink-0" />
              <span>Consultant Physician & Clinical Personnel</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-medical-100">
              <MapPin className="w-4 h-4 text-medical-300 shrink-0" />
              <span>Outpatient Medical Consultation Center</span>
            </div>
          </div>
        </div>

        {/* ─── RIGHT COLUMN: LOGIN FORM ─── */}
        <div className="p-8 sm:p-12 flex flex-col justify-center bg-white">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-navy-950 tracking-tight">Staff Sign In</h1>
            <p className="text-sm text-navy-500 mt-1">
              Authorized personnel only. Please sign in with your portal credentials.
            </p>
          </div>

          {/* Authentication Error Banner */}
          {authError && (
            <div
              role="alert"
              className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-2.5 animate-in fade-in"
            >
              <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="font-semibold text-xs text-rose-900">Sign In Error</p>
                <p className="text-xs text-rose-700 mt-0.5">{authError}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            {/* Username / Email Field */}
            <Input
              label="Username or Email"
              id="username_or_email"
              placeholder="Enter your username or email"
              required
              leftElement={<UserIcon className="w-4 h-4" />}
              error={errors.username_or_email?.message}
              {...register('username_or_email')}
            />

            {/* Password Field */}
            <Input
              label="Password"
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              required
              leftElement={<Lock className="w-4 h-4" />}
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="p-1 text-navy-400 hover:text-navy-600 focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
              error={errors.password?.message}
              {...register('password')}
            />

            {/* Submit Button */}
            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isSubmitting}
                className="w-full text-base font-semibold shadow-md"
              >
                {isSubmitting ? 'Signing in...' : 'Sign In'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

