-- =====================================================================
-- DRIVEDESK - DATABASE SCHEMA & CONSTRAINTS (PostgreSQL / Supabase)
-- =====================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USER ROLES (Separate from user profile)
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'staff')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 2. SCHOOL SETTINGS
CREATE TABLE IF NOT EXISTS settings (
    id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    school_name VARCHAR(150) NOT NULL DEFAULT 'DriveDesk Driving Academy',
    address TEXT NOT NULL DEFAULT '42, MG Road, Indiranagar, Bengaluru, Karnataka 560038',
    phone VARCHAR(20) NOT NULL DEFAULT '+91 98765 43210',
    gst_number VARCHAR(30) DEFAULT '29ABCDE1234F1Z5',
    receipt_footer_text TEXT DEFAULT 'Thank you for choosing DriveDesk. Safe driving begins here! Terms & conditions apply.',
    slot_length INT NOT NULL DEFAULT 30,
    cancellation_cutoff_hours INT NOT NULL DEFAULT 3,
    absent_consumes_class BOOLEAN NOT NULL DEFAULT true,
    default_package_validity_days INT DEFAULT 90,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. PACKAGES
CREATE TABLE IF NOT EXISTS packages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    vehicle_type VARCHAR(20) NOT NULL CHECK (vehicle_type IN ('car', 'bike')),
    total_classes INT NOT NULL CHECK (total_classes > 0),
    fee NUMERIC(10, 2) NOT NULL CHECK (fee >= 0),
    validity_days INT CHECK (validity_days IS NULL OR validity_days > 0),
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Sequences for Candidate Code and Receipt Numbers
CREATE SEQUENCE IF NOT EXISTS candidate_code_seq START WITH 1;
CREATE SEQUENCE IF NOT EXISTS receipt_number_seq START WITH 1001;

-- 4. CANDIDATES
CREATE TABLE IF NOT EXISTS candidates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    candidate_code VARCHAR(20) NOT NULL UNIQUE,
    full_name VARCHAR(150) NOT NULL,
    mobile VARCHAR(15) NOT NULL,
    alt_mobile VARCHAR(15),
    address TEXT,
    date_of_birth DATE,
    joining_date DATE NOT NULL DEFAULT CURRENT_DATE,
    ll_number VARCHAR(50),
    ll_issue_date DATE,
    ll_expiry_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'hold', 'cancelled')),
    notes_summary TEXT,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. ENROLLMENTS
CREATE TABLE IF NOT EXISTS enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    package_id UUID NOT NULL REFERENCES packages(id),
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_classes INT NOT NULL CHECK (total_classes > 0),
    total_fee NUMERIC(10, 2) NOT NULL CHECK (total_fee >= 0),
    discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled', 'expired')),
    expiry_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. INSTRUCTORS
CREATE TABLE IF NOT EXISTS instructors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    mobile VARCHAR(15) NOT NULL,
    licence_number VARCHAR(50) NOT NULL,
    licence_expiry DATE,
    working_start_time TIME NOT NULL DEFAULT '06:00:00',
    working_end_time TIME NOT NULL DEFAULT '20:00:00',
    assigned_vehicle_id UUID,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'on_leave', 'inactive')),
    joining_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. INSTRUCTOR LEAVES
CREATE TABLE IF NOT EXISTS instructor_leaves (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    instructor_id UUID NOT NULL REFERENCES instructors(id) ON DELETE CASCADE,
    from_date DATE NOT NULL,
    to_date DATE NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (to_date >= from_date)
);

-- 8. VEHICLES
CREATE TABLE IF NOT EXISTS vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    registration_number VARCHAR(30) NOT NULL UNIQUE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('car', 'bike')),
    model VARCHAR(100) NOT NULL,
    assigned_instructor_id UUID REFERENCES instructors(id) ON DELETE SET NULL,
    insurance_expiry DATE,
    pollution_expiry DATE,
    fitness_expiry DATE,
    last_service_date DATE,
    next_service_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'service', 'not_available')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add foreign key constraint back to instructors for assigned_vehicle_id
ALTER TABLE instructors 
    ADD CONSTRAINT fk_instructor_vehicle 
    FOREIGN KEY (assigned_vehicle_id) 
    REFERENCES vehicles(id) ON DELETE SET NULL;

