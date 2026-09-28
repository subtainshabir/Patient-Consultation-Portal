import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  User,
  Phone,
  CreditCard,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  Copy,
  Check,
  UserPlus,
} from 'lucide-react';

import { patientService } from '../../services/patientService';
import { GENDER_OPTIONS, PAKISTANI_CNIC_REGEX } from '../../constants/patient';
import type { Patient, PatientFormData } from '../../types/patient';
import { useToast } from '../../hooks/useToast';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { Dialog, DialogHeader, DialogContent, DialogFooter } from '../../components/ui/Dialog';
import { ApiError } from '../../services/api';

const registerPatientSchema = z.object({
  full_name: z
    .string()
    .min(1, 'Full name is required.')
    .min(2, 'Full name must be at least 2 characters.')
    .max(255, 'Full name cannot exceed 255 characters.')
    .refine((val) => val.trim().length > 0, {
      message: 'Full name cannot consist only of spaces.',
    }),
  age: z
    .coerce
    .number({ invalid_type_error: 'Age must be a valid number.' })
    .int('Age must be a whole number.')
    .min(0, 'Age cannot be negative.')
    .max(130, 'Please enter a realistic age (0 to 130).'),
  gender: z.enum(['Male', 'Female', 'Other', 'Prefer not to specify'], {
    errorMap: () => ({ message: 'Please select a valid gender option.' }),
  }),
  mobile_number: z
    .string()
    .min(1, 'Mobile number is required.')
    .refine(
      (val) => {
        const digits = val.replace(/[^\d]/g, '');
        return digits.length >= 10 && digits.length <= 15;
      },
      { message: 'Mobile number must contain between 10 and 15 digits.' }
    ),
  cnic: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val || !val.trim()) return true;
        const digits = val.replace(/[^\d]/g, '');
        return digits.length === 13 && PAKISTANI_CNIC_REGEX.test(val.trim());
      },
      { message: 'CNIC must follow Pakistani format (XXXXX-XXXXXXX-X).' }
    ),
});

type FormValues = z.infer<typeof registerPatientSchema>;

