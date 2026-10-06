import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { CandidatesList } from './pages/candidates/CandidatesList';
import { CandidateDetail } from './pages/candidates/CandidateDetail';
import { SettingsPage } from './pages/settings/SettingsPage';
import { AppointmentsPage } from './pages/appointments/AppointmentsPage';
import { PaymentsPage } from './pages/payments/PaymentsPage';
import { PendingBalancePage } from './pages/pending-balance/PendingBalancePage';
import { InstructorsPage } from './pages/instructors/InstructorsPage';
import { VehiclesPage } from './pages/vehicles/VehiclesPage';
import { DrivingTestsPage } from './pages/rto/DrivingTestsPage';
import { ExpensesPage } from './pages/expenses/ExpensesPage';
import { ReportsPage } from './pages/reports/ReportsPage';

// Protected Route Wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

// Admin Only Route Wrapper
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isAdmin } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="candidates" element={<CandidatesList />} />
            <Route path="candidates/:id" element={<CandidateDetail />} />
            <Route path="appointments" element={<AppointmentsPage />} />
            <Route path="payments" element={<PaymentsPage />} />
            <Route path="pending-balance" element={<PendingBalancePage />} />
            <Route path="instructors" element={<InstructorsPage />} />
            <Route path="vehicles" element={<VehiclesPage />} />
            <Route path="driving-tests" element={<DrivingTestsPage />} />

            {/* Admin Only Routes */}
            <Route
              path="expenses"
              element={
                <AdminRoute>
                  <ExpensesPage />
                </AdminRoute>
              }
            />
            <Route
              path="reports"
              element={
                <AdminRoute>
                  <ReportsPage />
                </AdminRoute>
              }
            />
            <Route
              path="settings"
              element={
                <AdminRoute>
                  <SettingsPage />
                </AdminRoute>
              }
            />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
