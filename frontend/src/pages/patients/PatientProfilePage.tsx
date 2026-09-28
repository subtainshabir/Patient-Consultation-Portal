import React, { useState } from 'react';
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
} from 'lucide-react';

import { patientService } from '../../services/patientService';
import { useToast } from '../../hooks/useToast';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { SkeletonCard } from '../../components/ui/LoadingSkeleton';
import { ConfirmationDialog } from '../../components/ui/ConfirmationDialog';
import { cn } from '../../utils/cn';

export const PatientProfilePage: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { success, error: toastError } = useToast();

  const [copiedMobile, setCopiedMobile] = useState(false);
  const [isDeactivateDialogOpen, setIsDeactivateDialogOpen] = useState(false);
  const [isMoreActionsOpen, setIsMoreActionsOpen] = useState(false);

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
      {/* ─── BREADCRUMBS & CONTEXT (Section 30) ─── */}
      <div className="flex items-center justify-between">
        {/* Desktop Breadcrumbs vs Mobile Back Button */}
        <div className="flex items-center gap-2">
          {/* Mobile Back Button */}
          <Link
            to="/patients"
            className="md:hidden inline-flex items-center gap-1.5 text-xs font-semibold text-navy-600 hover:text-medical-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Patients</span>
          </Link>

          {/* Desktop Breadcrumbs */}
          <nav className="hidden md:flex items-center gap-1.5 text-xs font-semibold text-navy-500">
            <Link to="/patients" className="hover:text-medical-700 transition-colors">
              Patients
            </Link>
            <span className="text-navy-300">/</span>
            <span className="font-mono text-navy-800">{patient.patient_id}</span>
          </nav>
        </div>

        {/* Status Badge with Dot (Section 25) */}
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

      {/* ─── PATIENT HEADER BANNER (Section 16 & 29) ─── */}
      <Card className="border-navy-200 shadow-sm bg-gradient-to-r from-white via-white to-navy-50/50">
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            {/* Left: Patient Demographic summary */}
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

            {/* Right: Actions (Section 16, 23 & 50) */}
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

              {/* More Actions Dropdown (Section 23 & 50) */}
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
        {/* Left Column: Dedicated Patient Information Card (Section 17) */}
        <div className="lg:col-span-1 space-y-6">
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
                  Patient ID (Permanent)
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
                  CNIC Number
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
        </div>

        {/* Right Column: Consultation History (Section 19 & 20) */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-navy-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-navy-100">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Clock className="w-4 h-4 text-medical-600" />
                <span>Consultation History</span>
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  navigate(`/patients/${patient.patient_id}/consultation/new`)
                }
                leftIcon={<Stethoscope className="w-3.5 h-3.5 text-medical-600" />}
              >
                + New Consultation
              </Button>
            </CardHeader>
            <CardContent className="p-6">
              {/* Clean Consultation Empty State (Section 19 & 47) */}
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
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ─── DEACTIVATION CONFIRMATION DIALOG (Section 23) ─── */}
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
