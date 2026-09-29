import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import { ProtectedRoute } from './ProtectedRoute';
import { PublicRoute } from './PublicRoute';
import { AdminRoute } from './AdminRoute';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { AdminLayout } from '../layouts/AdminLayout';
import { AuthLayout } from '../layouts/AuthLayout';
import { useAuth } from '../hooks/useAuth';

import { LoginPage } from '../pages/LoginPage';
import { NotFoundPage } from '../pages/NotFoundPage';

// Role-Specific Dashboards
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage';
import { DoctorDashboardPage } from '../pages/doctor/DoctorDashboardPage';
import { StaffDashboardPage } from '../pages/staff/StaffDashboardPage';

// Patient & Consultation Pages
import { PatientListPage } from '../pages/patients/PatientListPage';
import { RegisterPatientPage } from '../pages/patients/RegisterPatientPage';
import { PatientProfilePage } from '../pages/patients/PatientProfilePage';
import { EditPatientPage } from '../pages/patients/EditPatientPage';
import { NewConsultationPage } from '../pages/consultations/NewConsultationPage';
import { ConsultationDetailPage } from '../pages/consultations/ConsultationDetailPage';
import { ConsultationsListPage } from '../pages/consultations/ConsultationsListPage';

// Admin Portal Pages
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
import { AdminUsersPage } from '../pages/admin/AdminUsersPage';
import { SetupAdminPage } from '../pages/SetupAdminPage';

/**
 * Automatically dispatches authenticated users to their specific role dashboard
 */
const RoleDashboardRedirect: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-navy-50 flex items-center justify-center p-6">
        <div className="w-10 h-10 border-4 border-medical-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'ADMIN') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  if (user.role === 'STAFF') {
    return <Navigate to="/staff/dashboard" replace />;
  }

  return <Navigate to="/doctor/dashboard" replace />;
};

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Root redirect to role-specific dashboard */}
      <Route path="/" element={<RoleDashboardRedirect />} />

      {/* Public Authentication & Setup Routes */}
      <Route element={<AuthLayout />}>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route
          path="/setup"
          element={
            <PublicRoute>
              <SetupAdminPage />
            </PublicRoute>
          }
        />
      </Route>

      {/* ─── Role-Based Dashboards & Outpatient/Doctor Workspaces ─── */}
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        {/* Generic /dashboard redirects to active user's role-specific dashboard */}
        <Route path="/dashboard" element={<RoleDashboardRedirect />} />

        {/* Doctor Dashboard (Strictly restricted to DOCTOR & ADMIN; STAFF gets 403 Access Denied) */}
        <Route
          path="/doctor/dashboard"
          element={
            <ProtectedRoute allowedRoles={['DOCTOR', 'ADMIN']}>
              <DoctorDashboardPage />
            </ProtectedRoute>
          }
        />

        {/* Staff Dashboard (Restricted to STAFF & ADMIN; DOCTOR gets 403 Access Denied) */}
        <Route
          path="/staff/dashboard"
          element={
            <ProtectedRoute allowedRoles={['STAFF', 'ADMIN']}>
              <StaffDashboardPage />
            </ProtectedRoute>
          }
        />

        {/* Patient Management Routes (Accessible by Staff, Doctor, and Admin) */}
        <Route path="/patients" element={<PatientListPage />} />
        <Route path="/patients/new" element={<RegisterPatientPage />} />
        <Route path="/patients/:patientId" element={<PatientProfilePage />} />
        <Route path="/patients/:patientId/edit" element={<EditPatientPage />} />

        {/* Clinical Consultations Routes (Restricted to DOCTOR & ADMIN; Staff forbidden) */}
        <Route
          path="/consultations"
          element={
            <ProtectedRoute allowedRoles={['DOCTOR', 'ADMIN']}>
              <ConsultationsListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patients/:patientId/consultation/new"
          element={
            <ProtectedRoute allowedRoles={['DOCTOR', 'ADMIN']}>
              <NewConsultationPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patients/:patientId/consultations/new"
          element={
            <ProtectedRoute allowedRoles={['DOCTOR', 'ADMIN']}>
              <NewConsultationPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patients/:patientId/consultation/:consultationId"
          element={
            <ProtectedRoute allowedRoles={['DOCTOR', 'ADMIN']}>
              <ConsultationDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patients/:patientId/consultations/:consultationId"
          element={
            <ProtectedRoute allowedRoles={['DOCTOR', 'ADMIN']}>
              <ConsultationDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patients/:patientId/consultation/:consultationId/edit"
          element={
            <ProtectedRoute allowedRoles={['DOCTOR', 'ADMIN']}>
              <NewConsultationPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patients/:patientId/consultations/:consultationId/edit"
          element={
            <ProtectedRoute allowedRoles={['DOCTOR', 'ADMIN']}>
              <NewConsultationPage />
            </ProtectedRoute>
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

      {/* ─── Protected Admin Portal Routes (ADMIN ONLY) ─── */}
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
        <Route path="users" element={<AdminUsersPage />} />
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
