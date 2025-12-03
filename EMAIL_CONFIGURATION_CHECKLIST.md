# Email Configuration Checklist

## ✅ What You've Done

- Added `SITE_URL` to Edge Function secrets ✅
- This is correct for Edge Functions (create-user, delete-user)

## ⚠️ Important: Two Different Configurations

### 1. Edge Functions (Uses SITE_URL from secrets)
- **create-user** function: Uses `Deno.env.get('SITE_URL')`
- **delete-user** function: Can use `SITE_URL` if needed
- ✅ You've already configured this!

### 2. Frontend Password Reset (Uses environment.frontendUrl)
- **resetPasswordForEmail**: Uses `environment.frontendUrl`
- Currently set to: `http://localhost:4200`
- ✅ Already configured in code!

### 3. Supabase Dashboard (MOST IMPORTANT!)
This is what actually controls email redirects:

**Go to Supabase Dashboard:**
1. **Authentication** → **URL Configuration**
2. **Site URL**: `http://localhost:4200` (or your production URL)
3. **Redirect URLs**: Add these:
   ```
   http://localhost:4200/**
   http://127.0.0.1:4200/**
   http://localhost:4200/reset-password
   ```

## Why Password Reset Emails Might Not Work

Even with `SITE_URL` in Edge Function secrets, password reset emails from the frontend need:

1. ✅ **Supabase Dashboard URL Configuration** (MOST IMPORTANT!)
   - Authentication → URL Configuration
   - Must have your redirect URLs in the allowed list

2. ✅ **Rate Limits**
   - Project Settings → Authentication → Rate Limits
   - Increase "Email sent per hour" from 2 to 60+

3. ✅ **Email Service**
   - Project Settings → Authentication → Email
   - Verify email is enabled
   - Check if SMTP is configured (or using default)

## Quick Test

1. Go to Supabase Dashboard → **Authentication** → **Users**
2. Find a user
3. Click **"Send password reset email"** (from Dashboard)
4. If this works → Email service is fine, issue is with redirect URL config
5. If this doesn't work → Email service needs configuration

## Current Configuration Status

| Component | Configuration | Status |
|-----------|-------------|--------|
| Edge Function SITE_URL | In secrets | ✅ Done |
| Frontend frontendUrl | environment.ts | ✅ Done |
| Supabase Dashboard URLs | Need to check | ⚠️ **Check this!** |
| Rate Limits | Default (2/hour) | ⚠️ **Increase this!** |

## Action Items

1. **Go to Supabase Dashboard** → **Authentication** → **URL Configuration**
   - Verify Site URL is set
   - Add redirect URLs with `/**` wildcard

2. **Go to Project Settings** → **Authentication** → **Rate Limits**
   - Increase "Email sent per hour" to 60+

3. **Test password reset** from frontend again

The `SITE_URL` in Edge Function secrets is correct, but password reset emails also need the Dashboard URL configuration!

