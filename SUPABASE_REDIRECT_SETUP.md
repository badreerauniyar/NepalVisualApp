# Supabase Email Redirect URL Configuration

## Issue
Supabase invite/password reset emails were redirecting to port 3000, but should redirect to port 4200 (Angular dev server) or use the configured frontend URL.

## Solution

### 1. Local Development (config.toml)

Updated `supabase/config.toml`:
```toml
[auth]
site_url = "http://127.0.0.1:4200"
additional_redirect_urls = ["http://127.0.0.1:4200", "http://localhost:4200"]
```

### 2. Environment Configuration

Added `frontendUrl` to environment files:

**Development** (`src/environments/environment.ts`):
```typescript
frontendUrl: 'http://localhost:4200'
```

**Production** (`src/environments/environment.prod.ts`):
```typescript
frontendUrl: 'https://your-production-domain.com'
```

### 3. Supabase Dashboard Configuration

**IMPORTANT**: You also need to configure this in your Supabase Dashboard:

1. Go to **Supabase Dashboard** → **Authentication** → **URL Configuration**
2. Set **Site URL** to: `http://localhost:4200` (for development)
3. Add to **Redirect URLs**:
   - `http://localhost:4200/**`
   - `http://127.0.0.1:4200/**`
   - Your production URL (for production)

### 4. For Production

When deploying to production:

1. Update `src/environments/environment.prod.ts`:
   ```typescript
   frontendUrl: 'https://your-actual-domain.com'
   ```

2. Update Supabase Dashboard:
   - **Site URL**: `https://your-actual-domain.com`
   - **Redirect URLs**: Add `https://your-actual-domain.com/**`

3. Update `supabase/config.toml` (if using local Supabase):
   ```toml
   site_url = "https://your-actual-domain.com"
   ```

## How It Works

The auth service now uses `environment.frontendUrl` for redirect URLs:

```typescript
const frontendUrl = environment.frontendUrl || window.location.origin;
```

This ensures:
- Development: Redirects to `http://localhost:4200`
- Production: Redirects to your production domain
- Fallback: Uses `window.location.origin` if not configured

## Testing

1. **Local Development**:
   - Start your Angular app: `ng serve` (runs on port 4200)
   - Create a user via Supabase Dashboard
   - Check the invite email - it should redirect to `http://localhost:4200`

2. **Password Reset**:
   - Click "Forgot Password" on login page
   - Email should contain redirect to `http://localhost:4200/reset-password`

## Troubleshooting

### Emails still redirecting to wrong URL

1. **Check Supabase Dashboard**:
   - Go to Authentication → URL Configuration
   - Verify Site URL and Redirect URLs are correct

2. **Check Environment File**:
   - Verify `frontendUrl` is set correctly in `environment.ts`

3. **Restart Supabase** (if local):
   ```bash
   supabase stop
   supabase start
   ```

4. **Clear Browser Cache**:
   - Sometimes cached redirect URLs can cause issues

### Production Issues

- Make sure production environment file has correct `frontendUrl`
- Verify Supabase Dashboard has production URL in redirect URLs
- Check that HTTPS is used in production (Supabase requires HTTPS for production)

## Notes

- The `config.toml` file is for **local Supabase development**
- For **hosted Supabase**, configure URLs in the Dashboard
- Always use HTTPS in production
- Wildcard `/**` in redirect URLs allows all paths under that domain

