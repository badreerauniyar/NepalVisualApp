# Environment Configuration Guide

## How Angular Environments Work

Angular automatically uses the correct environment file based on your build:

- **Development** (`ng serve`): Uses `environment.ts` → `localhost:4200`
- **Production** (`ng build --configuration production`): Uses `environment.prod.ts` → Production URL

**This means you can have different URLs for dev and prod without any issues!**

## Current Setup

### Development (`src/environments/environment.ts`)
```typescript
frontendUrl: 'http://localhost:4200'  // ✅ For local development
```

### Production (`src/environments/environment.prod.ts`)
```typescript
frontendUrl: 'https://your-production-domain.com'  // ⚠️ Update this!
```

## Steps to Configure Production URL

### 1. Update Production Environment File

Edit `src/environments/environment.prod.ts`:
```typescript
export const environment = {
  production: true,
  mapboxAccessToken: 'YOUR_MAPBOX_ACCESS_TOKEN_HERE',
  supabaseUrl: 'https://kyuzwuubpudplfksvhjo.supabase.co',
  supabaseKey: 'YOUR_SUPABASE_ANON_KEY_HERE',
  frontendUrl: 'https://your-actual-production-domain.com' // ⬅️ Change this!
};
```

### 2. Update Supabase Dashboard

**Go to Authentication → URL Configuration:**

**Site URL:**
- For development: `http://localhost:4200`
- For production: `https://your-production-domain.com`
- **Recommendation**: Set to production URL (emails will use this as base)

**Redirect URLs** (Add ALL of these):
```
http://localhost:4200/**
http://127.0.0.1:4200/**
https://your-production-domain.com/**
```

**Why add both?**
- Development URLs: For testing locally
- Production URL: For actual users
- Supabase allows multiple redirect URLs

### 3. Update Edge Function SITE_URL (Optional)

If you want Edge Functions to use production URL:
```bash
supabase secrets set SITE_URL=https://your-production-domain.com
```

Or keep it as `http://localhost:4200` if you only use Edge Functions in production.

## How It Works

### Development Workflow
1. Run `ng serve` → Uses `environment.ts`
2. `frontendUrl = 'http://localhost:4200'`
3. Password reset emails redirect to `localhost:4200`
4. ✅ Works perfectly for local development

### Production Workflow
1. Run `ng build --configuration production` → Uses `environment.prod.ts`
2. `frontendUrl = 'https://your-production-domain.com'`
3. Password reset emails redirect to production URL
4. ✅ Works perfectly for production

## Important Notes

### ✅ Development Won't Break

- `environment.ts` stays as `localhost:4200`
- Development builds use `environment.ts`
- Production builds use `environment.prod.ts`
- They're completely separate!

### ✅ Supabase Dashboard Configuration

You can add **multiple redirect URLs**:
- `http://localhost:4200/**` (for development)
- `https://your-production-domain.com/**` (for production)

Supabase will accept redirects to any URL in the list.

### ⚠️ Site URL in Dashboard

The **Site URL** in Supabase Dashboard is used as the base for email links. You have two options:

**Option A: Set to Production (Recommended)**
- Site URL: `https://your-production-domain.com`
- Redirect URLs: Include both dev and prod
- Emails will use production URL by default
- Development still works because redirect URLs include localhost

**Option B: Set to Development (For Testing)**
- Site URL: `http://localhost:4200`
- Redirect URLs: Include both dev and prod
- Good for testing, but switch to production URL before going live

## Recommended Configuration

### Supabase Dashboard → Authentication → URL Configuration

**Site URL:**
```
https://your-production-domain.com
```

**Redirect URLs:**
```
http://localhost:4200/**
http://127.0.0.1:4200/**
https://your-production-domain.com/**
```

### Environment Files

**Development** (`environment.ts`):
```typescript
frontendUrl: 'http://localhost:4200'
```

**Production** (`environment.prod.ts`):
```typescript
frontendUrl: 'https://your-production-domain.com'
```

## Testing

### Test Development
1. Run `ng serve`
2. Request password reset
3. Email should have `localhost:4200` link
4. ✅ Works!

### Test Production
1. Run `ng build --configuration production`
2. Deploy to production
3. Request password reset from production
4. Email should have production URL link
5. ✅ Works!

## Summary

- ✅ **Development won't break** - Uses `environment.ts` with localhost
- ✅ **Production uses production URL** - Uses `environment.prod.ts`
- ✅ **Add both URLs to Supabase Dashboard** - Redirect URLs support multiple entries
- ✅ **No code changes needed** - Already configured correctly!

Just update:
1. `environment.prod.ts` with your production URL
2. Supabase Dashboard with production URL in redirect URLs list

