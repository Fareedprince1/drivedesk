import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Car,
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  Mail,
  User,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Copy,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../types';

export const Login: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');

  // Sign In Form State
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');

  // Sign Up Form State
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpRole, setSignUpRole] = useState<UserRole>('admin');
  const [signUpAdminEmail, setSignUpAdminEmail] = useState('');

  // UI Feedback States
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [requiresConfirmation, setRequiresConfirmation] = useState(false);
  const [showSqlHelper, setShowSqlHelper] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  const { login, signup, isSupabaseConnected } = useAuth();
  const navigate = useNavigate();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setRequiresConfirmation(false);
    setLoading(true);

    try {
      const res = await login(signInEmail, signInPassword);
      if (res.success) {
        navigate('/');
      } else {
        setErrorMessage(res.error || 'Sign in failed');
        if (res.requiresEmailConfirmation) {
          setRequiresConfirmation(true);
        }
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'An unexpected error occurred during sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setRequiresConfirmation(false);

    if (signUpPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (signUpRole === 'staff' && !signUpAdminEmail.trim()) {
      setErrorMessage("Please enter your Driving School Admin's email to connect to their database.");
      return;
    }

    setLoading(true);

    try {
      const res = await signup(signUpEmail, signUpPassword, signUpName, signUpRole, signUpAdminEmail);
      if (res.success) {
        if (res.requiresEmailConfirmation) {
          setRequiresConfirmation(true);
          setSuccessMessage(res.message || 'Account created! Please verify your email.');
          setSignInEmail(signUpEmail);
          setSignInPassword(signUpPassword);
        } else {
          // Logged in immediately
          navigate('/');
        }
      } else {
        setErrorMessage(res.error || 'Failed to create account');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'An error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  const autoConfirmSql = `UPDATE auth.users SET email_confirmed_at = now() WHERE email_confirmed_at IS NULL;`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(autoConfirmSql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col justify-center items-center p-4 selection:bg-teal-100">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200/80 dark:border-slate-800 p-8">
        
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-700 to-teal-500 mx-auto flex items-center justify-center text-white shadow-lg shadow-teal-500/20 mb-3">
            <Car className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Gem<span className="text-teal-600">DrivingSchool</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Admin Management Portal • Gem Driving School
          </p>
        </div>

        {/* Database Status Indicator */}
        <div className="mb-6 flex items-center justify-center">
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold border ${
            isSupabaseConnected 
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
              : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
          }`}>
            <span className={`w-2 h-2 rounded-full ${isSupabaseConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            {isSupabaseConnected ? 'Live Supabase Cloud Auth Active' : 'Offline Mode (.env missing)'}
          </div>
        </div>

        {/* Mode Tabs */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-6">
          <button
            type="button"
            onClick={() => {
              setActiveTab('signin');
              setErrorMessage('');
            }}
            className={`py-2 text-xs font-bold rounded-lg transition ${
              activeTab === 'signin'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('signup');
              setErrorMessage('');
            }}
            className={`py-2 text-xs font-bold rounded-lg transition ${
              activeTab === 'signup'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-700 dark:text-emerald-300 font-medium flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <div>{successMessage}</div>
          </div>
        )}

        {/* Alerts / Error Messages */}
        {errorMessage && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 font-medium flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold">
                {errorMessage.toLowerCase().includes('rate limit')
                  ? 'Supabase Email Rate Limit Exceeded'
                  : 'Authentication Error'}
              </div>
              <div>{errorMessage}</div>
            </div>
          </div>
        )}

        {/* Supabase Rate Limit or Email Confirmation Helper Box */}
        {(requiresConfirmation || errorMessage.toLowerCase().includes('rate limit')) && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-200 space-y-2.5">
            <div className="font-bold flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span>⚡ Bypass Rate Limit & Auto-Confirm</span>
              </span>
              <button
                type="button"
                onClick={() => setShowSqlHelper(!showSqlHelper)}
                className="text-[11px] text-teal-700 dark:text-teal-400 underline font-semibold cursor-pointer flex items-center gap-0.5"
              >
                {showSqlHelper ? 'Hide SQL' : 'View Fix SQL'}
                {showSqlHelper ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>
            <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
              Supabase free tier limits confirmation emails to ~3/hour. You can completely bypass this by running this quick SQL query in your Supabase SQL editor:
            </p>

            {showSqlHelper && (
              <div className="pt-2 border-t border-amber-200/60 dark:border-amber-800/60 space-y-2">
                <div className="text-[10px] text-slate-500 font-mono">
                  Run in Supabase Dashboard &gt; SQL Editor:
                </div>
                <div className="relative bg-slate-900 text-slate-200 p-2.5 rounded-xl font-mono text-[11px] overflow-x-auto">
                  <code>{autoConfirmSql}</code>
                  <button
                    type="button"
                    onClick={handleCopySql}
                    className="absolute right-2 top-2 p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                    title="Copy SQL"
                  >
                    {copiedSql ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 1: SIGN IN FORM */}
        {activeTab === 'signin' && (
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="email"
                  required
                  value={signInEmail}
                  onChange={(e) => setSignInEmail(e.target.value)}
                  placeholder="admin@gemdrivingschool.in"
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
                  value={signInPassword}
                  onChange={(e) => setSignInPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-md shadow-teal-600/20 transition cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Gem Driving School</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* TAB 2: SIGN UP / CREATE ACCOUNT FORM */}
        {activeTab === 'signup' && (
          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="text"
                  required
                  value={signUpName}
                  onChange={(e) => setSignUpName(e.target.value)}
                  placeholder="Owner Name"
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="email"
                  required
                  value={signUpEmail}
                  onChange={(e) => setSignUpEmail(e.target.value)}
                  placeholder="owner@gemdrivingschool.in"
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Password (min 6 chars)
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={signUpPassword}
                  onChange={(e) => setSignUpPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Account Role
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSignUpRole('admin')}
                  className={`p-2.5 rounded-xl border text-left transition ${
                    signUpRole === 'admin'
                      ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/40 text-teal-900 dark:text-teal-200 ring-2 ring-teal-500'
                      : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                    <span>Admin</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Owner / Full access</div>
                </button>

                <button
                  type="button"
                  onClick={() => setSignUpRole('staff')}
                  className={`p-2.5 rounded-xl border text-left transition ${
                    signUpRole === 'staff'
                      ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 ring-2 ring-amber-500'
                      : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                    <span>Staff</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Reception desk only</div>
                </button>
              </div>

              {signUpRole === 'staff' && (
                <div className="mt-3 p-3 bg-amber-50/80 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800 space-y-1.5">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-amber-900 dark:text-amber-200">
                    Driving School Admin Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-2.5 text-amber-500" />
                    <input
                      type="email"
                      required
                      value={signUpAdminEmail}
                      onChange={(e) => setSignUpAdminEmail(e.target.value)}
                      placeholder="admin@gemdrivingschool.in"
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <p className="text-[10px] text-amber-700 dark:text-amber-300">
                    Enter the registered email of your driving school Admin to connect your staff account to their live database.
                  </p>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-md shadow-teal-600/20 transition cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create Account & Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        <p className="text-[11px] text-center text-slate-400 mt-6">
          Admin-only system • No public candidate registration
        </p>
      </div>
    </div>
  );
};
