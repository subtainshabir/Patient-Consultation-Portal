import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import {
  Stethoscope,
  Pill,
  ClipboardList,
  FlaskConical,
  Brain,
  Settings as SettingsIcon,
} from 'lucide-react';

import { ProtectedRoute } from './ProtectedRoute';
import { PublicRoute } from './PublicRoute';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { AuthLayout } from '../layouts/AuthLayout';

import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { PlaceholderModulePage } from '../pages/PlaceholderModulePage';
import { NotFoundPage } from '../pages/NotFoundPage';

// Phase 2 Patient Management Pages
import { PatientListPage } from '../pages/patients/PatientListPage';
import { RegisterPatientPage } from '../pages/patients/RegisterPatientPage';
import { PatientProfilePage } from '../pages/patients/PatientProfilePage';
import { EditPatientPage } from '../pages/patients/EditPatientPage';
import { NewConsultationPlaceholderPage } from '../pages/consultations/NewConsultationPlaceholderPage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Root redirect */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Public Authentication Route */}
      <Route element={<AuthLayout />}>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
      </Route>

      {/* Authenticated Application Routes (Protected) */}
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />

        {/* Phase 2: Patient Management Routes */}
        <Route path="/patients" element={<PatientListPage />} />
        <Route path="/patients/new" element={<RegisterPatientPage />} />
        <Route path="/patients/:patientId" element={<PatientProfilePage />} />
        <Route path="/patients/:patientId/edit" element={<EditPatientPage />} />
        <Route
          path="/patients/:patientId/consultation/new"
          element={<NewConsultationPlaceholderPage />}
        />

        {/* Consultations Module (Future Phase 3) */}
        <Route
          path="/consultations"
          element={
            <PlaceholderModulePage
              title="Clinical Consultations & Prescriptions"
              subtitle="Structured consultation recordings, vitals, Urdu prescription generator, and follow-ups."
              targetPhase="Phase 3"
              icon={Stethoscope}
              plannedFeatures={[
                'Vital signs recording (BP, Pulse, Weight, Blood Glucose, SpO2)',
                'Chief complaints & symptoms picker with Urdu translation',
                'Structured neurological examination matrix',
                'Prescription builder with Urdu dosage, frequency, and instructions',
                'A4 professional prescription PDF generator and print layout',
              ]}
            />
          }
        />

        {/* Medicines Module (Future Phase 4) */}
        <Route
          path="/medicines"
          element={
            <PlaceholderModulePage
              title="Neurology Medicines Database"
              subtitle="Master formulary of neurological medications, brand names, generic formulations, and strengths."
              targetPhase="Phase 4 (Master Data)"
              icon={Pill}
              plannedFeatures={[
                'Predefined formulary of neurological medications',
                'Support for generic and commercial brand names',
                'Dynamic manual entry for custom medications during consultation',
                'Administrative CRUD and pricing / stock tracking foundation',
              ]}
            />
          }
        />

        {/* Symptoms Module (Future Phase 4) */}
        <Route
          path="/symptoms"
          element={
            <PlaceholderModulePage
              title="Clinical Symptoms Master"
              subtitle="Standardized neurology symptoms dictionary with English and Urdu descriptors."
              targetPhase="Phase 4 (Master Data)"
              icon={ClipboardList}
              plannedFeatures={[
                'Curated list of neurological presenting complaints',
                'Dual language support (English & Urdu clinical terminology)',
                'Severity scoring and onset duration metadata',
                'Searchable multi-select chips integration',
              ]}
            />
          }
        />

        {/* Diagnostic Tests Module (Future Phase 4) */}
        <Route
          path="/diagnostic-tests"
          element={
            <PlaceholderModulePage
              title="Diagnostic Tests & Imaging"
              subtitle="Master directory of neuro-imaging (MRI, CT), EEG, EMG/NCS, and laboratory investigations."
              targetPhase="Phase 4 (Master Data)"
              icon={FlaskConical}
              plannedFeatures={[
                'Brain MRI, CT Scan, and angiography selections',
                'Neuro-electrophysiology (EEG, EMG, Nerve Conduction Studies)',
                'Cerebrospinal fluid (CSF) analysis panels and serology',
                'Investigation order generation on consultation printout',
              ]}
            />
          }
        />

        {/* Neurological Examination Module (Future Phase 4) */}
        <Route
          path="/neurological-examination"
          element={
            <PlaceholderModulePage
              title="Neurological Examination Protocols"
              subtitle="Structured examination matrix covering cranial nerves, motor, sensory, reflexes, and cerebellar signs."
              targetPhase="Phase 4 (Master Data)"
              icon={Brain}
              plannedFeatures={[
                'Cranial Nerves (I to XII) assessment checklist',
                'Motor examination (Tone, Power 0-5, Bulk, Abnormal movements)',
                'Deep Tendon Reflexes (Biceps, Triceps, Knee, Ankle, Plantars)',
                'Sensory modalities, Cerebellar coordination, Romberg, and Gait',
              ]}
            />
          }
        />

        {/* Settings Module (Future Phase 5) */}
        <Route
          path="/settings"
          element={
            <PlaceholderModulePage
              title="Clinic & System Settings"
              subtitle="Clinic configuration, user access administration, prescription templates, and backup management."
              targetPhase="Phase 5 (Administration)"
              icon={SettingsIcon}
              plannedFeatures={[
                'Clinic details, consultation fee, and doctor timing configuration',
                'User management (Admin, Doctor, Reception Staff)',
                'Prescription layout header & footer customizations',
                'Database backup and audit log viewer',
              ]}
            />
          }
        />
      </Route>

      {/* 404 Catch-All Route (Section 59) */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
