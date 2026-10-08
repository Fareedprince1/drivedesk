import React, { useState, useMemo } from 'react';
import {
  Car,
  Plus,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Wrench,
  Fuel,
  DollarSign,
  Calendar,
  FileCheck2,
  Edit2,
  ShieldAlert,
  Trash2,
} from 'lucide-react';
import { db } from '../../lib/storage';
import type { Vehicle, VehicleStatus } from '../../types';
import {
  formatDate,
  formatINR,
  getTodayIST,
} from '../../lib/formatters';
import { Badge, getStatusBadgeVariant } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { useAuth } from '../../context/AuthContext';

/**
 * Expiry indicator helper:
 * Green: > 30 days
 * Amber: <= 30 days
 * Red: expired (< today)
 */
function getExpiryIndicator(dateStr?: string | null): {
  color: 'green' | 'amber' | 'red' | 'grey';
  label: string;
} {
  if (!dateStr) return { color: 'grey', label: 'Not Recorded' };
  const today = getTodayIST();
  if (dateStr < today) {
    return { color: 'red', label: `Expired (${formatDate(dateStr)})` };
  }
  const diffTime = new Date(dateStr).getTime() - new Date(today).getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays <= 30) {
    return { color: 'amber', label: `${diffDays} days left (${formatDate(dateStr)})` };
  }
  return { color: 'green', label: `Valid till ${formatDate(dateStr)}` };
}

