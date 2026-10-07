-- =====================================================================
-- GEM DRIVING SCHOOL - MULTI-TENANT ADMIN & STAFF CLOUD SETUP
-- Run this complete SQL script in your Supabase Dashboard:
-- 1. Go to https://supabase.com/dashboard/project/bjdjjnkqzkopfyqisspx/sql
-- 2. Paste this entire script into SQL Editor
-- 3. Click "RUN"
-- =====================================================================

-- Enable UUID extension if not present
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------------------------------------------------------------------
-- 1. ENHANCE user_roles FOR ADMIN & STAFF LINKING
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'staff')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS school_admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS admin_email VARCHAR(255);

-- Enable RLS on user_roles and allow authenticated users to read and manage
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Open user_roles for authenticated" ON public.user_roles;
CREATE POLICY "Open user_roles for authenticated" ON public.user_roles
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

-- ---------------------------------------------------------------------
-- 2. ADD admin_id TO ALL OPERATIONAL TABLES FOR TENANT ISOLATION
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
-- 3. MULTI-TENANT UNIQUE CONSTRAINTS (Unique per School Admin)
-- ---------------------------------------------------------------------
ALTER TABLE candidates DROP CONSTRAINT IF EXISTS candidates_candidate_code_key;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'candidates_admin_code_unique') THEN
        ALTER TABLE candidates ADD CONSTRAINT candidates_admin_code_unique UNIQUE (admin_id, candidate_code);
    END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_receipt_number_key;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payments_admin_receipt_unique') THEN
        ALTER TABLE payments ADD CONSTRAINT payments_admin_receipt_unique UNIQUE (admin_id, receipt_number);
    END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

ALTER TABLE vehicles DROP CONSTRAINT IF EXISTS vehicles_registration_number_key;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'vehicles_admin_reg_unique') THEN
        ALTER TABLE vehicles ADD CONSTRAINT vehicles_admin_reg_unique UNIQUE (admin_id, registration_number);
    END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ---------------------------------------------------------------------
-- 4. HELPER FUNCTION TO RESOLVE CURRENT USER'S SCHOOL ADMIN ID
-- If Admin: returns their own user_id.
-- If Staff: returns their linked school_admin_id.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_school_admin_id()
RETURNS UUID AS $$
DECLARE
    s_id UUID;
BEGIN
    SELECT school_admin_id INTO s_id FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1;
    IF s_id IS NOT NULL THEN
        RETURN s_id;
    ELSE
        RETURN auth.uid();
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ---------------------------------------------------------------------
-- 5. MULTI-TENANT ROW-LEVEL SECURITY POLICIES
-- Admin and Staff of the same school can see and manage all school records!
-- Other Admins can only see their own school records.
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
        EXECUTE format('DROP POLICY IF EXISTS "School tenant access" ON %I;', tbl);

        EXECUTE format('
            CREATE POLICY "School tenant access" ON %I
            FOR ALL TO authenticated
            USING (
                admin_id = public.get_school_admin_id() 
                OR admin_id = auth.uid() 
                OR admin_id IS NULL
            )
            WITH CHECK (
                admin_id = public.get_school_admin_id() 
                OR admin_id = auth.uid() 
                OR admin_id IS NULL
            );
        ', tbl);
    END LOOP;
END $$;

-- ---------------------------------------------------------------------
-- 6. AUTOMATIC DATABASE PROVISIONING TRIGGER ON SIGNUP
-- Automatically configures user_roles, settings, and packages.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS TRIGGER AS $$
DECLARE
    user_role text;
    admin_mail text;
    target_admin_id UUID;
BEGIN
    user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'admin');
    admin_mail := LOWER(TRIM(COALESCE(NEW.raw_user_meta_data->>'admin_email', '')));

    IF user_role = 'staff' AND admin_mail <> '' THEN
        -- Link staff to existing admin with that email
        SELECT user_id INTO target_admin_id 
        FROM public.user_roles 
        WHERE LOWER(email) = admin_mail AND role = 'admin' 
        LIMIT 1;

        IF target_admin_id IS NULL THEN
            SELECT id INTO target_admin_id 
            FROM auth.users 
            WHERE LOWER(email) = admin_mail 
            LIMIT 1;
        END IF;

        IF target_admin_id IS NULL THEN
            target_admin_id := NEW.id;
        END IF;

        INSERT INTO public.user_roles (user_id, role, school_admin_id, email, admin_email)
        VALUES (NEW.id, 'staff', target_admin_id, NEW.email, admin_mail)
        ON CONFLICT (user_id) DO UPDATE SET
            role = EXCLUDED.role,
            school_admin_id = EXCLUDED.school_admin_id,
            email = EXCLUDED.email,
            admin_email = EXCLUDED.admin_email;
    ELSE
        -- Admin: owner of their own school
        INSERT INTO public.user_roles (user_id, role, school_admin_id, email, admin_email)
        VALUES (NEW.id, 'admin', NEW.id, NEW.email, NEW.email)
        ON CONFLICT (user_id) DO UPDATE SET
            role = EXCLUDED.role,
            school_admin_id = EXCLUDED.school_admin_id,
            email = EXCLUDED.email,
            admin_email = EXCLUDED.admin_email;

        -- Create isolated school settings for this admin
        INSERT INTO public.settings (
            admin_id, school_name, address, phone, gst_number,
            receipt_footer_text, slot_length, cancellation_cutoff_hours,
            absent_consumes_class, default_package_validity_days
        ) VALUES (
            NEW.id, 'Gem Driving School', 'Indiranagar, Bengaluru, Karnataka 560038',
            '+91 98765 43210', '',
            'Thank you for choosing Gem Driving School. Safe driving begins here! Terms & conditions apply.',
            30, 3, true, 90
        )
        ON CONFLICT DO NOTHING;

        -- Create default packages for this admin's workspace
        INSERT INTO public.packages (admin_id, name, vehicle_type, total_classes, fee, validity_days, description, is_active)
        VALUES 
            (NEW.id, 'Basic Car Training', 'car', 10, 5000.00, 45, '10 classes (30 min each). Ideal for beginners refreshing basics.', true),
            (NEW.id, 'Standard Car Training', 'car', 20, 8000.00, 60, '20 classes (30 min each). Full end-to-end practical driving curriculum.', true),
            (NEW.id, 'Car + Licence Package', 'car', 20, 12000.00, 90, '20 classes + complete RTO documentation and test assistance.', true),
            (NEW.id, 'Two-Wheeler Training', 'bike', 10, 4000.00, 30, '10 classes (30 min each). Balance, gear shift, traffic rules.', true)
        ON CONFLICT DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_signup();
