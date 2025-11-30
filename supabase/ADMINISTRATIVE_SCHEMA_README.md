# Administrative Hierarchy Schema

Complete SQL schema for Nepal's administrative structure: Country → Province → District → Municipality → Ward

## 📋 Tables Created

1. **countries** - Country level (Nepal)
2. **provinces** - 7 provinces of Nepal
3. **districts** - ~77 districts
4. **municipalities** - ~753 municipalities (Metropolitan, Sub-Metropolitan, Municipality, Rural Municipality)
5. **wards** - ~6,000+ wards

## 🚀 Setup Instructions

### Step 1: Run the Schema

1. Open Supabase Dashboard
2. Go to **SQL Editor**
3. Copy and paste the entire contents of `administrative-schema.sql`
4. Click **Run**

### Step 2: Verify Tables

Run this query to verify all tables were created:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('countries', 'provinces', 'districts', 'municipalities', 'wards')
ORDER BY table_name;
```

### Step 3: Check Foreign Keys

Verify foreign key relationships:

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

## 📊 Table Structure

### Countries
- `id` (PRIMARY KEY)
- `code` (UNIQUE) - "NP" or "NEP"
- `nepali_name` - "नेपाल"
- `english_name` - "Nepal"
- `is_active`, `created_at`, `updated_at`

### Provinces
- `id` (PRIMARY KEY)
- `country_id` (FK → countries)
- `province_code` (UNIQUE) - "1", "2", "3"...
- `nepali_name` - "मधेश"
- `english_name` - "Madhesh"
- `center_latitude`, `center_longitude` (optional)
- `area_sq_km` (optional)
- `is_active`, `created_at`, `updated_at`

### Districts
- `id` (PRIMARY KEY)
- `province_id` (FK → provinces)
- `district_code` - Official code
- `nepali_name` - "सप्तरी"
- `english_name` - "Saptari"
- `center_latitude`, `center_longitude` (optional)
- `area_sq_km` (optional)
- `is_active`, `created_at`, `updated_at`

### Municipalities
- `id` (PRIMARY KEY)
- `district_id` (FK → districts)
- `municipality_code` - Official code
- `nepali_name` - "कञ्चनरुप नगरपालिका"
- `english_name` - "Kanchanrup Municipality"
- `type` - "Metropolitan" | "Sub-Metropolitan" | "Municipality" | "Rural Municipality"
- `center_latitude`, `center_longitude` (optional)
- `area_sq_km` (optional)
- `is_active`, `created_at`, `updated_at`

### Wards
- `id` (PRIMARY KEY)
- `municipality_id` (FK → municipalities)
- `ward_number` (INT) - 1, 2, 3...
- `nepali_name` (optional)
- `english_name` (optional)
- `house_of_representatives_constituency` (INT)
- `provincial_assembly_constituency` (INT)
- `polling_center_nepali` - "म.मा.वि. वलुवा, सितापुर"
- `polling_center_english` (optional)
- `is_active`, `created_at`, `updated_at`
- **UNIQUE**: `(municipality_id, ward_number)`

## 🔗 Foreign Key Relationships

```
countries (1)
  └── provinces (many) [country_id]
       └── districts (many) [province_id]
            └── municipalities (many) [district_id]
                 └── wards (many) [municipality_id]
```

**Cascade Behavior**: 
- Deleting a country → deletes all provinces → deletes all districts → etc.
- Use `is_active = FALSE` for soft deletes instead

## 📈 Indexes Created

All tables have indexes on:
- Foreign keys (for fast joins)
- Codes (for lookups)
- Names (Nepali and English) for search
- `is_active` (for filtering)

## 🎯 Helper Views

### 1. `administrative_hierarchy`
Complete join of all levels - useful for getting full location path

```sql
SELECT * FROM administrative_hierarchy 
WHERE province_nepali = 'मधेश';
```

### 2. `wards_with_location`
Wards with full location path in both languages

```sql
SELECT 
    ward_number,
    location_path_nepali,
    polling_center_nepali
FROM wards_with_location
WHERE district_nepali = 'सप्तरी';
```

## 💡 Usage Examples

### Insert Nepal
```sql
INSERT INTO countries (code, nepali_name, english_name) 
VALUES ('NP', 'नेपाल', 'Nepal');
```

### Insert Province
```sql
INSERT INTO provinces (country_id, province_code, nepali_name, english_name)
VALUES (1, '2', 'मधेश', 'Madhesh');
```

### Insert District
```sql
INSERT INTO districts (province_id, nepali_name, english_name)
VALUES (1, 'सप्तरी', 'Saptari');
```

### Insert Municipality
```sql
INSERT INTO municipalities (district_id, nepali_name, english_name, type)
VALUES (1, 'कञ्चनरुप नगरपालिका', 'Kanchanrup Municipality', 'Municipality');
```

### Insert Ward
```sql
INSERT INTO wards (
    municipality_id,
    ward_number,
    house_of_representatives_constituency,
    provincial_assembly_constituency,
    polling_center_nepali
)
VALUES (
    1,
    6,
    1,
    1,
    'म.मा.वि. वलुवा, सितापुर'
);
```

### Query: Get all wards in a province
```sql
SELECT 
    w.ward_number,
    w.polling_center_nepali,
    m.nepali_name AS municipality,
    d.nepali_name AS district
FROM wards w
JOIN municipalities m ON w.municipality_id = m.id
JOIN districts d ON m.district_id = d.id
JOIN provinces p ON d.province_id = p.id
WHERE p.nepali_name = 'मधेश'
ORDER BY d.nepali_name, m.nepali_name, w.ward_number;
```

### Query: Get full location path for a ward
```sql
SELECT 
    location_path_nepali,
    location_path_english,
    polling_center_nepali
FROM wards_with_location
WHERE ward_number = 6
  AND municipality_nepali = 'कञ्चनरुप नगरपालिका';
```

## 🔒 Constraints

1. **Unique Constraints**:
   - `countries.code` - One code per country
   - `provinces.province_code` - One code per province
   - `wards(municipality_id, ward_number)` - One ward number per municipality

2. **Check Constraints**:
   - `municipalities.type` - Must be one of: Metropolitan, Sub-Metropolitan, Municipality, Rural Municipality
   - `wards.ward_number` - Must be positive (> 0)

3. **Foreign Keys**:
   - All relationships enforced with CASCADE delete

## 📝 Notes

- **Geographic data** (coordinates, area) is optional - can be added later
- **Soft deletes** - Use `is_active = FALSE` instead of deleting records
- **Timestamps** - Automatically updated via triggers
- **Bilingual support** - All names stored in both Nepali and English
- **Views** - Pre-built views for common queries

## 🔄 Next Steps

1. ✅ Run the schema to create tables
2. ✅ Populate countries table (Nepal)
3. ✅ Populate provinces table (7 provinces)
4. ✅ Populate districts table (~77 districts)
5. ✅ Populate municipalities table (~753 municipalities)
6. ✅ Populate wards table (from your extracted data)
7. ✅ Link voters table to wards (via `ward_id`)

## 🛠️ Troubleshooting

### Error: "relation already exists"
- Tables already created - that's fine, the script uses `CREATE TABLE IF NOT EXISTS`

### Error: "foreign key constraint violation"
- Make sure parent records exist before inserting children
- Insert in order: countries → provinces → districts → municipalities → wards

### Error: "unique constraint violation"
- Check for duplicate codes or ward numbers
- Use `ON CONFLICT DO NOTHING` or `ON CONFLICT DO UPDATE` in your inserts

