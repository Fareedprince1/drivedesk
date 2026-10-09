import React, { useState, useEffect } from 'react';
import {
  Search,
  Moon,
  Sun,
  ShieldCheck,
  ShieldAlert,
  Menu,
  LogOut,
  Copy,
  Check,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
  onToggleMobileMenu?: () => void;
  onOpenSearch?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileMenu, onOpenSearch }) => {
  const { user, isAdmin, logout } = useAuth();
  const [copiedAdminEmail, setCopiedAdminEmail] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('theme') === 'dark' || 
      (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  return (
    <header className="sticky top-0 z-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-3 transition-colors">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile hamburger */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleMobileMenu}
            className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Center: Global Search Bar */}
        <div className="flex-1 max-w-md">
          <button
            onClick={onOpenSearch}
            className="w-full flex items-center justify-between px-3.5 py-2 text-xs text-slate-500 dark:text-slate-400 bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60 transition group cursor-pointer"
          >
            <div className="flex items-center gap-2 truncate">
              <Search className="w-4 h-4 text-slate-400 group-hover:text-teal-600 transition-colors" />
              <span className="truncate">Search candidates, mobile, receipts, vehicles...</span>
            </div>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-mono font-semibold text-slate-500 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded shadow-2xs">
              Ctrl K
            </kbd>
          </button>
        </div>

        {/* Right Actions: Dark Mode, Real User Profile & Logout */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Role & School Badge */}
          <div className="hidden sm:flex items-center gap-1.5">
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${
              isAdmin
                ? 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800'
                : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
            }`}>
              {isAdmin ? (
                <ShieldCheck className="w-3.5 h-3.5 text-teal-600 shrink-0" />
              ) : (
                <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              )}
              <span>{isAdmin ? 'ADMIN' : 'STAFF'}</span>
            </div>

            {isAdmin && user?.email && (
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(user.email);
                  setCopiedAdminEmail(true);
                  setTimeout(() => setCopiedAdminEmail(false), 2000);
                }}
                title="Copy Admin Email to share with Staff members"
                className="hidden lg:inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-teal-700 dark:text-teal-300 bg-teal-50/80 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 rounded-lg hover:bg-teal-100 transition cursor-pointer"
              >
                {copiedAdminEmail ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span>Email Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 text-teal-600" />
                    <span>Copy Admin Email for Staff</span>
                  </>
                )}
              </button>
            )}

            {!isAdmin && user?.adminEmail && (
              <div
                title={`Linked to Admin: ${user.adminEmail}`}
                className="hidden lg:inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg"
              >
                <span>Linked to:</span>
                <span className="font-bold truncate max-w-[120px]">{user.adminEmail}</span>
              </div>
            )}
          </div>

          {/* Dark Mode Toggle */}
          <button
            onClick={() => setIsDark(!isDark)}
            className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          {/* Real User Profile Menu & Logout */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
            <div className="hidden md:block text-right">
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-[140px]">
                {user?.name || user?.email?.split('@')[0] || 'User'}
              </div>
              <div className="text-[10px] text-slate-400 truncate max-w-[140px]">
                {user?.email}
              </div>
            </div>
            <button
              onClick={() => logout()}
              title="Sign Out"
              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
