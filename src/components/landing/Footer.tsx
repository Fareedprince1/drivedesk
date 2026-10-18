import React, { useState } from 'react';
import { Phone, Mail, MapPin, Shield, FileText, X } from 'lucide-react';
import { LANDING_DATA } from '../../data/landingData';
import type { LandingPageConfig } from '../../types';

interface FooterProps {
  onLoginClick?: () => void;
  config?: LandingPageConfig;
}

export const Footer: React.FC<FooterProps> = ({ onLoginClick, config }) => {
  const [modalType, setModalType] = useState<'privacy' | 'terms' | null>(null);

  const schoolName = config?.schoolName || LANDING_DATA.schoolInfo.name;
  const tagline = config?.tagline || LANDING_DATA.schoolInfo.tagline;
  const phone = config?.phone || LANDING_DATA.schoolInfo.phone;
  const email = config?.email || LANDING_DATA.schoolInfo.email;
  const addressLine1 = config?.addressLine1 || LANDING_DATA.schoolInfo.addressLine1;
  const city = config?.city || LANDING_DATA.schoolInfo.city;
  const openingHours = config?.openingHours || LANDING_DATA.schoolInfo.openingHours;
  const logoUrl = config?.logoUrl || LANDING_DATA.schoolInfo.logoUrl;

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const targetElement = document.querySelector(href);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <footer className="bg-slate-950 text-white border-t border-slate-800/80 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 pb-12 border-b border-slate-800">
          {/* Col 1: Logo & Mission Statement (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center overflow-hidden border border-blue-200 shrink-0">
                <img
                  src={logoUrl}
                  alt="Gym Driving School Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-xl font-extrabold text-white tracking-tight">
                GYM <span className="text-blue-400">DRIVING SCHOOL</span>
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 max-w-sm leading-relaxed">
              {tagline}. Dedicated to empowering learners with safe road habits, defensive driving skills, and hassle-free RTO licensing.
            </p>
            <div className="pt-2 text-xs text-amber-400 font-semibold">
              Govt. Authorized Driving Institute &bull; Certified Instructors
            </div>
          </div>

          {/* Col 2: Quick Links (3 cols) */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Quick Navigation
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-400">
              <li>
                <a
                  href="#courses"
                  onClick={(e) => handleLinkClick(e, '#courses')}
                  className="hover:text-amber-400 transition-colors"
                >
                  Training Courses
                </a>
              </li>
              <li>
                <a
                  href="#why-us"
                  onClick={(e) => handleLinkClick(e, '#why-us')}
                  className="hover:text-amber-400 transition-colors"
                >
                  Why Choose Us
                </a>
              </li>
              <li>
                <a
                  href="#how-it-works"
                  onClick={(e) => handleLinkClick(e, '#how-it-works')}
                  className="hover:text-amber-400 transition-colors"
                >
                  How It Works
                </a>
              </li>
              <li>
                <a
                  href="#traffic-rules"
                  onClick={(e) => handleLinkClick(e, '#traffic-rules')}
                  className="hover:text-amber-400 transition-colors"
                >
                  Road Signs & Rules
                </a>
              </li>
              <li>
                <a
                  href="#faq"
                  onClick={(e) => handleLinkClick(e, '#faq')}
                  className="hover:text-amber-400 transition-colors"
                >
                  Frequently Asked Questions
                </a>
              </li>
              <li>
                <a
                  href="/login"
                  onClick={(e) => {
                    if (onLoginClick) {
                      e.preventDefault();
                      onLoginClick();
                    }
                  }}
                  className="text-amber-400 font-semibold hover:underline block pt-1"
                >
                  &rarr; Customer Portal Login
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: Contact & Hours (4 cols) */}
          <div className="lg:col-span-4 space-y-3">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Helpdesk & Timings
            </h4>
            <div className="space-y-2.5 text-xs text-slate-400">
              <div className="flex items-center gap-2 text-slate-300">
                <Phone className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <a href={`tel:${LANDING_DATA.schoolInfo.phone}`} className="hover:text-white">
                  {LANDING_DATA.schoolInfo.phone}
                </a>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Mail className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <a href={`mailto:${LANDING_DATA.schoolInfo.email}`} className="hover:text-white">
                  {LANDING_DATA.schoolInfo.email}
                </a>
              </div>
              <div className="flex items-start gap-2 text-slate-400">
                <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                <span>{LANDING_DATA.schoolInfo.addressLine1}, {LANDING_DATA.schoolInfo.city}</span>
              </div>
              <div className="pt-2 text-[11px] text-slate-400 border-t border-slate-800">
                {LANDING_DATA.schoolInfo.openingHours}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Legal Links */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div>
            &copy; {new Date().getFullYear()} {LANDING_DATA.schoolInfo.name}. All rights reserved.
          </div>
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => setModalType('privacy')}
              className="hover:text-slate-300 underline focus:outline-none"
            >
              Privacy Policy
            </button>
            <button
              type="button"
              onClick={() => setModalType('terms')}
              className="hover:text-slate-300 underline focus:outline-none"
            >
              Terms of Service
            </button>
          </div>
        </div>
      </div>

      {/* Privacy Policy / Terms Modal */}
      {modalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 sm:p-7 space-y-4 shadow-2xl relative max-h-[85vh] overflow-y-auto text-slate-300 text-xs sm:text-sm">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-white font-bold text-base">
                {modalType === 'privacy' ? (
                  <>
                    <Shield className="w-5 h-5 text-amber-400" />
                    <span>Privacy Policy</span>
                  </>
                ) : (
                  <>
                    <FileText className="w-5 h-5 text-blue-400" />
                    <span>Terms of Service</span>
                  </>
                )}
              </div>
              <button
                type="button"
                onClick={() => setModalType(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalType === 'privacy' ? (
              <div className="space-y-3 leading-relaxed">
                <p>
                  At {LANDING_DATA.schoolInfo.name}, we are committed to safeguarding candidate privacy. Student personal contact details and government identity cards collected for RTO licensing are stored securely and never shared with third parties.
                </p>
                <p>
                  Any enquiry submitted through this website is exclusively used by our driving coordinators to answer questions regarding course availability and session scheduling.
                </p>
              </div>
            ) : (
              <div className="space-y-3 leading-relaxed">
                <p>
                  1. <strong>Attendance:</strong> Students are requested to arrive 5 minutes before their scheduled driving class.
                </p>
                <p>
                  2. <strong>Learner’s Licence:</strong> A valid Learner’s Licence is legally mandatory during all practical driving training sessions.
                </p>
                <p>
                  3. <strong>Safety Regulations:</strong> Candidates must strictly comply with instructor safety guidance and wear seatbelts / helmets at all times during training.
                </p>
              </div>
            )}

            <div className="pt-3 flex justify-end">
              <button
                type="button"
                onClick={() => setModalType(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
};
