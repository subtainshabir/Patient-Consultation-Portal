import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Stethoscope, ArrowLeft, Clock, User } from 'lucide-react';
import { patientService } from '../../services/patientService';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export const NewConsultationPlaceholderPage: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();

  // Load patient context
  const { data: patient } = useQuery({
    queryKey: ['patient', patientId],
    queryFn: () => patientService.getPatientById(patientId!),
    enabled: !!patientId,
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-200">
      <PageHeader
        title="New Consultation"
        description="The consultation module will be implemented in a future phase."
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Patients', href: '/patients' },
          { label: patientId || 'Patient', href: `/patients/${patientId}` },
          { label: 'New Consultation' },
        ]}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/patients/${patientId}`)}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Back to Patient
          </Button>
        }
      />

      {/* Patient Banner */}
      {patient && (
        <Card className="border-medical-200 bg-medical-50/50 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-medical-600 text-white flex items-center justify-center font-bold text-sm">
                <User className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-medical-900">
                    {patient.patient_id}
                  </span>
                  <span className="text-xs text-navy-400">•</span>
                  <span className="text-sm font-bold text-navy-950">
                    {patient.full_name}
                  </span>
                </div>
                <p className="text-xs text-navy-600">
                  {patient.age} yrs • {patient.gender} • Phone: {patient.mobile_number}
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-white border border-medical-200 text-medical-800">
              Active Record
            </span>
          </CardContent>
        </Card>
      )}

      {/* Module Placeholder Card (Section 18 & 49) */}
      <Card className="border-dashed border-navy-200 shadow-sm">
        <CardContent className="p-8 sm:p-12 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-medical-50 border border-medical-200 text-medical-700 flex items-center justify-center mb-6 shadow-sm">
            <Stethoscope className="w-8 h-8" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-navy-100 text-navy-700 text-xs font-semibold mb-3">
            <Clock className="w-3.5 h-3.5 text-medical-600" />
            <span>Consultation Module</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-navy-950 tracking-tight mb-2">
            New Consultation
          </h2>
          <p className="text-sm text-navy-600 max-w-lg leading-relaxed mb-6">
            The consultation module will be implemented in a future phase.
          </p>

          <div className="mt-4">
            <Button
              variant="primary"
              size="md"
              onClick={() => navigate(`/patients/${patientId}`)}
              leftIcon={<ArrowLeft className="w-4 h-4" />}
            >
              Back to Patient
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
