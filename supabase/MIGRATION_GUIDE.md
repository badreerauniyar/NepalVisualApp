# Migration Guide: Adding Polling Centers

This guide explains how to add polling centers to your database and re-upload data.

## 📋 What Changed

### New Hierarchy:
```
Country → Province → District → Municipality → Ward → Polling Center → Voters
```

### Before:
- Voters linked directly to `ward_id`
- Polling center stored in `wards.polling_center_nepali`

### After:
- New `polling_centers` table
- Voters linked to `polling_center_id`
- Polling center is a separate entity

## 🚀 Migration Steps

### Step 1: Push the Migration

```bash
supabase db push
```

This will:
- Create `polling_centers` table
- Add `polling_center_id` column to `voters` table
- Migrate existing data (creates polling centers from ward data)
- Update constraints and views

### Step 2: Verify Migration

Run in Supabase SQL Editor:

```sql
-- Check polling centers were created
SELECT COUNT(*) FROM polling_centers;

-- Check voters linked to polling centers
SELECT COUNT(*) FROM voters WHERE polling_center_id IS NOT NULL;

-- View sample polling centers
SELECT 
    pc.id,
    pc.nepali_name,
    w.ward_number,
    m.nepali_name AS municipality
FROM polling_centers pc
JOIN wards w ON pc.ward_id = w.id
JOIN municipalities m ON w.municipality_id = m.id
LIMIT 10;
```

### Step 3: Delete Existing Voter Data (Optional)

If you want to re-import with the new structure:

```sql
-- Delete all voters (they will be re-imported)
DELETE FROM voters;

-- Or delete by specific ward/polling center
DELETE FROM voters WHERE polling_center_id IN (
    SELECT id FROM polling_centers WHERE ward_id = 1
);
```

### Step 4: Re-import Data

Run the import script again:

```bash
npm run extract-and-import src/assets/view-ward-data/view_ward.php
```

The script will now:
1. Create/find polling center
2. Link voters to `polling_center_id` (not `ward_id`)

## 📊 New Database Structure

### polling_centers Table:
```sql
- id (PRIMARY KEY)
- ward_id (FK → wards.id)
- nepali_name (VARCHAR) - "म.मा.वि. वलुवा, सितापुर"
- english_name (VARCHAR) - Optional
- address (TEXT) - Optional
- code (VARCHAR) - Optional official code
- is_active, created_at, updated_at
```

### Updated voters Table:
```sql
- polling_center_id (FK → polling_centers.id) - NEW (REQUIRED)
- ward_id (FK → wards.id) - REMOVED (access via polling_centers → wards)
```

**Structure**: `voters → polling_centers → wards`

## 🔄 Data Migration

The migration script automatically:
1. Creates polling centers from existing `wards.polling_center_nepali`
2. Links existing voters to their polling centers
3. Updates unique constraint to use `polling_center_id`

## 📁 Updated File Structure

Files are now saved as:
```
src/assets/data/
└── nepal/
    └── madhesh/
        └── saptari/
            └── kanchanrup/
                └── ward6/
                    └── polling-center-name.json
```

## ⚠️ Important Notes

1. **`ward_id` removed from voters**: Voters now ONLY link to `polling_center_id`
2. **Structure**: `voters → polling_centers → wards` (must go through polling centers)
3. **Unique constraint**: Changed from `(ward_id, serial_number)` to `(polling_center_id, serial_number)`
4. **Views updated**: `voters_with_location` now includes polling center info
5. **Functions updated**: All functions now use polling_center_id (access ward via polling center)
6. **Indexes updated**: Removed ward_id indexes, added polling_center_id indexes

## 🧪 Testing

After migration, test with:

```sql
-- Get voters by polling center
SELECT v.*, pc.nepali_name AS polling_center, w.ward_number
FROM voters v
JOIN polling_centers pc ON v.polling_center_id = pc.id
JOIN wards w ON pc.ward_id = w.id
WHERE pc.nepali_name = 'म.मा.वि. वलुवा, सितापुर';

-- Get voters by ward (must go through polling centers)
SELECT v.*, w.ward_number, pc.nepali_name AS polling_center
FROM voters v
JOIN polling_centers pc ON v.polling_center_id = pc.id
JOIN wards w ON pc.ward_id = w.id
WHERE w.id = 1;

-- Get polling center statistics
SELECT 
    pc.nepali_name,
    COUNT(v.id) AS total_voters
FROM polling_centers pc
LEFT JOIN voters v ON pc.id = v.polling_center_id
GROUP BY pc.id, pc.nepali_name;
```

## ✅ Checklist

- [ ] Push migration: `supabase db push`
- [ ] Verify polling centers created
- [ ] Verify voters linked to polling centers
- [ ] Delete old voter data (if re-importing)
- [ ] Re-run import script
- [ ] Verify new data structure

