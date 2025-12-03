# Production URL Setup Guide

## ✅ Good News: Development Won't Break!

Angular automatically uses different environment files:
- **Development** (`ng serve`): Uses `environment.ts` → `localhost:4200` ✅
- **Production** (`ng build --configuration production`): Uses `environment.prod.ts` → Production URL ✅

**They're completely separate - changing production URL won't affect development!**

## Steps to Configure Production URL

### 1. Update Production Environment File

Edit `src/environments/environment.prod.ts`:

```typescript
export const environment = {
  production: true,
  mapboxAccessToken: 'YOUR_MAPBOX_ACCESS_TOKEN_HERE',
  supabaseUrl: 'https://kyuzwuubpudplfksvhjo.supabase.co',
  supabaseKey: 'YOUR_SUPABASE_ANON_KEY_HERE',
  frontendUrl: 'https://your-actual-production-domain.com' // ⬅️ Change this to your production URL
};
```

**Example:**
```typescript
frontendUrl: 'https://nepalvisualapp.com' // Your actual domain
```

### 2. Update Supabase Dashboard (IMPORTANT!)

**Go to Authentication → URL Configuration:**

**Site URL:**
- Set to your **production URL**: `https://your-production-domain.com`
- This is the base URL used in emails

**Redirect URLs** (Add ALL of these - Supabase supports multiple):
```
http://localhost:4200/**
http://127.0.0.1:4200/**
https://your-production-domain.com/**
```

**Why add both?**
- ✅ Development URLs: For local testing
- ✅ Production URL: For actual users
- ✅ Supabase allows multiple redirect URLs

### 3. Update Edge Function SITE_URL (Optional)

If you want Edge Functions to use production URL in production:

```bash
supabase secrets set SITE_URL=https://your-production-domain.com
```

Or you can keep it as `http://localhost:4200` if Edge Functions are only used in production builds.

## How It Works

### Development (`ng serve`)
1. Uses `environment.ts`
2. `frontendUrl = 'http://localhost:4200'`
3. Password reset emails → `localhost:4200/reset-password`
4. ✅ Works perfectly!

### Production (`ng build --configuration production`)
1. Uses `environment.prod.ts`
2. `frontendUrl = 'https://your-production-domain.com'`
3. Password reset emails → `your-production-domain.com/reset-password`
4. ✅ Works perfectly!

## Important Notes

### ✅ Development Stays Unchanged
- `environment.ts` keeps `localhost:4200`
- Development builds always use `environment.ts`
- Production builds use `environment.prod.ts`
- **No conflicts!**

### ✅ Supabase Dashboard Configuration

**Site URL:**
- Can be set to production URL (recommended)
- Or development URL (for testing)
- This is the base URL for email links

**Redirect URLs:**
- **Add BOTH** development and production URLs
- Supabase accepts redirects to any URL in the list
- Use wildcard `/**` to allow all paths

### Example Supabase Dashboard Configuration

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

## Testing

### Test Development
1. Run `ng serve`
2. Request password reset
3. Email link should be: `http://localhost:4200/reset-password`
4. ✅ Works!

### Test Production
1. Run `ng build --configuration production`
2. Deploy to production
3. Request password reset from production site
4. Email link should be: `https://your-production-domain.com/reset-password`
5. ✅ Works!

## Summary

✅ **Development won't break** - Uses separate environment file  
✅ **Production uses production URL** - Automatically via environment.prod.ts  
✅ **Add both URLs to Supabase** - Redirect URLs support multiple entries  
✅ **No code changes needed** - Already configured correctly!

**Just update:**
1. `environment.prod.ts` with your production URL
2. Supabase Dashboard redirect URLs (add production URL to the list)

