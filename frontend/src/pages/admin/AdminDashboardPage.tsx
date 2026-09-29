import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Stethoscope,
  ClipboardList,
  ShieldCheck,
  UserCheck,
  UserX,
  Pill,
  Activity,
  FlaskConical,
  Settings,
  UserPlus,
  RefreshCw,
  Clock,
  ArrowRight,
  AlertCircle,
  CalendarCheck,
} from 'lucide-react';

import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { dashboardService } from '../../services/dashboardService';
import { useToast } from '../../hooks/useToast';
import type { AdminDashboardData } from '../../types/dashboard';
import { cn } from '../../utils/cn';

export const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { error: toastError } = useToast();
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const fetchDashboard = async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const result = await dashboardService.getAdminDashboard();
      setData(result);
    } catch {
      setHasError(true);
      toastError('Unable to load dashboard data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* ─── PAGE HEADER & CONTROLS ─── */}
      <PageHeader
        title="Admin Portal Dashboard"
        description="Real-time system administration, clinical master data registry, user access, and system activities."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchDashboard}
              disabled={isLoading}
              className="flex items-center gap-1.5"
            >
              <RefreshCw className={cn('w-3.5 h-3.5', isLoading && 'animate-spin')} />
              <span>Refresh</span>
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/admin/settings')}
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Clinic Settings</span>
            </Button>
          </div>
        }
      />

      {/* ─── LOADING STATE ─── */}
      {isLoading && (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="w-10 h-10 border-4 border-emerald-600 dark:border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Loading dashboard...</p>
        </div>
      )}

      {/* ─── ERROR STATE ─── */}
      {!isLoading && hasError && (
        <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-rose-200 dark:border-rose-900 shadow-2xs space-y-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Unable to load dashboard data.</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              The system could not retrieve the administrative metrics. Please check connection and try again.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchDashboard}>
            Retry
          </Button>
        </div>
      )}

      {/* ─── REAL DATABASE DASHBOARD CONTENT ─── */}
      {!isLoading && !hasError && data && (
        <>
          {/* 1. TOP SUMMARY CARDS (8 Core System Metrics) */}
          <section aria-label="System Summary Cards">
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
              {/* Total Patients */}
              <Card className="border-slate-200/90 dark:border-slate-800 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
                <CardContent className="p-4 sm:p-5 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Total Patients
                    </p>
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 mt-1 tracking-tight">
                      {data.total_patients}
                    </h3>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">In clinical registry</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300 border border-blue-100 dark:border-blue-800/60 shrink-0">
                    <Users className="w-5 h-5" />
                  </div>
                </CardContent>
              </Card>

              {/* Total Consultations */}
              <Card className="border-slate-200/90 dark:border-slate-800 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
                <CardContent className="p-4 sm:p-5 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Consultations
                    </p>
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 mt-1 tracking-tight">
                      {data.total_consultations}
                    </h3>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Recorded sessions</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800/60 shrink-0">
                    <ClipboardList className="w-5 h-5" />
                  </div>
                </CardContent>
              </Card>

              {/* Total Doctors */}
              <Card className="border-slate-200/90 dark:border-slate-800 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
                <CardContent className="p-4 sm:p-5 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Total Doctors
                    </p>
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 mt-1 tracking-tight">
                      {data.total_doctors}
                    </h3>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Active clinician accounts</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-300 border border-teal-100 dark:border-teal-800/60 shrink-0">
                    <Stethoscope className="w-5 h-5" />
                  </div>
                </CardContent>
              </Card>

              {/* Total Staff */}
              <Card className="border-slate-200/90 dark:border-slate-800 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
                <CardContent className="p-4 sm:p-5 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Total Staff
                    </p>
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 mt-1 tracking-tight">
                      {data.total_staff}
                    </h3>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Outpatient personnel</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-300 border border-amber-100 dark:border-amber-800/60 shrink-0">
                    <UserCheck className="w-5 h-5" />
                  </div>
                </CardContent>
              </Card>

              {/* Active Users */}
              <Card className="border-slate-200/90 dark:border-slate-800 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
                <CardContent className="p-4 sm:p-5 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Active Users
                    </p>
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 tracking-tight">
                      {data.active_users}
                    </h3>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                      {data.inactive_users} inactive accounts
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800/60 shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                </CardContent>
              </Card>

              {/* Active Medicines */}
              <Card className="border-slate-200/90 dark:border-slate-800 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
                <CardContent className="p-4 sm:p-5 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Active Medicines
                    </p>
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 mt-1 tracking-tight">
                      {data.active_medicines}
                    </h3>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Prescription catalog</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-300 border border-cyan-100 dark:border-cyan-800/60 shrink-0">
                    <Pill className="w-5 h-5" />
                  </div>
                </CardContent>
              </Card>

              {/* Active Symptoms */}
              <Card className="border-slate-200/90 dark:border-slate-800 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
                <CardContent className="p-4 sm:p-5 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Active Symptoms
                    </p>
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 mt-1 tracking-tight">
                      {data.active_symptoms}
                    </h3>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Clinical complaint items</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-300 border border-rose-100 dark:border-rose-800/60 shrink-0">
                    <Activity className="w-5 h-5" />
                  </div>
                </CardContent>
              </Card>

              {/* Active Diagnostic Tests */}
              <Card className="border-slate-200/90 dark:border-slate-800 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
                <CardContent className="p-4 sm:p-5 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Active Tests
                    </p>
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 mt-1 tracking-tight">
                      {data.active_diagnostic_tests}
                    </h3>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Diagnostic test library</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 border border-purple-100 dark:border-purple-800/60 shrink-0">
                    <FlaskConical className="w-5 h-5" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* 2. QUICK ACTIONS BAR */}
          <section aria-label="Admin Quick Actions">
            <Card className="border-slate-200 dark:border-slate-800 shadow-xs bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-white">
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-emerald-400" />
                      Administrator Quick Actions
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Direct shortcuts to manage staff, clinical masters, and system settings.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/admin/users?action=new-doctor')}
                    className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs flex items-center gap-1.5"
                  >
                    <UserPlus className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Add Doctor</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/admin/users?action=new-staff')}
                    className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs flex items-center gap-1.5"
                  >
                    <UserPlus className="w-3.5 h-3.5 text-blue-400" />
                    <span>Add Staff</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/admin/users')}
                    className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs flex items-center gap-1.5"
                  >
                    <Users className="w-3.5 h-3.5 text-amber-400" />
                    <span>Manage Users</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/admin/medicines')}
                    className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs flex items-center gap-1.5"
                  >
                    <Pill className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Manage Medicines</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/admin/symptoms')}
                    className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs flex items-center gap-1.5"
                  >
                    <Activity className="w-3.5 h-3.5 text-rose-400" />
                    <span>Manage Symptoms</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/admin/diagnostic-tests')}
                    className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs flex items-center gap-1.5"
                  >
                    <FlaskConical className="w-3.5 h-3.5 text-purple-400" />
                    <span>Manage Diagnostic Tests</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/admin/neurological-examinations')}
                    className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs flex items-center gap-1.5"
                  >
                    <Stethoscope className="w-3.5 h-3.5 text-teal-400" />
                    <span>Manage Neurological Examinations</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/admin/settings')}
                    className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs flex items-center gap-1.5"
                  >
                    <Settings className="w-3.5 h-3.5 text-slate-300" />
                    <span>Settings</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* 3. USER MANAGEMENT & MASTER DATA BREAKDOWN */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* User Management Overview */}
            <Card className="border-slate-200 dark:border-slate-800 shadow-xs lg:col-span-1 flex flex-col justify-between">
              <div>
                <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      User Management
                    </CardTitle>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Role distribution & access</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/admin/users')}
                    className="text-xs flex items-center gap-1 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
                  >
                    <span>Manage</span>
                    <ArrowRight className="w-3 h-3" />
                  </Button>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 flex items-center justify-center font-bold text-xs">
                        <Stethoscope className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Doctors</span>
                    </div>
                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{data.total_doctors}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-xs">
                        <Users className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Staff Members</span>
                    </div>
                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{data.total_staff}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-xs">
                        <UserCheck className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-semibold text-emerald-900 dark:text-emerald-300">Active Users</span>
                    </div>
                    <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">{data.active_users}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center font-bold text-xs">
                        <UserX className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Inactive Users</span>
                    </div>
                    <span className="text-sm font-bold text-slate-600 dark:text-slate-300">{data.inactive_users}</span>
                  </div>
                </CardContent>
              </div>
              <div className="p-4 bg-slate-50/70 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 rounded-b-xl flex items-center justify-between">
                <span>Total Registered Accounts:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {data.active_users + data.inactive_users}
                </span>
              </div>
            </Card>

            {/* Master Data Real Counts */}
            <Card className="border-slate-200 dark:border-slate-800 shadow-xs lg:col-span-2">
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Master Data Status & Counts
                  </CardTitle>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Standardized clinical library items available in dropdowns
                  </p>
                </div>
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                  {data.total_active_items} Active Items
                </span>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Symptoms */}
                  <div
                    onClick={() => navigate('/admin/symptoms')}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-all flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                        <Activity className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Symptoms</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500">Complaints & signs</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {data.categories['symptoms']?.active ?? 0}
                      </span>
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">active</p>
                    </div>
                  </div>

                  {/* Medicines */}
                  <div
                    onClick={() => navigate('/admin/medicines')}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-all flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                        <Pill className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Medicines</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500">Prescription catalog</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {data.categories['medicines']?.active ?? 0}
                      </span>
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">active</p>
                    </div>
                  </div>

                  {/* Diagnostic Tests */}
                  <div
                    onClick={() => navigate('/admin/diagnostic-tests')}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-all flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                        <FlaskConical className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Diagnostic Tests</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500">Labs & radiology</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {data.categories['diagnostic_tests']?.active ?? 0}
                      </span>
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">active</p>
                    </div>
                  </div>

                  {/* Neurological Examination Options */}
                  <div
                    onClick={() => navigate('/admin/neurological-examinations')}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-all flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400">
                        <Stethoscope className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Neuro Exam Options</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500">Motor, cranial, reflexes</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {data.categories['neurological_examinations']?.active ?? 0}
                      </span>
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">active</p>
                    </div>
                  </div>

                  {/* Follow-Up Options */}
                  <div
                    onClick={() => navigate('/admin/follow-ups')}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-all flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400">
                        <CalendarCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Follow-Up Options</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500">Intervals & review time</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {data.categories['follow_ups']?.active ?? 0}
                      </span>
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">active</p>
                    </div>
                  </div>

                  {/* Patient States */}
                  <div
                    onClick={() => navigate('/admin/patient-states')}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-all flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                        <UserCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Patient States</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500">Clinical condition</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {data.categories['patient_states']?.active ?? 0}
                      </span>
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">active</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 4. RECENT SYSTEM ACTIVITY FEEDS */}
          <section aria-label="Recent System Activity">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                    Recent System Activity
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Audited system actions with non-sensitive demographics.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 4.1 Recently Registered Patients */}
                <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
                  <CardHeader className="pb-2.5 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
                    <CardTitle className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                      Recent Patients
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate('/patients')}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 p-0 h-auto"
                    >
                      View All
                    </Button>
                  </CardHeader>
                  <CardContent className="p-0">
                    {data.recent_activity.recent_patients.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-400 dark:text-slate-500">
                        No patients registered yet.
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {data.recent_activity.recent_patients.map((p) => (
                          <div
                            key={p.patient_id}
                            className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center justify-between transition-colors"
                          >
                            <div className="min-w-0 pr-2">
                              <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                                {p.full_name}
                              </p>
                              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                <span className="font-mono text-slate-600 dark:text-slate-400">{p.patient_id}</span>
                                <span>•</span>
                                <span>{p.age} yrs, {p.gender}</span>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/patients/${p.patient_id}`)}
                              className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 shrink-0"
                            >
                              Open
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* 4.2 Recent Consultations */}
                <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
                  <CardHeader className="pb-2.5 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
                    <CardTitle className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                      Recent Consultations
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate('/consultations')}
                      className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 p-0 h-auto"
                    >
                      View All
                    </Button>
                  </CardHeader>
                  <CardContent className="p-0">
                    {data.recent_activity.recent_consultations.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-400 dark:text-slate-500">
                        No consultations recorded yet.
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {data.recent_activity.recent_consultations.map((c) => (
                          <div
                            key={c.consultation_id}
                            className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center justify-between transition-colors"
                          >
                            <div className="min-w-0 pr-2">
                              <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                                {c.patient_name}
                              </p>
                              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                <span className="font-mono text-slate-600 dark:text-slate-400">{c.patient_id}</span>
                                <span>•</span>
                                <span>{c.consultation_date ? new Date(c.consultation_date).toLocaleDateString() : 'Today'}</span>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/patients/${c.patient_id}/consultation/${c.consultation_id}`)}
                              className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 shrink-0"
                            >
                              View
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* 4.3 Recently Created Users */}
                <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
                  <CardHeader className="pb-2.5 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
                    <CardTitle className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                      System Users
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate('/admin/users')}
                      className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 p-0 h-auto"
                    >
                      View All
                    </Button>
                  </CardHeader>
                  <CardContent className="p-0">
                    {data.recent_activity.recent_users.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-400 dark:text-slate-500">
                        No recent activity.
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {data.recent_activity.recent_users.map((u) => (
                          <div
                            key={u.id}
                            className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center justify-between transition-colors"
                          >
                            <div className="min-w-0 pr-2">
                              <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                                {u.full_name || u.username}
                              </p>
                              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                <span className="font-mono text-slate-600 dark:text-slate-400">{u.username}</span>
                                <span>•</span>
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                  {u.role}
                                </span>
                              </div>
                            </div>
                            <span
                              className={cn(
                                'text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0',
                                u.is_active
                                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                              )}
                            >
                              {u.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
};