export const VehiclesPage: React.FC = () => {
  const { role, isAdmin } = useAuth();
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Form states
  const [formReg, setFormReg] = useState('');
  const [formType, setFormType] = useState<'car' | 'bike'>('car');
  const [formModel, setFormModel] = useState('');
  const [formInstructor, setFormInstructor] = useState('');
  const [formInsurance, setFormInsurance] = useState('');
  const [formPollution, setFormPollution] = useState('');
  const [formFitness, setFormFitness] = useState('');
  const [formLastService, setFormLastService] = useState('');
  const [formNextService, setFormNextService] = useState('');
  const [formStatus, setFormStatus] = useState<VehicleStatus>('available');

  const [dataVersion, setDataVersion] = useState(0);

  const vehicles = useMemo(() => db.getVehicles(), [dataVersion]);
  const instructors = useMemo(() => db.getInstructors(), [dataVersion]);

  const handleDeleteVehicle = (vehicleId: string, reg: string) => {
    if (
      window.confirm(
        `Are you sure you want to remove vehicle "${reg}"? This will unassign it from any instructor.`
      )
    ) {
      db.deleteVehicle(vehicleId, role);
      setDataVersion((v) => v + 1);
      if (selectedVehicleId === vehicleId) {
        setSelectedVehicleId('');
      }
    }
  };

  const selectedVehicle = useMemo(() => {
    return vehicles.find((v) => v.id === selectedVehicleId) || vehicles[0] || null;
  }, [vehicles, selectedVehicleId]);

  const vehicleExpenses = useMemo(() => {
    if (!selectedVehicle) return { expenses: [], totalCost: 0 };
    return db.getVehicleExpenses(selectedVehicle.id);
  }, [selectedVehicle]);

  const handleOpenAdd = () => {
    setFormReg('');
    setFormType('car');
    setFormModel('');
    setFormInstructor('');
    setFormInsurance('2027-06-30');
    setFormPollution('2026-12-31');
    setFormFitness('2029-01-01');
    setFormLastService(getTodayIST());
    setFormNextService('2026-12-01');
    setFormStatus('available');
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (v: Vehicle) => {
    setFormReg(v.registration_number);
    setFormType(v.type);
    setFormModel(v.model);
    setFormInstructor(v.assigned_instructor_id || '');
    setFormInsurance(v.insurance_expiry || '');
    setFormPollution(v.pollution_expiry || '');
    setFormFitness(v.fitness_expiry || '');
    setFormLastService(v.last_service_date || '');
    setFormNextService(v.next_service_date || '');
    setFormStatus(v.status);
    setIsEditModalOpen(true);
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    db.createVehicle(
      {
        registration_number: formReg.trim().toUpperCase(),
        type: formType,
        model: formModel.trim(),
        assigned_instructor_id: formInstructor || null,
        insurance_expiry: formInsurance || undefined,
        pollution_expiry: formPollution || undefined,
        fitness_expiry: formFitness || undefined,
        last_service_date: formLastService || undefined,
        next_service_date: formNextService || undefined,
        status: formStatus,
      },
      role
    );
    setIsAddModalOpen(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicle) return;
    db.updateVehicle(
      selectedVehicle.id,
      {
        registration_number: formReg.trim().toUpperCase(),
        type: formType,
        model: formModel.trim(),
        assigned_instructor_id: formInstructor || null,
        insurance_expiry: formInsurance || undefined,
        pollution_expiry: formPollution || undefined,
        fitness_expiry: formFitness || undefined,
        last_service_date: formLastService || undefined,
        next_service_date: formNextService || undefined,
        status: formStatus,
      },
      role
    );
    setIsEditModalOpen(false);
  };

  const handleQuickStatusChange = (status: VehicleStatus) => {
    if (!selectedVehicle) return;
    db.updateVehicle(selectedVehicle.id, { status }, role);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Vehicle Fleet & Maintenance
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track dual-control training vehicles, document expiries (insurance, PUC, fitness), and fuel/maintenance expenses
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-600/20 transition cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Vehicle</span>
          </button>
        )}
      </div>

      {/* Grid or Empty State */}
      {vehicles.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-12 text-center max-w-xl mx-auto shadow-xs space-y-4">
          <Car className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No Vehicles Added Yet</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Register your training cars and two-wheelers to track insurance, PUC, and fitness expiries, and assign them to driving appointments.
          </p>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add First Vehicle</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Vehicles List */}
        <div className="space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
            Academy Fleet ({vehicles.length})
          </div>

          {vehicles.map((v) => {
            const isSelected = selectedVehicle?.id === v.id;
            const inst = instructors.find((i) => i.id === v.assigned_instructor_id);
            const insIndicator = getExpiryIndicator(v.insurance_expiry);
            const pucIndicator = getExpiryIndicator(v.pollution_expiry);

            return (
              <div
                key={v.id}
                onClick={() => setSelectedVehicleId(v.id)}
                className={`p-4 rounded-2xl border transition cursor-pointer ${
                  isSelected
                    ? 'bg-teal-50/70 dark:bg-slate-800 border-teal-500 dark:border-teal-500 shadow-sm'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold font-mono text-base text-slate-900 dark:text-white">
                        {v.registration_number}
                      </span>
                      <Badge variant={getStatusBadgeVariant(v.status)} size="sm">
                        {v.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{v.model}</p>
                  </div>
                  <Badge variant={v.type === 'car' ? 'teal' : 'purple'} size="sm">
                    {v.type}
                  </Badge>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-[11px]">
                  <div className="flex justify-between text-slate-500">
                    <span>Instructor:</span>
                    <strong className="text-slate-800 dark:text-slate-200">{inst?.name || 'Unassigned'}</strong>
                  </div>

                  {/* Colored expiry badges */}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Insurance:</span>
                    <span
                      className={`font-semibold ${
                        insIndicator.color === 'green'
                          ? 'text-emerald-600'
                          : insIndicator.color === 'amber'
                          ? 'text-amber-600 font-bold'
                          : 'text-rose-600 font-bold'
                      }`}
                    >
                      {insIndicator.label}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">PUC (Pollution):</span>
                    <span
                      className={`font-semibold ${
                        pucIndicator.color === 'green'
                          ? 'text-emerald-600'
                          : pucIndicator.color === 'amber'
                          ? 'text-amber-600 font-bold'
                          : 'text-rose-600 font-bold'
                      }`}
                    >
                      {pucIndicator.label}
                    </span>
                  </div>

                  {isAdmin && (
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteVehicle(v.id, v.registration_number);
                        }}
                        title="Remove Vehicle"
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right 2 Columns: Selected Vehicle Profile & Expenses */}
        {selectedVehicle && (
          <div className="lg:col-span-2 space-y-6">
            {/* Header Vehicle Profile Card */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-700 to-teal-500 text-white flex items-center justify-center font-black text-xl shadow-md shrink-0">
                    <Car className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-2xl font-black font-mono text-slate-900 dark:text-white">
                        {selectedVehicle.registration_number}
                      </h2>
                      <Badge variant={getStatusBadgeVariant(selectedVehicle.status)}>
                        {selectedVehicle.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {selectedVehicle.model} • {selectedVehicle.type.toUpperCase()} • Driver dual-control fitted
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Quick status selector */}
                  <select
                    value={selectedVehicle.status}
                    onChange={(e) => handleQuickStatusChange(e.target.value as any)}
                    className="px-2.5 py-1.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  >
                    <option value="available">Set: Available</option>
                    <option value="service">Set: In Service (Blocks Booking)</option>
                    <option value="not_available">Set: Not Available</option>
                  </select>

                  {isAdmin && (
                    <>
                      <button
                        onClick={() => handleOpenEdit(selectedVehicle)}
                        className="px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        Edit Vehicle
                      </button>
                      <button
                        onClick={() => handleDeleteVehicle(selectedVehicle.id, selectedVehicle.registration_number)}
                        className="px-3 py-1.5 text-xs font-bold rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition cursor-pointer flex items-center gap-1"
                        title="Remove Vehicle"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* RTO Document Expiry Cards (4 pillars: Insurance, PUC, Fitness, Service) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                {/* Insurance */}
                {(() => {
                  const ind = getExpiryIndicator(selectedVehicle.insurance_expiry);
                  return (
                    <div
                      className={`p-3.5 rounded-2xl border ${
                        ind.color === 'green'
                          ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900'
                          : ind.color === 'amber'
                          ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800'
                          : 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800'
                      }`}
                    >
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Insurance
                      </span>
                      <div className="text-xs font-black mt-1 font-mono">{formatDate(selectedVehicle.insurance_expiry)}</div>
                      <span className={`text-[10px] font-bold block mt-0.5 ${
                        ind.color === 'green' ? 'text-emerald-700' : ind.color === 'amber' ? 'text-amber-700' : 'text-rose-700'
                      }`}>
                        {ind.label}
                      </span>
                    </div>
                  );
                })()}

                {/* Pollution PUC */}
                {(() => {
                  const ind = getExpiryIndicator(selectedVehicle.pollution_expiry);
                  return (
                    <div
                      className={`p-3.5 rounded-2xl border ${
                        ind.color === 'green'
                          ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900'
                          : ind.color === 'amber'
                          ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800'
                          : 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800'
                      }`}
                    >
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Pollution (PUC)
                      </span>
                      <div className="text-xs font-black mt-1 font-mono">{formatDate(selectedVehicle.pollution_expiry)}</div>
                      <span className={`text-[10px] font-bold block mt-0.5 ${
                        ind.color === 'green' ? 'text-emerald-700' : ind.color === 'amber' ? 'text-amber-700' : 'text-rose-700'
                      }`}>
                        {ind.label}
                      </span>
                    </div>
                  );
                })()}

                {/* Fitness */}
                {(() => {
                  const ind = getExpiryIndicator(selectedVehicle.fitness_expiry);
                  return (
                    <div
                      className={`p-3.5 rounded-2xl border ${
                        ind.color === 'green'
                          ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900'
                          : ind.color === 'amber'
                          ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800'
                          : 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800'
                      }`}
                    >
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Fitness Cert
                      </span>
                      <div className="text-xs font-black mt-1 font-mono">{formatDate(selectedVehicle.fitness_expiry)}</div>
                      <span className={`text-[10px] font-bold block mt-0.5 ${
                        ind.color === 'green' ? 'text-emerald-700' : ind.color === 'amber' ? 'text-amber-700' : 'text-rose-700'
                      }`}>
                        {ind.label}
                      </span>
                    </div>
                  );
                })()}

                {/* Next Service Due */}
                {(() => {
                  const ind = getExpiryIndicator(selectedVehicle.next_service_date);
                  return (
                    <div
                      className={`p-3.5 rounded-2xl border ${
                        ind.color === 'green'
                          ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900'
                          : ind.color === 'amber'
                          ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800'
                          : 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800'
                      }`}
                    >
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Service Due
                      </span>
                      <div className="text-xs font-black mt-1 font-mono">{formatDate(selectedVehicle.next_service_date)}</div>
                      <span className={`text-[10px] font-bold block mt-0.5 ${
                        ind.color === 'green' ? 'text-emerald-700' : ind.color === 'amber' ? 'text-amber-700' : 'text-rose-700'
                      }`}>
                        {ind.label}
                      </span>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Linked Expenses & Maintenance Costs (Admin only) */}
            {isAdmin && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      Vehicle Operating Expenses (Fuel & Service)
                    </h3>
                    <p className="text-xs text-slate-400">Direct costs linked to {selectedVehicle.registration_number}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400">Total Spent: </span>
                    <strong className="text-sm font-black font-mono text-rose-600">
                      {formatINR(vehicleExpenses.totalCost)}
                    </strong>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 text-slate-500 font-semibold">
                      <tr>
                        <th className="py-2.5 px-4">Date</th>
                        <th className="py-2.5 px-4">Category</th>
                        <th className="py-2.5 px-4">Amount</th>
                        <th className="py-2.5 px-4">Payment Mode</th>
                        <th className="py-2.5 px-4">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {vehicleExpenses.expenses.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center py-8 text-slate-400">
                            No direct expenses logged for this vehicle yet.
                          </td>
                        </tr>
                      ) : (
                        vehicleExpenses.expenses.map((e) => (
                          <tr key={e.id} className="hover:bg-slate-50/50">
                            <td className="py-2.5 px-4 font-mono whitespace-nowrap">
                              {formatDate(e.expense_date)}
                            </td>
                            <td className="py-2.5 px-4 uppercase font-bold text-[11px] text-teal-700 dark:text-teal-400">
                              {e.category.replace('_', ' ')}
                            </td>
                            <td className="py-2.5 px-4 font-mono font-bold text-rose-600 whitespace-nowrap">
                              {formatINR(e.amount)}
                            </td>
                            <td className="py-2.5 px-4 uppercase font-semibold text-slate-500">
                              {e.payment_mode}
                            </td>
                            <td className="py-2.5 px-4 text-slate-600 dark:text-slate-300">
                              {e.description}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            </div>
          )}
        </div>
      )}

      {/* ADD / EDIT VEHICLE MODAL */}
      <Modal
        isOpen={isAddModalOpen || isEditModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setIsEditModalOpen(false);
        }}
        title={isEditModalOpen ? 'Edit Vehicle Details' : 'Add Vehicle to Academy Fleet'}
        maxWidth="lg"
      >
        <form onSubmit={isEditModalOpen ? handleSaveEdit : handleSaveAdd} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Registration Number *
              </label>
              <input
                type="text"
                required
                value={formReg}
                onChange={(e) => setFormReg(e.target.value.toUpperCase())}
                placeholder="KA-01-AB-1234"
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Vehicle Type *
              </label>
              <select
                value={formType}
                onChange={(e) => setFormType(e.target.value as any)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              >
                <option value="car">Four-Wheeler (Car)</option>
                <option value="bike">Two-Wheeler (Bike/Scooter)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Make & Model *
            </label>
            <input
              type="text"
              required
              value={formModel}
              onChange={(e) => setFormModel(e.target.value)}
              placeholder="e.g. Maruti Suzuki Dzire VXI (Manual)"
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Assigned Primary Instructor
              </label>
              <select
                value={formInstructor}
                onChange={(e) => setFormInstructor(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              >
                <option value="">-- None --</option>
                {instructors.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Operational Status
              </label>
              <select
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value as any)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              >
                <option value="available">Available (Open for booking)</option>
                <option value="service">In Service (Blocks bookings)</option>
                <option value="not_available">Not Available (Blocks bookings)</option>
              </select>
            </div>
          </div>

          {/* RTO Document Expiries */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              RTO Document Validity Dates
            </span>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">
                  Insurance Expiry
                </label>
                <input
                  type="date"
                  value={formInsurance}
                  onChange={(e) => setFormInsurance(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-200 bg-white dark:bg-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">
                  PUC Pollution Expiry
                </label>
                <input
                  type="date"
                  value={formPollution}
                  onChange={(e) => setFormPollution(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-200 bg-white dark:bg-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">
                  Fitness Cert Expiry
                </label>
                <input
                  type="date"
                  value={formFitness}
                  onChange={(e) => setFormFitness(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-200 bg-white dark:bg-slate-900 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">
                  Last Service Date
                </label>
                <input
                  type="date"
                  value={formLastService}
                  onChange={(e) => setFormLastService(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-200 bg-white dark:bg-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">
                  Next Service Due Date
                </label>
                <input
                  type="date"
                  value={formNextService}
                  onChange={(e) => setFormNextService(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-200 bg-white dark:bg-slate-900 font-mono"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                setIsAddModalOpen(false);
                setIsEditModalOpen(false);
              }}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold rounded-xl bg-teal-600 hover:bg-teal-700 text-white shadow-xs"
            >
              {isEditModalOpen ? 'Save Changes' : 'Add Vehicle'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
