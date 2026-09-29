import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Users,
  UserPlus,
  Key,
  Power,
  Shield,
  Stethoscope,
  UserCheck,
  Search,
  AlertCircle,
  Eye,
  EyeOff,
  Lock,
  User as UserIcon,
  Mail,
  ShieldAlert,
  X,
} from 'lucide-react';

import { adminService } from '../../services/adminService';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ApiError } from '../../services/api';
import type { User, UserRole } from '../../types/user';
import { cn } from '../../utils/cn';

// ─── Zod Schemas ───

const createUserSchema = z
  .object({
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters.')
      .max(50, 'Username cannot exceed 50 characters.')
      .regex(/^[a-zA-Z0-9_\-]+$/, 'Only letters, numbers, underscores, and hyphens.'),
    role: z.enum(['ADMIN', 'DOCTOR', 'STAFF'] as const, {
      message: 'Please select a valid role.',
    }),
    full_name: z.string().optional(),
    email: z
      .string()
      .email('Please enter a valid email address.')
      .optional()
      .or(z.literal('')),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters long.')
      .max(100, 'Password cannot exceed 100 characters.'),
    confirmPassword: z.string().min(1, 'Please confirm the password.'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

type CreateUserFormData = z.infer<typeof createUserSchema>;

const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters long.')
      .max(100, 'Password cannot exceed 100 characters.'),
    confirmPassword: z.string().min(1, 'Please confirm the new password.'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export const AdminUsersPage: React.FC = () => {
  const { user: currentAdmin } = useAuth();
  const { success, error: toastError } = useToast();

  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [userToResetPassword, setUserToResetPassword] = useState<User | null>(null);
  const [userToToggleStatus, setUserToToggleStatus] = useState<User | null>(null);

  // Form password toggles
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [showCreateConfirmPassword, setShowCreateConfirmPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showResetConfirmPassword, setShowResetConfirmPassword] = useState(false);

  const [modalError, setModalError] = useState<string | null>(null);

  // ─── Fetch Users ───
  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await adminService.getUsers({
        search: searchQuery.trim() || undefined,
        role: selectedRole !== 'all' ? selectedRole : undefined,
        is_active:
          selectedStatus === 'active'
            ? true
            : selectedStatus === 'inactive'
            ? false
            : undefined,
      });
      setUsers(data);
    } catch {
      toastError('Unable to load users. Please check backend connection.', 'Fetch Error');
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedRole, selectedStatus, toastError]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // ─── Stats ───
  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter((u) => u.is_active).length;
    const admins = users.filter((u) => u.role === 'ADMIN' && u.is_active).length;
    const doctors = users.filter((u) => u.role === 'DOCTOR' && u.is_active).length;
    const staff = users.filter((u) => u.role === 'STAFF' && u.is_active).length;
    return { total, active, inactive: total - active, admins, doctors, staff };
  }, [users]);

  // Check if target user is the only active admin
  const isOnlyActiveAdmin = useCallback(
    (targetUserId: number) => {
      const activeAdmins = users.filter((u) => u.role === 'ADMIN' && u.is_active);
      return activeAdmins.length === 1 && activeAdmins[0].id === targetUserId;
    },
    [users]
  );

  // ─── Create User Form ───
  const {
    register: registerCreate,
    handleSubmit: handleCreateSubmit,
    reset: resetCreateForm,
    formState: { errors: createErrors, isSubmitting: isCreating },
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      username: '',
      role: 'DOCTOR',
      full_name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const [searchParams] = useSearchParams();
  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'new-doctor') {
      resetCreateForm({
        username: '',
        role: 'DOCTOR',
        full_name: '',
        email: '',
        password: '',
        confirmPassword: '',
      });
      setIsCreateModalOpen(true);
    } else if (action === 'new-staff') {
      resetCreateForm({
        username: '',
        role: 'STAFF',
        full_name: '',
        email: '',
        password: '',
        confirmPassword: '',
      });
      setIsCreateModalOpen(true);
    }
  }, [searchParams, resetCreateForm]);

  const onCreateUser = async (data: CreateUserFormData) => {
    setModalError(null);
    try {
      await adminService.createUser({
        username: data.username,
        role: data.role as UserRole,
        full_name: data.full_name?.trim() || undefined,
        email: data.email?.trim() || undefined,
        password: data.password,
      });
      success(`User account '${data.username}' created successfully.`, 'User Created');
      setIsCreateModalOpen(false);
      resetCreateForm();
      fetchUsers();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setModalError(err.message);
      } else {
        setModalError('Failed to create user account. Please check the entries.');
      }
      toastError('Could not create user account.', 'Creation Failed');
    }
  };

  // ─── Reset Password Form ───
  const {
    register: registerReset,
    handleSubmit: handleResetSubmit,
    reset: resetResetForm,
    formState: { errors: resetErrors, isSubmitting: isResetting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onResetPassword = async (data: ResetPasswordFormData) => {
    if (!userToResetPassword) return;
    setModalError(null);
    try {
      const res = await adminService.resetUserPassword(
        userToResetPassword.id,
        data.newPassword
      );
      success(res.message || 'Password has been updated.', 'Password Reset');
      setUserToResetPassword(null);
      resetResetForm();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setModalError(err.message);
      } else {
        setModalError('Failed to update password.');
      }
      toastError('Could not reset password.', 'Reset Failed');
    }
  };

  // ─── Toggle Status Handler ───
  const onConfirmToggleStatus = async () => {
    if (!userToToggleStatus) return;
    setModalError(null);
    const newStatus = !userToToggleStatus.is_active;

    try {
      await adminService.toggleUserStatus(userToToggleStatus.id, newStatus);
      success(
        `User '${userToToggleStatus.username}' has been ${
          newStatus ? 'activated' : 'deactivated'
        }.`,
        'Status Updated'
      );
      setUserToToggleStatus(null);
      fetchUsers();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setModalError(err.message);
        toastError(err.message, 'Action Blocked');
      } else {
        toastError('Failed to change user status.', 'Status Error');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* ─── PAGE HEADER ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              User Management
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Manage system administrators, doctors, and staff accounts with role-based access control.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="md"
            onClick={() => {
              setModalError(null);
              resetCreateForm();
              setIsCreateModalOpen(true);
            }}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            <span>Create User</span>
          </Button>
        </div>
      </div>

      {/* ─── SUMMARY CARDS ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Total Users
            </p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">{stats.total}</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Active Admins
            </p>
            <p className="text-2xl font-bold text-purple-700 mt-0.5">{stats.admins}</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 border border-purple-200 flex items-center justify-center">
            <Shield className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Active Doctors
            </p>
            <p className="text-2xl font-bold text-emerald-700 mt-0.5">{stats.doctors}</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center">
            <Stethoscope className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Active Staff
            </p>
            <p className="text-2xl font-bold text-blue-700 mt-0.5">{stats.staff}</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ─── FILTERS & SEARCH ─── */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by username, full name, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Role selector */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-medium">
            <span className="px-2 text-slate-400 hidden sm:inline">Role:</span>
            {['all', 'ADMIN', 'DOCTOR', 'STAFF'].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setSelectedRole(r)}
                className={cn(
                  'px-3 py-1.5 rounded-lg transition-all',
                  selectedRole === r
                    ? 'bg-white text-slate-900 font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                )}
              >
                {r === 'all' ? 'All Roles' : r}
              </button>
            ))}
          </div>

          {/* Status selector */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-medium">
            <span className="px-2 text-slate-400 hidden sm:inline">Status:</span>
            {['all', 'active', 'inactive'].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSelectedStatus(s)}
                className={cn(
                  'px-3 py-1.5 rounded-lg capitalize transition-all',
                  selectedStatus === s
                    ? 'bg-white text-slate-900 font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── USERS TABLE ─── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="mt-3 text-xs text-slate-500 font-medium">Loading user accounts...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="mt-3 text-sm font-semibold text-slate-800">No users found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchQuery || selectedRole !== 'all' || selectedStatus !== 'all'
                ? 'Try adjusting your search criteria or filters.'
                : 'Click "Create User" to add an administrator, doctor, or staff account.'}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3.5 px-4 sm:px-6">User</th>
                    <th className="py-3.5 px-4">Role</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 hidden md:table-cell">Created</th>
                    <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u) => {
                    const isSelf = currentAdmin?.id === u.id;
                    const onlyAdmin = isOnlyActiveAdmin(u.id);

                    return (
                      <tr
                        key={u.id}
                        className={cn(
                          'hover:bg-slate-50/80 transition-colors',
                          !u.is_active && 'bg-slate-50/40 text-slate-400'
                        )}
                      >
                        {/* User Info */}
                        <td className="py-3.5 px-4 sm:px-6">
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                'w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs uppercase',
                                u.role === 'ADMIN'
                                  ? 'bg-purple-100 text-purple-700 border border-purple-200'
                                  : u.role === 'DOCTOR'
                                  ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                  : 'bg-blue-100 text-blue-700 border border-blue-200'
                              )}
                            >
                              {u.username.slice(0, 2)}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-slate-900 truncate">
                                  {u.username}
                                </span>
                                {isSelf && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                    You
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-500 truncate">
                                {u.full_name} {u.email ? `• ${u.email}` : ''}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Role Badge */}
                        <td className="py-3.5 px-4">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold',
                              u.role === 'ADMIN'
                                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                : u.role === 'DOCTOR'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                            )}
                          >
                            {u.role === 'ADMIN' && <Shield className="w-3 h-3" />}
                            {u.role === 'DOCTOR' && <Stethoscope className="w-3 h-3" />}
                            {u.role === 'STAFF' && <UserCheck className="w-3 h-3" />}
                            <span>{u.role}</span>
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium',
                              u.is_active
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            )}
                          >
                            {u.is_active ? (
                              <>
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                Active
                              </>
                            ) : (
                              <>
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                Inactive
                              </>
                            )}
                          </span>
                        </td>

                        {/* Created Date */}
                        <td className="py-3.5 px-4 text-xs text-slate-500 hidden md:table-cell">
                          {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 sm:px-6 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Reset Password */}
                            <button
                              type="button"
                              onClick={() => {
                                setModalError(null);
                                resetResetForm();
                                setUserToResetPassword(u);
                              }}
                              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                              title={`Reset password for ${u.username}`}
                            >
                              <Key className="w-4 h-4" />
                            </button>

                            {/* Toggle Active / Deactivate */}
                            <button
                              type="button"
                              onClick={() => {
                                setModalError(null);
                                setUserToToggleStatus(u);
                              }}
                              disabled={onlyAdmin && u.is_active}
                              className={cn(
                                'p-1.5 rounded-lg transition-colors',
                                onlyAdmin && u.is_active
                                  ? 'text-slate-300 cursor-not-allowed'
                                  : u.is_active
                                  ? 'text-rose-600 hover:bg-rose-50'
                                  : 'text-emerald-600 hover:bg-emerald-50'
                              )}
                              title={
                                onlyAdmin && u.is_active
                                  ? 'Cannot deactivate the only active administrator'
                                  : u.is_active
                                  ? `Deactivate ${u.username}`
                                  : `Activate ${u.username}`
                              }
                            >
                              <Power className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View (Section 15) */}
            <div className="md:hidden divide-y divide-slate-100">
              {users.map((u) => {
                const isSelf = currentAdmin?.id === u.id;
                const onlyAdmin = isOnlyActiveAdmin(u.id);

                return (
                  <div key={u.id} className="p-4 space-y-3 bg-white">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs uppercase shrink-0',
                            u.role === 'ADMIN'
                              ? 'bg-purple-100 text-purple-700 border border-purple-200'
                              : u.role === 'DOCTOR'
                              ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                              : 'bg-blue-100 text-blue-700 border border-blue-200'
                          )}
                        >
                          {u.username.slice(0, 2)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-semibold text-slate-900 text-sm">
                              {u.username}
                            </span>
                            {isSelf && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                You
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 truncate">
                            {u.full_name}
                          </p>
                        </div>
                      </div>

                      <span
                        className={cn(
                          'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium shrink-0',
                          u.is_active
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        )}
                      >
                        {u.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 text-slate-500">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold',
                          u.role === 'ADMIN'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : u.role === 'DOCTOR'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        )}
                      >
                        {u.role === 'ADMIN' && <Shield className="w-3 h-3" />}
                        {u.role === 'DOCTOR' && <Stethoscope className="w-3 h-3" />}
                        {u.role === 'STAFF' && <UserCheck className="w-3 h-3" />}
                        <span>{u.role}</span>
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setModalError(null);
                            resetResetForm();
                            setUserToResetPassword(u);
                          }}
                          className="px-2.5 py-1 text-xs text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 flex items-center gap-1"
                        >
                          <Key className="w-3 h-3" />
                          <span>Reset</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setModalError(null);
                            setUserToToggleStatus(u);
                          }}
                          disabled={onlyAdmin && u.is_active}
                          className={cn(
                            'px-2.5 py-1 text-xs rounded-lg border flex items-center gap-1',
                            onlyAdmin && u.is_active
                              ? 'text-slate-300 border-slate-200 cursor-not-allowed'
                              : u.is_active
                              ? 'text-rose-600 bg-rose-50 border-rose-200 hover:bg-rose-100'
                              : 'text-emerald-600 bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
                          )}
                        >
                          <Power className="w-3 h-3" />
                          <span>{u.is_active ? 'Deactivate' : 'Activate'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* ─── CREATE USER MODAL ─── */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Create New User</h2>
                  <p className="text-xs text-slate-400">Set username, role, and initial password</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {modalError && (
                <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{modalError}</span>
                </div>
              )}

              <form onSubmit={handleCreateSubmit(onCreateUser)} className="space-y-4" noValidate>
                {/* Username */}
                <Input
                  label="Username"
                  id="create_username"
                  placeholder="e.g. doctor_ali or staff_reception"
                  required
                  leftElement={<UserIcon className="w-4 h-4" />}
                  error={createErrors.username?.message}
                  {...registerCreate('username')}
                />

                {/* Role Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    User Role <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="create_role"
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-slate-900"
                    {...registerCreate('role')}
                  >
                    <option value="DOCTOR">Doctor (Consultations, Prescriptions, Reports)</option>
                    <option value="STAFF">Staff (Patient Registration, Search)</option>
                    <option value="ADMIN">Administrator (Master Data, Settings, User Management)</option>
                  </select>
                  {createErrors.role && (
                    <p className="text-xs text-rose-600 mt-1">{createErrors.role.message}</p>
                  )}
                </div>

                {/* Full Name & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Full Name (Optional)"
                    id="create_full_name"
                    placeholder="e.g. Dr. John Doe"
                    error={createErrors.full_name?.message}
                    {...registerCreate('full_name')}
                  />
                  <Input
                    label="Email (Optional)"
                    id="create_email"
                    type="email"
                    placeholder="user@clinic.portal"
                    leftElement={<Mail className="w-4 h-4" />}
                    error={createErrors.email?.message}
                    {...registerCreate('email')}
                  />
                </div>

                {/* Password */}
                <Input
                  label="Initial Password"
                  id="create_password"
                  type={showCreatePassword ? 'text' : 'password'}
                  placeholder="Minimum 8 characters"
                  required
                  leftElement={<Lock className="w-4 h-4" />}
                  rightElement={
                    <button
                      type="button"
                      onClick={() => setShowCreatePassword((p) => !p)}
                      className="p-1 text-slate-400 hover:text-slate-600 focus:outline-none"
                      tabIndex={-1}
                    >
                      {showCreatePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                  error={createErrors.password?.message}
                  {...registerCreate('password')}
                />

                {/* Confirm Password */}
                <Input
                  label="Confirm Password"
                  id="create_confirmPassword"
                  type={showCreateConfirmPassword ? 'text' : 'password'}
                  placeholder="Re-enter password"
                  required
                  leftElement={<Lock className="w-4 h-4" />}
                  rightElement={
                    <button
                      type="button"
                      onClick={() => setShowCreateConfirmPassword((p) => !p)}
                      className="p-1 text-slate-400 hover:text-slate-600 focus:outline-none"
                      tabIndex={-1}
                    >
                      {showCreateConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                  error={createErrors.confirmPassword?.message}
                  {...registerCreate('confirmPassword')}
                />

                <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateModalOpen(false)}
                    disabled={isCreating}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    isLoading={isCreating}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    {isCreating ? 'Creating User...' : 'Create User'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ─── RESET PASSWORD MODAL ─── */}
      {userToResetPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Reset User Password</h2>
                  <p className="text-xs text-slate-400">
                    User: <span className="font-semibold text-white">{userToResetPassword.username}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setUserToResetPassword(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {modalError && (
                <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{modalError}</span>
                </div>
              )}

              <form onSubmit={handleResetSubmit(onResetPassword)} className="space-y-4" noValidate>
                {/* New Password */}
                <Input
                  label="New Password"
                  id="reset_newPassword"
                  type={showResetPassword ? 'text' : 'password'}
                  placeholder="Minimum 8 characters"
                  required
                  autoFocus
                  leftElement={<Lock className="w-4 h-4" />}
                  rightElement={
                    <button
                      type="button"
                      onClick={() => setShowResetPassword((p) => !p)}
                      className="p-1 text-slate-400 hover:text-slate-600 focus:outline-none"
                      tabIndex={-1}
                    >
                      {showResetPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                  error={resetErrors.newPassword?.message}
                  {...registerReset('newPassword')}
                />

                {/* Confirm New Password */}
                <Input
                  label="Confirm New Password"
                  id="reset_confirmPassword"
                  type={showResetConfirmPassword ? 'text' : 'password'}
                  placeholder="Re-enter new password"
                  required
                  leftElement={<Lock className="w-4 h-4" />}
                  rightElement={
                    <button
                      type="button"
                      onClick={() => setShowResetConfirmPassword((p) => !p)}
                      className="p-1 text-slate-400 hover:text-slate-600 focus:outline-none"
                      tabIndex={-1}
                    >
                      {showResetConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                  error={resetErrors.confirmPassword?.message}
                  {...registerReset('confirmPassword')}
                />

                <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setUserToResetPassword(null)}
                    disabled={isResetting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    isLoading={isResetting}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    {isResetting ? 'Updating...' : 'Update Password'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ─── TOGGLE STATUS CONFIRMATION MODAL ─── */}
      {userToToggleStatus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden p-6">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                  userToToggleStatus.is_active
                    ? 'bg-rose-50 text-rose-600 border border-rose-200'
                    : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                )}
              >
                <Power className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {userToToggleStatus.is_active ? 'Deactivate User Account' : 'Reactivate User Account'}
                </h3>
                <p className="text-xs text-slate-500">
                  User: <span className="font-semibold text-slate-800">{userToToggleStatus.username}</span> ({userToToggleStatus.role})
                </p>
              </div>
            </div>

            {isOnlyActiveAdmin(userToToggleStatus.id) && userToToggleStatus.is_active ? (
              <div className="my-4 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
                <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <p>
                  <strong>Admin Self-Protection:</strong> This is the only active administrator account.
                  You cannot deactivate it because the system requires at least one active administrator.
                </p>
              </div>
            ) : (
              <p className="text-xs text-slate-600 mt-4 leading-relaxed">
                {userToToggleStatus.is_active
                  ? `Are you sure you want to deactivate '${userToToggleStatus.username}'? When deactivated, this user will immediately be blocked from logging into the portal. Historical consultations and clinical records will remain completely intact.`
                  : `Are you sure you want to reactivate '${userToToggleStatus.username}'? This user will immediately be permitted to sign in.`}
              </p>
            )}

            <div className="mt-6 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setUserToToggleStatus(null)}
              >
                Cancel
              </Button>
              {(!isOnlyActiveAdmin(userToToggleStatus.id) || !userToToggleStatus.is_active) && (
                <Button
                  type="button"
                  variant={userToToggleStatus.is_active ? 'destructive' : 'primary'}
                  onClick={onConfirmToggleStatus}

                  className={
                    userToToggleStatus.is_active
                      ? 'bg-rose-600 hover:bg-rose-700 text-white'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }
                >
                  {userToToggleStatus.is_active ? 'Deactivate' : 'Reactivate'}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
