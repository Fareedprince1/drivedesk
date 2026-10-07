-- =====================================================================
-- FIX SUPABASE "EMAIL RATE LIMIT EXCEEDED" & AUTO-CONFIRM USERS
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/bjdjjnkqzkopfyqisspx/sql/new
-- =====================================================================

-- 1. Instantly mark ALL existing registered users as confirmed so they can log in without email verification
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email_confirmed_at IS NULL;

-- 2. Ensure each user has an Admin or Staff role in public.user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin' FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.user_roles)
ON CONFLICT (user_id) DO NOTHING;

-- 3. (Optional) Create or Reset an Admin user directly with password 'DriveDesk@Admin2026'
-- This works immediately even if the email rate limit is active!
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
)
VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'admin@drivedesk.in',
    crypt('DriveDesk@Admin2026', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Driving School Owner","role":"admin"}',
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    encrypted_password = crypt('DriveDesk@Admin2026', gen_salt('bf')),
    email_confirmed_at = NOW(),
    raw_user_meta_data = '{"full_name":"Driving School Owner","role":"admin"}';

-- Ensure this admin user has the 'admin' role in user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin' FROM auth.users WHERE email = 'admin@drivedesk.in'
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
