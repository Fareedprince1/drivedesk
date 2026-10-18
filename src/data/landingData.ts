export interface CourseItem {
  id: string;
  title: string;
  badge: string;
  isPopular?: boolean;
  description: string;
  duration: string;
  sessions: string;
  fee: string; // Clearly marked placeholder
  features: string[];
  imageUrl: string;
}

export interface WhyUsItem {
  id: string;
  iconName: 'Award' | 'Clock' | 'ShieldCheck' | 'BarChart3' | 'FileCheck' | 'HeartHandshake';
  title: string;
  description: string;
}

export interface HowItWorksStep {
  stepNumber: string;
  title: string;
  shortDesc: string;
  details: string;
  badge: string;
}

export interface TrafficSignItem {
  id: string;
  name: string;
  category: 'Mandatory' | 'Cautionary' | 'Informatory';
  description: string;
  shape: 'circle' | 'triangle' | 'octagon' | 'square';
  colorTheme: 'red' | 'amber' | 'blue';
  iconType: 'stop' | 'speed50' | 'pedestrian' | 'giveway' | 'noUturn' | 'parking';
}

export interface TestimonialItem {
  id: string;
  author: string;
  role: string;
  course: string;
  rating: number;
  date: string;
  comment: string;
  isSampleBadge: boolean;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category?: string;
}

export interface SchoolInfo {
  name: string;
  shortName: string;
  tagline: string;
  subheadline: string;
  logoUrl: string;
  phone: string;
  altPhone: string;
  email: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  openingHours: string;
  operatingDays: string;
  whatsappNumber: string;
}

