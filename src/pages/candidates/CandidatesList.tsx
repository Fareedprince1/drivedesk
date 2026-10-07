import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search,
  UserPlus,
  Filter,
  ArrowUpDown,
  Phone,
  MessageSquare,
  ChevronRight,
  User,
  Users,
  Plus,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { db } from '../../lib/storage';
import type { CandidateWithStats } from '../../types';
import { formatINR, formatPhone, formatDate, getWhatsAppUrl, getTelUrl } from '../../lib/formatters';
import { Badge, getStatusBadgeVariant } from '../../components/common/Badge';
import { AddCandidateModal } from './AddCandidateModal';

export const CandidatesList: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [packageFilter, setPackageFilter] = useState<string>('all');
  const [onlyBalancePending, setOnlyBalancePending] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'code' | 'joining' | 'balance'>('joining');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Add Candidate Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(() => searchParams.get('action') === 'add');
  const [refreshKey, setRefreshKey] = useState(0);

  // Re-fetch when local storage changes or cloud sync completes
  React.useEffect(() => {
    const handleSync = () => setRefreshKey((k) => k + 1);
    window.addEventListener('storage', handleSync);
    window.addEventListener('drivedesk_sync_complete', handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('drivedesk_sync_complete', handleSync);
    };
  }, []);

  const packages = useMemo(() => db.getPackages(), [refreshKey]);
  const candidates = useMemo(() => db.getCandidatesWithStats(), [refreshKey]);

  // Filtered & Sorted Candidates
  const filteredCandidates = useMemo(() => {
    return candidates
      .filter((c) => {
        // Search
        const q = searchTerm.toLowerCase().trim();
        const matchesSearch =
          !q ||
          c.full_name.toLowerCase().includes(q) ||
          c.mobile.includes(q) ||
          c.candidate_code.toLowerCase().includes(q) ||
          (c.ll_number && c.ll_number.toLowerCase().includes(q));

        // Status
        const matchesStatus = statusFilter === 'all' || c.status === statusFilter;

        // Package
        const matchesPackage =
          packageFilter === 'all' ||
          (c.active_enrollment && c.active_enrollment.package_id === packageFilter);

        // Pending Balance
        const matchesBalance = !onlyBalancePending || (c.stats?.balance || 0) > 0;

        return matchesSearch && matchesStatus && matchesPackage && matchesBalance;
      })
      .sort((a, b) => {
        let valA: any = a.joining_date;
        let valB: any = b.joining_date;

        if (sortBy === 'name') {
          valA = a.full_name.toLowerCase();
          valB = b.full_name.toLowerCase();
        } else if (sortBy === 'code') {
          valA = a.candidate_code;
          valB = b.candidate_code;
        } else if (sortBy === 'balance') {
          valA = a.stats?.balance || 0;
          valB = b.stats?.balance || 0;
        }

        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [candidates, searchTerm, statusFilter, packageFilter, onlyBalancePending, sortBy, sortOrder]);

  const totalPages = Math.ceil(filteredCandidates.length / pageSize) || 1;
  const paginatedCandidates = filteredCandidates.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const toggleSort = (col: 'name' | 'code' | 'joining' | 'balance') => {
    if (sortBy === col) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(col);
      setSortOrder('asc');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Primary Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Candidates Directory
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage student registrations, package enrollments, progress, and fee balances
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-600/20 transition cursor-pointer self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Candidate</span>
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by name, mobile, DS0001 ID, or LL..."
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="hold">On Hold</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Package Filter */}
          <div>
            <select
              value={packageFilter}
              onChange={(e) => {
                setPackageFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
            >
              <option value="all">All Packages</option>
              {packages.map((pkg) => (
                <option key={pkg.id} value={pkg.id}>
                  {pkg.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Toggle & Filter Tags */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-600 dark:text-slate-400 select-none">
            <input
              type="checkbox"
              checked={onlyBalancePending}
              onChange={(e) => {
                setOnlyBalancePending(e.target.checked);
                setCurrentPage(1);
              }}
              className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
            />
            <span>Show only candidates with pending balance</span>
          </label>

          <span className="text-slate-400 text-[11px]">
            Showing {filteredCandidates.length} candidate(s)
          </span>
        </div>
      </div>

      {/* Table & Mobile Cards */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 text-slate-500 font-semibold select-none">
              <tr>
                <th
                  onClick={() => toggleSort('code')}
                  className="py-3 px-4 cursor-pointer hover:text-teal-600"
                >
                  <div className="flex items-center gap-1">
                    <span>ID</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('name')}
                  className="py-3 px-4 cursor-pointer hover:text-teal-600"
                >
                  <div className="flex items-center gap-1">
                    <span>Candidate Name</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4">Mobile</th>
                <th className="py-3 px-4">Package Enrolled</th>
                <th className="py-3 px-4">Classes (Done/Left)</th>
                <th
                  onClick={() => toggleSort('balance')}
                  className="py-3 px-4 cursor-pointer hover:text-teal-600"
                >
                  <div className="flex items-center gap-1">
                    <span>Balance Pending</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginatedCandidates.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-14 text-slate-400">
                    <div className="max-w-xs mx-auto space-y-3">
                      <Users className="w-9 h-9 text-slate-300 dark:text-slate-600 mx-auto" />
                      <div className="font-bold text-slate-700 dark:text-slate-200 text-sm">
                        No candidates enrolled yet
                      </div>
                      <p className="text-xs text-slate-400">
                        Enroll your first driving student to begin tracking lessons, packages, and payments.
                      </p>
                      <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add First Candidate</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedCandidates.map((cand) => {
                  const stats = cand.stats;
                  const balance = stats?.balance || 0;
                  return (
                    <tr
                      key={cand.id}
                      onClick={() => navigate(`/candidates/${cand.id}`)}
                      className="hover:bg-teal-50/40 dark:hover:bg-slate-800/40 transition cursor-pointer group"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-teal-700 dark:text-teal-400 whitespace-nowrap">
                        {cand.candidate_code}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          <span>{cand.full_name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {formatPhone(cand.mobile)}
                      </td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                        {cand.active_enrollment?.package_name || '-'}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {stats ? (
                          <div className="flex items-center gap-2 font-mono">
                            <span className="font-bold text-slate-900 dark:text-white">
                              {stats.classes_completed} / {stats.total_classes}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              ({stats.classes_remaining} left)
                            </span>
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono font-extrabold whitespace-nowrap">
                        {balance > 0 ? (
                          <span className="text-rose-600 dark:text-rose-400">
                            {formatINR(balance)}
                          </span>
                        ) : (
                          <span className="text-emerald-600 dark:text-emerald-400">
                            ₹0 (Cleared)
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={getStatusBadgeVariant(cand.status)} size="sm">
                          {cand.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <a
                            href={getTelUrl(cand.mobile)}
                            title="Call Candidate"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                          <a
                            href={getWhatsAppUrl(
                              cand.mobile,
                              `Hello ${cand.full_name}, greetings from ${db.getSettings().school_name}!`
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Chat on WhatsApp"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </a>
                          <button
                            onClick={() => navigate(`/candidates/${cand.id}`)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white"
                          >
                            <ChevronRight className="w-4 h-4" />
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

        {/* Mobile Cards View */}
        <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800">
          {paginatedCandidates.length === 0 ? (
            <div className="text-center py-12 px-4 text-slate-400 space-y-3">
              <Users className="w-9 h-9 text-slate-300 dark:text-slate-600 mx-auto" />
              <div className="font-bold text-slate-700 dark:text-slate-200 text-sm">
                No candidates found
              </div>
              <p className="text-xs text-slate-400">
                Enroll your first driving student or try another search filter.
              </p>
            </div>
          ) : (
            paginatedCandidates.map((cand) => {
              const stats = cand.stats;
              const balance = stats?.balance || 0;
              return (
                <div
                  key={cand.id}
                  onClick={() => navigate(`/candidates/${cand.id}`)}
                  className="p-4 space-y-3 active:bg-slate-50 dark:active:bg-slate-800/60 transition cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                          {cand.full_name}
                        </span>
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-800">
                          {cand.candidate_code}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {cand.active_enrollment?.package_name || 'No Active Package'}
                      </p>
                    </div>
                    <Badge variant={getStatusBadgeVariant(cand.status)} size="sm">
                      {cand.status}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between text-xs py-2 px-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Classes</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                        {stats ? `${stats.classes_completed} / ${stats.total_classes}` : '-'}
                      </span>
                    </div>

                    <div className="text-right space-y-0.5">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Balance</span>
                      <span className={`font-mono font-extrabold ${balance > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {balance > 0 ? formatINR(balance) : '₹0 Cleared'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1" onClick={(e) => e.stopPropagation()}>
                    <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
                      {formatPhone(cand.mobile)}
                    </span>
                    <div className="flex items-center gap-2">
                      <a
                        href={getTelUrl(cand.mobile)}
                        title="Call Candidate"
                        className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-teal-600 transition"
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                      <a
                        href={getWhatsAppUrl(
                          cand.mobile,
                          `Hello ${cand.full_name}, greetings from ${db.getSettings().school_name}!`
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Chat on WhatsApp"
                        className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 transition"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </a>
                      <button
                        onClick={() => navigate(`/candidates/${cand.id}`)}
                        className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 transition"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
                className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40"
              >
                Prev
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
                className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Candidate Modal */}
      <AddCandidateModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setSearchParams({});
          setRefreshKey((k) => k + 1);
        }}
        onSuccess={(newId) => {
          setRefreshKey((k) => k + 1);
          navigate(`/candidates/${newId}`);
        }}
      />
    </div>
  );
};
