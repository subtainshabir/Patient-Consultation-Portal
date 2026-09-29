import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Stethoscope } from 'lucide-react';

import { ProtectedRoute } from './ProtectedRoute';
import { PublicRoute } from './PublicRoute';
import { AdminRoute } from './AdminRoute';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { AdminLayout } from '../layouts/AdminLayout';
import { AuthLayout } from '../layouts/AuthLayout';

import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { PlaceholderModulePage } from '../pages/PlaceholderModulePage';
import { NotFoundPage } from '../pages/NotFoundPage';

// Patient & Consultation Pages
import { PatientListPage } from '../pages/patients/PatientListPage';
import { RegisterPatientPage } from '../pages/patients/RegisterPatientPage';
import { PatientProfilePage } from '../pages/patients/PatientProfilePage';
import { EditPatientPage } from '../pages/patients/EditPatientPage';
import { NewConsultationPage } from '../pages/consultations/NewConsultationPage';
import { ConsultationDetailPage } from '../pages/consultations/ConsultationDetailPage';

// Phase 9: Admin Portal Pages
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage';
import { AdminSymptomsPage } from '../pages/admin/AdminSymptomsPage';
import { AdminPatientStatesPage } from '../pages/admin/AdminPatientStatesPage';
import { AdminMedicinesPage } from '../pages/admin/AdminMedicinesPage';
import { AdminFrequenciesPage } from '../pages/admin/AdminFrequenciesPage';
import { AdminDosagesPage } from '../pages/admin/AdminDosagesPage';
import { AdminInstructionsPage } from '../pages/admin/AdminInstructionsPage';
import { AdminDiagnosticTestsPage } from '../pages/admin/AdminDiagnosticTestsPage';
import { AdminNeuroExamPage } from '../pages/admin/AdminNeuroExamPage';
import { AdminFollowUpsPage } from '../pages/admin/AdminFollowUpsPage';
import { AdminSettingsPage } from '../pages/admin/AdminSettingsPage';

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

      {/* ─── Doctor-Facing Application Routes (Protected) ─── */}
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />

        {/* Patient Management Routes */}
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

        {/* Consultations Module */}
        <Route
          path="/consultations"
          element={
            <PlaceholderModulePage
              title="Clinical Consultations & Prescriptions"
              subtitle="Structured consultation recordings, vitals, Urdu prescription generator, and follow-ups."
              targetPhase="Phase 4"
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

        {/* Shortcuts / Redirects to Admin Sections */}
        <Route
          path="/medicines"
          element={<Navigate to="/admin/medicines" replace />}
        />
        <Route
          path="/symptoms"
          element={<Navigate to="/admin/symptoms" replace />}
        />
        <Route
          path="/diagnostic-tests"
          element={<Navigate to="/admin/diagnostic-tests" replace />}
        />
        <Route
          path="/neurological-examination"
          element={<Navigate to="/admin/neurological-examinations" replace />}
        />
        <Route
          path="/settings"
          element={<Navigate to="/admin/settings" replace />}
        />
      </Route>

      {/* ─── Phase 9: Protected Admin Portal Routes ─── */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboardPage />} />
        <Route path="symptoms" element={<AdminSymptomsPage />} />
        <Route path="patient-states" element={<AdminPatientStatesPage />} />
        <Route path="medicines" element={<AdminMedicinesPage />} />
        <Route path="frequencies" element={<AdminFrequenciesPage />} />
        <Route path="dosages" element={<AdminDosagesPage />} />
        <Route path="instructions" element={<AdminInstructionsPage />} />
        <Route path="diagnostic-tests" element={<AdminDiagnosticTestsPage />} />
        <Route path="neurological-examinations" element={<AdminNeuroExamPage />} />
        <Route path="follow-ups" element={<AdminFollowUpsPage />} />
        <Route path="settings" element={<AdminSettingsPage />} />
        <Route path="master-data" element={<Navigate to="/admin/dashboard" replace />} />
      </Route>

      {/* 404 Catch-All Route */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