export const LANDING_DATA = {
  schoolInfo: {
    name: 'GEM DRIVING SCHOOL',
    shortName: 'GEM',
    tagline: 'Learn to Drive with Confidence',
    subheadline:
      'Government authorized driving academy providing patient one-on-one instruction, modern dual-control training cars, and seamless RTO licensing support.',
    logoUrl: '/gem-logo.png',
    phone: '+91 98765 43210',
    altPhone: '+91 98765 43211',
    email: 'contact@gemdrivingschool.com',
    addressLine1: 'Shop No. 12, Ground Floor, Royal Commercial Complex',
    addressLine2: 'Near RTO Regional Office, Main Highway Circle',
    city: 'City Center, Pin - 560001',
    openingHours: 'Mon - Sat: 7:00 AM – 7:00 PM | Sun: 8:00 AM – 1:00 PM',
    operatingDays: 'Open 7 Days a Week (Flexible Batch Times)',
    whatsappNumber: '+919876543210',
  } satisfies SchoolInfo,

  courses: [
    {
      id: 'two-wheeler',
      title: 'Two-Wheeler Training',
      badge: 'Beginner Friendly',
      description: 'Master clutch, balance, road confidence, and figure-8 track test maneuvers.',
      duration: '10 Days',
      sessions: '10 Practical Sessions (30 mins daily)',
      fee: '₹ 2,999 (Placeholder)',
      features: [
        'Geared & Non-Geared vehicle options',
        'Figure-8 & Slalom track practice',
        'Basic road safety & balancing drills',
        'Learner & Driving Licence test guidance',
      ],
      imageUrl: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=800&auto=format&fit=crop',
    },
    {
      id: 'four-wheeler',
      title: 'Four-Wheeler Comprehensive',
      badge: 'Most Popular',
      isPopular: true,
      description: 'Complete training from zero to independent city, highway, and parking mastery.',
      duration: '15 to 20 Days',
      sessions: '15 Practical Classes + Simulator & Theory',
      fee: '₹ 6,499 (Placeholder)',
      features: [
        'Modern dual-control hatchbacks & sedans',
        'Heavy traffic, flyover & night driving',
        'Parallel, reverse & uphill parking drills',
        'Full RTO test slot assistance & vehicle provided',
      ],
      imageUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?q=80&w=800&auto=format&fit=crop',
    },
    {
      id: 'refresher',
      title: 'Executive Refresher Course',
      badge: 'For Licence Holders',
      description: 'Already have a licence but lack highway or tight traffic confidence? Custom tailored.',
      duration: '7 Days',
      sessions: '7 Customized Practical Sessions',
      fee: '₹ 3,499 (Placeholder)',
      features: [
        'Drive in our training car or your personal car',
        'Peak-hour bumper-to-bumper navigation',
        'Tight basement & mall parking mastery',
        'Personalized feedback from senior instructors',
      ],
      imageUrl: 'https://images.unsplash.com/photo-1508974239320-0a029497e820?q=80&w=800&auto=format&fit=crop',
    },
  ] as CourseItem[],

  whyChooseUs: [
    {
      id: 'certified',
      iconName: 'Award',
      title: 'Certified & Patient Instructors',
      description: 'Government certified trainers who specialize in nervous beginners with zero shouting or stress.',
    },
    {
      id: 'flexible',
      iconName: 'Clock',
      title: 'Flexible Morning & Evening Slots',
      description: 'Early morning slots (from 6:00 AM) and evening batches tailored for college students and working professionals.',
    },
    {
      id: 'dual-control',
      iconName: 'ShieldCheck',
      title: 'Dual-Control Training Vehicles',
      description: 'Our fleet is fitted with secondary co-driver brakes and clutch for guaranteed safety at all times.',
    },
    {
      id: 'tracking',
      iconName: 'BarChart3',
      title: 'Digital Progress Tracking',
      description: 'Log into your student account anytime to see remaining sessions, scheduled classes, and test readiness.',
    },
    {
      id: 'rto-help',
      iconName: 'FileCheck',
      title: 'Complete RTO Assistance',
      description: 'End-to-end guidance with Learner’s Licence documentation, online slot booking, and driving test day setup.',
    },
    {
      id: 'safety',
      iconName: 'HeartHandshake',
      title: 'Friendly, Safe Learning Space',
      description: 'Structured step-by-step curriculum with special safety orientation for women and first-time drivers.',
    },
  ] as WhyUsItem[],

  howItWorks: [
    {
      stepNumber: '01',
      title: 'Enquire & Choose Course',
      shortDesc: 'Fill the quick enquiry form or call us to choose your course and preferred time slot.',
      details: 'Select Two-Wheeler, Four-Wheeler, or Refresher based on your learning goals.',
      badge: 'Step 1',
    },
    {
      stepNumber: '02',
      title: 'Get your Customer ID',
      shortDesc: 'Once enrolled, receive your unique student Customer ID via SMS and WhatsApp confirmation.',
      details: 'Your Customer ID is your personal key for class tracking and billing.',
      badge: 'Step 2',
    },
    {
      stepNumber: '03',
      title: 'Log In to Student Portal',
      shortDesc: 'Click "Customer Login" in the header to access your active driving dashboard.',
      details: 'No complicated passwords needed — simple, secure access to your profile.',
      badge: 'Step 3',
    },
    {
      stepNumber: '04',
      title: 'Manage Your Lessons & Test',
      shortDesc: 'View your booked slots, track instructor updates, and get notified for RTO test dates.',
      details: 'Complete your classes confidently with transparent attendance and fee receipts.',
      badge: 'Step 4',
    },
  ] as HowItWorksStep[],

  trafficSigns: [
    {
      id: 'sign-stop',
      name: 'STOP',
      category: 'Mandatory',
      shape: 'octagon',
      colorTheme: 'red',
      iconType: 'stop',
      description: 'Must come to a complete halt before the stop line and proceed only when clear.',
    },
    {
      id: 'sign-giveway',
      name: 'GIVE WAY',
      category: 'Mandatory',
      shape: 'triangle',
      colorTheme: 'red',
      iconType: 'giveway',
      description: 'Yield right of way to traffic on the main road before entering or merging.',
    },
    {
      id: 'sign-speed50',
      name: 'SPEED LIMIT 50',
      category: 'Mandatory',
      shape: 'circle',
      colorTheme: 'red',
      iconType: 'speed50',
      description: 'Do not exceed 50 km/h under normal road conditions.',
    },
    {
      id: 'sign-no-uturn',
      name: 'NO U-TURN',
      category: 'Mandatory',
      shape: 'circle',
      colorTheme: 'red',
      iconType: 'noUturn',
      description: 'U-turns are prohibited at this intersection or median cut.',
    },
    {
      id: 'sign-pedestrian',
      name: 'PEDESTRIAN CROSSING',
      category: 'Cautionary',
      shape: 'triangle',
      colorTheme: 'amber',
      iconType: 'pedestrian',
      description: 'Zebra crossing ahead. Slow down and be ready to stop for pedestrians.',
    },
    {
      id: 'sign-parking',
      name: 'PARKING AREA',
      category: 'Informatory',
      shape: 'square',
      colorTheme: 'blue',
      iconType: 'parking',
      description: 'Designated parking zone. Park within marked bay lines.',
    },
  ] as TrafficSignItem[],

  testimonials: [
    {
      id: 'test-1',
      author: 'Priya Sharma',
      role: 'Software Engineer',
      course: 'Four-Wheeler Comprehensive',
      rating: 5,
      date: 'Recent Student',
      comment:
        'I was terrified of Bangalore traffic, but my instructor was incredibly calm and encouraging. Passed my driving test in the very first attempt!',
      isSampleBadge: true,
    },
    {
      id: 'test-2',
      author: 'Rahul Verma',
      role: 'College Student',
      course: 'Two-Wheeler Training',
      rating: 5,
      date: 'Recent Student',
      comment:
        'The figure-8 track practice gave me real balance and confidence. Flexible early morning 7 AM slots allowed me to attend before my lectures.',
      isSampleBadge: true,
    },
    {
      id: 'test-3',
      author: 'Ananya Kulkarni',
      role: 'Banking Professional',
      course: 'Executive Refresher Course',
      rating: 5,
      date: 'Recent Student',
      comment:
        'Had a driving license for 3 years but never drove independently. After 7 days of reverse parking and highway training, I commute to office alone now!',
      isSampleBadge: true,
    },
  ] as TestimonialItem[],

  faqs: [
    {
      id: 'faq-1',
      question: 'What are the course fees and what payment options are accepted?',
      answer:
        'Our course fees are transparent with no hidden charges. We accept UPI (Google Pay, PhonePe, Paytm), Cash, Debit/Credit Cards, and direct Bank Transfer. Easy installment options are also available during enrollment.',
      category: 'Fees & Payment',
    },
    {
      id: 'faq-2',
      question: 'How long is each driving session and can I choose my instructor?',
      answer:
        'Standard practical sessions are 30 minutes of intensive, hands-on one-on-one driving. Extended 1-hour sessions can be scheduled upon request. We match you with dedicated instructors who specialize in your vehicle choice.',
      category: 'Training & Classes',
    },
    {
      id: 'faq-3',
      question: 'What is your class cancellation and rescheduling policy?',
      answer:
        'We understand unexpected emergencies happen. You can reschedule your session by informing us at least 4 hours in advance via phone or WhatsApp without losing your booked class.',
      category: 'Schedules',
    },
    {
      id: 'faq-4',
      question: 'How do I register and how soon can I start my lessons?',
      answer:
        'Registration is simple! Submit the quick enquiry form on this page or call our helpdesk. After a quick document check, your Customer ID is issued and you can begin practical sessions as early as tomorrow morning.',
      category: 'Enrollment',
    },
    {
      id: 'faq-5',
      question: 'Which documents are needed for obtaining a Learner’s Licence (LL)?',
      answer:
        'You will need: (1) Age proof (Aadhaar Card, 10th marksheet, or Passport), (2) Address proof (Aadhaar or utility bill), (3) 3 passport-sized photographs, and (4) Medical Certificate (Form 1A if age 40+). Our team handles the entire online RTO portal application on your behalf.',
      category: 'RTO & Licensing',
    },
  ] as FAQItem[],
};
