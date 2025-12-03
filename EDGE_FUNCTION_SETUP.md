# Supabase Edge Function Setup Guide

## Overview

The `create-user` Edge Function allows superadmins to create users securely from the frontend without exposing the service role key.

## Setup Instructions

### 1. Deploy the Edge Function

#### Option A: Using Supabase CLI (Recommended)

```bash
# Make sure you have Supabase CLI installed
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Deploy the function
supabase functions deploy create-user
```

#### Option B: Using Supabase Dashboard

1. Go to your Supabase Dashboard
2. Navigate to **Edge Functions**
3. Click **Create a new function**
4. Name it `create-user`
5. Copy the code from `supabase/functions/create-user/index.ts`
6. Click **Deploy**

### 2. Set Environment Variables

The Edge Function needs the service role key. Set it in your Supabase project:

**Via Supabase Dashboard:**
1. Go to **Project Settings** → **Edge Functions**
2. Add secret: `SUPABASE_SERVICE_ROLE_KEY`
3. Value: Your service role key (from **Project Settings** → **API** → **service_role** key)

**Via Supabase CLI:**
```bash
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Also set SITE_URL (optional but recommended):**
```bash
supabase secrets set SITE_URL=http://localhost:4200
```

Or in Dashboard: Add secret `SITE_URL` with value `http://localhost:4200` (or your production URL)

### 3. Verify Function is Deployed

1. Go to **Edge Functions** in Supabase Dashboard
2. You should see `create-user` function listed
3. Check that it's active

### 4. Test the Function

After deployment, try creating a user from the User Management page. The function will:
- Verify the caller is a superadmin
- Create the user in Supabase Auth using `inviteUserByEmail` (sends email automatically)
- Assign the specified role
- User receives an invitation email with a link to set their password

## How It Works

1. **Frontend calls the Edge Function** with user details
2. **Edge Function verifies** the caller is authenticated and is a superadmin
3. **Edge Function uses service role key** (server-side only) to create the user
4. **User receives email** to set their password
5. **Role is assigned** automatically

## Security

- ✅ Service role key never exposed to frontend
- ✅ Only superadmins can call the function
- ✅ User authentication verified before user creation
- ✅ CORS headers configured for secure access

## Troubleshooting

### Function not found (404)
- Make sure the function is deployed
- Check the function name matches exactly: `create-user`
- Verify the URL: `${SUPABASE_URL}/functions/v1/create-user`

### Unauthorized (401/403)
- Check that you're logged in as superadmin
- Verify the auth token is being sent correctly
- Check that the user's role is correctly set in the database

### Service role key error
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set in Edge Function secrets
- Check that the key is correct (from Supabase Dashboard → API → service_role)

### User creation fails
- Check Edge Function logs in Supabase Dashboard
- Verify email is not already in use
- Check that roleId exists in `user_roles` table

## Local Development

If using Supabase locally:

```bash
# Start Supabase locally
supabase start

# Deploy function locally
supabase functions deploy create-user --no-verify-jwt

# The function will be available at:
# http://localhost:54321/functions/v1/create-user
```

## Production Considerations

1. **Rate Limiting**: Consider adding rate limiting to prevent abuse
2. **Email Templates**: Customize the password reset email template
3. **Logging**: Monitor Edge Function logs for errors
4. **Backup**: Ensure user data is backed up regularly

## Alternative: Manual User Creation

If you prefer not to use Edge Functions, you can still:
1. Create users via Supabase Dashboard
2. Assign roles via the User Management page
3. Users will receive invitation emails automatically

