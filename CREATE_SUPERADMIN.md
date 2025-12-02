# Quick Guide: Create Your First Superadmin

## Step-by-Step Instructions

### Step 1: Create User in Supabase Dashboard

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **Authentication** → **Users**
4. Click **"Add User"** → **"Create new user"**
5. Fill in:
   - **Email**: `badree.rauniyar@gmail.com`
   - **Password**: (set a temporary password, or use "Send magic link")
6. Click **"Create user"**

### Step 2: Assign Superadmin Role

After the user is created, run this SQL in the Supabase SQL Editor:

```sql
UPDATE public.profiles
SET 
    role_id = (SELECT id FROM public.user_roles WHERE role_name = 'superadmin'),
    updated_at = NOW()
WHERE email = 'badree.rauniyar@gmail.com';
```

### Step 3: Verify

Run this query to verify:

```sql
SELECT 
    p.email,
    p.full_name,
    r.role_name,
    p.is_active
FROM public.profiles p
LEFT JOIN public.user_roles r ON p.role_id = r.id
WHERE p.email = 'badree.rauniyar@gmail.com';
```

You should see:
- `role_name`: `superadmin`
- `is_active`: `true`

### Step 4: Test Login

1. Go to your app: `/login`
2. Login with: `badree.rauniyar@gmail.com` and your password
3. You should see "Manage Users" link in the header (superadmin only)
4. Navigate to `/admin/users` to manage users

## Alternative: Complete SQL Script

If you prefer a single script that handles everything (assuming user exists), use:

**File**: `supabase/migrations/20251203000001_create_first_superadmin.sql`

Run the **OPTION 3** section from that file.

## Troubleshooting

### User doesn't exist error
- Make sure you created the user in Supabase Dashboard first (Step 1)

### Profile doesn't exist
- The trigger should auto-create it when user signs up
- If not, the OPTION 3 script in the SQL file will create it

### Can't login
- Check if email is confirmed in Supabase Dashboard
- Try resetting password via "Forgot Password" on login page

## Next Steps

After creating your superadmin:
1. Login to the app
2. Go to `/admin/users`
3. Create additional users via Supabase Dashboard
4. Assign roles via the User Management page

