import type {
  LandingPageConfig,
  LandingPageSections,
  LandingHeroConfig,
  LandingCourseConfig,
  LandingTestimonialConfig,
  LandingFAQConfig,
} from '../types';

export interface TrafficSignItem {
  id: string;
  name: string;
  category: 'Mandatory' | 'Cautionary' | 'Informatory';
  description: string;
  shape: 'circle' | 'triangle' | 'octagon' | 'square';
  colorTheme: 'red' | 'amber' | 'blue';
  iconType: 'stop' | 'speed50' | 'pedestrian' | 'giveway' | 'noUturn' | 'parking';
}

export const DEFAULT_LANDING_CONFIG: LandingPageConfig = {
  schoolName: 'GYM DRIVING SCHOOL',
  tagline: 'Learn to Drive with Confidence & Mastery',
  phone: '+91 98450 12345',
  altPhone: '+91 98450 54321',
  email: 'admissions@gymdrivingschool.in',
  addressLine1: 'Plot No. 42, 100 Feet Road, HAL 2nd Stage',
  addressLine2: 'Near Indiranagar Metro Station',
  city: 'Indiranagar, Bengaluru, Karnataka 560038',
  openingHours: 'Mon - Sat: 6:00 AM – 8:00 PM | Sun: 7:00 AM – 2:00 PM',
  operatingDays: 'Open 7 Days a Week • Flexible Morning & Evening Batches',
  whatsappNumber: '+919845012345',
  logoUrl: '/gem-logo.png',

  sections: {
    hero: true,
    courses: true,
    whyUs: true,
    howItWorks: true,
    trafficRules: true,
    testimonials: true,
    faq: true,
    contact: true,
  },

  hero: {
    badge: '🏆 Government Authorized Driving Academy • Admissions Open',
    headline: 'Learn to Drive with',
    highlightWord: 'Confidence',
    subheadline:
      'Premier driving academy in Bengaluru providing patient one-on-one instruction, modern dual-control training cars, certified trainers, and seamless RTO licensing support.',
    ctaExploreText: 'Explore Courses',
    ctaLoginText: 'Customer Login',
    statExperience: '14+ Years',
    statStudents: '18,500+',
    statPassRate: '99.4%',
  },

  courses: [
    {
      id: 'two-wheeler',
      title: 'Two-Wheeler Training',
      badge: 'Beginner Friendly',
      description: 'Master clutch coordination, balance, road confidence, and figure-8 track test maneuvers.',
      duration: '10 Days',
      sessions: '10 Practical Sessions (30 mins daily)',
      fee: '₹ 4,000',
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
      description: 'Complete training from zero to independent city traffic, highway driving, and parking mastery.',
      duration: '20 Days',
      sessions: '20 Practical Classes + Simulator & Theory',
      fee: '₹ 8,000',
      features: [
        'Modern dual-control hatchbacks & sedans',
        'Heavy traffic, flyover & night driving',
        'Parallel, reverse & uphill parking drills',
        'Full RTO test slot assistance & vehicle provided',
      ],
      imageUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?q=80&w=800&auto=format&fit=crop',
    },
    {
      id: 'car-licence',
      title: 'Car + Licence Complete Package',
      badge: 'All Inclusive',
      description: 'Complete practical driving curriculum bundled with full end-to-end RTO licensing support.',
      duration: '30 Days',
      sessions: '20 Practical Sessions + Complete RTO Licensing',
      fee: '₹ 12,000',
      features: [
        'Dual-control Maruti & Hyundai training fleet',
        'End-to-end RTO documentation and slot booking',
        'Test day vehicle assistance & escort to RTO track',
        'Mock test assessment before final driving test',
      ],
      imageUrl: 'https://images.unsplash.com/photo-1508974239320-0a029497e820?q=80&w=800&auto=format&fit=crop',
    },
  ],

  testimonials: [
    {
      id: 'test-1',
      author: 'Priya Sharma',
      role: 'Software Engineer',
      course: 'Four-Wheeler Comprehensive',
      rating: 5,
      date: 'October 2026',
      comment:
        'I was terrified of Bengaluru peak hour traffic, but my instructor Suresh was incredibly calm and methodical. Passed my driving test on my first attempt with zero minus points!',
    },
    {
      id: 'test-2',
      author: 'Rahul Verma',
      role: 'College Student',
      course: 'Two-Wheeler Training',
      rating: 5,
      date: 'September 2026',
      comment:
        'The figure-8 track practice gave me great balance and clutch control. The 6:30 AM morning slots were super convenient before my college lectures started.',
    },
    {
      id: 'test-3',
      author: 'Ananya Kulkarni',
      role: 'Banking Professional',
      course: 'Car + Licence Package',
      rating: 5,
      date: 'September 2026',
      comment:
        'The complete documentation assistance saved me countless trips to the RTO office. The instructors are extremely patient and courteous. Highly recommended for working women!',
    },
    {
      id: 'test-4',
      author: 'Karthik Sundaram',
      role: 'Product Designer',
      course: 'Four-Wheeler Comprehensive',
      rating: 5,
      date: 'August 2026',
      comment:
        'Basement parking and hill start were my biggest fears. After dedicated reverse and ramp drills, I now commute comfortably through Indiranagar and Koramangala every day.',
    },
  ],

  faqs: [
    {
      id: 'faq-1',
      question: 'What are the course fees and what payment options are accepted?',
      answer:
        'Our fees are completely transparent with zero hidden charges. We accept UPI (Google Pay, PhonePe, Paytm), Cash, Debit/Credit Cards, and direct Bank Transfer. Easy installment options (initial admission deposit + balance) are supported.',
    },
    {
      id: 'faq-2',
      question: 'How long is each driving session and can I choose my instructor?',
      answer:
        'Standard practical sessions are 30 minutes of intensive, hands-on one-on-one driving. Extended 1-hour sessions can be scheduled upon request. We match you with dedicated certified instructors based on your vehicle choice and timing preference.',
    },
    {
      id: 'faq-3',
      question: 'What is your class rescheduling policy?',
      answer:
        'We understand busy schedules. You can reschedule any booked session by informing our desk at least 3 hours in advance via call or WhatsApp without forfeiting your class.',
    },
    {
      id: 'faq-4',
      question: 'How soon can I start my lessons after enrolling?',
      answer:
        'You can start practical classes as early as tomorrow morning! Once your admission is confirmed, our team helps configure your preferred morning or evening batch.',
    },
    {
      id: 'faq-5',
      question: 'Which documents are required for a Learner’s Licence (LL)?',
      answer:
        'You will need: (1) Age proof (Aadhaar Card, Passport, or 10th Marks card), (2) Address proof (Aadhaar or utility bill), and (3) Passport-sized photographs. Our academy handles the entire online RTO Sarathi application on your behalf.',
    },
  ],
};

