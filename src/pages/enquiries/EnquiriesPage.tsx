import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  Phone,
  Search,
  CheckCircle2,
  Clock,
  UserCheck,
  Archive,
  Trash2,
  ExternalLink,
  Filter,
  PlusCircle,
  AlertCircle,
  FileText,
  Send,
  UserPlus,
} from 'lucide-react';
import { db } from '../../lib/storage';
import { useAuth } from '../../context/AuthContext';
import { type Enquiry, type EnquiryStatus } from '../../types';

export const EnquiriesPage: React.FC = () => {
  const { role } = useAuth();
  const navigate = useNavigate();

  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedStatus, setSelectedStatus] = useState<EnquiryStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [notesModalEnquiry, setNotesModalEnquiry] = useState<Enquiry | null>(null);
  const [staffNotes, setStaffNotes] = useState('');

  // Re-fetch on storage or cloud sync event
  useEffect(() => {
    const handleSync = () => setRefreshKey((k) => k + 1);
    window.addEventListener('storage', handleSync);
    window.addEventListener('drivedesk_sync_complete', handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('drivedesk_sync_complete', handleSync);
    };
  }, []);

  const enquiries = useMemo(() => {
    return db.getEnquiries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  // Statistics
  const stats = useMemo(() => {
    const total = enquiries.length;
    const newCount = enquiries.filter((e) => e.status === 'new').length;
    const contactedCount = enquiries.filter((e) => e.status === 'contacted').length;
    const convertedCount = enquiries.filter((e) => e.status === 'converted').length;
    return { total, newCount, contactedCount, convertedCount };
  }, [enquiries]);

  // Filtered enquiries
  const filteredEnquiries = useMemo(() => {
    return enquiries.filter((e) => {
      const matchesStatus = selectedStatus === 'all' || e.status === selectedStatus;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        e.full_name.toLowerCase().includes(q) ||
        e.phone.includes(q) ||
        e.course_interest.toLowerCase().includes(q) ||
        (e.notes && e.notes.toLowerCase().includes(q)) ||
        (e.message && e.message.toLowerCase().includes(q));

      return matchesStatus && matchesSearch;
    });
  }, [enquiries, selectedStatus, searchQuery]);

  // Status Change Handler
  const handleStatusChange = (id: string, newStatus: EnquiryStatus) => {
    try {
      db.updateEnquiryStatus(id, newStatus, undefined, role);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  // Convert to Candidate Handler
  const [convertingId, setConvertingId] = useState<string | null>(null);

  const handleConvertToCandidate = async (enquiry: Enquiry) => {
    if (
      window.confirm(
        `Convert "${enquiry.full_name}" into an enrolled candidate? This will create their student profile and mark this enquiry as converted.`
      )
    ) {
      setConvertingId(enquiry.id);
      try {
        const candidate = await db.convertEnquiryToCandidateAsync(enquiry.id, role);
        setRefreshKey((k) => k + 1);
        navigate(`/candidates/${candidate.id}`);
      } catch (err: any) {
        alert(err?.message || 'Could not convert to candidate');
      } finally {
        setConvertingId(null);
      }
    }
  };

  // Delete Handler
  const handleDeleteEnquiry = (enquiry: Enquiry) => {
    if (window.confirm(`Are you sure you want to remove the enquiry from "${enquiry.full_name}"?`)) {
      db.deleteEnquiry(enquiry.id, role);
      setRefreshKey((k) => k + 1);
    }
  };

  // Save Staff Notes Handler
  const handleSaveNotes = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notesModalEnquiry) return;
    try {
      db.updateEnquiryStatus(notesModalEnquiry.id, notesModalEnquiry.status, staffNotes, role);
      setNotesModalEnquiry(null);
      setStaffNotes('');
      setRefreshKey((k) => k + 1);
    } catch (err) {
      console.error('Failed to save staff notes:', err);
    }
  };

  const formatDateTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return (
        d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) +
        ', ' +
        d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
      );
    } catch {
      return dateStr;
    }
  };

  const getStatusBadge = (status: EnquiryStatus) => {
    switch (status) {
      case 'new':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span>New Lead</span>
          </span>
        );
      case 'contacted':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Contacted</span>
          </span>
        );
      case 'converted':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Enrolled Student</span>
          </span>
        );
      case 'archived':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            <Archive className="w-3.5 h-3.5" />
            <span>Archived</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Page Title & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <MessageSquare className="w-7 h-7 text-teal-600 dark:text-teal-400" />
            <span>Website Enquiries & Leads</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time leads submitted by potential students from your public landing page.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/landing#contact"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 transition border border-slate-200 dark:border-slate-700"
          >
            <ExternalLink className="w-4 h-4 text-slate-400" />
            <span>Preview Public Form</span>
          </a>
        </div>
      </div>

      {/* 4 Counter Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Total Enquiries</span>
            <MessageSquare className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2">
            {stats.total}
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-900/60 shadow-xs">
          <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 text-xs font-semibold uppercase tracking-wider">
            <span>New (Action Needed)</span>
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 mt-2">
            {stats.newCount}
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-900/60 shadow-xs">
          <div className="flex items-center justify-between text-blue-600 dark:text-blue-400 text-xs font-semibold uppercase tracking-wider">
            <span>Contacted</span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400 mt-2">
            {stats.contactedCount}
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/60 shadow-xs">
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 text-xs font-semibold uppercase tracking-wider">
            <span>Converted to Students</span>
            <UserCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
            {stats.convertedCount}
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(
            [
              { id: 'all', label: 'All Leads' },
              { id: 'new', label: 'New Leads', count: stats.newCount },
              { id: 'contacted', label: 'Attended / Contacted', count: stats.contactedCount },
              { id: 'converted', label: 'Enrolled Students', count: stats.convertedCount },
              { id: 'archived', label: 'Archived' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedStatus(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                selectedStatus === tab.id
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span>{tab.label}</span>
              {'count' in tab && tab.count !== undefined && tab.count > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    selectedStatus === tab.id
                      ? 'bg-white text-teal-700'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search leads by name, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>

      {/* Enquiries List / Table */}
      {filteredEnquiries.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
          <MessageSquare className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-700 dark:text-slate-200">
            No enquiries found
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {searchQuery
              ? 'No leads matched your search query. Try clearing the filter.'
              : 'Enquiries submitted through your public website landing page will automatically appear here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredEnquiries.map((enquiry) => {
            const cleanPhone = enquiry.phone.replace(/[^0-9]/g, '');
            const whatsappText = encodeURIComponent(
              `Hello ${enquiry.full_name}, thank you for inquiring about "${enquiry.course_interest}" at Gem Driving School. We have flexible morning and evening batches available. When would you like to begin your training?`
            );

            return (
              <div
                key={enquiry.id}
                className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6"
              >
                {/* Left: Lead Identity & Course Details */}
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-lg font-bold text-slate-900 dark:text-white">
                      {enquiry.full_name}
                    </span>
                    {getStatusBadge(enquiry.status)}
                    <span className="text-xs text-slate-400">
                      Received: {formatDateTime(enquiry.created_at)}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-1.5 font-medium">
                      <span className="text-slate-400">Phone:</span>
                      <a
                        href={`tel:${enquiry.phone}`}
                        className="text-teal-600 dark:text-teal-400 font-bold hover:underline"
                      >
                        {enquiry.phone}
                      </a>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400">Interested Course:</span>
                      <span className="px-2.5 py-0.5 rounded-md font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                        {enquiry.course_interest}
                      </span>
                    </div>
                  </div>

                  {/* Student Message */}
                  {enquiry.message && (
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-800 italic">
                      &ldquo;{enquiry.message}&rdquo;
                    </div>
                  )}

                  {/* Staff Internal Notes */}
                  {enquiry.notes && (
                    <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 px-3 py-1.5 rounded-lg border border-amber-200 dark:border-amber-900/50">
                      <FileText className="w-3.5 h-3.5 shrink-0" />
                      <span><strong>Staff Note:</strong> {enquiry.notes}</span>
                    </div>
                  )}
                </div>

                {/* Right: Quick Action Buttons (WhatsApp, Phone Call, Convert, Notes) */}
                <div className="flex flex-wrap items-center gap-2 self-stretch lg:self-auto justify-end pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800 w-full lg:w-auto">
                  {/* WhatsApp Quick Reply */}
                  <a
                    href={`https://wa.me/91${cleanPhone}?text=${whatsappText}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      if (enquiry.status === 'new') {
                        handleStatusChange(enquiry.id, 'contacted');
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs active:scale-95 transition"
                    title="1-Click WhatsApp greeting (Marks lead as Attended)"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>

                  {/* Phone Call Link */}
                  <a
                    href={`tel:${enquiry.phone}`}
                    onClick={() => {
                      if (enquiry.status === 'new') {
                        handleStatusChange(enquiry.id, 'contacted');
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 active:scale-95 transition"
                    title="Call Lead (Marks lead as Attended)"
                  >
                    <Phone className="w-3.5 h-3.5 text-blue-500" />
                    <span>Call</span>
                  </a>

                  {/* Convert to Student Button */}
                  {enquiry.status !== 'converted' && (
                    <button
                      type="button"
                      disabled={convertingId === enquiry.id}
                      onClick={() => handleConvertToCandidate(enquiry)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-500 disabled:opacity-60 text-white shadow-xs active:scale-95 transition"
                      title="Create candidate record from this lead"
                    >
                      {convertingId === enquiry.id ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Enrolling...</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Enroll as Student</span>
                        </>
                      )}
                    </button>
                  )}

                  {/* Status Dropdown */}
                  <select
                    value={enquiry.status}
                    onChange={(e) => handleStatusChange(enquiry.id, e.target.value as EnquiryStatus)}
                    className="px-2.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold focus:outline-none"
                  >
                    <option value="new">Status: New</option>
                    <option value="contacted">Status: Contacted</option>
                    <option value="converted">Status: Converted</option>
                    <option value="archived">Status: Archived</option>
                  </select>

                  {/* Staff Notes Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setNotesModalEnquiry(enquiry);
                      setStaffNotes(enquiry.notes || '');
                    }}
                    className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    title="Add / Edit Staff Note"
                  >
                    <FileText className="w-4 h-4" />
                  </button>

                  {/* Delete Enquiry */}
                  <button
                    type="button"
                    onClick={() => handleDeleteEnquiry(enquiry)}
                    className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                    title="Delete lead"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Staff Notes Modal */}
      {notesModalEnquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-teal-600" />
                <span>Staff Follow-Up Note</span>
              </h3>
              <button
                type="button"
                onClick={() => setNotesModalEnquiry(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                &times;
              </button>
            </div>

            <div>
              <span className="text-xs text-slate-500 block">Lead:</span>
              <strong className="text-sm text-slate-900 dark:text-white">
                {notesModalEnquiry.full_name} ({notesModalEnquiry.phone})
              </strong>
            </div>

            <form onSubmit={handleSaveNotes} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Internal Notes (e.g. called on Monday, interested in morning 7 AM batch, will confirm after salary)
                </label>
                <textarea
                  rows={4}
                  value={staffNotes}
                  onChange={(e) => setStaffNotes(e.target.value)}
                  placeholder="Enter follow-up details..."
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setNotesModalEnquiry(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-500 text-white shadow-xs"
                >
                  Save Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
