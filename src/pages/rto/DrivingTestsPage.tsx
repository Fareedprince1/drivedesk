import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  Search,
  Filter,
  Plus,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Award,
  FileText,
  ChevronRight,
  Phone,
  MessageSquare,
  Sparkles,
  Car,
  Bike,
  User,
  ArrowRight,
  RefreshCw,
  ExternalLink,
  Kanban,
  Table as TableIcon,
  HelpCircle,
  Clock3,
  CalendarCheck,
  Building,
  CheckCircle,
} from 'lucide-react';
import { db } from '../../lib/storage';
import { useAuth } from '../../context/AuthContext';
import {
  formatDate,
  formatINR,
  formatTime12,
  getTodayIST,
  getWhatsAppUrl,
  getTelUrl,
} from '../../lib/formatters';
import type {
  RTOTrainingRecord,
  RTOStage,
  TestResult,
  Candidate,
  Enrollment,
  Package,
} from '../../types';

interface CandidateWithRTO {
  candidate: Candidate;
  enrollment: Enrollment;
  pkg: Package | undefined;
  rto: RTOTrainingRecord;
  completedClasses: number;
  totalClasses: number;
  remainingClasses: number;
  balance: number;
  hasIncompleteTraining: boolean;
  hasPendingBalance: boolean;
  daysUntilTest: number | null;
}

const STAGES: { key: RTOStage; label: string; desc: string; color: string; bg: string; border: string }[] = [
  {
    key: 'll_pending',
    label: "1. LL Pending",
    desc: "Awaiting Learner's Licence issue",
    color: 'text-amber-700 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950/20',
    border: 'border-amber-200 dark:border-amber-800',
  },
  {
    key: 'll_completed',
    label: '2. LL Completed',
    desc: 'Learner Licence active, ready for lessons',
    color: 'text-sky-700 dark:text-sky-400',
    bg: 'bg-sky-50 dark:bg-sky-950/20',
    border: 'border-sky-200 dark:border-sky-800',
  },
  {
    key: 'training_ongoing',
    label: '3. Training Ongoing',
    desc: 'Practical classes in progress',
    color: 'text-indigo-700 dark:text-indigo-400',
    bg: 'bg-indigo-50 dark:bg-indigo-950/20',
    border: 'border-indigo-200 dark:border-indigo-800',
  },
  {
    key: 'test_booked',
    label: '4. Test Booked',
    desc: 'Official RTO driving test scheduled',
    color: 'text-purple-700 dark:text-purple-400',
    bg: 'bg-purple-50 dark:bg-purple-950/20',
    border: 'border-purple-200 dark:border-purple-800',
  },
  {
    key: 'test_completed',
    label: '5. Test Completed',
    desc: 'Exam attempted (Pass/Fail outcome recorded)',
    color: 'text-emerald-700 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-950/20',
    border: 'border-emerald-200 dark:border-emerald-800',
  },
  {
    key: 'licence_received',
    label: '6. Licence Received',
    desc: 'Official Driving Licence card received',
    color: 'text-teal-700 dark:text-teal-400',
    bg: 'bg-teal-50 dark:bg-teal-950/20',
    border: 'border-teal-200 dark:border-teal-800',
  },
];

