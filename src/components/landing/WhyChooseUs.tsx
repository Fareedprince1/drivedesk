import React from 'react';
import { Award, Clock, ShieldCheck, BarChart3, FileCheck, HeartHandshake, CheckCircle } from 'lucide-react';
import { LANDING_DATA, type WhyUsItem } from '../../data/landingData';

export const WhyChooseUs: React.FC = () => {
  const getIcon = (iconName: WhyUsItem['iconName']) => {
    switch (iconName) {
      case 'Award':
        return <Award className="w-6 h-6 text-amber-400" />;
      case 'Clock':
        return <Clock className="w-6 h-6 text-amber-400" />;
      case 'ShieldCheck':
        return <ShieldCheck className="w-6 h-6 text-amber-400" />;
      case 'BarChart3':
        return <BarChart3 className="w-6 h-6 text-amber-400" />;
      case 'FileCheck':
        return <FileCheck className="w-6 h-6 text-amber-400" />;
      case 'HeartHandshake':
        return <HeartHandshake className="w-6 h-6 text-amber-400" />;
      default:
        return <CheckCircle className="w-6 h-6 text-amber-400" />;
    }
  };

  return (
    <section id="why-us" className="py-20 md:py-28 bg-slate-950 text-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/40 border border-blue-700/60 text-blue-300 text-xs font-semibold uppercase tracking-wider">
            <span>Why Train With Us</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            Designed for Nervous Beginners to Confident Drivers
          </h2>
          <p className="text-base sm:text-lg text-slate-300">
            We focus on stress-free safety habits, defensive driving techniques, and individual attention for every learner.
          </p>
        </div>

        {/* 6 Grid Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {LANDING_DATA.whyChooseUs.map((item) => (
            <div
              key={item.id}
              className="p-7 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-blue-600/60 transition-all duration-300 hover:-translate-y-1 shadow-lg hover:shadow-blue-900/10 flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-blue-950/80 border border-blue-800/60 flex items-center justify-center">
                  {getIcon(item.iconName)}
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  {item.title}
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
