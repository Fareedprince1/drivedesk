import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  X,
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

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({ isOpen, onClose }) => {
  const { role, isAdmin } = useAuth();

  if (!isOpen) return null;

  const allItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/candidates', label: 'Candidates', icon: Users },
    { to: '/appointments', label: 'Appointments', icon: CalendarDays },
    { to: '/payments', label: 'Payments', icon: CreditCard },
    { to: '/pending-balance', label: 'Pending Balance', icon: AlertCircle },
    { to: '/instructors', label: 'Instructors', icon: GraduationCap },
    { to: '/vehicles', label: 'Vehicles', icon: Car },
    { to: '/driving-tests', label: 'Driving Tests / RTO', icon: FileCheck2 },
    ...(isAdmin
      ? [
          { to: '/expenses', label: 'Expenses (Admin)', icon: TrendingDown },
          { to: '/reports', label: 'Reports & Exports (Admin)', icon: BarChart3 },
          { to: '/settings', label: 'Settings (Admin)', icon: Settings },
        ]
      : []),
  ];

  return (
    <div className="fixed inset-0 z-50 lg:hidden animate-fade-in">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={onClose} />
      <div className="fixed inset-y-0 left-0 w-4/5 max-w-xs bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white">
              <Car className="w-4 h-4" />
            </div>
            <span className="font-bold text-base text-slate-900 dark:text-white">
              Drive<span className="text-teal-600">Desk</span>
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-950/40 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-600 dark:text-slate-300">
            Role: <span className={isAdmin ? 'text-teal-600 font-bold' : 'text-amber-600 font-bold'}>{role.toUpperCase()}</span>
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800">
            {isAdmin ? 'Full Access' : 'Restricted'}
          </span>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {allItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all ${
                    isActive
                      ? 'bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`
                }
              >
                <Icon className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
