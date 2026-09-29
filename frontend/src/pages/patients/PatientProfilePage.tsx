import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Edit3,
  Stethoscope,
  Phone,
  CreditCard,
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
      {/* ─── BREADCRUMBS & STATUS ─── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link
            to="/patients"
            className="md:hidden inline-flex items-center gap-1.5 text-xs font-semibold text-navy-600 hover:text-medical-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Patients</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1.5 text-xs font-semibold text-navy-500">
            <Link to="/patients" className="hover:text-medical-700 transition-colors">
              Patients
            </Link>
            <span className="text-navy-300">/</span>
            <span className="font-mono text-navy-800">{patient.patient_id}</span>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold',
              patient.is_active
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
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

      {/* ─── PATIENT HEADER BANNER ─── */}
      <Card className="border-navy-200 shadow-sm bg-gradient-to-r from-white via-white to-navy-50/50">
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-medical-600 to-medical-800 text-white flex items-center justify-center font-bold text-xl shadow-md shrink-0">
                {patient.full_name.charAt(0)}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="font-mono font-bold text-xs px-2.5 py-1 rounded-md bg-medical-50 text-medical-800 border border-medical-200/80">
                    {patient.patient_id}
                  </span>
                  <span className="text-xs text-navy-400">•</span>
                  <span className="text-xs font-semibold text-navy-600">
                    {patient.gender}
                  </span>
                  <span className="text-xs text-navy-400">•</span>
                  <span className="text-xs font-semibold text-navy-600">
                    {patient.age} years old
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-950 tracking-tight mt-1.5">
                  {patient.full_name}
                </h1>

                <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-navy-600">
                  <div className="flex items-center gap-1.5 font-mono">
                    <Phone className="w-3.5 h-3.5 text-navy-400" />
                    <span>{patient.mobile_number}</span>
                    <button
                      type="button"
                      onClick={() => handleCopyMobile(patient.mobile_number)}
                      className="text-navy-400 hover:text-navy-700 p-0.5"
                      title="Copy number"
                      aria-label="Copy phone number"
                    >
                      {copiedMobile ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                  {patient.cnic && (
                    <div className="flex items-center gap-1.5 font-mono">
                      <CreditCard className="w-3.5 h-3.5 text-navy-400" />
                      <span>{patient.cnic}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Top Right Action Buttons (Section 6) */}
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <Button
                variant="outline"
                size="md"
                onClick={() => navigate(`/patients/${patient.patient_id}/edit`)}
                leftIcon={<Edit3 className="w-4 h-4" />}
              >
                Edit Patient
              </Button>

              <Button
                variant="primary"
                size="md"
                onClick={() =>
                  navigate(`/patients/${patient.patient_id}/consultation/new`)
                }
                leftIcon={<Stethoscope className="w-4 h-4" />}
                className="shadow-sm font-semibold"
              >
                + New Consultation
              </Button>

              {/* More Actions Dropdown */}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="md"
                  onClick={() => setIsMoreActionsOpen((prev) => !prev)}
                  rightIcon={<ChevronDown className="w-3.5 h-3.5" />}
                  className="text-navy-700 border border-navy-200"
                >
                  More
                </Button>

                {isMoreActionsOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl border border-navy-200 shadow-xl py-1.5 z-30 animate-in fade-in zoom-in-95 duration-100">
                    {patient.is_active ? (
                      <button
                        type="button"
                        onClick={() => {
                          setIsMoreActionsOpen(false);
                          setIsDeactivateDialogOpen(true);
                        }}
                        className="w-full px-3.5 py-2 text-left text-xs text-rose-700 hover:bg-rose-50 flex items-center gap-2 transition-colors"
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
                        className="w-full px-3.5 py-2 text-left text-xs text-emerald-700 hover:bg-emerald-50 flex items-center gap-2 transition-colors"
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
        </CardContent>
      </Card>

      {/* ─── MAIN PROFILE CONTENT: INFO & CONSULTATION HISTORY ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Patient Information & Follow-Up Cards (Section 2 & 13) */}
        <div className="lg:col-span-1 space-y-6">
          {/* Patient Details (Section 2) */}
          <Card className="border-navy-200 shadow-sm">
            <CardHeader className="pb-3 border-b border-navy-100">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <User className="w-4 h-4 text-medical-600" />
                <span>Patient Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-navy-400">
                  Patient ID
                </span>
                <p className="font-mono text-sm font-bold text-navy-900 mt-0.5">
                  {patient.patient_id}
                </p>
              </div>

              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-navy-400">
                  Full Name
                </span>
                <p className="text-sm font-medium text-navy-900 mt-0.5">
                  {patient.full_name}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-navy-400">
                    Age
                  </span>
                  <p className="text-sm font-medium text-navy-900 mt-0.5">
                    {patient.age} years
                  </p>
                </div>
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-navy-400">
                    Gender
                  </span>
                  <p className="text-sm font-medium text-navy-900 mt-0.5">
                    {patient.gender}
                  </p>
                </div>
              </div>

              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-navy-400">
                  Mobile Number
                </span>
                <p className="font-mono text-sm font-medium text-navy-900 mt-0.5">
                  {patient.mobile_number}
                </p>
              </div>

              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-navy-400">
                  CNIC
                </span>
                <p className="font-mono text-sm font-medium text-navy-900 mt-0.5">
                  {patient.cnic || 'Not provided'}
                </p>
              </div>

              <div className="pt-3 border-t border-navy-100 flex items-center justify-between text-xs text-navy-500">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-navy-400" />
                  <span>Registered:</span>
                </div>
                <span className="font-medium text-navy-700">
                  {new Date(patient.created_at).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Next Follow-Up Card (Section 13) */}
          <Card className="border-navy-200 shadow-sm">
            <CardHeader className="pb-3 border-b border-navy-100">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <CalendarClock className="w-4 h-4 text-medical-600" />
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
                          ? 'bg-rose-50 text-rose-800 border-rose-200'
                          : upcomingFollowUp.follow_up_status === 'Scheduled'
                          ? 'bg-sky-50 text-sky-800 border-sky-200'
                          : 'bg-navy-50 text-navy-700 border-navy-200'
                      }`}
                    >
                      {upcomingFollowUp.follow_up_status || 'Scheduled'}
                    </span>
                    {upcomingFollowUp.follow_up_date && (
                      <span className="text-xs font-mono font-bold text-navy-900">
                        {new Date(upcomingFollowUp.follow_up_date).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    )}
                  </div>

                  {upcomingFollowUp.follow_up_period && (
                    <p className="text-sm font-bold text-medical-900 font-mono" dir="rtl">
                      {upcomingFollowUp.follow_up_period}
                    </p>
                  )}

                  {upcomingFollowUp.follow_up_instructions && (
                    <p className="text-xs text-navy-600 bg-navy-50/70 p-2.5 rounded-lg border border-navy-100 leading-relaxed">
                      <strong>Instructions:</strong> {upcomingFollowUp.follow_up_instructions}
                    </p>
                  )}

                  <div className="pt-2 border-t border-navy-100 flex items-center justify-between">
                    <span className="text-[11px] text-navy-400 font-mono">
                      {upcomingFollowUp.consultation_id}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedConsultationId(upcomingFollowUp.consultation_id)}
                      className="text-xs font-semibold text-medical-700 hover:text-medical-900 hover:underline"
                    >
                      View Details →
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-navy-500 space-y-1">
                  <CalendarClock className="w-6 h-6 text-navy-300 mx-auto" />
                  <p className="text-xs font-medium">No follow-up scheduled</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Consultation History (Section 2, 3, 6, 8, 18) */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-navy-200 shadow-sm">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-navy-100 gap-3">
              <div className="flex items-center gap-3">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Clock className="w-4 h-4 text-medical-600" />
                  <span>Consultation History</span>
                </CardTitle>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-navy-100 text-navy-700 font-semibold">
                  {consultationHistory.length} {consultationHistory.length === 1 ? 'Record' : 'Records'}
                </span>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                {/* View Mode Toggle: Cards vs Timeline (Section 8) */}
                <div className="flex items-center p-0.5 bg-navy-100 rounded-lg border border-navy-200">
                  <button
                    type="button"
                    onClick={() => setViewMode('cards')}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1 transition-all ${
                      viewMode === 'cards'
                        ? 'bg-white text-navy-950 shadow-2xs'
                        : 'text-navy-600 hover:text-navy-950'
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
                        ? 'bg-white text-navy-950 shadow-2xs'
                        : 'text-navy-600 hover:text-navy-950'
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
                  leftIcon={<SlidersHorizontal className="w-3.5 h-3.5 text-navy-600" />}
                  className={cn('text-xs', hasActiveFilters && 'border-medical-500 bg-medical-50/50')}
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
              {/* Optional Search & Date Filter Bar (Section 18) */}
              {showFilterBar && (
                <div className="p-3.5 rounded-xl bg-navy-50/70 border border-navy-200 space-y-3 animate-in fade-in duration-100">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {/* Search by Text */}
                    <div className="relative sm:col-span-1">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-navy-400" />
                      <input
                        type="text"
                        placeholder="Search ID, symptoms, state..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-8 pr-2.5 py-1.5 text-xs text-navy-900 bg-white border border-navy-200 rounded-lg focus:outline-hidden focus:border-medical-500"
                      />
                    </div>

                    {/* From Date */}
                    <div>
                      <input
                        type="date"
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs font-mono text-navy-900 bg-white border border-navy-200 rounded-lg focus:outline-hidden focus:border-medical-500"
                        title="From Date"
                      />
                    </div>

                    {/* To Date */}
                    <div>
                      <input
                        type="date"
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs font-mono text-navy-900 bg-white border border-navy-200 rounded-lg focus:outline-hidden focus:border-medical-500"
                        title="To Date"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-navy-200/60">
                    <button
                      type="button"
                      onClick={() => setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
                      className="inline-flex items-center gap-1.5 font-semibold text-navy-700 hover:text-navy-950"
                    >
                      <ArrowUpDown className="w-3.5 h-3.5 text-medical-600" />
                      <span>Sort: {sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}</span>
                    </button>

                    {hasActiveFilters && (
                      <button
                        type="button"
                        onClick={handleResetFilters}
                        className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-800 font-semibold"
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
                <div className="py-8 text-center text-navy-500 flex flex-col items-center justify-center space-y-2">
                  <Clock className="w-6 h-6 animate-spin text-medical-600" />
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
                <div className="py-8 text-center text-navy-500 space-y-2">
                  <p className="text-xs">No consultations match your filter criteria.</p>
                  <Button variant="ghost" size="sm" onClick={handleResetFilters}>
                    Clear Filters
                  </Button>
                </div>
              ) : viewMode === 'timeline' ? (
                /* Timeline View (Section 8) */
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
                /* Cards View (Section 3) */
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-navy-500 font-medium px-1">
                    <span>
                      Showing {filteredConsultations.length} of {consultationHistory.length}{' '}
                      {consultationHistory.length === 1 ? 'consultation' : 'consultations'}
                    </span>
                    <span className="text-[11px] text-navy-400">
                      {sortOrder === 'desc' ? 'Newest first' : 'Oldest first'}
                    </span>
                  </div>

                  <div className="divide-y divide-navy-100 rounded-xl border border-navy-200 overflow-hidden bg-white">
                    {filteredConsultations.map((item) => {
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

                      return (
                        <div
                          key={item.consultation_id}
                          className="p-4 hover:bg-navy-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                        >
                          <div className="space-y-1.5 flex-1 min-w-0">
                            {/* Line 1: Consultation ID, Date, Patient State (Section 3) */}
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono text-xs font-bold text-navy-950">
                                {item.consultation_id}
                              </span>
                              <span className="text-xs text-navy-300">•</span>
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-navy-800">
                                <Calendar className="w-3.5 h-3.5 text-medical-600" />
                                {formattedDate}
                              </span>
                              {item.patient_state_name && (
                                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-medical-50 border border-medical-200 text-medical-800">
                                  {item.patient_state_name}
                                </span>
                              )}
                              {(item.follow_up_date || item.follow_up_period) && (
                                <span
                                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                                    isCompleted
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                      : isOverdue
                                      ? 'bg-rose-50 text-rose-800 border-rose-200'
                                      : isScheduled
                                      ? 'bg-sky-50 text-sky-800 border-sky-200'
                                      : 'bg-navy-50 text-navy-700 border-navy-200'
                                  }`}
                                >
                                  Follow-Up: {followUpStatus}
                                </span>
                              )}
                            </div>

                            {/* Follow-Up Details if present */}
                            {(item.follow_up_date || item.follow_up_period || item.follow_up_instructions) && (
                              <div className="flex flex-wrap items-center gap-2 text-xs text-navy-600 pt-0.5">
                                {item.follow_up_period && (
                                  <span className="font-medium text-navy-800">
                                    {item.follow_up_period}
                                  </span>
                                )}
                                {item.follow_up_date && (
                                  <span className="inline-flex items-center gap-1 text-sky-800 font-medium">
                                    <CalendarClock className="w-3 h-3 text-sky-600" />
                                    {new Date(item.follow_up_date).toLocaleDateString('en-GB', {
                                      day: '2-digit',
                                      month: 'short',
                                      year: 'numeric',
                                    })}
                                  </span>
                                )}
                                {item.follow_up_instructions && (
                                  <span className="text-navy-500 italic line-clamp-1">
                                    ({item.follow_up_instructions})
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Action Buttons: [View Report] [Edit] [Download PDF] */}
                          <div className="flex flex-wrap items-center gap-2 shrink-0 self-start sm:self-auto">
                            {item.has_report ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setReportModalConsultationId(item.consultation_id)}
                                leftIcon={<FileText className="w-3.5 h-3.5 text-medical-600" />}
                                className="text-xs font-semibold text-medical-800 border-medical-200 bg-medical-50/50 hover:bg-medical-100"
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
                                leftIcon={<Printer className="w-3.5 h-3.5 text-navy-500" />}
                                className="text-xs text-navy-600 hover:text-navy-950"
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
                              leftIcon={<Edit3 className="w-3.5 h-3.5 text-navy-500" />}
                              className="text-xs text-navy-600 hover:text-navy-950"
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
                                leftIcon={<Download className="w-3.5 h-3.5 text-navy-600" />}
                                className="text-xs text-navy-700 hover:text-navy-950 border-navy-200 hover:bg-navy-50"
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
