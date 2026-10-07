-- =====================================================================
-- DRIVEDESK - SUPABASE AUTH & REAL USER ROLES CONFIGURATION
-- Run this in your Supabase SQL Editor (supabase.com -> SQL Editor)
-- =====================================================================

-- 1. Ensure RLS is active on user_roles and define clear policies
ALTER TABLE IF EXISTS public.user_roles ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view their own role
DROP POLICY IF EXISTS "Users can read own role" ON public.user_roles;
CREATE POLICY "Users can read own role" ON public.user_roles
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Allow authenticated users to insert their own initial role
DROP POLICY IF EXISTS "Users can insert own role" ON public.user_roles;
CREATE POLICY "Users can insert own role" ON public.user_roles
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Allow admins to view all roles
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles" ON public.user_roles
    FOR SELECT TO authenticated USING (
        EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
    );

-- Allow admins to manage all roles
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
CREATE POLICY "Admins can manage roles" ON public.user_roles
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
    );

-- 2. Trigger function to auto-assign roles on registration
-- First user ever registered becomes 'admin', subsequent users get 'staff' or their chosen role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_count INT;
    assigned_role VARCHAR(20);
BEGIN
    SELECT COUNT(*) INTO user_count FROM public.user_roles;
    IF user_count = 0 THEN
        assigned_role := 'admin';
    ELSE
        assigned_role := COALESCE(new.raw_user_meta_data->>'role', 'staff');
    END IF;

    INSERT INTO public.user_roles (user_id, role)
    VALUES (new.id, assigned_role)
    ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Auto-confirm any pending unconfirmed users (enables immediate sign-in)
UPDATE auth.users SET email_confirmed_at = NOW() WHERE email_confirmed_at IS NULL;

-- 4. Backfill any existing users in auth.users that don't have a role entry yet
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin' FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.user_roles)
ON CONFLICT (user_id) DO NOTHING;
