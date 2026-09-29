import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  UserPlus,
  Search,
  CalendarCheck,
  Clock,
  RefreshCw,
  AlertCircle,
  FolderOpen,
  Phone,
} from 'lucide-react';

import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { dashboardService } from '../../services/dashboardService';
import type { StaffDashboardData } from '../../types/dashboard';
import { cn } from '../../utils/cn';

export const StaffDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { error: toastError } = useToast();

  const [data, setData] = useState<StaffDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const fetchDashboard = async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const result = await dashboardService.getStaffDashboard();
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
      {/* ─── PAGE HEADER & GREETING ─── */}
      <PageHeader
        title={`Welcome, ${user?.full_name || 'Staff'}`}
        description="Patient Reception & Outpatient Registry • Manage patient intake, search profiles, and registrations."
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
              variant="outline"
              size="sm"
              onClick={() => navigate('/patients')}
              className="flex items-center gap-1.5 text-navy-700"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search Patient</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/patients')}
              className="flex items-center gap-1.5 text-navy-700"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Patients</span>
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/patients/new')}
              className="flex items-center gap-1.5 shadow-sm"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Register Patient</span>
            </Button>
          </div>
        }
      />

      {/* ─── LOADING STATE ─── */}
      {isLoading && (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="w-10 h-10 border-4 border-primary-600 dark:border-primary-400 border-t-transparent rounded-full animate-spin mx-auto" />
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
              Could not retrieve patient registration statistics from the server. Please retry.
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
          {/* 1. TOP SUMMARY CARDS (Patient Management Stats) */}
          <section aria-label="Staff Summary Cards">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Total Patients */}
              <Card className="hover:shadow-md transition-all border-slate-200/90 dark:border-slate-800 shadow-2xs">
                <CardContent className="p-5 flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Total Patients
                    </p>
                    <h3 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 mt-1 tracking-tight">
                      {data.total_patients}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Registered in clinic directory</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-primary-50 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 border border-primary-200/60 dark:border-primary-800/60 shrink-0">
                    <Users className="w-5 h-5" />
                  </div>
                </CardContent>
              </Card>

              {/* Patients Registered Today */}
              <Card className="hover:shadow-md transition-all border-slate-200/90 dark:border-slate-800 shadow-2xs bg-gradient-to-br from-white to-emerald-50/40 dark:from-slate-900 dark:to-emerald-950/20">
                <CardContent className="p-5 flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                      Registered Today
                    </p>
                    <h3 className="text-3xl font-extrabold text-emerald-700 dark:text-emerald-400 mt-1 tracking-tight">
                      {data.today_registered_count}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Today's new intake</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border border-emerald-300/60 dark:border-emerald-700/60 shrink-0">
                    <CalendarCheck className="w-5 h-5" />
                  </div>
                </CardContent>
              </Card>

              {/* Recent Patient Records */}
              <Card className="hover:shadow-md transition-all border-slate-200/90 dark:border-slate-800 shadow-2xs">
                <CardContent className="p-5 flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Recent Patients
                    </p>
                    <h3 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 mt-1 tracking-tight">
                      {data.recent_patients.length}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Recently active profiles</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60 shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* 2. QUICK ACTIONS BAR */}
          <section aria-label="Staff Quick Actions">
            <Card className="border-slate-200/90 dark:border-slate-800 shadow-2xs bg-white dark:bg-slate-900">
              <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                    Patient Intake & Reception Actions
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Register incoming patients or lookup existing records quickly.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => navigate('/patients/new')}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Register Patient</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/patients')}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2"
                  >
                    <Search className="w-4 h-4" />
                    <span>Search Patient</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/patients')}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2"
                  >
                    <Users className="w-4 h-4" />
                    <span>Patients Directory</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* 3. TODAY'S REGISTERED PATIENTS */}
          <section aria-label="Today's Registered Patients">
            <Card className="border-slate-200/90 dark:border-slate-800 shadow-2xs">
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <CalendarCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    Patients Registered Today
                  </CardTitle>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Newly registered patient files added during today's shift.
                  </p>
                </div>
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                  {data.today_registered_count} Registered
                </span>
              </CardHeader>
              <CardContent className="p-0">
                {data.today_patients.length === 0 ? (
                  <div className="p-8 text-center space-y-2">
                    <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mx-auto">
                      <Users className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      No patients registered today.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate('/patients/new')}
                      className="mt-2 text-xs"
                    >
                      Register New Patient
                    </Button>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {data.today_patients.map((p) => (
                      <div
                        key={p.patient_id}
                        className="p-3.5 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 flex items-center justify-between gap-3 transition-colors"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                            {p.full_name}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            <span className="font-mono text-primary-700 dark:text-primary-400 font-semibold">
                              {p.patient_id}
                            </span>
                            <span>•</span>
                            <span>
                              {p.age} yrs, {p.gender}
                            </span>
                            {p.mobile_number && (
                              <>
                                <span>•</span>
                                <span className="inline-flex items-center gap-1 font-mono text-slate-600 dark:text-slate-300">
                                  <Phone className="w-3 h-3 text-slate-400" />
                                  {p.mobile_number}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/patients/${p.patient_id}`)}
                          className="text-xs h-7 px-2.5 shrink-0 flex items-center gap-1"
                        >
                          <FolderOpen className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                          <span>Open Patient</span>
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          {/* 4. RECENT PATIENTS DIRECTORY */}
          <section aria-label="Recent Patients Directory">
            <Card className="border-slate-200/90 dark:border-slate-800 shadow-2xs">
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                    Recent Patients
                  </CardTitle>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Non-clinical patient demographics and quick open shortcuts.
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/patients')}
                  className="text-xs text-primary-700 dark:text-primary-400 hover:text-primary-800 p-0 h-auto"
                >
                  View All Patients
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                {data.recent_patients.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 dark:text-slate-500">
                    No patients registered yet.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {data.recent_patients.map((p) => (
                      <div
                        key={p.patient_id}
                        className="p-3.5 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 flex items-center justify-between gap-3 transition-colors"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                            {p.full_name}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            <span className="font-mono text-primary-700 dark:text-primary-400 font-semibold">
                              {p.patient_id}
                            </span>
                            <span>•</span>
                            <span>
                              {p.age} yrs, {p.gender}
                            </span>
                            <span>•</span>
                            <span>
                              {p.created_at
                                ? new Date(p.created_at).toLocaleDateString()
                                : 'Recent'}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/patients/${p.patient_id}`)}
                          className="text-xs h-7 px-2.5 shrink-0 flex items-center gap-1"
                        >
                          <FolderOpen className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                          <span>Open Patient</span>
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </section>
        </>
      )}
    </div>
  );
};
