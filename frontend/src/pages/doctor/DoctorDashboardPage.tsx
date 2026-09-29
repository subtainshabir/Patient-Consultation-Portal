import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Stethoscope,
  CalendarCheck,
  Clock,
  UserPlus,
  RefreshCw,
  AlertCircle,
  FileText,
  Edit,
  ExternalLink,
  Activity,
  Heart,
  Pill,
} from 'lucide-react';

import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { dashboardService } from '../../services/dashboardService';
import type { DoctorDashboardData } from '../../types/dashboard';
import { cn } from '../../utils/cn';

export const DoctorDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { error: toastError } = useToast();

  const [data, setData] = useState<DoctorDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const fetchDashboard = async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const result = await dashboardService.getDoctorDashboard();
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
        title={`Welcome back, ${user?.full_name || 'Dr. Rauf'}`}
        description="Clinical Practice Overview • Patient consultations, records, and today's active sessions."
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
              <Users className="w-3.5 h-3.5" />
              <span>Patients</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/consultations')}
              className="flex items-center gap-1.5 text-medical-700 border-medical-200"
            >
              <Stethoscope className="w-3.5 h-3.5" />
              <span>Consultations</span>
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/patients/new')}
              className="flex items-center gap-1.5 shadow-sm"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add Patient</span>
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
              Could not retrieve clinical metrics from the server. Please verify backend service and retry.
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
          {/* 1. TOP SUMMARY CARDS (4 Clinical Stats) */}
          <section aria-label="Clinical Summary Cards">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Patients */}
              <Card className="hover:shadow-md transition-all border-slate-200/90 dark:border-slate-800">
                <CardContent className="p-5 flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Total Patients
                    </p>
                    <h3 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 mt-1 tracking-tight">
                      {data.total_patients}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">In clinical registry</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-primary-50 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 border border-primary-200/60 dark:border-primary-800/60 shrink-0">
                    <Users className="w-5 h-5" />
                  </div>
                </CardContent>
              </Card>

              {/* Total Consultations */}
              <Card className="hover:shadow-md transition-all border-slate-200/90 dark:border-slate-800">
                <CardContent className="p-5 flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Total Consultations
                    </p>
                    <h3 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 mt-1 tracking-tight">
                      {data.total_consultations}
                    </h3>
                    <p className="text-xs text-primary-700 dark:text-primary-400 font-medium mt-1">Preserved histories</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60 shrink-0">
                    <Stethoscope className="w-5 h-5" />
                  </div>
                </CardContent>
              </Card>

              {/* Today's Consultations */}
              <Card className="hover:shadow-md transition-all border-slate-200/90 dark:border-slate-800 bg-gradient-to-br from-white to-primary-50/40 dark:from-slate-900 dark:to-primary-950/30">
                <CardContent className="p-5 flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-primary-800 dark:text-primary-300">
                      Today's Consultations
                    </p>
                    <h3 className="text-3xl font-extrabold text-primary-700 dark:text-primary-400 mt-1 tracking-tight">
                      {data.today_consultations_count}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Completed today</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-primary-100 dark:bg-primary-900/60 text-primary-800 dark:text-primary-200 border border-primary-300/60 dark:border-primary-700/60 shrink-0">
                    <CalendarCheck className="w-5 h-5" />
                  </div>
                </CardContent>
              </Card>

              {/* Recent Patients */}
              <Card className="hover:shadow-md transition-all border-slate-200/90 dark:border-slate-800">
                <CardContent className="p-5 flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Recent Patients
                    </p>
                    <h3 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 mt-1 tracking-tight">
                      {data.recent_patients.length}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Active file records</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60 shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* 2. TODAY'S CONSULTATIONS SECTION */}
          <section aria-label="Today's Consultations">
            <Card className="border-slate-200/90 dark:border-slate-800 shadow-2xs">
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <CalendarCheck className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    Today's Consultations
                  </CardTitle>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Clinical examinations, vitals, and prescriptions recorded today.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/consultations')}
                  className="text-xs self-start sm:self-auto"
                >
                  View All Consultations
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                {data.today_consultations.length === 0 ? (
                  <div className="p-8 sm:p-12 text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mx-auto">
                      <Stethoscope className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      No consultations recorded today.
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                      Select a patient from the patient directory to start a new clinical consultation session.
                    </p>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => navigate('/patients')}
                      className="mt-2"
                    >
                      Browse Patients
                    </Button>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800 overflow-x-auto">
                    {data.today_consultations.map((c) => (
                      <div
                        key={c.consultation_id}
                        className="p-4 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="space-y-1.5 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                              {c.patient_name}
                            </span>
                            <span className="text-xs font-mono font-bold text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-950/60 px-2 py-0.5 rounded-full border border-primary-200 dark:border-primary-800">
                              {c.patient_id}
                            </span>
                            <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                              {c.patient_state}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
                            {c.bp_formatted && (
                              <span className="inline-flex items-center gap-1">
                                <Activity className="w-3.5 h-3.5 text-rose-500" />
                                <span>BP: {c.bp_formatted}</span>
                              </span>
                            )}
                            {c.pulse_rate && (
                              <span className="inline-flex items-center gap-1">
                                <Heart className="w-3.5 h-3.5 text-rose-500" />
                                <span>{c.pulse_rate}</span>
                              </span>
                            )}
                            {c.prescriptions_count > 0 && (
                              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                                <Pill className="w-3.5 h-3.5" />
                                <span>{c.prescriptions_count} Rx</span>
                              </span>
                            )}
                            {c.symptoms && c.symptoms.length > 0 && (
                              <span className="text-slate-500 dark:text-slate-400 truncate max-w-xs">
                                Sx: {c.symptoms.join(', ')}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Action buttons: [Open] [View Report] [Edit] */}
                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              navigate(
                                `/patients/${c.patient_id}/consultation/${c.consultation_id}`
                              )
                            }
                            className="text-xs h-8 px-2.5 flex items-center gap-1"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Open</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              navigate(
                                `/patients/${c.patient_id}/consultation/${c.consultation_id}`
                              )
                            }
                            className="text-xs h-8 px-2.5 flex items-center gap-1 text-primary-700 dark:text-primary-300 border-primary-200 dark:border-primary-800 hover:bg-primary-50 dark:hover:bg-primary-950/40"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>View Report</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              navigate(
                                `/patients/${c.patient_id}/consultation/${c.consultation_id}/edit`
                              )
                            }
                            className="text-xs h-8 px-2.5 flex items-center gap-1"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          {/* 3. RECENT PATIENTS & RECENT CONSULTATIONS (2-Column Grid) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 3.1 RECENT PATIENTS */}
            <Card className="border-slate-200/90 dark:border-slate-800 shadow-2xs">
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                    Recent Patients
                  </CardTitle>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Latest registered patient profiles.
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/patients')}
                  className="text-xs text-primary-700 dark:text-primary-400 hover:text-primary-800 p-0 h-auto"
                >
                  View All
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
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
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
                          className="text-xs h-7 px-2 shrink-0"
                        >
                          Open Patient
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 3.2 RECENT CONSULTATIONS */}
            <Card className="border-slate-200/90 dark:border-slate-800 shadow-2xs">
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Stethoscope className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    Recent Consultations
                  </CardTitle>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Recent clinical notes & prescriptions.
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/consultations')}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 p-0 h-auto"
                >
                  View All
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                {data.recent_consultations.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 dark:text-slate-500">
                    No consultations recorded yet.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {data.recent_consultations.map((c) => (
                      <div
                        key={c.consultation_id}
                        className="p-3.5 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 flex items-center justify-between gap-3 transition-colors"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                            {c.patient_name}
                          </p>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            <span className="font-mono text-slate-600 dark:text-slate-300 font-semibold">{c.patient_id}</span>
                            <span>•</span>
                            <span>
                              {c.consultation_date
                                ? new Date(c.consultation_date).toLocaleDateString()
                                : 'Recent'}
                            </span>
                            {c.prescriptions_count > 0 && (
                              <>
                                <span>•</span>
                                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                                  {c.prescriptions_count} Rx
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              navigate(
                                `/patients/${c.patient_id}/consultation/${c.consultation_id}`
                              )
                            }
                            className="text-xs h-7 px-2"
                          >
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              navigate(
                                `/patients/${c.patient_id}/consultation/${c.consultation_id}/edit`
                              )
                            }
                            className="text-xs h-7 px-2"
                          >
                            Edit
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};
