import React from 'react';
import { Star, MessageSquareQuote, CheckCircle2 } from 'lucide-react';
import { LANDING_DATA } from '../../data/landingData';
import type { LandingTestimonialConfig } from '../../types';

interface TestimonialsProps {
  testimonials?: LandingTestimonialConfig[];
}

export const Testimonials: React.FC<TestimonialsProps> = ({ testimonials: passedTestimonials }) => {
  const testimonials = passedTestimonials && passedTestimonials.length > 0 ? passedTestimonials : LANDING_DATA.testimonials;

  return (
    <section id="testimonials" className="py-20 md:py-28 bg-slate-900 text-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/50 border border-blue-700/60 text-blue-300 text-xs font-semibold uppercase tracking-wider">
            <MessageSquareQuote className="w-3.5 h-3.5 text-amber-400" />
            <span>Student Experiences</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            Hear From Our Learners
          </h2>
          <p className="text-base sm:text-lg text-slate-300">
            Real feedback from graduates who learned to drive independently and passed their RTO driving tests.
          </p>
        </div>

        {/* Testimonials Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-6">
          {testimonials.map((test) => (
            <div
              key={test.id}
              className="p-6 rounded-2xl bg-slate-800/80 border border-slate-700 hover:border-amber-400/40 transition-all flex flex-col justify-between space-y-5 shadow-lg group relative"
            >
              {/* Verified Badge */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 uppercase flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>Verified Graduate</span>
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  {test.date}
                </span>
              </div>

              {/* Star Rating */}
              <div className="flex items-center gap-1">
                {[...Array(test.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>

              {/* Comment text */}
              <blockquote className="text-sm text-slate-300 italic leading-relaxed flex-1">
                &ldquo;{test.comment}&rdquo;
              </blockquote>

              {/* Author Info */}
              <div className="pt-4 border-t border-slate-700/80 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-700 to-indigo-600 text-white font-bold text-sm flex items-center justify-center border border-blue-400/40 shrink-0">
                  {test.author.charAt(0)}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors truncate">
                    {test.author}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">
                    {test.role} &bull; <span className="text-blue-300 font-medium">{test.course}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
