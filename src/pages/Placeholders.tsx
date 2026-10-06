import React from 'react';
import { Calendar, CreditCard, AlertCircle, GraduationCap, Car, FileCheck2, TrendingDown, BarChart3 } from 'lucide-react';

export const AppointmentsPage: React.FC = () => (
  <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
    <Calendar className="w-10 h-10 text-teal-600 mx-auto" />
    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Appointments & Calendar (Stage 2)</h2>
    <p className="text-xs text-slate-500 max-w-md mx-auto">
      Will feature Day, Week, and Month grids, 30-min slot management, DB-level double booking prevention, and bulk reassignments.
    </p>
  </div>
);

export const PaymentsPage: React.FC = () => (
  <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
    <CreditCard className="w-10 h-10 text-emerald-600 mx-auto" />
    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Payments & Receipts (Stage 2)</h2>
    <p className="text-xs text-slate-500 max-w-md mx-auto">
      Will feature full payments list with date and mode filters, printable/downloadable receipts with WhatsApp sharing, and admin reversal flow.
    </p>
  </div>
);

export const PendingBalancePage: React.FC = () => (
  <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
    <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Pending Balance Recovery (Stage 2)</h2>
    <p className="text-xs text-slate-500 max-w-md mx-auto">
      Will feature pending balance table with total pending sum, last payment dates, and 1-tap WhatsApp reminder links.
    </p>
  </div>
);

export const InstructorsPage: React.FC = () => (
  <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
    <GraduationCap className="w-10 h-10 text-sky-600 mx-auto" />
    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Instructors & Leaves (Stage 3)</h2>
    <p className="text-xs text-slate-500 max-w-md mx-auto">
      Instructor profiles, working hours, leave periods blocking bookings, and performance tracking.
    </p>
  </div>
);

export const VehiclesPage: React.FC = () => (
  <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
    <Car className="w-10 h-10 text-teal-600 mx-auto" />
    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Vehicles & Maintenance (Stage 3)</h2>
    <p className="text-xs text-slate-500 max-w-md mx-auto">
      Vehicle fleet management, color-coded document expiry indicators (insurance, pollution, fitness), and service tracking.
    </p>
  </div>
);

export const DrivingTestsPage: React.FC = () => (
  <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
    <FileCheck2 className="w-10 h-10 text-purple-600 mx-auto" />
    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Driving Tests & RTO Tracking (Stage 3)</h2>
    <p className="text-xs text-slate-500 max-w-md mx-auto">
      Kanban pipeline (LL Pending → LL Completed → Training Ongoing → Test Booked → Test Completed → Licence Received).
    </p>
  </div>
);

export const ExpensesPage: React.FC = () => (
  <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
    <TrendingDown className="w-10 h-10 text-rose-600 mx-auto" />
    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Expenses (Admin Only) (Stage 4)</h2>
    <p className="text-xs text-slate-500 max-w-md mx-auto">
      Fuel, repairs, maintenance, salaries, office stationery expenses and P&L calculations.
    </p>
  </div>
);

export const ReportsPage: React.FC = () => (
  <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
    <BarChart3 className="w-10 h-10 text-teal-600 mx-auto" />
    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Reports & Data Exports (Stage 4)</h2>
    <p className="text-xs text-slate-500 max-w-md mx-auto">
      Daily & monthly appointment reports, collections, instructor utilization, and Excel/PDF backups.
    </p>
  </div>
);
