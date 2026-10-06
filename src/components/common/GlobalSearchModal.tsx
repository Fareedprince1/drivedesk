import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, User, GraduationCap, Car, Receipt, ArrowRight, X } from 'lucide-react';
import { db } from '../../lib/storage';
import { formatINR } from '../../lib/formatters';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        // Toggle search
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.trim().toLowerCase();
  const allCandidates = db.getCandidates();
  const allInstructors = db.getInstructors();
  const allVehicles = db.getVehicles();
  const allPayments = db.getPayments();

  const matchingCandidates = q
    ? allCandidates.filter(
        (c) =>
          c.full_name.toLowerCase().includes(q) ||
          c.mobile.includes(q) ||
          c.candidate_code.toLowerCase().includes(q) ||
          (c.ll_number && c.ll_number.toLowerCase().includes(q))
      ).slice(0, 5)
    : [];

  const matchingInstructors = q
    ? allInstructors.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.mobile.includes(q) ||
          i.licence_number.toLowerCase().includes(q)
      ).slice(0, 3)
    : [];

  const matchingVehicles = q
    ? allVehicles.filter(
        (v) =>
          v.registration_number.toLowerCase().includes(q) ||
          v.model.toLowerCase().includes(q)
      ).slice(0, 3)
    : [];

  const matchingReceipts = q
    ? allPayments.filter(
        (p) =>
          p.receipt_number.toLowerCase().includes(q) ||
          (p.remarks && p.remarks.toLowerCase().includes(q))
      ).slice(0, 3)
    : [];

  const handleSelect = (url: string) => {
    onClose();
    navigate(url);
  };

  const hasResults =
    matchingCandidates.length > 0 ||
    matchingInstructors.length > 0 ||
    matchingVehicles.length > 0 ||
    matchingReceipts.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-10">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-100 dark:border-slate-800 gap-3">
          <Search className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by candidate name, mobile, DS0001 ID, instructor, vehicle, or receipt..."
            className="flex-1 bg-transparent border-none outline-none text-slate-900 dark:text-white placeholder-slate-400 text-sm font-medium"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 rounded">
            ESC
          </kbd>
        </div>

        {/* Results Area */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
          {!q && (
            <div className="text-center py-8 text-xs text-slate-400">
              Type at least 2 characters to search across all driving school records
            </div>
          )}

          {q && !hasResults && (
            <div className="text-center py-8 text-sm text-slate-400">
              No matching records found for "{query}"
            </div>
          )}

          {/* Candidates */}
          {matchingCandidates.length > 0 && (
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2 px-2 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-teal-600" />
                Candidates ({matchingCandidates.length})
              </div>
              <div className="space-y-1">
                {matchingCandidates.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => handleSelect(`/candidates/${c.id}`)}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                          {c.full_name}
                        </span>
                        <span className="text-xs font-mono font-semibold px-2 py-0.5 bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 rounded-md">
                          {c.candidate_code}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        📞 {c.mobile} {c.address ? `• ${c.address.split(',')[0]}` : ''}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-teal-600 transition" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Instructors */}
          {matchingInstructors.length > 0 && (
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2 px-2 flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-sky-600" />
                Instructors ({matchingInstructors.length})
              </div>
              <div className="space-y-1">
                {matchingInstructors.map((i) => (
                  <div
                    key={i.id}
                    onClick={() => handleSelect('/instructors')}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition group"
                  >
                    <div>
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        {i.name}
                      </span>
                      <div className="text-xs text-slate-500">
                        📞 {i.mobile} • Licence: {i.licence_number}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-teal-600 transition" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Vehicles */}
          {matchingVehicles.length > 0 && (
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2 px-2 flex items-center gap-1.5">
                <Car className="w-3.5 h-3.5 text-amber-600" />
                Vehicles ({matchingVehicles.length})
              </div>
              <div className="space-y-1">
                {matchingVehicles.map((v) => (
                  <div
                    key={v.id}
                    onClick={() => handleSelect('/vehicles')}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition group"
                  >
                    <div>
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        {v.registration_number}
                      </span>
                      <div className="text-xs text-slate-500">
                        {v.model} ({v.type.toUpperCase()})
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-teal-600 transition" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Receipts */}
          {matchingReceipts.length > 0 && (
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2 px-2 flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                Receipts ({matchingReceipts.length})
              </div>
              <div className="space-y-1">
                {matchingReceipts.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => handleSelect(`/payments?search=${p.receipt_number}`)}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition group"
                  >
                    <div>
                      <span className="font-bold text-sm font-mono text-slate-900 dark:text-white">
                        {p.receipt_number}
                      </span>
                      <div className="text-xs text-slate-500">
                        {formatINR(p.amount)} via {p.mode.toUpperCase()}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-teal-600 transition" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
