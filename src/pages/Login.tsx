import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, ShieldCheck, ShieldAlert, KeyRound, Mail, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const ok = await login(email, password);
      if (ok) {
        navigate('/');
      } else {
        setError('Login failed. Please check your credentials.');
      }
    } catch (err: any) {
      setError(err?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (role: 'admin' | 'staff') => {
    setLoading(true);
    setError('');
    const demoEmail = role === 'admin' ? 'owner@drivedesk.in' : 'reception@drivedesk.in';
    await login(demoEmail, 'password123', role);
    navigate('/');
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col justify-center items-center p-4 selection:bg-teal-100">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200/80 dark:border-slate-800 p-8">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-700 to-teal-500 mx-auto flex items-center justify-center text-white shadow-lg shadow-teal-500/20 mb-3">
            <Car className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Drive<span className="text-teal-600">Desk</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Admin Management Portal • Driving School System (India)
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-400 font-medium">
            {error}
          </div>
        )}

        {/* Quick Demo Access Buttons */}
        <div className="mb-6 space-y-2.5">
          <div className="text-[11px] uppercase tracking-wider font-bold text-slate-400 text-center">
            ⚡ Quick Demo Logins
          </div>
          <button
            type="button"
            onClick={() => handleQuickDemo('admin')}
            disabled={loading}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-teal-200 dark:border-teal-800 bg-teal-50/70 dark:bg-teal-950/40 hover:bg-teal-100/70 text-teal-900 dark:text-teal-200 text-xs font-semibold transition group cursor-pointer"
          >
            <div className="flex items-center gap-2.5 text-left">
              <ShieldCheck className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
              <div>
                <div className="font-bold">Login as Admin (Owner)</div>
                <div className="text-[10px] text-teal-700 dark:text-teal-400 opacity-80">
                  Full access: Finances, Expenses, Reports, Staff & Settings
                </div>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-teal-600 transform group-hover:translate-x-1 transition" />
          </button>

          <button
            type="button"
            onClick={() => handleQuickDemo('staff')}
            disabled={loading}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-950/40 hover:bg-amber-100/70 text-amber-900 dark:text-amber-200 text-xs font-semibold transition group cursor-pointer"
          >
            <div className="flex items-center gap-2.5 text-left">
              <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <div>
                <div className="font-bold">Login as Staff (Receptionist)</div>
                <div className="text-[10px] text-amber-700 dark:text-amber-400 opacity-80">
                  Manage candidates, bookings & payments. Expenses/reports hidden.
                </div>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-amber-600 transform group-hover:translate-x-1 transition" />
          </button>
        </div>

        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200 dark:border-slate-800" />
          </div>
          <span className="relative bg-white dark:bg-slate-900 px-3 text-[11px] uppercase tracking-wider text-slate-400">
            or sign in with password
          </span>
        </div>

        {/* Standard Email/Password Form */}
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="owner@drivedesk.in"
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-md shadow-teal-600/20 transition cursor-pointer"
          >
            {loading ? 'Authenticating...' : 'Sign In to DriveDesk'}
          </button>
        </form>

        <p className="text-[11px] text-center text-slate-400 mt-6">
          Admin-only system • No public candidate registration
        </p>
      </div>
    </div>
  );
};
