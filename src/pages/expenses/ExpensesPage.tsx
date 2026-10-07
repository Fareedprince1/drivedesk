import React, { useState, useMemo } from 'react';
import {
  TrendingDown,
  Plus,
  Search,
  Filter,
  Calendar,
  Fuel,
  Wrench,
  Users,
  Building,
  FileText,
  Car,
  CreditCard,
  Download,
  Trash2,
  Edit2,
  CheckCircle2,
  PieChart,
} from 'lucide-react';
import { db } from '../../lib/storage';
import { useAuth } from '../../context/AuthContext';
import { formatDate, formatINR, getTodayIST } from '../../lib/formatters';
import { exportToCSV } from '../../lib/exportUtils';
import type { Expense, ExpenseCategory, PaymentMode, Vehicle } from '../../types';

const CATEGORIES: {
  key: ExpenseCategory;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bg: string;
}[] = [
  { key: 'fuel', label: 'Fuel / Petrol', icon: Fuel, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30' },
  { key: 'vehicle_service', label: 'Vehicle Service', icon: Wrench, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/30' },
  { key: 'repairs', label: 'Repairs & Spares', icon: Wrench, color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-950/30' },
  { key: 'salary', label: 'Staff & Instructor Salary', icon: Users, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950/30' },
  { key: 'office', label: 'Office, Rent & Utilities', icon: Building, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
  { key: 'rto', label: 'RTO Government Fees', icon: FileText, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-950/30' },
  { key: 'miscellaneous', label: 'Miscellaneous', icon: PieChart, color: 'text-slate-600', bg: 'bg-slate-50 dark:bg-slate-800' },
];

export const ExpensesPage: React.FC = () => {
  const { role: currentRole } = useAuth();
  const [dataVersion, setDataVersion] = useState(0);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedVehicle, setSelectedVehicle] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<'this_month' | 'last_month' | 'all'>('this_month');

  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // Form State
  const today = getTodayIST();
  const [form, setForm] = useState<{
    expense_date: string;
    category: ExpenseCategory;
    amount: string;
    vehicle_id: string;
    payment_mode: PaymentMode;
    description: string;
  }>({
    expense_date: today,
    category: 'fuel',
    amount: '',
    vehicle_id: '',
    payment_mode: 'upi',
    description: '',
  });

  const vehicles: Vehicle[] = useMemo(() => db.getVehicles(), [dataVersion]);
  const expenses: Expense[] = useMemo(() => db.getExpenses(), [dataVersion]);

  // Current Month calculations
  const currentMonthPrefix = today.slice(0, 7); // "2026-10"
  const lastMonthDate = new Date();
  lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
  const lastMonthPrefix = lastMonthDate.toISOString().slice(0, 7);

  // Summary Metrics
  const summary = useMemo(() => {
    const thisMonthExpenses = expenses.filter((e) => e.expense_date.startsWith(currentMonthPrefix));
    const totalThisMonth = thisMonthExpenses.reduce((sum, e) => sum + e.amount, 0);

    const fuelThisMonth = thisMonthExpenses
      .filter((e) => e.category === 'fuel')
      .reduce((sum, e) => sum + e.amount, 0);

    const serviceThisMonth = thisMonthExpenses
      .filter((e) => e.category === 'vehicle_service' || e.category === 'repairs')
      .reduce((sum, e) => sum + e.amount, 0);

    const salaryThisMonth = thisMonthExpenses
      .filter((e) => e.category === 'salary')
      .reduce((sum, e) => sum + e.amount, 0);

    // Category breakdown
    const categoryTotals: Record<string, number> = {};
    thisMonthExpenses.forEach((e) => {
      categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
    });

    let topCategory = '-';
    let topCategoryAmount = 0;
    Object.entries(categoryTotals).forEach(([cat, amt]) => {
      if (amt > topCategoryAmount) {
        topCategoryAmount = amt;
        topCategory = cat;
      }
    });

    return {
      totalThisMonth,
      fuelThisMonth,
      serviceThisMonth,
      salaryThisMonth,
      topCategory,
      topCategoryAmount,
      totalRecords: expenses.length,
    };
  }, [expenses, currentMonthPrefix]);

  // Filtered List
  const filteredExpenses = useMemo(() => {
    return expenses.filter((item) => {
      // Date filter
      if (dateFilter === 'this_month' && !item.expense_date.startsWith(currentMonthPrefix)) {
        return false;
      }
      if (dateFilter === 'last_month' && !item.expense_date.startsWith(lastMonthPrefix)) {
        return false;
      }

      // Category filter
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }

      // Vehicle filter
      if (selectedVehicle !== 'all') {
        if (selectedVehicle === 'none' && item.vehicle_id) return false;
        if (selectedVehicle !== 'none' && item.vehicle_id !== selectedVehicle) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const descMatch = item.description.toLowerCase().includes(q);
        const catMatch = item.category.toLowerCase().includes(q);
        const amountMatch = String(item.amount).includes(q);
        const vehicle = vehicles.find((v) => v.id === item.vehicle_id);
        const vehMatch = vehicle ? `${vehicle.model} ${vehicle.registration_number}`.toLowerCase().includes(q) : false;
        return descMatch || catMatch || amountMatch || vehMatch;
      }

      return true;
    });
  }, [expenses, dateFilter, selectedCategory, selectedVehicle, searchQuery, currentMonthPrefix, lastMonthPrefix, vehicles]);

  // Handlers
  const handleOpenAdd = () => {
    setForm({
      expense_date: today,
      category: 'fuel',
      amount: '',
      vehicle_id: '',
      payment_mode: 'upi',
      description: '',
    });
    setAddModalOpen(true);
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(form.amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;

    db.addExpense(
      {
        expense_date: form.expense_date,
        category: form.category,
        amount: parsedAmount,
        vehicle_id: form.vehicle_id || null,
        payment_mode: form.payment_mode,
        description: form.description,
        created_by: currentRole === 'admin' ? 'Admin' : 'Staff',
      },
      currentRole
    );

    setAddModalOpen(false);
    setDataVersion((v) => v + 1);
  };

  const handleOpenEdit = (item: Expense) => {
    setEditingExpense(item);
    setForm({
      expense_date: item.expense_date,
      category: item.category,
      amount: String(item.amount),
      vehicle_id: item.vehicle_id || '',
      payment_mode: item.payment_mode,
      description: item.description,
    });
    setEditModalOpen(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpense) return;
    const parsedAmount = parseFloat(form.amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;

    db.updateExpense(
      editingExpense.id,
      {
        expense_date: form.expense_date,
        category: form.category,
        amount: parsedAmount,
        vehicle_id: form.vehicle_id || null,
        payment_mode: form.payment_mode,
        description: form.description,
      },
      currentRole
    );

    setEditModalOpen(false);
    setDataVersion((v) => v + 1);
  };

  const handleDelete = (id: string, amount: number) => {
    if (window.confirm(`Are you sure you want to delete this expense record of ${formatINR(amount)}?`)) {
      db.deleteExpense(id, currentRole);
      setDataVersion((v) => v + 1);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Date', 'Category', 'Amount (INR)', 'Payment Mode', 'Vehicle', 'Description', 'Recorded By'];
    const rows = filteredExpenses.map((e) => {
      const veh = vehicles.find((v) => v.id === e.vehicle_id);
      return [
        formatDate(e.expense_date),
        e.category.toUpperCase().replace('_', ' '),
        e.amount,
        e.payment_mode.toUpperCase(),
        veh ? `${veh.model} (${veh.registration_number})` : '-',
        e.description,
        e.created_by || 'Admin',
      ];
    });

    exportToCSV(`GemDrivingSchool_Expenses_${today}.csv`, headers, rows);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <TrendingDown className="h-7 w-7 text-rose-600 dark:text-rose-400" />
            Expenses Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track operational spending: fuel, maintenance, salaries, RTO fees and office overheads.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 shadow-xs"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition"
          >
            <Plus className="h-4 w-4" />
            Record Expense
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Spent This Month</span>
            <span className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600">
              <TrendingDown className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              {formatINR(summary.totalThisMonth)}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Across all categories</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Fuel Expenditure</span>
            <span className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600">
              <Fuel className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black tracking-tight text-amber-600 dark:text-amber-400">
              {formatINR(summary.fuelThisMonth)}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Fleet petrol & diesel</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Service & Maintenance</span>
            <span className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600">
              <Wrench className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black tracking-tight text-blue-600 dark:text-blue-400">
              {formatINR(summary.serviceThisMonth)}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Repairs & routine checks</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Salary Payouts</span>
            <span className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600">
              <Users className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black tracking-tight text-purple-600 dark:text-purple-400">
              {formatINR(summary.salaryThisMonth)}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Instructors & desk staff</p>
          </div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search description, vehicle, amount..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Date Filter */}
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as any)}
            className="text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 py-1.5 px-2.5 focus:outline-hidden"
          >
            <option value="this_month">This Month</option>
            <option value="last_month">Last Month</option>
            <option value="all">All Time</option>
          </select>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 py-1.5 px-2.5 focus:outline-hidden"
          >
            <option value="all">All Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat.key} value={cat.key}>
                {cat.label}
              </option>
            ))}
          </select>

          {/* Vehicle Filter */}
          <select
            value={selectedVehicle}
            onChange={(e) => setSelectedVehicle(e.target.value)}
            className="text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 py-1.5 px-2.5 focus:outline-hidden"
          >
            <option value="all">All Vehicles</option>
            <option value="none">General / No Vehicle</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.model} ({v.registration_number})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Expenses Table & Mobile Cards */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-xs">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-3">Vehicle</th>
                <th className="py-3 px-3">Mode</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No expense records found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((item) => {
                  const catConfig = CATEGORIES.find((c) => c.key === item.category) || CATEGORIES[6];
                  const IconComponent = catConfig.icon;
                  const vehicle = vehicles.find((v) => v.id === item.vehicle_id);

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50">
                      <td className="py-3 px-4 whitespace-nowrap font-medium text-slate-900 dark:text-white">
                        {formatDate(item.expense_date)}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold ${catConfig.bg} ${catConfig.color}`}
                        >
                          <IconComponent className="h-3.5 w-3.5 shrink-0" />
                          {catConfig.label}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900 dark:text-slate-100 max-w-sm line-clamp-1">
                          {item.description}
                        </div>
                        {item.created_by && (
                          <div className="text-[10px] text-slate-400 mt-0.5">By {item.created_by}</div>
                        )}
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        {vehicle ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-mono">
                            <Car className="h-3 w-3" />
                            {vehicle.model}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">-</span>
                        )}
                      </td>

                      <td className="py-3 px-3 uppercase text-[11px] font-bold text-slate-500">
                        {item.payment_mode}
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap font-bold text-sm text-rose-600 dark:text-rose-400">
                        {formatINR(item.amount)}
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-800"
                            title="Edit Expense"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id, item.amount)}
                            className="p-1.5 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600"
                            title="Delete Expense"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Expenses Cards View */}
        <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800">
          {filteredExpenses.length === 0 ? (
            <div className="py-12 px-4 text-center text-slate-400">
              No expense records found matching your filters.
            </div>
          ) : (
            filteredExpenses.map((item) => {
              const catConfig = CATEGORIES.find((c) => c.key === item.category) || CATEGORIES[6];
              const IconComponent = catConfig.icon;
              const vehicle = vehicles.find((v) => v.id === item.vehicle_id);

              return (
                <div key={item.id} className="p-4 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[11px] font-semibold ${catConfig.bg} ${catConfig.color}`}
                      >
                        <IconComponent className="h-3 w-3" />
                        <span>{catConfig.label}</span>
                      </span>
                      <p className="text-xs text-slate-800 dark:text-slate-200 font-medium mt-1">
                        {item.description || 'No description'}
                      </p>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {formatDate(item.expense_date)} • <span className="uppercase font-semibold">{item.payment_mode}</span>
                        {vehicle && ` • ${vehicle.model} (${vehicle.registration_number})`}
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-bold text-sm text-rose-600 dark:text-rose-400 font-mono">
                        {formatINR(item.amount)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                      title="Edit Expense"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id, item.amount)}
                      className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-900 text-rose-600 hover:bg-rose-50"
                      title="Delete Expense"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* MODAL: ADD / EDIT EXPENSE */}
      {(addModalOpen || editModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-rose-600" />
                {addModalOpen ? 'Record New Expense' : 'Edit Expense Details'}
              </h3>
              <button
                onClick={() => {
                  setAddModalOpen(false);
                  setEditModalOpen(false);
                }}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={addModalOpen ? handleSaveAdd : handleSaveEdit} className="mt-4 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Expense Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={form.expense_date}
                    onChange={(e) => setForm({ ...form, expense_date: e.target.value })}
                    className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Amount (₹) *
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    required
                    placeholder="e.g. 2500"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    className="w-full text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Category *
                </label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value as ExpenseCategory })}
                  className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-slate-900 dark:text-white"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.key} value={cat.key}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Vehicle (optional or recommended for fuel/service/repairs) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Associated Vehicle (Optional)
                </label>
                <select
                  value={form.vehicle_id}
                  onChange={(e) => setForm({ ...form, vehicle_id: e.target.value })}
                  className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-slate-900 dark:text-white"
                >
                  <option value="">None / General Expense</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.model} ({v.registration_number})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Payment Mode *
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['upi', 'cash', 'card', 'bank_transfer'] as PaymentMode[]).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setForm({ ...form, payment_mode: mode })}
                      className={`py-1.5 text-[11px] font-bold rounded-lg uppercase border transition ${
                        form.payment_mode === mode
                          ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {mode === 'bank_transfer' ? 'Bank' : mode}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description / Remarks *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Shell Petrol 25L + Engine oil topup"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setAddModalOpen(false);
                    setEditModalOpen(false);
                  }}
                  className="px-3.5 py-1.5 rounded-lg text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
                >
                  {addModalOpen ? 'Save Expense' : 'Update Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
