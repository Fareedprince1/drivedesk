import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileNav } from './MobileNav';
import { MobileDrawer } from './MobileDrawer';
import { GlobalSearchModal } from '../common/GlobalSearchModal';
import { Plus, UserPlus, CalendarPlus, CreditCard } from 'lucide-react';

export const AppLayout: React.FC = () => {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col antialiased">
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto pb-20 lg:pb-8">
          <Header
            onToggleMobileMenu={() => setMobileDrawerOpen(true)}
            onOpenSearch={() => setSearchOpen(true)}
          />

          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
            <Outlet />
          </main>
        </div>
      </div>

      {/* Mobile Drawer */}
      <MobileDrawer
        isOpen={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
      />

      {/* Mobile Bottom Navigation */}
      <MobileNav onOpenDrawer={() => setMobileDrawerOpen(true)} />

      {/* Global Search Dialog (Ctrl+K) */}
      <GlobalSearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
      />

      {/* Floating Action Button (FAB) for fast morning actions */}
      <div className="fixed bottom-20 lg:bottom-6 right-5 z-30">
        {fabOpen && (
          <div className="flex flex-col gap-2 mb-3 items-end animate-fade-in">
            <button
              onClick={() => {
                setFabOpen(false);
                navigate('/candidates?action=add');
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 rounded-full shadow-lg border border-slate-200 dark:border-slate-800 text-xs font-bold hover:bg-teal-50 hover:text-teal-700 transition"
            >
              <UserPlus className="w-4 h-4 text-teal-600" />
              <span>Add Candidate</span>
            </button>
            <button
              onClick={() => {
                setFabOpen(false);
                navigate('/appointments?action=book');
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 rounded-full shadow-lg border border-slate-200 dark:border-slate-800 text-xs font-bold hover:bg-teal-50 hover:text-teal-700 transition"
            >
              <CalendarPlus className="w-4 h-4 text-sky-600" />
              <span>Book Appointment</span>
            </button>
            <button
              onClick={() => {
                setFabOpen(false);
                navigate('/payments?action=record');
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 rounded-full shadow-lg border border-slate-200 dark:border-slate-800 text-xs font-bold hover:bg-teal-50 hover:text-teal-700 transition"
            >
              <CreditCard className="w-4 h-4 text-emerald-600" />
              <span>Record Payment</span>
            </button>
          </div>
        )}

        <button
          onClick={() => setFabOpen(!fabOpen)}
          className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-xl transition-all transform hover:scale-105 active:scale-95 ${
            fabOpen
              ? 'bg-slate-800 dark:bg-slate-700 rotate-45'
              : 'bg-teal-600 hover:bg-teal-700 shadow-teal-600/30'
          }`}
          aria-label="Quick Actions"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};
