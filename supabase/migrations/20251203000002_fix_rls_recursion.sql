-- ============================================
-- Fix RLS Infinite Recursion Issue
-- ============================================
-- This migration fixes the infinite recursion error in RLS policies
-- by creating helper functions that bypass RLS when checking roles
-- ============================================

-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "Superadmin can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Superadmin can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- ============================================
-- Helper Function: Check if current user is superadmin
-- Uses SECURITY DEFINER to bypass RLS
-- ============================================
CREATE OR REPLACE FUNCTION public.is_current_user_superadmin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
    v_role_name TEXT;
BEGIN
    SELECT r.role_name INTO v_role_name
    FROM public.profiles p
    JOIN public.user_roles r ON p.role_id = r.id
    WHERE p.id = auth.uid()
      AND p.is_active = TRUE;
    
    RETURN v_role_name = 'superadmin';
END;
$$;

-- ============================================
-- Helper Function: Check if current user is admin or superadmin
-- Uses SECURITY DEFINER to bypass RLS
-- ============================================
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
    v_role_name TEXT;
BEGIN
    SELECT r.role_name INTO v_role_name
    FROM public.profiles p
    JOIN public.user_roles r ON p.role_id = r.id
    WHERE p.id = auth.uid()
      AND p.is_active = TRUE;
    
    RETURN v_role_name IN ('admin', 'superadmin');
END;
$$;

-- ============================================
-- Recreate RLS Policies (Fixed)
-- ============================================

-- Policy: Users can read their own profile
-- (This one is fine, no recursion)
-- Already exists, but keeping for reference

-- Policy: Superadmin can view all profiles (FIXED)
CREATE POLICY "Superadmin can view all profiles"
    ON public.profiles
    FOR SELECT
    USING (
        auth.uid() = id  -- Users can always see their own profile
        OR public.is_current_user_superadmin()  -- Superadmins can see all
    );

-- Policy: Users can update their own profile (limited fields) - FIXED
-- Note: We'll use a trigger function to enforce role/province restrictions
-- since WITH CHECK doesn't have access to OLD values
CREATE POLICY "Users can update own profile"
    ON public.profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Policy: Superadmin can update any profile (FIXED)
CREATE POLICY "Superadmin can update any profile"
    ON public.profiles
    FOR UPDATE
    USING (public.is_current_user_superadmin())
    WITH CHECK (public.is_current_user_superadmin());

-- ============================================
-- ============================================
-- Trigger Function: Prevent users from changing their own role/provinces
-- ============================================
CREATE OR REPLACE FUNCTION public.prevent_role_change_by_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- If user is superadmin, allow all changes
    IF public.is_current_user_superadmin() THEN
        RETURN NEW;
    END IF;
    
    -- If user is trying to change their own role or assigned_provinces, prevent it
    IF OLD.id = auth.uid() THEN
        IF OLD.role_id IS DISTINCT FROM NEW.role_id THEN
            RAISE EXCEPTION 'Users cannot change their own role. Only superadmin can change roles.';
        END IF;
        
        IF OLD.assigned_provinces IS DISTINCT FROM NEW.assigned_provinces THEN
            RAISE EXCEPTION 'Users cannot change their own assigned provinces. Only superadmin can change this.';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger to enforce role/province restrictions
DROP TRIGGER IF EXISTS prevent_role_change_trigger ON public.profiles;
CREATE TRIGGER prevent_role_change_trigger
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_role_change_by_user();

-- ============================================
-- Grant execute permissions on helper functions
-- ============================================
GRANT EXECUTE ON FUNCTION public.is_current_user_superadmin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_current_user_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.prevent_role_change_by_user() TO authenticated;

-- ============================================
-- NOTES:
-- ============================================
-- 1. Helper functions use SECURITY DEFINER to bypass RLS
-- 2. Functions are marked STABLE for query optimization
-- 3. Policies now use these functions instead of direct queries
-- 4. This prevents infinite recursion while maintaining security
-- ============================================

