# Quick Start: Supabase Setup for Voter Data

## 🎯 Answer: Store Nepali Text Directly

**Yes, store Nepali text directly in the database!** Here's why:

### ✅ Store Nepali (Recommended)
- PostgreSQL/Supabase natively supports UTF-8 → Nepali works perfectly
- Original data is authoritative → No translation errors
- Fast queries → No API delays
- Free → No translation API costs
- Better search → PostgreSQL full-text search works with Nepali

### ❌ Live Translation (Not Recommended)
- Translation APIs often mistranslate proper nouns (names, places)
- Costs money per request
- Adds latency to every query
- Can break if API is down
- Original meaning can be lost

## 📋 Required Fields in Supabase

### Table 1: `ward_metadata`
```
- id (UUID, Primary Key)
- province (TEXT) - Nepali: "मधेश"
- district (TEXT) - Nepali: "सप्तरी"
- ward_number (TEXT) - "6"
- house_of_representatives_constituency (TEXT) - "1"
- provincial_assembly_constituency (TEXT) - "1"
- polling_center (TEXT) - Nepali: "म.मा.वि. वलुवा, सितापुर"
- source_file (TEXT)
- extracted_at (TIMESTAMPTZ)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
```

### Table 2: `voters`
```
- id (UUID, Primary Key)
- ward_metadata_id (UUID, Foreign Key → ward_metadata.id)
- voter_number (TEXT) - Unique: "30176212"
- serial_number (INTEGER) - "1"
- voter_name (TEXT) - Nepali: "अकबर मोहमद"
- age (INTEGER) - 30
- gender (TEXT) - Nepali: "पुरुष" or "महिला"
- spouse_name (TEXT) - Nepali: "रुवीना"
- father_mother_name (TEXT) - Nepali: "सहिद मियाँ/ हदिशा"
- voter_details (TEXT)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
```

**Note**: English fields are optional - add them later if needed!

## 🚀 Setup Steps

### 1. Install Supabase Client
```bash
npm install @supabase/supabase-js
```

### 2. Create Tables
1. Go to Supabase Dashboard → SQL Editor
2. Copy/paste `supabase/schema.sql`
3. Click "Run"

### 3. Set Environment Variables
Create `.env` file:
```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
```

Update `src/environments/environment.ts`:
```typescript
export const environment = {
  // ... existing config
  supabaseUrl: 'YOUR_SUPABASE_URL_HERE',
  supabaseKey: 'YOUR_SUPABASE_ANON_KEY_HERE'
};
```

### 4. Import Your Data
```bash
npm run import-supabase src/assets/data/ward-data.json
```

## 💡 Usage Examples

### In Angular Component:
```typescript
import { SupabaseService } from './services/supabase.service';

constructor(private supabaseService: SupabaseService) {}

// Search voters by name (Nepali text works!)
async searchVoters() {
  const results = await this.supabaseService.searchVoters('अकबर');
  console.log(results);
}

// Get voters by ward
async getWardVoters() {
  const voters = await this.supabaseService.getVotersByWard(
    'मधेश',
    'सप्तरी',
    '6'
  );
  console.log(voters);
}
```

### Direct SQL Query:
```sql
-- Search by Nepali name
SELECT * FROM voters 
WHERE voter_name ILIKE '%अकबर%';

-- Get ward statistics
SELECT 
  COUNT(*) as total_voters,
  gender,
  AVG(age) as avg_age
FROM voters v
JOIN ward_metadata wm ON v.ward_metadata_id = wm.id
WHERE wm.province = 'मधेश'
GROUP BY gender;
```

## 📝 Summary

1. ✅ **Store Nepali text directly** - PostgreSQL handles it perfectly
2. ✅ **English fields are optional** - add later if needed
3. ✅ **Use full-text search** - works with Nepali text
4. ✅ **No translation needed** - original data is best

Your database will store:
- `voter_name`: "अकबर मोहमद" (Nepali - original)
- `province`: "मधेश" (Nepali - original)
- `gender`: "पुरुष" (Nepali - original)

And you can search/filter by these Nepali fields directly!

