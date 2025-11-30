# Supabase Setup Guide for Nepal Voter Data

## 🎯 Why Store Nepali Text Directly?

### ✅ **Store Nepali in Database (Recommended)**

**Advantages:**
1. **Authoritative Source**: Original data is always correct - no translation errors
2. **No API Costs**: No translation API fees
3. **Fast Performance**: No network delays for translation
4. **Better Search**: PostgreSQL full-text search works with Nepali text
5. **Data Integrity**: Names, places, and proper nouns are preserved exactly
6. **Future-Proof**: You can always add English translations later if needed

**PostgreSQL/Supabase natively supports UTF-8**, so Nepali (Devanagari script) works perfectly!

### ❌ **Live Translation (Not Recommended)**

**Disadvantages:**
1. **Translation Errors**: APIs often mistranslate proper nouns (names, places)
2. **Cost**: Translation APIs charge per request
3. **Latency**: Every request needs API call
4. **Unreliable**: API downtime = broken app
5. **Data Loss**: Original meaning can be lost in translation

## 📋 Database Schema

### Tables Created:

1. **`ward_metadata`** - Stores ward information (province, district, polling center, etc.)
2. **`voters`** - Stores individual voter records

### Key Design Decisions:

- **Nepali text stored directly** in primary fields (e.g., `voter_name`, `province`)
- **English fields are optional** - add them later if needed for search/display
- **Full-text search indexes** for fast Nepali text searching
- **Foreign key relationships** maintain data integrity

## 🚀 Setup Instructions

### Step 1: Create Tables in Supabase

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `supabase/schema.sql`
4. Click **Run** to create the tables

### Step 2: Install Dependencies

```bash
npm install @supabase/supabase-js
```

### Step 3: Set Environment Variables

Create a `.env` file in your project root:

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
```

Get these values from:
- Supabase Dashboard → Settings → API

### Step 4: Import Data

```bash
# Import your extracted JSON data
node scripts/import-to-supabase.js src/assets/data/ward-data.json
```

## 📊 Field Mapping

### Ward Metadata Fields:

| JSON Field | Database Column | Type | Notes |
|------------|----------------|------|-------|
| `metadata.province` | `province` | TEXT | Nepali text stored directly |
| `metadata.district` | `district` | TEXT | Nepali text stored directly |
| `metadata.ward` | `ward_number` | TEXT | Ward number |
| `metadata.house_of_representatives_constituency` | `house_of_representatives_constituency` | TEXT | Constituency number |
| `metadata.provincial_assembly_constituency` | `provincial_assembly_constituency` | TEXT | Constituency number |
| `metadata.polling_center` | `polling_center` | TEXT | Nepali text stored directly |

### Voter Fields:

| JSON Field | Database Column | Type | Notes |
|------------|----------------|------|-------|
| `voter_number` | `voter_number` | TEXT | Unique voter ID |
| `serial_number` | `serial_number` | INTEGER | Serial in ward list |
| `voter_name` | `voter_name` | TEXT | Nepali name stored directly |
| `age` | `age` | INTEGER | Age in years |
| `gender` | `gender` | TEXT | Nepali: "पुरुष" or "महिला" |
| `spouse_name` | `spouse_name` | TEXT | Nepali text |
| `father_mother_name` | `father_mother_name` | TEXT | Nepali text |

## 🔍 Querying Nepali Text

### Example Queries:

```sql
-- Search voters by name (Nepali text)
SELECT * FROM voters 
WHERE voter_name ILIKE '%अकबर%';

-- Get all voters in a specific ward
SELECT v.*, wm.province, wm.district, wm.ward_number
FROM voters v
JOIN ward_metadata wm ON v.ward_metadata_id = wm.id
WHERE wm.province = 'मधेश' 
  AND wm.district = 'सप्तरी'
  AND wm.ward_number = '6';

-- Use the helper function
SELECT * FROM search_voters_by_name('अकबर');
```

## 🌐 Adding English Translations Later (Optional)

If you need English translations in the future:

1. **Add English columns** to existing tables:
```sql
ALTER TABLE voters ADD COLUMN voter_name_english TEXT;
ALTER TABLE ward_metadata ADD COLUMN province_english TEXT;
```

2. **Populate them** using:
   - Manual translation
   - Translation API (one-time import)
   - User contributions

3. **Use for search/display** while keeping Nepali as primary source

## 🔐 Row Level Security (RLS)

If you want to control access to voter data:

1. Enable RLS in the schema
2. Create policies based on your requirements
3. Example: Only authenticated users can view data

## 📈 Performance Tips

1. **Indexes are already created** for common queries
2. **Batch inserts** are handled automatically by the import script
3. **Full-text search** works with Nepali text using PostgreSQL's built-in support
4. **Consider partitioning** if you have millions of records (by province/district)

## 🛠️ Troubleshooting

### Issue: "relation does not exist"
- Make sure you ran the `schema.sql` file in Supabase SQL Editor

### Issue: "duplicate key value violates unique constraint"
- The import script handles this gracefully - it skips duplicates

### Issue: "permission denied"
- Check your RLS policies if enabled
- Verify your `SUPABASE_ANON_KEY` has the right permissions

## 📝 Next Steps

1. ✅ Create tables using `schema.sql`
2. ✅ Import your data using `import-to-supabase.js`
3. ✅ Test queries in Supabase SQL Editor
4. ✅ Integrate Supabase client in your Angular app
5. ⏭️ Add English translations later if needed