-- 9. PAYMENTS (Never hard-deleted, corrections done via reversals)
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE RESTRICT,
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE RESTRICT,
    amount NUMERIC(10, 2) NOT NULL,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    mode VARCHAR(30) NOT NULL CHECK (mode IN ('cash', 'upi', 'card', 'bank_transfer', 'online')),
    receipt_number VARCHAR(30) NOT NULL UNIQUE,
    remarks TEXT,
    is_reversal BOOLEAN NOT NULL DEFAULT false,
    reverses_payment_id UUID REFERENCES payments(id) ON DELETE RESTRICT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. APPOINTMENTS (Fixed 30-min slots)
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE RESTRICT,
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE RESTRICT,
    instructor_id UUID NOT NULL REFERENCES instructors(id) ON DELETE RESTRICT,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
    appointment_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'booked' CHECK (status IN ('booked', 'completed', 'absent', 'cancelled', 'rescheduled')),
    remarks TEXT,
    rescheduled_from_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- DOUBLE-BOOKING PREVENTION AT DATABASE LEVEL
-- Partial unique indexes on appointments for statuses (booked, completed, absent)
CREATE UNIQUE INDEX IF NOT EXISTS idx_appointments_no_double_instructor 
    ON appointments (instructor_id, appointment_date, start_time) 
    WHERE status IN ('booked', 'completed', 'absent') AND deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_appointments_no_double_vehicle 
    ON appointments (vehicle_id, appointment_date, start_time) 
    WHERE status IN ('booked', 'completed', 'absent') AND deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_appointments_no_double_candidate 
    ON appointments (candidate_id, appointment_date, start_time) 
    WHERE status IN ('booked', 'completed', 'absent') AND deleted_at IS NULL;

-- 11. HOLIDAYS
CREATE TABLE IF NOT EXISTS holidays (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL UNIQUE,
    description VARCHAR(150) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. RTO TRACKING
CREATE TABLE IF NOT EXISTS rto_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
    stage VARCHAR(30) NOT NULL DEFAULT 'll_pending' 
        CHECK (stage IN ('ll_pending', 'll_completed', 'training_ongoing', 'test_booked', 'test_completed', 'licence_received')),
    ll_number VARCHAR(50),
    test_date DATE,
    test_time TIME,
    test_result VARCHAR(20) DEFAULT 'pending' CHECK (test_result IN ('pass', 'fail', 'pending')),
    licence_number VARCHAR(50),
    licence_received_date DATE,
    remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. RTO STAGE HISTORY
CREATE TABLE IF NOT EXISTS rto_stage_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rto_tracking_id UUID NOT NULL REFERENCES rto_tracking(id) ON DELETE CASCADE,
    stage VARCHAR(30) NOT NULL,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    notes TEXT
);

-- 14. EXPENSES
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    category VARCHAR(30) NOT NULL CHECK (category IN ('fuel', 'vehicle_service', 'repairs', 'salary', 'office', 'rto', 'miscellaneous')),
    amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
    payment_mode VARCHAR(30) NOT NULL DEFAULT 'cash',
    description TEXT NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. CANDIDATE NOTES
CREATE TABLE IF NOT EXISTS candidate_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    note_text TEXT NOT NULL,
    follow_up_date DATE,
    is_done BOOLEAN NOT NULL DEFAULT false,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 16. ACTIVITY LOG (Recorded via triggers)
CREATE TABLE IF NOT EXISTS activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    table_name VARCHAR(50) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    old_values JSONB,
    new_values JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================================
-- DATABASE VIEWS (Derived numbers calculated dynamically)
-- =====================================================================

-- Enrollment Financial and Class Statistics View
CREATE OR REPLACE VIEW view_enrollment_stats AS
SELECT 
    e.id AS enrollment_id,
    e.candidate_id,
    e.package_id,
    e.start_date,
    e.total_classes,
    e.total_fee,
    e.discount_amount,
    (e.total_fee - e.discount_amount) AS net_fee,
    COALESCE(SUM(
        CASE 
            WHEN p.is_reversal THEN -p.amount
            ELSE p.amount
        END
    ), 0) AS amount_paid,
    ((e.total_fee - e.discount_amount) - COALESCE(SUM(
        CASE 
            WHEN p.is_reversal THEN -p.amount
            ELSE p.amount
        END
    ), 0)) AS balance,
    COALESCE(COUNT(DISTINCT CASE WHEN a.status = 'completed' THEN a.id END), 0) AS classes_completed,
    COALESCE(COUNT(DISTINCT CASE WHEN a.status = 'absent' THEN a.id END), 0) AS classes_absent,
    COALESCE(COUNT(DISTINCT CASE WHEN a.status = 'completed' OR (a.status = 'absent' AND s.absent_consumes_class = true) THEN a.id END), 0) AS classes_used,
    GREATEST(0, e.total_classes - COALESCE(COUNT(DISTINCT CASE WHEN a.status = 'completed' OR (a.status = 'absent' AND s.absent_consumes_class = true) THEN a.id END), 0)) AS classes_remaining
FROM enrollments e
LEFT JOIN payments p ON p.enrollment_id = e.id
LEFT JOIN appointments a ON a.enrollment_id = e.id AND a.deleted_at IS NULL
CROSS JOIN settings s
GROUP BY e.id, e.candidate_id, e.package_id, e.start_date, e.total_classes, e.total_fee, e.discount_amount, s.absent_consumes_class;

