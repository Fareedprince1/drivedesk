import React from 'react';
import { Calendar, Clock, Check, ArrowRight, Sparkles } from 'lucide-react';
import { LANDING_DATA } from '../../data/landingData';
import type { LandingCourseConfig } from '../../types';

interface CoursesProps {
  onSelectCourse?: (courseTitle: string) => void;
  courses?: LandingCourseConfig[];
}

export const Courses: React.FC<CoursesProps> = ({ onSelectCourse, courses: passedCourses }) => {
  const courseList = passedCourses && passedCourses.length > 0 ? passedCourses : LANDING_DATA.courses;

  const handleEnquire = (courseTitle: string) => {
    if (onSelectCourse) {
      onSelectCourse(courseTitle);
    }
    const contactSection = document.querySelector('#contact');
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section id="courses" className="py-20 md:py-28 bg-slate-900 text-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/60 border border-blue-700/60 text-blue-300 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Structured Training Programs</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            Comprehensive Driving Courses
          </h2>
          <p className="text-base sm:text-lg text-slate-300">
            Tailored step-by-step curricula for absolute beginners, two-wheeler riders, and licensed drivers seeking confidence.
          </p>
        </div>

        {/* Course Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
          {courseList.map((course) => {
            const isFeatured = course.isPopular;

            return (
              <div
                key={course.id}
                className={`flex flex-col rounded-2xl overflow-hidden transition-all duration-300 group ${
                  isFeatured
                    ? 'bg-slate-800/90 border-2 border-amber-400 shadow-xl shadow-amber-500/10 lg:-translate-y-2'
                    : 'bg-slate-800/60 border border-slate-700/80 hover:border-blue-500/60 shadow-lg'
                }`}
              >
                {/* Course Photo with Overlay Badge */}
                <div className="relative h-48 overflow-hidden bg-slate-900">
                  <img
                    src={course.imageUrl}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />

                  {/* Badge */}
                  <div className="absolute top-3 left-3">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                        isFeatured
                          ? 'bg-amber-400 text-slate-950 shadow-md'
                          : 'bg-blue-900/90 text-blue-200 border border-blue-700/60'
                      }`}
                    >
                      {course.badge}
                    </span>
                  </div>
                </div>

                {/* Course Content Details */}
                <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-xl sm:text-2xl font-bold text-white group-hover:text-amber-400 transition-colors">
                      {course.title}
                    </h3>
                    <p className="text-sm text-slate-300 leading-relaxed">
                      {course.description}
                    </p>

                    {/* Duration & Sessions Metadata */}
                    <div className="grid grid-cols-1 gap-2.5 py-3 border-y border-slate-700/60 text-xs sm:text-sm text-slate-200">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>Duration: <strong className="text-white">{course.duration}</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-400 shrink-0" />
                        <span>Sessions: <strong className="text-white">{course.sessions}</strong></span>
                      </div>
                    </div>

                    {/* Features checklist */}
                    <div className="space-y-2 pt-1">
                      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Key Inclusions:
                      </div>
                      <ul className="space-y-2">
                        {course.features.map((feat, idx) => (
                          <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-300">
                            <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                              <Check className="w-3 h-3" />
                            </span>
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Fee Placeholder and Enquire CTA */}
                  <div className="pt-4 border-t border-slate-700/80 space-y-4">
                    <div className="flex items-baseline justify-between">
                      <div>
                        <span className="text-[11px] text-slate-400 block uppercase font-medium">Estimated Fee</span>
                        <span className="text-2xl font-black text-amber-400">{course.fee}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 bg-slate-900 px-2 py-1 rounded border border-slate-700">
                        All-Inclusive
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleEnquire(course.title)}
                      className={`w-full py-3.5 px-5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-95 ${
                        isFeatured
                          ? 'bg-amber-400 text-slate-950 hover:bg-amber-300 shadow-md shadow-amber-500/20'
                          : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20'
                      }`}
                    >
                      <span>Enquire for this Course</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
