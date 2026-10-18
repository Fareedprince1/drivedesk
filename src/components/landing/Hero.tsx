import React from 'react';
import { ArrowRight, LogIn, ShieldCheck, Award, Star, CheckCircle2 } from 'lucide-react';
import { LANDING_DATA } from '../../data/landingData';
import type { LandingPageConfig } from '../../types';

interface HeroProps {
  onLoginClick?: () => void;
  onExploreClick?: () => void;
  config?: LandingPageConfig;
}

export const Hero: React.FC<HeroProps> = ({ onLoginClick, onExploreClick, config }) => {
  const handleScrollTo = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.querySelector(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const badgeText = config?.hero?.badge || 'Govt. Approved Driving Academy • Admissions Open';
  const headline = config?.hero?.headline || 'Learn to Drive with';
  const highlightWord = config?.hero?.highlightWord || 'Confidence';
  const subheadline = config?.hero?.subheadline || config?.tagline || LANDING_DATA.schoolInfo.subheadline;

  return (
    <section
      id="hero"
      className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-blue-950 text-white"
    >
      {/* Background Subtle Ambient Glows matching Logo Blue and Amber Accent */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-20 right-10 w-72 h-72 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Headline, Subheadline & Action Buttons */}
          <div className="lg:col-span-7 text-center lg:text-left space-y-6">
            {/* Top Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-900/60 border border-blue-700/60 text-blue-200 text-xs sm:text-sm font-medium shadow-sm backdrop-blur-sm">
              <span className="flex h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
              <span>{badgeText}</span>
            </div>

            {/* Big Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.15]">
              {headline} <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-200">
                {highlightWord}
              </span>
            </h1>

            {/* Subheadline line below headline */}
            <p className="text-base sm:text-lg lg:text-xl text-slate-300 max-w-2xl mx-auto lg:mx-0 font-normal leading-relaxed">
              {subheadline}
            </p>

            {/* Two Main Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <a
                href="#courses"
                onClick={(e) => {
                  if (onExploreClick) {
                    e.preventDefault();
                    onExploreClick();
                  } else {
                    handleScrollTo(e, '#courses');
                  }
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-4 rounded-xl text-base font-bold bg-amber-400 text-slate-950 hover:bg-amber-300 active:scale-95 shadow-lg shadow-amber-500/25 transition-all focus:ring-4 focus:ring-amber-400/40"
              >
                <span>Explore Courses</span>
                <ArrowRight className="w-5 h-5" />
              </a>

              <a
                href="/login"
                onClick={(e) => {
                  if (onLoginClick) {
                    e.preventDefault();
                    onLoginClick();
                  }
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-4 rounded-xl text-base font-semibold bg-slate-800/90 text-white hover:bg-slate-700/90 hover:text-amber-300 border border-slate-700 active:scale-95 transition-all shadow-md focus:ring-4 focus:ring-slate-700/50"
              >
                <LogIn className="w-5 h-5 text-amber-400" />
                <span>Customer Login</span>
              </a>
            </div>

            {/* Trust checkmarks row */}
            <div className="pt-4 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs sm:text-sm text-slate-300 border-t border-slate-800/80">
              <div className="flex items-center justify-center lg:justify-start gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Dual-control safety</span>
              </div>
              <div className="flex items-center justify-center lg:justify-start gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>RTO slot assistance</span>
              </div>
              <div className="flex items-center justify-center lg:justify-start gap-1.5 col-span-2 sm:col-span-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Patient instructors</span>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Driving Photo with Overlay Badges */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              {/* Outer decorative ring */}
              <div className="absolute -inset-1.5 bg-gradient-to-tr from-amber-400 via-blue-600 to-indigo-600 rounded-3xl blur-md opacity-40 group-hover:opacity-60 transition duration-1000" />

              {/* Main Photo Container */}
              <div className="relative rounded-2xl overflow-hidden bg-slate-800 border-2 border-slate-700/80 shadow-2xl aspect-[4/3] sm:aspect-[16/11]">
                <img
                  src="https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?q=80&w=1200&auto=format&fit=crop"
                  alt="Student driver holding steering wheel with instructor guidance"
                  className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700"
                  loading="eager"
                />
                {/* Gradient tint */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />

                {/* Driving Photo Caption Label */}
                <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-[11px] text-slate-300 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/60">
                  <span className="font-medium">Practical On-Road Driving Training</span>
                  <span className="text-amber-400 font-semibold">1-on-1 Session</span>
                </div>
              </div>

              {/* Floating Badge 1: Top Right - 5-Star Experience */}
              <div className="absolute -top-4 -right-2 sm:-right-4 bg-slate-900/95 backdrop-blur-md border border-slate-700 px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
                  <Star className="w-5 h-5 fill-amber-400" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1">
                    5.0 Star Rated
                  </div>
                  <div className="text-[10px] text-slate-300">Certified Learning</div>
                </div>
              </div>

              {/* Floating Badge 2: Bottom Left - Dual Control Safety */}
              <div className="absolute -bottom-5 -left-2 sm:-left-4 bg-slate-900/95 backdrop-blur-md border border-slate-700 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Dual-Control Car Fleet</div>
                  <div className="text-[10px] text-slate-300">100% Safety Assured</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
