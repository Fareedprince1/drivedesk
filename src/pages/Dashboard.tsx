import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Calendar,
  CreditCard,
  AlertCircle,
  GraduationCap,
  Car,
  FileCheck2,
  TrendingUp,
  Clock,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Phone,
  MessageSquare,
  Sparkles,
  ShieldCheck,
  TrendingDown,
  DollarSign,
  AlertTriangle,
  FileText,
} from 'lucide-react';
import { db } from '../lib/storage';
import { formatINR, formatDate, formatTime12, formatPhone, getWhatsAppUrl, getTodayIST } from '../lib/formatters';
import { Badge, getStatusBadgeVariant } from '../components/common/Badge';
import { useAuth } from '../context/AuthContext';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { isAdmin, role } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);

  React.useEffect(() => {
    const handleSync = () => setRefreshKey((k) => k + 1);
    window.addEventListener('storage', handleSync);
    window.addEventListener('drivedesk_sync_complete', handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('drivedesk_sync_complete', handleSync);
    };
  }, []);

  const today = getTodayIST();
  const candidates = db.getCandidatesWithStats();
  const appointments = db.getAppointments();
  const payments = db.getPayments();
  const expenses = db.getExpenses();
  const vehicles = db.getVehicles();
  const instructors = db.getInstructors();
  const rtoList = db.getRTORecords();
  const notes = db.getCandidateNotes();
  const settings = db.getSettings();

  // 12 Top Statistics
  const totalCandidates = candidates.length;
  const activeCandidates = candidates.filter((c) => c.status === 'active').length;
  const completedCandidates = candidates.filter((c) => c.status === 'completed').length;

  const todayAppointments = appointments.filter((a) => a.appointment_date === today && !a.deleted_at);
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const tomorrowAppointments = appointments.filter((a) => a.appointment_date === tomorrowStr && !a.deleted_at);

  const pendingPaymentsList = candidates.filter((c) => (c.stats?.balance || 0) > 0);
  const totalPendingBalance = pendingPaymentsList.reduce((sum, c) => sum + (c.stats?.balance || 0), 0);

  // Collections
  const todayPayments = payments.filter((p) => p.payment_date === today);
  const todayCollection = todayPayments.reduce((sum, p) => (p.is_reversal ? sum - p.amount : sum + p.amount), 0);

  const thisMonthStr = today.substring(0, 7); // "2026-10"
  const thisMonthPayments = payments.filter((p) => p.payment_date.startsWith(thisMonthStr));
  const thisMonthCollection = thisMonthPayments.reduce((sum, p) => (p.is_reversal ? sum - p.amount : sum + p.amount), 0);

  const thisMonthExpenses = expenses.filter((e) => e.expense_date.startsWith(thisMonthStr));
  const thisMonthTotalExpense = thisMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const thisMonthNet = thisMonthCollection - thisMonthTotalExpense;

  // Driving tests this week
  const upcomingTests = rtoList.filter((r) => r.test_date && r.test_date >= today);
  const testsTomorrow = rtoList.filter((r) => r.test_date === tomorrowStr);

  // Instructors and vehicles
  const instructorsAvailable = instructors.filter((i) => i.status === 'active').length;
  const vehiclesAvailable = vehicles.filter((v) => v.status === 'available').length;
  const vehiclesService = vehicles.filter((v) => v.status === 'service').length;

  // 6 Months financial data for admin bar chart
  const financialHistory = db.getMonthlyFinancialHistory();
  const maxMonthlyVal = Math.max(...financialHistory.map((m) => Math.max(m.income, m.expense)), 10000);

  // Alerts
  const dueFollowUps = notes.filter((n) => !n.is_done && n.follow_up_date && n.follow_up_date <= today);
  const expiringVehicles = vehicles.filter((v) => {
    const thirtyDaysLater = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
    return (
      (v.insurance_expiry && v.insurance_expiry <= thirtyDaysLater) ||
      (v.pollution_expiry && v.pollution_expiry <= thirtyDaysLater) ||
      (v.fitness_expiry && v.fitness_expiry <= thirtyDaysLater)
    );
  });
  const expiringInstructors = instructors.filter((i) => {
    const sixtyDaysLater = new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0];
    return i.licence_expiry && i.licence_expiry <= sixtyDaysLater;
  });

  // Quick Action for today's appointment status
  const handleQuickStatus = (appId: string, status: 'completed' | 'absent') => {
    db.updateAppointmentStatus(appId, status, undefined, role);
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="space-y-6">
      {/* Friendly Summary Line at top */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-50 via-teal-50/40 to-white dark:from-teal-950/40 dark:via-slate-900 dark:to-slate-900 border border-teal-200/60 dark:border-teal-900/40 flex items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-sm shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
              {todayAppointments.length} appointments today{isAdmin ? ` · ${pendingPaymentsList.length} pending payments` : ''} · {testsTomorrow.length > 0 ? `${testsTomorrow.length} driving tests tomorrow` : `${upcomingTests.length} upcoming driving tests`}
            </h2>
            <p className="text-xs text-teal-800 dark:text-teal-300 font-medium">
              {settings.school_name} • {formatDate(today)}
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2">
          <button
            onClick={() => navigate('/appointments?action=book')}
            className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
          >
            + Quick Book Class
          </button>
        </div>
      </div>

      {/* Top Row of Stat Cards */}
      <div className={`grid grid-cols-2 sm:grid-cols-3 ${isAdmin ? 'lg:grid-cols-6' : 'lg:grid-cols-4'} gap-3`}>
        {/* Total Candidates */}
        <div
          onClick={() => navigate('/candidates')}
          className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs hover:border-teal-500 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Candidates</span>
            <Users className="w-4 h-4 text-teal-600 group-hover:scale-110 transition" />
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white">
            {totalCandidates}
          </div>
          <div className="text-[10px] text-teal-600 font-semibold mt-0.5">
            {activeCandidates} active students
          </div>
        </div>

        {/* Active Candidates */}
        <div
          onClick={() => navigate('/candidates')}
          className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs hover:border-teal-500 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Completed Students</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition" />
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white">
            {completedCandidates}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Licenced & passed
          </div>
        </div>

        {/* Today's Appointments */}
        <div
          onClick={() => navigate('/appointments')}
          className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs hover:border-teal-500 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Today's Classes</span>
            <Calendar className="w-4 h-4 text-sky-600 group-hover:scale-110 transition" />
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white">
            {todayAppointments.length}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Tomorrow: {tomorrowAppointments.length} booked
          </div>
        </div>

        {/* Pending Payments (Admin Only - Strict Privacy) */}
        {isAdmin && (
          <div
            onClick={() => navigate('/pending-balance')}
            className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs hover:border-amber-500 transition cursor-pointer group"
          >
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider">Pending Balance</span>
              <AlertCircle className="w-4 h-4 text-amber-500 group-hover:scale-110 transition" />
            </div>
            <div className="text-xl font-black text-amber-600 font-mono">
              {formatINR(totalPendingBalance)}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {pendingPaymentsList.length} candidates pending
            </div>
          </div>
        )}

        {/* Today's Collection (Admin Only - Strict Privacy) */}
        {isAdmin && (
          <div
            onClick={() => navigate('/payments')}
            className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs hover:border-teal-500 transition cursor-pointer group"
          >
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider">Today's Collection</span>
              <CreditCard className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition" />
            </div>
            <div className="text-xl font-black text-emerald-600 font-mono">
              {formatINR(todayCollection)}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Month: {formatINR(thisMonthCollection)}
            </div>
          </div>
        )}

        {/* Driving Tests This Week */}
        <div
          onClick={() => navigate('/driving-tests')}
          className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs hover:border-teal-500 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Driving Tests</span>
            <FileCheck2 className="w-4 h-4 text-purple-600 group-hover:scale-110 transition" />
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white">
            {upcomingTests.length}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {testsTomorrow.length > 0 ? `${testsTomorrow.length} tests tomorrow` : 'RTO scheduled'}
          </div>
        </div>

        {/* Instructors Available */}
        <div
          onClick={() => navigate('/instructors')}
          className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs hover:border-teal-500 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Instructors</span>
            <GraduationCap className="w-4 h-4 text-teal-600 group-hover:scale-110 transition" />
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white">
            {instructorsAvailable} / {instructors.length}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Available on duty
          </div>
        </div>

        {/* Vehicles Available */}
        <div
          onClick={() => navigate('/vehicles')}
          className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs hover:border-teal-500 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Vehicles Available</span>
            <Car className="w-4 h-4 text-teal-600 group-hover:scale-110 transition" />
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white">
            {vehiclesAvailable} / {vehicles.length}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Ready for lessons
          </div>
        </div>

        {/* Vehicles Under Service */}
        <div
          onClick={() => navigate('/vehicles')}
          className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs hover:border-teal-500 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Under Service</span>
            <AlertTriangle className="w-4 h-4 text-amber-500 group-hover:scale-110 transition" />
          </div>
          <div className={`text-xl font-black ${vehiclesService > 0 ? 'text-amber-600' : 'text-slate-900 dark:text-white'}`}>
            {vehiclesService}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {vehiclesService > 0 ? 'Bookings blocked' : '0 maintenance'}
          </div>
        </div>
      </div>

      {/* Main Two Column Section: Today's Schedule + Alerts & Financials */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Today's Schedule */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Today's Schedule & Attendance
              </h3>
              <p className="text-xs text-slate-400">
                {todayAppointments.length} classes for {formatDate(today)}. Quick attendance buttons for morning reception.
              </p>
            </div>
            <button
              onClick={() => navigate('/appointments')}
              className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1"
            >
              <span>View Grid</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {todayAppointments.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-400">
                No classes booked for today. Use "+ Book Class" to schedule.
              </div>
            ) : (
              todayAppointments.map((app) => {
                const cand = candidates.find((c) => c.id === app.candidate_id);
                const inst = instructors.find((i) => i.id === app.instructor_id);
                const veh = vehicles.find((v) => v.id === app.vehicle_id);

                return (
                  <div key={app.id} className="py-3 flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3">
                      <div className="text-center w-16 p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                        <div className="text-xs font-black font-mono text-slate-900 dark:text-white">
                          {formatTime12(app.start_time)}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {app.end_time}
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            onClick={() => cand && navigate(`/candidates/${cand.id}`)}
                            className="font-bold text-sm text-slate-900 dark:text-white hover:text-teal-600 cursor-pointer"
                          >
                            {cand?.full_name || 'Candidate'}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                            {cand?.candidate_code}
                          </span>
                          <Badge variant={getStatusBadgeVariant(app.status)} size="sm">
                            {app.status}
                          </Badge>
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          Instructor: <strong className="text-slate-600 dark:text-slate-300">{inst?.name}</strong> • Vehicle:{' '}
                          <span className="font-mono">{veh?.registration_number}</span>
                        </div>
                      </div>
                    </div>

                    {/* Quick action buttons */}
                    {app.status === 'booked' ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleQuickStatus(app.id, 'completed')}
                          className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition"
                        >
                          Completed
                        </button>
                        <button
                          onClick={() => handleQuickStatus(app.id, 'absent')}
                          className="px-2.5 py-1 text-xs font-bold rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition"
                        >
                          Absent
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 font-medium">Recorded</span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right 1 Col: Alerts Panel & Monthly Financial Summary */}
        <div className="space-y-6">
          {/* Action Alerts Panel */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-xs">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Action Alerts Panel
              </h3>
              <p className="text-xs text-slate-400">Expiring documents & pending actions</p>
            </div>

            <div className="space-y-2.5">
              {/* Due Follow-ups Today */}
              {dueFollowUps.length > 0 && (
                <div className="p-3 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-900 flex items-start gap-2.5 text-xs">
                  <FileText className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-teal-900 dark:text-teal-200">
                      {dueFollowUps.length} Candidate Follow-up(s) Due
                    </div>
                    <p className="text-[11px] text-teal-700 dark:text-teal-400 mt-0.5">
                      Call student regarding remaining fees or test documents.
                    </p>
                  </div>
                </div>
              )}

              {/* Expiring Vehicle Documents */}
              {expiringVehicles.length > 0 && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 flex items-start gap-2.5 text-xs">
                  <Car className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-rose-900 dark:text-rose-200">
                      Vehicle Document Expiry (&lt;30 Days)
                    </div>
                    <p className="text-[11px] text-rose-700 dark:text-rose-400 mt-0.5">
                      KA-03-CD-5678 (Insurance / Pollution renewal required).
                    </p>
                    <button
                      onClick={() => navigate('/vehicles')}
                      className="text-[11px] font-bold text-rose-900 dark:text-rose-300 underline mt-1 block"
                    >
                      View Vehicle Fleet →
                    </button>
                  </div>
                </div>
              )}

              {/* Pending Balances alert (Admin Only) */}
              {isAdmin && pendingPaymentsList.length > 0 && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 flex items-start gap-2.5 text-xs">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-amber-900 dark:text-amber-200">
                      {pendingPaymentsList.length} Pending Payments ({formatINR(totalPendingBalance)})
                    </div>
                    <button
                      onClick={() => navigate('/pending-balance')}
                      className="text-[11px] font-bold text-amber-900 dark:text-amber-300 underline mt-1 block"
                    >
                      Open Recovery Desk →
                    </button>
                  </div>
                </div>
              )}

              {/* Driving Tests Tomorrow */}
              {testsTomorrow.length > 0 && (
                <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900 flex items-start gap-2.5 text-xs">
                  <FileCheck2 className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-purple-900 dark:text-purple-200">
                      {testsTomorrow.length} Driving Tests Tomorrow
                    </div>
                    <p className="text-[11px] text-purple-700 dark:text-purple-400 mt-0.5">
                      Verify candidate RTO file and assign test escort car.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Current Month Net Finances & 6-Month Bar Chart (Admin Only) */}
          {isAdmin && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    Monthly Profit & Loss
                  </h3>
                  <p className="text-xs text-slate-400">Current month vs expenses</p>
                </div>
                <Badge variant="teal" size="sm">Admin</Badge>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 font-mono">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase">Revenue</span>
                  <div className="font-bold text-xs text-emerald-600 mt-0.5">
                    {formatINR(thisMonthCollection)}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase">Expenses</span>
                  <div className="font-bold text-xs text-rose-600 mt-0.5">
                    {formatINR(thisMonthTotalExpense)}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase">Net Margin</span>
                  <div className={`font-black text-xs mt-0.5 ${thisMonthNet >= 0 ? 'text-teal-600' : 'text-rose-600'}`}>
                    {formatINR(thisMonthNet)}
                  </div>
                </div>
              </div>

              {/* 6-Month Visual Bar Chart */}
              <div className="space-y-2 pt-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Last 6 Months Revenue Trend
                </span>
                <div className="flex items-end justify-between h-28 gap-2 pt-4 px-1">
                  {financialHistory.map((m) => {
                    const heightPercent = Math.max(10, Math.min(100, Math.round((m.income / maxMonthlyVal) * 100)));
                    return (
                      <div key={m.monthKey} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className="w-full max-w-[28px] rounded-t-lg bg-teal-500 hover:bg-teal-600 transition-all cursor-pointer relative group"
                        >
                          <div className="opacity-0 group-hover:opacity-100 transition absolute bottom-full mb-1 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-900 text-white text-[10px] rounded whitespace-nowrap z-20 font-mono">
                            {formatINR(m.income)}
                          </div>
                        </div>
                        <span className="text-[10px] font-semibold text-slate-400">
                          {m.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