export const TRAFFIC_SIGNS_DATA: TrafficSignItem[] = [
  {
    id: 'sign-stop',
    name: 'STOP',
    category: 'Mandatory',
    shape: 'octagon',
    colorTheme: 'red',
    iconType: 'stop',
    description: 'Driver must bring vehicle to a complete halt before stop line and proceed only when clear.',
  },
  {
    id: 'sign-giveway',
    name: 'GIVE WAY',
    category: 'Mandatory',
    shape: 'triangle',
    colorTheme: 'red',
    iconType: 'giveway',
    description: 'Yield right of way to traffic on the main road before entering an intersection.',
  },
  {
    id: 'sign-speed50',
    name: 'SPEED LIMIT (50 KM/H)',
    category: 'Mandatory',
    shape: 'circle',
    colorTheme: 'red',
    iconType: 'speed50',
    description: 'Maximum allowable speed is 50 km/h under normal road conditions.',
  },
  {
    id: 'sign-no-uturn',
    name: 'NO U-TURN',
    category: 'Mandatory',
    shape: 'circle',
    colorTheme: 'red',
    iconType: 'noUturn',
    description: 'U-turns are strictly prohibited at this intersection or median opening.',
  },
  {
    id: 'sign-pedestrian',
    name: 'PEDESTRIAN CROSSING',
    category: 'Cautionary',
    shape: 'triangle',
    colorTheme: 'amber',
    iconType: 'pedestrian',
    description: 'Zebra crossing ahead. Slow down and prepare to give priority to pedestrians.',
  },
  {
    id: 'sign-parking',
    name: 'PARKING AREA',
    category: 'Informatory',
    shape: 'square',
    colorTheme: 'blue',
    iconType: 'parking',
    description: 'Designated authorized parking bay. Park squarely within marked lines.',
  },
];