export const RegisterPatientPage: React.FC = () => {
  const navigate = useNavigate();
  const { success, error: toastError, warning } = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registeredPatient, setRegisteredPatient] = useState<Patient | null>(null);
  const [copiedId, setCopiedId] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<{
    message: string;
    existingPatient: Patient;
    formData: FormValues;
  } | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(registerPatientSchema),
    defaultValues: {
      full_name: '',
      gender: 'Male',
      mobile_number: '',
      cnic: '',
    },
  });

  const submitPatientData = async (data: FormValues, confirmDuplicate = false) => {
    setIsSubmitting(true);
    try {
      const payload: PatientFormData = {
        full_name: data.full_name.trim(),
        age: Number(data.age),
        gender: data.gender,
        mobile_number: data.mobile_number.trim(),
        cnic: data.cnic && data.cnic.trim() ? data.cnic.trim() : undefined,
        confirm_duplicate: confirmDuplicate,
      };

      const newPatient = await patientService.createPatient(payload);
      setDuplicateWarning(null);
      setRegisteredPatient(newPatient);
      success(
        `Patient registered successfully. Assigned ID: ${newPatient.patient_id}`,
        'Registration Complete'
      );
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 409) {
        // Duplicate patient detected by backend
        const details = err.details as {
          is_duplicate?: boolean;
          existing_patient?: Patient;
        } | undefined;

        if (details?.existing_patient) {
          setDuplicateWarning({
            message:
              err.message ||
              'A patient with similar contact information already exists in the system.',
            existingPatient: details.existing_patient,
            formData: data,
          });
          warning('Potential duplicate patient detected. Please review.', 'Duplicate Alert');
          return;
        }
      }

      toastError(
        err instanceof Error ? err.message : 'Unable to register patient. Please check the fields.',
        'Registration Failed'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmit = (data: FormValues) => {
    submitPatientData(data, false);
  };

  const handleConfirmDuplicateRegistration = () => {
    if (duplicateWarning) {
      submitPatientData(duplicateWarning.formData, true);
    }
  };

  const handleRegisterAnother = () => {
    setRegisteredPatient(null);
    setCopiedId(false);
    reset({
      full_name: '',
      gender: 'Male',
      mobile_number: '',
      cnic: '',
    });
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* ─── PAGE HEADER ─── */}
      <PageHeader
        title="Register New Patient"
        description="Create a new permanent medical record. A unique Patient ID (DRN-XXXXXX) will be generated automatically."
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Patients', href: '/patients' },
          { label: 'Register New Patient' },
        ]}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/patients')}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Back to Patients
          </Button>
        }
      />

      {/* ─── REGISTRATION SUCCESS STATE (Section 31) ─── */}
      {registeredPatient ? (
        <Card className="border-emerald-200 bg-gradient-to-b from-emerald-50/40 to-white shadow-lg overflow-hidden animate-in zoom-in-95 duration-200">
          <CardContent className="p-8 sm:p-10 text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-5 shadow-sm border border-emerald-200">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <span className="text-xs uppercase tracking-widest font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              Registration Complete
            </span>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-navy-950 mt-3 tracking-tight">
              Patient Registered Successfully
            </h2>
            <p className="text-sm text-navy-600 max-w-md mt-1">
              A permanent patient record has been registered for Dr. Rauf Neurology Clinic.
            </p>

            {/* Generated Patient ID Box */}
            <div className="w-full max-w-md my-6 p-6 rounded-2xl bg-white border border-navy-200/90 shadow-card text-center">
              <span className="text-xs font-semibold uppercase tracking-wider text-navy-400">
                Generated Patient ID
              </span>
              <div className="flex items-center justify-center gap-2 mt-1 mb-2">
                <span className="font-mono text-3xl font-extrabold text-medical-800 tracking-tight">
                  {registeredPatient.patient_id}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyId(registeredPatient.patient_id)}
                  className="p-1.5 rounded-lg text-navy-400 hover:text-navy-700 hover:bg-navy-100 transition-colors"
                  title="Copy Patient ID"
                  aria-label="Copy Patient ID"
                >
                  {copiedId ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>

              <div className="pt-3 border-t border-navy-100 space-y-1">
                <p className="text-base font-bold text-navy-950">{registeredPatient.full_name}</p>
                <p className="text-xs text-navy-600">
                  {registeredPatient.age} years • {registeredPatient.gender}
                </p>
                <p className="text-xs font-mono text-navy-600">
                  Mobile: {registeredPatient.mobile_number}
                </p>
                {registeredPatient.cnic && (
                  <p className="text-xs font-mono text-navy-500">
                    CNIC: {registeredPatient.cnic}
                  </p>
                )}
              </div>
            </div>

            {/* Success Actions (Section 31) */}
            <div className="flex flex-col-reverse sm:flex-row items-center gap-3 w-full max-w-md">
              <Button
                variant="outline"
                size="md"
                onClick={handleRegisterAnother}
                leftIcon={<UserPlus className="w-4 h-4" />}
                className="w-full sm:w-1/2"
              >
                Register Another Patient
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => navigate(`/patients/${registeredPatient.patient_id}`)}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="w-full sm:w-1/2 font-semibold shadow-sm"
              >
                Open Patient Profile
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* ─── REGISTRATION FORM CARD (Section 7) ─── */
        <Card className="border-navy-200 shadow-md">
          <CardContent className="p-6 sm:p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
            {/* Full Name */}
            <div>
              <Input
                label="Full Name"
                id="full_name"
                placeholder="e.g. Muhammad Tariq"
                required
                leftElement={<User className="w-4 h-4" />}
                error={errors.full_name?.message}
                helperText="Enter patient's legal full name as per national records."
                {...register('full_name')}
              />
            </div>

            {/* Age & Gender (Responsive 2-col layout) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Input
                label="Age (Years)"
                id="age"
                type="number"
                placeholder="e.g. 48"
                required
                min={0}
                max={130}
                error={errors.age?.message}
                helperText="Enter patient age in completed years."
                {...register('age')}
              />

              <Select
                label="Gender"
                id="gender"
                options={GENDER_OPTIONS}
                required
                error={errors.gender?.message}
                helperText="Select biological gender or patient preference."
                {...register('gender')}
              />
            </div>

            {/* Mobile Number & CNIC */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Input
                label="Mobile Number"
                id="mobile_number"
                type="tel"
                placeholder="e.g. 0300-1234567"
                required
                leftElement={<Phone className="w-4 h-4" />}
                error={errors.mobile_number?.message}
                helperText="Primary contact number for appointments & follow-up."
                {...register('mobile_number')}
              />

              <Input
                label="CNIC (National ID Card)"
                id="cnic"
                placeholder="e.g. 37405-1234567-1"
                leftElement={<CreditCard className="w-4 h-4" />}
                error={errors.cnic?.message}
                helperText="Optional 13-digit Pakistani CNIC."
                {...register('cnic')}
              />
            </div>

            {/* Form Actions (Section 7) */}
            <div className="pt-6 border-t border-navy-100 flex flex-col-reverse sm:flex-row items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => navigate('/patients')}
                disabled={isSubmitting}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isSubmitting}
                className="w-full sm:w-auto font-semibold px-6 shadow-sm"
              >
                {isSubmitting ? 'Registering...' : 'Register Patient'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      )}

      {/* ─── DUPLICATE PATIENT WARNING DIALOG (Section 9) ─── */}
      {duplicateWarning && (
        <Dialog
          isOpen={!!duplicateWarning}
          onClose={() => setDuplicateWarning(null)}
          maxWidth="md"
        >
          <DialogHeader
            title="Potential Duplicate Patient"
            description="A registered patient with similar information already exists in the clinic database."
            onClose={() => setDuplicateWarning(null)}
          />
          <DialogContent className="space-y-4">
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed">
                <p className="font-semibold text-amber-950 mb-1">{duplicateWarning.message}</p>
                <p className="text-amber-800">
                  To avoid fragmented medical records, please review the existing patient record
                  before creating a new file.
                </p>
              </div>
            </div>

            {/* Existing Patient Summary Card */}
            <div className="p-4 rounded-xl bg-white border border-navy-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-medical-50 text-medical-800 border border-medical-200">
                  {duplicateWarning.existingPatient.patient_id}
                </span>
                <span className="text-[11px] text-navy-500">
                  Registered: {new Date(duplicateWarning.existingPatient.created_at).toLocaleDateString()}
                </span>
              </div>
              <h4 className="text-sm font-bold text-navy-950">
                {duplicateWarning.existingPatient.full_name}
              </h4>
              <p className="text-xs text-navy-600">
                {duplicateWarning.existingPatient.age} years • {duplicateWarning.existingPatient.gender}
              </p>
              <div className="flex flex-wrap gap-4 text-xs font-mono text-navy-700 pt-1 border-t border-navy-100">
                <span>Phone: {duplicateWarning.existingPatient.mobile_number}</span>
                {duplicateWarning.existingPatient.cnic && (
                  <span>CNIC: {duplicateWarning.existingPatient.cnic}</span>
                )}
              </div>
            </div>
          </DialogContent>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDuplicateWarning(null)}
              className="w-full sm:w-auto"
            >
              Cancel & Modify
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                navigate(`/patients/${duplicateWarning.existingPatient.patient_id}`)
              }
              rightIcon={<ExternalLink className="w-3.5 h-3.5" />}
              className="w-full sm:w-auto bg-medical-50 text-medical-800 hover:bg-medical-100 border border-medical-200"
            >
              View Existing Patient
            </Button>
            <Button
              variant="destructive"
              size="sm"
              isLoading={isSubmitting}
              onClick={handleConfirmDuplicateRegistration}
              className="w-full sm:w-auto"
            >
              Create Duplicate Anyway
            </Button>
          </DialogFooter>
        </Dialog>
      )}
    </div>
  );
};