export const DrivingTestsPage: React.FC = () => {
  const { currentRole } = useAuth();
  const [dataVersion, setDataVersion] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStageFilter, setSelectedStageFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');

  // Modals state
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [resultModalOpen, setResultModalOpen] = useState(false);
  const [editDetailsModalOpen, setEditDetailsModalOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<CandidateWithRTO | null>(null);

  // Form states for scheduling
  const [scheduleForm, setScheduleForm] = useState({
    testDate: '',
    testTime: '10:00',
    rtoOffice: 'Indiranagar RTO (KA-03)',
    remarks: '',
  });

  // Form states for test result
  const [resultForm, setResultForm] = useState<{
    outcome: TestResult;
    licenceNumber: string;
    remarks: string;
    rescheduleDate: string;
  }>({
    outcome: 'pass',
    licenceNumber: '',
    remarks: '',
    rescheduleDate: '',
  });

  // Form states for editing document numbers
  const [detailsForm, setDetailsForm] = useState({
    stage: 'll_pending' as RTOStage,
    llNumber: '',
    licenceNumber: '',
    remarks: '',
  });

  const today = getTodayIST();

  // Load all candidates with RTO, package, training stats & balances
  const allCandidatesWithRTO: CandidateWithRTO[] = useMemo(() => {
    const rtoRecords = db.getRTORecords();
    const candidates = db.getCandidates(true);
    const enrollments = db.getEnrollments();
    const packages = db.getPackages(true);
    const appointments = db.getAppointments();
    const payments = db.getPayments();

    return rtoRecords
      .map((rto) => {
        const candidate = candidates.find((c) => c.id === rto.candidate_id);
        const enrollment = enrollments.find((e) => e.id === rto.enrollment_id);
        if (!candidate || !enrollment) return null;

        const pkg = packages.find((p) => p.id === enrollment.package_id);

        // Calculate completed classes
        const candidateApps = appointments.filter(
          (a) => a.enrollment_id === enrollment.id && (a.status === 'completed' || a.status === 'absent')
        );
        const completedClasses = candidateApps.length;
        const totalClasses = enrollment.classes_total;
        const remainingClasses = Math.max(0, totalClasses - completedClasses);

        // Calculate balance
        const totalPaid = payments
          .filter((p) => p.enrollment_id === enrollment.id && !p.is_reversal && !p.reversed_by_payment_id)
          .reduce((sum, p) => sum + p.amount, 0);
        const balance = Math.max(0, enrollment.fee_agreed - totalPaid);

        // Calculate days until test
        let daysUntilTest: number | null = null;
        if (rto.test_date) {
          const tDate = new Date(rto.test_date + 'T00:00:00');
          const tToday = new Date(today + 'T00:00:00');
          const diffTime = tDate.getTime() - tToday.getTime();
          daysUntilTest = Math.round(diffTime / (1000 * 60 * 60 * 24));
        }

        return {
          candidate,
          enrollment,
          pkg,
          rto,
          completedClasses,
          totalClasses,
          remainingClasses,
          balance,
          hasIncompleteTraining: remainingClasses > 0,
          hasPendingBalance: balance > 0,
          daysUntilTest,
        };
      })
      .filter((item): item is CandidateWithRTO => item !== null);
  }, [dataVersion, today]);

  // Filtered list
  const filteredItems = useMemo(() => {
    return allCandidatesWithRTO.filter((item) => {
      // Stage filter
      if (selectedStageFilter !== 'all' && item.rto.stage !== selectedStageFilter) {
        return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const nameMatch = item.candidate.full_name.toLowerCase().includes(q);
        const codeMatch = item.candidate.candidate_code.toLowerCase().includes(q);
        const phoneMatch = item.candidate.mobile.includes(q);
        const llMatch = item.rto.ll_number?.toLowerCase().includes(q);
        const dlMatch = item.rto.licence_number?.toLowerCase().includes(q);
        return nameMatch || codeMatch || phoneMatch || llMatch || dlMatch;
      }
      return true;
    });
  }, [allCandidatesWithRTO, selectedStageFilter, searchQuery]);

  // Upcoming Tests in next 7 days (or overdue)
  const upcomingTests = useMemo(() => {
    return allCandidatesWithRTO
      .filter((item) => {
        return (
          item.rto.stage === 'test_booked' &&
          item.rto.test_date &&
          item.daysUntilTest !== null &&
          item.daysUntilTest <= 7 &&
          item.rto.test_result === 'pending'
        );
      })
      .sort((a, b) => (a.daysUntilTest ?? 0) - (b.daysUntilTest ?? 0));
  }, [allCandidatesWithRTO]);

  // Summary Metrics
  const metrics = useMemo(() => {
    return {
      upcomingCount: upcomingTests.length,
      llPendingCount: allCandidatesWithRTO.filter((i) => i.rto.stage === 'll_pending').length,
      trainingCount: allCandidatesWithRTO.filter((i) => i.rto.stage === 'training_ongoing').length,
      testBookedCount: allCandidatesWithRTO.filter((i) => i.rto.stage === 'test_booked').length,
      licenceDoneCount: allCandidatesWithRTO.filter((i) => i.rto.stage === 'licence_received').length,
    };
  }, [allCandidatesWithRTO, upcomingTests]);

  // Handlers
  const handleOpenSchedule = (item: CandidateWithRTO) => {
    setActiveItem(item);
    setScheduleForm({
      testDate: item.rto.test_date || today,
      testTime: item.rto.test_time || '10:00',
      rtoOffice: 'Indiranagar RTO (KA-03)',
      remarks: item.rto.remarks || '',
    });
    setScheduleModalOpen(true);
  };

  const handleSaveSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeItem) return;

    db.updateRTORecord(
      activeItem.rto.id,
      {
        stage: 'test_booked',
        test_date: scheduleForm.testDate,
        test_time: scheduleForm.testTime,
        test_result: 'pending',
        remarks: scheduleForm.remarks || `RTO: ${scheduleForm.rtoOffice}`,
      },
      currentRole
    );

    setScheduleModalOpen(false);
    setDataVersion((v) => v + 1);
  };

  const handleOpenResult = (item: CandidateWithRTO) => {
    setActiveItem(item);
    setResultForm({
      outcome: 'pass',
      licenceNumber: item.rto.licence_number || '',
      remarks: '',
      rescheduleDate: '',
    });
    setResultModalOpen(true);
  };

  const handleSaveResult = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeItem) return;

    if (resultForm.outcome === 'pass') {
      db.updateRTORecord(
        activeItem.rto.id,
        {
          stage: resultForm.licenceNumber ? 'licence_received' : 'test_completed',
          test_result: 'pass',
          licence_number: resultForm.licenceNumber || undefined,
          licence_received_date: resultForm.licenceNumber ? today : undefined,
          remarks: resultForm.remarks ? `${activeItem.rto.remarks || ''} | Passed: ${resultForm.remarks}` : activeItem.rto.remarks,
        },
        currentRole
      );
    } else if (resultForm.outcome === 'fail') {
      db.recordTestResult(
        activeItem.rto.id,
        'fail',
        resultForm.remarks,
        resultForm.rescheduleDate || undefined,
        currentRole
      );
    } else {
      db.updateRTORecord(
        activeItem.rto.id,
        {
          test_result: 'pending',
          remarks: resultForm.remarks,
        },
        currentRole
      );
    }

    setResultModalOpen(false);
    setDataVersion((v) => v + 1);
  };

  const handleOpenEditDetails = (item: CandidateWithRTO) => {
    setActiveItem(item);
    setDetailsForm({
      stage: item.rto.stage,
      llNumber: item.rto.ll_number || '',
      licenceNumber: item.rto.licence_number || '',
      remarks: item.rto.remarks || '',
    });
    setEditDetailsModalOpen(true);
  };

  const handleSaveDetails = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeItem) return;

    db.updateRTORecord(
      activeItem.rto.id,
      {
        stage: detailsForm.stage,
        ll_number: detailsForm.llNumber || undefined,
        licence_number: detailsForm.licenceNumber || undefined,
        remarks: detailsForm.remarks || undefined,
        licence_received_date: detailsForm.stage === 'licence_received' ? today : activeItem.rto.licence_received_date,
      },
      currentRole
    );

    // If LL number updated, sync candidate ll_number
    if (detailsForm.llNumber) {
      db.updateCandidate(activeItem.candidate.id, { ll_number: detailsForm.llNumber }, currentRole);
    }

    setEditDetailsModalOpen(false);
    setDataVersion((v) => v + 1);
  };

  const handleAdvanceStage = (item: CandidateWithRTO, nextStage: RTOStage) => {
    db.updateRTOStage(item.rto.id, nextStage, undefined, currentRole);
    setDataVersion((v) => v + 1);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Award className="h-7 w-7 text-teal-600 dark:text-teal-400" />
            Driving Tests & RTO Pipeline
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track student licence lifecycle: Learner's Licence (LL), practical training, test booking & final DL issuance.
          </p>
        </div>

        {/* View Switcher & Action */}
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-0.5 shadow-sm">
            <button
              onClick={() => setViewMode('kanban')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                viewMode === 'kanban'
                  ? 'bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-400 font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Kanban className="h-4 w-4" />
              Kanban Board
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                viewMode === 'table'
                  ? 'bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-400 font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <TableIcon className="h-4 w-4" />
              Table View
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Tests Booked</span>
            <CalendarCheck className="h-4 w-4 text-purple-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {metrics.testBookedCount}
            </span>
            <span className="text-xs text-purple-600 font-medium font-mono">Ready for RTO</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Next 7 Days</span>
            <Clock3 className="h-4 w-4 text-amber-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {metrics.upcomingCount}
            </span>
            <span className="text-xs text-slate-500">Upcoming</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">LL Pending</span>
            <FileText className="h-4 w-4 text-amber-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {metrics.llPendingCount}
            </span>
            <span className="text-xs text-slate-500">Doc verification</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">In Training</span>
            <Car className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {metrics.trainingCount}
            </span>
            <span className="text-xs text-slate-500">Active students</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 shadow-xs col-span-2 md:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Licences Done</span>
            <CheckCircle className="h-4 w-4 text-teal-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-teal-600 dark:text-teal-400">
              {metrics.licenceDoneCount}
            </span>
            <span className="text-xs text-slate-500">Issued</span>
          </div>
        </div>
      </div>

      {/* ⚠️ UPCOMING TESTS (NEXT 7 DAYS) WARNING & ATTENTION SECTION */}
      {upcomingTests.length > 0 && (
        <div className="rounded-2xl border border-purple-200 dark:border-purple-900/50 bg-gradient-to-br from-purple-50/60 to-indigo-50/40 dark:from-purple-950/20 dark:to-indigo-950/10 p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-600 text-white shadow-xs">
                <CalendarCheck className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  Upcoming Driving Tests (Next 7 Days)
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                    {upcomingTests.length} Scheduled
                  </span>
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Verify class completion and zero fee balance before candidates head to the RTO track.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {upcomingTests.map((item) => {
              const isOverdue = item.daysUntilTest !== null && item.daysUntilTest < 0;
              const isToday = item.daysUntilTest === 0;
              const isTomorrow = item.daysUntilTest === 1;

              return (
                <div
                  key={item.rto.id}
                  className="rounded-xl border border-white/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs p-4 shadow-xs transition hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <Link
                          to={`/candidates/${item.candidate.id}`}
                          className="font-bold text-sm text-slate-900 dark:text-white hover:text-teal-600 flex items-center gap-1"
                        >
                          {item.candidate.full_name}
                          <ExternalLink className="h-3 w-3 opacity-60" />
                        </Link>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                        <span className="font-mono font-medium">{item.candidate.candidate_code}</span>
                        <span>•</span>
                        <span>{item.pkg?.name || 'Standard'}</span>
                      </div>
                    </div>

                    {/* Due Badge */}
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ${
                        isOverdue
                          ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                          : isToday
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 animate-pulse'
                          : isTomorrow
                          ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
                          : 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                      }`}
                    >
                      <Clock className="h-3 w-3 mr-1" />
                      {isOverdue
                        ? `${Math.abs(item.daysUntilTest!)}d overdue`
                        : isToday
                        ? 'TODAY'
                        : isTomorrow
                        ? 'Tomorrow'
                        : `In ${item.daysUntilTest} days`}
                    </span>
                  </div>

                  {/* Test Date & Time */}
                  <div className="mt-3 flex items-center justify-between text-xs bg-slate-50 dark:bg-slate-800/60 rounded-lg p-2 font-medium">
                    <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-purple-600" />
                      {formatDate(item.rto.test_date)}
                    </span>
                    <span className="text-slate-600 dark:text-slate-400">
                      {formatTime12(item.rto.test_time)}
                    </span>
                  </div>

                  {/* 🚨 CRITICAL AUDIT WARNINGS */}
                  <div className="mt-2.5 space-y-1.5">
                    {item.hasIncompleteTraining && (
                      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-300 text-xs font-medium">
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-600" />
                        <span>
                          Training Incomplete: <strong>{item.remainingClasses} classes left</strong> ({item.completedClasses}/{item.totalClasses})
                        </span>
                      </div>
                    )}

                    {item.hasPendingBalance && (
                      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-300 text-xs font-medium">
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-rose-600" />
                        <span>
                          Fee Unsettled: <strong>{formatINR(item.balance)} balance</strong>
                        </span>
                      </div>
                    )}

                    {!item.hasIncompleteTraining && !item.hasPendingBalance && (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 text-xs font-medium">
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                        <span>Eligible: Training finished & fully paid</span>
                      </div>
                    )}
                  </div>

                  {/* Quick Card Actions */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1">
                      <a
                        href={getTelUrl(item.candidate.mobile)}
                        className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 transition-colors"
                        title="Call Candidate"
                      >
                        <Phone className="h-3.5 w-3.5" />
                      </a>
                      <a
                        href={getWhatsAppUrl(
                          item.candidate.mobile,
                          `Hi ${item.candidate.full_name}, your RTO Driving Test is on ${formatDate(item.rto.test_date)} at ${formatTime12(item.rto.test_time)}.`
                        )}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-md hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-600 transition-colors"
                        title="WhatsApp Reminder"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                      </a>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenSchedule(item)}
                        className="text-xs px-2 py-1 rounded font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        Reschedule
                      </button>
                      <button
                        onClick={() => handleOpenResult(item)}
                        className="text-xs px-2.5 py-1 rounded font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-xs"
                      >
                        Record Result
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Search and Filters Bar */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search candidate, phone, LL/DL #..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
          />
        </div>

        {/* Stage Filter Dropdown */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="h-4 w-4 text-slate-400 shrink-0" />
          <select
            value={selectedStageFilter}
            onChange={(e) => setSelectedStageFilter(e.target.value)}
            className="w-full sm:w-56 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white py-1.5 px-3 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
          >
            <option value="all">All Stages ({allCandidatesWithRTO.length})</option>
            {STAGES.map((s) => {
              const count = allCandidatesWithRTO.filter((i) => i.rto.stage === s.key).length;
              return (
                <option key={s.key} value={s.key}>
                  {s.label} ({count})
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* VIEW MODE 1: KANBAN BOARD */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4 items-start overflow-x-auto pb-4">
          {STAGES.map((col) => {
            const stageItems = filteredItems.filter((i) => i.rto.stage === col.key);

            return (
              <div
                key={col.key}
                className="flex flex-col rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 min-w-[280px] max-w-full"
              >
                {/* Column Header */}
                <div className={`p-3 border-b ${col.border} rounded-t-xl bg-white dark:bg-slate-800`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold uppercase tracking-wider ${col.color}`}>
                      {col.label}
                    </span>
                    <span className="inline-flex items-center justify-center h-5 px-2 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                      {stageItems.length}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                    {col.desc}
                  </p>
                </div>

                {/* Column Content / Cards List */}
                <div className="p-2 space-y-2.5 min-h-[350px]">
                  {stageItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-6 text-center text-slate-400">
                      <HelpCircle className="h-6 w-6 stroke-[1.5] mb-1 opacity-50" />
                      <p className="text-xs">No candidates</p>
                    </div>
                  ) : (
                    stageItems.map((item) => (
                      <div
                        key={item.rto.id}
                        className="rounded-lg border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800 p-3 shadow-xs hover:shadow-md transition"
                      >
                        {/* Header: Name & Code */}
                        <div className="flex items-start justify-between gap-1">
                          <div>
                            <Link
                              to={`/candidates/${item.candidate.id}`}
                              className="font-bold text-xs text-slate-900 dark:text-white hover:text-teal-600 block line-clamp-1"
                            >
                              {item.candidate.full_name}
                            </Link>
                            <span className="font-mono text-[11px] text-slate-500">
                              {item.candidate.candidate_code}
                            </span>
                          </div>

                          {/* Vehicle Type icon */}
                          <span className="p-1 rounded bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-400">
                            {item.pkg?.vehicle_type === 'bike' ? (
                              <Bike className="h-3.5 w-3.5" />
                            ) : (
                              <Car className="h-3.5 w-3.5" />
                            )}
                          </span>
                        </div>

                        {/* Middle: Progress / Status Pills */}
                        <div className="mt-2 space-y-1.5 text-[11px]">
                          {/* Training Progress */}
                          <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                            <span>Training:</span>
                            <span className="font-medium text-slate-900 dark:text-slate-200">
                              {item.completedClasses}/{item.totalClasses} classes
                            </span>
                          </div>

                          <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${
                                item.remainingClasses === 0 ? 'bg-emerald-500' : 'bg-teal-500'
                              }`}
                              style={{
                                width: `${Math.min(
                                  100,
                                  Math.round((item.completedClasses / (item.totalClasses || 1)) * 100)
                                )}%`,
                              }}
                            />
                          </div>

                          {/* Fee Status */}
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">Balance:</span>
                            {item.balance > 0 ? (
                              <span className="font-semibold text-rose-600 dark:text-rose-400">
                                {formatINR(item.balance)} Due
                              </span>
                            ) : (
                              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                Paid
                              </span>
                            )}
                          </div>

                          {/* Stage-specific detail snippets */}
                          {item.rto.stage === 'll_pending' && (
                            <div className="mt-1.5 p-1.5 rounded bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 text-[11px]">
                              Awaiting RTO slot & LL application
                            </div>
                          )}

                          {item.rto.stage === 'll_completed' && item.rto.ll_number && (
                            <div className="mt-1.5 p-1.5 rounded bg-sky-50 dark:bg-sky-950/30 text-sky-800 dark:text-sky-300 font-mono text-[10px] break-all">
                              LL: {item.rto.ll_number}
                            </div>
                          )}

                          {item.rto.stage === 'test_booked' && item.rto.test_date && (
                            <div className="mt-1.5 p-1.5 rounded bg-purple-50 dark:bg-purple-950/30 text-purple-800 dark:text-purple-300">
                              <div className="flex items-center justify-between">
                                <span className="font-semibold">
                                  {formatDate(item.rto.test_date)}
                                </span>
                                <span>{formatTime12(item.rto.test_time)}</span>
                              </div>
                            </div>
                          )}

                          {item.rto.stage === 'test_completed' && (
                            <div className="mt-1.5 flex items-center justify-between p-1 rounded bg-slate-50 dark:bg-slate-700/40">
                              <span className="text-slate-500">Result:</span>
                              <span
                                className={`font-bold uppercase ${
                                  item.rto.test_result === 'pass'
                                    ? 'text-emerald-600'
                                    : item.rto.test_result === 'fail'
                                    ? 'text-rose-600'
                                    : 'text-amber-600'
                                }`}
                              >
                                {item.rto.test_result || 'Pending'}
                              </span>
                            </div>
                          )}

                          {item.rto.stage === 'licence_received' && (
                            <div className="mt-1.5 p-1.5 rounded bg-teal-50 dark:bg-teal-950/30 text-teal-800 dark:text-teal-300 font-mono text-[10px] font-bold">
                              DL: {item.rto.licence_number || 'Issued'}
                            </div>
                          )}
                        </div>

                        {/* Card Action Buttons */}
                        <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-1">
                          <button
                            onClick={() => handleOpenEditDetails(item)}
                            className="p-1 text-[11px] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                            title="Edit LL / DL details"
                          >
                            Edit
                          </button>

                          {/* Stage Transition Quick Action */}
                          {item.rto.stage === 'll_pending' && (
                            <button
                              onClick={() => handleOpenEditDetails(item)}
                              className="text-[11px] px-2 py-0.5 rounded font-medium bg-amber-100 hover:bg-amber-200 text-amber-800 dark:bg-amber-900 dark:text-amber-200 flex items-center gap-1"
                            >
                              Add LL #
                              <ArrowRight className="h-3 w-3" />
                            </button>
                          )}

                          {item.rto.stage === 'll_completed' && (
                            <button
                              onClick={() => handleAdvanceStage(item, 'training_ongoing')}
                              className="text-[11px] px-2 py-0.5 rounded font-medium bg-indigo-100 hover:bg-indigo-200 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 flex items-center gap-1"
                            >
                              Start Lessons
                              <ArrowRight className="h-3 w-3" />
                            </button>
                          )}

                          {item.rto.stage === 'training_ongoing' && (
                            <button
                              onClick={() => handleOpenSchedule(item)}
                              className="text-[11px] px-2 py-0.5 rounded font-medium bg-purple-100 hover:bg-purple-200 text-purple-800 dark:bg-purple-900 dark:text-purple-200 flex items-center gap-1"
                            >
                              Schedule Test
                              <ArrowRight className="h-3 w-3" />
                            </button>
                          )}

                          {item.rto.stage === 'test_booked' && (
                            <button
                              onClick={() => handleOpenResult(item)}
                              className="text-[11px] px-2 py-0.5 rounded font-bold bg-teal-600 hover:bg-teal-700 text-white flex items-center gap-1"
                            >
                              Outcome
                              <ArrowRight className="h-3 w-3" />
                            </button>
                          )}

                          {item.rto.stage === 'test_completed' && item.rto.test_result === 'pass' && (
                            <button
                              onClick={() => handleOpenEditDetails(item)}
                              className="text-[11px] px-2 py-0.5 rounded font-medium bg-teal-100 hover:bg-teal-200 text-teal-800 dark:bg-teal-900 dark:text-teal-200 flex items-center gap-1"
                            >
                              Add DL #
                              <ArrowRight className="h-3 w-3" />
                            </button>
                          )}

                          {item.rto.stage === 'test_completed' && item.rto.test_result === 'fail' && (
                            <button
                              onClick={() => handleOpenSchedule(item)}
                              className="text-[11px] px-2 py-0.5 rounded font-medium bg-rose-100 hover:bg-rose-200 text-rose-800 dark:bg-rose-900 dark:text-rose-200 flex items-center gap-1"
                            >
                              Re-book Test
                              <ArrowRight className="h-3 w-3" />
                            </button>
                          )}

                          {item.rto.stage === 'licence_received' && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-600">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Complete
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW MODE 2: TABLE VIEW */}
      {viewMode === 'table' && (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Candidate</th>
                  <th className="py-3 px-3">Stage</th>
                  <th className="py-3 px-3">Training Progress</th>
                  <th className="py-3 px-3">Fee Status</th>
                  <th className="py-3 px-3">LL Number</th>
                  <th className="py-3 px-3">Test Date & Time</th>
                  <th className="py-3 px-3">Result / DL #</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      No candidate RTO records found matching your filters.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => {
                    const stageObj = STAGES.find((s) => s.key === item.rto.stage);

                    return (
                      <tr key={item.rto.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50">
                        <td className="py-3 px-4">
                          <Link
                            to={`/candidates/${item.candidate.id}`}
                            className="font-bold text-slate-900 dark:text-white hover:text-teal-600"
                          >
                            {item.candidate.full_name}
                          </Link>
                          <div className="flex items-center gap-2 text-slate-500 font-mono text-[11px] mt-0.5">
                            <span>{item.candidate.candidate_code}</span>
                            <span>•</span>
                            <span>{item.candidate.mobile}</span>
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full font-semibold text-[11px] ${
                              stageObj?.bg || 'bg-slate-100'
                            } ${stageObj?.color || 'text-slate-700'}`}
                          >
                            {stageObj?.label || item.rto.stage}
                          </span>
                        </td>

                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <span>
                              {item.completedClasses}/{item.totalClasses}
                            </span>
                            {item.remainingClasses > 0 ? (
                              <span className="text-[10px] text-amber-600 font-medium">
                                ({item.remainingClasses} left)
                              </span>
                            ) : (
                              <span className="text-[10px] text-emerald-600 font-medium">Done</span>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          {item.balance > 0 ? (
                            <span className="font-semibold text-rose-600 dark:text-rose-400">
                              {formatINR(item.balance)} Due
                            </span>
                          ) : (
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                              Paid
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-400">
                          {item.rto.ll_number || '-'}
                        </td>

                        <td className="py-3 px-3">
                          {item.rto.test_date ? (
                            <div>
                              <span className="font-medium">{formatDate(item.rto.test_date)}</span>
                              <span className="text-slate-400 text-[11px] block">
                                {formatTime12(item.rto.test_time)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>

                        <td className="py-3 px-3">
                          {item.rto.licence_number ? (
                            <span className="font-mono font-bold text-teal-600 dark:text-teal-400">
                              {item.rto.licence_number}
                            </span>
                          ) : item.rto.test_result ? (
                            <span
                              className={`font-semibold uppercase text-[11px] ${
                                item.rto.test_result === 'pass'
                                  ? 'text-emerald-600'
                                  : item.rto.test_result === 'fail'
                                  ? 'text-rose-600'
                                  : 'text-amber-600'
                              }`}
                            >
                              {item.rto.test_result}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenSchedule(item)}
                              className="px-2 py-1 rounded text-[11px] font-medium border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
                            >
                              Schedule
                            </button>
                            <button
                              onClick={() => handleOpenResult(item)}
                              className="px-2 py-1 rounded text-[11px] font-medium bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300 hover:bg-teal-100"
                            >
                              Outcome
                            </button>
                            <button
                              onClick={() => handleOpenEditDetails(item)}
                              className="px-2 py-1 rounded text-[11px] font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
                            >
                              Edit
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
        </div>
      )}

      {/* MODAL 1: SCHEDULE / BOOK TEST */}
      {scheduleModalOpen && activeItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <CalendarCheck className="h-5 w-5 text-purple-600" />
                  Schedule Driving Test
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Candidate: <strong>{activeItem.candidate.full_name}</strong> ({activeItem.candidate.candidate_code})
                </p>
              </div>
              <button
                onClick={() => setScheduleModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Incomplete warning in modal */}
            {(activeItem.hasIncompleteTraining || activeItem.hasPendingBalance) && (
              <div className="mt-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  Attention before booking:
                </div>
                {activeItem.hasIncompleteTraining && (
                  <div>• {activeItem.remainingClasses} training classes remain to be completed.</div>
                )}
                {activeItem.hasPendingBalance && (
                  <div>• Pending balance of {formatINR(activeItem.balance)} is outstanding.</div>
                )}
              </div>
            )}

            <form onSubmit={handleSaveSchedule} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Test Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={scheduleForm.testDate}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, testDate: e.target.value })}
                    className="w-full text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Test Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={scheduleForm.testTime}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, testTime: e.target.value })}
                    className="w-full text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  RTO Track / Office
                </label>
                <input
                  type="text"
                  value={scheduleForm.rtoOffice}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, rtoOffice: e.target.value })}
                  placeholder="e.g. Indiranagar RTO Track (KA-03)"
                  className="w-full text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Notes / Instructions
                </label>
                <textarea
                  rows={2}
                  value={scheduleForm.remarks}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, remarks: e.target.value })}
                  placeholder="e.g. Carry original Learner Licence & Aadhaar card"
                  className="w-full text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setScheduleModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-sm font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-xs"
                >
                  Save Test Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: RECORD TEST RESULT (PASS/FAIL) */}
      {resultModalOpen && activeItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Award className="h-5 w-5 text-teal-600" />
                  Record Driving Test Outcome
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {activeItem.candidate.full_name} ({activeItem.candidate.candidate_code}) • Test Date: {formatDate(activeItem.rto.test_date)}
                </p>
              </div>
              <button
                onClick={() => setResultModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveResult} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Test Result *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setResultForm({ ...resultForm, outcome: 'pass' })}
                    className={`py-2 px-3 rounded-lg text-xs font-bold border transition flex items-center justify-center gap-1.5 ${
                      resultForm.outcome === 'pass'
                        ? 'bg-emerald-500 text-white border-emerald-600 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    PASS
                  </button>
                  <button
                    type="button"
                    onClick={() => setResultForm({ ...resultForm, outcome: 'fail' })}
                    className={`py-2 px-3 rounded-lg text-xs font-bold border transition flex items-center justify-center gap-1.5 ${
                      resultForm.outcome === 'fail'
                        ? 'bg-rose-500 text-white border-rose-600 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <XCircle className="h-4 w-4" />
                    FAIL
                  </button>
                  <button
                    type="button"
                    onClick={() => setResultForm({ ...resultForm, outcome: 'pending' })}
                    className={`py-2 px-3 rounded-lg text-xs font-bold border transition flex items-center justify-center gap-1.5 ${
                      resultForm.outcome === 'pending'
                        ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <Clock className="h-4 w-4" />
                    PENDING
                  </button>
                </div>
              </div>

              {/* If Passed: Option to record DL number */}
              {resultForm.outcome === 'pass' && (
                <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 space-y-2">
                  <label className="block text-xs font-semibold text-emerald-900 dark:text-emerald-300">
                    Driving Licence (DL) Number (if issued)
                  </label>
                  <input
                    type="text"
                    value={resultForm.licenceNumber}
                    onChange={(e) => setResultForm({ ...resultForm, licenceNumber: e.target.value.toUpperCase() })}
                    placeholder="e.g. KA0320260012345"
                    className="w-full text-sm font-mono uppercase rounded-lg border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-900 p-2 text-slate-900 dark:text-white"
                  />
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                    If DL card has not arrived yet, leave blank. The candidate will move to "Test Completed (Pass)".
                  </p>
                </div>
              )}

              {/* If Failed: Option to reschedule immediately */}
              {resultForm.outcome === 'fail' && (
                <div className="p-3 rounded-xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 space-y-2">
                  <label className="block text-xs font-semibold text-rose-900 dark:text-rose-300">
                    Reschedule Re-test Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={resultForm.rescheduleDate}
                    onChange={(e) => setResultForm({ ...resultForm, rescheduleDate: e.target.value })}
                    className="w-full text-sm rounded-lg border border-rose-300 dark:border-rose-700 bg-white dark:bg-slate-900 p-2 text-slate-900 dark:text-white"
                  />
                  <p className="text-[11px] text-rose-700 dark:text-rose-400">
                    Candidate can take 7-14 days cooling period before second attempt per RTO rules.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Examiner Remarks / Notes
                </label>
                <textarea
                  rows={2}
                  value={resultForm.remarks}
                  onChange={(e) => setResultForm({ ...resultForm, remarks: e.target.value })}
                  placeholder="e.g. Passed reverse H track with zero touches"
                  className="w-full text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setResultModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-sm font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-xs"
                >
                  Save Outcome
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: EDIT RTO & DOCUMENT DETAILS */}
      {editDetailsModalOpen && activeItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="h-5 w-5 text-teal-600" />
                  Edit RTO Stage & Document Info
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {activeItem.candidate.full_name} ({activeItem.candidate.candidate_code})
                </p>
              </div>
              <button
                onClick={() => setEditDetailsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveDetails} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  RTO Pipeline Stage *
                </label>
                <select
                  value={detailsForm.stage}
                  onChange={(e) => setDetailsForm({ ...detailsForm, stage: e.target.value as RTOStage })}
                  className="w-full text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-slate-900 dark:text-white"
                >
                  {STAGES.map((s) => (
                    <option key={s.key} value={s.key}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Learner's Licence (LL) Number
                </label>
                <input
                  type="text"
                  value={detailsForm.llNumber}
                  onChange={(e) => setDetailsForm({ ...detailsForm, llNumber: e.target.value.toUpperCase() })}
                  placeholder="e.g. KA03/LL/004812/2026"
                  className="w-full text-sm font-mono uppercase rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Driving Licence (DL) Number
                </label>
                <input
                  type="text"
                  value={detailsForm.licenceNumber}
                  onChange={(e) => setDetailsForm({ ...detailsForm, licenceNumber: e.target.value.toUpperCase() })}
                  placeholder="e.g. KA0320260012345"
                  className="w-full text-sm font-mono uppercase rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Remarks / Notes
                </label>
                <textarea
                  rows={2}
                  value={detailsForm.remarks}
                  onChange={(e) => setDetailsForm({ ...detailsForm, remarks: e.target.value })}
                  placeholder="e.g. Documents verified by staff"
                  className="w-full text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditDetailsModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-sm font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-xs"
                >
                  Update Details
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
