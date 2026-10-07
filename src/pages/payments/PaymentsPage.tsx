import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  CreditCard,
  Plus,
  Search,
  Filter,
  Download,
  Printer,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  FileText,
  DollarSign,
  Calendar,
  MessageSquare,
} from 'lucide-react';
import { db } from '../../lib/storage';
import type { Payment, Candidate } from '../../types';
import {
  formatINR,
  formatDate,
  getTodayIST,
  getWhatsAppUrl,
} from '../../lib/formatters';
import { Modal } from '../../components/common/Modal';
import { useAuth } from '../../context/AuthContext';

export const PaymentsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { role, isAdmin } = useAuth();

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState(() => searchParams.get('search') || '');
  const [filterMode, setFilterMode] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Record Payment Modal
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(() => searchParams.get('action') === 'record');
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>('');
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMode, setPayMode] = useState<'cash' | 'upi' | 'card' | 'bank_transfer' | 'online'>('upi');
  const [payDate, setPayDate] = useState<string>(getTodayIST());
  const [payRemarks, setPayRemarks] = useState('');
  const [recordError, setRecordError] = useState('');

  // Receipt Modal
  const [selectedReceipt, setSelectedReceipt] = useState<Payment | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  // Reversal Modal
  const [paymentToReverse, setPaymentToReverse] = useState<Payment | null>(null);
  const [isReversalModalOpen, setIsReversalModalOpen] = useState(false);
  const [reversalReason, setReversalReason] = useState('');

  const candidates = db.getCandidatesWithStats();
  const payments = db.getPayments();
  const settings = db.getSettings();

  // Pick Candidate in Payment modal updates the pre-filled amount to their balance
  const handleCandidateChange = (candId: string) => {
    setSelectedCandidateId(candId);
    const cand = candidates.find((c) => c.id === candId);
    if (cand?.stats) {
      setPayAmount(cand.stats.balance > 0 ? cand.stats.balance : 0);
    }
  };

  // Filtered Payments
  const filteredPayments = useMemo(() => {
    return payments
      .filter((p) => {
        const cand = candidates.find((c) => c.id === p.candidate_id);
        const q = searchTerm.toLowerCase().trim();

        // Search by receipt # or candidate name or mobile
        const matchesSearch =
          !q ||
          p.receipt_number.toLowerCase().includes(q) ||
          (cand && cand.full_name.toLowerCase().includes(q)) ||
          (cand && cand.mobile.includes(q)) ||
          (cand && cand.candidate_code.toLowerCase().includes(q)) ||
          (p.remarks && p.remarks.toLowerCase().includes(q));

        // Mode filter
        const matchesMode = filterMode === 'all' || p.mode === filterMode;

        // Date range
        const matchesStart = !startDate || p.payment_date >= startDate;
        const matchesEnd = !endDate || p.payment_date <= endDate;

        return matchesSearch && matchesMode && matchesStart && matchesEnd;
      })
      .sort((a, b) => b.payment_date.localeCompare(a.payment_date) || b.created_at.localeCompare(a.created_at));
  }, [payments, candidates, searchTerm, filterMode, startDate, endDate]);

  // Aggregate Totals
  const totalCollections = filteredPayments.reduce((sum, p) => (p.is_reversal ? sum - p.amount : sum + p.amount), 0);
  const totalRegular = filteredPayments.filter((p) => !p.is_reversal).reduce((sum, p) => sum + p.amount, 0);
  const totalReversals = filteredPayments.filter((p) => p.is_reversal).reduce((sum, p) => sum + p.amount, 0);

  // Submit Payment
  const handleRecordPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRecordError('');

    if (!selectedCandidateId) {
      setRecordError('Please choose a candidate');
      return;
    }

    const cand = candidates.find((c) => c.id === selectedCandidateId);
    if (!cand || !cand.active_enrollment) {
      setRecordError('Candidate has no active enrollment');
      return;
    }

    if (payAmount <= 0) {
      setRecordError('Payment amount must be greater than zero');
      return;
    }

    try {
      const newPay = db.recordPayment(
        {
          candidate_id: selectedCandidateId,
          enrollment_id: cand.active_enrollment.id,
          amount: Number(payAmount),
          payment_date: payDate,
          mode: payMode,
          remarks: payRemarks.trim() || undefined,
        },
        role
      );

      setIsRecordModalOpen(false);
      setSearchParams({});
      setSelectedReceipt(newPay);
      setIsReceiptModalOpen(true);
    } catch (err: any) {
      setRecordError(err?.message || 'Error recording payment');
    }
  };

  // Submit Reversal
  const handleReversalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentToReverse) return;
    if (!reversalReason.trim()) return;

    try {
      db.reversePayment(paymentToReverse.id, reversalReason.trim(), role);
      setIsReversalModalOpen(false);
      setPaymentToReverse(null);
      setReversalReason('');
    } catch (err: any) {
      alert(err?.message || 'Error processing reversal');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Payments & Collections
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Official fee receipts, payment ledger, and audit-safe reversal corrections
          </p>
        </div>

        <button
          onClick={() => {
            setSelectedCandidateId('');
            setPayAmount(0);
            setIsRecordModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-600/20 transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Record Payment</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
            Net Collection (Filtered)
          </span>
          <div className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-1">
            {formatINR(totalCollections)}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            Across {filteredPayments.length} entries
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
            Gross Payments
          </span>
          <div className="text-2xl font-black font-mono text-slate-900 dark:text-white mt-1">
            {formatINR(totalRegular)}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            Direct student fee collections
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
            Reversals / Corrections
          </span>
          <div className="text-2xl font-black font-mono text-rose-600 dark:text-rose-400 mt-1">
            -{formatINR(totalReversals)}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            Corrected mistake entries
          </span>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Receipt # (R-1001), candidate name, or mobile..."
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          {/* Mode */}
          <div>
            <select
              value={filterMode}
              onChange={(e) => setFilterMode(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium"
            >
              <option value="all">All Payment Modes</option>
              <option value="upi">UPI (GPay / PhonePe)</option>
              <option value="cash">Cash</option>
              <option value="card">Debit / Credit Card</option>
              <option value="bank_transfer">Bank Transfer (NEFT/IMPS)</option>
              <option value="online">Online</option>
            </select>
          </div>

          {/* Date Filter */}
          <div className="flex items-center gap-1.5">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-2 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
            />
            <span className="text-xs text-slate-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-2 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
            />
          </div>
        </div>
      </div>

      {/* Payments Table & Mobile Cards */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 text-slate-500 font-semibold select-none">
              <tr>
                <th className="py-3 px-4">Receipt #</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Candidate</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Payment Mode</th>
                <th className="py-3 px-4">Remarks</th>
                <th className="py-3 px-4 text-right">Receipt & Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    No payment records found.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => {
                  const cand = candidates.find((c) => c.id === p.candidate_id);
                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-slate-50/60 dark:hover:bg-slate-800/30 ${
                        p.is_reversal ? 'bg-rose-50/30 dark:bg-rose-950/20 text-rose-700' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-mono font-bold whitespace-nowrap">
                        <span className="text-teal-700 dark:text-teal-400">{p.receipt_number}</span>
                        {p.is_reversal && (
                          <span className="ml-1.5 text-[9px] px-1.5 py-0.5 rounded font-bold bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                            REVERSAL
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono whitespace-nowrap text-slate-600 dark:text-slate-300">
                        {formatDate(p.payment_date)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {cand?.full_name || 'Candidate'}
                        </div>
                        <div className="text-[11px] font-mono text-slate-400">
                          {cand?.candidate_code} • {cand?.mobile}
                        </div>
                      </td>
                      <td className={`py-3 px-4 font-mono font-black text-sm whitespace-nowrap ${
                        p.is_reversal ? 'text-rose-600' : 'text-emerald-600'
                      }`}>
                        {p.is_reversal ? `-${formatINR(p.amount)}` : formatINR(p.amount)}
                      </td>
                      <td className="py-3 px-4 uppercase font-bold text-[11px] text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {p.mode}
                      </td>
                      <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                        {p.remarks || (p.reversal_reason ? `Reason: ${p.reversal_reason}` : '-')}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap space-x-2">
                        <button
                          onClick={() => {
                            setSelectedReceipt(p);
                            setIsReceiptModalOpen(true);
                          }}
                          className="px-2.5 py-1 text-xs font-bold rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 transition"
                        >
                          Receipt
                        </button>
                        {isAdmin && !p.is_reversal && (
                          <button
                            onClick={() => {
                              setPaymentToReverse(p);
                              setIsReversalModalOpen(true);
                            }}
                            className="px-2 py-1 text-[11px] font-bold rounded-lg border border-rose-200 dark:border-rose-900 text-rose-600 hover:bg-rose-50"
                          >
                            Reverse
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Payments Cards View */}
        <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800">
          {filteredPayments.length === 0 ? (
            <div className="text-center py-12 px-4 text-slate-400">
              No payment records found.
            </div>
          ) : (
            filteredPayments.map((p) => {
              const cand = candidates.find((c) => c.id === p.candidate_id);
              return (
                <div
                  key={p.id}
                  className={`p-4 space-y-3 ${p.is_reversal ? 'bg-rose-50/30 dark:bg-rose-950/20' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-teal-700 dark:text-teal-400">
                          {p.receipt_number}
                        </span>
                        {p.is_reversal && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-700">
                            REVERSAL
                          </span>
                        )}
                      </div>
                      <div className="font-bold text-sm text-slate-900 dark:text-white mt-1">
                        {cand?.full_name || 'Candidate'}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {formatDate(p.payment_date)} • <span className="uppercase font-semibold">{p.mode}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className={`font-mono text-base font-black ${p.is_reversal ? 'text-rose-600' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {p.is_reversal ? `-${formatINR(p.amount)}` : formatINR(p.amount)}
                      </div>
                    </div>
                  </div>

                  {p.remarks && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-2 rounded-lg">
                      {p.remarks}
                    </p>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      onClick={() => {
                        setSelectedReceipt(p);
                        setIsReceiptModalOpen(true);
                      }}
                      className="px-3 py-1.5 text-xs font-bold rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 transition"
                    >
                      Receipt
                    </button>
                    {isAdmin && !p.is_reversal && (
                      <button
                        onClick={() => {
                          setPaymentToReverse(p);
                          setIsReversalModalOpen(true);
                        }}
                        className="px-2.5 py-1.5 text-xs font-bold rounded-xl border border-rose-200 dark:border-rose-900 text-rose-600 hover:bg-rose-50"
                      >
                        Reverse
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RECORD PAYMENT MODAL */}
      <Modal
        isOpen={isRecordModalOpen}
        onClose={() => {
          setIsRecordModalOpen(false);
          setSearchParams({});
        }}
        title="Record New Fee Payment"
        description="Enter fee installment details. A sequential receipt number will be issued."
        maxWidth="lg"
      >
        <form onSubmit={handleRecordPaymentSubmit} className="space-y-4">
          {recordError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl">
              {recordError}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Select Candidate *
            </label>
            <select
              required
              value={selectedCandidateId}
              onChange={(e) => handleCandidateChange(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
            >
              <option value="">-- Choose Candidate --</option>
              {candidates.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.candidate_code} — {c.full_name} (Due: {formatINR(c.stats?.balance)})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Amount Collected (₹) *
              </label>
              <input
                type="number"
                min={1}
                required
                value={payAmount || ''}
                onChange={(e) => setPayAmount(Number(e.target.value))}
                className="w-full px-3.5 py-2 text-base font-extrabold font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Payment Date *
              </label>
              <input
                type="date"
                required
                value={payDate}
                onChange={(e) => setPayDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Payment Mode *
            </label>
            <select
              value={payMode}
              onChange={(e) => setPayMode(e.target.value as any)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold"
            >
              <option value="upi">UPI (GPay / PhonePe / Paytm / QR)</option>
              <option value="cash">Cash</option>
              <option value="card">Debit / Credit Card</option>
              <option value="bank_transfer">Bank Transfer (NEFT/IMPS)</option>
              <option value="online">Online Payment</option>
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
              placeholder="e.g. 2nd Installment / Complete clearance"
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsRecordModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold rounded-xl bg-teal-600 hover:bg-teal-700 text-white shadow-xs"
            >
              Record & Generate Receipt
            </button>
          </div>
        </form>
      </Modal>

      {/* OFFICIAL RECEIPT MODAL */}
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
                  {settings.school_name}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {settings.address}
                </p>
                <p className="text-xs text-slate-500">
                  Phone: {settings.phone} {settings.gst_number ? `• GST: ${settings.gst_number}` : ''}
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

              {(() => {
                const cand = candidates.find((c) => c.id === selectedReceipt.candidate_id);
                return (
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Student Name:</span>
                      <strong className="text-slate-900 dark:text-white">{cand?.full_name}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Candidate ID:</span>
                      <span className="font-mono">{cand?.candidate_code}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Course / Package:</span>
                      <span>{cand?.active_enrollment?.package_name || 'Driving Course'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Payment Mode:</span>
                      <span className="uppercase font-semibold">{selectedReceipt.mode}</span>
                    </div>
                    {selectedReceipt.remarks && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Remarks:</span>
                        <span>{selectedReceipt.remarks}</span>
                      </div>
                    )}
                  </div>
                );
              })()}

              <div className="py-2 flex justify-between items-center border-y border-slate-200 dark:border-slate-800">
                <span className="font-bold text-sm text-slate-900 dark:text-white">
                  {selectedReceipt.is_reversal ? 'Reversal Amount:' : 'Amount Received:'}
                </span>
                <span className={`text-xl font-black font-mono ${
                  selectedReceipt.is_reversal ? 'text-rose-600' : 'text-emerald-600'
                }`}>
                  {formatINR(selectedReceipt.amount)}
                </span>
              </div>

              {(() => {
                const cand = candidates.find((c) => c.id === selectedReceipt.candidate_id);
                return (
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Remaining Balance:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      {formatINR(cand?.stats?.balance || 0)}
                    </span>
                  </div>
                );
              })()}

              <div className="pt-3 text-[10px] text-center text-slate-400 border-t border-slate-100 dark:border-slate-800">
                {settings.receipt_footer_text}
              </div>
            </div>

            <div className="flex justify-between items-center no-print">
              {(() => {
                const cand = candidates.find((c) => c.id === selectedReceipt.candidate_id);
                if (!cand) return null;
                return (
                  <a
                    href={getWhatsAppUrl(
                      cand.mobile,
                      `Official Receipt from ${settings.school_name}: Received payment of ${formatINR(
                        selectedReceipt.amount
                      )} (Receipt #${selectedReceipt.receipt_number}) on ${formatDate(
                        selectedReceipt.payment_date
                      )}. Remaining Balance: ${formatINR(cand.stats?.balance || 0)}.`
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Share on WhatsApp</span>
                  </a>
                );
              })()}

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
          <form onSubmit={handleReversalSubmit} className="space-y-4">
            <div className="p-3.5 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-xl space-y-1">
              <div className="font-bold">Permanent Audit Trail:</div>
              <p>
                In compliance with driving school financial accounting, payment records are never deleted. Creating a reversal will record an inverse (-{formatINR(paymentToReverse.amount)}) entry with receipt number <code className="font-mono">{paymentToReverse.receipt_number}-REV</code>, adjusting student balance back accurately.
              </p>
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
                placeholder="e.g. Receptionist mistakenly entered ₹8,000 instead of ₹5,000 / Wrong candidate selected"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
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
