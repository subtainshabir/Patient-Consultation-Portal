import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ShieldCheck, Lock, User as UserIcon, Eye, EyeOff, AlertCircle } from 'lucide-react';

import { authService } from '../services/authService';
import { useToast } from '../hooks/useToast';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { BrandLogo } from '../components/common/BrandLogo';
import { ApiError } from '../services/api';

const setupAdminSchema = z
  .object({
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters.')
      .max(50, 'Username cannot exceed 50 characters.')
      .regex(/^[a-zA-Z0-9_\-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens.'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters long.')
      .max(100, 'Password cannot exceed 100 characters.'),
    confirmPassword: z.string().min(1, 'Please confirm your password.'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

type SetupAdminFormData = z.infer<typeof setupAdminSchema>;

export const SetupAdminPage: React.FC = () => {
  const navigate = useNavigate();
  const { success, error: toastError, info } = useToast();

  const [isCheckingSetup, setIsCheckingSetup] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SetupAdminFormData>({
    resolver: zodResolver(setupAdminSchema),
    defaultValues: {
      username: '',
      password: '',
      confirmPassword: '',
    },
  });

  // Section 3: Lock setup if administrator already exists
  useEffect(() => {
    let isMounted = true;
    async function verifySetupState() {
      try {
        const res = await authService.getSetupStatus();
        if (!res.setup_required) {
          info('Administrator setup has already been completed.', 'Setup Locked');
          navigate('/login', { replace: true });
        }
      } catch {
        // If error checking status, allow display
      } finally {
        if (isMounted) {
          setIsCheckingSetup(false);
        }
      }
    }
    verifySetupState();
    return () => {
      isMounted = false;
    };
  }, [navigate, info]);

  const onSubmit = async (data: SetupAdminFormData) => {
    setApiError(null);
    try {
      await authService.setupAdmin({
        username: data.username,
        password: data.password,
      });
      success('Administrator account created successfully. Please sign in.', 'Setup Complete');
      navigate('/login', { replace: true });
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setApiError(err.message || 'Unable to create administrator account.');
      } else {
        setApiError('An unexpected error occurred while creating administrator.');
      }
      toastError('Failed to complete administrator setup.', 'Setup Error');
    }
  };

  if (isCheckingSetup) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="mt-3 text-xs text-slate-500 font-medium">Verifying system setup state...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden my-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 p-8 text-white relative">
        <div className="relative z-10 flex items-center justify-between">
          <BrandLogo size="md" variant="dark" />
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Initial Setup</span>
          </div>
        </div>

        <div className="mt-6 relative z-10">
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Create Administrator Account
          </h1>
          <p className="text-sm text-slate-300 mt-1 leading-relaxed">
            Welcome to the Patient Consultation Portal. Create the primary administrator account to configure master data, manage clinical personnel, and clinic settings.
          </p>
        </div>
      </div>

      {/* Form Container */}
      <div className="p-8 sm:p-10 bg-white">
        {apiError && (
          <div
            role="alert"
            className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3 animate-in fade-in"
          >
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-xs text-rose-900">Setup Error</p>
              <p className="text-xs text-rose-700 mt-0.5">{apiError}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          {/* Username */}
          <Input
            label="Username"
            id="username"
            placeholder="Choose an administrator username"
            required
            autoFocus
            leftElement={<UserIcon className="w-4 h-4" />}
            error={errors.username?.message}
            {...register('username')}
          />

          {/* Password */}
          <Input
            label="Password"
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Minimum 8 characters"
            required
            leftElement={<Lock className="w-4 h-4" />}
            rightElement={
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="p-1 text-slate-400 hover:text-slate-600 focus:outline-none"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
            error={errors.password?.message}
            {...register('password')}
          />

          {/* Confirm Password */}
          <Input
            label="Confirm Password"
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="Re-enter password to confirm"
            required
            leftElement={<Lock className="w-4 h-4" />}
            rightElement={
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="p-1 text-slate-400 hover:text-slate-600 focus:outline-none"
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />

          <div className="pt-3">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isSubmitting}
              className="w-full text-base font-semibold shadow-md bg-emerald-600 hover:bg-emerald-700"
            >
              {isSubmitting ? 'Creating Administrator...' : 'Create Administrator'}
            </Button>
          </div>

          <p className="text-center text-xs text-slate-500 pt-2">
            The password will be securely hashed with PBKDF2-HMAC-SHA256 before storage.
          </p>
        </form>
      </div>
    </div>
  );
};
