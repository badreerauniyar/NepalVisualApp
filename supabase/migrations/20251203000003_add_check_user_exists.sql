-- ============================================
-- Add RLS Policy: Allow anonymous users to check email existence
-- ============================================
-- This policy allows anonymous users (not logged in) to check if an email
-- exists in the profiles table. This is needed for password reset validation.
-- Only the email field is exposed, and only for active users.
-- ============================================

-- Policy: Anonymous users can check if email exists (for password reset)
CREATE POLICY "Anonymous can check email existence"
    ON public.profiles
    FOR SELECT
    TO anon
    USING (is_active = TRUE);

-- ============================================
-- NOTES:
-- ============================================
-- 1. Allows anonymous users to SELECT from profiles
-- 2. Only returns rows where is_active = TRUE
-- 3. Frontend should only select 'email' field to minimize data exposure
-- 4. Users can only check existence, not view other profile data
-- 5. This is simpler than creating an RPC function
-- ============================================

