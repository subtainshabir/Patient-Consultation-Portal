import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import {
  Stethoscope,
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
import { NewConsultationPage } from '../pages/consultations/NewConsultationPage';
import { ConsultationDetailPage } from '../pages/consultations/ConsultationDetailPage';

// Phase 3 Master Data Management
import { MasterDataAdminPage } from '../pages/admin/MasterDataAdminPage';

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
          element={<NewConsultationPage />}
        />
        <Route
          path="/patients/:patientId/consultation/:consultationId"
          element={<ConsultationDetailPage />}
        />
        <Route
          path="/patients/:patientId/consultations/:consultationId"
          element={<ConsultationDetailPage />}
        />
        <Route
          path="/patients/:patientId/consultation/:consultationId/edit"
          element={<NewConsultationPage />}
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

        {/* Phase 3: Clinical Master Data System */}
        <Route path="/admin/master-data" element={<MasterDataAdminPage />} />
        <Route
          path="/medicines"
          element={<Navigate to="/admin/master-data?category=medicines" replace />}
        />
        <Route
          path="/symptoms"
          element={<Navigate to="/admin/master-data?category=symptoms" replace />}
        />
        <Route
          path="/diagnostic-tests"
          element={<Navigate to="/admin/master-data?category=diagnostic-tests" replace />}
        />
        <Route
          path="/neurological-examination"
          element={<Navigate to="/admin/master-data?category=neurological-examinations" replace />}
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
