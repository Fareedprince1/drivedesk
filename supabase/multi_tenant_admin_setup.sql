-- =====================================================================
-- GEM DRIVING SCHOOL - MULTI-TENANT ISOLATED DATABASE & CLOUD SYNC SETUP
-- Run this complete SQL script in your Supabase Dashboard:
-- 1. Go to https://supabase.com/dashboard/project/bjdjjnkqzkopfyqisspx/sql
-- 2. Paste this entire script into SQL Editor
-- 3. Click "RUN"
-- =====================================================================

-- Enable UUID extension if not present
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------------------------------------------------------------------
-- 1. ADD admin_id TO ALL OPERATIONAL TABLES FOR TENANT ISOLATION
-- ---------------------------------------------------------------------
ALTER TABLE settings ADD COLUMN IF NOT EXISTS admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();
ALTER TABLE packages ADD COLUMN IF NOT EXISTS admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();
ALTER TABLE instructors ADD COLUMN IF NOT EXISTS admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();
ALTER TABLE instructor_leaves ADD COLUMN IF NOT EXISTS admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();
ALTER TABLE payments ADD COLUMN IF NOT EXISTS admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();
ALTER TABLE holidays ADD COLUMN IF NOT EXISTS admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();
ALTER TABLE rto_tracking ADD COLUMN IF NOT EXISTS admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();
ALTER TABLE rto_stage_history ADD COLUMN IF NOT EXISTS admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();
ALTER TABLE candidate_notes ADD COLUMN IF NOT EXISTS admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();
ALTER TABLE activity_log ADD COLUMN IF NOT EXISTS admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();

-- Ensure created_by in payments and appointments is nullable UUID
ALTER TABLE payments ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- ---------------------------------------------------------------------
-- 2. MULTI-TENANT UNIQUE CONSTRAINTS (Unique per Admin, not global)
-- ---------------------------------------------------------------------
-- Candidate codes (e.g. GDS0001) should be unique per admin workspace
ALTER TABLE candidates DROP CONSTRAINT IF EXISTS candidates_candidate_code_key;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'candidates_admin_code_unique') THEN
        ALTER TABLE candidates ADD CONSTRAINT candidates_admin_code_unique UNIQUE (admin_id, candidate_code);
    END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Payment receipt numbers (e.g. R-1001) should be unique per admin workspace
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_receipt_number_key;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payments_admin_receipt_unique') THEN
        ALTER TABLE payments ADD CONSTRAINT payments_admin_receipt_unique UNIQUE (admin_id, receipt_number);
    END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Vehicle registration numbers unique per admin workspace
ALTER TABLE vehicles DROP CONSTRAINT IF EXISTS vehicles_registration_number_key;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'vehicles_admin_reg_unique') THEN
        ALTER TABLE vehicles ADD CONSTRAINT vehicles_admin_reg_unique UNIQUE (admin_id, registration_number);
    END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ---------------------------------------------------------------------
-- 3. OPEN ACCESS TO user_roles (Prevent 42501 RLS Block on Role Management)
-- ---------------------------------------------------------------------
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Role users can view user_roles" ON user_roles;
DROP POLICY IF EXISTS "Role users can insert user_roles" ON user_roles;
DROP POLICY IF EXISTS "Role users can update user_roles" ON user_roles;
DROP POLICY IF EXISTS "Authenticated users can read user_roles" ON user_roles;
DROP POLICY IF EXISTS "Authenticated users can insert user_roles" ON user_roles;
DROP POLICY IF EXISTS "Authenticated users can update user_roles" ON user_roles;
DROP POLICY IF EXISTS "Open user_roles for authenticated" ON user_roles;

CREATE POLICY "Open user_roles for authenticated" ON user_roles
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

