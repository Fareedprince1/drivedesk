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
import { db } from './lib/storage';
import { supabase } from './lib/supabase';

// Multi-device Realtime Cloud Sync Watcher
const CloudSyncWatcher: React.FC = () => {
  const { isAuthenticated } = useAuth();

  React.useEffect(() => {
    if (!isAuthenticated) return;

    // 1. Initial sync on login / mount
    db.syncFromCloud();

    // 2. Sync on window focus (e.g. user switching between phone and laptop tabs)
    const handleFocus = () => {
      db.syncFromCloud();
    };
    window.addEventListener('focus', handleFocus);

    // 3. Supabase Realtime broadcast channel for instant multi-device sync
    const channel = supabase
      ?.channel('gem_realtime_sync')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => {
        db.syncFromCloud();
      })
      .subscribe();

    return () => {
      window.removeEventListener('focus', handleFocus);
      if (channel && supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, [isAuthenticated]);

  return null;
};

// Full Screen Loading Indicator while restoring Supabase session
const FullScreenLoader: React.FC = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-300">
    <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mb-4" />
    <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
      Loading Gem Driving School...
    </div>
  </div>
);

// Protected Route Wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return <FullScreenLoader />;
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

// Admin Only Route Wrapper
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  if (loading) {
    return <FullScreenLoader />;
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

// Public Login Route - Redirects to Dashboard if already authenticated
const PublicLoginRoute: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return <FullScreenLoader />;
  }
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return <Login />;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <CloudSyncWatcher />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<PublicLoginRoute />} />

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
