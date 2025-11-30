#!/usr/bin/env node

/**
 * Import Ward Data to Supabase (Complete)
 * 
 * This script:
 * 1. Creates/finds administrative hierarchy (country → province → district → municipality → ward)
 * 2. Imports voter records linked to the ward
 * 
 * Prerequisites:
 * 1. Install Supabase client: npm install @supabase/supabase-js
 * 2. Set environment variables:
 *    - SUPABASE_URL=your-project-url
 *    - SUPABASE_ANON_KEY=your-anon-key
 * 
 * Usage:
 *   node scripts/import-ward-to-supabase.js [json-file]
 * 
 * Example:
 *   node scripts/import-ward-to-supabase.js src/assets/data/ward-data.json
 */

const fs = require('fs');
const path = require('path');

// Check if Supabase is installed
let supabase;
try {
  const { createClient } = require('@supabase/supabase-js');
  
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Error: SUPABASE_URL and SUPABASE_ANON_KEY environment variables are required');
    console.log('\nSet them in your .env file or export them:');
    console.log('  export SUPABASE_URL="https://your-project.supabase.co"');
    console.log('  export SUPABASE_ANON_KEY="your-anon-key"');
    process.exit(1);
  }
  
  supabase = createClient(supabaseUrl, supabaseKey);
} catch (error) {
  console.error('❌ Error: @supabase/supabase-js is not installed');
  console.log('\nInstall it with: npm install @supabase/supabase-js');
  process.exit(1);
}

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// ============================================
// HARDCODED MAPPINGS
// ============================================

// Province codes (Nepal has 7 provinces)
const PROVINCE_CODES = {
  'कोशी': '1',
  'मधेश': '2',
  'बागमती': '3',
  'गण्डकी': '4',
  'लुम्बिनी': '5',
  'कर्णाली': '6',
  'सुदूरपश्चिम': '7'
};