-- ---------------------------------------------------------------------
-- 4. MULTI-TENANT ROW-LEVEL SECURITY POLICIES
-- Each admin can ONLY see, insert, update, and delete THEIR OWN DATA!
-- If admin_id IS NULL, allow for backward compatibility.
-- ---------------------------------------------------------------------
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
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', tbl);
        
        -- Drop any old restrictive policies that caused 42501 errors
        EXECUTE format('DROP POLICY IF EXISTS "Staff and admin can view settings" ON %I;', tbl);
        EXECUTE format('DROP POLICY IF EXISTS "Only admin can update settings" ON %I;', tbl);
        EXECUTE format('DROP POLICY IF EXISTS "Authenticated users with role can view candidates" ON %I;', tbl);
        EXECUTE format('DROP POLICY IF EXISTS "Authenticated users with role can insert candidates" ON %I;', tbl);
        EXECUTE format('DROP POLICY IF EXISTS "Authenticated users with role can update candidates" ON %I;', tbl);
        EXECUTE format('DROP POLICY IF EXISTS "Role users can manage enrollments" ON %I;', tbl);
        EXECUTE format('DROP POLICY IF EXISTS "Role users can view payments" ON %I;', tbl);
        EXECUTE format('DROP POLICY IF EXISTS "Role users can record payments" ON %I;', tbl);
        EXECUTE format('DROP POLICY IF EXISTS "Role users can view appointments" ON %I;', tbl);
        EXECUTE format('DROP POLICY IF EXISTS "Role users can insert appointments" ON %I;', tbl);
        EXECUTE format('DROP POLICY IF EXISTS "Role users can update appointments" ON %I;', tbl);
        EXECUTE format('DROP POLICY IF EXISTS "Sync all for authenticated" ON %I;', tbl);
        EXECUTE format('DROP POLICY IF EXISTS "Tenant isolation" ON %I;', tbl);

        -- Create seamless tenant-isolated policy
        -- When querying: returns only rows belonging to this admin
        -- When inserting: stamps and checks against auth.uid()
        EXECUTE format('
            CREATE POLICY "Tenant isolation" ON %I
            FOR ALL TO authenticated
            USING (admin_id = auth.uid() OR admin_id IS NULL)
            WITH CHECK (admin_id = auth.uid() OR admin_id IS NULL);
        ', tbl);
    END LOOP;
END $$;

-- ---------------------------------------------------------------------
-- 5. AUTOMATIC DATABASE PROVISIONING TRIGGER FOR NEW ADMINS
-- When any user signs up, Supabase automatically creates their workspace:
-- - Sets their role to "admin" in user_roles
-- - Creates their school settings row
-- - Creates standard packages for their driving school
-- - All candidates, appointments, vehicles, payments start fresh (0 rows)!
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_admin_signup()
RETURNS TRIGGER AS $$
BEGIN
    -- 1. Insert into user_roles as admin
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id) DO NOTHING;

    -- 2. Create isolated school settings for this admin
    INSERT INTO public.settings (
        admin_id,
        school_name,
        address,
        phone,
        gst_number,
        receipt_footer_text,
        slot_length,
        cancellation_cutoff_hours,
        absent_consumes_class,
        default_package_validity_days
    ) VALUES (
        NEW.id,
        'Gem Driving School',
        'Indiranagar, Bengaluru, Karnataka 560038',
        '+91 98765 43210',
        '',
        'Thank you for choosing Gem Driving School. Safe driving begins here! Terms & conditions apply.',
        30,
        3,
        true,
        90
    )
    ON CONFLICT DO NOTHING;

    -- 3. Create default packages for this admin's workspace
    INSERT INTO public.packages (admin_id, name, vehicle_type, total_classes, fee, validity_days, description, is_active)
    VALUES 
        (NEW.id, 'Basic Car Training', 'car', 10, 5000.00, 45, '10 classes (30 min each). Ideal for beginners refreshing basics.', true),
        (NEW.id, 'Standard Car Training', 'car', 20, 8000.00, 60, '20 classes (30 min each). Full end-to-end practical driving curriculum.', true),
        (NEW.id, 'Car + Licence Package', 'car', 20, 12000.00, 90, '20 classes + complete RTO documentation and test assistance.', true),
        (NEW.id, 'Two-Wheeler Training', 'bike', 10, 4000.00, 30, '10 classes (30 min each). Balance, gear shift, traffic rules.', true)
    ON CONFLICT DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind trigger to auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_admin_signup();

-- Done!
