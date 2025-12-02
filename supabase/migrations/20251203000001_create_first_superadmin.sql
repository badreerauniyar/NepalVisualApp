-- ============================================
-- Create First Superadmin User
-- ============================================
-- This script helps you create your first superadmin user
-- Email: badree.rauniyar@gmail.com
-- ============================================

-- IMPORTANT: You must create the user in Supabase Dashboard first!
-- Steps:
-- 1. Go to Supabase Dashboard → Authentication → Users
-- 2. Click "Add User" → "Create new user"
-- 3. Enter email: badree.rauniyar@gmail.com
-- 4. Set a temporary password (user will be asked to change it)
-- 5. OR use "Send magic link" to let user set their own password
-- 6. After user is created, run the SQL below to assign superadmin role

-- ============================================
-- OPTION 1: Assign Superadmin Role (After User Creation)
-- ============================================
-- Run this after creating the user in Supabase Dashboard

UPDATE public.profiles
SET 
    role_id = (SELECT id FROM public.user_roles WHERE role_name = 'superadmin'),
    updated_at = NOW()
WHERE email = 'badree.rauniyar@gmail.com';

-- Verify the update
SELECT 
    p.id,
    p.email,
    p.full_name,
    r.role_name,
    r.role_description,
    p.assigned_provinces,
    p.is_active,
    p.created_at
FROM public.profiles p
LEFT JOIN public.user_roles r ON p.role_id = r.id
WHERE p.email = 'badree.rauniyar@gmail.com';

-- ============================================
-- OPTION 2: Create User via SQL (Advanced - Requires Service Role)
-- ============================================
-- WARNING: This requires direct database access with service role permissions
-- This is typically only available in local development or with direct DB access
-- 
-- If you have service role access, you can use the Supabase Admin API instead:
-- 
-- Using Supabase Admin API (Node.js example):
-- const { data, error } = await supabaseAdmin.auth.admin.createUser({
--   email: 'badree.rauniyar@gmail.com',
--   password: 'temporary-password-123',
--   email_confirm: true,
--   user_metadata: { full_name: 'Badree Rauniyar' }
-- });
--
-- Then run the UPDATE query above to assign superadmin role.

-- ============================================
-- OPTION 3: Complete Setup Script (If User Already Exists)
-- ============================================
-- If the user already exists in auth.users, this will:
-- 1. Ensure profile exists
-- 2. Assign superadmin role
-- 3. Set full name if not set

DO $$
DECLARE
    v_user_id UUID;
    v_superadmin_role_id UUID;
    v_profile_exists BOOLEAN;
BEGIN
    -- Get user ID from auth.users
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = 'badree.rauniyar@gmail.com';
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User with email badree.rauniyar@gmail.com does not exist in auth.users. Please create the user first via Supabase Dashboard.';
    END IF;
    
    -- Get superadmin role ID
    SELECT id INTO v_superadmin_role_id
    FROM public.user_roles
    WHERE role_name = 'superadmin';
    
    IF v_superadmin_role_id IS NULL THEN
        RAISE EXCEPTION 'Superadmin role does not exist. Please run the auth system migration first.';
    END IF;
    
    -- Check if profile exists
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = v_user_id) INTO v_profile_exists;
    
    -- Create profile if it doesn't exist
    IF NOT v_profile_exists THEN
        INSERT INTO public.profiles (id, email, full_name, role_id, is_active)
        VALUES (
            v_user_id,
            'badree.rauniyar@gmail.com',
            COALESCE((SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = v_user_id), 'Badree Rauniyar'),
            v_superadmin_role_id,
            TRUE
        );
        RAISE NOTICE 'Profile created for user: badree.rauniyar@gmail.com';
    ELSE
        -- Update existing profile
        UPDATE public.profiles
        SET 
            role_id = v_superadmin_role_id,
            email = 'badree.rauniyar@gmail.com',
            full_name = COALESCE(full_name, COALESCE((SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = v_user_id), 'Badree Rauniyar')),
            is_active = TRUE,
            updated_at = NOW()
        WHERE id = v_user_id;
        RAISE NOTICE 'Profile updated for user: badree.rauniyar@gmail.com';
    END IF;
    
    RAISE NOTICE 'Superadmin role assigned successfully!';
END $$;

-- ============================================
-- VERIFICATION QUERY
-- ============================================
-- Run this to verify the superadmin was created correctly

SELECT 
    u.id AS user_id,
    u.email,
    u.email_confirmed_at,
    u.created_at AS user_created_at,
    p.full_name,
    r.role_name,
    r.role_description,
    p.assigned_provinces,
    p.is_active,
    p.created_at AS profile_created_at
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
LEFT JOIN public.user_roles r ON p.role_id = r.id
WHERE u.email = 'badree.rauniyar@gmail.com';

-- Expected result:
-- role_name should be 'superadmin'
-- is_active should be TRUE
-- email_confirmed_at should have a timestamp (if email is confirmed)

-- ============================================
-- TROUBLESHOOTING
-- ============================================
-- If the user doesn't exist:
--   1. Go to Supabase Dashboard → Authentication → Users
--   2. Click "Add User" → "Create new user"
--   3. Enter: badree.rauniyar@gmail.com
--   4. Set password or use "Send magic link"
--   5. Run the UPDATE query above again

-- If profile doesn't exist after user creation:
--   The trigger should auto-create it, but if not, run OPTION 3 above

-- If role assignment fails:
--   Make sure the auth system migration (20251203000000_create_auth_system.sql) has been run

-- ============================================
-- NOTES
-- ============================================
-- 1. The user will receive an email to confirm their account (if email confirmation is enabled)
-- 2. If using "Send magic link", the user will set their password via the link
-- 3. After assigning superadmin role, the user can log in and access /admin/users
-- 4. The user can then create additional users via the User Management page

