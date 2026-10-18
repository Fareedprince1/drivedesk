import React from 'react';
import { Send, KeyRound, LogIn, CalendarCheck, ArrowRight } from 'lucide-react';
import { LANDING_DATA } from '../../data/landingData';

interface HowItWorksProps {
  onLoginClick?: () => void;
  onEnquireClick?: () => void;
}

export const HowItWorks: React.FC<HowItWorksProps> = ({ onLoginClick, onEnquireClick }) => {
  const getStepIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Send className="w-5 h-5 text-amber-400" />;
      case 1:
        return <KeyRound className="w-5 h-5 text-amber-400" />;
      case 2:
        return <LogIn className="w-5 h-5 text-amber-400" />;
      case 3:
        return <CalendarCheck className="w-5 h-5 text-amber-400" />;
      default:
        return <Send className="w-5 h-5 text-amber-400" />;
    }
  };

  return (
    <section id="how-it-works" className="py-20 md:py-28 bg-slate-900 text-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/50 border border-blue-700/60 text-blue-300 text-xs font-semibold uppercase tracking-wider">
            <span>Seamless 4-Step Process</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            How It Works
          </h2>
          <p className="text-base sm:text-lg text-slate-300">
            From submitting your initial enquiry to passing your official driving test, here is your smooth learning journey.
          </p>
        </div>

        {/* 4 Steps Timeline Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {LANDING_DATA.howItWorks.map((step, idx) => (
            <div
              key={step.stepNumber}
              className="relative p-6 sm:p-7 rounded-2xl bg-slate-800/80 border border-slate-700/80 hover:border-amber-400/50 transition-all duration-300 flex flex-col justify-between group shadow-lg"
            >
              {/* Step Number & Badge */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center">
                    {getStepIcon(idx)}
                  </div>
                  <span className="text-3xl font-black text-slate-600 group-hover:text-amber-400/40 transition-colors">
                    {step.stepNumber}
                  </span>
                </div>

                <div className="space-y-2">
                  <span className="inline-block text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                    {step.badge}
                  </span>
                  <h3 className="text-lg font-bold text-white group-hover:text-amber-300 transition-colors">
                    {step.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {step.shortDesc}
                  </p>
                </div>
              </div>

              {/* Step Details Note */}
              <div className="mt-5 pt-3 border-t border-slate-700/60 text-[11px] text-slate-400">
                {step.details}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA Row */}
        <div className="mt-14 p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-blue-950 via-slate-900 to-slate-950 border border-blue-900 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
          <div className="space-y-1">
            <h4 className="text-lg sm:text-xl font-bold text-white">
              Ready to begin your driving lessons?
            </h4>
            <p className="text-xs sm:text-sm text-slate-300">
              Submit your enquiry online or log into your active customer dashboard.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a
              href="#contact"
              onClick={(e) => {
                if (onEnquireClick) {
                  e.preventDefault();
                  onEnquireClick();
                } else {
                  e.preventDefault();
                  document.querySelector('#contact')?.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="px-6 py-3 rounded-xl text-sm font-bold bg-amber-400 text-slate-950 hover:bg-amber-300 transition-all shadow-md active:scale-95"
            >
              Enquire Now
            </a>
            <a
              href="/login"
              onClick={(e) => {
                if (onLoginClick) {
                  e.preventDefault();
                  onLoginClick();
                }
              }}
              className="px-6 py-3 rounded-xl text-sm font-semibold bg-slate-800 text-slate-200 hover:text-white hover:bg-slate-700 border border-slate-700 transition-all active:scale-95 flex items-center gap-2"
            >
              <span>Customer Login</span>
              <ArrowRight className="w-4 h-4 text-amber-400" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
