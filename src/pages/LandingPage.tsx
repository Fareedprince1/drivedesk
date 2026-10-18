import React, { useState } from 'react';
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

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCourseForEnquiry, setSelectedCourseForEnquiry] = useState<string>('Four-Wheeler Comprehensive');

  const handleLoginClick = () => {
    navigate('/login');
  };

  const handleCourseSelect = (courseTitle: string) => {
    setSelectedCourseForEnquiry(courseTitle);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-400 selection:text-slate-950 overflow-x-hidden">
      {/* 1. Header (Sticky Nav with Customer Login & Hamburger) */}
      <Header onLoginClick={handleLoginClick} />

      <main className="flex-1">
        {/* 2. Hero Section */}
        <Hero
          onLoginClick={handleLoginClick}
          onExploreClick={() => {
            document.querySelector('#courses')?.scrollIntoView({ behavior: 'smooth' });
          }}
        />

        {/* 3. Courses (3 cards with duration, sessions, fees, Enquire CTA) */}
        <Courses onSelectCourse={handleCourseSelect} />

        {/* 4. Why Choose Us (6 feature points with icons) */}
        <WhyChooseUs />

        {/* 5. How It Works (4 sequential steps: Enquire -> Customer ID -> Login -> Manage) */}
        <HowItWorks
          onLoginClick={handleLoginClick}
          onEnquireClick={() => {
            document.querySelector('#contact')?.scrollIntoView({ behavior: 'smooth' });
          }}
        />

        {/* 6. Traffic Rules Preview (Road signs cards + Learn More modal) */}
        <TrafficRulesPreview />

        {/* 7. Testimonials (Marked clearly as Sample - replace with real reviews) */}
        <Testimonials />

        {/* 8. FAQ Accordion (5 key questions) */}
        <FAQAccordion />

        {/* 9. Contact & Quick Enquiry Form */}
        <ContactSection selectedCourse={selectedCourseForEnquiry} />
      </main>

      {/* 10. Footer */}
      <Footer onLoginClick={handleLoginClick} />
    </div>
  );
};
