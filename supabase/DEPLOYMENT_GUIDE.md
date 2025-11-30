# Deploying Administrative Schema to Supabase

This guide shows you how to link your project to Supabase and push the SQL schema.

## 🎯 Two Methods

### Method 1: Using Supabase Dashboard (Easiest - Recommended)
### Method 2: Using Supabase CLI (For advanced users)

---

## Method 1: Using Supabase Dashboard (Recommended)

### Step 1: Get Your Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign in to your account
3. Create a new project or select an existing one
4. Wait for the project to be ready (takes 1-2 minutes)

### Step 2: Get Your Project Reference ID

1. In your Supabase project dashboard
2. Go to **Settings** → **General**
3. Copy your **Project Reference ID** (looks like: `abcdefghijklmnop`)

### Step 3: Link Your Local Project

```bash
# Link to your remote Supabase project
supabase link --project-ref YOUR_PROJECT_REF_ID
```

You'll be prompted to enter your database password (found in Settings → Database).

### Step 4: Push SQL Schema via Dashboard

**Option A: Direct SQL Editor (Easiest)**

1. Open your Supabase project dashboard
2. Go to **SQL Editor** (left sidebar)
3. Click **New Query**
4. Open the file: `supabase/administrative-schema.sql`
5. Copy the entire contents
6. Paste into the SQL Editor
7. Click **Run** (or press Cmd+Enter / Ctrl+Enter)

**Option B: Using Migration Files**

1. Initialize Supabase in your project:
```bash
supabase init
```

2. Create a migration:
```bash
supabase migration new create_administrative_schema
```

3. Copy the contents of `administrative-schema.sql` into the new migration file:
```bash
# The migration file will be in: supabase/migrations/TIMESTAMP_create_administrative_schema.sql
cat supabase/administrative-schema.sql > supabase/migrations/$(date +%Y%m%d%H%M%S)_create_administrative_schema.sql
```

4. Push the migration:
```bash
supabase db push
```

---

## Method 2: Using Supabase CLI (Advanced)

### Step 1: Initialize Supabase (if not already done)

```bash
# Initialize Supabase in your project
supabase init
```

This creates a `supabase/` directory with config files.

### Step 2: Link to Your Remote Project

```bash
# Link to your Supabase project
supabase link --project-ref YOUR_PROJECT_REF_ID
```

You'll need:
- **Project Reference ID**: Found in Settings → General
- **Database Password**: Found in Settings → Database

### Step 3: Create Migration File

```bash
# Create a new migration
supabase migration new create_administrative_schema
```

This creates a file like: `supabase/migrations/20250101120000_create_administrative_schema.sql`

### Step 4: Copy SQL to Migration File

```bash
# Copy the schema SQL to the migration file
cp supabase/administrative-schema.sql supabase/migrations/$(ls -t supabase/migrations/ | head -1)
```

Or manually:
1. Open the migration file created in Step 3
2. Copy contents from `supabase/administrative-schema.sql`
3. Paste into the migration file

### Step 5: Push to Supabase

```bash
# Push migrations to remote database
supabase db push
```

This will:
- Apply all pending migrations
- Create all tables, indexes, triggers, and views
- Show you what will be applied before executing

---

## Quick Start (Fastest Method)

If you just want to get started quickly:

### 1. Copy SQL File
```bash
# View the SQL file
cat supabase/administrative-schema.sql
```

### 2. Go to Supabase Dashboard
1. Open [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **SQL Editor**

### 3. Paste and Run
1. Click **New Query**
2. Paste the entire SQL from `administrative-schema.sql`
3. Click **Run**

Done! ✅

---

## Verification

After pushing the schema, verify it worked:

### Check Tables Created

Run this in Supabase SQL Editor:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('countries', 'provinces', 'districts', 'municipalities', 'wards')
ORDER BY table_name;
```

You should see all 5 tables listed.

### Check Foreign Keys

```sql
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name;
```

### Test Insert

```sql
-- Insert Nepal
INSERT INTO countries (code, nepali_name, english_name) 
VALUES ('NP', 'नेपाल', 'Nepal')
RETURNING *;
```

---

## Troubleshooting

### Error: "Project not found"
- Make sure you're using the correct Project Reference ID
- Check that you're logged into the correct Supabase account

### Error: "Database password incorrect"
- Get the password from: Settings → Database → Database Password
- Or reset it if needed

### Error: "relation already exists"
- Tables already exist - that's fine!
- The schema uses `CREATE TABLE IF NOT EXISTS` so it's safe to run again
- If you want to start fresh, drop tables first (be careful!)

### Error: "permission denied"
- Make sure you're using the correct database password
- Check your project's database settings

### Error: "Cannot connect to Docker"
- This is for local development only
- For remote deployment, you don't need Docker
- Just use the Dashboard SQL Editor method

---

## Next Steps

After successfully deploying the schema:

1. ✅ **Insert Country**: Add Nepal to `countries` table
2. ✅ **Insert Provinces**: Add all 7 provinces
3. ✅ **Insert Districts**: Add all ~77 districts
4. ✅ **Insert Municipalities**: Add all ~753 municipalities
5. ✅ **Insert Wards**: Add wards from your extracted data
6. ✅ **Link Voters**: Connect voters table to wards

---

## Alternative: Direct SQL Execution

If CLI is giving you trouble, the **easiest method** is:

1. Open Supabase Dashboard
2. Go to SQL Editor
3. Copy/paste the SQL file
4. Click Run

That's it! No CLI needed. ✅

