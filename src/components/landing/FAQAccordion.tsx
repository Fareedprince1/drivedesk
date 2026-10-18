import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { LANDING_DATA } from '../../data/landingData';
import type { LandingFAQConfig } from '../../types';

interface FAQAccordionProps {
  faqs?: LandingFAQConfig[];
}

export const FAQAccordion: React.FC<FAQAccordionProps> = ({ faqs: passedFaqs }) => {
  const faqList = passedFaqs && passedFaqs.length > 0 ? passedFaqs : LANDING_DATA.faqs;
  const [openId, setOpenId] = useState<string | null>(faqList[0]?.id || null);

  const toggleFAQ = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <section id="faq" className="py-20 md:py-28 bg-slate-950 text-white relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/40 border border-blue-700/60 text-blue-300 text-xs font-semibold uppercase tracking-wider">
            <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>Got Questions?</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-base sm:text-lg text-slate-300">
            Clear answers about course fees, session formats, licence documentation, and class policies.
          </p>
        </div>

        {/* Questions Accordion List */}
        <div className="space-y-4">
          {faqList.map((faq, index) => {
            const isOpen = openId === faq.id;

            return (
              <div
                key={faq.id}
                className={`rounded-2xl transition-all border overflow-hidden ${
                  isOpen
                    ? 'bg-slate-900/95 border-amber-400/60 shadow-xl shadow-amber-500/5'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleFAQ(faq.id)}
                  className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 focus:outline-none"
                  aria-expanded={isOpen}
                >
                  <div className="flex items-center gap-3.5">
                    <span className="w-7 h-7 rounded-lg bg-slate-800 text-slate-400 font-bold text-xs flex items-center justify-center shrink-0 border border-slate-700">
                      0{index + 1}
                    </span>
                    <span className="text-base sm:text-lg font-bold text-white hover:text-amber-300 transition-colors">
                      {faq.question}
                    </span>
                  </div>

                  <div className="shrink-0 p-1.5 rounded-lg bg-slate-800/80 text-amber-400">
                    {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 pb-6 sm:px-6 sm:pb-6 pt-1 text-sm sm:text-base text-slate-300 border-t border-slate-800/80 leading-relaxed space-y-2">
                    <p>{faq.answer}</p>
                    {faq.category && (
                      <span className="inline-block mt-2 text-[11px] font-semibold text-blue-400 bg-blue-950/60 px-2.5 py-1 rounded-md border border-blue-900/50">
                        Topic: {faq.category}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Need more help banner */}
        <div className="mt-12 text-center p-6 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-left space-y-0.5">
            <span className="text-sm font-bold text-white">Have a specific question not listed here?</span>
            <p className="text-xs text-slate-400">Our front desk team is happy to assist you directly over the phone.</p>
          </div>
          <a
            href={`tel:${LANDING_DATA.schoolInfo.phone}`}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-400 text-slate-950 hover:bg-amber-300 transition-all shrink-0 shadow-sm"
          >
            Call Helpdesk ({LANDING_DATA.schoolInfo.phone})
          </a>
        </div>
      </div>
    </section>
  );
};
