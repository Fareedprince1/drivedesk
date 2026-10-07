// =====================================================================
// DRIVEDESK - LOCAL STORAGE / MOCK DATABASE & BUSINESS ENGINE
// =====================================================================
import type {
  Candidate,
  Package,
  Enrollment,
  Payment,
  Instructor,
  InstructorLeave,
  Vehicle,
  Appointment,
  RTOTrainingRecord,
  Expense,
  CandidateNote,
  Holiday,
  SchoolSettings,
  ActivityLogItem,
  EnrollmentCalculatedStats,
  CandidateWithStats,
  UserRole,
} from '../types';
import { supabase } from './supabase';

export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const STORAGE_KEYS = {
  SETTINGS: 'gem_settings',
  PACKAGES: 'gem_packages',
  CANDIDATES: 'gem_candidates',
  ENROLLMENTS: 'gem_enrollments',
  PAYMENTS: 'gem_payments',
  INSTRUCTORS: 'gem_instructors',
  INSTRUCTOR_LEAVES: 'gem_leaves',
  VEHICLES: 'gem_vehicles',
  APPOINTMENTS: 'gem_appointments',
  RTO: 'gem_rto',
  EXPENSES: 'gem_expenses',
  NOTES: 'gem_notes',
  HOLIDAYS: 'gem_holidays',
  ACTIVITY_LOG: 'gem_activity_log',
  INIT_FLAG: 'gem_clean_database_v3',
};

