import React, { useState } from 'react';
import { BookOpen, AlertTriangle, ShieldAlert, Info, X, Check } from 'lucide-react';
import { LANDING_DATA, type TrafficSignItem } from '../../data/landingData';

export const TrafficRulesPreview: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<'All' | 'Mandatory' | 'Cautionary' | 'Informatory'>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredSigns = selectedCategory === 'All'
    ? LANDING_DATA.trafficSigns
    : LANDING_DATA.trafficSigns.filter((s) => s.category === selectedCategory);

  const renderSignGraphic = (sign: TrafficSignItem) => {
    switch (sign.iconType) {
      case 'stop':
        return (
          <div className="w-16 h-16 rounded-xl bg-red-600 flex items-center justify-center text-white font-black text-xs tracking-wider shadow-md border-2 border-white ring-2 ring-red-600/30">
            STOP
          </div>
        );
      case 'giveway':
        return (
          <div className="w-16 h-16 flex items-center justify-center">
            <div className="w-0 h-0 border-l-[32px] border-l-transparent border-r-[32px] border-r-transparent border-t-[54px] border-t-red-600 relative flex items-center justify-center">
              <span className="absolute -top-11 text-[9px] font-black text-white text-center leading-tight">
                GIVE<br />WAY
              </span>
            </div>
          </div>
        );
      case 'speed50':
        return (
          <div className="w-16 h-16 rounded-full border-4 border-red-600 bg-white flex items-center justify-center text-slate-950 font-black text-lg shadow-md">
            50
          </div>
        );
      case 'noUturn':
        return (
          <div className="w-16 h-16 rounded-full border-4 border-red-600 bg-white relative flex items-center justify-center shadow-md">
            <div className="w-7 h-7 border-t-4 border-l-4 border-slate-900 rounded-tl-full rotate-45 transform" />
            <div className="absolute w-12 h-1 bg-red-600 rotate-45" />
          </div>
        );
      case 'pedestrian':
        return (
          <div className="w-16 h-16 flex items-center justify-center">
            <div className="w-0 h-0 border-l-[32px] border-l-transparent border-r-[32px] border-r-transparent border-b-[54px] border-b-amber-500 relative flex items-center justify-center">
              <span className="absolute top-4 text-[9px] font-black text-slate-950">
                CROSS
              </span>
            </div>
          </div>
        );
      case 'parking':
        return (
          <div className="w-16 h-16 rounded-xl bg-blue-600 border-2 border-white flex items-center justify-center text-white font-black text-2xl shadow-md">
            P
          </div>
        );
      default:
        return (
          <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold">
            SIGN
          </div>
        );
    }
  };

  return (
    <section id="traffic-rules" className="py-20 md:py-28 bg-slate-950 text-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/40 border border-blue-700/60 text-blue-300 text-xs font-semibold uppercase tracking-wider">
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span>Road Safety & RTO Test Prep</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            Traffic Rules & Road Signs Preview
          </h2>
          <p className="text-base sm:text-lg text-slate-300">
            A solid understanding of road signs is mandatory for clearing your RTO Learner’s Test and driving safely.
          </p>

          {/* Filter Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            {(['All', 'Mandatory', 'Cautionary', 'Informatory'] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  selectedCategory === cat
                    ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
                }`}
              >
                {cat} Signs
              </button>
            ))}
          </div>
        </div>

        {/* Traffic Signs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSigns.map((sign) => {
            return (
              <div
                key={sign.id}
                className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all flex items-center gap-5 shadow-lg group"
              >
                {/* Visual Sign Graphic */}
                <div className="shrink-0 flex items-center justify-center p-2 rounded-xl bg-slate-950 border border-slate-800 group-hover:scale-105 transition-transform">
                  {renderSignGraphic(sign)}
                </div>

                {/* Text Content */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                        sign.category === 'Mandatory'
                          ? 'bg-red-900/60 text-red-300 border border-red-700/60'
                          : sign.category === 'Cautionary'
                          ? 'bg-amber-900/60 text-amber-300 border border-amber-700/60'
                          : 'bg-blue-900/60 text-blue-300 border border-blue-700/60'
                      }`}
                    >
                      {sign.category}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white group-hover:text-amber-400 transition-colors">
                    {sign.name}
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {sign.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Learn More Button */}
        <div className="mt-12 text-center">
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-sm font-bold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 hover:border-amber-400/50 shadow-md transition-all active:scale-95"
          >
            <BookOpen className="w-4 h-4 text-amber-400" />
            <span>Learn More About Road Safety & Signs</span>
          </button>
        </div>
      </div>

      {/* Learn More Information Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-900/50 border border-blue-700/60 flex items-center justify-center text-amber-400">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Understanding Indian Road Signs</h3>
                  <p className="text-xs text-slate-400">Essential knowledge for RTO test & safe driving</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-sm text-slate-300">
              <div className="p-4 rounded-xl bg-red-950/30 border border-red-900/50 space-y-1">
                <div className="flex items-center gap-2 font-bold text-red-400">
                  <ShieldAlert className="w-4 h-4" />
                  <span>1. Mandatory / Regulatory Signs (Circular with Red Border)</span>
                </div>
                <p className="text-xs text-slate-300">
                  Violation of these signs is a punishable traffic offense. Examples include Stop, No Entry, Speed Limits, and No Parking.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-900/50 space-y-1">
                <div className="flex items-center gap-2 font-bold text-amber-400">
                  <AlertTriangle className="w-4 h-4" />
                  <span>2. Cautionary / Warning Signs (Triangular with Red Border)</span>
                </div>
                <p className="text-xs text-slate-300">
                  Alerts drivers to impending road conditions such as sharp curves, steep inclines, school zones, and pedestrian crossings.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-blue-950/30 border border-blue-900/50 space-y-1">
                <div className="flex items-center gap-2 font-bold text-blue-400">
                  <Info className="w-4 h-4" />
                  <span>3. Informatory Signs (Rectangular with Blue / Green)</span>
                </div>
                <p className="text-xs text-slate-300">
                  Provides helpful navigation information such as hospital locations, petrol stations, parking bays, and public transit stops.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-300 space-y-2">
                <span className="font-bold text-white block">Our Theory & Simulator Classes Include:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Mock RTO computer test practice</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Right of way at roundabouts</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Hand signals and lane discipline</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Defensive night driving habits</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-sm font-bold shadow-md"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
