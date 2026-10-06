import React, { useState, useMemo } from 'react';
import {
  GraduationCap,
  Plus,
  Calendar,
  Phone,
  Car,
  Clock,
  CheckCircle2,
  AlertCircle,
  Users,
  Search,
  Edit2,
  CalendarDays,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { db } from '../../lib/storage';
import type { Instructor, InstructorLeave } from '../../types';
import {
  formatDate,
  formatTime12,
  formatPhone,
  getTelUrl,
  getTodayIST,
} from '../../lib/formatters';
import { Badge, getStatusBadgeVariant } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { useAuth } from '../../context/AuthContext';

export const InstructorsPage: React.FC = () => {
  const { role, isAdmin } = useAuth();
  const [selectedInstructorId, setSelectedInstructorId] = useState<string>('');
  const [monthFilter, setMonthFilter] = useState<string>(() => getTodayIST().substring(0, 7)); // "2026-10"

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);

  // Form states
  const [formName, setFormName] = useState('');
  const [formMobile, setFormMobile] = useState('');
  const [formLicence, setFormLicence] = useState('');
  const [formLicenceExpiry, setFormLicenceExpiry] = useState('');
  const [formStartTime, setFormStartTime] = useState('06:00');
  const [formEndTime, setFormEndTime] = useState('20:00');
  const [formAssignedVehicle, setFormAssignedVehicle] = useState('');
  const [formStatus, setFormStatus] = useState<'active' | 'on_leave' | 'inactive'>('active');

  // Leave Form
  const [leaveFrom, setLeaveFrom] = useState(getTodayIST());
  const [leaveTo, setLeaveTo] = useState(getTodayIST());
  const [leaveReason, setLeaveReason] = useState('');

  const instructors = db.getInstructors();
  const vehicles = db.getVehicles();

  const selectedInstructor = useMemo(() => {
    return (
      instructors.find((i) => i.id === selectedInstructorId) ||
      instructors[0] ||
      null
    );
  }, [instructors, selectedInstructorId]);

  const instructorStats = useMemo(() => {
    if (!selectedInstructor) return null;
    return db.getInstructorStats(selectedInstructor.id, monthFilter);
  }, [selectedInstructor, monthFilter]);

  const instructorLeaves = useMemo(() => {
    if (!selectedInstructor) return [];
    return db.getInstructorLeaves(selectedInstructor.id);
  }, [selectedInstructor]);

  const handleOpenAddModal = () => {
    setFormName('');
    setFormMobile('');
    setFormLicence('');
    setFormLicenceExpiry('2030-12-31');
    setFormStartTime('06:00');
    setFormEndTime('20:00');
    setFormAssignedVehicle(vehicles[0]?.id || '');
    setFormStatus('active');
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (inst: Instructor) => {
    setFormName(inst.name);
    setFormMobile(inst.mobile);
    setFormLicence(inst.licence_number);
    setFormLicenceExpiry(inst.licence_expiry || '');
    setFormStartTime(inst.working_start_time);
    setFormEndTime(inst.working_end_time);
    setFormAssignedVehicle(inst.assigned_vehicle_id || '');
    setFormStatus(inst.status);
    setIsEditModalOpen(true);
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    db.createInstructor(
      {
        name: formName.trim(),
        mobile: formMobile.trim(),
        licence_number: formLicence.trim(),
        licence_expiry: formLicenceExpiry || undefined,
        working_start_time: formStartTime,
        working_end_time: formEndTime,
        assigned_vehicle_id: formAssignedVehicle || null,
        status: formStatus,
        joining_date: getTodayIST(),
      },
      role
    );
    setIsAddModalOpen(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInstructor) return;
    db.updateInstructor(
      selectedInstructor.id,
      {
        name: formName.trim(),
        mobile: formMobile.trim(),
        licence_number: formLicence.trim(),
        licence_expiry: formLicenceExpiry || undefined,
        working_start_time: formStartTime,
        working_end_time: formEndTime,
        assigned_vehicle_id: formAssignedVehicle || null,
        status: formStatus,
      },
      role
    );
    setIsEditModalOpen(false);
  };

  const handleSaveLeave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInstructor) return;
    db.addInstructorLeave(
      {
        instructor_id: selectedInstructor.id,
        from_date: leaveFrom,
        to_date: leaveTo,
        reason: leaveReason.trim() || 'Personal leave',
      },
      role
    );
    // Auto set status to on_leave if current date falls in range
    const today = getTodayIST();
    if (today >= leaveFrom && today <= leaveTo) {
      db.updateInstructor(selectedInstructor.id, { status: 'on_leave' }, role);
    }
    setIsLeaveModalOpen(false);
    setLeaveReason('');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Driving Instructors
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Instructor schedules, assigned vehicles, leave blocking, and training metrics
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-600/20 transition cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Instructor</span>
          </button>
        )}
      </div>

      {/* Main Grid: Left List (1 col) + Right Detail (2 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Instructors List */}
        <div className="space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
            Faculty Directory ({instructors.length})
          </div>

          {instructors.map((inst) => {
            const isSelected = selectedInstructor?.id === inst.id;
            const veh = vehicles.find((v) => v.id === inst.assigned_vehicle_id);

            return (
              <div
                key={inst.id}
                onClick={() => setSelectedInstructorId(inst.id)}
                className={`p-4 rounded-2xl border transition cursor-pointer ${
                  isSelected
                    ? 'bg-teal-50/70 dark:bg-slate-800 border-teal-500 dark:border-teal-500 shadow-sm'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                      {inst.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                        {inst.name}
                      </h3>
                      <div className="text-xs font-mono text-slate-500">
                        📞 {formatPhone(inst.mobile)}
                      </div>
                    </div>
                  </div>
                  <Badge variant={getStatusBadgeVariant(inst.status)} size="sm">
                    {inst.status}
                  </Badge>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                  <span>🚗 {veh?.registration_number || 'No Vehicle'}</span>
                  <span>{formatTime12(inst.working_start_time)} - {formatTime12(inst.working_end_time)}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right 2 Columns: Selected Instructor Details & Schedule */}
        {selectedInstructor && instructorStats && (
          <div className="lg:col-span-2 space-y-6">
            {/* Header Profile Card */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-700 to-teal-500 text-white flex items-center justify-center font-black text-xl shadow-md shrink-0">
                    {selectedInstructor.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-black text-slate-900 dark:text-white">
                        {selectedInstructor.name}
                      </h2>
                      <Badge variant={getStatusBadgeVariant(selectedInstructor.status)}>
                        {selectedInstructor.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-slate-500 mt-1 flex items-center gap-3 flex-wrap">
                      <a href={getTelUrl(selectedInstructor.mobile)} className="font-mono hover:text-teal-600">
                        📞 {formatPhone(selectedInstructor.mobile)}
                      </a>
                      <span>• Licence: <strong className="font-mono">{selectedInstructor.licence_number}</strong></span>
                      {selectedInstructor.licence_expiry && (
                        <span>• Valid till {formatDate(selectedInstructor.licence_expiry)}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsLeaveModalOpen(true)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 hover:bg-amber-100"
                  >
                    + Record Leave
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => handleOpenEditModal(selectedInstructor)}
                      className="px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50"
                    >
                      Edit Profile
                    </button>
                  )}
                </div>
              </div>

              {/* Performance Metrics Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Today's Classes
                  </span>
                  <div className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
                    {instructorStats.todayClassesCount}
                  </div>
                  <span className="text-[10px] text-slate-400">Scheduled today</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Active Candidates
                  </span>
                  <div className="text-xl font-black text-teal-600 mt-0.5">
                    {instructorStats.activeCandidatesCount}
                  </div>
                  <span className="text-[10px] text-slate-400">Students trained</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Completed Lessons
                  </span>
                  <div className="text-xl font-black text-emerald-600 mt-0.5">
                    {instructorStats.completedClassesCount}
                  </div>
                  <span className="text-[10px] text-slate-400">{monthFilter} monthly</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Assigned Vehicle
                  </span>
                  <div className="text-sm font-bold font-mono text-slate-900 dark:text-white mt-1 truncate">
                    {vehicles.find((v) => v.id === selectedInstructor.assigned_vehicle_id)?.registration_number || 'None'}
                  </div>
                  <span className="text-[10px] text-slate-400">Primary car</span>
                </div>
              </div>
            </div>

            {/* Leave History / Upcoming Leaves */}
            {instructorLeaves.length > 0 && (
              <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wider">
                  <CalendarDays className="w-4 h-4 text-amber-600" />
                  <span>Recorded Leave Periods ({instructorLeaves.length})</span>
                </div>
                <div className="space-y-1.5">
                  {instructorLeaves.map((l) => (
                    <div key={l.id} className="text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between">
                      <span className="font-mono font-semibold">
                        {formatDate(l.from_date)} to {formatDate(l.to_date)}
                      </span>
                      <span>{l.reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent / Upcoming Appointments List for Instructor */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Instructor Appointments History
                  </h3>
                  <p className="text-xs text-slate-400">Classes assigned to {selectedInstructor.name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Month:</span>
                  <input
                    type="month"
                    value={monthFilter}
                    onChange={(e) => setMonthFilter(e.target.value)}
                    className="px-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 text-slate-500 font-semibold">
                    <tr>
                      <th className="py-2.5 px-4">Date</th>
                      <th className="py-2.5 px-4">Slot</th>
                      <th className="py-2.5 px-4">Candidate</th>
                      <th className="py-2.5 px-4">Vehicle</th>
                      <th className="py-2.5 px-4">Status</th>
                      <th className="py-2.5 px-4">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {instructorStats.appointments.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-slate-400">
                          No appointments found for this instructor in {monthFilter}.
                        </td>
                      </tr>
                    ) : (
                      instructorStats.appointments.slice(0, 10).map((a) => {
                        const cand = db.getCandidateById(a.candidate_id);
                        const veh = vehicles.find((v) => v.id === a.vehicle_id);
                        return (
                          <tr key={a.id} className="hover:bg-slate-50/50">
                            <td className="py-2.5 px-4 font-mono font-bold whitespace-nowrap">
                              {formatDate(a.appointment_date)}
                            </td>
                            <td className="py-2.5 px-4 font-mono whitespace-nowrap">
                              {formatTime12(a.start_time)}
                            </td>
                            <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-white">
                              {cand?.full_name || 'Candidate'}
                            </td>
                            <td className="py-2.5 px-4 font-mono text-[11px] text-slate-500">
                              {veh?.registration_number}
                            </td>
                            <td className="py-2.5 px-4">
                              <Badge variant={getStatusBadgeVariant(a.status)} size="sm">
                                {a.status}
                              </Badge>
                            </td>
                            <td className="py-2.5 px-4 text-slate-500">
                              {a.remarks || '-'}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ADD / EDIT INSTRUCTOR MODAL */}
      <Modal
        isOpen={isAddModalOpen || isEditModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setIsEditModalOpen(false);
        }}
        title={isEditModalOpen ? 'Edit Instructor Profile' : 'Add New Driving Instructor'}
        maxWidth="lg"
      >
        <form onSubmit={isEditModalOpen ? handleSaveEdit : handleSaveAdd} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Instructor Full Name *
            </label>
            <input
              type="text"
              required
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="e.g. Ramesh Kumar"
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Mobile Number *
              </label>
              <input
                type="tel"
                required
                maxLength={10}
                value={formMobile}
                onChange={(e) => setFormMobile(e.target.value.replace(/\D/g, ''))}
                placeholder="9845012345"
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Commercial DL Number *
              </label>
              <input
                type="text"
                required
                value={formLicence}
                onChange={(e) => setFormLicence(e.target.value.toUpperCase())}
                placeholder="KA0120100014289"
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Working Shift Start
              </label>
              <input
                type="time"
                value={formStartTime}
                onChange={(e) => setFormStartTime(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Working Shift End
              </label>
              <input
                type="time"
                value={formEndTime}
                onChange={(e) => setFormEndTime(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Assigned Vehicle
              </label>
              <select
                value={formAssignedVehicle}
                onChange={(e) => setFormAssignedVehicle(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
              >
                <option value="">-- None --</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.registration_number} ({v.model})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Status
              </label>
              <select
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value as any)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              >
                <option value="active">Active</option>
                <option value="on_leave">On Leave</option>
                <option value="inactive">Inactive</option>
              </select>
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
              {isEditModalOpen ? 'Save Changes' : 'Create Instructor'}
            </button>
          </div>
        </form>
      </Modal>

      {/* RECORD LEAVE MODAL */}
      <Modal
        isOpen={isLeaveModalOpen}
        onClose={() => setIsLeaveModalOpen(false)}
        title={`Record Leave: ${selectedInstructor?.name}`}
        description="Booking will be blocked for this instructor during these dates"
        maxWidth="md"
      >
        <form onSubmit={handleSaveLeave} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                From Date *
              </label>
              <input
                type="date"
                required
                value={leaveFrom}
                onChange={(e) => setLeaveFrom(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                To Date *
              </label>
              <input
                type="date"
                required
                value={leaveTo}
                onChange={(e) => setLeaveTo(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Reason for Leave *
            </label>
            <input
              type="text"
              required
              value={leaveReason}
              onChange={(e) => setLeaveReason(e.target.value)}
              placeholder="e.g. Family function / Medical leave"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsLeaveModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-xs"
            >
              Confirm Leave
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
