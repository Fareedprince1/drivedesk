import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/landing/Header';
import { Hero } from '../components/landing/Hero';
import { Courses } from '../components/landing/Courses';
import { WhyChooseUs } from '../components/landing/WhyChooseUs';
import { HowItWorks } from '../components/landing/HowItWorks';
import { TrafficRulesPreview } from '../components/landing/TrafficRulesPreview';
import { Testimonials } from '../components/landing/Testimonials';
import { FAQAccordion } from '../components/landing/FAQAccordion';
import { ContactSection } from '../components/landing/ContactSection';
import { Footer } from '../components/landing/Footer';
import { db } from '../lib/storage';
import type { LandingPageConfig } from '../types';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [landingConfig, setLandingConfig] = useState<LandingPageConfig>(() => db.getLandingConfig());
  const [selectedCourseForEnquiry, setSelectedCourseForEnquiry] = useState<string>('Four-Wheeler Comprehensive');

  useEffect(() => {
    const handleUpdate = () => {
      setLandingConfig(db.getLandingConfig());
    };
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('drivedesk_sync_complete', handleUpdate);
    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('drivedesk_sync_complete', handleUpdate);
    };
  }, []);

  const handleLoginClick = () => {
    navigate('/login');
  };

  const handleCourseSelect = (courseTitle: string) => {
    setSelectedCourseForEnquiry(courseTitle);
  };

  const sections = landingConfig.sections || {
    hero: true,
    courses: true,
    whyUs: true,
    howItWorks: true,
    trafficRules: true,
    testimonials: true,
    faq: true,
    contact: true,
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-400 selection:text-slate-950 overflow-x-hidden">
      {/* 1. Header (Sticky Nav with Customer Login / Admin Portal & Hamburger) */}
      <Header onLoginClick={handleLoginClick} config={landingConfig} />

      <main className="flex-1">
        {/* 2. Hero Section */}
        {sections.hero !== false && (
          <Hero
            onLoginClick={handleLoginClick}
            config={landingConfig}
            onExploreClick={() => {
              document.querySelector('#courses')?.scrollIntoView({ behavior: 'smooth' });
            }}
          />
        )}

        {/* 3. Courses */}
        {sections.courses !== false && (
          <Courses
            courses={landingConfig.courses}
            onSelectCourse={handleCourseSelect}
          />
        )}

        {/* 4. Why Choose Us */}
        {sections.whyUs !== false && (
          <WhyChooseUs />
        )}

        {/* 5. How It Works */}
        {sections.howItWorks !== false && (
          <HowItWorks
            onLoginClick={handleLoginClick}
            onEnquireClick={() => {
              document.querySelector('#contact')?.scrollIntoView({ behavior: 'smooth' });
            }}
          />
        )}

        {/* 6. Traffic Rules Preview */}
        {sections.trafficRules !== false && (
          <TrafficRulesPreview />
        )}

        {/* 7. Testimonials */}
        {sections.testimonials !== false && (
          <Testimonials
            testimonials={landingConfig.testimonials}
          />
        )}

        {/* 8. FAQ Accordion */}
        {sections.faq !== false && (
          <FAQAccordion
            faqs={landingConfig.faqs}
          />
        )}

        {/* 9. Contact & Quick Enquiry Form */}
        {sections.contact !== false && (
          <ContactSection
            config={landingConfig}
            selectedCourse={selectedCourseForEnquiry}
          />
        )}
      </main>

      {/* 10. Footer */}
      <Footer onLoginClick={handleLoginClick} config={landingConfig} />
    </div>
  );
};
