import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Calendar,
  Download,
  Printer,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Car,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  PieChart,
  FileSpreadsheet,
  Clock,
  ArrowUpRight,
  Database,
} from 'lucide-react';
import { db } from '../../lib/storage';
import { formatDate, formatINR, formatTime12, getTodayIST } from '../../lib/formatters';
import { exportToCSV, exportToJSON } from '../../lib/exportUtils';
import type {
  Appointment,
  Candidate,
  Enrollment,
  Expense,
  Instructor,
  Package,
  Payment,
  Vehicle,
} from '../../types';

type ReportTab = 'pnl' | 'revenue' | 'appointments' | 'instructors' | 'vehicles' | 'pending';
type DateRangePreset = 'today' | 'this_week' | 'this_month' | 'last_month' | 'last_90_days' | 'custom';

export const ReportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ReportTab>('pnl');
  const [preset, setPreset] = useState<DateRangePreset>('this_month');

  const todayStr = getTodayIST();
  const [customStart, setCustomStart] = useState<string>(todayStr.slice(0, 7) + '-01');
  const [customEnd, setCustomEnd] = useState<string>(todayStr);

  // Compute actual date boundary strings [startStr, endStr]
  const [startDate, endDate] = useMemo(() => {
    const today = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const toYMD = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    if (preset === 'today') {
      return [todayStr, todayStr];
    } else if (preset === 'this_week') {
      const d = new Date(today);
      d.setDate(d.getDate() - 6);
      return [toYMD(d), todayStr];
    } else if (preset === 'this_month') {
      const start = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-01`;
      return [start, todayStr];
    } else if (preset === 'last_month') {
      const firstOfThisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastOfPrevMonth = new Date(firstOfThisMonth.getTime() - 1);
      const firstOfPrevMonth = new Date(lastOfPrevMonth.getFullYear(), lastOfPrevMonth.getMonth(), 1);
      return [toYMD(firstOfPrevMonth), toYMD(lastOfPrevMonth)];
    } else if (preset === 'last_90_days') {
      const d = new Date(today);
      d.setDate(d.getDate() - 90);
      return [toYMD(d), todayStr];
    } else {
      return [customStart, customEnd];
    }
  }, [preset, customStart, customEnd, todayStr]);

  // Load all data
  const candidates: Candidate[] = useMemo(() => db.getCandidates(true), []);
  const enrollments: Enrollment[] = useMemo(() => db.getEnrollments(), []);
  const packages: Package[] = useMemo(() => db.getPackages(true), []);
  const instructors: Instructor[] = useMemo(() => db.getInstructors(), []);
  const vehicles: Vehicle[] = useMemo(() => db.getVehicles(), []);
  const allPayments: Payment[] = useMemo(() => db.getPayments(), []);
  const allAppointments: Appointment[] = useMemo(() => db.getAppointments(), []);
  const allExpenses: Expense[] = useMemo(() => db.getExpenses(), []);

  // Filter payments in range (exclude reversals)
  const filteredPayments = useMemo(() => {
    return allPayments.filter(
      (p) =>
        !p.is_reversal &&
        !p.reverses_payment_id &&
        p.payment_date >= startDate &&
        p.payment_date <= endDate
    );
  }, [allPayments, startDate, endDate]);

  // Filter expenses in range
  const filteredExpenses = useMemo(() => {
    return allExpenses.filter((e) => e.expense_date >= startDate && e.expense_date <= endDate);
  }, [allExpenses, startDate, endDate]);

  // Filter appointments in range
  const filteredAppointments = useMemo(() => {
    return allAppointments.filter(
      (a) => !a.deleted_at && a.appointment_date >= startDate && a.appointment_date <= endDate
    );
  }, [allAppointments, startDate, endDate]);

  // Financial aggregates
  const totalRevenue = useMemo(() => {
    return filteredPayments.reduce((sum, p) => sum + p.amount, 0);
  }, [filteredPayments]);

  const totalExpense = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [filteredExpenses]);

  const netProfit = totalRevenue - totalExpense;
  const profitMargin = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0;

  // Revenue by Mode
  const revenueByMode = useMemo(() => {
    const modes: Record<string, number> = { upi: 0, cash: 0, card: 0, bank_transfer: 0 };
    filteredPayments.forEach((p) => {
      modes[p.mode] = (modes[p.mode] || 0) + p.amount;
    });
    return modes;
  }, [filteredPayments]);

  // Appointments Stats
  const appStats = useMemo(() => {
    const total = filteredAppointments.length;
    const completed = filteredAppointments.filter((a) => a.status === 'completed').length;
    const absent = filteredAppointments.filter((a) => a.status === 'absent').length;
    const cancelled = filteredAppointments.filter((a) => a.status === 'cancelled').length;
    const noShowRate = total > 0 ? Math.round((absent / total) * 100) : 0;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, absent, cancelled, noShowRate, completionRate };
  }, [filteredAppointments]);

  // Instructor Utilization
  const instructorStats = useMemo(() => {
    return instructors.map((inst) => {
      const instApps = filteredAppointments.filter((a) => a.instructor_id === inst.id);
      const completed = instApps.filter((a) => a.status === 'completed').length;
      const absent = instApps.filter((a) => a.status === 'absent').length;
      const completionRate = instApps.length > 0 ? Math.round((completed / instApps.length) * 100) : 0;

      return {
        instructor: inst,
        totalClasses: instApps.length,
        completed,
        absent,
        completionRate,
      };
    });
  }, [instructors, filteredAppointments]);

  // Vehicle Stats
  const vehicleStats = useMemo(() => {
    return vehicles.map((veh) => {
      const vehExpenses = filteredExpenses.filter((e) => e.vehicle_id === veh.id);
      const fuelCost = vehExpenses
        .filter((e) => e.category === 'fuel')
        .reduce((sum, e) => sum + e.amount, 0);
      const serviceCost = vehExpenses
        .filter((e) => e.category === 'vehicle_service' || e.category === 'repairs')
        .reduce((sum, e) => sum + e.amount, 0);
      const totalCost = fuelCost + serviceCost;

      const vehClasses = filteredAppointments.filter(
        (a) => a.vehicle_id === veh.id && a.status === 'completed'
      ).length;

      const costPerClass = vehClasses > 0 ? Math.round(totalCost / vehClasses) : 0;

      return {
        vehicle: veh,
        fuelCost,
        serviceCost,
        totalCost,
        completedClasses: vehClasses,
        costPerClass,
      };
    });
  }, [vehicles, filteredExpenses, filteredAppointments]);

  // Pending Balances
  const pendingBalances = useMemo(() => {
    return enrollments
      .map((enr) => {
        const candidate = candidates.find((c) => c.id === enr.candidate_id);
        const pkg = packages.find((p) => p.id === enr.package_id);
        const payments = allPayments.filter(
          (p) => p.enrollment_id === enr.id && !p.is_reversal && !p.reverses_payment_id
        );
        const paid = payments.reduce((sum, p) => sum + p.amount, 0);
        const feeAgreed = enr.total_fee - (enr.discount_amount || 0);
        const balance = Math.max(0, feeAgreed - paid);

        let lastPaymentDate = '-';
        if (payments.length > 0) {
          const sorted = [...payments].sort(
            (a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime()
          );
          lastPaymentDate = sorted[0].payment_date;
        }

        return {
          candidate,
          enrollment: enr,
          pkg,
          feeAgreed,
          paid,
          balance,
          lastPaymentDate,
        };
      })
      .filter((item) => item.candidate && item.balance > 0)
      .sort((a, b) => b.balance - a.balance);
  }, [enrollments, candidates, packages, allPayments]);

  const totalOutstanding = pendingBalances.reduce((sum, item) => sum + item.balance, 0);

  // Handlers
  const handlePrint = () => {
    window.print();
  };

  const handleExportTabToCSV = () => {
    if (activeTab === 'pnl' || activeTab === 'revenue') {
      const headers = ['Receipt #', 'Date', 'Candidate Name', 'Amount (INR)', 'Payment Mode', 'Notes'];
      const rows = filteredPayments.map((p) => {
        const c = candidates.find((cand) => cand.id === p.candidate_id);
        return [
          p.receipt_number,
          formatDate(p.payment_date),
          c?.full_name || '-',
          p.amount,
          p.mode.toUpperCase(),
          p.remarks || '',
        ];
      });
      exportToCSV(`GemDrivingSchool_Revenue_${startDate}_to_${endDate}.csv`, headers, rows);
    } else if (activeTab === 'appointments') {
      const headers = ['Date', 'Time Slot', 'Candidate', 'Instructor', 'Vehicle', 'Status', 'Remarks'];
      const rows = filteredAppointments.map((a) => {
        const c = candidates.find((cand) => cand.id === a.candidate_id);
        const inst = instructors.find((i) => i.id === a.instructor_id);
        const veh = vehicles.find((v) => v.id === a.vehicle_id);
        return [
          formatDate(a.appointment_date),
          `${formatTime12(a.start_time)} - ${formatTime12(a.end_time)}`,
          c?.full_name || '-',
          inst?.name || '-',
          veh ? `${veh.model} (${veh.registration_number})` : '-',
          a.status.toUpperCase(),
          a.remarks || '',
        ];
      });
      exportToCSV(`GemDrivingSchool_Appointments_${startDate}_to_${endDate}.csv`, headers, rows);
    } else if (activeTab === 'instructors') {
      const headers = ['Instructor Name', 'Phone', 'Total Scheduled', 'Completed Classes', 'No-Shows', 'Completion Rate %'];
      const rows = instructorStats.map((s) => [
        s.instructor.name,
        s.instructor.mobile,
        s.totalClasses,
        s.completed,
        s.absent,
        `${s.completionRate}%`,
      ]);
      exportToCSV(`GemDrivingSchool_Instructors_Utilization_${startDate}_to_${endDate}.csv`, headers, rows);
    } else if (activeTab === 'vehicles') {
      const headers = ['Vehicle Name', 'Reg Number', 'Fuel Cost (INR)', 'Service/Repair (INR)', 'Total Expenses (INR)', 'Classes Held', 'Cost Per Class (INR)'];
      const rows = vehicleStats.map((s) => [
        s.vehicle.model,
        s.vehicle.registration_number,
        s.fuelCost,
        s.serviceCost,
        s.totalCost,
        s.completedClasses,
        s.costPerClass,
      ]);
      exportToCSV(`GemDrivingSchool_Vehicle_Costs_${startDate}_to_${endDate}.csv`, headers, rows);
    } else if (activeTab === 'pending') {
      const headers = ['Candidate Code', 'Candidate Name', 'Mobile', 'Package', 'Fee Agreed (INR)', 'Paid (INR)', 'Balance Due (INR)', 'Last Payment Date'];
      const rows = pendingBalances.map((item) => [
        item.candidate?.candidate_code || '-',
        item.candidate?.full_name || '-',
        item.candidate?.mobile || '-',
        item.pkg?.name || '-',
        item.feeAgreed,
        item.paid,
        item.balance,
        formatDate(item.lastPaymentDate),
      ]);
      exportToCSV(`GemDrivingSchool_Pending_Balances_${todayStr}.csv`, headers, rows);
    }
  };

  const handleFullBackupJSON = () => {
    const backupData = {
      exportTimestamp: new Date().toISOString(),
      school: db.getSettings(),
      candidates: db.getCandidates(true),
      enrollments: db.getEnrollments(),
      packages: db.getPackages(true),
      instructors: db.getInstructors(),
      vehicles: db.getVehicles(),
      appointments: db.getAppointments(),
      payments: db.getPayments(),
      expenses: db.getExpenses(),
      rto: db.getRTORecords(),
      activityLog: db.getActivityLogs(),
    };
    exportToJSON(`GemDrivingSchool_Full_Backup_${todayStr}.json`, backupData);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <BarChart3 className="h-7 w-7 text-teal-600 dark:text-teal-400" />
            Business Reports & Analytics
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Financial reporting, instructor efficiency, fleet running costs, and database exports.
          </p>
        </div>

        {/* Global Export Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 shadow-xs"
          >
            <Printer className="h-4 w-4" />
            Print / PDF
          </button>
          <button
            onClick={handleExportTabToCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 shadow-xs"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            Export Tab CSV
          </button>
          <button
            onClick={handleFullBackupJSON}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-xs transition"
          >
            <Database className="h-4 w-4" />
            Backup Database
          </button>
        </div>
      </div>

      {/* Date Range Selector Toolbar */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {(
            [
              { key: 'today', label: 'Today' },
              { key: 'this_week', label: 'Last 7 Days' },
              { key: 'this_month', label: 'This Month' },
              { key: 'last_month', label: 'Last Month' },
              { key: 'last_90_days', label: 'Last 90 Days' },
              { key: 'custom', label: 'Custom' },
            ] as const
          ).map((item) => (
            <button
              key={item.key}
              onClick={() => setPreset(item.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                preset === item.key
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {preset === 'custom' && (
          <div className="flex items-center gap-2 w-full md:w-auto text-xs">
            <span className="text-slate-500">From:</span>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
            />
            <span className="text-slate-500">To:</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
            />
          </div>
        )}

        <div className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5" />
          <span>
            {formatDate(startDate)} to {formatDate(endDate)}
          </span>
        </div>
      </div>

      {/* Report Navigation Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-700 flex gap-1 overflow-x-auto print:hidden">
        {[
          { key: 'pnl', label: 'Profit & Loss (P&L)', icon: DollarSign },
          { key: 'revenue', label: 'Revenue & Modes', icon: TrendingUp },
          { key: 'appointments', label: 'Appointments & No-Show', icon: Calendar },
          { key: 'instructors', label: 'Instructor Utilization', icon: Users },
          { key: 'vehicles', label: 'Vehicle Fleet & Maintenance', icon: Car },
          { key: 'pending', label: 'Pending Fee Balances', icon: AlertCircle },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as ReportTab)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 whitespace-nowrap transition ${
                isActive
                  ? 'border-teal-600 text-teal-600 dark:text-teal-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* PRINT HEADER (Visible only in print) */}
      <div className="hidden print:block pb-4 mb-4 border-b border-slate-300">
        <h2 className="text-xl font-bold text-slate-900">Gem Driving School — Management Report</h2>
        <div className="text-xs text-slate-600 mt-1">
          Period: {formatDate(startDate)} to {formatDate(endDate)} • Generated on {formatDate(todayStr)}
        </div>
      </div>

      {/* TAB 1: PROFIT & LOSS (P&L) */}
      {activeTab === 'pnl' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-semibold">Total Revenue (Collections)</span>
                <span className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
                  <TrendingUp className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-3">
                <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                  {formatINR(totalRevenue)}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  {filteredPayments.length} admission & balance receipts
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-semibold">Total Operational Expenses</span>
                <span className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600">
                  <TrendingDown className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-3">
                <div className="text-3xl font-black text-rose-600 dark:text-rose-400">
                  {formatINR(totalExpense)}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  {filteredExpenses.length} fuel, service & salary entries
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-semibold">Net Operating Profit</span>
                <span className={`p-2 rounded-xl ${netProfit >= 0 ? 'bg-teal-50 text-teal-600' : 'bg-rose-50 text-rose-600'}`}>
                  <DollarSign className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-3">
                <div className={`text-3xl font-black ${netProfit >= 0 ? 'text-teal-600 dark:text-teal-400' : 'text-rose-600'}`}>
                  {formatINR(netProfit)}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Operating Margin: <strong>{profitMargin}%</strong>
                </p>
              </div>
            </div>
          </div>

          {/* Breakdown cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-xs">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-4">
                Expense Distribution
              </h3>
              <div className="space-y-3">
                {[
                  { cat: 'fuel', label: 'Fuel & Petrol' },
                  { cat: 'salary', label: 'Salaries' },
                  { cat: 'vehicle_service', label: 'Vehicle Service' },
                  { cat: 'repairs', label: 'Repairs' },
                  { cat: 'office', label: 'Office & Utilities' },
                  { cat: 'rto', label: 'RTO Government Fees' },
                ].map((item) => {
                  const amt = filteredExpenses
                    .filter((e) => e.category === item.cat)
                    .reduce((sum, e) => sum + e.amount, 0);
                  const pct = totalExpense > 0 ? Math.round((amt / totalExpense) * 100) : 0;

                  return (
                    <div key={item.cat} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium text-slate-700 dark:text-slate-300">{item.label}</span>
                        <span className="font-bold">{formatINR(amt)} ({pct}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                        <div className="bg-rose-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-xs">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-4">
                Collections by Payment Mode
              </h3>
              <div className="space-y-3">
                {(['upi', 'cash', 'card', 'bank_transfer'] as const).map((mode) => {
                  const amt = revenueByMode[mode] || 0;
                  const pct = totalRevenue > 0 ? Math.round((amt / totalRevenue) * 100) : 0;

                  return (
                    <div key={mode} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium uppercase text-slate-700 dark:text-slate-300">
                          {mode === 'bank_transfer' ? 'Bank Transfer' : mode}
                        </span>
                        <span className="font-bold">{formatINR(amt)} ({pct}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                        <div className="bg-teal-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: REVENUE & COLLECTIONS */}
      {activeTab === 'revenue' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Payment Receipts Ledger ({filteredPayments.length} entries)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Total collected: <strong>{formatINR(totalRevenue)}</strong>
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-slate-500 font-semibold uppercase">
                    <th className="py-2.5 px-4">Receipt #</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Candidate</th>
                    <th className="py-2.5 px-3">Mode</th>
                    <th className="py-2.5 px-3">Notes</th>
                    <th className="py-2.5 px-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredPayments.map((p) => {
                    const c = candidates.find((cand) => cand.id === p.candidate_id);
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50">
                        <td className="py-2.5 px-4 font-mono font-bold text-teal-600">
                          {p.receipt_number}
                        </td>
                        <td className="py-2.5 px-3">{formatDate(p.payment_date)}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">
                          {c?.full_name || '-'}
                        </td>
                        <td className="py-2.5 px-3 uppercase text-[11px] font-bold text-slate-500">
                          {p.mode}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 max-w-xs truncate">
                          {p.remarks || '-'}
                        </td>
                        <td className="py-2.5 px-4 text-right font-bold text-emerald-600">
                          {formatINR(p.amount)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: APPOINTMENTS & NO-SHOW */}
      {activeTab === 'appointments' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-xs">
              <span className="text-xs text-slate-500">Total Booked</span>
              <div className="text-2xl font-bold mt-1 text-slate-900 dark:text-white">{appStats.total}</div>
            </div>
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-xs">
              <span className="text-xs text-slate-500">Completed Lessons</span>
              <div className="text-2xl font-bold mt-1 text-emerald-600">{appStats.completed}</div>
            </div>
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-xs">
              <span className="text-xs text-slate-500">Absent / No-Show Rate</span>
              <div className="text-2xl font-bold mt-1 text-rose-600">{appStats.noShowRate}%</div>
            </div>
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-xs">
              <span className="text-xs text-slate-500">Completion Rate</span>
              <div className="text-2xl font-bold mt-1 text-teal-600">{appStats.completionRate}%</div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Scheduled Appointments in Period ({filteredAppointments.length})
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-slate-500 uppercase">
                    <th className="py-2.5 px-4">Date</th>
                    <th className="py-2.5 px-3">Slot Time</th>
                    <th className="py-2.5 px-3">Candidate</th>
                    <th className="py-2.5 px-3">Instructor</th>
                    <th className="py-2.5 px-3">Vehicle</th>
                    <th className="py-2.5 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredAppointments.map((a) => {
                    const c = candidates.find((cand) => cand.id === a.candidate_id);
                    const inst = instructors.find((i) => i.id === a.instructor_id);
                    const veh = vehicles.find((v) => v.id === a.vehicle_id);

                    return (
                      <tr key={a.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50">
                        <td className="py-2.5 px-4 font-medium">{formatDate(a.appointment_date)}</td>
                        <td className="py-2.5 px-3">
                          {formatTime12(a.start_time)} - {formatTime12(a.end_time)}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">
                          {c?.full_name || '-'}
                        </td>
                        <td className="py-2.5 px-3">{inst?.name || '-'}</td>
                        <td className="py-2.5 px-3">{veh?.model || '-'}</td>
                        <td className="py-2.5 px-4 text-right">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                              a.status === 'completed'
                                ? 'bg-emerald-100 text-emerald-800'
                                : a.status === 'absent'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-slate-100 text-slate-800'
                            }`}
                          >
                            {a.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: INSTRUCTOR UTILIZATION */}
      {activeTab === 'instructors' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Instructor Performance & Lesson Delivery
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-slate-500 uppercase">
                    <th className="py-3 px-4">Instructor</th>
                    <th className="py-3 px-3">Contact</th>
                    <th className="py-3 px-3 text-center">Total Scheduled</th>
                    <th className="py-3 px-3 text-center">Completed</th>
                    <th className="py-3 px-3 text-center">Student No-Shows</th>
                    <th className="py-3 px-4 text-right">Completion Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {instructorStats.map((item) => (
                    <tr key={item.instructor.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50">
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                        {item.instructor.name}
                      </td>
                      <td className="py-3 px-3 text-slate-500 font-mono">{item.instructor.mobile}</td>
                      <td className="py-3 px-3 text-center font-bold">{item.totalClasses}</td>
                      <td className="py-3 px-3 text-center text-emerald-600 font-bold">{item.completed}</td>
                      <td className="py-3 px-3 text-center text-rose-600 font-bold">{item.absent}</td>
                      <td className="py-3 px-4 text-right">
                        <span className="font-bold text-teal-600 text-sm">{item.completionRate}%</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: VEHICLE FLEET & MAINTENANCE */}
      {activeTab === 'vehicles' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Vehicle Operating Cost & Efficiency Analysis
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-slate-500 uppercase">
                    <th className="py-3 px-4">Vehicle</th>
                    <th className="py-3 px-3">Reg Number</th>
                    <th className="py-3 px-3 text-right">Fuel Cost</th>
                    <th className="py-3 px-3 text-right">Service / Repairs</th>
                    <th className="py-3 px-3 text-right">Total Running Cost</th>
                    <th className="py-3 px-3 text-center">Classes Driven</th>
                    <th className="py-3 px-4 text-right">Cost Per Class</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {vehicleStats.map((item) => (
                    <tr key={item.vehicle.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50">
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                        {item.vehicle.model}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-500">{item.vehicle.registration_number}</td>
                      <td className="py-3 px-3 text-right font-medium text-amber-600">
                        {formatINR(item.fuelCost)}
                      </td>
                      <td className="py-3 px-3 text-right font-medium text-blue-600">
                        {formatINR(item.serviceCost)}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-slate-900 dark:text-white">
                        {formatINR(item.totalCost)}
                      </td>
                      <td className="py-3 px-3 text-center font-bold">{item.completedClasses}</td>
                      <td className="py-3 px-4 text-right font-bold text-teal-600">
                        {formatINR(item.costPerClass)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: PENDING FEE BALANCES */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <div>
                <h4 className="font-bold text-xs text-amber-900 dark:text-amber-200">
                  Total Outstanding Balance Across Driving School
                </h4>
                <p className="text-[11px] text-amber-700 dark:text-amber-300">
                  {pendingBalances.length} candidates currently owe course fees
                </p>
              </div>
            </div>
            <div className="text-2xl font-black text-rose-600">
              {formatINR(totalOutstanding)}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-slate-500 uppercase">
                    <th className="py-3 px-4">Candidate Code</th>
                    <th className="py-3 px-3">Candidate Name</th>
                    <th className="py-3 px-3">Mobile</th>
                    <th className="py-3 px-3">Package</th>
                    <th className="py-3 px-3 text-right">Fee Agreed</th>
                    <th className="py-3 px-3 text-right">Paid So Far</th>
                    <th className="py-3 px-4 text-right">Balance Due</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {pendingBalances.map((item) => (
                    <tr key={item.enrollment.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50">
                      <td className="py-3 px-4 font-mono font-bold text-teal-600">
                        {item.candidate?.candidate_code}
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">
                        {item.candidate?.full_name}
                      </td>
                      <td className="py-3 px-3 font-mono">{item.candidate?.mobile}</td>
                      <td className="py-3 px-3">{item.pkg?.name}</td>
                      <td className="py-3 px-3 text-right">{formatINR(item.feeAgreed)}</td>
                      <td className="py-3 px-3 text-right text-emerald-600">{formatINR(item.paid)}</td>
                      <td className="py-3 px-4 text-right font-bold text-rose-600">
                        {formatINR(item.balance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
