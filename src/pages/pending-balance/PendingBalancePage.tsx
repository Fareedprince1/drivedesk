import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  CreditCard,
  MessageSquare,
  Phone,
  Search,
  Filter,
  ArrowUpDown,
  FileText,
  Calendar,
  Clock,
  ChevronRight,
  TrendingDown,
} from 'lucide-react';
import { db } from '../../lib/storage';
import { formatINR, formatDate, formatTime12, formatPhone, getWhatsAppUrl, getTelUrl } from '../../lib/formatters';
import { Modal } from '../../components/common/Modal';
import { useAuth } from '../../context/AuthContext';

export const PendingBalancePage: React.FC = () => {
  const navigate = useNavigate();
  const { role } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [minAmountFilter, setMinAmountFilter] = useState<number>(0);
  const [sortBy, setSortBy] = useState<'balance' | 'name' | 'days'>('balance');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Follow-up Note Modal
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<any | null>(null);
  const [noteText, setNoteText] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');

  const pendingList = db.getPendingBalanceSummaryList();

  // Filtered and Sorted
  const filteredList = useMemo(() => {
    return pendingList
      .filter((item) => {
        const q = searchTerm.toLowerCase().trim();
        const matchesSearch =
          !q ||
          item.candidate.full_name.toLowerCase().includes(q) ||
          item.candidate.mobile.includes(q) ||
          item.candidate.candidate_code.toLowerCase().includes(q);

        const matchesMin = item.balance >= minAmountFilter;
        return matchesSearch && matchesMin;
      })
      .sort((a, b) => {
        let valA: any = a.balance;
        let valB: any = b.balance;

        if (sortBy === 'name') {
          valA = a.candidate.full_name.toLowerCase();
          valB = b.candidate.full_name.toLowerCase();
        } else if (sortBy === 'days') {
          valA = a.days_since_joining;
          valB = b.days_since_joining;
        }

        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [pendingList, searchTerm, minAmountFilter, sortBy, sortOrder]);

  const totalPendingAmount = filteredList.reduce((sum, item) => sum + item.balance, 0);

  const handleOpenNoteModal = (cand: any) => {
    setSelectedCandidate(cand);
    setNoteText(`Follow-up for pending fee balance of ${formatINR(cand.stats?.balance || 0)}`);
    setFollowUpDate(new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0]);
    setIsNoteModalOpen(true);
  };

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCandidate || !noteText.trim()) return;

    db.addCandidateNote(
      {
        candidate_id: selectedCandidate.id,
        note_text: noteText.trim(),
        follow_up_date: followUpDate || null,
        is_done: false,
        created_by: role === 'admin' ? 'Admin' : 'Staff',
      },
      role
    );

    setIsNoteModalOpen(false);
    setSelectedCandidate(null);
    setNoteText('');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Pending Balance Recovery
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Monitor outstanding student fees, track next class dates, and send instant 1-tap WhatsApp reminders
        </p>
      </div>

      {/* Total Pending Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-100 text-xs font-bold uppercase tracking-wider">
            <AlertCircle className="w-4 h-4" />
            <span>Total Outstanding Dues</span>
          </div>
          <div className="text-3xl sm:text-4xl font-black font-mono mt-1">
            {formatINR(totalPendingAmount)}
          </div>
          <p className="text-xs text-amber-100 mt-1">
            Due across {filteredList.length} enrolled candidates
          </p>
        </div>

        <div className="text-xs bg-amber-600/60 p-3.5 rounded-2xl border border-amber-400/40 max-w-sm">
          💡 <strong>Tip:</strong> Send WhatsApp reminders 1 day prior to their next scheduled driving lesson to maximize collection rates.
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search candidate name, mobile, DS0001..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Min Balance:</span>
            <select
              value={minAmountFilter}
              onChange={(e) => setMinAmountFilter(Number(e.target.value))}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold"
            >
              <option value={0}>All Balances (&gt; ₹0)</option>
              <option value={2000}>≥ ₹2,000</option>
              <option value={4000}>≥ ₹4,000</option>
              <option value={6000}>≥ ₹6,000</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 text-slate-500 font-semibold select-none">
              <tr>
                <th className="py-3 px-4">Candidate</th>
                <th className="py-3 px-4">Mobile</th>
                <th className="py-3 px-4">Course Package</th>
                <th className="py-3 px-4">Total Fee</th>
                <th className="py-3 px-4">Paid</th>
                <th className="py-3 px-4">Balance Pending</th>
                <th className="py-3 px-4">Last Payment</th>
                <th className="py-3 px-4">Next Class</th>
                <th className="py-3 px-4">Days Since Joining</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-12 text-slate-400">
                    No candidates have pending fee balances. Great work!
                  </td>
                </tr>
              ) : (
                filteredList.map((item) => {
                  const cand = item.candidate;
                  const waMessage = `Dear ${cand.full_name}, your pending driving-school balance is ${formatINR(
                    item.balance
                  )}. Kindly make the payment before your next scheduled class.`;

                  return (
                    <tr
                      key={cand.id}
                      onClick={() => navigate(`/candidates/${cand.id}`)}
                      className="hover:bg-amber-50/40 dark:hover:bg-slate-800/40 transition cursor-pointer group"
                    >
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {cand.full_name}
                        </div>
                        <span className="font-mono text-[10px] text-teal-700 dark:text-teal-400 font-bold">
                          {cand.candidate_code}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {formatPhone(cand.mobile)}
                      </td>

                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                        {item.activeEnrollment.package_name}
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                        {formatINR(item.total_fee)}
                      </td>

                      <td className="py-3 px-4 font-mono text-emerald-600 whitespace-nowrap">
                        {formatINR(item.amount_paid)}
                      </td>

                      <td className="py-3 px-4 font-mono font-black text-sm text-rose-600 whitespace-nowrap">
                        {formatINR(item.balance)}
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                        {item.last_payment_date ? formatDate(item.last_payment_date) : 'No payment yet'}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        {item.next_class_date ? (
                          <div className="font-mono text-teal-700 dark:text-teal-400 font-bold">
                            {formatDate(item.next_class_date)} ({formatTime12(item.next_class_time)})
                          </div>
                        ) : (
                          <span className="text-slate-400">None booked</span>
                        )}
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                        {item.days_since_joining} days ago
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {/* 1-tap WhatsApp Reminder with exact requested prefilled text */}
                          <a
                            href={getWhatsAppUrl(cand.mobile, waMessage)}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Send WhatsApp Payment Reminder"
                            className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                            <span>WhatsApp</span>
                          </a>

                          {/* Record Payment */}
                          <button
                            onClick={() => navigate(`/payments?action=record&candidateId=${cand.id}`)}
                            title="Record Payment"
                            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-teal-50 hover:text-teal-700"
                          >
                            <CreditCard className="w-4 h-4" />
                          </button>

                          {/* Call */}
                          <a
                            href={getTelUrl(cand.mobile)}
                            title="Call Candidate"
                            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                          >
                            <Phone className="w-4 h-4" />
                          </a>

                          {/* Add Note */}
                          <button
                            onClick={() => handleOpenNoteModal(cand)}
                            title="Add Follow-up Note"
                            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                          >
                            <FileText className="w-4 h-4" />
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

      {/* ADD FOLLOW-UP NOTE MODAL */}
      <Modal
        isOpen={isNoteModalOpen}
        onClose={() => setIsNoteModalOpen(false)}
        title="Add Recovery Follow-up Note"
        maxWidth="md"
      >
        {selectedCandidate && (
          <form onSubmit={handleSaveNote} className="space-y-4">
            <div className="text-xs text-slate-500">
              Candidate: <strong className="text-slate-900 dark:text-white">{selectedCandidate.full_name}</strong> ({selectedCandidate.candidate_code})
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Note Details *
              </label>
              <textarea
                rows={3}
                required
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Follow-up Date
              </label>
              <input
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsNoteModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold rounded-xl bg-teal-600 hover:bg-teal-700 text-white shadow-xs"
              >
                Save Note
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
