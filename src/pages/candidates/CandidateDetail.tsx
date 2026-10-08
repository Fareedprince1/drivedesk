import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  User,
  Phone,
  MessageSquare,
  Calendar,
  CreditCard,
  FileText,
  AlertCircle,
  Sparkles,
  ArrowLeft,
  GraduationCap,
  Download,
  Plus,
  Trash2,
} from 'lucide-react';
import { db } from '../../lib/storage';
import { supabase } from '../../lib/supabase';
import type {
  Candidate,
  Enrollment,
  Payment,
  Appointment,
  RTOTrainingRecord,
  CandidateNote,
  CandidateStatus,
} from '../../types';
import {
  formatINR,
  formatDate,
  formatTime12,
  formatDateTime,
  formatPhone,
  getWhatsAppUrl,
  getTelUrl,
  getTodayIST,
} from '../../lib/formatters';
import { Badge, getStatusBadgeVariant } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { useAuth } from '../../context/AuthContext';

export const CandidateDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin, role } = useAuth();

  const [activeTab, setActiveTab] = useState<'overview' | 'classes' | 'payments' | 'rto' | 'notes'>('overview');

  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [, setEnrollments] = useState<Enrollment[]>([]);
  const [selectedEnrollment, setSelectedEnrollment] = useState<Enrollment | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [rtoRecord, setRtoRecord] = useState<RTOTrainingRecord | null>(null);
  const [candidateRTORecords, setCandidateRTORecords] = useState<RTOTrainingRecord[]>([]);
  const [notes, setNotes] = useState<CandidateNote[]>([]);
  const [loadingCandidate, setLoadingCandidate] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Modals
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<Payment | null>(null);
  const [isReversalModalOpen, setIsReversalModalOpen] = useState(false);
  const [paymentToReverse, setPaymentToReverse] = useState<Payment | null>(null);
  const [reversalReason, setReversalReason] = useState('');

  // Payment form state
  const [payAmount, setPayAmount] = useState(0);
  const [payMode, setPayMode] = useState<'cash' | 'upi' | 'card' | 'bank_transfer' | 'online'>('upi');
  const [payRemarks, setPayRemarks] = useState('');
  const [payError, setPayError] = useState('');

  // Note form state
  const [newNoteText, setNewNoteText] = useState('');
  const [newFollowUpDate, setNewFollowUpDate] = useState('');

  const loadData = async () => {
    if (!id) return;
    setLoadingCandidate(true);
    setNotFound(false);

    // 1. Check local storage first
    let cand = db.getCandidateById(id);

    // 2. Direct Supabase Cloud fallback (incognito or new device)
    if (!cand && supabase) {
      try {
        const { data: cloudCand } = await supabase
          .from('candidates')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (cloudCand) {
          cand = cloudCand;
          const localCands = db.getCandidates(true);
          if (!localCands.some((c) => c.id === cloudCand.id)) {
            localCands.push(cloudCand);
            localStorage.setItem('gem_candidates', JSON.stringify(localCands));
          }
        }
      } catch (err) {
        console.warn('Direct cloud candidate fetch warning:', err);
      }
    }

    if (!cand) {
      setLoadingCandidate(false);
      setNotFound(true);
      return;
    }

    setCandidate(cand);

    // Enrollments
    let enrs = db.getEnrollments(id);
    if (enrs.length === 0 && supabase) {
      try {
        const { data: cloudEnrs } = await supabase
          .from('enrollments')
          .select('*')
          .eq('candidate_id', id);

        if (cloudEnrs && cloudEnrs.length > 0) {
          const localEnrs = db.getEnrollments();
          const toAdd = cloudEnrs.filter((ce: any) => !localEnrs.some((e) => e.id === ce.id));
          if (toAdd.length > 0) {
            localEnrs.push(...toAdd);
            localStorage.setItem('gem_enrollments', JSON.stringify(localEnrs));
          }
          enrs = db.getEnrollments(id);
        }
      } catch (err) {
        console.warn('Direct cloud enrollment fetch warning:', err);
      }
    }

    setEnrollments(enrs);
    const active = enrs.find((e) => e.status === 'active') || enrs[0] || null;
    setSelectedEnrollment(active);

    setAppointments(db.getAppointments({ candidateId: id }));
    setPayments(db.getPayments());
    setRtoRecord(db.getRTORecordByCandidateId(id) || null);
    setCandidateRTORecords(db.getRTORecordsByCandidateId(id));
    setNotes(db.getCandidateNotes(id));
    setLoadingCandidate(false);
  };

  useEffect(() => {
    loadData();
    const handleSync = () => loadData();
    window.addEventListener('storage', handleSync);
    window.addEventListener('drivedesk_sync_complete', handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('drivedesk_sync_complete', handleSync);
    };
  }, [id]);

  if (loadingCandidate) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center p-8 text-center">
        <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Loading candidate details...</p>
      </div>
    );
  }

  if (notFound || !candidate) {
    return (
      <div className="min-h-[300px] flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
        <AlertCircle className="w-10 h-10 text-amber-500" />
        <h3 className="text-base font-bold text-slate-900 dark:text-white">Candidate Not Found</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
          The candidate record could not be found in local records or Supabase Cloud.
        </p>
        <button
          onClick={() => navigate('/candidates')}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
        >
          Back to Candidates List
        </button>
      </div>
    );
  }

  const stats = selectedEnrollment ? db.calculateEnrollmentStats(selectedEnrollment.id) : null;
  const candidatePayments = payments.filter((p) => p.candidate_id === candidate.id);
  const candidateAppointments = appointments.filter((a) => a.candidate_id === candidate.id);

  // Status Change
  const handleStatusChange = (newStatus: CandidateStatus) => {
    db.updateCandidate(candidate.id, { status: newStatus }, role);
    setCandidate({ ...candidate, status: newStatus });
  };

  // Remove Candidate
  const handleDeleteCandidate = () => {
    if (!candidate) return;
    if (
      window.confirm(
        `Are you sure you want to permanently remove candidate "${candidate.full_name}" (${candidate.candidate_code})? This will delete their profile and clear their scheduled appointments.`
      )
    ) {
      db.deleteCandidate(candidate.id, role);
      navigate('/candidates');
    }
  };

  // Smart suggestion check: completed classes + licence received
  const shouldSuggestCompleted =
    candidate.status !== 'completed' &&
    Boolean(stats) &&
    stats?.classes_remaining === 0 &&
    rtoRecord?.stage === 'licence_received';

  // Record Payment
  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setPayError('');
    if (!selectedEnrollment) {
      setPayError('Please enroll this candidate in a training package before recording course payments.');
      return;
    }
    if (!stats) return;

    if (payAmount <= 0) {
      setPayError('Please enter a valid amount');
      return;
    }

    try {
      const p = db.recordPayment(
        {
          candidate_id: candidate.id,
          enrollment_id: selectedEnrollment.id,
          amount: Number(payAmount),
          payment_date: getTodayIST(),
          mode: payMode,
          remarks: payRemarks || 'Class fee installment',
        },
        role
      );
      loadData();
      setIsPayModalOpen(false);
      setSelectedReceipt(p);
      setIsReceiptModalOpen(true);
    } catch (err: any) {
      setPayError(err?.message || 'Error recording payment');
    }
  };

  // Reverse Payment
  const handleReversePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentToReverse) return;
    if (!reversalReason.trim()) return;

    try {
      db.reversePayment(paymentToReverse.id, reversalReason.trim(), role);
      loadData();
      setIsReversalModalOpen(false);
      setPaymentToReverse(null);
      setReversalReason('');
    } catch (err: any) {
      alert(err?.message || 'Error reversing payment');
    }
  };

  // Add Note
  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;
    db.addCandidateNote(
      {
        candidate_id: candidate.id,
        note_text: newNoteText.trim(),
        follow_up_date: newFollowUpDate || null,
        is_done: false,
        created_by: role === 'admin' ? 'Admin' : 'Staff',
      },
      role
    );
    setNewNoteText('');
    setNewFollowUpDate('');
    loadData();
  };

  // WhatsApp reminder message
  const reminderMessage = `Dear ${candidate.full_name}, greetings from ${db.getSettings().school_name}! Your pending balance is ${formatINR(
    stats?.balance || 0
  )}. Kindly clear the dues before your next driving class. Thank you!`;

  return (
    <div className="space-y-6">
      {/* Top Navigation Back */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/candidates')}
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <span className="text-xs font-semibold text-slate-400">Back to Candidates</span>
      </div>

      {/* Auto-suggest completion banner */}
      {shouldSuggestCompleted && selectedEnrollment && (
        <div className="p-4 rounded-2xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 flex items-center justify-between gap-4 animate-fade-in">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0" />
            <div>
              <div className="font-bold text-sm text-teal-900 dark:text-teal-200">
                Course & Licence Completed!
              </div>
              <p className="text-xs text-teal-700 dark:text-teal-400">
                {candidate.full_name} has attended all {selectedEnrollment.total_classes} classes and received their driving licence. Suggest updating candidate status to Completed.
              </p>
            </div>
          </div>
          <button
            onClick={() => handleStatusChange('completed')}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs shrink-0 cursor-pointer"
          >
            Mark as Completed
          </button>
        </div>
      )}

      {/* SUMMARY HEADER CARD */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-600 to-teal-400 text-white flex items-center justify-center font-bold text-xl shadow-md shadow-teal-500/20 shrink-0">
              {candidate.full_name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl font-black text-slate-900 dark:text-white">
                  {candidate.full_name}
                </h1>
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-800">
                  {candidate.candidate_code}
                </span>
                <Badge variant={getStatusBadgeVariant(candidate.status)}>
                  {candidate.status}
                </Badge>
              </div>

              <div className="flex items-center gap-4 mt-2 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                <a
                  href={getTelUrl(candidate.mobile)}
                  className="flex items-center gap-1.5 hover:text-teal-600 font-mono"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>{formatPhone(candidate.mobile)}</span>
                </a>
                <span>• Joined: {formatDate(candidate.joining_date)}</span>
                {candidate.ll_number && (
                  <span>• LL: <strong className="font-mono text-slate-700 dark:text-slate-300">{candidate.ll_number}</strong></span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <a
              href={getWhatsAppUrl(candidate.mobile, reminderMessage)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 transition"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
              <span>WhatsApp</span>
            </a>

            {isAdmin && selectedEnrollment && (
              <button
                onClick={() => {
                  setPayAmount(stats?.balance || 0);
                  setIsPayModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-teal-600 hover:bg-teal-700 text-white shadow-xs transition cursor-pointer"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Record Payment</span>
              </button>
            )}

            <button
              onClick={() => navigate(`/appointments?action=book&candidateId=${candidate.id}`)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-800 hover:bg-slate-700 text-white dark:bg-slate-700 dark:hover:bg-slate-600 shadow-xs transition cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Book Class</span>
            </button>

            <button
              onClick={handleDeleteCandidate}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition cursor-pointer"
              title="Remove Candidate"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Remove</span>
            </button>
          </div>
        </div>

        {/* Stats Strip */}
        <div className={`grid grid-cols-2 ${isAdmin ? 'sm:grid-cols-4' : 'sm:grid-cols-2'} gap-4 pt-4 border-t border-slate-100 dark:border-slate-800`}>
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Package Enrolled
            </span>
            <div className="text-sm font-extrabold text-slate-900 dark:text-white mt-1 truncate">
              {selectedEnrollment?.package_name || 'No Course Enrolled'}
            </div>
            <span className="text-[11px] text-teal-600 font-semibold">
              {selectedEnrollment?.vehicle_type ? `${selectedEnrollment.vehicle_type.toUpperCase()} Training` : 'Pending Enrollment'}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Classes Progress
            </span>
            <div className="text-sm font-extrabold text-slate-900 dark:text-white mt-1">
              {stats?.classes_completed || 0} / {selectedEnrollment?.total_classes || 0} Completed
            </div>
            <span className="text-[11px] text-slate-500">
              {stats?.classes_remaining || 0} classes remaining
            </span>
          </div>

          {isAdmin && (
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Fees & Paid
              </span>
              <div className="text-sm font-extrabold text-slate-900 dark:text-white mt-1">
                {formatINR(stats?.amount_paid || 0)} <span className="text-slate-400 text-xs font-normal">of {formatINR(stats?.net_fee || 0)}</span>
              </div>
              <span className="text-[11px] text-slate-500">
                Discount: {formatINR(selectedEnrollment?.discount_amount || 0)}
              </span>
            </div>
          )}

          {isAdmin && (
            <div className={`p-3.5 rounded-2xl ${
              (stats?.balance || 0) > 0
                ? 'bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/40'
                : 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-900/40'
            }`}>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Balance Pending
              </span>
              <div className={`text-base font-black mt-1 ${
                (stats?.balance || 0) > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-emerald-700 dark:text-emerald-400'
              }`}>
                {formatINR(stats?.balance || 0)}
              </div>
              <span className="text-[11px] font-semibold text-slate-500">
                {(stats?.balance || 0) > 0 ? 'Payment due' : 'Fully Cleared'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'overview'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('classes')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'classes'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Classes ({candidateAppointments.length})</span>
        </button>

        {isAdmin && (
          <button
            onClick={() => setActiveTab('payments')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'payments'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Payments ({candidatePayments.length})</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('rto')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'rto'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Driving Test / RTO</span>
        </button>

        <button
          onClick={() => setActiveTab('notes')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'notes'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Notes & Follow-ups ({notes.length})</span>
        </button>
      </div>

      {/* TAB CONTENT: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
              Personal & Contact Information
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Candidate ID</span>
                <span className="font-mono font-bold">{candidate.candidate_code}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Primary Mobile</span>
                <span className="font-mono">{formatPhone(candidate.mobile)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Alt Mobile</span>
                <span className="font-mono">{candidate.alt_mobile ? formatPhone(candidate.alt_mobile) : '-'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Date of Birth</span>
                <span>{candidate.date_of_birth ? formatDate(candidate.date_of_birth) : '-'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Address</span>
                <span className="text-right max-w-xs">{candidate.address || '-'}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Candidate Status</span>
                <select
                  value={candidate.status}
                  onChange={(e) => handleStatusChange(e.target.value as any)}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                >
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="hold">Hold</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
              Active Enrollment & Package
            </h3>
            {selectedEnrollment ? (
              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Package Name</span>
                  <span className="font-bold">{selectedEnrollment.package_name}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Course Start Date</span>
                  <span>{formatDate(selectedEnrollment.start_date)}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Course Expiry Date</span>
                  <span>{selectedEnrollment.expiry_date ? formatDate(selectedEnrollment.expiry_date) : 'No expiry'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Total Classes Booked</span>
                  <span className="font-mono">{selectedEnrollment.total_classes}</span>
                </div>
                {isAdmin && (
                  <>
                    <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500">Base Fee</span>
                      <span className="font-mono">{formatINR(selectedEnrollment.total_fee)}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500">Discount Concession</span>
                      <span className="font-mono text-emerald-600">-{formatINR(selectedEnrollment.discount_amount)}</span>
                    </div>
                    <div className="flex justify-between py-1.5 font-bold">
                      <span className="text-slate-900 dark:text-white">Net Course Fee</span>
                      <span className="font-mono text-teal-600">{formatINR(stats?.net_fee || 0)}</span>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="text-center py-6 text-slate-400 space-y-2">
                <p className="text-xs">No active driving course package enrolled yet.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: CLASSES */}
      {activeTab === 'classes' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-4 text-xs font-semibold">
              <span className="text-emerald-600">Completed: {stats?.classes_completed}</span>
              <span className="text-rose-600">Absent: {stats?.classes_absent}</span>
              <span className="text-teal-600 font-bold">Remaining: {stats?.classes_remaining}</span>
            </div>
            <button
              onClick={() => navigate(`/appointments?action=book&candidateId=${candidate.id}`)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-teal-600 hover:bg-teal-700 text-white shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Book Class</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 text-slate-500 font-semibold">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Time Slot</th>
                  <th className="py-3 px-4">Instructor</th>
                  <th className="py-3 px-4">Vehicle</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {candidateAppointments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-400">
                      No driving classes booked yet.
                    </td>
                  </tr>
                ) : (
                  candidateAppointments.map((app) => {
                    const inst = db.getInstructorById(app.instructor_id);
                    const veh = db.getVehicleById(app.vehicle_id);
                    return (
                      <tr key={app.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                        <td className="py-2.5 px-4 font-mono font-bold whitespace-nowrap">
                          {formatDate(app.appointment_date)}
                        </td>
                        <td className="py-2.5 px-4 font-mono whitespace-nowrap">
                          {formatTime12(app.start_time)} - {formatTime12(app.end_time)}
                        </td>
                        <td className="py-2.5 px-4 font-medium text-slate-800 dark:text-slate-200">
                          {inst?.name || 'Assigned Instructor'}
                        </td>
                        <td className="py-2.5 px-4 font-mono text-[11px] text-slate-500">
                          {veh?.registration_number || 'Vehicle'}
                        </td>
                        <td className="py-2.5 px-4">
                          <Badge variant={getStatusBadgeVariant(app.status)} size="sm">
                            {app.status}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-4 text-slate-500">
                          {app.remarks || '-'}
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

      {/* TAB CONTENT: PAYMENTS (Admin Only) */}
      {isAdmin && activeTab === 'payments' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="text-xs">
              <span className="text-slate-400">Total Collected:</span>{' '}
              <strong className="text-sm font-black text-slate-900 dark:text-white font-mono">
                {formatINR(stats?.amount_paid)}
              </strong>
            </div>
            <button
              onClick={() => {
                setPayAmount(stats?.balance || 0);
                setIsPayModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-teal-600 hover:bg-teal-700 text-white shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record Payment</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 text-slate-500 font-semibold">
                <tr>
                  <th className="py-3 px-4">Receipt #</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Mode</th>
                  <th className="py-3 px-4">Remarks</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {candidatePayments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-400">
                      No payments recorded yet.
                    </td>
                  </tr>
                ) : (
                  candidatePayments.map((p) => (
                    <tr
                      key={p.id}
                      className={`hover:bg-slate-50/60 dark:hover:bg-slate-800/30 ${
                        p.is_reversal ? 'bg-rose-50/30 dark:bg-rose-950/20 text-rose-700' : ''
                      }`}
                    >
                      <td className="py-2.5 px-4 font-mono font-bold whitespace-nowrap">
                        {p.receipt_number}
                        {p.is_reversal && (
                          <span className="ml-1 text-[10px] px-1.5 py-0.2 bg-rose-100 text-rose-700 rounded font-bold">
                            REVERSAL
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 font-mono whitespace-nowrap">
                        {formatDate(p.payment_date)}
                      </td>
                      <td className={`py-2.5 px-4 font-mono font-bold ${
                        p.is_reversal ? 'text-rose-600' : 'text-emerald-600'
                      }`}>
                        {p.is_reversal ? `-${formatINR(p.amount)}` : formatINR(p.amount)}
                      </td>
                      <td className="py-2.5 px-4 uppercase font-semibold text-slate-600 dark:text-slate-400">
                        {p.mode}
                      </td>
                      <td className="py-2.5 px-4 text-slate-500">
                        {p.remarks || (p.reversal_reason ? `Reason: ${p.reversal_reason}` : '-')}
                      </td>
                      <td className="py-2.5 px-4 text-right space-x-2 whitespace-nowrap">
                        <button
                          onClick={() => {
                            setSelectedReceipt(p);
                            setIsReceiptModalOpen(true);
                          }}
                          className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 transition"
                        >
                          View Receipt
                        </button>
                        {isAdmin && !p.is_reversal && (
                          <button
                            onClick={() => {
                              setPaymentToReverse(p);
                              setIsReversalModalOpen(true);
                            }}
                            className="px-2 py-1 text-[10px] font-bold rounded-lg border border-rose-200 dark:border-rose-900 text-rose-600 hover:bg-rose-50"
                          >
                            Reverse
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: RTO TRACKING & DRIVING TEST ENTRIES */}
      {activeTab === 'rto' && (
        <div className="space-y-4 max-w-2xl">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
              RTO & Driving Test Entries ({candidateRTORecords.length})
            </h3>
            <button
              onClick={() => navigate('/driving-tests')}
              className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Manage in Pipeline</span>
            </button>
          </div>

          {candidateRTORecords.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
              No driving test entries recorded for this student yet. Click "Manage in Pipeline" to schedule a test.
            </div>
          ) : (
            candidateRTORecords.map((rec, index) => (
              <div
                key={rec.id}
                className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs"
              >
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      {rec.test_type || `Test Entry #${index + 1}`}
                    </span>
                    <Badge variant={getStatusBadgeVariant(rec.stage)}>
                      {rec.stage.replace('_', ' ')}
                    </Badge>
                  </div>
                  <Badge
                    variant={
                      rec.test_result === 'pass'
                        ? 'green'
                        : rec.test_result === 'fail'
                        ? 'red'
                        : 'yellow'
                    }
                  >
                    {rec.test_result ? rec.test_result.toUpperCase() : 'PENDING'}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block">Test Date & Time</span>
                    <strong className="text-slate-700 dark:text-slate-300 font-mono">
                      {rec.test_date ? `${formatDate(rec.test_date)} at ${formatTime12(rec.test_time || '10:00')}` : 'Not scheduled'}
                    </strong>
                  </div>

                  <div>
                    <span className="text-slate-400 block">RTO Office</span>
                    <span className="text-slate-700 dark:text-slate-300">
                      {rec.rto_office || 'Indiranagar RTO'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block">Learner Licence (LL) #</span>
                    <strong className="font-mono text-slate-700 dark:text-slate-300">
                      {rec.ll_number || candidate.ll_number || 'Not registered'}
                    </strong>
                  </div>

                  <div>
                    <span className="text-slate-400 block">Driving Licence (DL) #</span>
                    <strong className="font-mono text-teal-600">
                      {rec.licence_number || 'In progress'}
                    </strong>
                  </div>
                </div>

                {rec.remarks && (
                  <p className="text-xs text-slate-500 pt-1 border-t border-slate-50 dark:border-slate-800/60">
                    Note: {rec.remarks}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB CONTENT: NOTES & FOLLOW-UPS */}
      {activeTab === 'notes' && (
        <div className="space-y-4 max-w-2xl">
          <form onSubmit={handleAddNote} className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Add Follow-up Note
            </h4>
            <textarea
              rows={2}
              required
              value={newNoteText}
              onChange={(e) => setNewNoteText(e.target.value)}
              placeholder="e.g. Call student after 5 PM regarding pending fee or RTO documents"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            />
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Follow-up Date:</span>
                <input
                  type="date"
                  value={newFollowUpDate}
                  onChange={(e) => setNewFollowUpDate(e.target.value)}
                  className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold rounded-xl bg-teal-600 hover:bg-teal-700 text-white shadow-xs"
              >
                Add Note
              </button>
            </div>
          </form>

          <div className="space-y-2">
            {notes.map((note) => (
              <div
                key={note.id}
                className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-start justify-between gap-3"
              >
                <div>
                  <p className="text-xs text-slate-800 dark:text-slate-200 font-medium">
                    {note.note_text}
                  </p>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1.5">
                    <span>Added: {formatDateTime(note.created_at)}</span>
                    {note.follow_up_date && (
                      <span className="text-teal-600 font-semibold">
                        Follow-up: {formatDate(note.follow_up_date)}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => {
                    db.toggleNoteDone(note.id);
                    loadData();
                  }}
                  className={`px-2 py-1 rounded text-[10px] font-bold ${
                    note.is_done
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
                  }`}
                >
                  {note.is_done ? 'Done' : 'Mark Done'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* RECORD PAYMENT MODAL */}
      <Modal
        isOpen={isPayModalOpen}
        onClose={() => setIsPayModalOpen(false)}
        title="Record Fee Payment"
        description={`Record installment for ${candidate.full_name} (${selectedEnrollment?.package_name || 'Driving Course'})`}
      >
        <form onSubmit={handleRecordPayment} className="space-y-4">
          {payError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl">
              {payError}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Payment Amount (₹) *
            </label>
            <input
              type="number"
              min={1}
              required
              value={payAmount || ''}
              onChange={(e) => setPayAmount(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 text-base font-extrabold font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            />
            <span className="text-xs text-slate-400">
              Current Outstanding Balance: {formatINR(stats?.balance || 0)}
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Payment Mode *
            </label>
            <select
              value={payMode}
              onChange={(e) => setPayMode(e.target.value as any)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
            >
              <option value="upi">UPI (GPay / PhonePe / QR)</option>
              <option value="cash">Cash</option>
              <option value="card">Debit / Credit Card</option>
              <option value="bank_transfer">Bank Transfer (NEFT/IMPS)</option>
              <option value="online">Online</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Remarks
            </label>
            <input
              type="text"
              value={payRemarks}
              onChange={(e) => setPayRemarks(e.target.value)}
              placeholder="e.g. 2nd Installment payment"
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsPayModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold rounded-xl bg-teal-600 hover:bg-teal-700 text-white shadow-xs"
            >
              Confirm & Generate Receipt
            </button>
          </div>
        </form>
      </Modal>

      {/* PRINTABLE RECEIPT MODAL */}
      <Modal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        title="Official Payment Receipt"
        maxWidth="lg"
      >
        {selectedReceipt && (
          <div className="space-y-6">
            <div
              id="printable-receipt-card"
              className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4 printable-receipt"
            >
              <div className="text-center pb-4 border-b border-slate-200 dark:border-slate-800">
                <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
                  {db.getSettings().school_name}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {db.getSettings().address}
                </p>
                <p className="text-xs text-slate-500">
                  Phone: {db.getSettings().phone} {db.getSettings().gst_number ? `• GST: ${db.getSettings().gst_number}` : ''}
                </p>
              </div>

              <div className="flex justify-between items-center text-xs">
                <div>
                  <span className="text-slate-400">Receipt No: </span>
                  <strong className="font-mono text-teal-600">{selectedReceipt.receipt_number}</strong>
                </div>
                <div>
                  <span className="text-slate-400">Date: </span>
                  <strong className="font-mono">{formatDate(selectedReceipt.payment_date)}</strong>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Student Name:</span>
                  <strong className="text-slate-900 dark:text-white">{candidate.full_name}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Candidate ID:</span>
                  <span className="font-mono">{candidate.candidate_code}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Course / Package:</span>
                  <span>{selectedEnrollment?.package_name || 'Driving Course'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Payment Mode:</span>
                  <span className="uppercase font-semibold">{selectedReceipt.mode}</span>
                </div>
              </div>

              <div className="py-2 flex justify-between items-center border-y border-slate-200 dark:border-slate-800">
                <span className="font-bold text-sm text-slate-900 dark:text-white">Amount Received:</span>
                <span className="text-xl font-black font-mono text-emerald-600">
                  {formatINR(selectedReceipt.amount)}
                </span>
              </div>

              <div className="flex justify-between text-xs text-slate-500">
                <span>Remaining Course Balance:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {formatINR(stats?.balance || 0)}
                </span>
              </div>

              <div className="pt-3 text-[10px] text-center text-slate-400 border-t border-slate-100 dark:border-slate-800">
                {db.getSettings().receipt_footer_text}
              </div>
            </div>

            <div className="flex justify-between items-center no-print">
              <a
                href={getWhatsAppUrl(
                  candidate.mobile,
                  `Receipt from ${db.getSettings().school_name}: Received payment of ${formatINR(
                    selectedReceipt.amount
                  )} (Receipt ${selectedReceipt.receipt_number}) on ${formatDate(
                    selectedReceipt.payment_date
                  )}. Balance: ${formatINR(stats?.balance || 0)}.`
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 text-xs font-bold rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
              >
                Share on WhatsApp
              </a>

              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-teal-600 text-white hover:bg-teal-700"
              >
                <Download className="w-4 h-4" />
                <span>Print / Save PDF</span>
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* REVERSAL MODAL (ADMIN ONLY) */}
      <Modal
        isOpen={isReversalModalOpen}
        onClose={() => setIsReversalModalOpen(false)}
        title="Payment Reversal Entry (Correction)"
        maxWidth="md"
      >
        {paymentToReverse && (
          <form onSubmit={handleReversePayment} className="space-y-4">
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl">
              <strong>Audit Safety:</strong> Payments are never deleted. Creating a reversal will record an opposite (-{formatINR(paymentToReverse.amount)}) entry with your reason, keeping both in the audit log.
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Reason for Reversal *
              </label>
              <textarea
                rows={3}
                required
                value={reversalReason}
                onChange={(e) => setReversalReason(e.target.value)}
                placeholder="e.g. Mistakenly entered ₹8,000 instead of ₹5,000 / Wrong candidate selected"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setIsReversalModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
              >
                Confirm Reversal Entry
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
