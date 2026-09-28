import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  ArrowLeft,
  User,
  Phone,
  CreditCard,
  Lock,
  AlertCircle,
} from 'lucide-react';

import { patientService } from '../../services/patientService';
import { GENDER_OPTIONS, PAKISTANI_CNIC_REGEX } from '../../constants/patient';
import type { PatientFormData } from '../../types/patient';
import { useToast } from '../../hooks/useToast';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { SkeletonCard } from '../../components/ui/LoadingSkeleton';

const editPatientSchema = z.object({
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

type FormValues = z.infer<typeof editPatientSchema>;

export const EditPatientPage: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { success, error: toastError } = useToast();

  const [isSaving, setIsSaving] = useState(false);

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

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(editPatientSchema),
  });

  // Populate form with existing patient data
  useEffect(() => {
    if (patient) {
      reset({
        full_name: patient.full_name,
        age: patient.age,
        gender: patient.gender,
        mobile_number: patient.mobile_number,
        cnic: patient.cnic || '',
      });
    }
  }, [patient, reset]);

  const updateMutation = useMutation({
    mutationFn: (data: Partial<PatientFormData>) =>
      patientService.updatePatient(patientId!, data),
    onSuccess: (updated) => {
      queryClient.setQueryData(['patient', patientId], updated);
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      success('Patient information updated successfully.', 'Changes Saved');
      navigate(`/patients/${patientId}`);
    },
    onError: (err: unknown) => {
      toastError(
        err instanceof Error ? err.message : 'Unable to update patient record.',
        'Update Failed'
      );
    },
    onSettled: () => {
      setIsSaving(false);
    },
  });

  const onSubmit = (data: FormValues) => {
    setIsSaving(true);
    updateMutation.mutate({
      full_name: data.full_name.trim(),
      age: Number(data.age),
      gender: data.gender,
      mobile_number: data.mobile_number.trim(),
      cnic: data.cnic && data.cnic.trim() ? data.cnic.trim() : undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <SkeletonCard className="h-96" />
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
          <h2 className="text-lg font-bold text-navy-950 mb-2">Patient Not Found</h2>
          <Button
            variant="primary"
            onClick={() => navigate('/patients')}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Back to Patient List
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* ─── PAGE HEADER ─── */}
      <PageHeader
        title={`Edit Patient: ${patient.full_name}`}
        description="Update patient demographic and contact details. Patient ID is permanent and cannot be modified."
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Patients', href: '/patients' },
          { label: patient.patient_id, href: `/patients/${patient.patient_id}` },
          { label: 'Edit' },
        ]}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/patients/${patient.patient_id}`)}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Cancel
          </Button>
        }
      />

      {/* ─── EDIT FORM CARD (Section 21 & 22) ─── */}
      <Card className="border-navy-200 shadow-md">
        <CardContent className="p-6 sm:p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
            {/* Permanent Patient ID (Read-only) */}
            <div className="p-4 rounded-xl bg-navy-50/70 border border-navy-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-navy-500 uppercase tracking-wider">
                  Patient ID (Permanent)
                </span>
                <p className="font-mono text-base font-bold text-navy-900 mt-0.5">
                  {patient.patient_id}
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-navy-500 bg-white px-2.5 py-1 rounded-lg border border-navy-200">
                <Lock className="w-3.5 h-3.5 text-navy-400" />
                <span>Locked</span>
              </div>
            </div>

            {/* Full Name */}
            <div>
              <Input
                label="Full Name"
                id="full_name"
                required
                leftElement={<User className="w-4 h-4" />}
                error={errors.full_name?.message}
                {...register('full_name')}
              />
            </div>

            {/* Age & Gender */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Input
                label="Age (Years)"
                id="age"
                type="number"
                required
                min={0}
                max={130}
                error={errors.age?.message}
                {...register('age')}
              />

              <Select
                label="Gender"
                id="gender"
                options={GENDER_OPTIONS}
                required
                error={errors.gender?.message}
                {...register('gender')}
              />
            </div>

            {/* Mobile Number & CNIC */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Input
                label="Mobile Number"
                id="mobile_number"
                type="tel"
                required
                leftElement={<Phone className="w-4 h-4" />}
                error={errors.mobile_number?.message}
                {...register('mobile_number')}
              />

              <Input
                label="CNIC (National ID Card)"
                id="cnic"
                placeholder="XXXXX-XXXXXXX-X"
                leftElement={<CreditCard className="w-4 h-4" />}
                error={errors.cnic?.message}
                helperText="Leave empty if patient does not possess CNIC."
                {...register('cnic')}
              />
            </div>

            {/* Form Actions (Section 22) */}
            <div className="pt-6 border-t border-navy-100 flex flex-col-reverse sm:flex-row items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => navigate(`/patients/${patient.patient_id}`)}
                disabled={isSaving}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isSaving}
                className="w-full sm:w-auto font-semibold px-6 shadow-sm"
              >
                {isSaving ? 'Saving Changes...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
