#!/usr/bin/env node

/**
 * Import Ward Data to Supabase
 * 
 * This script reads the extracted JSON file and imports it into Supabase.
 * 
 * Prerequisites:
 * 1. Install Supabase client: npm install @supabase/supabase-js
 * 2. Set environment variables:
 *    - SUPABASE_URL=your-project-url
 *    - SUPABASE_ANON_KEY=your-anon-key
 * 
 * Usage:
 *   node scripts/import-to-supabase.js [json-file]
 * 
 * Example:
 *   node scripts/import-to-supabase.js src/assets/data/ward-data.json
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

/**
 * Import data to Supabase
 */
async function importToSupabase(jsonFile) {
  try {
    log('\n=== Supabase Import Tool ===\n', 'blue');
    
    // Read JSON file
    log(`Reading JSON file: ${jsonFile}`, 'cyan');
    const fileContent = fs.readFileSync(jsonFile, 'utf8');
    const data = JSON.parse(fileContent);
    
    log(`✓ Loaded ${data.data.length} voter records`, 'green');
    log(`  Metadata: ${data.metadata.province}, ${data.metadata.district}, Ward ${data.metadata.ward}`, 'cyan');
    
    // Step 1: Insert or get ward metadata
    log('\n📋 Step 1: Inserting ward metadata...', 'cyan');
    const metadata = {
      province: data.metadata.province,
      district: data.metadata.district,
      ward_number: data.metadata.ward,
      house_of_representatives_constituency: data.metadata.house_of_representatives_constituency || null,
      provincial_assembly_constituency: data.metadata.provincial_assembly_constituency || null,
      polling_center: data.metadata.polling_center || null,
      source_file: data.metadata.source_file || null,
      extracted_at: data.metadata.extracted_at || new Date().toISOString()
    };
    
    // Check if ward metadata already exists
    const { data: existingWard, error: checkError } = await supabase
      .from('ward_metadata')
      .select('id')
      .eq('province', metadata.province)
      .eq('district', metadata.district)
      .eq('ward_number', metadata.ward_number)
      .eq('polling_center', metadata.polling_center)
      .single();
    
    let wardMetadataId;
    
    if (existingWard) {
      log('  ✓ Ward metadata already exists, using existing record', 'yellow');
      wardMetadataId = existingWard.id;
    } else {
      const { data: insertedWard, error: insertError } = await supabase
        .from('ward_metadata')
        .insert(metadata)
        .select('id')
        .single();
      
      if (insertError) {
        throw new Error(`Failed to insert ward metadata: ${insertError.message}`);
      }
      
      wardMetadataId = insertedWard.id;
      log('  ✓ Ward metadata inserted successfully', 'green');
    }
    
    // Step 2: Insert voters in batches
    log('\n👥 Step 2: Inserting voter records...', 'cyan');
    const batchSize = 100; // Insert 100 records at a time
    const totalBatches = Math.ceil(data.data.length / batchSize);
    let insertedCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < data.data.length; i += batchSize) {
      const batch = data.data.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      
      // Transform data for Supabase
      const voters = batch.map(record => ({
        ward_metadata_id: wardMetadataId,
        voter_number: record.voter_number || record['मतदाता नं'],
        serial_number: parseInt(record.serial_number || record['सि.नं.'] || 0),
        voter_name: record.voter_name || record['मतदाताको नाम'],
        age: parseInt(record.age || record['उमेर(वर्ष)'] || 0),
        gender: record.gender || record['लिङ्ग'],
        spouse_name: record.spouse_name || record['पति/पत्नीको नाम'] || null,
        father_mother_name: record.father_mother_name || record['पिता/माताको नाम'] || null,
        voter_details: record.voter_details || record['मतदाता विवरण'] || null
      }));
      
      const { data: inserted, error } = await supabase
        .from('voters')
        .insert(voters)
        .select('id');
      
      if (error) {
        // Handle duplicate key errors gracefully
        if (error.code === '23505') { // Unique constraint violation
          log(`  ⚠ Batch ${batchNumber}/${totalBatches}: Some records already exist (skipping duplicates)`, 'yellow');
          errorCount += batch.length;
        } else {
          throw new Error(`Failed to insert batch ${batchNumber}: ${error.message}`);
        }
      } else {
        insertedCount += inserted.length;
        log(`  ✓ Batch ${batchNumber}/${totalBatches}: Inserted ${inserted.length} records`, 'green');
      }
      
      // Progress indicator
      process.stdout.write(`\r  Progress: ${Math.min(i + batchSize, data.data.length)}/${data.data.length} records`);
    }
    
    log('\n', 'reset');
    log('\n✅ Import completed!', 'green');
    log(`  Total records: ${data.data.length}`, 'cyan');
    log(`  Successfully inserted: ${insertedCount}`, 'green');
    if (errorCount > 0) {
      log(`  Skipped (duplicates): ${errorCount}`, 'yellow');
    }
    
    // Step 3: Verify import
    log('\n🔍 Step 3: Verifying import...', 'cyan');
    const { count, error: countError } = await supabase
      .from('voters')
      .select('*', { count: 'exact', head: true })
      .eq('ward_metadata_id', wardMetadataId);
    
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
    log('Usage: node scripts/import-to-supabase.js [json-file]', 'yellow');
    log('', 'reset');
    log('Examples:', 'cyan');
    log('  node scripts/import-to-supabase.js src/assets/data/ward-data.json', 'reset');
    log('', 'reset');
    log('Environment variables required:', 'yellow');
    log('  SUPABASE_URL=your-project-url', 'reset');
    log('  SUPABASE_ANON_KEY=your-anon-key', 'reset');
    log('', 'reset');
    log('Or create a .env file with:', 'cyan');
    log('  SUPABASE_URL=https://xxxxx.supabase.co', 'reset');
    log('  SUPABASE_ANON_KEY=eyJhbGc...', 'reset');
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

