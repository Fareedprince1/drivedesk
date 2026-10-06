import React, { useState, useEffect } from 'react';
import {
  Search,
  Moon,
  Sun,
  ShieldCheck,
  ShieldAlert,
  Menu,
  X,
  LogOut,
  User,
  RotateCcw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/storage';

interface HeaderProps {
  onToggleMobileMenu?: () => void;
  onOpenSearch?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileMenu, onOpenSearch }) => {
  const { user, role, isAdmin, switchRole, logout } = useAuth();
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('theme') === 'dark' || 
      (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });
  const [settings] = useState(() => db.getSettings());

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
        {/* Left: Mobile hamburger & School Name */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleMobileMenu}
            className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="hidden sm:block">
            <h1 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
              {settings.school_name}
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {settings.address.split(',')[1]?.trim() || 'Indiranagar, Bengaluru'}
            </p>
          </div>
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

        {/* Right Actions: Role Switcher Demo, Dark Mode, Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Role Switcher for instant permission testing */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => switchRole('admin')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                isAdmin
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
              title="Switch to Admin mode"
            >
              Admin
            </button>
            <button
              onClick={() => switchRole('staff')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                !isAdmin
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
              title="Switch to Staff (Receptionist) mode to verify restrictions"
            >
              Staff
            </button>
          </div>

          {/* Dark Mode Toggle */}
          <button
            onClick={() => setIsDark(!isDark)}
            className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          {/* User profile menu */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
            <div className="hidden md:block text-right">
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {user?.name || 'Administrator'}
              </div>
              <div className="text-[10px] uppercase font-semibold text-teal-600 dark:text-teal-400">
                {role}
              </div>
            </div>
            <button
              onClick={logout}
              title="Logout"
              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