// --- DEFAULT CLEAN DATA ---
export const DEFAULT_SETTINGS: SchoolSettings = {
  id: 1,
  school_name: 'Gem Driving School',
  address: 'Indiranagar, Bengaluru, Karnataka 560038',
  phone: '+91 98765 43210',
  gst_number: '',
  receipt_footer_text: 'Thank you for choosing Gem Driving School. Safe driving begins here! Terms & conditions apply.',
  slot_length: 30,
  cancellation_cutoff_hours: 3,
  absent_consumes_class: true,
  default_package_validity_days: 90,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

export const DEFAULT_PACKAGE_IDS = {
  BASIC_CAR: '10000000-0000-4000-8000-000000000001',
  STANDARD_CAR: '10000000-0000-4000-8000-000000000002',
  CAR_LICENCE: '10000000-0000-4000-8000-000000000003',
  BIKE: '10000000-0000-4000-8000-000000000004',
};

export const DEFAULT_VEHICLE_IDS = {
  DZIRE: '20000000-0000-4000-8000-000000000001',
  NIOS: '20000000-0000-4000-8000-000000000002',
  ACTIVA: '20000000-0000-4000-8000-000000000003',
};

export const DEFAULT_INSTRUCTOR_IDS = {
  RAMESH: '30000000-0000-4000-8000-000000000001',
  SURESH: '30000000-0000-4000-8000-000000000002',
  PRIYA: '30000000-0000-4000-8000-000000000003',
};

export const DEFAULT_PACKAGES: Package[] = [
  {
    id: DEFAULT_PACKAGE_IDS.BASIC_CAR,
    name: 'Basic Car Training',
    vehicle_type: 'car',
    total_classes: 10,
    fee: 5000,
    validity_days: 45,
    description: '10 practical classes (30 min each). Ideal for beginners to learn car control and steering basics.',
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: DEFAULT_PACKAGE_IDS.STANDARD_CAR,
    name: 'Standard Car Training',
    vehicle_type: 'car',
    total_classes: 20,
    fee: 8000,
    validity_days: 60,
    description: '20 classes (30 min each). Complete end-to-end practical curriculum including hill start, reverse, and highway driving.',
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: DEFAULT_PACKAGE_IDS.CAR_LICENCE,
    name: 'Car + Licence Package',
    vehicle_type: 'car',
    total_classes: 20,
    fee: 12000,
    validity_days: 90,
    description: '20 practical classes + complete RTO documentation assistance, slot booking, and test day vehicle assistance.',
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: DEFAULT_PACKAGE_IDS.BIKE,
    name: 'Two-Wheeler Training',
    vehicle_type: 'bike',
    total_classes: 10,
    fee: 4000,
    validity_days: 30,
    description: '10 classes (30 min each). Balance, clutch coordination, traffic etiquette, and figure-8 training for RTO test.',
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
];

export const DEFAULT_VEHICLES: Vehicle[] = [
  {
    id: DEFAULT_VEHICLE_IDS.DZIRE,
    registration_number: 'KA-01-AB-1234',
    type: 'car',
    model: 'Maruti Suzuki Dzire (Manual)',
    assigned_instructor_id: DEFAULT_INSTRUCTOR_IDS.RAMESH,
    insurance_expiry: '2026-12-15',
    pollution_expiry: '2026-11-20',
    fitness_expiry: '2028-04-10',
    last_service_date: '2026-09-10',
    next_service_date: '2026-12-10',
    status: 'available',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: DEFAULT_VEHICLE_IDS.NIOS,
    registration_number: 'KA-03-CD-5678',
    type: 'car',
    model: 'Hyundai Grand i10 Nios',
    assigned_instructor_id: DEFAULT_INSTRUCTOR_IDS.SURESH,
    insurance_expiry: '2026-10-25', // Expiring soon (<30 days from Oct)
    pollution_expiry: '2026-10-18', // Expiring soon
    fitness_expiry: '2027-08-15',
    last_service_date: '2026-08-01',
    next_service_date: '2026-10-20',
    status: 'available',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: DEFAULT_VEHICLE_IDS.ACTIVA,
    registration_number: 'KA-05-EF-9012',
    type: 'bike',
    model: 'Honda Activa 6G',
    assigned_instructor_id: DEFAULT_INSTRUCTOR_IDS.PRIYA,
    insurance_expiry: '2027-01-30',
    pollution_expiry: '2026-12-05',
    fitness_expiry: '2029-02-14',
    last_service_date: '2026-07-22',
    next_service_date: '2026-11-22',
    status: 'available',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
];

export const DEFAULT_INSTRUCTORS: Instructor[] = [
  {
    id: DEFAULT_INSTRUCTOR_IDS.RAMESH,
    name: 'Ramesh Kumar',
    mobile: '9845012345',
    licence_number: 'KA0120100014289',
    licence_expiry: '2029-05-15',
    working_start_time: '06:00',
    working_end_time: '20:00',
    assigned_vehicle_id: DEFAULT_VEHICLE_IDS.DZIRE,
    status: 'active',
    joining_date: '2022-03-15',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: DEFAULT_INSTRUCTOR_IDS.SURESH,
    name: 'Suresh Gowda',
    mobile: '9741234567',
    licence_number: 'KA0320140023910',
    licence_expiry: '2028-11-20',
    working_start_time: '07:00',
    working_end_time: '19:00',
    assigned_vehicle_id: DEFAULT_VEHICLE_IDS.NIOS,
    status: 'active',
    joining_date: '2023-01-10',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: DEFAULT_INSTRUCTOR_IDS.PRIYA,
    name: 'Priya Sharma',
    mobile: '9980123456',
    licence_number: 'KA0520180031844',
    licence_expiry: '2030-08-10',
    working_start_time: '08:00',
    working_end_time: '18:00',
    assigned_vehicle_id: DEFAULT_VEHICLE_IDS.ACTIVA,
    status: 'active',
    joining_date: '2024-06-01',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
];

// Helper to seed candidates, enrollments, payments
function generateSeedCandidatesAndData() {
  const candidatesData = [
    {
      code: 'DS0001',
      name: 'Aarav Sharma',
      mobile: '9845112233',
      alt: '9845112234',
      addr: '12, 4th Main, Domlur, Bengaluru',
      dob: '1998-05-14',
      joining: '2026-09-01',
      ll: 'KA01/2026/0049102',
      pkgId: 'pkg-3',
      disc: 500,
      paid: 8000,
      status: 'active',
      instId: 'inst-1',
      vehId: 'veh-1',
    },
    {
      code: 'DS0002',
      name: 'Ananya Rao',
      mobile: '9900223344',
      alt: '',
      addr: '88, 12th Cross, Indiranagar, Bengaluru',
      dob: '2001-11-20',
      joining: '2026-09-05',
      ll: 'KA03/2026/0018274',
      pkgId: 'pkg-2',
      disc: 0,
      paid: 8000, // Fully paid
      status: 'active',
      instId: 'inst-2',
      vehId: 'veh-2',
    },
    {
      code: 'DS0003',
      name: 'Rohan Verma',
      mobile: '9880334455',
      alt: '9880334456',
      addr: '5/A, HAL 2nd Stage, Kodihalli, Bengaluru',
      dob: '1995-03-08',
      joining: '2026-09-10',
      ll: 'KA01/2026/0091823',
      pkgId: 'pkg-1',
      disc: 0,
      paid: 2500, // Pending ₹2,500
      status: 'active',
      instId: 'inst-1',
      vehId: 'veh-1',
    },
    {
      code: 'DS0004',
      name: 'Divya Nair',
      mobile: '9740445566',
      alt: '',
      addr: '71, Defense Colony, Indiranagar, Bengaluru',
      dob: '2000-07-25',
      joining: '2026-09-12',
      ll: 'KA03/2026/0034921',
      pkgId: 'pkg-4',
      disc: 200,
      paid: 3800, // Fully paid
      status: 'active',
      instId: 'inst-3',
      vehId: 'veh-3',
    },
    {
      code: 'DS0005',
      name: 'Vikram Singh',
      mobile: '9611556677',
      alt: '9611556678',
      addr: '402, Prestige Tower, Old Airport Rd, Bengaluru',
      dob: '1992-12-02',
      joining: '2026-08-20',
      ll: 'KA01/2026/0055219',
      pkgId: 'pkg-2',
      disc: 0,
      paid: 8000,
      status: 'completed',
      instId: 'inst-1',
      vehId: 'veh-1',
    },
    {
      code: 'DS0006',
      name: 'Sneha Patel',
      mobile: '9845667788',
      alt: '',
      addr: '19, Cambridge Road, Ulsoor, Bengaluru',
      dob: '1999-04-18',
      joining: '2026-09-15',
      ll: 'KA01/2026/0067812',
      pkgId: 'pkg-3',
      disc: 1000,
      paid: 6000, // Pending ₹5,000
      status: 'active',
      instId: 'inst-1',
      vehId: 'veh-1',
    },
    {
      code: 'DS0007',
      name: 'Mohammed Zaid',
      mobile: '9945778899',
      alt: '9945778800',
      addr: '104, Mosque Road, Frazer Town, Bengaluru',
      dob: '1996-09-30',
      joining: '2026-09-18',
      ll: 'KA03/2026/0078912',
      pkgId: 'pkg-1',
      disc: 0,
      paid: 5000,
      status: 'active',
      instId: 'inst-2',
      vehId: 'veh-2',
    },
    {
      code: 'DS0008',
      name: 'Pooja Hegde',
      mobile: '9731889900',
      alt: '',
      addr: '23, 6th Cross, Thippasandra, Bengaluru',
      dob: '2002-02-14',
      joining: '2026-09-20',
      ll: 'KA01/2026/0089012',
      pkgId: 'pkg-2',
      disc: 500,
      paid: 4000, // Pending ₹3,500
      status: 'active',
      instId: 'inst-1',
      vehId: 'veh-1',
    },
    {
      code: 'DS0009',
      name: 'Karthik Reddy',
      mobile: '9844990011',
      alt: '',
      addr: '501, Sobha City, Thanisandra, Bengaluru',
      dob: '1994-06-19',
      joining: '2026-09-22',
      ll: 'KA01/2026/0090123',
      pkgId: 'pkg-3',
      disc: 0,
      paid: 12000,
      status: 'active',
      instId: 'inst-1',
      vehId: 'veh-1',
    },
    {
      code: 'DS0010',
      name: 'Neha Kulkarni',
      mobile: '9620001122',
      alt: '',
      addr: '34, 1st Cross, Jeevan Bima Nagar, Bengaluru',
      dob: '1997-10-10',
      joining: '2026-09-25',
      ll: 'KA03/2026/0011234',
      pkgId: 'pkg-4',
      disc: 0,
      paid: 2000, // Pending ₹2,000
      status: 'active',
      instId: 'inst-3',
      vehId: 'veh-3',
    },
    {
      code: 'DS0011',
      name: 'Sanjay Joshi',
      mobile: '9886112233',
      alt: '9886112234',
      addr: '67, Rustam Bagh, HAL Road, Bengaluru',
      dob: '1989-08-05',
      joining: '2026-08-15',
      ll: 'KA01/2026/0022345',
      pkgId: 'pkg-2',
      disc: 0,
      paid: 8000,
      status: 'completed',
      instId: 'inst-2',
      vehId: 'veh-2',
    },
    {
      code: 'DS0012',
      name: 'Preeti Menon',
      mobile: '9742223344',
      alt: '',
      addr: '15, Wind Tunnel Road, Murugeshpalya, Bengaluru',
      dob: '2001-01-29',
      joining: '2026-09-28',
      ll: 'KA03/2026/0033456',
      pkgId: 'pkg-1',
      disc: 0,
      paid: 3000, // Pending ₹2,000
      status: 'active',
      instId: 'inst-2',
      vehId: 'veh-2',
    },
    {
      code: 'DS0013',
      name: 'Aditya Das',
      mobile: '9632334455',
      alt: '',
      addr: '8, BDA Layout, Domlur, Bengaluru',
      dob: '1995-11-12',
      joining: '2026-09-29',
      ll: 'KA01/2026/0044567',
      pkgId: 'pkg-2',
      disc: 500,
      paid: 5000, // Pending ₹2,500
      status: 'active',
      instId: 'inst-1',
      vehId: 'veh-1',
    },
    {
      code: 'DS0014',
      name: 'Meera Iyer',
      mobile: '9845445566',
      alt: '',
      addr: '92, 10th Main, Malleshwaram, Bengaluru',
      dob: '2003-03-03',
      joining: '2026-10-01',
      ll: '',
      pkgId: 'pkg-1',
      disc: 0,
      paid: 1000, // Pending ₹4,000
      status: 'hold',
      instId: 'inst-2',
      vehId: 'veh-2',
    },
    {
      code: 'DS0015',
      name: 'Rahul Roy',
      mobile: '9901556677',
      alt: '',
      addr: '44, CMH Road, Indiranagar, Bengaluru',
      dob: '1993-05-22',
      joining: '2026-10-02',
      ll: 'KA01/2026/0055678',
      pkgId: 'pkg-3',
      disc: 1000,
      paid: 5000, // Pending ₹6,000
      status: 'active',
      instId: 'inst-1',
      vehId: 'veh-1',
    },
  ];

  const candidates: Candidate[] = [];
  const enrollments: Enrollment[] = [];
  const payments: Payment[] = [];
  const appointments: Appointment[] = [];
  const rtoList: RTOTrainingRecord[] = [];
  const notesList: CandidateNote[] = [];

  let receiptCounter = 1001;

  const pkgMap: Record<string, string> = {
    'pkg-1': DEFAULT_PACKAGE_IDS.BASIC_CAR,
    'pkg-2': DEFAULT_PACKAGE_IDS.STANDARD_CAR,
    'pkg-3': DEFAULT_PACKAGE_IDS.CAR_LICENCE,
    'pkg-4': DEFAULT_PACKAGE_IDS.BIKE,
  };
  const instMap: Record<string, string> = {
    'inst-1': DEFAULT_INSTRUCTOR_IDS.RAMESH,
    'inst-2': DEFAULT_INSTRUCTOR_IDS.SURESH,
    'inst-3': DEFAULT_INSTRUCTOR_IDS.PRIYA,
  };
  const vehMap: Record<string, string> = {
    'veh-1': DEFAULT_VEHICLE_IDS.DZIRE,
    'veh-2': DEFAULT_VEHICLE_IDS.NIOS,
    'veh-3': DEFAULT_VEHICLE_IDS.ACTIVA,
  };

  const createdCandidates: Array<{ id: string; enrId: string }> = [];

  candidatesData.forEach((cd, index) => {
    const candidateId = generateUUID();
    const enrollmentId = generateUUID();
    createdCandidates.push({ id: candidateId, enrId: enrollmentId });

    const realPkgId = pkgMap[cd.pkgId] || DEFAULT_PACKAGE_IDS.BASIC_CAR;
    const pkg = DEFAULT_PACKAGES.find((p) => p.id === realPkgId) || DEFAULT_PACKAGES[0];
    const realInstId = instMap[cd.instId] || DEFAULT_INSTRUCTOR_IDS.RAMESH;
    const realVehId = vehMap[cd.vehId] || DEFAULT_VEHICLE_IDS.DZIRE;

    candidates.push({
      id: candidateId,
      candidate_code: cd.code,
      full_name: cd.name,
      mobile: cd.mobile,
      alt_mobile: cd.alt || undefined,
      address: cd.addr,
      date_of_birth: cd.dob,
      joining_date: cd.joining,
      ll_number: cd.ll || undefined,
      ll_issue_date: cd.ll ? '2026-08-15' : undefined,
      ll_expiry_date: cd.ll ? '2027-02-14' : undefined,
      status: cd.status as any,
      notes_summary: `Enrolled in ${pkg.name}. Preferred slot morning.`,
      deleted_at: null,
      created_at: `${cd.joining}T10:00:00Z`,
      updated_at: `${cd.joining}T10:00:00Z`,
    });

    enrollments.push({
      id: enrollmentId,
      candidate_id: candidateId,
      package_id: pkg.id,
      package_name: pkg.name,
      vehicle_type: pkg.vehicle_type,
      start_date: cd.joining,
      total_classes: pkg.total_classes,
      total_fee: pkg.fee,
      discount_amount: cd.disc,
      status: cd.status === 'completed' ? 'completed' : 'active',
      expiry_date: '2026-12-31',
      created_at: `${cd.joining}T10:05:00Z`,
      updated_at: `${cd.joining}T10:05:00Z`,
    });

    if (cd.paid > 0) {
      payments.push({
        id: generateUUID(),
        enrollment_id: enrollmentId,
        candidate_id: candidateId,
        amount: cd.paid,
        payment_date: cd.joining,
        mode: index % 2 === 0 ? 'upi' : 'cash',
        receipt_number: `R-${receiptCounter++}`,
        remarks: 'Admission initial payment',
        is_reversal: false,
        created_by: undefined,
        created_at: `${cd.joining}T10:10:00Z`,
      });
    }

    // Add some completed/upcoming classes
    const classesCount = cd.status === 'completed' ? pkg.total_classes : Math.min(index * 2 + 1, pkg.total_classes - 2);
    for (let c = 0; c < Math.min(classesCount, 4); c++) {
      const dayOffset = c * 2;
      const appDate = `2026-09-${String(10 + dayOffset).padStart(2, '0')}`;
      appointments.push({
        id: generateUUID(),
        enrollment_id: enrollmentId,
        candidate_id: candidateId,
        instructor_id: realInstId,
        vehicle_id: realVehId,
        appointment_date: appDate,
        start_time: '08:00',
        end_time: '08:30',
        status: 'completed',
        remarks: `Class #${c + 1} completed smoothly.`,
        created_at: '2026-09-01T10:00:00Z',
        updated_at: '2026-09-01T10:00:00Z',
      });
    }

    // RTO Tracking record
    rtoList.push({
      id: generateUUID(),
      enrollment_id: enrollmentId,
      candidate_id: candidateId,
      stage: cd.status === 'completed' ? 'licence_received' : cd.ll ? 'training_ongoing' : 'll_pending',
      ll_number: cd.ll || undefined,
      test_date: cd.status === 'completed' ? '2026-09-25' : index === 0 ? '2026-10-08' : undefined,
      test_time: '11:00',
      test_result: cd.status === 'completed' ? 'pass' : 'pending',
      licence_number: cd.status === 'completed' ? `DL012026${1000 + index}` : undefined,
      licence_received_date: cd.status === 'completed' ? '2026-09-28' : undefined,
      remarks: 'Documents verified at Indiranagar RTO.',
      created_at: '2026-09-01T10:00:00Z',
      updated_at: '2026-09-01T10:00:00Z',
    });

    // Notes
    if (index % 3 === 0) {
      notesList.push({
        id: generateUUID(),
        candidate_id: candidateId,
        note_text: 'Follow-up for remaining balance payment before practical test.',
        follow_up_date: '2026-10-07',
        is_done: false,
        created_by: 'Staff',
        created_at: '2026-10-01T14:30:00Z',
      });
    }
  });

  // Today's Appointments (2026-10-06)
  const todayApps: Appointment[] = [
    {
      id: generateUUID(),
      enrollment_id: createdCandidates[0]?.enrId || generateUUID(),
      candidate_id: createdCandidates[0]?.id || generateUUID(),
      instructor_id: DEFAULT_INSTRUCTOR_IDS.RAMESH,
      vehicle_id: DEFAULT_VEHICLE_IDS.DZIRE,
      appointment_date: '2026-10-06',
      start_time: '07:00',
      end_time: '07:30',
      status: 'completed',
      remarks: 'Clutch control in Indiranagar morning traffic',
      created_at: '2026-10-05T10:00:00Z',
      updated_at: '2026-10-06T07:35:00Z',
    },
    {
      id: generateUUID(),
      enrollment_id: createdCandidates[1]?.enrId || generateUUID(),
      candidate_id: createdCandidates[1]?.id || generateUUID(),
      instructor_id: DEFAULT_INSTRUCTOR_IDS.SURESH,
      vehicle_id: DEFAULT_VEHICLE_IDS.NIOS,
      appointment_date: '2026-10-06',
      start_time: '08:00',
      end_time: '08:30',
      status: 'booked',
      remarks: 'Reverse parking and 3-point turn practice',
      created_at: '2026-10-05T11:00:00Z',
      updated_at: '2026-10-05T11:00:00Z',
    },
    {
      id: generateUUID(),
      enrollment_id: createdCandidates[3]?.enrId || generateUUID(),
      candidate_id: createdCandidates[3]?.id || generateUUID(),
      instructor_id: DEFAULT_INSTRUCTOR_IDS.PRIYA,
      vehicle_id: DEFAULT_VEHICLE_IDS.ACTIVA,
      appointment_date: '2026-10-06',
      start_time: '09:00',
      end_time: '09:30',
      status: 'booked',
      remarks: 'Two wheeler figure-8 track test practice',
      created_at: '2026-10-05T12:00:00Z',
      updated_at: '2026-10-05T12:00:00Z',
    },
    {
      id: generateUUID(),
      enrollment_id: createdCandidates[5]?.enrId || generateUUID(),
      candidate_id: createdCandidates[5]?.id || generateUUID(),
      instructor_id: DEFAULT_INSTRUCTOR_IDS.RAMESH,
      vehicle_id: DEFAULT_VEHICLE_IDS.DZIRE,
      appointment_date: '2026-10-06',
      start_time: '10:00',
      end_time: '10:30',
      status: 'booked',
      remarks: 'Flyover hill start and handbrake synchronization',
      created_at: '2026-10-05T14:00:00Z',
      updated_at: '2026-10-05T14:00:00Z',
    },
  ];

  // Tomorrow's Appointments (2026-10-07)
  const tomorrowApps: Appointment[] = [
    {
      id: generateUUID(),
      enrollment_id: createdCandidates[2]?.enrId || generateUUID(),
      candidate_id: createdCandidates[2]?.id || generateUUID(),
      instructor_id: DEFAULT_INSTRUCTOR_IDS.RAMESH,
      vehicle_id: DEFAULT_VEHICLE_IDS.DZIRE,
      appointment_date: '2026-10-07',
      start_time: '07:30',
      end_time: '08:00',
      status: 'booked',
      remarks: 'Steering accuracy and lane changing',
      created_at: '2026-10-05T10:00:00Z',
      updated_at: '2026-10-05T10:00:00Z',
    },
    {
      id: generateUUID(),
      enrollment_id: createdCandidates[6]?.enrId || generateUUID(),
      candidate_id: createdCandidates[6]?.id || generateUUID(),
      instructor_id: DEFAULT_INSTRUCTOR_IDS.SURESH,
      vehicle_id: DEFAULT_VEHICLE_IDS.NIOS,
      appointment_date: '2026-10-07',
      start_time: '08:30',
      end_time: '09:00',
      status: 'booked',
      remarks: 'Highway ramp entering and exiting',
      created_at: '2026-10-05T11:00:00Z',
      updated_at: '2026-10-05T11:00:00Z',
    },
  ];

  appointments.push(...todayApps, ...tomorrowApps);

  const defaultExpenses: Expense[] = [
    {
      id: generateUUID(),
      expense_date: '2026-10-01',
      category: 'fuel',
      amount: 2500,
      vehicle_id: DEFAULT_VEHICLE_IDS.DZIRE,
      payment_mode: 'upi',
      description: 'Petrol refuel Dzire KA-01-AB-1234',
      created_by: undefined,
      created_at: '2026-10-01T09:00:00Z',
    },
    {
      id: generateUUID(),
      expense_date: '2026-10-02',
      category: 'fuel',
      amount: 2200,
      vehicle_id: DEFAULT_VEHICLE_IDS.NIOS,
      payment_mode: 'upi',
      description: 'Petrol refuel i10 KA-03-CD-5678',
      created_by: undefined,
      created_at: '2026-10-02T10:00:00Z',
    },
    {
      id: generateUUID(),
      expense_date: '2026-10-03',
      category: 'office',
      amount: 1500,
      vehicle_id: null,
      payment_mode: 'cash',
      description: 'Office tea, water cans and receipt book stationery',
      created_by: undefined,
      created_at: '2026-10-03T11:00:00Z',
    },
    {
      id: generateUUID(),
      expense_date: '2026-10-04',
      category: 'vehicle_service',
      amount: 3200,
      vehicle_id: DEFAULT_VEHICLE_IDS.DZIRE,
      payment_mode: 'card',
      description: 'Wheel alignment and brake shoe check at authorized service center',
      created_by: undefined,
      created_at: '2026-10-04T16:00:00Z',
    },
    {
      id: generateUUID(),
      expense_date: '2026-10-05',
      category: 'salary',
      amount: 45000,
      vehicle_id: null,
      payment_mode: 'bank_transfer',
      description: 'Instructors and front-desk September monthly salary disbursement',
      created_by: undefined,
      created_at: '2026-10-05T12:00:00Z',
    },
  ];

  const defaultHolidays: Holiday[] = [
    { id: generateUUID(), date: '2026-10-02', description: 'Gandhi Jayanti', created_at: '2026-01-01T00:00:00Z' },
    { id: generateUUID(), date: '2026-10-20', description: 'Ayudha Pooja / Vijayadashami', created_at: '2026-01-01T00:00:00Z' },
    { id: generateUUID(), date: '2026-11-01', description: 'Kannada Rajyotsava', created_at: '2026-01-01T00:00:00Z' },
    { id: generateUUID(), date: '2026-11-08', description: 'Deepavali', created_at: '2026-01-01T00:00:00Z' },
  ];

  return { candidates, enrollments, payments, appointments, rtoList, notesList, defaultExpenses, defaultHolidays };
}

// Supabase PostgreSQL Allowed Columns Whitelist (prevents schema cache errors)
const DB_ALLOWED_COLUMNS: Record<string, string[]> = {
  candidates: [
    'id', 'candidate_code', 'full_name', 'mobile', 'alt_mobile',
    'address', 'date_of_birth', 'joining_date', 'll_number',
    'll_issue_date', 'll_expiry_date', 'status', 'notes_summary',
    'deleted_at', 'created_at', 'updated_at', 'admin_id'
  ],
  enrollments: [
    'id', 'candidate_id', 'package_id', 'start_date', 'total_classes',
    'total_fee', 'discount_amount', 'status', 'expiry_date',
    'created_at', 'updated_at', 'admin_id'
  ],
  payments: [
    'id', 'enrollment_id', 'candidate_id', 'amount', 'payment_date',
    'mode', 'receipt_number', 'remarks', 'is_reversal',
    'reverses_payment_id', 'created_by', 'created_at', 'admin_id'
  ],
  appointments: [
    'id', 'enrollment_id', 'candidate_id', 'instructor_id',
    'vehicle_id', 'appointment_date', 'start_time', 'end_time',
    'status', 'remarks', 'rescheduled_from_id', 'created_by',
    'deleted_at', 'created_at', 'updated_at', 'admin_id'
  ],
  vehicles: [
    'id', 'registration_number', 'type', 'model', 'assigned_instructor_id',
    'insurance_expiry', 'pollution_expiry', 'fitness_expiry',
    'last_service_date', 'next_service_date', 'status',
    'created_at', 'updated_at', 'admin_id'
  ],
  instructors: [
    'id', 'name', 'mobile', 'licence_number', 'licence_expiry',
    'working_start_time', 'working_end_time', 'assigned_vehicle_id',
    'status', 'joining_date', 'created_at', 'updated_at', 'admin_id'
  ],
  packages: [
    'id', 'name', 'vehicle_type', 'total_classes', 'fee',
    'validity_days', 'description', 'is_active',
    'created_at', 'updated_at', 'admin_id'
  ],
  settings: [
    'id', 'school_name', 'address', 'phone', 'gst_number',
    'receipt_footer_text', 'slot_length', 'cancellation_cutoff_hours',
    'absent_consumes_class', 'default_package_validity_days',
    'created_at', 'updated_at', 'admin_id'
  ],
  expenses: [
    'id', 'expense_date', 'category', 'amount', 'vehicle_id',
    'payment_mode', 'description', 'created_by', 'created_at', 'admin_id'
  ],
  candidate_notes: [
    'id', 'candidate_id', 'note_text', 'follow_up_date', 'is_done',
    'created_by', 'created_at', 'admin_id'
  ],
  rto_tracking: [
    'id', 'enrollment_id', 'stage', 'll_number', 'test_date',
    'test_time', 'test_result', 'licence_number',
    'licence_received_date', 'remarks', 'created_at', 'updated_at', 'admin_id'
  ],
  activity_log: [
    'id', 'user_id', 'table_name', 'record_id', 'action',
    'old_values', 'new_values', 'created_at', 'admin_id'
  ],
};

function sanitizePayload(
  table: string,
  payload: any,
  activeUserId?: string | null,
  activeSchoolAdminId?: string | null
): any {
  if (!payload) return payload;
  const allowed = DB_ALLOWED_COLUMNS[table];
  const cleaned: Record<string, any> = {};
  if (allowed) {
    for (const col of allowed) {
      if (col in payload && payload[col] !== undefined) {
        cleaned[col] = payload[col];
      }
    }
  } else {
    Object.assign(cleaned, payload);
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const targetAdminId = activeSchoolAdminId || activeUserId;

  // Stamped with school admin ID so both Admin and Staff belonging to this school share live access
  if ('admin_id' in DB_ALLOWED_COLUMNS[table] || allowed?.includes('admin_id')) {
    if (targetAdminId && uuidRegex.test(targetAdminId)) {
      cleaned.admin_id = targetAdminId;
    } else {
      cleaned.admin_id = null;
    }
  }

  // Clean UUID / nullable foreign keys to prevent syntax error:
  if ('created_by' in cleaned) {
    if (!cleaned.created_by || !uuidRegex.test(cleaned.created_by)) {
      cleaned.created_by = (activeUserId && uuidRegex.test(activeUserId)) ? activeUserId : null;
    }
  }
  if ('assigned_vehicle_id' in cleaned && (!cleaned.assigned_vehicle_id || !uuidRegex.test(cleaned.assigned_vehicle_id))) {
    cleaned.assigned_vehicle_id = null;
  }
  if ('rescheduled_from_id' in cleaned && (!cleaned.rescheduled_from_id || !uuidRegex.test(cleaned.rescheduled_from_id))) {
    cleaned.rescheduled_from_id = null;
  }
  if ('reverses_payment_id' in cleaned && (!cleaned.reverses_payment_id || !uuidRegex.test(cleaned.reverses_payment_id))) {
    cleaned.reverses_payment_id = null;
  }
  if ('vehicle_id' in cleaned && cleaned.vehicle_id !== null && (!cleaned.vehicle_id || !uuidRegex.test(cleaned.vehicle_id))) {
    cleaned.vehicle_id = null;
  }

  return cleaned;
}

// --- LOCAL STORAGE DATA ENGINE CLASS ---
class DriveDeskStorage {
  public activeUserId: string | null = null;
  public activeSchoolAdminId: string | null = null;

  constructor() {
    try {
      const savedAuth = localStorage.getItem('gem_auth_user');
      if (savedAuth) {
        const parsed = JSON.parse(savedAuth);
        if (parsed?.id) this.activeUserId = parsed.id;
        if (parsed?.schoolAdminId) this.activeSchoolAdminId = parsed.schoolAdminId;
        else if (parsed?.role === 'admin' && parsed?.id) this.activeSchoolAdminId = parsed.id;
      }
    } catch (e) {
      console.error(e);
    }
    this.ensureInitialized();
  }

  public setActiveUser(userId: string | null, schoolAdminId?: string | null): void {
    this.activeUserId = userId;
    this.activeSchoolAdminId = schoolAdminId || (userId ? this.activeSchoolAdminId || userId : null);
  }

  ensureInitialized(force = false) {
    if (!localStorage.getItem(STORAGE_KEYS.INIT_FLAG) || force) {
      // Clear out legacy drivedesk_* keys
      try {
        Object.keys(localStorage).forEach((key) => {
          if (key.startsWith('drivedesk_')) {
            localStorage.removeItem(key);
          }
        });
      } catch (e) {
        console.error(e);
      }

      // Initialize with clean data (0 candidates, 0 appointments, 0 payments, 0 vehicles, 0 instructors)
      this.set(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
      this.set(STORAGE_KEYS.PACKAGES, DEFAULT_PACKAGES);
      this.set(STORAGE_KEYS.VEHICLES, []);
      this.set(STORAGE_KEYS.INSTRUCTORS, []);
      this.set(STORAGE_KEYS.INSTRUCTOR_LEAVES, []);
      this.set(STORAGE_KEYS.CANDIDATES, []);
      this.set(STORAGE_KEYS.ENROLLMENTS, []);
      this.set(STORAGE_KEYS.PAYMENTS, []);
      this.set(STORAGE_KEYS.APPOINTMENTS, []);
      this.set(STORAGE_KEYS.RTO, []);
      this.set(STORAGE_KEYS.EXPENSES, []);
      this.set(STORAGE_KEYS.NOTES, []);

      const defaultHols: Holiday[] = [
        { id: 'hol-1', date: '2026-10-02', description: 'Gandhi Jayanti', created_at: '2026-01-01T00:00:00Z' },
        { id: 'hol-2', date: '2026-10-20', description: 'Ayudha Pooja / Vijayadashami', created_at: '2026-01-01T00:00:00Z' },
        { id: 'hol-3', date: '2026-11-01', description: 'Kannada Rajyotsava', created_at: '2026-01-01T00:00:00Z' },
        { id: 'hol-4', date: '2026-11-08', description: 'Deepavali', created_at: '2026-01-01T00:00:00Z' },
      ];
      this.set(STORAGE_KEYS.HOLIDAYS, defaultHols);

      const initialActivity: ActivityLogItem[] = [
        {
          id: 'act-init',
          user_name: 'System',
          user_role: 'admin',
          table_name: 'system',
          record_id: 'seed-0',
          action: 'INSERT',
          details: 'Initialized Gem Driving School database',
          created_at: new Date().toISOString(),
        },
      ];
      this.set(STORAGE_KEYS.ACTIVITY_LOG, initialActivity);
      localStorage.setItem(STORAGE_KEYS.INIT_FLAG, 'true');
    }
  }

  // Clear all operational records to return to a 100% clean slate
  clearAllData() {
    this.ensureInitialized(true);
  }

  // Load sample demo data if the user wishes to preview realistic records
  loadDemoData() {
    const seed = generateSeedCandidatesAndData();
    this.set(STORAGE_KEYS.VEHICLES, DEFAULT_VEHICLES);
    this.set(STORAGE_KEYS.INSTRUCTORS, DEFAULT_INSTRUCTORS);
    this.set(STORAGE_KEYS.CANDIDATES, seed.candidates);
    this.set(STORAGE_KEYS.ENROLLMENTS, seed.enrollments);
    this.set(STORAGE_KEYS.PAYMENTS, seed.payments);
    this.set(STORAGE_KEYS.APPOINTMENTS, seed.appointments);
    this.set(STORAGE_KEYS.RTO, seed.rtoList);
    this.set(STORAGE_KEYS.EXPENSES, seed.defaultExpenses);
    this.set(STORAGE_KEYS.NOTES, seed.notesList);
    this.logActivity('INSERT', 'system', 'demo', 'Loaded sample demo data for testing');
  }

  resetAllData() {
    this.clearAllData();
  }

  // Generic getter / setter for shared driving school data
  private get<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      console.error(`Error reading ${key}:`, e);
      return defaultValue;
    }
  }

  private set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Error saving ${key}:`, e);
    }
  }

  // --- CLOUD SYNC ENGINE (Supabase Direct Persistence for Admin & Staff) ---
  public async syncToCloud(
    table: string,
    action: 'insert' | 'update' | 'upsert' | 'delete',
    payload?: any,
    id?: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!supabase) return { success: false, error: 'Supabase client not initialized' };
    try {
      const cleanPayload = payload
        ? sanitizePayload(table, payload, this.activeUserId, this.activeSchoolAdminId)
        : undefined;

      if (action === 'insert' && cleanPayload) {
        const { error } = await supabase.from(table).insert([cleanPayload]);
        if (error) {
          console.warn(`Supabase cloud insert warning (${table}):`, error.message);
          return { success: false, error: error.message };
        }
      } else if (action === 'update' && id && cleanPayload) {
        const { error } = await supabase.from(table).update(cleanPayload).eq('id', id);
        if (error) {
          console.warn(`Supabase cloud update warning (${table}):`, error.message);
          return { success: false, error: error.message };
        }
      } else if (action === 'upsert' && cleanPayload) {
        const { error } = await supabase.from(table).upsert([cleanPayload]);
        if (error) {
          console.warn(`Supabase cloud upsert warning (${table}):`, error.message);
          return { success: false, error: error.message };
        }
      } else if (action === 'delete' && id) {
        const { error } = await supabase.from(table).delete().eq('id', id);
        if (error) {
          console.warn(`Supabase cloud delete warning (${table}):`, error.message);
          return { success: false, error: error.message };
        }
      }
      return { success: true };
    } catch (err: any) {
      console.warn(`Supabase cloud sync error (${table}):`, err);
      return { success: false, error: err?.message || 'Sync error' };
    }
  }

  public async syncFromCloud(): Promise<boolean> {
    if (!supabase) return false;
    try {
      // Direct query helper for all school records
      const queryTable = async (table: string, filterDeleted = false) => {
        try {
          let q = supabase!.from(table).select('*');
          if (filterDeleted) {
            q = q.is('deleted_at', null);
          }
          if (this.activeSchoolAdminId) {
            q = q.or(`admin_id.eq.${this.activeSchoolAdminId},admin_id.is.null`);
          }
          const res = await q;
          return res.data || [];
        } catch {
          return [];
        }
      };

      const [cands, enrs, pays, apps, vehs, insts, exps, pkgs, sett, notes, rto] = await Promise.all([
        queryTable('candidates', true),
        queryTable('enrollments'),
        queryTable('payments'),
        queryTable('appointments', true),
        queryTable('vehicles'),
        queryTable('instructors'),
        queryTable('expenses'),
        queryTable('packages'),
        supabase.from('settings').select('*').maybeSingle().then((r) => r.data).catch(() => null),
        queryTable('candidate_notes'),
        queryTable('rto_tracking'),
      ]);

      // Seed Packages if empty in cloud
      if (!pkgs || pkgs.length === 0) {
        try {
          await supabase.from('packages').upsert(
            DEFAULT_PACKAGES.map((p) => ({ ...p, admin_id: this.activeSchoolAdminId || null }))
          );
        } catch (e) {
          console.warn(e);
        }
        this.set(STORAGE_KEYS.PACKAGES, DEFAULT_PACKAGES);
      } else {
        this.set(STORAGE_KEYS.PACKAGES, pkgs);
      }

      // Seed Settings if empty in cloud
      if (!sett) {
        try {
          await supabase.from('settings').upsert([
            { ...DEFAULT_SETTINGS, admin_id: this.activeSchoolAdminId || null }
          ]);
        } catch (e) {
          console.warn(e);
        }
        this.set(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
      } else {
        this.set(STORAGE_KEYS.SETTINGS, sett);
      }

      // Direct cloud hydration - guarantees exact sync across all devices and incognito
      this.set(STORAGE_KEYS.CANDIDATES, cands || []);
      this.set(STORAGE_KEYS.ENROLLMENTS, enrs || []);
      this.set(STORAGE_KEYS.PAYMENTS, pays || []);
      this.set(STORAGE_KEYS.APPOINTMENTS, apps || []);
      this.set(STORAGE_KEYS.VEHICLES, vehs && vehs.length > 0 ? vehs : DEFAULT_VEHICLES);
      this.set(STORAGE_KEYS.INSTRUCTORS, insts && insts.length > 0 ? insts : DEFAULT_INSTRUCTORS);
      this.set(STORAGE_KEYS.EXPENSES, exps || []);
      this.set(STORAGE_KEYS.NOTES, notes || []);
      this.set(STORAGE_KEYS.RTO, rto || []);

      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new Event('drivedesk_sync_complete'));
      return true;
    } catch (err) {
      console.warn('Sync from cloud error:', err);
      return false;
    }
  }

  // --- ACTIVITY LOGGING ---
  logActivity(action: 'INSERT' | 'UPDATE' | 'DELETE', table: string, recordId: string, details: string, oldValues?: any, newValues?: any, role: UserRole = 'admin') {
    const logs = this.getActivityLogs();
    const newLog: ActivityLogItem = {
      id: 'act-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      user_name: role === 'admin' ? 'Admin (Owner)' : 'Staff (Receptionist)',
      user_role: role,
      table_name: table,
      record_id: recordId,
      action,
      details,
      old_values: oldValues,
      new_values: newValues,
      created_at: new Date().toISOString(),
    };
    logs.unshift(newLog);
    // Keep max 500 log items
    if (logs.length > 500) logs.pop();
    this.set(STORAGE_KEYS.ACTIVITY_LOG, logs);
  }

  getActivityLogs(): ActivityLogItem[] {
    return this.get<ActivityLogItem[]>(STORAGE_KEYS.ACTIVITY_LOG, []);
  }

  // --- SETTINGS ---
  getSettings(): SchoolSettings {
    return this.get<SchoolSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  }

  updateSettings(updates: Partial<SchoolSettings>, role: UserRole = 'admin'): SchoolSettings {
    const current = this.getSettings();
    const updated = { ...current, ...updates, updated_at: new Date().toISOString() };
    this.set(STORAGE_KEYS.SETTINGS, updated);
    this.logActivity('UPDATE', 'settings', String(updated.id), 'Updated school settings and business rules', current, updated, role);
    this.syncToCloud('settings', 'upsert', updated);
    return updated;
  }

  // --- PACKAGES ---
  getPackages(onlyActive = false): Package[] {
    const list = this.get<Package[]>(STORAGE_KEYS.PACKAGES, DEFAULT_PACKAGES);
    return onlyActive ? list.filter((p) => p.is_active) : list;
  }

  getPackageById(id: string): Package | undefined {
    return this.getPackages().find((p) => p.id === id);
  }

  createPackage(pkgData: Omit<Package, 'id' | 'created_at' | 'updated_at'>, role: UserRole = 'admin'): Package {
    const packages = this.getPackages();
    const newPkg: Package = {
      ...pkgData,
      id: generateUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    packages.push(newPkg);
    this.set(STORAGE_KEYS.PACKAGES, packages);
    this.logActivity('INSERT', 'packages', newPkg.id, `Created package: ${newPkg.name}`, undefined, newPkg, role);
    this.syncToCloud('packages', 'insert', newPkg);
    return newPkg;
  }

  updatePackage(id: string, updates: Partial<Package>, role: UserRole = 'admin'): Package {
    const packages = this.getPackages();
    const idx = packages.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error('Package not found');
    const old = packages[idx];
    const updated: Package = { ...old, ...updates, updated_at: new Date().toISOString() };
    packages[idx] = updated;
    this.set(STORAGE_KEYS.PACKAGES, packages);
    this.logActivity('UPDATE', 'packages', id, `Updated package: ${updated.name}`, old, updated, role);
    this.syncToCloud('packages', 'update', updated, id);
    return updated;
  }

  // --- SEQUENTIAL GENERATORS ---
  getNextCandidateCode(): string {
    const candidates = this.getCandidates(true); // include soft-deleted
    let maxNum = 0;
    candidates.forEach((c) => {
      const match = c.candidate_code.match(/(?:GDS|DS)(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    });
    return `GDS${String(maxNum + 1).padStart(4, '0')}`;
  }

  getNextReceiptNumber(): string {
    const payments = this.getPayments();
    let maxNum = 1000;
    payments.forEach((p) => {
      const match = p.receipt_number.match(/R-(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    });
    return `R-${maxNum + 1}`;
  }

  // --- CANDIDATES & ENROLLMENTS ---
  getCandidates(includeDeleted = false): Candidate[] {
    const list = this.get<Candidate[]>(STORAGE_KEYS.CANDIDATES, []);
    return includeDeleted ? list : list.filter((c) => !c.deleted_at);
  }

  getCandidateById(id: string): Candidate | undefined {
    return this.getCandidates().find((c) => c.id === id);
  }

  getEnrollments(candidateId?: string): Enrollment[] {
    const list = this.get<Enrollment[]>(STORAGE_KEYS.ENROLLMENTS, []);
    const packages = this.getPackages();
    const enriched = list.map((e) => {
      const pkg = packages.find((p) => p.id === e.package_id);
      return {
        ...e,
        package_name: e.package_name || pkg?.name || 'Driving Package',
        vehicle_type: e.vehicle_type || pkg?.vehicle_type || 'car',
      };
    });
    return candidateId ? enriched.filter((e) => e.candidate_id === candidateId) : enriched;
  }

  getEnrollmentById(id: string): Enrollment | undefined {
    return this.getEnrollments().find((e) => e.id === id);
  }

  // CALCULATE STATS (DO NOT store derived numbers)
  calculateEnrollmentStats(enrollmentId: string): EnrollmentCalculatedStats | null {
    const enrollment = this.getEnrollmentById(enrollmentId);
    if (!enrollment) return null;

    const settings = this.getSettings();
    const payments = this.getPayments(enrollmentId);
    const appointments = this.getAppointments({ enrollmentId });

    // Net paid = sum of regular payments - reversals
    const amount_paid = payments.reduce((sum, p) => {
      if (p.is_reversal) {
        return sum - p.amount;
      }
      return sum + p.amount;
    }, 0);

    const net_fee = Math.max(0, enrollment.total_fee - (enrollment.discount_amount || 0));
    const balance = net_fee - amount_paid;

    const completedCount = appointments.filter((a) => a.status === 'completed' && !a.deleted_at).length;
    const absentCount = appointments.filter((a) => a.status === 'absent' && !a.deleted_at).length;

    // Business rule: absent_consumes_class
    const classes_used = completedCount + (settings.absent_consumes_class ? absentCount : 0);
    const classes_remaining = Math.max(0, enrollment.total_classes - classes_used);

    let is_expired = false;
    if (enrollment.expiry_date) {
      const today = new Date().toISOString().split('T')[0];
      is_expired = enrollment.expiry_date < today;
    }

    return {
      enrollment_id: enrollment.id,
      candidate_id: enrollment.candidate_id,
      package_id: enrollment.package_id,
      package_name: enrollment.package_name || 'Driving Package',
      vehicle_type: enrollment.vehicle_type || 'car',
      total_classes: enrollment.total_classes,
      total_fee: enrollment.total_fee,
      discount_amount: enrollment.discount_amount || 0,
      net_fee,
      amount_paid,
      balance,
      classes_completed: completedCount,
      classes_absent: absentCount,
      classes_used,
      classes_remaining,
      is_expired,
      expiry_date: enrollment.expiry_date,
    };
  }

  getCandidatesWithStats(): CandidateWithStats[] {
    const candidates = this.getCandidates();
    const instructors = this.getInstructors();

    return candidates.map((cand) => {
      const enrollments = this.getEnrollments(cand.id);
      const activeEnrollment = enrollments.find((e) => e.status === 'active') || enrollments[0];

      let stats: EnrollmentCalculatedStats | undefined = undefined;
      let total_balance_all_enrollments = 0;
      let total_classes_completed_all = 0;

      enrollments.forEach((e) => {
        const s = this.calculateEnrollmentStats(e.id);
        if (s) {
          total_balance_all_enrollments += s.balance;
          total_classes_completed_all += s.classes_completed;
          if (activeEnrollment && e.id === activeEnrollment.id) {
            stats = s;
          }
        }
      });

      // Find primary instructor from appointments if any
      const candidateAppointments = this.getAppointments({ candidateId: cand.id });
      let assigned_instructor_name: string | undefined = undefined;
      if (candidateAppointments.length > 0) {
        const lastApp = candidateAppointments[candidateAppointments.length - 1];
        const inst = instructors.find((i) => i.id === lastApp.instructor_id);
        if (inst) assigned_instructor_name = inst.name;
      }

      return {
        ...cand,
        active_enrollment: activeEnrollment,
        stats,
        total_balance_all_enrollments,
        total_classes_completed_all,
        assigned_instructor_name,
      };
    });
  }

  createCandidateWithEnrollment(
    candidateData: Omit<Candidate, 'id' | 'candidate_code' | 'deleted_at' | 'created_at' | 'updated_at'>,
    packageSelection: {
      package_id: string;
      total_classes: number;
      total_fee: number;
      discount_amount: number;
      start_date: string;
    },
    initialPayment?: {
      amount: number;
      mode: 'cash' | 'upi' | 'card' | 'bank_transfer' | 'online';
      remarks?: string;
    },
    role: UserRole = 'admin'
  ): { candidate: Candidate; enrollment: Enrollment; payment?: Payment } {
    const candidateCode = this.getNextCandidateCode();
    const candidateId = generateUUID();
    const enrollmentId = generateUUID();

    const selectedPkg = this.getPackageById(packageSelection.package_id);
    const settings = this.getSettings();

    // Calculate expiry date if validity days given
    let expiryDate: string | null = null;
    const validityDays = selectedPkg?.validity_days || settings.default_package_validity_days;
    if (validityDays) {
      const d = new Date(packageSelection.start_date);
      d.setDate(d.getDate() + validityDays);
      expiryDate = d.toISOString().split('T')[0];
    }

    const newCandidate: Candidate = {
      ...candidateData,
      id: candidateId,
      candidate_code: candidateCode,
      deleted_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const newEnrollment: Enrollment = {
      id: enrollmentId,
      candidate_id: candidateId,
      package_id: packageSelection.package_id,
      package_name: selectedPkg?.name || 'Driving Package',
      vehicle_type: selectedPkg?.vehicle_type || 'car',
      start_date: packageSelection.start_date,
      total_classes: packageSelection.total_classes,
      total_fee: packageSelection.total_fee,
      discount_amount: packageSelection.discount_amount || 0,
      status: 'active',
      expiry_date: expiryDate,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Save Candidate
    const candidates = this.getCandidates(true);
    candidates.push(newCandidate);
    this.set(STORAGE_KEYS.CANDIDATES, candidates);

    // Save Enrollment
    const enrollments = this.getEnrollments();
    enrollments.push(newEnrollment);
    this.set(STORAGE_KEYS.ENROLLMENTS, enrollments);

    this.logActivity('INSERT', 'candidates', candidateId, `Added candidate ${newCandidate.full_name} (${candidateCode})`, undefined, newCandidate, role);
    this.logActivity('INSERT', 'enrollments', enrollmentId, `Enrolled ${newCandidate.full_name} in ${newEnrollment.package_name}`, undefined, newEnrollment, role);

    // Sync to Supabase Cloud
    this.syncToCloud('candidates', 'insert', newCandidate);
    this.syncToCloud('enrollments', 'insert', newEnrollment);

    // Initial payment if any
    let recordedPayment: Payment | undefined = undefined;
    if (initialPayment && initialPayment.amount > 0) {
      recordedPayment = this.recordPayment(
        {
          candidate_id: candidateId,
          enrollment_id: enrollmentId,
          amount: initialPayment.amount,
          payment_date: packageSelection.start_date,
          mode: initialPayment.mode,
          remarks: initialPayment.remarks || 'Admission initial payment',
        },
        role
      );
    }

    // Initialize RTO Record
    const rtoRecords = this.getRTORecords();
    const newRTO: RTOTrainingRecord = {
      id: generateUUID(),
      enrollment_id: enrollmentId,
      candidate_id: candidateId,
      stage: candidateData.ll_number ? 'training_ongoing' : 'll_pending',
      ll_number: candidateData.ll_number,
      test_result: 'pending',
      remarks: 'Initial enrollment',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    rtoRecords.push(newRTO);
    this.set(STORAGE_KEYS.RTO, rtoRecords);
    this.syncToCloud('rto_tracking', 'insert', newRTO);

    return { candidate: newCandidate, enrollment: newEnrollment, payment: recordedPayment };
  }

  async createCandidateWithEnrollmentAsync(
    candidateData: Omit<Candidate, 'id' | 'candidate_code' | 'deleted_at' | 'created_at' | 'updated_at'>,
    packageSelection: {
      package_id: string;
      total_classes: number;
      total_fee: number;
      discount_amount: number;
      start_date: string;
    },
    initialPayment?: {
      amount: number;
      mode: 'cash' | 'upi' | 'card' | 'bank_transfer' | 'online';
      remarks?: string;
    },
    role: UserRole = 'admin'
  ): Promise<{ candidate: Candidate; enrollment: Enrollment; payment?: Payment }> {
    // 1. Save locally first for snappy UI
    const result = this.createCandidateWithEnrollment(candidateData, packageSelection, initialPayment, role);

    // 2. Directly await Supabase Cloud writes so it persists across all devices & incognito
    if (supabase) {
      try {
        await this.syncToCloud('candidates', 'insert', result.candidate);
        await this.syncToCloud('enrollments', 'insert', result.enrollment);
        if (result.payment) {
          await this.syncToCloud('payments', 'insert', result.payment);
        }
        const rtoRecord = this.getRTORecordByCandidateId(result.candidate.id);
        if (rtoRecord) {
          await this.syncToCloud('rto_tracking', 'insert', rtoRecord);
        }
      } catch (err) {
        console.warn('Direct cloud sync error on candidate creation:', err);
      }
    }

    return result;
  }

  updateCandidate(id: string, updates: Partial<Candidate>, role: UserRole = 'admin'): Candidate {
    const candidates = this.getCandidates(true);
    const idx = candidates.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error('Candidate not found');
    const old = candidates[idx];
    const updated: Candidate = { ...old, ...updates, updated_at: new Date().toISOString() };
    candidates[idx] = updated;
    this.set(STORAGE_KEYS.CANDIDATES, candidates);
    this.logActivity('UPDATE', 'candidates', id, `Updated candidate ${updated.full_name}`, old, updated, role);
    this.syncToCloud('candidates', 'update', updated, id);
    return updated;
  }

  softDeleteCandidate(id: string, role: UserRole = 'admin'): void {
    const candidates = this.getCandidates(true);
    const idx = candidates.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error('Candidate not found');
    const old = candidates[idx];
    candidates[idx].deleted_at = new Date().toISOString();
    this.set(STORAGE_KEYS.CANDIDATES, candidates);
    this.logActivity('DELETE', 'candidates', id, `Soft-deleted candidate ${old.full_name} (${old.candidate_code})`, old, undefined, role);
    this.syncToCloud('candidates', 'update', { deleted_at: candidates[idx].deleted_at }, id);
  }

  addEnrollment(
    candidateId: string,
    packageSelection: {
      package_id: string;
      total_classes: number;
      total_fee: number;
      discount_amount: number;
      start_date: string;
    },
    role: UserRole = 'admin'
  ): Enrollment {
    const selectedPkg = this.getPackageById(packageSelection.package_id);
    const settings = this.getSettings();
    let expiryDate: string | null = null;
    const validityDays = selectedPkg?.validity_days || settings.default_package_validity_days;
    if (validityDays) {
      const d = new Date(packageSelection.start_date);
      d.setDate(d.getDate() + validityDays);
      expiryDate = d.toISOString().split('T')[0];
    }

    const newEnrollment: Enrollment = {
      id: generateUUID(),
      candidate_id: candidateId,
      package_id: packageSelection.package_id,
      package_name: selectedPkg?.name || 'Package',
      vehicle_type: selectedPkg?.vehicle_type || 'car',
      start_date: packageSelection.start_date,
      total_classes: packageSelection.total_classes,
      total_fee: packageSelection.total_fee,
      discount_amount: packageSelection.discount_amount || 0,
      status: 'active',
      expiry_date: expiryDate,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const enrollments = this.getEnrollments();
    enrollments.push(newEnrollment);
    this.set(STORAGE_KEYS.ENROLLMENTS, enrollments);
    this.logActivity('INSERT', 'enrollments', newEnrollment.id, `Added enrollment for package ${newEnrollment.package_name}`, undefined, newEnrollment, role);
    this.syncToCloud('enrollments', 'insert', newEnrollment);
    return newEnrollment;
  }

  // --- PAYMENTS & REVERSALS ---
  getPayments(enrollmentId?: string): Payment[] {
    const list = this.get<Payment[]>(STORAGE_KEYS.PAYMENTS, []);
    return enrollmentId ? list.filter((p) => p.enrollment_id === enrollmentId) : list;
  }

  getPaymentById(id: string): Payment | undefined {
    return this.getPayments().find((p) => p.id === id);
  }

  recordPayment(
    data: {
      enrollment_id: string;
      candidate_id: string;
      amount: number;
      payment_date: string;
      mode: 'cash' | 'upi' | 'card' | 'bank_transfer' | 'online';
      remarks?: string;
    },
    role: UserRole = 'admin'
  ): Payment {
    if (data.amount <= 0) {
      throw new Error('Payment amount must be greater than zero');
    }

    const receiptNumber = this.getNextReceiptNumber();
    const newPayment: Payment = {
      id: generateUUID(),
      enrollment_id: data.enrollment_id,
      candidate_id: data.candidate_id,
      amount: data.amount,
      payment_date: data.payment_date,
      mode: data.mode,
      receipt_number: receiptNumber,
      remarks: data.remarks || '',
      is_reversal: false,
      reverses_payment_id: null,
      created_by: this.activeUserId || null,
      created_at: new Date().toISOString(),
    };

    const payments = this.getPayments();
    payments.push(newPayment);
    this.set(STORAGE_KEYS.PAYMENTS, payments);

    const cand = this.getCandidateById(data.candidate_id);
    this.logActivity(
      'INSERT',
      'payments',
      newPayment.id,
      `Recorded payment ₹${data.amount} (${receiptNumber}) for ${cand?.full_name || 'Candidate'}`,
      undefined,
      newPayment,
      role
    );
    this.syncToCloud('payments', 'insert', newPayment);

    return newPayment;
  }

  reversePayment(
    originalPaymentId: string,
    reason: string,
    role: UserRole = 'admin'
  ): Payment {
    const original = this.getPaymentById(originalPaymentId);
    if (!original) throw new Error('Original payment not found');
    if (original.is_reversal) throw new Error('Cannot reverse a reversal entry');

    const receiptNumber = `${original.receipt_number}-REV`;
    const reversalPayment: Payment = {
      id: generateUUID(),
      enrollment_id: original.enrollment_id,
      candidate_id: original.candidate_id,
      amount: original.amount,
      payment_date: new Date().toISOString().split('T')[0],
      mode: original.mode,
      receipt_number: receiptNumber,
      remarks: `Reversal: ${reason}`,
      is_reversal: true,
      reverses_payment_id: original.id,
      reversal_reason: reason,
      created_by: this.activeUserId || null,
      created_at: new Date().toISOString(),
    };

    const payments = this.getPayments();
    payments.push(reversalPayment);
    this.set(STORAGE_KEYS.PAYMENTS, payments);

    this.logActivity(
      'INSERT',
      'payments',
      reversalPayment.id,
      `Reversed payment ${original.receipt_number} of ₹${original.amount}. Reason: ${reason}`,
      original,
      reversalPayment,
      role
    );
    this.syncToCloud('payments', 'insert', reversalPayment);

    return reversalPayment;
  }

  // --- INSTRUCTORS & LEAVES ---
  getInstructors(): Instructor[] {
    return this.get<Instructor[]>(STORAGE_KEYS.INSTRUCTORS, DEFAULT_INSTRUCTORS);
  }

  getInstructorById(id: string): Instructor | undefined {
    return this.getInstructors().find((i) => i.id === id);
  }

  updateInstructor(id: string, updates: Partial<Instructor>, role: UserRole = 'admin'): Instructor {
    const list = this.getInstructors();
    const idx = list.findIndex((i) => i.id === id);
    if (idx === -1) throw new Error('Instructor not found');
    const old = list[idx];
    const updated = { ...old, ...updates, updated_at: new Date().toISOString() };
    list[idx] = updated;
    this.set(STORAGE_KEYS.INSTRUCTORS, list);
    this.logActivity('UPDATE', 'instructors', id, `Updated instructor ${updated.name}`, old, updated, role);
    this.syncToCloud('instructors', 'update', updated, id);
    return updated;
  }

  getInstructorLeaves(instructorId?: string): InstructorLeave[] {
    const list = this.get<InstructorLeave[]>(STORAGE_KEYS.INSTRUCTOR_LEAVES, []);
    return instructorId ? list.filter((l) => l.instructor_id === instructorId) : list;
  }

  addInstructorLeave(leave: Omit<InstructorLeave, 'id' | 'created_at'>, role: UserRole = 'admin'): InstructorLeave {
    const leaves = this.getInstructorLeaves();
    const newLeave: InstructorLeave = {
      ...leave,
      id: generateUUID(),
      created_at: new Date().toISOString(),
    };
    leaves.push(newLeave);
    this.set(STORAGE_KEYS.INSTRUCTOR_LEAVES, leaves);
    this.logActivity('INSERT', 'instructor_leaves', newLeave.id, `Added leave from ${leave.from_date} to ${leave.to_date}`, undefined, newLeave, role);
    this.syncToCloud('instructor_leaves', 'insert', newLeave);
    return newLeave;
  }

  // --- VEHICLES ---
  getVehicles(): Vehicle[] {
    return this.get<Vehicle[]>(STORAGE_KEYS.VEHICLES, DEFAULT_VEHICLES);
  }

  getVehicleById(id: string): Vehicle | undefined {
    return this.getVehicles().find((v) => v.id === id);
  }

  createVehicle(
    data: Omit<Vehicle, 'id' | 'created_at' | 'updated_at'>,
    role: UserRole = 'admin'
  ): Vehicle {
    const list = this.getVehicles();
    const newVehicle: Vehicle = {
      ...data,
      id: generateUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    list.push(newVehicle);
    this.set(STORAGE_KEYS.VEHICLES, list);
    this.logActivity('INSERT', 'vehicles', newVehicle.id, `Created vehicle ${newVehicle.registration_number}`, undefined, newVehicle, role);
    this.syncToCloud('vehicles', 'insert', newVehicle);
    return newVehicle;
  }

  updateVehicle(id: string, updates: Partial<Vehicle>, role: UserRole = 'admin'): Vehicle {
    const list = this.getVehicles();
    const idx = list.findIndex((v) => v.id === id);
    if (idx === -1) throw new Error('Vehicle not found');
    const old = list[idx];
    const updated = { ...old, ...updates, updated_at: new Date().toISOString() };
    list[idx] = updated;
    this.set(STORAGE_KEYS.VEHICLES, list);
    this.logActivity('UPDATE', 'vehicles', id, `Updated vehicle ${updated.registration_number}`, old, updated, role);
    this.syncToCloud('vehicles', 'update', updated, id);
    return updated;
  }

  // --- HOLIDAYS ---
  getHolidays(): Holiday[] {
    return this.get<Holiday[]>(STORAGE_KEYS.HOLIDAYS, []);
  }

  isHoliday(dateString: string): boolean {
    return this.getHolidays().some((h) => h.date === dateString);
  }

  // --- APPOINTMENTS & DOUBLE BOOKING PREVENTION ---
  getAppointments(filters?: {
    candidateId?: string;
    enrollmentId?: string;
    instructorId?: string;
    vehicleId?: string;
    date?: string;
    includeDeleted?: boolean;
  }): Appointment[] {
    let list = this.get<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, []);
    if (!filters?.includeDeleted) {
      list = list.filter((a) => !a.deleted_at);
    }
    if (filters?.candidateId) list = list.filter((a) => a.candidate_id === filters.candidateId);
    if (filters?.enrollmentId) list = list.filter((a) => a.enrollment_id === filters.enrollmentId);
    if (filters?.instructorId) list = list.filter((a) => a.instructor_id === filters.instructorId);
    if (filters?.vehicleId) list = list.filter((a) => a.vehicle_id === filters.vehicleId);
    if (filters?.date) list = list.filter((a) => a.appointment_date === filters.date);
    return list;
  }

  /**
   * DATABASE-LEVEL DOUBLE BOOKING ENFORCEMENT SIMULATION
   * Enforces partial unique constraints:
   * 1. (instructor_id, appointment_date, start_time) unique for booked/completed/absent
   * 2. (vehicle_id, appointment_date, start_time) unique for booked/completed/absent
   * 3. (candidate_id, appointment_date, start_time) unique for booked/completed/absent
   * 4. Block on holidays
   * 5. Block on instructor leaves
   * 6. Block on vehicle 'service' or 'not_available'
   */
  validateBookingSlot(params: {
    instructor_id: string;
    vehicle_id: string;
    candidate_id: string;
    appointment_date: string;
    start_time: string;
    excludeAppointmentId?: string;
  }): { valid: boolean; reason?: string } {
    const { instructor_id, vehicle_id, candidate_id, appointment_date, start_time, excludeAppointmentId } = params;

    // 1. Holiday check
    if (this.isHoliday(appointment_date)) {
      const holiday = this.getHolidays().find((h) => h.date === appointment_date);
      return { valid: false, reason: `Booking blocked: ${appointment_date} is a holiday (${holiday?.description || 'Holiday'})` };
    }

    // 2. Instructor leave check
    const leaves = this.getInstructorLeaves(instructor_id);
    const onLeave = leaves.some((l) => appointment_date >= l.from_date && appointment_date <= l.to_date);
    if (onLeave) {
      const inst = this.getInstructorById(instructor_id);
      return { valid: false, reason: `Booking blocked: Instructor ${inst?.name || ''} is on leave on ${appointment_date}` };
    }

    // 3. Vehicle service status check
    const vehicle = this.getVehicleById(vehicle_id);
    if (vehicle && (vehicle.status === 'service' || vehicle.status === 'not_available')) {
      return { valid: false, reason: `Booking blocked: Vehicle ${vehicle.registration_number} is currently under service / unavailable` };
    }

    // 4. Overlap checks against existing booked/completed/absent appointments
    const allApps = this.getAppointments();
    const blockingStatuses = ['booked', 'completed', 'absent'];

    for (const app of allApps) {
      if (excludeAppointmentId && app.id === excludeAppointmentId) continue;
      if (!blockingStatuses.includes(app.status)) continue;
      if (app.appointment_date !== appointment_date) continue;
      if (app.start_time !== start_time) continue;

      if (app.instructor_id === instructor_id) {
        const inst = this.getInstructorById(instructor_id);
        return {
          valid: false,
          reason: `Double-booking conflict: Instructor ${inst?.name || 'Selected instructor'} already has an appointment at ${start_time} on ${appointment_date}`,
        };
      }

      if (app.vehicle_id === vehicle_id) {
        return {
          valid: false,
          reason: `Double-booking conflict: Vehicle ${vehicle?.registration_number || 'Selected vehicle'} is already booked at ${start_time} on ${appointment_date}`,
        };
      }

      if (app.candidate_id === candidate_id) {
        const cand = this.getCandidateById(candidate_id);
        return {
          valid: false,
          reason: `Double-booking conflict: Candidate ${cand?.full_name || 'Candidate'} already has a scheduled class at ${start_time} on ${appointment_date}`,
        };
      }
    }

    return { valid: true };
  }

  createAppointment(
    data: Omit<Appointment, 'id' | 'deleted_at' | 'created_at' | 'updated_at'>,
    role: UserRole = 'admin'
  ): Appointment {
    const validation = this.validateBookingSlot({
      instructor_id: data.instructor_id,
      vehicle_id: data.vehicle_id,
      candidate_id: data.candidate_id,
      appointment_date: data.appointment_date,
      start_time: data.start_time,
    });

    if (!validation.valid) {
      throw new Error(validation.reason);
    }

    const newApp: Appointment = {
      ...data,
      id: generateUUID(),
      created_by: this.activeUserId || null,
      deleted_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const apps = this.getAppointments({ includeDeleted: true });
    apps.push(newApp);
    this.set(STORAGE_KEYS.APPOINTMENTS, apps);

    const cand = this.getCandidateById(data.candidate_id);
    this.logActivity(
      'INSERT',
      'appointments',
      newApp.id,
      `Booked appointment for ${cand?.full_name} on ${data.appointment_date} at ${data.start_time}`,
      undefined,
      newApp,
      role
    );
    this.syncToCloud('appointments', 'insert', newApp);

    return newApp;
  }

  updateAppointmentStatus(
    id: string,
    status: 'booked' | 'completed' | 'absent' | 'cancelled' | 'rescheduled',
    remarks?: string,
    role: UserRole = 'admin'
  ): Appointment {
    const apps = this.getAppointments({ includeDeleted: true });
    const idx = apps.findIndex((a) => a.id === id);
    if (idx === -1) throw new Error('Appointment not found');

    const old = apps[idx];
    const updated: Appointment = {
      ...old,
      status,
      remarks: remarks !== undefined ? remarks : old.remarks,
      updated_at: new Date().toISOString(),
    };

    apps[idx] = updated;
    this.set(STORAGE_KEYS.APPOINTMENTS, apps);

    this.logActivity('UPDATE', 'appointments', id, `Updated appointment status to ${status}`, old, updated, role);
    this.syncToCloud('appointments', 'update', updated, id);
    return updated;
  }

  rescheduleAppointment(
    appointmentId: string,
    newDate: string,
    newStartTime: string,
    newEndTime: string,
    reason?: string,
    role: UserRole = 'admin'
  ): Appointment {
    const apps = this.getAppointments({ includeDeleted: true });
    const original = apps.find((a) => a.id === appointmentId);
    if (!original) throw new Error('Original appointment not found');

    // Validate new slot
    const validation = this.validateBookingSlot({
      instructor_id: original.instructor_id,
      vehicle_id: original.vehicle_id,
      candidate_id: original.candidate_id,
      appointment_date: newDate,
      start_time: newStartTime,
    });

    if (!validation.valid) {
      throw new Error(validation.reason);
    }

    // Mark original as rescheduled
    original.status = 'rescheduled';
    original.remarks = reason ? `Rescheduled: ${reason}` : 'Rescheduled';
    original.updated_at = new Date().toISOString();

    // Create new appointment linking back
    const newApp: Appointment = {
      id: generateUUID(),
      enrollment_id: original.enrollment_id,
      candidate_id: original.candidate_id,
      instructor_id: original.instructor_id,
      vehicle_id: original.vehicle_id,
      appointment_date: newDate,
      start_time: newStartTime,
      end_time: newEndTime,
      status: 'booked',
      remarks: reason ? `Rescheduled from ${original.appointment_date}: ${reason}` : `Rescheduled from ${original.appointment_date}`,
      rescheduled_from_id: original.id,
      created_by: role === 'admin' ? 'Admin' : 'Staff',
      deleted_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    apps.push(newApp);
    this.set(STORAGE_KEYS.APPOINTMENTS, apps);

    this.logActivity('UPDATE', 'appointments', original.id, `Rescheduled appointment to ${newDate} at ${newStartTime}`, original, newApp, role);
    this.syncToCloud('appointments', 'update', { status: 'rescheduled', remarks: original.remarks, updated_at: original.updated_at }, original.id);
    this.syncToCloud('appointments', 'insert', newApp);
    return newApp;
  }

  cancelAppointment(
    appointmentId: string,
    reason: string,
    role: UserRole = 'admin'
  ): Appointment {
    return this.updateAppointmentStatus(appointmentId, 'cancelled', `Cancelled: ${reason}`, role);
  }

  reassignAppointment(
    appointmentId: string,
    newInstructorId: string,
    newVehicleId: string,
    role: UserRole = 'admin'
  ): Appointment {
    const apps = this.getAppointments({ includeDeleted: true });
    const idx = apps.findIndex((a) => a.id === appointmentId);
    if (idx === -1) throw new Error('Appointment not found');

    const app = apps[idx];

    // Validate new instructor and vehicle
    const validation = this.validateBookingSlot({
      instructor_id: newInstructorId,
      vehicle_id: newVehicleId,
      candidate_id: app.candidate_id,
      appointment_date: app.appointment_date,
      start_time: app.start_time,
      excludeAppointmentId: app.id,
    });

    if (!validation.valid) {
      throw new Error(validation.reason);
    }

    const old = { ...app };
    app.instructor_id = newInstructorId;
    app.vehicle_id = newVehicleId;
    app.updated_at = new Date().toISOString();

    apps[idx] = app;
    this.set(STORAGE_KEYS.APPOINTMENTS, apps);

    const inst = this.getInstructorById(newInstructorId);
    const veh = this.getVehicleById(newVehicleId);
    this.logActivity(
      'UPDATE',
      'appointments',
      app.id,
      `Reassigned appointment to ${inst?.name || 'Instructor'} (${veh?.registration_number || 'Vehicle'})`,
      old,
      app,
      role
    );
    this.syncToCloud('appointments', 'update', { instructor_id: newInstructorId, vehicle_id: newVehicleId, updated_at: app.updated_at }, app.id);
    return app;
  }

  bulkReassign(
    params: {
      affectedInstructorId?: string;
      affectedVehicleId?: string;
      fromDate?: string;
      toDate?: string;
      newInstructorId?: string;
      newVehicleId?: string;
    },
    role: UserRole = 'admin'
  ): { reassignedCount: number; conflicts: string[] } {
    const apps = this.getAppointments({ includeDeleted: false });
    const matching = apps.filter((a) => {
      if (a.status !== 'booked') return false;
      if (params.affectedInstructorId && a.instructor_id !== params.affectedInstructorId) return false;
      if (params.affectedVehicleId && a.vehicle_id !== params.affectedVehicleId) return false;
      if (params.fromDate && a.appointment_date < params.fromDate) return false;
      if (params.toDate && a.appointment_date > params.toDate) return false;
      return true;
    });

    let reassignedCount = 0;
    const conflicts: string[] = [];

    matching.forEach((a) => {
      const targetInstructorId = params.newInstructorId || a.instructor_id;
      const targetVehicleId = params.newVehicleId || a.vehicle_id;

      const validation = this.validateBookingSlot({
        instructor_id: targetInstructorId,
        vehicle_id: targetVehicleId,
        candidate_id: a.candidate_id,
        appointment_date: a.appointment_date,
        start_time: a.start_time,
        excludeAppointmentId: a.id,
      });

      if (validation.valid) {
        a.instructor_id = targetInstructorId;
        a.vehicle_id = targetVehicleId;
        a.updated_at = new Date().toISOString();
        reassignedCount++;
      } else {
        const cand = this.getCandidateById(a.candidate_id);
        conflicts.push(`${cand?.full_name || 'Candidate'} on ${a.appointment_date} at ${a.start_time}: ${validation.reason}`);
      }
    });

    this.set(STORAGE_KEYS.APPOINTMENTS, apps);
    this.logActivity('UPDATE', 'appointments', 'bulk', `Bulk reassigned ${reassignedCount} appointments (${conflicts.length} conflicts)`, undefined, undefined, role);

    return { reassignedCount, conflicts };
  }

  bookMultipleClasses(
    params: {
      candidate_id: string;
      enrollment_id: string;
      instructor_id: string;
      vehicle_id: string;
      start_date: string;
      num_classes: number;
      start_time: string;
      end_time: string;
      selected_weekdays?: number[]; // 0=Sunday, 1=Monday...
      admin_override?: boolean;
    },
    role: UserRole = 'admin'
  ): { booked: Appointment[]; skipped: { date: string; reason: string }[] } {
    const booked: Appointment[] = [];
    const skipped: { date: string; reason: string }[] = [];

    // Check remaining classes
    const stats = this.calculateEnrollmentStats(params.enrollment_id);
    if (stats && stats.classes_remaining < params.num_classes && !params.admin_override) {
      throw new Error(
        `Candidate only has ${stats.classes_remaining} remaining classes in active package. (Admin override required to exceed)`
      );
    }

    const startDateObj = new Date(params.start_date);
    let currentDate = new Date(startDateObj);
    let attempts = 0;
    const maxDaysToScan = 60; // scan up to 60 days to fill the requested classes

    while (booked.length < params.num_classes && attempts < maxDaysToScan) {
      attempts++;
      const dateStr = currentDate.toISOString().split('T')[0];
      const dayOfWeek = currentDate.getDay();

      // Check if day is selected (if weekday filter given)
      if (params.selected_weekdays && params.selected_weekdays.length > 0) {
        if (!params.selected_weekdays.includes(dayOfWeek)) {
          currentDate.setDate(currentDate.getDate() + 1);
          continue;
        }
      }

      // Validate slot
      const validation = this.validateBookingSlot({
        instructor_id: params.instructor_id,
        vehicle_id: params.vehicle_id,
        candidate_id: params.candidate_id,
        appointment_date: dateStr,
        start_time: params.start_time,
      });

      if (validation.valid) {
        const app = this.createAppointment(
          {
            enrollment_id: params.enrollment_id,
            candidate_id: params.candidate_id,
            instructor_id: params.instructor_id,
            vehicle_id: params.vehicle_id,
            appointment_date: dateStr,
            start_time: params.start_time,
            end_time: params.end_time,
            status: 'booked',
            remarks: `Recurring booking (${booked.length + 1} of ${params.num_classes})`,
            rescheduled_from_id: null,
            created_by: role === 'admin' ? 'Admin' : 'Staff',
          },
          role
        );
        booked.push(app);
      } else {
        skipped.push({ date: dateStr, reason: validation.reason || 'Slot occupied' });
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return { booked, skipped };
  }

  // --- PENDING BALANCE TABLE HELPER ---
  getPendingBalanceSummaryList() {
    const candidates = this.getCandidates();
    const payments = this.getPayments();
    const appointments = this.getAppointments();
    const today = new Date().toISOString().split('T')[0];

    const result = candidates
      .map((c) => {
        const enrollments = this.getEnrollments(c.id);
        const activeEnr = enrollments.find((e) => e.status === 'active') || enrollments[0];
        if (!activeEnr) return null;

        const stats = this.calculateEnrollmentStats(activeEnr.id);
        const balance = stats?.balance || 0;
        if (balance <= 0) return null;

        // Last payment
        const cPayments = payments.filter((p) => p.candidate_id === c.id && !p.is_reversal);
        cPayments.sort((a, b) => b.payment_date.localeCompare(a.payment_date));
        const lastPayment = cPayments[0];

        // Next class
        const futureApps = appointments.filter(
          (a) => a.candidate_id === c.id && a.appointment_date >= today && a.status === 'booked'
        );
        futureApps.sort((a, b) => a.appointment_date.localeCompare(b.appointment_date));
        const nextClass = futureApps[0];

        // Days since joining
        const joinDate = new Date(c.joining_date);
        const now = new Date();
        const diffDays = Math.max(0, Math.floor((now.getTime() - joinDate.getTime()) / (1000 * 3600 * 24)));

        return {
          candidate: c,
          activeEnrollment: activeEnr,
          total_fee: activeEnr.total_fee,
          amount_paid: stats?.amount_paid || 0,
          balance,
          last_payment_date: lastPayment?.payment_date,
          last_payment_amount: lastPayment?.amount,
          next_class_date: nextClass?.appointment_date,
          next_class_time: nextClass?.start_time,
          days_since_joining: diffDays,
        };
      })
      .filter(Boolean) as {
      candidate: Candidate;
      activeEnrollment: Enrollment;
      total_fee: number;
      amount_paid: number;
      balance: number;
      last_payment_date?: string;
      last_payment_amount?: number;
      next_class_date?: string;
      next_class_time?: string;
      days_since_joining: number;
    }[];

    result.sort((a, b) => b.balance - a.balance);
    return result;
  }

  // --- MONTHLY FINANCIAL SUMMARY (LAST 6 MONTHS) ---
  getMonthlyFinancialHistory() {
    const payments = this.getPayments();
    const expenses = this.getExpenses();

    const months: { monthKey: string; label: string; income: number; expense: number; net: number }[] = [];
    const date = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(date.getFullYear(), date.getMonth() - i, 1);
      const year = d.getFullYear();
      const monthNum = String(d.getMonth() + 1).padStart(2, '0');
      const monthKey = `${year}-${monthNum}`;
      const monthLabel = d.toLocaleString('en-US', { month: 'short' });

      // Income in this month
      const monthPayments = payments.filter((p) => p.payment_date.startsWith(monthKey));
      const income = monthPayments.reduce((sum, p) => (p.is_reversal ? sum - p.amount : sum + p.amount), 0);

      // Expense in this month
      const monthExpenses = expenses.filter((e) => e.expense_date.startsWith(monthKey));
      const expense = monthExpenses.reduce((sum, e) => sum + e.amount, 0);

      months.push({
        monthKey,
        label: monthLabel,
        income,
        expense,
        net: income - expense,
      });
    }

    return months;
  }

  // --- RTO TRACKING ---
  getRTORecords(): RTOTrainingRecord[] {
    return this.get<RTOTrainingRecord[]>(STORAGE_KEYS.RTO, []);
  }

  getRTORecordByCandidateId(candidateId: string): RTOTrainingRecord | undefined {
    return this.getRTORecords().find((r) => r.candidate_id === candidateId);
  }

  // --- EXPENSES ---
  getExpenses(): Expense[] {
    return this.get<Expense[]>(STORAGE_KEYS.EXPENSES, []);
  }

  addExpense(data: Omit<Expense, 'id' | 'created_at'>, role: UserRole = 'admin'): Expense {
    const list = this.getExpenses();
    const newExpense: Expense = {
      ...data,
      id: generateUUID(),
      created_at: new Date().toISOString(),
    };
    list.unshift(newExpense);
    this.set(STORAGE_KEYS.EXPENSES, list);
    this.logActivity('INSERT', 'expenses', newExpense.id, `Recorded expense ₹${data.amount} for ${data.category}`, undefined, newExpense, role);
    this.syncToCloud('expenses', 'insert', newExpense);
    return newExpense;
  }

  updateExpense(id: string, updates: Partial<Expense>, role: UserRole = 'admin'): Expense {
    const list = this.getExpenses();
    const idx = list.findIndex((e) => e.id === id);
    if (idx === -1) throw new Error('Expense not found');
    const old = list[idx];
    const updated: Expense = { ...old, ...updates };
    list[idx] = updated;
    this.set(STORAGE_KEYS.EXPENSES, list);
    this.logActivity('UPDATE', 'expenses', id, `Updated expense details for ${updated.category}`, old, updated, role);
    this.syncToCloud('expenses', 'update', updated, id);
    return updated;
  }

  deleteExpense(id: string, role: UserRole = 'admin'): void {
    const list = this.getExpenses();
    const idx = list.findIndex((e) => e.id === id);
    if (idx === -1) throw new Error('Expense not found');
    const old = list[idx];
    list.splice(idx, 1);
    this.set(STORAGE_KEYS.EXPENSES, list);
    this.logActivity('DELETE', 'expenses', id, `Deleted expense of ₹${old.amount} (${old.category})`, old, undefined, role);
    this.syncToCloud('expenses', 'delete', undefined, id);
  }

  // --- NOTES ---
  getCandidateNotes(candidateId?: string): CandidateNote[] {
    const list = this.get<CandidateNote[]>(STORAGE_KEYS.NOTES, []);
    return candidateId ? list.filter((n) => n.candidate_id === candidateId) : list;
  }

  addCandidateNote(data: Omit<CandidateNote, 'id' | 'created_at'>, role: UserRole = 'admin'): CandidateNote {
    const list = this.getCandidateNotes();
    const newNote: CandidateNote = {
      ...data,
      id: generateUUID(),
      created_at: new Date().toISOString(),
    };
    list.unshift(newNote);
    this.set(STORAGE_KEYS.NOTES, list);
    this.syncToCloud('candidate_notes', 'insert', newNote);
    return newNote;
  }

  toggleNoteDone(noteId: string, role: UserRole = 'admin'): CandidateNote | undefined {
    const list = this.getCandidateNotes();
    const note = list.find((n) => n.id === noteId);
    if (!note) return undefined;
    note.is_done = !note.is_done;
    this.set(STORAGE_KEYS.NOTES, list);
    this.syncToCloud('candidate_notes', 'update', { is_done: note.is_done }, noteId);
    return note;
  }

  createInstructor(
    data: Omit<Instructor, 'id' | 'created_at' | 'updated_at'>,
    role: UserRole = 'admin'
  ): Instructor {
    const list = this.getInstructors();
    const newInst: Instructor = {
      ...data,
      id: generateUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    list.push(newInst);
    this.set(STORAGE_KEYS.INSTRUCTORS, list);
    this.logActivity('INSERT', 'instructors', newInst.id, `Created instructor ${newInst.name}`, undefined, newInst, role);
    this.syncToCloud('instructors', 'insert', newInst);
    return newInst;
  }

  getInstructorStats(instructorId: string, monthKey?: string) {
    const appointments = this.getAppointments();
    const today = new Date().toISOString().split('T')[0];

    const instApps = appointments.filter((a) => a.instructor_id === instructorId && !a.deleted_at);
    const todayCount = instApps.filter((a) => a.appointment_date === today).length;

    // Filter by month for completed classes
    const completedApps = instApps.filter((a) => {
      if (a.status !== 'completed') return false;
      if (monthKey && !a.appointment_date.startsWith(monthKey)) return false;
      return true;
    });

    // Unique active candidates instructed
    const activeCandidatesIds = new Set(instApps.filter((a) => a.status === 'booked' || a.status === 'completed').map((a) => a.candidate_id));

    return {
      todayClassesCount: todayCount,
      completedClassesCount: completedApps.length,
      activeCandidatesCount: activeCandidatesIds.size,
      totalClasses: instApps.length,
      appointments: instApps,
    };
  }

  getVehicleExpenses(vehicleId: string): { expenses: Expense[]; totalCost: number } {
    const allExpenses = this.getExpenses();
    const vehicleExpenses = allExpenses.filter((e) => e.vehicle_id === vehicleId);
    const totalCost = vehicleExpenses.reduce((sum, e) => sum + e.amount, 0);
    return { expenses: vehicleExpenses, totalCost };
  }

  updateRTORecord(id: string, updates: Partial<RTOTrainingRecord>, role: UserRole = 'admin'): RTOTrainingRecord {
    const list = this.getRTORecords();
    const idx = list.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error('RTO Record not found');

    const old = list[idx];
    const updated: RTOTrainingRecord = { ...old, ...updates, updated_at: new Date().toISOString() };
    list[idx] = updated;
    this.set(STORAGE_KEYS.RTO, list);
    this.logActivity('UPDATE', 'rto_tracking', id, `Updated RTO tracking details for candidate`, old, updated, role);
    this.syncToCloud('rto_tracking', 'update', updated, id);
    return updated;
  }

  updateRTOStage(
    rtoId: string,
    newStage: 'll_pending' | 'll_completed' | 'training_ongoing' | 'test_booked' | 'test_completed' | 'licence_received',
    notes?: string,
    role: UserRole = 'admin'
  ): RTOTrainingRecord {
    const list = this.getRTORecords();
    const idx = list.findIndex((r) => r.id === rtoId);
    if (idx === -1) throw new Error('RTO Record not found');

    const old = list[idx];
    const updated: RTOTrainingRecord = {
      ...old,
      stage: newStage,
      updated_at: new Date().toISOString(),
    };

    list[idx] = updated;
    this.set(STORAGE_KEYS.RTO, list);

    this.logActivity(
      'UPDATE',
      'rto_tracking',
      rtoId,
      `Moved RTO stage to ${newStage.replace('_', ' ').toUpperCase()}${notes ? ` (${notes})` : ''}`,
      old,
      updated,
      role
    );
    this.syncToCloud('rto_tracking', 'update', updated, rtoId);

    return updated;
  }

  recordTestResult(
    rtoId: string,
    testResult: 'pass' | 'fail' | 'pending',
    notes?: string,
    rescheduleDate?: string,
    role: UserRole = 'admin'
  ): RTOTrainingRecord {
    const list = this.getRTORecords();
    const idx = list.findIndex((r) => r.id === rtoId);
    if (idx === -1) throw new Error('RTO Record not found');

    const old = list[idx];
    const updated: RTOTrainingRecord = {
      ...old,
      test_result: testResult,
      remarks: notes ? `${old.remarks ? old.remarks + ' | ' : ''}${notes}` : old.remarks,
      test_date: testResult === 'fail' && rescheduleDate ? rescheduleDate : old.test_date,
      stage: testResult === 'pass' ? 'test_completed' : old.stage,
      updated_at: new Date().toISOString(),
    };

    list[idx] = updated;
    this.set(STORAGE_KEYS.RTO, list);

    this.logActivity(
      'UPDATE',
      'rto_tracking',
      rtoId,
      `Recorded driving test result: ${testResult.toUpperCase()}${rescheduleDate ? ` (Rescheduled to ${rescheduleDate})` : ''}`,
      old,
      updated,
      role
    );
    this.syncToCloud('rto_tracking', 'update', updated, rtoId);

    return updated;
  }
}

export const db = new DriveDeskStorage();
