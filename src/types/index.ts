export type UserRole = 'admin' | 'staff';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export type CandidateStatus = 'active' | 'completed' | 'hold' | 'cancelled';
export type VehicleType = 'car' | 'bike';
export type PaymentMode = 'cash' | 'upi' | 'card' | 'bank_transfer' | 'online';
export type AppointmentStatus = 'booked' | 'completed' | 'absent' | 'cancelled' | 'rescheduled';
export type InstructorStatus = 'active' | 'on_leave' | 'inactive';
export type VehicleStatus = 'available' | 'service' | 'not_available';
export type RTOStage = 'll_pending' | 'll_completed' | 'training_ongoing' | 'test_booked' | 'test_completed' | 'licence_received';
export type TestResult = 'pass' | 'fail' | 'pending';
export type ExpenseCategory = 'fuel' | 'vehicle_service' | 'repairs' | 'salary' | 'office' | 'rto' | 'miscellaneous';

export interface Package {
  id: string;
  name: string;
  vehicle_type: VehicleType;
  total_classes: number;
  fee: number;
  validity_days: number | null;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Candidate {
  id: string;
  candidate_code: string; // e.g. "DS0001"
  full_name: string;
  mobile: string;
  alt_mobile?: string;
  address?: string;
  date_of_birth?: string;
  joining_date: string;
  ll_number?: string;
  ll_issue_date?: string;
  ll_expiry_date?: string;
  status: CandidateStatus;
  notes_summary?: string;
  deleted_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Enrollment {
  id: string;
  candidate_id: string;
  package_id: string;
  package_name?: string;
  vehicle_type?: VehicleType;
  start_date: string;
  total_classes: number;
  total_fee: number;
  discount_amount: number;
  status: 'active' | 'completed' | 'cancelled' | 'expired';
  expiry_date?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  enrollment_id: string;
  candidate_id: string;
  amount: number;
  payment_date: string;
  mode: PaymentMode;
  receipt_number: string; // e.g. "R-1001"
  remarks?: string;
  is_reversal: boolean;
  reverses_payment_id?: string | null;
  reversal_reason?: string;
  created_by?: string;
  created_at: string;
}

export interface Instructor {
  id: string;
  name: string;
  mobile: string;
  licence_number: string;
  licence_expiry?: string;
  working_start_time: string; // e.g. "06:00"
  working_end_time: string; // e.g. "20:00"
  assigned_vehicle_id?: string | null;
  status: InstructorStatus;
  joining_date: string;
  created_at: string;
  updated_at: string;
}

export interface InstructorLeave {
  id: string;
  instructor_id: string;
  from_date: string;
  to_date: string;
  reason: string;
  created_at: string;
}

export interface Vehicle {
  id: string;
  registration_number: string;
  type: VehicleType;
  model: string;
  assigned_instructor_id?: string | null;
  insurance_expiry?: string;
  pollution_expiry?: string;
  fitness_expiry?: string;
  last_service_date?: string;
  next_service_date?: string;
  status: VehicleStatus;
  created_at: string;
  updated_at: string;
}

export interface Appointment {
  id: string;
  enrollment_id: string;
  candidate_id: string;
  instructor_id: string;
  vehicle_id: string;
  appointment_date: string; // YYYY-MM-DD
  start_time: string; // "09:00"
  end_time: string; // "09:30"
  status: AppointmentStatus;
  remarks?: string;
  rescheduled_from_id?: string | null;
  created_by?: string;
  deleted_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface RTOTrainingRecord {
  id: string;
  enrollment_id: string;
  candidate_id: string;
  stage: RTOStage;
  ll_number?: string;
  test_date?: string;
  test_time?: string;
  test_result?: TestResult;
  licence_number?: string;
  licence_received_date?: string;
  remarks?: string;
  created_at: string;
  updated_at: string;
}

export interface RTOStageHistory {
  id: string;
  rto_tracking_id: string;
  stage: RTOStage;
  changed_at: string;
  changed_by?: string;
  notes?: string;
}

export interface Expense {
  id: string;
  expense_date: string;
  category: ExpenseCategory;
  amount: number;
  vehicle_id?: string | null;
  payment_mode: PaymentMode;
  description: string;
  created_by?: string;
  created_at: string;
}

export interface CandidateNote {
  id: string;
  candidate_id: string;
  note_text: string;
  follow_up_date?: string | null;
  is_done: boolean;
  created_by?: string;
  created_at: string;
}

export interface Holiday {
  id: string;
  date: string; // YYYY-MM-DD
  description: string;
  created_at: string;
}

export interface SchoolSettings {
  id: number;
  school_name: string;
  address: string;
  phone: string;
  gst_number?: string;
  receipt_footer_text: string;
  slot_length: number; // 30 mins
  cancellation_cutoff_hours: number; // 3 hours
  absent_consumes_class: boolean; // default true
  default_package_validity_days: number | null; // 90
  created_at?: string;
  updated_at?: string;
}

export interface ActivityLogItem {
  id: string;
  user_id?: string;
  user_name?: string;
  user_role?: UserRole;
  table_name: string;
  record_id: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  details?: string;
  old_values?: any;
  new_values?: any;
  created_at: string;
}

// Derived statistics per enrollment / candidate
export interface EnrollmentCalculatedStats {
  enrollment_id: string;
  candidate_id: string;
  package_id: string;
  package_name: string;
  vehicle_type: VehicleType;
  total_classes: number;
  total_fee: number;
  discount_amount: number;
  net_fee: number; // total_fee - discount_amount
  amount_paid: number; // sum of positive payments - reversals
  balance: number; // net_fee - amount_paid
  classes_completed: number;
  classes_absent: number;
  classes_used: number; // completed + (absent if absent_consumes_class)
  classes_remaining: number; // total_classes - classes_used
  is_expired: boolean;
  expiry_date?: string | null;
}

export interface CandidateWithStats extends Candidate {
  active_enrollment?: Enrollment;
  stats?: EnrollmentCalculatedStats;
  total_balance_all_enrollments: number;
  total_classes_completed_all: number;
  assigned_instructor_name?: string;
}
