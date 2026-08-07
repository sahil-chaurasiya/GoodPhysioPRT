import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';
import { roleHomePath } from './utils/roleHome';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import RegisterPatient from './pages/RegisterPatient';
import MyPatients from './pages/MyPatients';
import PatientDetail from './pages/PatientDetail';
import PatientMyProfile from './pages/PatientMyProfile';
import PatientSessions from './pages/PatientSessions';
import Me from './pages/Me';

import AdminPortal from './pages/admin/AdminPortal';
import AdminDoctors from './pages/admin/AdminDoctors';
import AdminPrts from './pages/admin/AdminPrts';
import EditPrt from './pages/admin/EditPrt';
import EditPatient from './pages/admin/EditPatient';
import AdminMedicines from './pages/admin/AdminMedicines';
import AdminReports from './pages/admin/AdminReports';

// Redirects "/" (and unknown paths) to whatever landing page fits the
// logged-in user's role — instead of assuming everyone lands on /dashboard.
function RoleHome() {
  const { user, loading } = useAuth();
  if (loading) return null;
  return <Navigate to={user ? roleHomePath(user.role) : '/login'} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        {/* Admin / PRT — field operations */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute roles={['admin', 'prt']}>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/register-patient"
          element={
            <ProtectedRoute roles={['admin', 'prt']}>
              <RegisterPatient />
            </ProtectedRoute>
          }
        />

        {/* Admin / PRT / Doctor — patient list & detail (visibility is
            further scoped server-side: PRT sees own, Doctor sees assigned) */}
        <Route
          path="/my-patients"
          element={
            <ProtectedRoute roles={['admin', 'prt', 'doctor']}>
              <MyPatients />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-patients/:id"
          element={
            <ProtectedRoute roles={['admin', 'prt', 'doctor']}>
              <PatientDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-patients/:id/edit"
          element={
            <ProtectedRoute adminOnly>
              <EditPatient />
            </ProtectedRoute>
          }
        />

        {/* Patient portal */}
        <Route
          path="/my-profile"
          element={
            <ProtectedRoute roles={['patient']}>
              <PatientMyProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-sessions"
          element={
            <ProtectedRoute roles={['patient']}>
              <PatientSessions />
            </ProtectedRoute>
          }
        />

        {/* Available to every role */}
        <Route path="/me" element={<Me />} />

        {/* Admin Portal */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute adminOnly>
              <AdminPortal />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/doctors"
          element={
            <ProtectedRoute adminOnly>
              <AdminDoctors />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/prts"
          element={
            <ProtectedRoute adminOnly>
              <AdminPrts />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/prts/:id/edit"
          element={
            <ProtectedRoute adminOnly>
              <EditPrt />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/medicines"
          element={
            <ProtectedRoute adminOnly>
              <AdminMedicines />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/reports"
          element={
            <ProtectedRoute adminOnly>
              <AdminReports />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="/" element={<RoleHome />} />
      <Route path="*" element={<RoleHome />} />
    </Routes>
  );
}