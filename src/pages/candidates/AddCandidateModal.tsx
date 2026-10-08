import React, { useState } from 'react';
import { db } from '../../lib/storage';
import { Modal } from '../../components/common/Modal';
import { formatINR, getTodayIST } from '../../lib/formatters';
import { useAuth } from '../../context/AuthContext';

interface AddCandidateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (candidateId: string) => void;
}

export const AddCandidateModal: React.FC<AddCandidateModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { role, isAdmin } = useAuth();
  const packages = db.getPackages(true); // active packages

  const today = getTodayIST();

  // Form State
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [altMobile, setAltMobile] = useState('');
  const [address, setAddress] = useState('');
  const [dob, setDob] = useState('');
  const [joiningDate, setJoiningDate] = useState(today);
  const [llNumber, setLlNumber] = useState('');
  const [llIssueDate, setLlIssueDate] = useState('');
  const [llExpiryDate, setLlExpiryDate] = useState('');

  // Package Selection
  const [selectedPkgId, setSelectedPkgId] = useState(packages[0]?.id || '');
  const [totalClasses, setTotalClasses] = useState(packages[0]?.total_classes || 20);
  const [totalFee, setTotalFee] = useState(packages[0]?.fee || 8000);
  const [discountAmount, setDiscountAmount] = useState(0);

  // Initial Payment (Admin only)
  const [hasInitialPayment, setHasInitialPayment] = useState(true);
  const [payAmount, setPayAmount] = useState(totalFee);
  const [payMode, setPayMode] = useState<'cash' | 'upi' | 'card' | 'bank_transfer' | 'online'>('upi');
  const [payRemarks, setPayRemarks] = useState('Admission initial payment');

  const [error, setError] = useState('');

  // When package selection changes, auto-fill classes and fee
  const handlePackageChange = (pkgId: string) => {
    setSelectedPkgId(pkgId);
    const pkg = packages.find((p) => p.id === pkgId);
    if (pkg) {
      setTotalClasses(pkg.total_classes);
      setTotalFee(pkg.fee);
      setPayAmount(pkg.fee - discountAmount);
    }
  };

  const netFee = Math.max(0, totalFee - discountAmount);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validations
    const cleanMobile = mobile.replace(/\D/g, '');
    if (cleanMobile.length !== 10) {
      setError('Please enter a valid 10-digit Indian mobile number');
      return;
    }

    if (isAdmin && hasInitialPayment && payAmount > netFee) {
      setError(`Initial payment (₹${payAmount}) cannot exceed net course fee (₹${netFee})`);
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await db.createCandidateWithEnrollmentAsync(
        {
          full_name: fullName.trim(),
          mobile: cleanMobile,
          alt_mobile: altMobile.trim() || undefined,
          address: address.trim() || undefined,
          date_of_birth: dob || undefined,
          joining_date: joiningDate,
          ll_number: llNumber.trim() || undefined,
          ll_issue_date: llIssueDate || undefined,
          ll_expiry_date: llExpiryDate || undefined,
          status: 'active',
          notes_summary: `Enrolled on ${joiningDate}`,
        },
        {
          package_id: selectedPkgId,
          total_classes: Number(totalClasses),
          total_fee: Number(totalFee),
          discount_amount: Number(discountAmount),
          start_date: joiningDate,
        },
        isAdmin && hasInitialPayment && payAmount > 0
          ? {
              amount: Number(payAmount),
              mode: payMode,
              remarks: payRemarks,
            }
          : undefined,
        role
      );

      onSuccess(result.candidate.id);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Error creating candidate enrollment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Register New Candidate"
      description="Add student details, select training package, and optionally record admission payment"
      maxWidth="3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-400 text-xs font-semibold rounded-xl">
            {error}
          </div>
        )}

        {/* Section 1: Personal Details */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 mb-3">
            1. Personal & Contact Information
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Aarav Sharma"
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Mobile Number (10 Digits) *
              </label>
              <div className="flex">
                <span className="inline-flex items-center px-3 text-xs bg-slate-200/70 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-r-0 border-slate-200 dark:border-slate-700 rounded-l-xl font-mono">
                  +91
                </span>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                  placeholder="9876543210"
                  className="w-full px-3 py-2 text-sm rounded-r-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Alternative / Guardian Mobile
              </label>
              <input
                type="tel"
                maxLength={10}
                value={altMobile}
                onChange={(e) => setAltMobile(e.target.value.replace(/\D/g, ''))}
                placeholder="Optional"
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Joining Date *
              </label>
              <input
                type="date"
                required
                value={joiningDate}
                onChange={(e) => setJoiningDate(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Date of Birth
              </label>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Residential Address
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Area, Street, City"
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Learner Licence (LL) Details */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 mb-3">
            2. Learner's Licence (LL) Details (Optional)
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                LL Number
              </label>
              <input
                type="text"
                value={llNumber}
                onChange={(e) => setLlNumber(e.target.value.toUpperCase())}
                placeholder="e.g. KA01/2026/001928"
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Issue Date
              </label>
              <input
                type="date"
                value={llIssueDate}
                onChange={(e) => setLlIssueDate(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Expiry Date
              </label>
              <input
                type="date"
                value={llExpiryDate}
                onChange={(e) => setLlExpiryDate(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Package & Enrollment */}
        <div className="p-4 rounded-2xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-100 dark:border-teal-900/60">
          <h4 className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-300 mb-3">
            {isAdmin ? '3. Training Package & Fees' : '3. Training Package & Classes'}
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Select Package *
              </label>
              <select
                value={selectedPkgId}
                onChange={(e) => handlePackageChange(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs"
              >
                {packages.map((pkg) => (
                  <option key={pkg.id} value={pkg.id}>
                    {pkg.name} — {pkg.total_classes} classes ({pkg.vehicle_type.toUpperCase()})
                    {isAdmin ? ` — ${formatINR(pkg.fee)}` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className={isAdmin ? '' : 'sm:col-span-2'}>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Total Classes (Copied from package, editable)
              </label>
              <input
                type="number"
                min={1}
                required
                value={totalClasses}
                onChange={(e) => setTotalClasses(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
              />
            </div>

            {isAdmin && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Standard Fee (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={totalFee}
                    onChange={(e) => setTotalFee(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Discount Concession (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Net Payable Fee
                  </label>
                  <div className="px-3.5 py-2 text-base font-extrabold text-teal-700 dark:text-teal-400 bg-white dark:bg-slate-800 border border-teal-200 dark:border-teal-800 rounded-xl">
                    {formatINR(netFee)}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Section 4: Initial Payment (Admin only) */}
        {isAdmin && (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                4. Record Initial Payment at Admission
              </h4>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-600 dark:text-slate-400">
                <input
                  type="checkbox"
                  checked={hasInitialPayment}
                  onChange={(e) => setHasInitialPayment(e.target.checked)}
                  className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
                />
                <span>Collect Payment Now</span>
              </label>
            </div>

            {hasInitialPayment && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Amount Collected (₹) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={netFee}
                    required={hasInitialPayment}
                    value={payAmount}
                    onChange={(e) => setPayAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold"
                  />
                  <span className="text-[11px] text-slate-400">
                    Balance will be: {formatINR(netFee - payAmount)}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Payment Mode *
                  </label>
                  <select
                    value={payMode}
                    onChange={(e) => setPayMode(e.target.value as any)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                  >
                    <option value="upi">UPI (GPay / PhonePe / Paytm)</option>
                    <option value="cash">Cash</option>
                    <option value="card">Debit / Credit Card</option>
                    <option value="bank_transfer">Bank Transfer (NEFT/IMPS)</option>
                    <option value="online">Online</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Remarks / Note
                  </label>
                  <input
                    type="text"
                    value={payRemarks}
                    onChange={(e) => setPayRemarks(e.target.value)}
                    placeholder="e.g. 1st installment"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 text-xs font-bold rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white shadow-md shadow-teal-600/20 transition cursor-pointer flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Saving to Cloud...</span>
              </>
            ) : (
              <span>Register Candidate & Enroll</span>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