export const WHY_CHOOSE_US_DATA = [
  {
    id: 'certified',
    iconName: 'Award' as const,
    title: 'Certified & Patient Instructors',
    description: 'Government certified trainers who specialize in nervous beginners with zero shouting or stress.',
  },
  {
    id: 'flexible',
    iconName: 'Clock' as const,
    title: 'Flexible Morning & Evening Slots',
    description: 'Early morning slots (from 6:00 AM) and evening batches tailored for college students and working professionals.',
  },
  {
    id: 'dual-control',
    iconName: 'ShieldCheck' as const,
    title: 'Dual-Control Training Vehicles',
    description: 'Our fleet is fitted with secondary co-driver brakes and clutch for guaranteed safety at all times.',
  },
  {
    id: 'tracking',
    iconName: 'BarChart3' as const,
    title: 'Digital Progress Tracking',
    description: 'Log into your student account anytime to see remaining sessions, scheduled classes, and test readiness.',
  },
  {
    id: 'rto-help',
    iconName: 'FileCheck' as const,
    title: 'Complete RTO Assistance',
    description: 'End-to-end guidance with Learner’s Licence documentation, online slot booking, and driving test day setup.',
  },
  {
    id: 'safety',
    iconName: 'HeartHandshake' as const,
    title: 'Friendly, Safe Learning Space',
    description: 'Structured step-by-step curriculum with special safety orientation for women and first-time drivers.',
  },
];

export const HOW_IT_WORKS_DATA = [
  {
    stepNumber: '01',
    title: 'Enquire & Choose Course',
    shortDesc: 'Fill the quick enquiry form or call us to choose your course and preferred time slot.',
    details: 'Select Two-Wheeler, Four-Wheeler, or Car + Licence based on your learning goals.',
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
    details: 'Simple, secure access to your classes, payments, and instructor assignment.',
    badge: 'Step 3',
  },
  {
    stepNumber: '04',
    title: 'Manage Your Lessons & Test',
    shortDesc: 'View your booked slots, track instructor updates, and get notified for RTO test dates.',
    details: 'Complete your classes confidently with transparent attendance and fee receipts.',
    badge: 'Step 4',
  },
];

// Backward compatibility layer
export const LANDING_DATA = {
  schoolInfo: {
    name: DEFAULT_LANDING_CONFIG.schoolName,
    shortName: 'GYM',
    tagline: DEFAULT_LANDING_CONFIG.tagline,
    subheadline: DEFAULT_LANDING_CONFIG.hero.subheadline,
    logoUrl: DEFAULT_LANDING_CONFIG.logoUrl,
    phone: DEFAULT_LANDING_CONFIG.phone,
    altPhone: DEFAULT_LANDING_CONFIG.altPhone,
    email: DEFAULT_LANDING_CONFIG.email,
    addressLine1: DEFAULT_LANDING_CONFIG.addressLine1,
    addressLine2: DEFAULT_LANDING_CONFIG.addressLine2,
    city: DEFAULT_LANDING_CONFIG.city,
    openingHours: DEFAULT_LANDING_CONFIG.openingHours,
    operatingDays: DEFAULT_LANDING_CONFIG.operatingDays,
    whatsappNumber: DEFAULT_LANDING_CONFIG.whatsappNumber,
  },
  courses: DEFAULT_LANDING_CONFIG.courses,
  whyChooseUs: WHY_CHOOSE_US_DATA,
  howItWorks: HOW_IT_WORKS_DATA,
  trafficSigns: TRAFFIC_SIGNS_DATA,
  testimonials: DEFAULT_LANDING_CONFIG.testimonials,
  faqs: DEFAULT_LANDING_CONFIG.faqs,
};
