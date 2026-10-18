import React, { useState, useEffect } from 'react';
import { Menu, X, Phone, LogIn, ChevronRight, LayoutDashboard, Sparkles } from 'lucide-react';
import { LANDING_DATA } from '../../data/landingData';
import { useAuth } from '../../context/AuthContext';
import type { LandingPageConfig } from '../../types';

interface HeaderProps {
  onLoginClick?: () => void;
  config?: LandingPageConfig;
}

export const Header: React.FC<HeaderProps> = ({ onLoginClick, config }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated, user } = useAuth();

  const schoolName = config?.schoolName || LANDING_DATA.schoolInfo.name;
  const phone = config?.phone || LANDING_DATA.schoolInfo.phone;
  const logoUrl = config?.logoUrl || LANDING_DATA.schoolInfo.logoUrl;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    ...(config?.sections?.courses !== false ? [{ label: 'Courses', href: '#courses' }] : []),
    ...(config?.sections?.whyUs !== false ? [{ label: 'Why Us', href: '#why-us' }] : []),
    ...(config?.sections?.howItWorks !== false ? [{ label: 'How It Works', href: '#how-it-works' }] : []),
    ...(config?.sections?.trafficRules !== false ? [{ label: 'Traffic Rules', href: '#traffic-rules' }] : []),
    ...(config?.sections?.testimonials !== false ? [{ label: 'Reviews', href: '#testimonials' }] : []),
    ...(config?.sections?.faq !== false ? [{ label: 'FAQ', href: '#faq' }] : []),
    ...(config?.sections?.contact !== false ? [{ label: 'Contact', href: '#contact' }] : []),
  ];

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    const targetElement = document.querySelector(href);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-slate-900/95 backdrop-blur-md shadow-lg shadow-slate-950/20 py-3 border-b border-slate-800'
          : 'bg-slate-900/85 backdrop-blur-sm py-4 border-b border-slate-800/60'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo & Brand Name */}
          <a
            href="#hero"
            onClick={(e) => handleLinkClick(e, '#hero')}
            className="flex items-center gap-3 group focus:outline-none"
          >
            <div className="w-11 h-11 rounded-xl bg-white p-1 shadow-md shadow-blue-500/20 flex items-center justify-center overflow-hidden border border-blue-100 group-hover:scale-105 transition-transform shrink-0">
              <img
                src={logoUrl}
                alt="Gym Driving School Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-extrabold tracking-tight text-white group-hover:text-amber-400 transition-colors flex items-center gap-1.5">
                GYM <span className="text-blue-400 font-bold">DRIVING SCHOOL</span>
              </span>
              <span className="text-[11px] font-medium tracking-wider text-slate-300 uppercase">
                Govt. Recognized Academy
              </span>
            </div>
          </a>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => handleLinkClick(e, link.href)}
                className="px-3.5 py-2 rounded-lg text-sm font-medium text-slate-200 hover:text-white hover:bg-slate-800/80 transition-all focus:outline-none"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Desktop Right Actions: Phone + Customer Login / Admin Portal */}
          <div className="hidden md:flex items-center gap-4">
            <a
              href={`tel:${phone}`}
              className="flex items-center gap-2 text-xs font-semibold text-slate-200 hover:text-amber-400 transition-colors py-1.5 px-3 rounded-full bg-slate-800/80 border border-slate-700"
            >
              <Phone className="w-3.5 h-3.5 text-amber-400" />
              <span>{phone}</span>
            </a>

            {isAuthenticated ? (
              <a
                href="/dashboard"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-teal-500 hover:bg-teal-400 text-slate-950 active:scale-95 shadow-md shadow-teal-500/20 transition-all focus:ring-2 focus:ring-teal-400/50"
              >
                <LayoutDashboard className="w-4 h-4 text-slate-950" />
                <span>Admin Portal</span>
                <span className="w-2 h-2 rounded-full bg-slate-950 animate-ping" />
              </a>
            ) : (
              <a
                href="/login"
                onClick={(e) => {
                  if (onLoginClick) {
                    e.preventDefault();
                    onLoginClick();
                  }
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-amber-400 text-slate-950 hover:bg-amber-300 active:scale-95 shadow-md shadow-amber-500/20 transition-all focus:ring-2 focus:ring-amber-400/50"
              >
                <LogIn className="w-4 h-4 text-slate-950" />
                <span>Customer Login</span>
              </a>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex items-center gap-2 lg:hidden">
            {isAuthenticated ? (
              <a
                href="/dashboard"
                className="md:hidden inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-teal-400 text-slate-950 hover:bg-teal-300 transition-all shadow-sm"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Portal</span>
              </a>
            ) : (
              <a
                href="/login"
                onClick={(e) => {
                  if (onLoginClick) {
                    e.preventDefault();
                    onLoginClick();
                  }
                }}
                className="md:hidden inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-400 text-slate-950 hover:bg-amber-300 transition-all shadow-sm"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Login</span>
              </a>
            )}

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 focus:outline-none"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6 text-amber-400" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Slide-down Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-slate-900 border-b border-slate-800 px-4 pt-3 pb-6 shadow-2xl animate-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col space-y-1">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => handleLinkClick(e, link.href)}
                className="flex items-center justify-between px-4 py-3 rounded-xl text-base font-medium text-slate-200 hover:bg-slate-800 hover:text-amber-400 transition-all"
              >
                <span>{link.label}</span>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </a>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800 flex flex-col gap-3">
            <a
              href={`tel:${phone}`}
              className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold bg-slate-800 text-slate-200 border border-slate-700"
            >
              <Phone className="w-4 h-4 text-amber-400" />
              <span>Call Us: {phone}</span>
            </a>

            {isAuthenticated ? (
              <a
                href="/dashboard"
                className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold bg-teal-400 text-slate-950 shadow-md shadow-teal-500/20"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Go to Admin Portal ({user?.name || 'Admin'})</span>
              </a>
            ) : (
              <a
                href="/login"
                onClick={(e) => {
                  if (onLoginClick) {
                    e.preventDefault();
                    setMobileMenuOpen(false);
                    onLoginClick();
                  }
                }}
                className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20"
              >
                <LogIn className="w-4 h-4" />
                <span>Customer Portal Login</span>
              </a>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
