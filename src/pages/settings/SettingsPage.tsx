import React, { useState, useEffect } from 'react';
import {
  Package as PackageIcon,
  Building,
  Sliders,
  Users,
  History,
  RotateCcw,
  Plus,
  Edit2,
  Check,
  AlertTriangle,
  Save,
  ShieldAlert,
  Database,
} from 'lucide-react';
import { db } from '../../lib/storage';
import type { Package, SchoolSettings, ActivityLogItem } from '../../types';
import { formatINR, formatDateTime, getTodayIST } from '../../lib/formatters';
import { Modal } from '../../components/common/Modal';
import { Badge } from '../../components/common/Badge';
import { useAuth } from '../../context/AuthContext';
import { exportToJSON } from '../../lib/exportUtils';

export const SettingsPage: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'packages' | 'profile' | 'rules' | 'staff' | 'logs'>('packages');

  const [packages, setPackages] = useState<Package[]>(() => db.getPackages());
  const [settings, setSettings] = useState<SchoolSettings>(() => db.getSettings());
  const [activityLogs, setActivityLogs] = useState<ActivityLogItem[]>(() => db.getActivityLogs());

  // Package Modal State
  const [isPkgModalOpen, setIsPkgModalOpen] = useState(false);
  const [editingPkg, setEditingPkg] = useState<Package | null>(null);
  const [pkgForm, setPkgForm] = useState({
    name: '',
    vehicle_type: 'car' as 'car' | 'bike',
    total_classes: 20,
    fee: 8000,
    validity_days: 60,
    description: '',
  });

  // Settings Feedback
  const [saveMessage, setSaveMessage] = useState('');

  // Reset Demo Data confirmation
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // If not admin, block access
  if (!isAdmin) {
    return (
      <div className="p-8 max-w-xl mx-auto text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm mt-8">
        <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Admin Access Restricted</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
          Settings, financial configurations, and package rates are restricted to driving school Admins.
          You are currently logged in with the <strong>Staff (Receptionist)</strong> role.
        </p>
      </div>
    );
  }

  const handleOpenAddPkg = () => {
    setEditingPkg(null);
    setPkgForm({
      name: '',
      vehicle_type: 'car',
      total_classes: 15,
      fee: 7000,
      validity_days: 60,
      description: '',
    });
    setIsPkgModalOpen(true);
  };

  const handleOpenEditPkg = (pkg: Package) => {
    setEditingPkg(pkg);
    setPkgForm({
      name: pkg.name,
      vehicle_type: pkg.vehicle_type,
      total_classes: pkg.total_classes,
      fee: pkg.fee,
      validity_days: pkg.validity_days || 60,
      description: pkg.description || '',
    });
    setIsPkgModalOpen(true);
  };

  const handleSavePkg = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPkg) {
      db.updatePackage(editingPkg.id, {
        name: pkgForm.name,
        vehicle_type: pkgForm.vehicle_type,
        total_classes: Number(pkgForm.total_classes),
        fee: Number(pkgForm.fee),
        validity_days: pkgForm.validity_days ? Number(pkgForm.validity_days) : null,
        description: pkgForm.description,
      });
    } else {
      db.createPackage({
        name: pkgForm.name,
        vehicle_type: pkgForm.vehicle_type,
        total_classes: Number(pkgForm.total_classes),
        fee: Number(pkgForm.fee),
        validity_days: pkgForm.validity_days ? Number(pkgForm.validity_days) : null,
        description: pkgForm.description,
        is_active: true,
      });
    }
    setPackages(db.getPackages());
    setActivityLogs(db.getActivityLogs());
    setIsPkgModalOpen(false);
  };

  const handleTogglePkgActive = (pkg: Package) => {
    db.updatePackage(pkg.id, { is_active: !pkg.is_active });
    setPackages(db.getPackages());
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    db.updateSettings(settings);
    setSaveMessage('Settings updated successfully!');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const handleClearData = () => {
    db.clearAllData();
    setPackages(db.getPackages());
    setSettings(db.getSettings());
    setActivityLogs(db.getActivityLogs());
    setIsResetConfirmOpen(false);
    setSaveMessage('All operational data cleared! Clean slate ready for Gem Driving School.');
    setTimeout(() => setSaveMessage(''), 4000);
  };

  const handleLoadDemoData = () => {
    db.loadDemoData();
    setPackages(db.getPackages());
    setSettings(db.getSettings());
    setActivityLogs(db.getActivityLogs());
    setSaveMessage('Sample demo records loaded for preview.');
    setTimeout(() => setSaveMessage(''), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Settings & Packages
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configure driving packages, school profile, business cancellation rules, and staff roles
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            onClick={() => {
              const todayStr = getTodayIST();
              const backup = {
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
              exportToJSON(`GemDrivingSchool_Full_Backup_${todayStr}.json`, backup);
            }}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition cursor-pointer shadow-xs"
          >
            <Database className="w-3.5 h-3.5 text-teal-600" />
            <span>Export Backup</span>
          </button>

          <button
            onClick={handleLoadDemoData}
            title="Load sample records for preview or testing"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Load Demo Data</span>
          </button>

          <button
            onClick={() => setIsResetConfirmOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer"
          >
            <span>Clear All Data</span>
          </button>
        </div>
      </div>

      {saveMessage && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold rounded-xl flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>{saveMessage}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('packages')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'packages'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <PackageIcon className="w-4 h-4" />
          <span>Driving Packages ({packages.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'profile'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>School Profile & Receipt</span>
        </button>

        <button
          onClick={() => setActiveTab('rules')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'rules'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Business Rules</span>
        </button>

        <button
          onClick={() => setActiveTab('staff')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'staff'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Staff & User Roles</span>
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'logs'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Activity Log</span>
        </button>
      </div>

      {/* TAB CONTENT: PACKAGES */}
      {activeTab === 'packages' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Manage training courses, lesson counts, fees, and validity. Packages are auto-suggested when adding new candidates.
            </p>
            <button
              onClick={handleOpenAddPkg}
              className="flex items-center gap-1.5 px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Package</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className={`p-5 rounded-2xl border transition bg-white dark:bg-slate-900 ${
                  pkg.is_active
                    ? 'border-slate-200 dark:border-slate-800 shadow-xs'
                    : 'border-slate-200/50 dark:border-slate-800/50 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-base text-slate-900 dark:text-white">
                        {pkg.name}
                      </h3>
                      <Badge variant={pkg.vehicle_type === 'car' ? 'teal' : 'purple'} size="sm">
                        {pkg.vehicle_type}
                      </Badge>
                      {!pkg.is_active && <Badge variant="grey" size="sm">Inactive</Badge>}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                      {pkg.description || 'No description provided'}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-lg font-black text-slate-900 dark:text-white">
                      {formatINR(pkg.fee)}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {pkg.total_classes} classes (30 min)
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400">
                    Validity: {pkg.validity_days ? `${pkg.validity_days} days` : 'Unlimited'}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleTogglePkgActive(pkg)}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50"
                    >
                      {pkg.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => handleOpenEditPkg(pkg)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: SCHOOL PROFILE */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveSettings} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-w-2xl">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-2">School Contact & Receipt Details</h2>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Driving School Name *
            </label>
            <input
              type="text"
              required
              value={settings.school_name}
              onChange={(e) => setSettings({ ...settings, school_name: e.target.value })}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Address *
            </label>
            <textarea
              rows={2}
              required
              value={settings.address}
              onChange={(e) => setSettings({ ...settings, address: e.target.value })}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Official Phone Number *
              </label>
              <input
                type="text"
                required
                value={settings.phone}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                GST Number (Optional)
              </label>
              <input
                type="text"
                value={settings.gst_number || ''}
                onChange={(e) => setSettings({ ...settings, gst_number: e.target.value })}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Receipt Footer Note (Printed on candidate payment receipts)
            </label>
            <textarea
              rows={2}
              value={settings.receipt_footer_text}
              onChange={(e) => setSettings({ ...settings, receipt_footer_text: e.target.value })}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <button
            type="submit"
            className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
          >
            <Save className="w-4 h-4" />
            <span>Save School Profile</span>
          </button>
        </form>
      )}

      {/* TAB CONTENT: BUSINESS RULES */}
      {activeTab === 'rules' && (
        <form onSubmit={handleSaveSettings} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-6 max-w-2xl">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Class & Cancellation Policies</h2>

          <div className="flex items-start justify-between gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700">
            <div>
              <div className="font-bold text-sm text-slate-900 dark:text-white">
                Absent Consumes a Class
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                When turned ON, marking an appointment as "Absent" automatically counts toward the candidate's total used classes.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.absent_consumes_class}
                onChange={(e) => setSettings({ ...settings, absent_consumes_class: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
            </label>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Cancellation / Reschedule Cutoff Hours
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={1}
                max={48}
                value={settings.cancellation_cutoff_hours}
                onChange={(e) => setSettings({ ...settings, cancellation_cutoff_hours: Number(e.target.value) })}
                className="w-24 px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
              />
              <span className="text-xs text-slate-500">hours before class (Warns receptionist if cancelled within cutoff)</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Default Package Validity Period
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={15}
                max={365}
                value={settings.default_package_validity_days || 90}
                onChange={(e) => setSettings({ ...settings, default_package_validity_days: Number(e.target.value) })}
                className="w-24 px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
              />
              <span className="text-xs text-slate-500">days from enrollment start date</span>
            </div>
          </div>

          <button
            type="submit"
            className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
          >
            <Save className="w-4 h-4" />
            <span>Update Business Rules</span>
          </button>
        </form>
      )}

      {/* TAB CONTENT: STAFF & ROLES */}
      {activeTab === 'staff' && (
        <div className="space-y-6 max-w-2xl">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Team Roles & Access Control</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Roles are stored strictly in the separate <code className="text-teal-600">user_roles</code> table (never on the profile). Authenticated users with the 'staff' role can book classes, manage candidates, and collect payments, but cannot view Expenses, Reports, or modify Packages.
            </p>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 pt-2">
              <div className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <span>{user?.name || 'Administrator'}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 font-semibold">You</span>
                  </div>
                  <div className="text-xs text-slate-400">{user?.email}</div>
                </div>
                <Badge variant="teal">{user?.role?.toUpperCase() || 'ADMIN'}</Badge>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-teal-600" />
              <span>Create New Staff Account (Reception Desk)</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Admins can register new receptionist staff accounts in Supabase. Staff can manage morning bookings and candidate admissions without seeing expenses or reports.
            </p>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 space-y-2">
              <div className="font-semibold text-slate-800 dark:text-slate-200">How to add staff members:</div>
              <ul className="list-disc list-inside space-y-1 text-slate-500 dark:text-slate-400">
                <li>Tell your receptionist to register directly on the <strong>Create Account</strong> tab at the <a href="/login" className="text-teal-600 underline">Login Portal</a> with role <strong>Staff</strong>.</li>
                <li>Or invite them by email directly from your <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-teal-600 underline">Supabase Authentication Dashboard</a>.</li>
                <li>Their permissions will automatically restrict them from Expenses, Reports, and Settings.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: ACTIVITY LOG */}
      {activeTab === 'logs' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              System Audit Trail ({activityLogs.length} events)
            </h2>
            <span className="text-xs text-slate-400">Recorded automatically via DB triggers</span>
          </div>

          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 text-slate-500 font-semibold sticky top-0">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Table</th>
                  <th className="py-3 px-4">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {activityLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                    <td className="py-2.5 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                      {formatDateTime(log.created_at)}
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-slate-700 dark:text-slate-300">
                      {log.user_name}
                    </td>
                    <td className="py-2.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.action === 'INSERT'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : log.action === 'UPDATE'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-mono text-slate-500 uppercase">
                      {log.table_name}
                    </td>
                    <td className="py-2.5 px-4 text-slate-700 dark:text-slate-300 font-medium">
                      {log.details || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Package Add / Edit Modal */}
      <Modal
        isOpen={isPkgModalOpen}
        onClose={() => setIsPkgModalOpen(false)}
        title={editingPkg ? 'Edit Package' : 'Create New Training Package'}
      >
        <form onSubmit={handleSavePkg} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Package Name *
            </label>
            <input
              type="text"
              required
              value={pkgForm.name}
              onChange={(e) => setPkgForm({ ...pkgForm, name: e.target.value })}
              placeholder="e.g. Intensive 15-Day Car Bootcamp"
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Vehicle Type *
              </label>
              <select
                value={pkgForm.vehicle_type}
                onChange={(e) => setPkgForm({ ...pkgForm, vehicle_type: e.target.value as any })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="car">Four-Wheeler (Car)</option>
                <option value="bike">Two-Wheeler (Bike/Scooter)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Total Classes (30 min each) *
              </label>
              <input
                type="number"
                min={1}
                required
                value={pkgForm.total_classes}
                onChange={(e) => setPkgForm({ ...pkgForm, total_classes: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Total Fee (₹) *
              </label>
              <input
                type="number"
                min={0}
                required
                value={pkgForm.fee}
                onChange={(e) => setPkgForm({ ...pkgForm, fee: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Validity (Days)
              </label>
              <input
                type="number"
                min={1}
                value={pkgForm.validity_days || ''}
                onChange={(e) => setPkgForm({ ...pkgForm, validity_days: Number(e.target.value) })}
                placeholder="e.g. 60"
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Description & Curriculum Highlights
            </label>
            <textarea
              rows={3}
              value={pkgForm.description}
              onChange={(e) => setPkgForm({ ...pkgForm, description: e.target.value })}
              placeholder="What does this package include? (e.g. traffic rules, reverse parking, simulator training)"
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsPkgModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-slate-700 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold rounded-xl bg-teal-600 hover:bg-teal-700 text-white shadow-xs"
            >
              {editingPkg ? 'Save Changes' : 'Create Package'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Clear Confirmation Modal */}
      <Modal
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        title="Clear All Data (Start Fresh)?"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-rose-600 bg-rose-50 dark:bg-rose-950/40 p-3.5 rounded-xl border border-rose-200 dark:border-rose-900">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <p className="text-xs font-medium">
              This will remove all candidates, appointments, payments, expenses, instructors, and vehicles so you can start with a 100% clean database for Gem Driving School.
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setIsResetConfirmOpen(false)}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              onClick={handleClearData}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white"
            >
              Confirm Clear All
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
