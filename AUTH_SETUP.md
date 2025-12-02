# Authentication & Role-Based Access Control Setup Guide

This guide explains how to set up and use the authentication system with role-based access control (RBAC) in the Nepal Visual App.

## Overview

The authentication system provides:
- **Three roles**: `superadmin`, `admin`, `user`
- **User management**: Superadmin can create and manage users
- **Province-based access**: Admins can be assigned to specific provinces
- **Secure RLS policies**: Row-level security ensures data protection

## Database Setup

### 1. Run the Migration

Apply the authentication migration to your Supabase database:

```bash
# If using Supabase CLI locally
supabase migration up

# Or apply the SQL file directly in Supabase Dashboard
# File: supabase/migrations/20251203000000_create_auth_system.sql
```

### 2. Verify Tables Created

After running the migration, verify these tables exist:
- `public.user_roles` - Contains the three default roles
- `public.profiles` - Extends `auth.users` with role and province assignments

### 3. Create Your First Superadmin

**Option A: Via Supabase Dashboard (Recommended)**

1. Go to Supabase Dashboard → Authentication → Users
2. Click "Add User" → "Create new user"
3. Enter email and a temporary password
4. The user will be created in `auth.users` and a profile will be auto-created
5. Go to SQL Editor and run:

```sql
-- Get the user ID from auth.users table
-- Then assign superadmin role
UPDATE public.profiles
SET role_id = (SELECT id FROM public.user_roles WHERE role_name = 'superadmin')
WHERE email = 'your-superadmin@email.com';
```

**Option B: Via SQL (Direct)**

```sql
-- First, create user in auth.users (requires service role)
-- Then update profile
UPDATE public.profiles
SET role_id = (SELECT id FROM public.user_roles WHERE role_name = 'superadmin')
WHERE id = 'user-uuid-here';
```

## User Creation

### Important: Service Role Key Required

**User creation from the frontend requires the Supabase Service Role Key**, which should **NEVER** be exposed in client-side code.

### Recommended Approaches:

#### Option 1: Supabase Dashboard (Easiest)
1. Go to Supabase Dashboard → Authentication → Users
2. Click "Add User" → "Create new user"
3. Enter email and password (or use "Send magic link")
4. User receives email to set password
5. After user is created, use the User Management page to assign roles

#### Option 2: Backend API Endpoint (Most Secure)
Create a backend API endpoint that uses the service role key:

```typescript
// Backend endpoint (Node.js/Express example)
app.post('/api/users', async (req, res) => {
  const { email, password, fullName, roleId, provinces } = req.body;
  
  // Use service role key (server-side only!)
  const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  // Create user
  const { data: user, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // Auto-confirm email
    user_metadata: { full_name: fullName }
  });
  
  if (error) return res.status(400).json({ error });
  
  // Assign role
  await supabaseAdmin.rpc('assign_role_to_user', {
    p_user_id: user.id,
    p_role_id: roleId,
    p_provinces: provinces || []
  });
  
  res.json({ success: true, user });
});
```

#### Option 3: Supabase Edge Function
Create a Supabase Edge Function that handles user creation securely.

## Role Permissions

### Superadmin
- Full access to all features
- Can create, edit, and delete users
- Can assign roles to any user
- Can access all provinces

### Admin
- Can manage assigned provinces
- Cannot create users
- Cannot change roles
- Limited to assigned provinces

### User
- Basic access
- Cannot manage other users
- Cannot change roles
- Limited to assigned provinces (if any)

## Frontend Usage

### Login
Navigate to `/login` to sign in with email and password.

### User Management (Superadmin Only)
Navigate to `/admin/users` to:
- View all users
- Assign roles to users
- Assign provinces to admins
- Edit user information

### Route Guards
Routes are protected by guards:
- `authGuard`: Requires authentication
- `superadminGuard`: Requires superadmin role
- `adminGuard`: Requires admin or superadmin role

Example:
```typescript
{
  path: 'admin/users',
  component: UserManagementComponent,
  canActivate: [superadminGuard]
}
```

## Email Configuration

### Password Reset
Users can reset passwords via the "Forgot Password" link on the login page.

### User Invitation
When creating users via Supabase Dashboard:
1. Use "Send magic link" option
2. User receives email with invitation link
3. User clicks link and sets password
4. User is automatically logged in

### Email Templates
Customize email templates in Supabase Dashboard:
- Settings → Auth → Email Templates
- Templates: Invite, Magic Link, Password Reset, etc.

## Security Best Practices

1. **Never expose service role key** in frontend code
2. **Use RLS policies** - They're already set up in the migration
3. **Validate user roles** on both frontend and backend
4. **Use HTTPS** in production
5. **Enable email confirmation** for new users
6. **Set strong password requirements** in Supabase settings

## Troubleshooting

### User can't login
- Check if email is confirmed in Supabase Dashboard
- Verify user exists in `auth.users` table
- Check if profile exists in `public.profiles` table

### User has no role
- Default role is `user` (auto-assigned on signup)
- Superadmin must assign roles via User Management page

### RLS policies blocking access
- Verify user is authenticated: `auth.uid() IS NOT NULL`
- Check user's role in `public.profiles`
- Ensure RLS is enabled on tables

### User creation fails
- Service role key is required for `auth.admin.createUser()`
- Use Supabase Dashboard or backend API instead

## API Reference

### AuthService Methods

```typescript
// Sign in
await authService.signIn(email, password);

// Sign out
await authService.signOut();

// Get current user profile
const profile = authService.currentUserProfile();

// Check roles
const isSuperAdmin = authService.isSuperAdmin();
const isAdmin = authService.isAdmin();

// Get all users (superadmin only)
const users = await authService.getAllUsers();

// Assign role to user (superadmin only)
await authService.assignRoleToUser(userId, roleId, provinces);
```

## Next Steps

1. Run the migration
2. Create your first superadmin user
3. Test login functionality
4. Create additional users via Supabase Dashboard
5. Assign roles via User Management page
6. (Optional) Set up backend API for user creation

## Support

For issues or questions:
- Check Supabase documentation: https://supabase.com/docs
- Review migration file: `supabase/migrations/20251203000000_create_auth_system.sql`
- Check Angular service: `src/app/services/auth.service.ts`