// Municipality type mapping (Nepali → English)
const MUNICIPALITY_TYPE_MAP = {
  'नगरपालिका': 'Municipality',
  'गाउँपालिका': 'Rural Municipality',
  'महानगरपालिका': 'Metropolitan',
  'उपमहानगरपालिका': 'Sub-Metropolitan'
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Simple transliteration for English names
 * This is a basic implementation - can be improved later
 */
function transliterateToEnglish(nepaliText) {
  // Basic transliteration mapping (very simple)
  // For production, consider using a proper transliteration library
  const transliterationMap = {
    'मधेश': 'Madhesh',
    'सप्तरी': 'Saptari',
    'कञ्चनरुप': 'Kanchanrup',
    'नेपाल': 'Nepal'
  };
  
  // Check if we have a direct mapping
  if (transliterationMap[nepaliText]) {
    return transliterationMap[nepaliText];
  }
  
  // For now, return a simple version (can be enhanced)
  // Remove common suffixes and return as-is for now
  return nepaliText
    .replace(/ नगरपालिका$/, ' Municipality')
    .replace(/ गाउँपालिका$/, ' Rural Municipality')
    .replace(/ महानगरपालिका$/, ' Metropolitan')
    .replace(/ उपमहानगरपालिका$/, ' Sub-Metropolitan');
}

/**
 * Get or create country
 */
async function getOrCreateCountry(nepaliName) {
  const englishName = transliterateToEnglish(nepaliName);
  
  // Try to find existing
  const { data: existing, error: findError } = await supabase
    .from('countries')
    .select('id')
    .eq('nepali_name', nepaliName)
    .single();
  
  if (existing) {
    log(`  ✓ Found existing country: ${nepaliName}`, 'green');
    return existing.id;
  }
  
  if (findError && findError.code !== 'PGRST116') { // PGRST116 = not found
    throw new Error(`Error finding country: ${findError.message}`);
  }
  
  // Create new country
  const { data: created, error: createError } = await supabase
    .from('countries')
    .insert({
      code: 'NP',
      nepali_name: nepaliName,
      english_name: englishName
    })
    .select('id')
    .single();
  
  if (createError) {
    throw new Error(`Error creating country: ${createError.message}`);
  }
  
  log(`  ✓ Created country: ${nepaliName}`, 'green');
  return created.id;
}

/**
 * Get or create province
 */
async function getOrCreateProvince(countryId, nepaliName) {
  const englishName = transliterateToEnglish(nepaliName);
  const provinceCode = PROVINCE_CODES[nepaliName];
  
  if (!provinceCode) {
    throw new Error(`Unknown province: ${nepaliName}. Please add to PROVINCE_CODES mapping.`);
  }
  
  // Try to find existing
  const { data: existing, error: findError } = await supabase
    .from('provinces')
    .select('id')
    .eq('country_id', countryId)
    .eq('nepali_name', nepaliName)
    .single();
  
  if (existing) {
    log(`  ✓ Found existing province: ${nepaliName}`, 'green');
    return existing.id;
  }
  
  if (findError && findError.code !== 'PGRST116') {
    throw new Error(`Error finding province: ${findError.message}`);
  }
  
  // Create new province
  const { data: created, error: createError } = await supabase
    .from('provinces')
    .insert({
      country_id: countryId,
      province_code: provinceCode,
      nepali_name: nepaliName,
      english_name: englishName
    })
    .select('id')
    .single();
  
  if (createError) {
    throw new Error(`Error creating province: ${createError.message}`);
  }
  
  log(`  ✓ Created province: ${nepaliName} (code: ${provinceCode})`, 'green');
  return created.id;
}

/**
 * Get or create district
 */
async function getOrCreateDistrict(provinceId, nepaliName) {
  const englishName = transliterateToEnglish(nepaliName);
  
  // Try to find existing
  const { data: existing, error: findError } = await supabase
    .from('districts')
    .select('id')
    .eq('province_id', provinceId)
    .eq('nepali_name', nepaliName)
    .single();
  
  if (existing) {
    log(`  ✓ Found existing district: ${nepaliName}`, 'green');
    return existing.id;
  }
  
  if (findError && findError.code !== 'PGRST116') {
    throw new Error(`Error finding district: ${findError.message}`);
  }
  
  // Create new district
  const { data: created, error: createError } = await supabase
    .from('districts')
    .insert({
      province_id: provinceId,
      nepali_name: nepaliName,
      english_name: englishName
    })
    .select('id')
    .single();
  
  if (createError) {
    throw new Error(`Error creating district: ${createError.message}`);
  }
  
  log(`  ✓ Created district: ${nepaliName}`, 'green');
  return created.id;
}

/**
 * Get or create municipality
 */
async function getOrCreateMunicipality(districtId, nepaliName, municipalityTypeNepali) {
  const englishName = transliterateToEnglish(nepaliName);
  const type = MUNICIPALITY_TYPE_MAP[municipalityTypeNepali];
  
  if (!type) {
    throw new Error(`Unknown municipality type: ${municipalityTypeNepali}`);
  }
  
  // Try to find existing
  const { data: existing, error: findError } = await supabase
    .from('municipalities')
    .select('id')
    .eq('district_id', districtId)
    .eq('nepali_name', nepaliName)
    .single();
  
  if (existing) {
    log(`  ✓ Found existing municipality: ${nepaliName}`, 'green');
    return existing.id;
  }
  
  if (findError && findError.code !== 'PGRST116') {
    throw new Error(`Error finding municipality: ${findError.message}`);
  }
  
  // Create new municipality
  const { data: created, error: createError } = await supabase
    .from('municipalities')
    .insert({
      district_id: districtId,
      nepali_name: nepaliName,
      english_name: englishName,
      type: type
    })
    .select('id')
    .single();
  
  if (createError) {
    throw new Error(`Error creating municipality: ${createError.message}`);
  }
  
  log(`  ✓ Created municipality: ${nepaliName} (${type})`, 'green');
  return created.id;
}

/**
 * Get or create ward
 */
async function getOrCreateWard(municipalityId, wardNumber, metadata) {
  const wardNum = parseInt(wardNumber);
  
  // Try to find existing
  const { data: existing, error: findError } = await supabase
    .from('wards')
    .select('id')
    .eq('municipality_id', municipalityId)
    .eq('ward_number', wardNum)
    .single();
  
  if (existing) {
    log(`  ✓ Found existing ward: ${wardNum}`, 'green');
    return existing.id;
  }
  
  if (findError && findError.code !== 'PGRST116') {
    throw new Error(`Error finding ward: ${findError.message}`);
  }
  
  // Create new ward
  const { data: created, error: createError } = await supabase
    .from('wards')
    .insert({
      municipality_id: municipalityId,
      ward_number: wardNum,
      house_of_representatives_constituency: metadata.house_of_representatives_constituency 
        ? parseInt(metadata.house_of_representatives_constituency) 
        : null,
      provincial_assembly_constituency: metadata.provincial_assembly_constituency 
        ? parseInt(metadata.provincial_assembly_constituency) 
        : null,
      polling_center_nepali: metadata.polling_center || null
    })
    .select('id')
    .single();
  
  if (createError) {
    throw new Error(`Error creating ward: ${createError.message}`);
  }
  
  log(`  ✓ Created ward: ${wardNum}`, 'green');
  return created.id;
}

/**
 * Import voters
 */
async function importVoters(wardId, votersData) {
  log(`\n👥 Step 6: Importing ${votersData.length} voter records...`, 'cyan');
  
  const batchSize = 100;
  const totalBatches = Math.ceil(votersData.length / batchSize);
  let insertedCount = 0;
  let skippedCount = 0;
  
  for (let i = 0; i < votersData.length; i += batchSize) {
    const batch = votersData.slice(i, i + batchSize);
    const batchNumber = Math.floor(i / batchSize) + 1;
    
    // Transform data for Supabase
    const voters = batch.map(record => {
      // Handle both Nepali and English keys
      const voterNumber = record.voter_number || record['मतदाता नं'] || record.voter_id;
      const serialNumber = record.serial_number || record['सि.नं.'];
      const fullName = record.voter_name || record['मतदाताको नाम'];
      const age = record.age || record['उमेर(वर्ष)'];
      const gender = record.gender || record['लिङ्ग'];
      const spouseName = record.spouse_name || record['पति/पत्नीको नाम'];
      const fatherMotherName = record.father_mother_name || record['पिता/माताको नाम'];
      
      return {
        ward_id: wardId,
        voter_id: voterNumber,
        serial_number: serialNumber ? parseInt(serialNumber) : null,
        full_name: fullName,
        age: age ? parseInt(age) : null,
        gender: gender || null,
        spouse_name: (spouseName && spouseName !== '-') ? spouseName : null,
        father_mother_name: fatherMotherName || null
      };
    });
    
    const { data: inserted, error } = await supabase
      .from('voters')
      .insert(voters)
      .select('id');
    
    if (error) {
      // Handle duplicate key errors gracefully
      if (error.code === '23505') { // Unique constraint violation
        log(`  ⚠ Batch ${batchNumber}/${totalBatches}: Some records already exist (skipping duplicates)`, 'yellow');
        skippedCount += batch.length;
      } else {
        throw new Error(`Failed to insert batch ${batchNumber}: ${error.message}`);
      }
    } else {
      insertedCount += inserted.length;
      log(`  ✓ Batch ${batchNumber}/${totalBatches}: Inserted ${inserted.length} records`, 'green');
    }
    
    // Progress indicator
    process.stdout.write(`\r  Progress: ${Math.min(i + batchSize, votersData.length)}/${votersData.length} records`);
  }
  
  log('\n', 'reset');
  return { insertedCount, skippedCount };
}

/**
 * Main import function
 */
async function importToSupabase(jsonFile) {
  try {
    log('\n=== Supabase Ward Data Import ===\n', 'blue');
    
    // Read JSON file
    log(`Reading JSON file: ${jsonFile}`, 'cyan');
    const fileContent = fs.readFileSync(jsonFile, 'utf8');
    const data = JSON.parse(fileContent);
    
    log(`✓ Loaded ${data.data.length} voter records`, 'green');
    log(`  Location: ${data.metadata.province}, ${data.metadata.district}, Ward ${data.metadata.ward}`, 'cyan');
    
    // Step 1: Get or create country
    log('\n📋 Step 1: Processing country...', 'cyan');
    const countryId = await getOrCreateCountry(data.metadata.country || 'नेपाल');
    
    // Step 2: Get or create province
    log('\n📋 Step 2: Processing province...', 'cyan');
    const provinceId = await getOrCreateProvince(countryId, data.metadata.province);
    
    // Step 3: Get or create district
    log('\n📋 Step 3: Processing district...', 'cyan');
    const districtId = await getOrCreateDistrict(provinceId, data.metadata.district);
    
    // Step 4: Get or create municipality
    log('\n📋 Step 4: Processing municipality...', 'cyan');
    const municipalityId = await getOrCreateMunicipality(
      districtId,
      data.metadata.municipality,
      data.metadata.municipality_type
    );
    
    // Step 5: Get or create ward
    log('\n📋 Step 5: Processing ward...', 'cyan');
    const wardId = await getOrCreateWard(
      municipalityId,
      data.metadata.ward_number || data.metadata.ward,
      data.metadata
    );
    
    // Step 6: Import voters
    const { insertedCount, skippedCount } = await importVoters(wardId, data.data);
    
    // Summary
    log('\n✅ Import completed!', 'green');
    log(`  Total records: ${data.data.length}`, 'cyan');
    log(`  Successfully inserted: ${insertedCount}`, 'green');
    if (skippedCount > 0) {
      log(`  Skipped (duplicates): ${skippedCount}`, 'yellow');
    }
    
    // Verify
    log('\n🔍 Verifying import...', 'cyan');
    const { count, error: countError } = await supabase
      .from('voters')
      .select('*', { count: 'exact', head: true })
      .eq('ward_id', wardId);
    
    if (countError) {
      log(`  ⚠ Could not verify count: ${countError.message}`, 'yellow');
    } else {
      log(`  ✓ Found ${count} voters in database for this ward`, 'green');
    }
    
  } catch (error) {
    log(`\n❌ Error: ${error.message}`, 'red');
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    log('Usage: node scripts/import-ward-to-supabase.js [json-file]', 'yellow');
    log('', 'reset');
    log('Examples:', 'cyan');
    log('  node scripts/import-ward-to-supabase.js src/assets/data/ward-data.json', 'reset');
    log('', 'reset');
    log('Environment variables required:', 'yellow');
    log('  SUPABASE_URL=your-project-url', 'reset');
    log('  SUPABASE_ANON_KEY=your-anon-key', 'reset');
    process.exit(1);
  }
  
  const jsonFile = args[0];
  
  if (!fs.existsSync(jsonFile)) {
    log(`❌ Error: File not found: ${jsonFile}`, 'red');
    process.exit(1);
  }
  
  importToSupabase(jsonFile);
}

// Run the script
main();

