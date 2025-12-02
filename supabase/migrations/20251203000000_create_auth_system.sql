-- ============================================
-- Authentication and Role-Based Access Control
-- ============================================
-- This migration creates:
-- 1. user_roles table (superadmin, admin, user)
-- 2. profiles table (extends auth.users)
-- 3. RLS policies for secure access
-- 4. Triggers to auto-create profiles
-- 5. RPC functions for user management
-- ============================================

-- ============================================
-- 1. USER ROLES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_name TEXT NOT NULL UNIQUE,
    role_description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default roles
INSERT INTO public.user_roles (role_name, role_description) VALUES
    ('superadmin', 'Full access to all features and user management'),
    ('admin', 'Manages specific provinces or districts'),
    ('user', 'General user with limited access')
ON CONFLICT (role_name) DO NOTHING;

-- Index for role lookups
CREATE INDEX IF NOT EXISTS idx_user_roles_role_name ON public.user_roles(role_name);

-- ============================================
-- 2. PROFILES TABLE (extends auth.users)
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    role_id UUID REFERENCES public.user_roles(id) ON DELETE SET NULL,
    assigned_provinces TEXT[] DEFAULT '{}', -- Array of province codes or names
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT profiles_role_fk FOREIGN KEY (role_id) REFERENCES public.user_roles(id)
);

-- Indexes for profiles
CREATE INDEX IF NOT EXISTS idx_profiles_role_id ON public.profiles(role_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON public.profiles(is_active);

-- ============================================
-- 3. TRIGGER: Auto-create profile on user signup
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role_id)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        (SELECT id FROM public.user_roles WHERE role_name = 'user' LIMIT 1)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 4. RPC FUNCTION: Assign role to user (superadmin only)
-- ============================================
CREATE OR REPLACE FUNCTION public.assign_role_to_user(
    p_user_id UUID,
    p_role_id UUID,
    p_provinces TEXT[] DEFAULT '{}'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_user_role TEXT;
BEGIN
    -- Check if current user is superadmin
    SELECT r.role_name INTO v_current_user_role
    FROM public.profiles p
    JOIN public.user_roles r ON p.role_id = r.id
    WHERE p.id = auth.uid();
    
    IF v_current_user_role != 'superadmin' THEN
        RAISE EXCEPTION 'Only superadmin can assign roles';
    END IF;
    
    -- Update user profile
    UPDATE public.profiles
    SET 
        role_id = p_role_id,
        assigned_provinces = COALESCE(p_provinces, '{}'),
        updated_at = NOW()
    WHERE id = p_user_id;
END;
$$;

-- ============================================
-- 5. RPC FUNCTION: Get current user role
-- ============================================
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TABLE (
    role_name TEXT,
    role_description TEXT,
    assigned_provinces TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.role_name,
        r.role_description,
        p.assigned_provinces
    FROM public.profiles p
    JOIN public.user_roles r ON p.role_id = r.id
    WHERE p.id = auth.uid()
      AND p.is_active = TRUE;
END;
$$;

-- ============================================
-- 6. RPC FUNCTION: Get all users (superadmin only)
-- ============================================
CREATE OR REPLACE FUNCTION public.get_all_users()
RETURNS TABLE (
    id UUID,
    email TEXT,
    full_name TEXT,
    role_name TEXT,
    assigned_provinces TEXT[],
    is_active BOOLEAN,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_user_role TEXT;
BEGIN
    -- Check if current user is superadmin
    SELECT r.role_name INTO v_current_user_role
    FROM public.profiles p
    JOIN public.user_roles r ON p.role_id = r.id
    WHERE p.id = auth.uid();
    
    IF v_current_user_role != 'superadmin' THEN
        RAISE EXCEPTION 'Only superadmin can view all users';
    END IF;
    
    RETURN QUERY
    SELECT 
        p.id,
        p.email,
        p.full_name,
        r.role_name,
        p.assigned_provinces,
        p.is_active,
        p.created_at
    FROM public.profiles p
    LEFT JOIN public.user_roles r ON p.role_id = r.id
    ORDER BY p.created_at DESC;
END;
$$;

-- ============================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own profile
CREATE POLICY "Users can view own profile"
    ON public.profiles
    FOR SELECT
    USING (auth.uid() = id);

-- Policy: Superadmin can view all profiles
CREATE POLICY "Superadmin can view all profiles"
    ON public.profiles
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            JOIN public.user_roles r ON p.role_id = r.id
            WHERE p.id = auth.uid()
              AND r.role_name = 'superadmin'
        )
    );

-- Policy: Users can update their own profile (limited fields)
CREATE POLICY "Users can update own profile"
    ON public.profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id
        -- Users cannot change their own role or assigned_provinces
        AND role_id = (SELECT role_id FROM public.profiles WHERE id = auth.uid())
        AND assigned_provinces = (SELECT assigned_provinces FROM public.profiles WHERE id = auth.uid())
    );

-- Policy: Superadmin can update any profile
CREATE POLICY "Superadmin can update any profile"
    ON public.profiles
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            JOIN public.user_roles r ON p.role_id = r.id
            WHERE p.id = auth.uid()
              AND r.role_name = 'superadmin'
        )
    );

-- Enable RLS on user_roles (read-only for authenticated users)
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can read roles
CREATE POLICY "Authenticated users can read roles"
    ON public.user_roles
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- ============================================
-- 8. TRIGGER: Update updated_at timestamp
-- ============================================
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_roles_updated_at
    BEFORE UPDATE ON public.user_roles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- NOTES:
-- ============================================
-- 1. Default role for new users is 'user'
-- 2. Only superadmin can assign roles via RPC function
-- 3. RLS policies ensure users can only see/modify their own data
-- 4. Superadmin has full access to all profiles
-- 5. Use Supabase Admin API from frontend to create users
-- 6. Email confirmation is handled by Supabase Auth settings
-- ============================================

