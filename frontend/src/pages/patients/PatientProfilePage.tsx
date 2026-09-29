import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Edit3,
  Stethoscope,
  Calendar,
  Clock,
  User,
  AlertCircle,
  Copy,
  Check,
  PowerOff,
  RotateCcw,
  ChevronDown,
  CalendarClock,
  Search,
  SlidersHorizontal,
  List,
  GitCommit,
  ArrowUpDown,
  X,
  FileText,
  Printer,
  Download,
} from 'lucide-react';

import type { ConsultationSummary } from '../../types/consultation';
import { patientService } from '../../services/patientService';
import { consultationService } from '../../services/consultationService';
import { useToast } from '../../hooks/useToast';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { SkeletonCard } from '../../components/ui/LoadingSkeleton';
import { ConfirmationDialog } from '../../components/ui/ConfirmationDialog';
import { ConsultationDetailModal } from '../../components/consultation/ConsultationDetailModal';
import { PatientTimeline } from '../../components/consultation/PatientTimeline';
import { PrescriptionReportModal } from '../../components/consultation/PrescriptionReportModal';
import { cn } from '../../utils/cn';

export const PatientProfilePage: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { success, error: toastError } = useToast();

  const [copiedMobile, setCopiedMobile] = useState(false);
  const [isDeactivateDialogOpen, setIsDeactivateDialogOpen] = useState(false);
  const [isMoreActionsOpen, setIsMoreActionsOpen] = useState(false);
  const [selectedConsultationId, setSelectedConsultationId] = useState<string | null>(null);

  // Phase 7: History Filters & View Mode
  const [viewMode, setViewMode] = useState<'cards' | 'timeline'>('cards');
  const [searchTerm, setSearchTerm] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [showFilterBar, setShowFilterBar] = useState(false);
  const [reportModalConsultationId, setReportModalConsultationId] = useState<string | null>(null);

  // Fetch patient profile
  const {
    data: patient,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['patient', patientId],
    queryFn: () => patientService.getPatientById(patientId!),
    enabled: !!patientId,
  });

  // Fetch consultation history
  const {
    data: consultationHistory = [],
    isLoading: isHistoryLoading,
  } = useQuery({
    queryKey: ['patient-consultations', patientId],
    queryFn: () => consultationService.getPatientConsultations(patientId!),
    enabled: !!patientId,
  });

  // Derived: Upcoming Follow-up (Section 13)
  const upcomingFollowUp = useMemo(() => {
    // Look for active follow-up: Scheduled or Overdue or As Needed from the newest relevant consultation
    return consultationHistory.find(
      (c) =>
        (c.follow_up_date || c.follow_up_period) &&
        c.follow_up_status !== 'Completed'
    );
  }, [consultationHistory]);

  // Derived: Filtered and Sorted Consultations (Section 18)
  const filteredConsultations = useMemo(() => {
    let result = [...consultationHistory];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      result = result.filter(
        (c) =>
          c.consultation_id.toLowerCase().includes(term) ||
          (c.patient_state_name && c.patient_state_name.toLowerCase().includes(term)) ||
          (c.symptoms_summary && c.symptoms_summary.some((s) => s.toLowerCase().includes(term))) ||
          (c.follow_up_period && c.follow_up_period.toLowerCase().includes(term))
      );
    }

    if (fromDate) {
      result = result.filter((c) => {
        const cDate = c.consultation_date.split('T')[0];
        return cDate >= fromDate;
      });
    }

    if (toDate) {
      result = result.filter((c) => {
        const cDate = c.consultation_date.split('T')[0];
        return cDate <= toDate;
      });
    }

    result.sort((a, b) => {
      const dateA = new Date(a.consultation_date).getTime();
      const dateB = new Date(b.consultation_date).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [consultationHistory, searchTerm, fromDate, toDate, sortOrder]);

  // Mutation to toggle active status
  const statusMutation = useMutation({
    mutationFn: (newStatus: boolean) =>
      patientService.setPatientStatus(patientId!, newStatus),
    onSuccess: (updated) => {
      queryClient.setQueryData(['patient', patientId], updated);
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      setIsDeactivateDialogOpen(false);
      setIsMoreActionsOpen(false);
      if (updated.is_active) {
        success('Patient reactivated successfully.', 'Record Reactivated');
      } else {
        success('Patient deactivated successfully.', 'Record Deactivated');
      }
    },
    onError: (err: unknown) => {
      toastError(
        err instanceof Error ? err.message : 'Failed to update patient status.',
        'Action Failed'
      );
    },
  });

  const handleCopyMobile = (mobile: string) => {
    navigator.clipboard.writeText(mobile);
    setCopiedMobile(true);
    setTimeout(() => setCopiedMobile(false), 2000);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setFromDate('');
    setToDate('');
    setSortOrder('desc');
  };

  const handleDownloadPdf = async (item: ConsultationSummary) => {
    try {
      const datePart = new Date(item.consultation_date).toISOString().split('T')[0];
      const pId = patient?.patient_id || item.patient_unique_id;
      const fileName = item.latest_report_file_name || `Prescription_${pId}_${datePart}.pdf`;
      await consultationService.downloadReportPdf(
        item.consultation_id,
        fileName,
        item.latest_report_version || undefined
      );
    } catch (err: unknown) {
      toastError(
        err instanceof Error ? err.message : 'Failed to download report PDF.',
        'Download Failed'
      );
    }
  };

  const hasActiveFilters = Boolean(searchTerm || fromDate || toDate || sortOrder !== 'desc');

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse max-w-5xl mx-auto">
        <SkeletonCard className="h-44" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SkeletonCard className="h-64 md:col-span-1" />
          <SkeletonCard className="h-64 md:col-span-2" />
        </div>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="max-w-md mx-auto my-12 text-center">
        <Card className="p-8">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-200">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-navy-950 mb-2">Patient not found</h2>
          <p className="text-sm text-navy-600 mb-6">
            The patient may have been removed or the ID may be incorrect.
          </p>
          <Button
            variant="primary"
            onClick={() => navigate('/patients')}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Back to Patients
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* ─── BREADCRUMBS & STATUS (Section 5 & 6) ─── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav className="flex items-center gap-2 text-xs font-semibold" aria-label="Breadcrumb">
          <Link
            to="/patients"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:text-primary-600 dark:hover:text-primary-400 hover:border-primary-300 dark:hover:border-primary-700 shadow-2xs transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            <span>Back to Patients</span>
          </Link>
          <span className="text-slate-300 dark:text-slate-600 font-bold">›</span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-xs font-bold text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-950/60 border border-primary-200 dark:border-primary-800/60 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-500" />
            {patient.patient_id}
          </span>
        </nav>

        <div className="flex items-center gap-2">
          <span
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border',
              patient.is_active
                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                : 'bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800'
            )}
          >
            <span
              className={cn(
                'w-2 h-2 rounded-full',
                patient.is_active ? 'bg-emerald-500' : 'bg-rose-500'
              )}
            />
            {patient.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      {/* ─── PATIENT PROFILE HEADER (Section 6) ─── */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
        <CardContent className="p-6 sm:p-7 space-y-6">
          {/* Top row: Section title & Quick Action buttons (Section 2) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">
                Medical Records
              </span>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
                Patient Profile
              </h1>
            </div>

            {/* Quick Action Buttons (Section 2) */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <Button
                variant="primary"
                size="md"
                onClick={() =>
                  navigate(`/patients/${patient.patient_id}/consultation/new`)
                }
                leftIcon={<Stethoscope className="w-4 h-4" />}
                className="shadow-sm font-semibold text-xs"
                id="btn-quick-new-consultation"
              >
                + New Consultation
              </Button>

              <Button
                variant="outline"
                size="md"
                onClick={() => {
                  const historyEl = document.getElementById('consultation-history-section');
                  historyEl?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                leftIcon={<Clock className="w-4 h-4 text-slate-500 dark:text-slate-400" />}
                className="text-xs"
              >
                Consultation History
              </Button>

              {consultationHistory.length > 0 && (
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => setReportModalConsultationId(consultationHistory[0].consultation_id)}
                  leftIcon={<FileText className="w-4 h-4 text-primary-600 dark:text-primary-400" />}
                  className="text-xs border-primary-300 dark:border-primary-700/80 text-primary-700 dark:text-primary-300 hover:bg-primary-50 dark:hover:bg-primary-950/40"
                >
                  View Latest Report
                </Button>
              )}

              <Button
                variant="outline"
                size="md"
                onClick={() => navigate(`/patients/${patient.patient_id}/edit`)}
                leftIcon={<Edit3 className="w-4 h-4" />}
                className="text-xs"
              >
                Edit Patient
              </Button>

              {/* More Actions Dropdown */}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="md"
                  onClick={() => setIsMoreActionsOpen((prev) => !prev)}
                  rightIcon={<ChevronDown className="w-3.5 h-3.5" />}
                  className="text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs"
                >
                  More
                </Button>

                {isMoreActionsOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl py-1.5 z-30 animate-in fade-in zoom-in-95 duration-100">
                    {patient.is_active ? (
                      <button
                        type="button"
                        onClick={() => {
                          setIsMoreActionsOpen(false);
                          setIsDeactivateDialogOpen(true);
                        }}
                        className="w-full px-3.5 py-2 text-left text-xs text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 transition-colors"
                      >
                        <PowerOff className="w-3.5 h-3.5 text-rose-500" />
                        <span>Deactivate Patient</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setIsMoreActionsOpen(false);
                          statusMutation.mutate(true);
                        }}
                        className="w-full px-3.5 py-2 text-left text-xs text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 flex items-center gap-2 transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Reactivate Patient</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Structured Fields Grid: Patient ID, Full Name, Age, Gender, Mobile Number (Section 6) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
            {/* Patient ID */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                Patient ID
              </span>
              <p className="font-mono text-sm sm:text-base font-extrabold text-primary-700 dark:text-primary-300 mt-1 truncate">
                {patient.patient_id}
              </p>
            </div>

            {/* Full Name */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 col-span-2 sm:col-span-2 lg:col-span-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                Full Name
              </span>
              <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 mt-1 truncate">
                {patient.full_name}
              </p>
            </div>

            {/* Age */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                Age
              </span>
              <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 mt-1">
                {patient.age} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">years</span>
              </p>
            </div>

            {/* Gender */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                Gender
              </span>
              <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 mt-1">
                {patient.gender}
              </p>
            </div>

            {/* Mobile Number */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 col-span-2 sm:col-span-2 lg:col-span-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                Mobile
              </span>
              <div className="flex items-center justify-between gap-1.5 mt-1">
                <span className="font-mono text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 truncate">
                  {patient.mobile_number}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyMobile(patient.mobile_number)}
                  className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 rounded-md hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors shrink-0"
                  title="Copy number"
                  aria-label="Copy phone number"
                >
                  {copiedMobile ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── LATEST CONSULTATION HIGHLIGHT (Section 3) ─── */}
      {consultationHistory.length > 0 ? (
        (() => {
          const latest = consultationHistory[0];
          return (
            <div className="rounded-2xl border border-primary-200/90 dark:border-primary-800/60 bg-gradient-to-r from-primary-50/70 via-white to-primary-50/30 dark:from-slate-900 dark:via-slate-850 dark:to-slate-900 p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-950/80 text-primary-700 dark:text-primary-300 flex items-center justify-center font-bold shrink-0 mt-0.5 sm:mt-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary-100 dark:bg-primary-950/80 text-primary-800 dark:text-primary-300 border border-primary-200/60 dark:border-primary-800/60">
                      Latest Consultation
                    </span>
                    <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
                      {latest.consultation_id}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1">
                    {new Date(latest.consultation_date).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                    {latest.patient_state_name && (
                      <span className="ml-2 font-normal text-xs text-slate-500 dark:text-slate-400">
                        • State: <span className="font-semibold text-slate-700 dark:text-slate-300">{latest.patient_state_name}</span>
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setReportModalConsultationId(latest.consultation_id)}
                  leftIcon={<FileText className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />}
                  className="text-xs font-semibold"
                >
                  View Report
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/patients/${patient.patient_id}/consultation/${latest.consultation_id}/edit`)}
                  leftIcon={<Edit3 className="w-3.5 h-3.5 text-slate-500" />}
                  className="text-xs font-semibold"
                >
                  Edit
                </Button>
              </div>
            </div>
          );
        })()
      ) : null}

      {/* ─── MAIN PROFILE CONTENT: INFO & CONSULTATION HISTORY (Section 7 & 23) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Patient Information & Follow-Up Cards */}
        <div className="lg:col-span-1 space-y-6">
          {/* Patient Details Card */}
          <Card className="border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
                <User className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                <span>Patient Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Patient ID
                </span>
                <p className="font-mono text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                  {patient.patient_id}
                </p>
              </div>

              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Full Name
                </span>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100 mt-0.5">
                  {patient.full_name}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Age
                  </span>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100 mt-0.5">
                    {patient.age} years
                  </p>
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Gender
                  </span>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100 mt-0.5">
                    {patient.gender}
                  </p>
                </div>
              </div>

              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Mobile Number
                </span>
                <p className="font-mono text-sm font-medium text-slate-900 dark:text-slate-100 mt-0.5">
                  {patient.mobile_number}
                </p>
              </div>

              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  CNIC
                </span>
                <p className="font-mono text-sm font-medium text-slate-900 dark:text-slate-100 mt-0.5">
                  {patient.cnic || 'Not provided'}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                  <span>Registered:</span>
                </div>
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {new Date(patient.created_at).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Next Follow-Up Card */}
          <Card className="border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
                <CalendarClock className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                <span>Next Follow-Up</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              {upcomingFollowUp ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                        upcomingFollowUp.follow_up_status === 'Overdue'
                          ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                          : upcomingFollowUp.follow_up_status === 'Scheduled'
                          ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border-sky-200 dark:border-sky-800'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {upcomingFollowUp.follow_up_status || 'Scheduled'}
                    </span>
                    {upcomingFollowUp.follow_up_date && (
                      <span className="text-xs font-mono font-bold text-slate-900 dark:text-slate-100">
                        {new Date(upcomingFollowUp.follow_up_date).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    )}
                  </div>

                  {upcomingFollowUp.follow_up_period && (
                    <p className="text-sm font-bold text-primary-800 dark:text-primary-300 font-mono" dir="rtl">
                      {upcomingFollowUp.follow_up_period}
                    </p>
                  )}

                  {upcomingFollowUp.follow_up_instructions && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-700/60 leading-relaxed">
                      <strong>Instructions:</strong> {upcomingFollowUp.follow_up_instructions}
                    </p>
                  )}

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                      {upcomingFollowUp.consultation_id}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedConsultationId(upcomingFollowUp.consultation_id)}
                      className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 hover:underline"
                    >
                      View Details →
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-slate-500 dark:text-slate-400 space-y-1">
                  <CalendarClock className="w-6 h-6 text-slate-300 dark:text-slate-600 mx-auto" />
                  <p className="text-xs font-medium">No follow-up scheduled</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Consultation History (Section 23) */}
        <div className="lg:col-span-2 space-y-6">
          <Card id="consultation-history-section" className="border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900 scroll-mt-20">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-3">
              <div className="flex items-center gap-3">
                <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
                  <Clock className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                  <span>Consultation History</span>
                </CardTitle>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                  {consultationHistory.length} {consultationHistory.length === 1 ? 'Record' : 'Records'}
                </span>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                {/* View Mode Toggle: Cards vs Timeline */}
                <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setViewMode('cards')}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1 transition-all ${
                      viewMode === 'cards'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                    title="Cards view"
                  >
                    <List className="w-3.5 h-3.5" />
                    <span>Cards</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('timeline')}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1 transition-all ${
                      viewMode === 'timeline'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                    title="Timeline view"
                  >
                    <GitCommit className="w-3.5 h-3.5" />
                    <span>Timeline</span>
                  </button>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilterBar((prev) => !prev)}
                  leftIcon={<SlidersHorizontal className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />}
                  className={cn('text-xs', hasActiveFilters && 'border-primary-500 bg-primary-50/50 dark:bg-primary-950/40')}
                  title="Filter consultations"
                >
                  Filter
                </Button>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() =>
                    navigate(`/patients/${patient.patient_id}/consultation/new`)
                  }
                  leftIcon={<Stethoscope className="w-3.5 h-3.5" />}
                  className="text-xs font-semibold"
                >
                  + New Consultation
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-4 sm:p-6 space-y-4">
              {/* Optional Search & Date Filter Bar */}
              {showFilterBar && (
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3 animate-in fade-in duration-100">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {/* Search by Text */}
                    <div className="relative sm:col-span-1">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search ID, symptoms, state..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-8 pr-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:border-primary-500"
                      />
                    </div>

                    {/* From Date */}
                    <div>
                      <input
                        type="date"
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs font-mono text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:border-primary-500"
                        title="From Date"
                      />
                    </div>

                    {/* To Date */}
                    <div>
                      <input
                        type="date"
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs font-mono text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:border-primary-500"
                        title="To Date"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                    <button
                      type="button"
                      onClick={() => setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
                      className="inline-flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                    >
                      <ArrowUpDown className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />
                      <span>Sort: {sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}</span>
                    </button>

                    {hasActiveFilters && (
                      <button
                        type="button"
                        onClick={handleResetFilters}
                        className="inline-flex items-center gap-1 text-xs text-rose-600 dark:text-rose-400 hover:text-rose-800 font-semibold"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Reset Filters</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Consultation List / Timeline Rendering */}
              {isHistoryLoading ? (
                <div className="py-8 text-center text-slate-500 dark:text-slate-400 flex flex-col items-center justify-center space-y-2">
                  <Clock className="w-6 h-6 animate-spin text-primary-600 dark:text-primary-400" />
                  <p className="text-xs">Loading consultation records...</p>
                </div>
              ) : consultationHistory.length === 0 ? (
                <EmptyState
                  icon={Stethoscope}
                  title="No consultation history yet"
                  description="This patient has not had a consultation recorded."
                  action={
                    <Button
                      variant="primary"
                      size="md"
                      onClick={() =>
                        navigate(`/patients/${patient.patient_id}/consultation/new`)
                      }
                      leftIcon={<Stethoscope className="w-4 h-4" />}
                    >
                      + New Consultation
                    </Button>
                  }
                />
              ) : filteredConsultations.length === 0 ? (
                <div className="py-8 text-center text-slate-500 dark:text-slate-400 space-y-2">
                  <p className="text-xs">No consultations match your filter criteria.</p>
                  <Button variant="ghost" size="sm" onClick={handleResetFilters}>
                    Clear Filters
                  </Button>
                </div>
              ) : viewMode === 'timeline' ? (
                /* Timeline View */
                <PatientTimeline
                  consultations={filteredConsultations}
                  onViewReport={(cId) => setReportModalConsultationId(cId)}
                  onEditConsultation={(cId) =>
                    navigate(
                      `/patients/${patient.patient_id}/consultation/${cId}/edit`
                    )
                  }
                  onDownloadReport={handleDownloadPdf}
                />
              ) : (
                /* Distinct Consultation Cards (Section 23) */
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium px-1">
                    <span>
                      Showing {filteredConsultations.length} of {consultationHistory.length}{' '}
                      {consultationHistory.length === 1 ? 'consultation' : 'consultations'}
                    </span>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500">
                      {sortOrder === 'desc' ? 'Newest first' : 'Oldest first'}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {filteredConsultations.map((item, idx) => {
                      const dateObj = new Date(item.consultation_date);
                      const formattedDate = dateObj.toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      });

                      const followUpStatus = item.follow_up_status || 'No Follow-Up';
                      const isCompleted = followUpStatus === 'Completed';
                      const isOverdue = followUpStatus === 'Overdue';
                      const isScheduled = followUpStatus === 'Scheduled';

                      // Visual title: First Consultation vs Follow-up Consultation (Section 23)
                      const consultationTypeTitle =
                        item.patient_state_name ||
                        (idx === filteredConsultations.length - 1 && sortOrder === 'desc'
                          ? 'First Consultation'
                          : 'Follow-up Consultation');

                      return (
                        <div
                          key={item.consultation_id}
                          className="p-4 sm:p-5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-2xs hover:border-primary-300 dark:hover:border-primary-700/70 hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                        >
                          <div className="space-y-1.5 flex-1 min-w-0">
                            {/* Distinct Date and Type Title (Section 23) */}
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                                {formattedDate}
                              </span>
                              <span className="text-slate-300 dark:text-slate-600">•</span>
                              <span className="text-xs font-semibold text-primary-700 dark:text-primary-300 px-2 py-0.5 rounded-md bg-primary-50 dark:bg-primary-950/60 border border-primary-200/80 dark:border-primary-800/60">
                                {consultationTypeTitle}
                              </span>
                              <span className="font-mono text-[11px] text-slate-400 dark:text-slate-500">
                                ({item.consultation_id})
                              </span>
                            </div>

                            {/* Follow-up status pill if applicable */}
                            {(item.follow_up_date || item.follow_up_period) && (
                              <div className="flex flex-wrap items-center gap-2 pt-1">
                                <span
                                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                                    isCompleted
                                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                      : isOverdue
                                      ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                                      : isScheduled
                                      ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border-sky-200 dark:border-sky-800'
                                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                                  }`}
                                >
                                  Follow-Up: {followUpStatus}
                                </span>
                                {item.follow_up_period && (
                                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                    {item.follow_up_period}
                                  </span>
                                )}
                                {item.follow_up_date && (
                                  <span className="text-xs text-sky-700 dark:text-sky-400">
                                    ({new Date(item.follow_up_date).toLocaleDateString('en-GB', {
                                      day: '2-digit',
                                      month: 'short',
                                      year: 'numeric',
                                    })})
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Action Buttons: [View Report] [Edit] [Download PDF] (Section 23) */}
                          <div className="flex flex-wrap items-center gap-2 shrink-0 self-start sm:self-auto">
                            {item.has_report ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setReportModalConsultationId(item.consultation_id)}
                                leftIcon={<FileText className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />}
                                className="text-xs font-semibold text-primary-800 dark:text-primary-300 border-primary-200 dark:border-primary-800/80 bg-primary-50/50 dark:bg-primary-950/50 hover:bg-primary-100 dark:hover:bg-primary-900/60"
                                title="View stored PDF prescription report"
                                id={`view-report-${item.consultation_id}`}
                              >
                                View Report
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setReportModalConsultationId(item.consultation_id)}
                                leftIcon={<Printer className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />}
                                className="text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                                title="Generate PDF prescription report"
                                id={`generate-report-${item.consultation_id}`}
                              >
                                Generate Report
                              </Button>
                            )}

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                navigate(
                                  `/patients/${patient.patient_id}/consultation/${item.consultation_id}/edit`
                                )
                              }
                              leftIcon={<Edit3 className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />}
                              className="text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                              title="Edit consultation"
                              id={`edit-${item.consultation_id}`}
                            >
                              Edit
                            </Button>

                            {item.has_report && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDownloadPdf(item)}
                                leftIcon={<Download className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />}
                                className="text-xs text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                                title="Download stored PDF report"
                                id={`download-pdf-${item.consultation_id}`}
                              >
                                Download PDF
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ─── CONSULTATION DETAIL MODAL (Section 4 & 5) ─── */}
      <ConsultationDetailModal
        consultationId={selectedConsultationId}
        isOpen={!!selectedConsultationId}
        onClose={() => setSelectedConsultationId(null)}
        onNavigateConsultation={(id) => setSelectedConsultationId(id)}
        allConsultations={consultationHistory}
      />

      {/* ─── PRESCRIPTION REPORT MODAL (Phase 8) ─── */}
      <PrescriptionReportModal
        consultationId={reportModalConsultationId}
        isOpen={!!reportModalConsultationId}
        onClose={() => setReportModalConsultationId(null)}
      />

      {/* ─── DEACTIVATION CONFIRMATION DIALOG ─── */}
      <ConfirmationDialog
        isOpen={isDeactivateDialogOpen}
        onClose={() => setIsDeactivateDialogOpen(false)}
        onConfirm={() => statusMutation.mutate(false)}
        title="Deactivate Patient?"
        message="This patient will be removed from the active patient list, but their historical medical records will be preserved."
        confirmLabel="Deactivate"
        cancelLabel="Cancel"
        isDestructive={true}
        isLoading={statusMutation.isPending}
      />
    </div>
  );
};
