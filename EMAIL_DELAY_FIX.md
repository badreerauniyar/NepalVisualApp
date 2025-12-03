# Fix Email Delivery Delays

## Problem
Emails are arriving but very late (could be minutes or hours). This is because you're using Supabase's default email service, which has:
- Low priority queue
- Rate limits (2 emails/hour by default)
- Shared infrastructure (can be slow)

## Solution: Configure Custom SMTP

Use a production-ready email provider for fast, reliable delivery.

---

## Option 1: SendGrid (Recommended for Quick Setup)

### Step 1: Create SendGrid Account
1. Go to [SendGrid.com](https://sendgrid.com) and sign up (free tier: 100 emails/day)
2. Verify your email address
3. Go to **Settings** → **API Keys**
4. Click **Create API Key**
5. Name it (e.g., "Supabase Auth")
6. Select **Full Access** or **Restricted Access** (Mail Send permissions)
7. Copy the API key (you'll only see it once!)

### Step 2: Configure in Supabase Dashboard (Production)

1. Go to **Supabase Dashboard** → **Project Settings** → **Authentication** → **Email**
2. Scroll to **SMTP Settings**
3. Enable **Custom SMTP**
4. Fill in:
   - **Host**: `smtp.sendgrid.net`
   - **Port**: `587`
   - **Username**: `apikey` (literally the word "apikey")
   - **Password**: Your SendGrid API key
   - **Sender email**: Your verified SendGrid sender email
   - **Sender name**: Your app name (e.g., "Nepal Visual App")
5. Click **Save**

### Step 3: Configure for Local Development (config.toml)

Edit `supabase/config.toml`:

```toml
[auth.email.smtp]
enabled = true
host = "smtp.sendgrid.net"
port = 587
user = "apikey"
pass = "env(SENDGRID_API_KEY)"  # Set this in your environment
admin_email = "your-verified-email@example.com"
sender_name = "Nepal Visual App"
```

Then set the environment variable:
```bash
export SENDGRID_API_KEY="your-sendgrid-api-key-here"
```

Or add to `.env` file (if using Supabase CLI):
```bash
SENDGRID_API_KEY=your-sendgrid-api-key-here
```

---

## Option 2: AWS SES (Best for Production)

### Step 1: Set Up AWS SES
1. Go to AWS Console → **SES** (Simple Email Service)
2. Verify your email address or domain
3. Move out of "Sandbox" mode (request production access)
4. Create SMTP credentials:
   - Go to **SMTP Settings**
   - Click **Create SMTP Credentials**
   - Save the username and password

### Step 2: Configure in Supabase Dashboard

1. Go to **Supabase Dashboard** → **Project Settings** → **Authentication** → **Email**
2. Enable **Custom SMTP**
3. Fill in:
   - **Host**: Your SES SMTP endpoint (e.g., `email-smtp.us-east-1.amazonaws.com`)
   - **Port**: `587` (TLS) or `465` (SSL)
   - **Username**: Your SES SMTP username
   - **Password**: Your SES SMTP password
   - **Sender email**: Your verified SES email
   - **Sender name**: Your app name
4. Click **Save**

### Step 3: Configure for Local Development

Edit `supabase/config.toml`:

```toml
[auth.email.smtp]
enabled = true
host = "email-smtp.us-east-1.amazonaws.com"  # Your SES region endpoint
port = 587
user = "env(AWS_SES_SMTP_USERNAME)"
pass = "env(AWS_SES_SMTP_PASSWORD)"
admin_email = "your-verified-email@example.com"
sender_name = "Nepal Visual App"
```

Set environment variables:
```bash
export AWS_SES_SMTP_USERNAME="your-ses-username"
export AWS_SES_SMTP_PASSWORD="your-ses-password"
```

---

## Option 3: Gmail (For Testing Only)

⚠️ **Not recommended for production** - Gmail has strict limits and may block your account.

### Setup:
1. Enable 2-factor authentication on your Google account
2. Generate an [App Password](https://myaccount.google.com/apppasswords)
3. Use these settings:
   - **Host**: `smtp.gmail.com`
   - **Port**: `587`
   - **Username**: Your Gmail address
   - **Password**: Your App Password (16 characters)

---

## Option 4: Mailgun (Good Alternative)

1. Sign up at [Mailgun.com](https://mailgun.com)
2. Verify your domain or use sandbox domain
3. Get SMTP credentials from **Sending** → **Domain Settings** → **SMTP credentials**
4. Configure in Supabase Dashboard:
   - **Host**: `smtp.mailgun.org`
   - **Port**: `587`
   - **Username**: Your Mailgun SMTP username
   - **Password**: Your Mailgun SMTP password

---

## Quick Comparison

| Provider | Free Tier | Setup Difficulty | Best For |
|----------|-----------|-------------------|----------|
| **SendGrid** | 100/day | Easy ⭐ | Quick setup, testing |
| **AWS SES** | 62,000/month | Medium ⭐⭐ | Production, scale |
| **Mailgun** | 5,000/month | Easy ⭐ | Production alternative |
| **Gmail** | Limited | Easy ⭐ | Testing only |

---

## After Configuration

### 1. Test Email Delivery
1. Go to **Supabase Dashboard** → **Authentication** → **Users**
2. Find a user
3. Click **"Send password reset email"**
4. Check if email arrives quickly (should be < 10 seconds)

### 2. Increase Rate Limits (Still Important!)
Even with custom SMTP, increase rate limits:
1. Go to **Project Settings** → **Authentication** → **Rate Limits**
2. Set **Email sent per hour** to `100` or higher

### 3. Monitor Email Delivery
- Check **Supabase Dashboard** → **Logs** → **Auth Logs**
- Look for email sending events
- Check for any errors

---

## Local Development vs Production

### Local Development (config.toml)
- Uses `supabase/config.toml` settings
- Requires environment variables for secrets
- Restart Supabase after changes: `supabase stop && supabase start`

### Production (Supabase Dashboard)
- Configure in Dashboard (no code changes needed)
- Takes effect immediately
- No restart required

---

## Troubleshooting

### Emails Still Delayed?
1. **Check SMTP credentials** - Verify username/password are correct
2. **Check sender email** - Must be verified in your email provider
3. **Check rate limits** - Your email provider may have limits
4. **Check spam folder** - Some providers mark new senders as spam initially
5. **Check Supabase logs** - Look for SMTP errors

### SMTP Connection Errors?
1. **Check firewall** - Port 587/465 must be open
2. **Check credentials** - Username/password must be correct
3. **Check host/port** - Verify SMTP server address
4. **Try different port** - Some providers use 465 (SSL) instead of 587 (TLS)

### Still Using Default Email Service?
If emails still come from `noreply@supabase.io`, SMTP isn't configured correctly:
1. Double-check Dashboard settings
2. Verify SMTP is enabled
3. Test connection (some dashboards have a "Test" button)

---

## Expected Results

After configuring custom SMTP:
- ✅ Emails arrive in **< 10 seconds** (usually 2-5 seconds)
- ✅ Higher delivery rate (99%+)
- ✅ Better sender reputation
- ✅ Custom sender name and email
- ✅ Production-ready reliability

---

## Next Steps

1. **Choose a provider** (SendGrid recommended for quick start)
2. **Configure in Supabase Dashboard** (production)
3. **Configure in config.toml** (local development)
4. **Test email delivery**
5. **Monitor logs** for any issues

Your emails should now arrive quickly! 🚀

