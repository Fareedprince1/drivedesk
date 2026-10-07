import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  CreditCard,
  AlertCircle,
  GraduationCap,
  Car,
  FileCheck2,
  TrendingDown,
  BarChart3,
  Settings,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar: React.FC = () => {
  const { role, isAdmin } = useAuth();

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/candidates', label: 'Candidates', icon: Users },
    { to: '/appointments', label: 'Appointments', icon: CalendarDays },
    { to: '/payments', label: 'Payments', icon: CreditCard },
    { to: '/pending-balance', label: 'Pending Balance', icon: AlertCircle },
    { to: '/instructors', label: 'Instructors', icon: GraduationCap },
    { to: '/vehicles', label: 'Vehicles', icon: Car },
    { to: '/driving-tests', label: 'Driving Tests', icon: FileCheck2 },
    // Admin only
    ...(isAdmin
      ? [
          { to: '/expenses', label: 'Expenses', icon: TrendingDown, adminOnly: true },
          { to: '/reports', label: 'Reports', icon: BarChart3, adminOnly: true },
          { to: '/settings', label: 'Settings', icon: Settings, adminOnly: true },
        ]
      : []),
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 h-screen sticky top-0 z-30 transition-all select-none">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-100 dark:border-slate-800">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-700 to-teal-500 flex items-center justify-center text-white shadow-md shadow-teal-500/20">
          <Car className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-white">
              Gem<span className="text-teal-600 dark:text-teal-400">DrivingSchool</span>
            </span>
          </div>
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
            Admin Management Portal
          </span>
        </div>
      </div>

      {/* Role Badge Indicator */}
      <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-950/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isAdmin ? (
              <ShieldCheck className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            ) : (
              <ShieldAlert className="w-4 h-4 text-amber-500" />
            )}
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Role: <span className={isAdmin ? 'text-teal-600 dark:text-teal-400' : 'text-amber-600'}>{role}</span>
            </span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-md font-medium bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            {isAdmin ? 'Full Access' : 'Reception'}
          </span>
        </div>
      </div>

      {/* Nav List */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all group ${
                  isActive
                    ? 'bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 font-semibold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/70 dark:hover:bg-slate-800/60'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                      isActive ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400 dark:text-slate-500'
                    }`}
                  />
                  <span>{item.label}</span>
                  {item.adminOnly && (
                    <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded bg-teal-100/60 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300">
                      ADMIN
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 dark:text-slate-500 text-center">
        GemDrivingSchool v1.0 • India Edition
      </div>
    </aside>
  );
};
