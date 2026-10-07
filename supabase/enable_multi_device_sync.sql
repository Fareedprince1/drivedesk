-- =====================================================================
-- GEM DRIVING SCHOOL - MULTI-DEVICE CLOUD SYNC & RLS PERMISSIONS
-- Run this script in your Supabase Dashboard > SQL Editor > Click "Run"
-- =====================================================================

-- 1. Ensure user_roles has open RLS for authenticated users
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can read user_roles" ON user_roles;
DROP POLICY IF EXISTS "Authenticated users can insert user_roles" ON user_roles;
DROP POLICY IF EXISTS "Authenticated users can update user_roles" ON user_roles;

CREATE POLICY "Authenticated users can read user_roles" ON user_roles
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert user_roles" ON user_roles
    FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update user_roles" ON user_roles
    FOR UPDATE TO authenticated USING (true);

-- 2. Allow all authenticated users (logged-in from phone, laptop, tablet)
-- to have full Read, Insert, Update, Delete access across all driving school tables.
DO $$ 
DECLARE
    tbl text;
    tables text[] := ARRAY[
        'settings',
        'packages',
        'candidates',
        'enrollments',
        'instructors',
        'instructor_leaves',
        'vehicles',
        'payments',
        'appointments',
        'holidays',
        'rto_tracking',
        'rto_stage_history',
        'expenses',
        'candidate_notes',
        'activity_log'
    ];
BEGIN
    FOREACH tbl IN ARRAY tables LOOP
        -- Enable RLS so public/unauthenticated bots CANNOT access data
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', tbl);
        -- Drop any old or restrictive policy
        EXECUTE format('DROP POLICY IF EXISTS "Sync all for authenticated" ON %I;', tbl);
        -- Create seamless multi-device sync policy for all authenticated users
        EXECUTE format('CREATE POLICY "Sync all for authenticated" ON %I FOR ALL TO authenticated USING (true) WITH CHECK (true);', tbl);
    END LOOP;
END $$;

-- 3. Ensure Default Settings row exists in Supabase
INSERT INTO settings (id, school_name, address, phone, gst_number, receipt_footer_text, slot_length, cancellation_cutoff_hours, absent_consumes_class, default_package_validity_days)
VALUES (1, 'Gem Driving School', 'Indiranagar, Bengaluru, Karnataka 560038', '+91 98765 43210', '', 'Thank you for choosing Gem Driving School. Safe driving begins here! Terms & conditions apply.', 30, 3, true, 90)
ON CONFLICT (id) DO UPDATE SET school_name = 'Gem Driving School';

-- 4. Ensure Default Packages exist in Supabase
INSERT INTO packages (name, vehicle_type, total_classes, fee, validity_days, description, is_active)
VALUES 
    ('Basic Car Training', 'car', 10, 5000.00, 45, '10 classes (30 min each). Ideal for beginners refreshing basics.', true),
    ('Standard Car Training', 'car', 20, 8000.00, 60, '20 classes (30 min each). Full end-to-end practical driving curriculum.', true),
    ('Car + Licence Package', 'car', 20, 12000.00, 90, '20 classes + complete RTO documentation and test assistance.', true),
    ('Two-Wheeler Training', 'bike', 10, 4000.00, 30, '10 classes (30 min each). Balance, gear shift, traffic rules.', true)
ON CONFLICT DO NOTHING;