-- =====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================================
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE instructors ENABLE ROW LEVEL SECURITY;
ALTER TABLE instructor_leaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE rto_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE rto_stage_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Helper function to check role
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS VARCHAR AS $$
    SELECT role FROM user_roles WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- Settings Policies (Admin can write, staff can read general info)
CREATE POLICY "Staff and admin can view settings" ON settings
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Only admin can update settings" ON settings
    FOR ALL TO authenticated USING (current_user_role() = 'admin');

-- Candidates Policies
CREATE POLICY "Authenticated users with role can view candidates" ON candidates
    FOR SELECT TO authenticated USING (deleted_at IS NULL);
CREATE POLICY "Authenticated users with role can insert candidates" ON candidates
    FOR INSERT TO authenticated WITH CHECK (current_user_role() IN ('admin', 'staff'));
CREATE POLICY "Authenticated users with role can update candidates" ON candidates
    FOR UPDATE TO authenticated USING (current_user_role() IN ('admin', 'staff'));

-- Enrollments Policies
CREATE POLICY "Role users can manage enrollments" ON enrollments
    FOR ALL TO authenticated USING (current_user_role() IN ('admin', 'staff'));

-- Payments Policies (Staff can record, only admin can view expenses/reversals)
CREATE POLICY "Role users can view payments" ON payments
    FOR SELECT TO authenticated USING (current_user_role() IN ('admin', 'staff'));
CREATE POLICY "Role users can record payments" ON payments
    FOR INSERT TO authenticated WITH CHECK (current_user_role() IN ('admin', 'staff'));

-- Appointments Policies
CREATE POLICY "Role users can view appointments" ON appointments
    FOR SELECT TO authenticated USING (deleted_at IS NULL);
CREATE POLICY "Role users can insert appointments" ON appointments
    FOR INSERT TO authenticated WITH CHECK (current_user_role() IN ('admin', 'staff'));
CREATE POLICY "Role users can update appointments" ON appointments
    FOR UPDATE TO authenticated USING (current_user_role() IN ('admin', 'staff'));

-- Expenses Policies (Admin only!)
CREATE POLICY "Only admin can view expenses" ON expenses
    FOR SELECT TO authenticated USING (current_user_role() = 'admin');
CREATE POLICY "Only admin can insert expenses" ON expenses
    FOR INSERT TO authenticated WITH CHECK (current_user_role() = 'admin');

-- Packages Policies
CREATE POLICY "Anyone authenticated can view packages" ON packages
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Only admin can manage packages" ON packages
    FOR ALL TO authenticated USING (current_user_role() = 'admin');

-- User Roles Policies
CREATE POLICY "Users can read own role" ON user_roles
    FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own role" ON user_roles
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON user_roles
    FOR SELECT TO authenticated USING (
        EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
    );
CREATE POLICY "Admins can manage roles" ON user_roles
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
    );

-- Auto-assign role on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_count INT;
    assigned_role VARCHAR(20);
BEGIN
    SELECT COUNT(*) INTO user_count FROM user_roles;
    IF user_count = 0 THEN
        assigned_role := 'admin';
    ELSE
        assigned_role := COALESCE(new.raw_user_meta_data->>'role', 'staff');
    END IF;

    INSERT INTO user_roles (user_id, role)
    VALUES (new.id, assigned_role)
    ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =====================================================================
-- SEED INITIAL DATA
-- =====================================================================
INSERT INTO settings (id, school_name, address, phone, gst_number, receipt_footer_text, slot_length, cancellation_cutoff_hours, absent_consumes_class, default_package_validity_days)
VALUES (1, 'DriveDesk Driving Academy', '42, MG Road, Indiranagar, Bengaluru, Karnataka 560038', '+91 98765 43210', '29ABCDE1234F1Z5', 'Thank you for choosing DriveDesk. Safe driving begins here! Terms & conditions apply.', 30, 3, true, 90)
ON CONFLICT (id) DO NOTHING;

INSERT INTO packages (name, vehicle_type, total_classes, fee, validity_days, description, is_active)
VALUES 
    ('Basic Car Training', 'car', 10, 5000.00, 45, '10 classes (30 min each). Ideal for beginners refreshing basics.', true),
    ('Standard Car Training', 'car', 20, 8000.00, 60, '20 classes (30 min each). Full end-to-end practical driving curriculum.', true),
    ('Car + Licence Package', 'car', 20, 12000.00, 90, '20 classes + complete RTO documentation and test assistance.', true),
    ('Two-Wheeler Training', 'bike', 10, 4000.00, 30, '10 classes (30 min each). Balance, gear shift, traffic rules.', true)
ON CONFLICT DO NOTHING;
