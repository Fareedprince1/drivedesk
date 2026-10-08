import React, { useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Calendar as CalendarIcon,
  Plus,
  Clock,
  Car,
  User,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  Filter,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Users,
  Printer,
  AlertTriangle,
  AlertCircle,
  Repeat,
  ArrowRight,
  Trash2,
} from 'lucide-react';
import { db } from '../../lib/storage';
import type { Appointment, Candidate, Instructor, Vehicle } from '../../types';
import {
  formatDate,
  formatTime12,
  getTodayIST,
  getWhatsAppUrl,
  getTelUrl,
} from '../../lib/formatters';
import { Badge, getStatusBadgeVariant } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { useAuth } from '../../context/AuthContext';

// Half-hour slots from 06:00 to 20:00
const TIME_SLOTS: string[] = [];
for (let h = 6; h <= 19; h++) {
  const hourStr = String(h).padStart(2, '0');
  TIME_SLOTS.push(`${hourStr}:00`);
  TIME_SLOTS.push(`${hourStr}:30`);
}

function getNextSlot(time: string): string {
  const [h, m] = time.split(':').map(Number);
  if (m === 0) return `${String(h).padStart(2, '0')}:30`;
  return `${String(h + 1).padStart(2, '0')}:00`;
}

export const AppointmentsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { role, isAdmin } = useAuth();

  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('day');
  const [selectedDate, setSelectedDate] = useState<string>(() => searchParams.get('date') || getTodayIST());

  // Filters
  const [filterInstructor, setFilterInstructor] = useState<string>('all');
  const [filterVehicle, setFilterVehicle] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Booking Modal
  const [isBookModalOpen, setIsBookModalOpen] = useState(() => searchParams.get('action') === 'book');
  const [bookingMode, setBookingMode] = useState<'single' | 'multiple'>('single');
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>(() => searchParams.get('candidateId') || '');
  const [bookingInstructorId, setBookingInstructorId] = useState<string>('');
  const [bookingVehicleId, setBookingVehicleId] = useState<string>('');
  const [bookingStartTime, setBookingStartTime] = useState<string>('08:00');
  const [bookingRemarks, setBookingRemarks] = useState('');
  const [numClassesToBook, setNumClassesToBook] = useState(5);
  const [adminOverrideRemaining, setAdminOverrideRemaining] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccessMsg, setBookingSuccessMsg] = useState('');

  // Manage Appointment Modal
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [reassignInstId, setReassignInstId] = useState('');
  const [reassignVehId, setReassignVehId] = useState('');
  const [modalTab, setModalTab] = useState<'status' | 'reschedule' | 'reassign' | 'cancel'>('status');

  // Bulk Reassign Modal
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkAffectedInstId, setBulkAffectedInstId] = useState('');
  const [bulkAffectedVehId, setBulkAffectedVehId] = useState('');
  const [bulkTargetInstId, setBulkTargetInstId] = useState('');
  const [bulkTargetVehId, setBulkTargetVehId] = useState('');
  const [bulkResult, setBulkResult] = useState<{ reassignedCount: number; conflicts: string[] } | null>(null);

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

  const instructors = useMemo(() => db.getInstructors(), [refreshKey]);
  const vehicles = useMemo(() => db.getVehicles(), [refreshKey]);
  const candidates = useMemo(() => db.getCandidatesWithStats(), [refreshKey]);
  const allAppointments = useMemo(() => db.getAppointments(), [refreshKey]);

  // Date Navigation
  const handleDateShift = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  // Auto-suggest instructor vehicle when instructor selected
  const handleInstructorSelect = (instId: string) => {
    setBookingInstructorId(instId);
    const inst = instructors.find((i) => i.id === instId);
    if (inst && inst.assigned_vehicle_id) {
      setBookingVehicleId(inst.assigned_vehicle_id);
    }
  };

  // Open booking modal for a specific slot and instructor
  const handleSlotClick = (time: string, instId: string) => {
    setBookingStartTime(time);
    handleInstructorSelect(instId);
    setIsBookModalOpen(true);
  };

  // Filtered Appointments
  const dateAppointments = useMemo(() => {
    return allAppointments.filter((a) => {
      if (a.deleted_at) return false;
      if (a.appointment_date !== selectedDate) return false;
      if (filterInstructor !== 'all' && a.instructor_id !== filterInstructor) return false;
      if (filterVehicle !== 'all' && a.vehicle_id !== filterVehicle) return false;
      if (filterStatus !== 'all' && a.status !== filterStatus) return false;
      return true;
    });
  }, [allAppointments, selectedDate, filterInstructor, filterVehicle, filterStatus]);

  // Submit Booking
  const handleCreateBooking = (e: React.FormEvent) => {
    e.preventDefault();
    setBookingError('');
    setBookingSuccessMsg('');

    if (!selectedCandidateId) {
      setBookingError('Please choose a candidate');
      return;
    }

    const cand = candidates.find((c) => c.id === selectedCandidateId);
    if (!cand || !cand.active_enrollment) {
      setBookingError('Selected candidate has no active enrollment');
      return;
    }

    // Check remaining classes rule
    const stats = cand.stats;
    if (stats && stats.classes_remaining <= 0 && !adminOverrideRemaining) {
      setBookingError(
        `Candidate has 0 remaining classes in this package. Admin override required to proceed.`
      );
      return;
    }

    const endTime = getNextSlot(bookingStartTime);

    if (bookingMode === 'single') {
      try {
        db.createAppointment(
          {
            candidate_id: selectedCandidateId,
            enrollment_id: cand.active_enrollment.id,
            instructor_id: bookingInstructorId,
            vehicle_id: bookingVehicleId,
            appointment_date: selectedDate,
            start_time: bookingStartTime,
            end_time: endTime,
            status: 'booked',
            remarks: bookingRemarks.trim() || undefined,
            rescheduled_from_id: null,
            created_by: role === 'admin' ? 'Admin' : 'Staff',
          },
          role
        );
        setIsBookModalOpen(false);
        setBookingRemarks('');
        setSearchParams({});
        setRefreshKey((k) => k + 1);
      } catch (err: any) {
        setBookingError(err?.message || 'Double-booking error');
      }
    } else {
      // Multiple booking
      try {
        const res = db.bookMultipleClasses(
          {
            candidate_id: selectedCandidateId,
            enrollment_id: cand.active_enrollment.id,
            instructor_id: bookingInstructorId,
            vehicle_id: bookingVehicleId,
            start_date: selectedDate,
            num_classes: Number(numClassesToBook),
            start_time: bookingStartTime,
            end_time: endTime,
            admin_override: adminOverrideRemaining,
          },
          role
        );

        setRefreshKey((k) => k + 1);
        if (res.skipped.length > 0) {
          setBookingSuccessMsg(
            `Booked ${res.booked.length} classes! Skipped ${res.skipped.length} conflicting/holiday slots.`
          );
          setTimeout(() => {
            setIsBookModalOpen(false);
            setSearchParams({});
          }, 2000);
        } else {
          setIsBookModalOpen(false);
          setSearchParams({});
        }
      } catch (err: any) {
        setBookingError(err?.message || 'Error booking multiple classes');
      }
    }
  };

  // Quick Action
  const handleQuickStatus = (appId: string, status: 'completed' | 'absent') => {
    db.updateAppointmentStatus(appId, status, undefined, role);
    setRefreshKey((k) => k + 1);
    setIsManageModalOpen(false);
  };

  // Submit Reschedule
  const handleRescheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppointment) return;
    try {
      db.rescheduleAppointment(
        selectedAppointment.id,
        rescheduleDate,
        rescheduleTime,
        getNextSlot(rescheduleTime),
        rescheduleReason,
        role
      );
      setRefreshKey((k) => k + 1);
      setIsManageModalOpen(false);
    } catch (err: any) {
      alert(err?.message || 'Reschedule conflict');
    }
  };

  // Submit Reassign
  const handleReassignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppointment) return;
    try {
      db.reassignAppointment(selectedAppointment.id, reassignInstId, reassignVehId, role);
      setRefreshKey((k) => k + 1);
      setIsManageModalOpen(false);
    } catch (err: any) {
      alert(err?.message || 'Reassignment conflict');
    }
  };

  // Submit Cancel
  const handleCancelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppointment) return;
    db.cancelAppointment(selectedAppointment.id, cancelReason, role);
    setRefreshKey((k) => k + 1);
    setIsManageModalOpen(false);
  };

  const handleDeleteAppointment = (appointmentId: string) => {
    if (window.confirm('Are you sure you want to permanently remove this appointment booking?')) {
      db.deleteAppointment(appointmentId, role);
      setRefreshKey((k) => k + 1);
      setIsManageModalOpen(false);
    }
  };

  // Run Bulk Reassign
  const handleRunBulkReassign = (e: React.FormEvent) => {
    e.preventDefault();
    const res = db.bulkReassign(
      {
        affectedInstructorId: bulkAffectedInstId || undefined,
        affectedVehicleId: bulkAffectedVehId || undefined,
        fromDate: selectedDate,
        newInstructorId: bulkTargetInstId || undefined,
        newVehicleId: bulkTargetVehId || undefined,
      },
      role
    );
    setRefreshKey((k) => k + 1);
    setBulkResult(res);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Driving Appointments Calendar
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            30-minute practical lessons schedule with database-enforced double-booking prevention
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {isAdmin && (
            <button
              onClick={() => {
                setBulkResult(null);
                setIsBulkModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition"
            >
              <RotateCcw className="w-3.5 h-3.5 text-teal-600" />
              <span>Bulk Reassign</span>
            </button>
          )}

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition no-print"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Day Schedule</span>
          </button>

          <button
            onClick={() => {
              setBookingInstructorId(instructors[0]?.id || '');
              setBookingVehicleId(instructors[0]?.assigned_vehicle_id || vehicles[0]?.id || '');
              setIsBookModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-600/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Book Appointment</span>
          </button>
        </div>
      </div>

      {/* Date Navigation & View Toggles Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Date Selector */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleDateShift(-1)}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-slate-600 dark:text-slate-300"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3.5 py-1.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
          />
          <button
            onClick={() => handleDateShift(1)}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-slate-600 dark:text-slate-300"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => setSelectedDate(getTodayIST())}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300"
          >
            Today
          </button>
          <span className="text-xs font-bold text-teal-700 dark:text-teal-400 ml-2 font-mono">
            {formatDate(selectedDate)}
          </span>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <select
            value={filterInstructor}
            onChange={(e) => setFilterInstructor(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium"
          >
            <option value="all">All Instructors</option>
            {instructors.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </select>

          <select
            value={filterVehicle}
            onChange={(e) => setFilterVehicle(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium"
          >
            <option value="all">All Vehicles</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.registration_number}
              </option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium"
          >
            <option value="all">All Statuses</option>
            <option value="booked">Booked</option>
            <option value="completed">Completed</option>
            <option value="absent">Absent</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* DAY VIEW GRID (Default & Most Used) */}
      {instructors.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center shadow-xs">
          <div className="max-w-md mx-auto space-y-3">
            <GraduationCap className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">No Instructors Added Yet</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              The calendar grid schedules 30-minute lessons under active instructors. Add your driving school's instructors to begin booking classes.
            </p>
            <button
              onClick={() => navigate('/instructors')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Your First Instructor</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Mobile Agenda List View */}
          <div className="block md:hidden space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Scheduled Classes ({dateAppointments.length})
              </span>
              <button
                onClick={() => setIsBookModalOpen(true)}
                className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Book Class</span>
              </button>
            </div>

            {dateAppointments.length === 0 ? (
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-2">
                <CalendarIcon className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  No classes scheduled for {formatDate(selectedDate)}
                </p>
                <button
                  onClick={() => setIsBookModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-600 text-white font-bold text-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Book Appointment</span>
                </button>
              </div>
            ) : (
              dateAppointments.map((app) => {
                const cand = candidates.find((c) => c.id === app.candidate_id);
                const inst = instructors.find((i) => i.id === app.instructor_id);
                const veh = vehicles.find((v) => v.id === app.vehicle_id);

                return (
                  <div
                    key={app.id}
                    onClick={() => {
                      setSelectedAppointment(app);
                      setRescheduleDate(app.appointment_date);
                      setRescheduleTime(app.start_time);
                      setReassignInstId(app.instructor_id);
                      setReassignVehId(app.vehicle_id);
                      setIsManageModalOpen(true);
                    }}
                    className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2.5 active:bg-slate-50 dark:active:bg-slate-800/60 transition cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-teal-700 dark:text-teal-400">
                            {formatTime12(app.start_time)} - {formatTime12(app.end_time)}
                          </span>
                          <Badge variant={getStatusBadgeVariant(app.status)} size="sm">
                            {app.status}
                          </Badge>
                        </div>
                        <div className="font-bold text-sm text-slate-900 dark:text-white mt-1">
                          {cand?.full_name || 'Candidate'}
                        </div>
                        <div className="text-[11px] font-mono text-slate-400">
                          {cand?.candidate_code} • {cand?.mobile}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Instructor</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{inst?.name || 'Unassigned'}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block">Vehicle</span>
                        <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">{veh?.registration_number || 'None'}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider pt-2">
              All Time Slots (Tap slot to book)
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto max-h-[70vh]">
            <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold sticky top-0 z-10">
              <tr>
                <th className="py-3 px-4 w-28 border-r border-slate-200 dark:border-slate-800">
                  Time Slot
                </th>
                {instructors.map((inst) => (
                  <th
                    key={inst.id}
                    className="py-3 px-4 min-w-[220px] border-r border-slate-200 dark:border-slate-800"
                  >
                    <div className="font-bold text-slate-900 dark:text-white">{inst.name}</div>
                    <div className="text-[11px] text-slate-400 font-normal">
                      Vehicle: {vehicles.find((v) => v.id === inst.assigned_vehicle_id)?.registration_number || 'None'}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
              {TIME_SLOTS.map((slot) => {
                const endSlot = getNextSlot(slot);

                return (
                  <tr key={slot} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20">
                    {/* Time Column */}
                    <td className="py-2.5 px-4 font-bold text-slate-500 whitespace-nowrap border-r border-slate-100 dark:border-slate-800">
                      {formatTime12(slot)}
                    </td>

                    {/* Columns for each instructor */}
                    {instructors.map((inst) => {
                      const app = dateAppointments.find(
                        (a) => a.instructor_id === inst.id && a.start_time === slot
                      );

                      if (app) {
                        const cand = candidates.find((c) => c.id === app.candidate_id);
                        const veh = vehicles.find((v) => v.id === app.vehicle_id);

                        return (
                          <td
                            key={inst.id}
                            className="p-1.5 border-r border-slate-100 dark:border-slate-800"
                          >
                            <div
                              onClick={() => {
                                setSelectedAppointment(app);
                                setRescheduleDate(app.appointment_date);
                                setRescheduleTime(app.start_time);
                                setReassignInstId(app.instructor_id);
                                setReassignVehId(app.vehicle_id);
                                setIsManageModalOpen(true);
                              }}
                              className={`p-2.5 rounded-xl border text-left cursor-pointer transition transform hover:-translate-y-0.5 shadow-2xs ${
                                app.status === 'completed'
                                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 text-emerald-900 dark:text-emerald-200'
                                  : app.status === 'absent'
                                  ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 text-rose-900 dark:text-rose-200'
                                  : app.status === 'cancelled'
                                  ? 'bg-slate-100 dark:bg-slate-800 border-slate-200 text-slate-500 line-through'
                                  : 'bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800 text-teal-950 dark:text-teal-200'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-bold text-xs truncate">
                                  {cand?.full_name || 'Candidate'}
                                </span>
                                <Badge variant={getStatusBadgeVariant(app.status)} size="sm">
                                  {app.status}
                                </Badge>
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-between">
                                <span>{veh?.registration_number || 'Car'}</span>
                                <span className="font-mono text-[10px]">{cand?.candidate_code}</span>
                              </div>
                            </div>
                          </td>
                        );
                      }

                      // Empty Slot - Clickable to create booking
                      return (
                        <td
                          key={inst.id}
                          onClick={() => handleSlotClick(slot, inst.id)}
                          className="p-1 border-r border-slate-100 dark:border-slate-800 text-center text-[11px] text-slate-300 dark:text-slate-700 hover:bg-teal-50/50 dark:hover:bg-slate-800/40 cursor-pointer transition select-none group"
                        >
                          <span className="opacity-0 group-hover:opacity-100 font-bold text-teal-600 transition">
                            + Book {formatTime12(slot)}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
    )}

      {/* CREATE APPOINTMENT MODAL */}
      <Modal
        isOpen={isBookModalOpen}
        onClose={() => {
          setIsBookModalOpen(false);
          setSearchParams({});
        }}
        title="Schedule Driving Appointment"
        description="Book a 30-min slot. Only available, non-overlapping slots will be accepted."
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateBooking} className="space-y-4">
          {bookingError && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-400 text-xs font-semibold rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>{bookingError}</div>
            </div>
          )}

          {bookingSuccessMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{bookingSuccessMsg}</span>
            </div>
          )}

          {/* Mode Switch: Single Class vs Recurring Multiple Classes */}
          <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setBookingMode('single')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                bookingMode === 'single'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Single Class
            </button>
            <button
              type="button"
              onClick={() => setBookingMode('multiple')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
                bookingMode === 'multiple'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Repeat className="w-3.5 h-3.5" />
              <span>Book Multiple Classes (Daily Recurring)</span>
            </button>
          </div>

          {/* Pick Candidate */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Select Candidate *
            </label>
            <select
              required
              value={selectedCandidateId}
              onChange={(e) => setSelectedCandidateId(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
            >
              <option value="">-- Choose Candidate --</option>
              {candidates.map((c) => {
                const left = c.stats?.classes_remaining ?? 0;
                return (
                  <option key={c.id} value={c.id}>
                    {c.candidate_code} — {c.full_name} ({left} classes remaining)
                  </option>
                );
              })}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Instructor */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Instructor *
              </label>
              <select
                required
                value={bookingInstructorId}
                onChange={(e) => handleInstructorSelect(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                {instructors.map((inst) => (
                  <option key={inst.id} value={inst.id}>
                    {inst.name} ({inst.status})
                  </option>
                ))}
              </select>
            </div>

            {/* Vehicle */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Vehicle (Auto-suggested) *
              </label>
              <select
                required
                value={bookingVehicleId}
                onChange={(e) => setBookingVehicleId(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
              >
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.registration_number} — {v.model} ({v.status})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Date */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {bookingMode === 'single' ? 'Appointment Date *' : 'Starting From Date *'}
              </label>
              <input
                type="date"
                required
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
              />
            </div>

            {/* Time Slot */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Time Slot (30 Mins) *
              </label>
              <select
                value={bookingStartTime}
                onChange={(e) => setBookingStartTime(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold"
              >
                {TIME_SLOTS.map((t) => (
                  <option key={t} value={t}>
                    {formatTime12(t)} to {formatTime12(getNextSlot(t))}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {bookingMode === 'multiple' && (
            <div className="p-3.5 rounded-xl bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 space-y-2">
              <label className="block text-xs font-bold text-teal-900 dark:text-teal-200">
                Number of Consecutive Classes to Book
              </label>
              <input
                type="number"
                min={2}
                max={20}
                value={numClassesToBook}
                onChange={(e) => setNumClassesToBook(Number(e.target.value))}
                className="w-32 px-3 py-2 text-sm rounded-xl border border-teal-300 bg-white dark:bg-slate-800 font-mono font-bold"
              />
              <p className="text-[11px] text-teal-700 dark:text-teal-400">
                Will schedule the same slot for the next {numClassesToBook} working days, automatically skipping holidays, instructor leaves, and reporting any conflicting days.
              </p>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Lesson Goal / Remarks
            </label>
            <input
              type="text"
              value={bookingRemarks}
              onChange={(e) => setBookingRemarks(e.target.value)}
              placeholder="e.g. Reverse parking practice, traffic signals, hill start"
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          {isAdmin && (
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-500 pt-1">
              <input
                type="checkbox"
                checked={adminOverrideRemaining}
                onChange={(e) => setAdminOverrideRemaining(e.target.checked)}
                className="rounded text-teal-600"
              />
              <span>Admin Override: Allow booking even if 0 classes remaining in package</span>
            </label>
          )}

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsBookModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 text-xs font-bold rounded-xl bg-teal-600 hover:bg-teal-700 text-white shadow-xs cursor-pointer"
            >
              Confirm Booking
            </button>
          </div>
        </form>
      </Modal>

      {/* MANAGE APPOINTMENT MODAL (Edit / Reschedule / Cancel / Reassign) */}
      <Modal
        isOpen={isManageModalOpen}
        onClose={() => setIsManageModalOpen(false)}
        title="Manage Appointment"
        maxWidth="lg"
      >
        {selectedAppointment && (
          <div className="space-y-4">
            {/* Candidate & Appointment Details */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Candidate:</span>
                <strong className="text-slate-900 dark:text-white">
                  {candidates.find((c) => c.id === selectedAppointment.candidate_id)?.full_name}
                </strong>
              </div>
              <div className="flex justify-between font-mono">
                <span className="text-slate-400">Scheduled:</span>
                <span>
                  {formatDate(selectedAppointment.appointment_date)} at {formatTime12(selectedAppointment.start_time)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Current Status:</span>
                <Badge variant={getStatusBadgeVariant(selectedAppointment.status)} size="sm">
                  {selectedAppointment.status}
                </Badge>
              </div>
            </div>

            {/* Quick Status Buttons */}
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => handleQuickStatus(selectedAppointment.id, 'completed')}
                className="flex-1 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
              >
                Mark Completed
              </button>
              <button
                onClick={() => handleQuickStatus(selectedAppointment.id, 'absent')}
                className="flex-1 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
              >
                Mark Absent
              </button>
            </div>

            {/* Action Tabs: Reschedule, Reassign, Cancel */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 pt-2">
              <button
                onClick={() => setModalTab('reschedule')}
                className={`py-2 px-3 text-xs font-bold border-b-2 transition ${
                  modalTab === 'reschedule'
                    ? 'border-teal-600 text-teal-600'
                    : 'border-transparent text-slate-400'
                }`}
              >
                Reschedule
              </button>
              <button
                onClick={() => setModalTab('reassign')}
                className={`py-2 px-3 text-xs font-bold border-b-2 transition ${
                  modalTab === 'reassign'
                    ? 'border-teal-600 text-teal-600'
                    : 'border-transparent text-slate-400'
                }`}
              >
                Change Instructor / Car
              </button>
              <button
                onClick={() => setModalTab('cancel')}
                className={`py-2 px-3 text-xs font-bold border-b-2 transition ${
                  modalTab === 'cancel'
                    ? 'border-rose-600 text-rose-600'
                    : 'border-transparent text-slate-400'
                }`}
              >
                Cancel Class
              </button>
            </div>

            {/* Reschedule Tab */}
            {modalTab === 'reschedule' && (
              <form onSubmit={handleRescheduleSubmit} className="space-y-3 pt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      New Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={rescheduleDate}
                      onChange={(e) => setRescheduleDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      New Time Slot *
                    </label>
                    <select
                      value={rescheduleTime}
                      onChange={(e) => setRescheduleTime(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono font-bold"
                    >
                      {TIME_SLOTS.map((t) => (
                        <option key={t} value={t}>
                          {formatTime12(t)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Reason for Rescheduling
                  </label>
                  <input
                    type="text"
                    value={rescheduleReason}
                    onChange={(e) => setRescheduleReason(e.target.value)}
                    placeholder="e.g. Student requested evening slot"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 text-xs font-bold rounded-xl bg-teal-600 hover:bg-teal-700 text-white"
                >
                  Save Rescheduled Booking
                </button>
              </form>
            )}

            {/* Reassign Tab */}
            {modalTab === 'reassign' && (
              <form onSubmit={handleReassignSubmit} className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Assign Instructor *
                  </label>
                  <select
                    value={reassignInstId}
                    onChange={(e) => setReassignInstId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  >
                    {instructors.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Assign Vehicle *
                  </label>
                  <select
                    value={reassignVehId}
                    onChange={(e) => setReassignVehId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                  >
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.registration_number} ({v.model})
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 text-xs font-bold rounded-xl bg-teal-600 hover:bg-teal-700 text-white"
                >
                  Confirm Reassignment
                </button>
              </form>
            )}

            {/* Cancel Tab */}
            {modalTab === 'cancel' && (
              <form onSubmit={handleCancelSubmit} className="space-y-3 pt-2">
                <div className="p-3 bg-rose-50 text-rose-800 text-xs rounded-xl border border-rose-200">
                  Cancelled classes do not consume student's package class count.
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Cancellation Reason *
                  </label>
                  <input
                    type="text"
                    required
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="e.g. Heavy rain / Student illness"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white"
                >
                  Confirm Cancellation
                </button>
              </form>
            )}

            {/* Permanent Delete Slot */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <span className="text-[11px] text-slate-400">Permanently remove slot record:</span>
              <button
                type="button"
                onClick={() => handleDeleteAppointment(selectedAppointment.id)}
                className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Booking</span>
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* BULK REASSIGN HELPER MODAL */}
      <Modal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        title="Bulk Reassign Appointments"
        description="Quickly reassign all bookings when an instructor goes on leave or vehicle enters service"
      >
        <form onSubmit={handleRunBulkReassign} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Affected Instructor (On Leave)
              </label>
              <select
                value={bulkAffectedInstId}
                onChange={(e) => setBulkAffectedInstId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              >
                <option value="">-- Any / None --</option>
                {instructors.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Affected Vehicle (In Service)
              </label>
              <select
                value={bulkAffectedVehId}
                onChange={(e) => setBulkAffectedVehId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
              >
                <option value="">-- Any / None --</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.registration_number}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div>
              <label className="block text-xs font-bold text-teal-700 dark:text-teal-400 mb-1">
                Reassign to Replacement Instructor
              </label>
              <select
                value={bulkTargetInstId}
                onChange={(e) => setBulkTargetInstId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-teal-300 bg-white dark:bg-slate-800 font-semibold"
              >
                <option value="">-- Keep original --</option>
                {instructors.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-teal-700 dark:text-teal-400 mb-1">
                Reassign to Replacement Vehicle
              </label>
              <select
                value={bulkTargetVehId}
                onChange={(e) => setBulkTargetVehId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-teal-300 bg-white dark:bg-slate-800 font-mono font-semibold"
              >
                <option value="">-- Keep original --</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.registration_number}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {bulkResult && (
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-2 text-xs">
              <div className="font-bold text-emerald-600">
                ✓ Successfully reassigned {bulkResult.reassignedCount} appointments!
              </div>
              {bulkResult.conflicts.length > 0 && (
                <div className="text-rose-600 space-y-1">
                  <div className="font-bold">Skipped {bulkResult.conflicts.length} slots due to conflicts:</div>
                  <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                    {bulkResult.conflicts.map((c, idx) => (
                      <li key={idx}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsBulkModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 text-slate-700"
            >
              Close
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold rounded-xl bg-teal-600 hover:bg-teal-700 text-white"
            >
              Run Bulk Reassignment
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
