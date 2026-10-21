import React, { useState, useEffect } from 'react';
import { Send, Phone, Mail, MapPin, Clock, CheckCircle2, AlertCircle, MessageSquare } from 'lucide-react';
import { LANDING_DATA } from '../../data/landingData';
import { db } from '../../lib/storage';
import type { LandingPageConfig } from '../../types';

interface ContactSectionProps {
  selectedCourse?: string;
  config?: LandingPageConfig;
}

export const ContactSection: React.FC<ContactSectionProps> = ({ selectedCourse, config }) => {
  const availableCourses =
    config?.courses && config.courses.length > 0
      ? config.courses
      : LANDING_DATA.courses;

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    course: selectedCourse || availableCourses[0]?.title || 'Four-Wheeler Comprehensive',
    message: '',
  });

  const schoolName = config?.schoolName || LANDING_DATA.schoolInfo.name;
  const addressLine1 = config?.addressLine1 || LANDING_DATA.schoolInfo.addressLine1;
  const addressLine2 = config?.addressLine2 || LANDING_DATA.schoolInfo.addressLine2;
  const city = config?.city || LANDING_DATA.schoolInfo.city;
  const phone = config?.phone || LANDING_DATA.schoolInfo.phone;
  const altPhone = config?.altPhone || LANDING_DATA.schoolInfo.altPhone;
  const email = config?.email || LANDING_DATA.schoolInfo.email;
  const openingHours = config?.openingHours || LANDING_DATA.schoolInfo.openingHours;
  const operatingDays = config?.operatingDays || LANDING_DATA.schoolInfo.operatingDays;
  const whatsappNumber = config?.whatsappNumber || LANDING_DATA.schoolInfo.whatsappNumber;

  const [submittedInfo, setSubmittedInfo] = useState<{ name: string; phone: string; course: string } | null>(null);

  useEffect(() => {
    if (selectedCourse) {
      setFormData((prev) => ({ ...prev, course: selectedCourse }));
    }
  }, [selectedCourse]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    const cleanPhone = formData.phone.replace(/[^0-9]/g, '');
    if (!cleanPhone) {
      newErrors.phone = 'Phone number is required';
    } else if (cleanPhone.length < 10) {
      newErrors.phone = 'Please enter a valid 10-digit mobile number';
    }

    if (!formData.course) {
      newErrors.course = 'Please select a course';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      db.addEnquiry({
        full_name: formData.name,
        phone: formData.phone,
        course_interest: formData.course,
        message: formData.message,
      });
    } catch (err) {
      console.error('Error saving enquiry to db:', err);
    }

    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      setSubmittedInfo({
        name: formData.name,
        phone: formData.phone,
        course: formData.course,
      });
      setFormData({
        name: '',
        phone: '',
        course: selectedCourse || availableCourses[0]?.title || 'Four-Wheeler Comprehensive',
        message: '',
      });
    }, 400);
  };

  return (
    <section id="contact" className="py-20 md:py-28 bg-slate-900 text-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/50 border border-blue-700/60 text-blue-300 text-xs font-semibold uppercase tracking-wider">
            <Mail className="w-3.5 h-3.5 text-amber-400" />
            <span>Admissions & Support</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            Contact & Quick Enquiry
          </h2>
          <p className="text-base sm:text-lg text-slate-300">
            Have a question or ready to book your first lesson? Send us a message or visit our academy.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          {/* Left Column: Contact Details Cards */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-7 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-6 shadow-xl">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 block mb-1">
                  Driving Academy Campus
                </span>
                <h3 className="text-2xl font-bold text-white">
                  {schoolName}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Official training branch & student desk
                </p>
              </div>

              {/* Contact Information Items */}
              <div className="space-y-4 text-sm text-slate-300">
                {/* Address */}
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-950 border border-blue-800/80 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">Location / Address:</span>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                      {addressLine1},<br />
                      {addressLine2 ? <>{addressLine2},<br /></> : null}
                      {city}
                    </p>
                  </div>
                </div>

                {/* Phone Numbers */}
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-950 border border-blue-800/80 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">Phone / Helpline:</span>
                    <a
                      href={`tel:${phone}`}
                      className="text-amber-400 hover:underline font-semibold block"
                    >
                      {phone}
                    </a>
                    {altPhone && (
                      <a
                        href={`tel:${altPhone}`}
                        className="text-xs text-slate-400 hover:text-white"
                      >
                        Alt: {altPhone}
                      </a>
                    )}
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-950 border border-blue-800/80 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">Email Enquiry:</span>
                    <a
                      href={`mailto:${email}`}
                      className="text-slate-200 hover:text-amber-400 font-medium"
                    >
                      {email}
                    </a>
                  </div>
                </div>

                {/* Working Hours */}
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-950 border border-blue-800/80 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">Opening Hours:</span>
                    <p className="text-xs text-slate-300">
                      {openingHours}
                    </p>
                    <span className="text-[11px] font-semibold text-emerald-400 block mt-0.5">
                      {operatingDays}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Enquiry Form */}
          <div className="lg:col-span-7">
            <div className="p-7 sm:p-9 rounded-2xl bg-slate-800/90 border border-slate-700 shadow-2xl relative">
              <h3 className="text-2xl font-bold text-white tracking-tight mb-2">
                Send an Enquiry
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 mb-6">
                Fill this form and our admission coordinator will call you back within 2 hours.
              </p>

              {isSubmitted ? (
                <div className="p-6 rounded-2xl bg-emerald-950/40 border border-emerald-600/60 text-center space-y-4 animate-in fade-in">
                  <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h4 className="text-xl font-bold text-white">
                    Thank You! Enquiry Submitted
                  </h4>
                  <p className="text-sm text-slate-300 max-w-md mx-auto">
                    We have received your details for <strong>{submittedInfo?.course || 'Driving Course'}</strong>. Our admissions coordinator will reach out to you shortly.
                  </p>

                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <a
                      href={`https://wa.me/${LANDING_DATA.schoolInfo.whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                        `Hi Gem Driving School, I submitted an enquiry on your website for "${submittedInfo?.course || 'Driving Course'}". My name is ${submittedInfo?.name || ''} (${submittedInfo?.phone || ''}).`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md active:scale-95 transition-all"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Chat on WhatsApp Now</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => setIsSubmitted(false)}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700"
                    >
                      Submit Another Enquiry
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                  {/* Full Name */}
                  <div>
                    <label htmlFor="name" className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-1.5">
                      Your Full Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      placeholder="e.g. John Doe"
                      value={formData.name}
                      onChange={(e) => {
                        setFormData({ ...formData, name: e.target.value });
                        if (errors.name) setErrors({ ...errors, name: '' });
                      }}
                      className={`w-full px-4 py-3 rounded-xl bg-slate-900 border text-white placeholder-slate-500 focus:outline-none text-sm transition-all ${
                        errors.name
                          ? 'border-red-500 ring-1 ring-red-500'
                          : 'border-slate-700 focus:border-amber-400 focus:ring-1 focus:ring-amber-400'
                      }`}
                    />
                    {errors.name && (
                      <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>{errors.name}</span>
                      </p>
                    )}
                  </div>

                  {/* Phone Number */}
                  <div>
                    <label htmlFor="phone" className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-1.5">
                      Mobile Number (10 Digits) *
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      placeholder="e.g. 9876543210"
                      maxLength={14}
                      value={formData.phone}
                      onChange={(e) => {
                        setFormData({ ...formData, phone: e.target.value });
                        if (errors.phone) setErrors({ ...errors, phone: '' });
                      }}
                      className={`w-full px-4 py-3 rounded-xl bg-slate-900 border text-white placeholder-slate-500 focus:outline-none text-sm transition-all ${
                        errors.phone
                          ? 'border-red-500 ring-1 ring-red-500'
                          : 'border-slate-700 focus:border-amber-400 focus:ring-1 focus:ring-amber-400'
                      }`}
                    />
                    {errors.phone && (
                      <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>{errors.phone}</span>
                      </p>
                    )}
                  </div>

                  {/* Course Dropdown */}
                  <div>
                    <label htmlFor="course" className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-1.5">
                      Interested Driving Course *
                    </label>
                    <select
                      id="course"
                      name="course"
                      value={formData.course}
                      onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-sm"
                    >
                      {availableCourses.map((c) => (
                        <option key={c.id} value={c.title}>
                          {c.title} — {c.duration} ({c.fee})
                        </option>
                      ))}
                      <option value="Learners Licence (LL) Assistance Only">
                        Learner’s Licence (LL) Assistance Only
                      </option>
                      <option value="Driving Licence (DL) Renewal / Endorsement">
                        Driving Licence (DL) Renewal / Endorsement
                      </option>
                    </select>
                  </div>

                  {/* Message */}
                  <div>
                    <label htmlFor="message" className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-1.5">
                      Preferred Timings or Questions (Optional)
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows={3}
                      placeholder="e.g. I prefer 7 AM morning slot before office, or weekend training only..."
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-sm resize-none"
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 rounded-xl text-base font-bold bg-amber-400 text-slate-950 hover:bg-amber-300 active:scale-95 transition-all shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                        <span>Sending Enquiry...</span>
                      </span>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        <span>Submit Enquiry</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
