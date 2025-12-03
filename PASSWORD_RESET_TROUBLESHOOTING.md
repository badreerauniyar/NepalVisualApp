# Password Reset Email Troubleshooting Guide

## Overview

`resetPasswordForEmail` works from the frontend - **no backend function needed**. If emails aren't being received, it's usually a configuration issue.

## Quick Checklist

### 1. ✅ Check Supabase Dashboard Settings

**Authentication → URL Configuration:**
- **Site URL**: Must match your frontend URL
  - Development: `http://localhost:4200`
  - Production: Your production domain
- **Redirect URLs**: Must include:
  - `http://localhost:4200/**` (development)
  - `http://127.0.0.1:4200/**` (development)
  - Your production URL with `/**` (production)

### 2. ✅ Check Email Settings

**Project Settings → Authentication → Email:**
- **Enable email confirmations**: Can be enabled or disabled (doesn't affect password reset)
- **Email templates**: Make sure "Password Reset" template exists
- **SMTP**: Either use Supabase's default email service OR configure custom SMTP

### 3. ✅ Check Rate Limits

**Project Settings → Authentication → Rate Limits:**
- **Email sent per hour**: Default is 2 (very low!)
- **Recommendation**: Increase to at least 30-60 for testing

### 4. ✅ Verify Email Address

- Make sure the email exists in your Supabase `auth.users` table
- Check if email is confirmed (some settings require confirmation)
- Try with a different email address

### 5. ✅ Check Browser Console

When clicking "Send Reset Link", check the browser console for errors:
- Network errors
- CORS errors
- API errors from Supabase

## Common Issues & Solutions

### Issue 1: "Email not sent" but no error

**Cause**: Rate limiting or email service not configured

**Solution**:
1. Check Supabase Dashboard → Authentication → Rate Limits
2. Increase `email_sent` limit
3. Wait a few minutes and try again

### Issue 2: "Invalid redirect URL"

**Cause**: Redirect URL not in allowed list

**Solution**:
1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Add your redirect URL to the list:
   - `http://localhost:4200/reset-password`
   - Or use wildcard: `http://localhost:4200/**`

### Issue 3: Email goes to spam

**Cause**: Using Supabase's default email service (from noreply@supabase.io)

**Solution**:
1. Configure custom SMTP (recommended for production)
2. Or check spam/junk folder
3. Add sender to contacts

### Issue 4: No email service configured

**Cause**: SMTP not set up and default service disabled

**Solution**:
1. **Option A**: Use Supabase's default email service (works but limited)
   - Go to Project Settings → Authentication → Email
   - Default service should be enabled automatically
   
2. **Option B**: Configure custom SMTP (recommended)
   - Go to Project Settings → Authentication → Email → SMTP Settings
   - Configure with your email provider (SendGrid, AWS SES, etc.)

## Testing Steps

1. **Test from Frontend**:
   ```typescript
   // This should work from frontend
   await supabase.auth.resetPasswordForEmail('user@example.com', {
     redirectTo: 'http://localhost:4200/reset-password'
   });
   ```

2. **Check Supabase Logs**:
   - Go to Supabase Dashboard → Logs → Auth Logs
   - Look for password reset attempts
   - Check for errors

3. **Verify Email in Database**:
   ```sql
   SELECT email, email_confirmed_at 
   FROM auth.users 
   WHERE email = 'your-email@example.com';
   ```

## Configuration in Supabase Dashboard

### Step 1: URL Configuration
1. Go to **Authentication** → **URL Configuration**
2. Set **Site URL**: `http://localhost:4200`
3. Add **Redirect URLs**:
   ```
   http://localhost:4200/**
   http://127.0.0.1:4200/**
   ```

### Step 2: Email Settings
1. Go to **Project Settings** → **Authentication** → **Email**
2. Verify email is enabled
3. Check email templates exist

### Step 3: Rate Limits (Important!)
1. Go to **Project Settings** → **Authentication** → **Rate Limits**
2. Increase **Email sent per hour** from 2 to at least 30
3. This is often the issue - default limit is too low!

### Step 4: SMTP Configuration (Optional but Recommended)
1. Go to **Project Settings** → **Authentication** → **Email** → **SMTP Settings**
2. Configure with your email provider:
   - **SendGrid**: `smtp.sendgrid.net:587`
   - **AWS SES**: Your SES SMTP endpoint
   - **Gmail**: `smtp.gmail.com:587` (requires app password)
   - **Custom**: Your SMTP server details

## Frontend Implementation (Already Done ✅)

The frontend implementation is correct:
- `resetPasswordForEmail` is called from frontend
- Redirect URL is configured
- Error handling is in place

## Why It Might Not Work

1. **Rate Limiting**: Default is only 2 emails/hour - very low!
2. **Redirect URL**: Not in allowed list in Supabase Dashboard
3. **SMTP Not Configured**: Default email service might be disabled
4. **Email in Spam**: Check spam/junk folder
5. **User Doesn't Exist**: Email must exist in `auth.users` table

## Quick Fix

Most common issue is **rate limiting**. Try this:

1. Go to Supabase Dashboard
2. **Project Settings** → **Authentication** → **Rate Limits**
3. Change **Email sent per hour** from `2` to `60`
4. Try again

## Alternative: Test with Supabase Dashboard

To verify email works:
1. Go to Supabase Dashboard → **Authentication** → **Users**
2. Find a user
3. Click **Send password reset email**
4. If this works, the issue is with frontend configuration
5. If this doesn't work, the issue is with email service configuration

## Production Considerations

For production:
1. **Configure custom SMTP** (required for reliable delivery)
2. **Set proper rate limits** (higher than default)
3. **Use HTTPS** for redirect URLs
4. **Configure email templates** for branding
5. **Monitor email delivery** in Supabase logs

## Still Not Working?

If emails still don't arrive after checking all above:

1. **Check Supabase Logs**: Dashboard → Logs → Auth Logs
2. **Check Browser Console**: Look for API errors
3. **Test with different email**: Rule out email-specific issues
4. **Verify user exists**: Check `auth.users` table
5. **Check email service status**: Supabase status page

The frontend code is correct - the issue is almost always configuration in Supabase Dashboard.

