#!/usr/bin/env node

/**
 * Extract Ward Data and Import to Supabase (All-in-One)
 * 
 * This script:
 * 1. Extracts voter data from PHP/HTML file
 * 2. Generates filename: provinceName-district-municipality-wardNo.json
 * 3. Saves extracted data to JSON file
 * 4. Imports administrative hierarchy to Supabase
 * 5. Imports voter records to Supabase
 * 
 * Prerequisites:
 * 1. Install Supabase client: npm install @supabase/supabase-js
 * 2. Set environment variables:
 *    - SUPABASE_URL=your-project-url
 *    - SUPABASE_ANON_KEY=your-anon-key
 * 
 * Usage:
 *   node scripts/extract-and-import-ward.js [php-file]
 * 
 * Example:
 *   node scripts/extract-and-import-ward.js src/assets/view-ward-data/view_ward.php
 */

const fs = require('fs');
const path = require('path');

// Import extraction functions (we'll inline them or require)
// For now, we'll combine both scripts

// Check if Supabase is installed
let supabase;
try {
  const { createClient } = require('@supabase/supabase-js');
  
  // Try to get from environment variables first
  let supabaseUrl = process.env.SUPABASE_URL;
  let supabaseKey = process.env.SUPABASE_ANON_KEY;
  
  // If not in env, try to read from environment.ts file (flattened structure)
  if (!supabaseUrl || !supabaseKey) {
    try {
      const envPath = path.join(process.cwd(), 'src', 'environments', 'environment.ts');
      if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        // Match flattened structure: supabaseUrl: '...' and supabaseKey: '...'
        const urlMatch = envContent.match(/supabaseUrl:\s*['"]([^'"]+)['"]/);
        const keyMatch = envContent.match(/supabaseKey:\s*['"]([^'"]+)['"]/);
        
        if (urlMatch) supabaseUrl = urlMatch[1];
        if (keyMatch) supabaseKey = keyMatch[1];
        
        if (supabaseUrl && supabaseKey) {
          log('✓ Found Supabase credentials in environment.ts', 'green');
        }
      }
    } catch (e) {
      // Ignore errors reading environment.ts
    }
  }
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Error: SUPABASE_URL and SUPABASE_ANON_KEY are required');
    console.log('\nOptions:');
    console.log('  1. Set environment variables:');
    console.log('     export SUPABASE_URL="https://your-project.supabase.co"');
    console.log('     export SUPABASE_ANON_KEY="your-anon-key"');
    console.log('  2. Or ensure they are in src/environments/environment.ts');
    process.exit(1);
  }
  
  supabase = createClient(supabaseUrl, supabaseKey);
} catch (error) {
  if (error.message.includes('@supabase/supabase-js')) {
    console.error('❌ Error: @supabase/supabase-js is not installed');
    console.log('\nInstall it with: npm install @supabase/supabase-js');
  } else {
    console.error(`❌ Error: ${error.message}`);
  }
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
// EXTRACTION FUNCTIONS (from extract-ward-data.js)
// ============================================

function cleanText(text) {
  return text
    .replace(/<[^>]+>/g, '') // Remove HTML tags
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

function mapHeaderToEnglish(nepaliHeader) {
  const mapping = {
    'सि.नं.': 'serial_number',
    'मतदाता नं': 'voter_number',
    'मतदाताको नाम': 'voter_name',
    'उमेर(वर्ष)': 'age',
    'लिङ्ग': 'gender',
    'पति/पत्नीको नाम': 'spouse_name',
    'पिता/माताको नाम': 'father_mother_name',
    'मतदाता विवरण': 'voter_details'
  };
  
  return mapping[nepaliHeader] || nepaliHeader.toLowerCase().replace(/\s+/g, '_');
}

function extractMetadata(html) {
  const metadata = {};
  
  // Extract country
  const countryMatch = html.match(/<span[^>]*>([^<]*नेपाल[^<]*)<\/span>/i);
  if (countryMatch) {
    metadata.country = cleanText(countryMatch[1]);
  } else {
    metadata.country = 'नेपाल';
  }
  
  // Extract province
  const provinceMatch = html.match(/<span[^>]*>([^<]+)<\/span>[^<]*प्रदेश/i);
  if (provinceMatch) {
    metadata.province = cleanText(provinceMatch[1]);
  }
  
  // Extract district
  const districtMatch = html.match(/<span[^>]*>([^<]+)<\/span>[^<]*जिल्ला/i);
  if (districtMatch) {
    metadata.district = cleanText(districtMatch[1]);
  }
  
  // Extract municipality
  const municipalityWithTypeMatch = html.match(/<span[^>]*>([^<]*(?:नगरपालिका|गाउँपालिका)[^<]*)<\/span>/i);
  if (municipalityWithTypeMatch) {
    const fullText = cleanText(municipalityWithTypeMatch[1]);
    metadata.municipality = fullText;
    
    if (fullText.includes('नगरपालिका')) {
      metadata.municipality_type = 'नगरपालिका';
      metadata.municipality_name = fullText.replace(/नगरपालिका/g, '').trim();
    } else if (fullText.includes('गाउँपालिका')) {
      metadata.municipality_type = 'गाउँपालिका';
      metadata.municipality_name = fullText.replace(/गाउँपालिका/g, '').trim();
    }
  }
  
  // Extract ward number
  const wardMatch = html.match(/वडा[^<]*<span[^>]*>([^<]+)<\/span>/i);
  if (wardMatch) {
    metadata.ward = cleanText(wardMatch[1]);
    metadata.ward_number = cleanText(wardMatch[1]);
  }
  
  // Extract constituencies
  const hoRMatch = html.match(/प्रतिनिधि सभा निर्वाचन क्षेत्र[^<]*<span[^>]*>([^<]+)<\/span>/i);
  if (hoRMatch) {
    metadata.house_of_representatives_constituency = cleanText(hoRMatch[1]);
  }
  
  let provincialMatch = html.match(/प्रदेश सभा निर्वाचन क्षेत्र[^<]*<span[^>]*>([^<]+)<\/span>/i);
  if (!provincialMatch) {
    provincialMatch = html.match(/प्रदेश सभा निर्वाचन क्षेत्र[^<]*:?\s*([0-9]+)/i);
  }
  if (provincialMatch) {
    metadata.provincial_assembly_constituency = cleanText(provincialMatch[1]);
  }
  
  // Extract polling center
  const pollingCenterMatch = html.match(/मतदान केन्द्र[^<]*<span[^>]*>([^<]+)<\/span>/i);
  if (pollingCenterMatch) {
    metadata.polling_center = cleanText(pollingCenterMatch[1]);
  }
  
  return metadata;
}

function parseTable(tableHtml) {
  const theadRegex = /<thead[^>]*>([\s\S]*?)<\/thead>/i;
  const theadMatch = tableHtml.match(theadRegex);
  let headers = [];
  
  if (theadMatch) {
    const headerRowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/i;
    const headerRowMatch = theadMatch[1].match(headerRowRegex);
    if (headerRowMatch) {
      const headerCellRegex = /<th[^>]*>([\s\S]*?)<\/th>/gi;
      let headerMatch;
      while ((headerMatch = headerCellRegex.exec(headerRowMatch[1])) !== null) {
        headers.push(cleanText(headerMatch[1]));
      }
    }
  }
  
  if (headers.length === 0) {
    headers = ['serial_number', 'voter_number', 'voter_name', 'age', 'gender', 'spouse_name', 'father_mother_name', 'voter_details'];
  }
  
  const tbodyRegex = /<tbody[^>]*>([\s\S]*?)<\/tbody>/i;
  const tbodyMatch = tableHtml.match(tbodyRegex);
  const rowsHtml = tbodyMatch ? tbodyMatch[1] : tableHtml;
  
  const rows = [];
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let rowMatch;
  
  while ((rowMatch = rowRegex.exec(rowsHtml)) !== null) {
    const rowHtml = rowMatch[1];
    const cells = [];
    
    const cellRegex = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
    let cellMatch;
    
    while ((cellMatch = cellRegex.exec(rowHtml)) !== null) {
      cells.push(cleanText(cellMatch[1]));
    }
    
    if (cells.length > 0) {
      const rowObj = {};
      cells.forEach((cell, index) => {
        const nepaliKey = headers[index] || `column_${index}`;
        
        // Skip voter_details column
        if (nepaliKey === 'मतदाता विवरण' || nepaliKey === 'voter_details') {
          return;
        }
        
        const englishKey = mapHeaderToEnglish(nepaliKey);
        rowObj[nepaliKey] = cell;
        rowObj[englishKey] = cell;
      });
      
      const voterNumberMatch = rowHtml.match(/name=["'](\d+)["']/);
      const voterNameMatch = rowHtml.match(/<a[^>]*>([^<]+)<\/a>/);
      
      if (voterNumberMatch) {
        rowObj.voter_id = voterNumberMatch[1];
      }
      if (voterNameMatch) {
        rowObj.voter_name_clean = cleanText(voterNameMatch[1]);
      }
      
      rows.push(rowObj);
    }
  }
  
  const filteredHeaders = headers.filter(h => h !== 'मतदाता विवरण');
  const englishHeaders = filteredHeaders.map(h => mapHeaderToEnglish(h));
  
  return {
    headers: filteredHeaders,
    headers_english: englishHeaders,
    data: rows,
    total_records: rows.length
  };
}

function extractTableData(html) {
  const tableRegex = /<table[^>]*id=["']tbl_data["'][^>]*>([\s\S]*?)<\/table>/i;
  const tableMatch = html.match(tableRegex);
  
  if (!tableMatch) {
    const anyTableRegex = /<table[^>]*>([\s\S]*?)<\/table>/i;
    const anyTableMatch = html.match(anyTableRegex);
    if (!anyTableMatch) {
      throw new Error('No table found in the file');
    }
    log('⚠ Found table but not with id="tbl_data", using first table found', 'yellow');
    return parseTable(anyTableMatch[1]);
  }
  
  return parseTable(tableMatch[1]);
}

/**
 * Generate filename from metadata
 */
function generateFilePath(metadata) {
  // Format: country/province/district/municipality/ward/polling-center-name.json
  // Hierarchical folder structure matching administrative hierarchy
  const clean = (str) => {
    if (!str) return 'unknown';
    // First transliterate to English
    const english = transliterateToEnglish(str);
    // Then clean for folder/filename (remove special chars, spaces)
    return english
      .replace(/[^\w\s-]/g, '') // Remove special chars
      .replace(/\s+/g, '-')     // Replace spaces with hyphens
      .toLowerCase()
      .replace(/-+/g, '-')      // Replace multiple hyphens with single
      .replace(/^-|-$/g, '');   // Remove leading/trailing hyphens
  };
  
  const country = clean(metadata.country || 'nepal');
  const province = clean(metadata.province);
  const district = clean(metadata.district);
  // Use municipality_name if available (without type), otherwise full municipality name
  const municipality = clean(metadata.municipality_name || metadata.municipality);
  const ward = metadata.ward_number || metadata.ward || 'unknown';
  
  // Use polling center name as-is (Nepali) - no cleaning or transliteration
  // Only do minimal cleaning for filesystem safety (remove invalid path characters)
  let pollingCenter = metadata.polling_center || 'polling-center';
  
  // Minimal cleaning: only remove characters that are invalid in filenames/paths
  // Keep Nepali characters, spaces, commas, periods, etc.
  pollingCenter = pollingCenter
    .replace(/[<>:"|?*\x00-\x1f]/g, '') // Remove invalid filesystem characters
    .replace(/\s+/g, ' ') // Normalize multiple spaces to single space
    .trim();
  
  if (!pollingCenter || pollingCenter.length === 0) {
    pollingCenter = 'polling-center';
  }
  
  // Return hierarchical path: country/province/district/municipality/ward/polling-center-name/polling-center-name.json
  // Structure: nepal/madhesh/saptari/kanchanrup/ward6/म.मा.वि. वलुवा, सितापुर/म.मा.वि. वलुवा, सितापुर.json
  // Polling center is both a folder and the filename, kept as-is in Nepali
  return path.join(country, province, district, municipality, `ward${ward}`, pollingCenter, `${pollingCenter}.json`);
}

// ============================================
// IMPORT FUNCTIONS (from import-ward-to-supabase.js)
// ============================================

const PROVINCE_CODES = {
  'कोशी': '1',
  'मधेश': '2',
  'बागमती': '3',
  'गण्डकी': '4',
  'लुम्बिनी': '5',
  'कर्णाली': '6',
  'सुदूरपश्चिम': '7'
};

const MUNICIPALITY_TYPE_MAP = {
  'नगरपालिका': 'Municipality',
  'गाउँपालिका': 'Rural Municipality',
  'महानगरपालिका': 'Metropolitan',
  'उपमहानगरपालिका': 'Sub-Metropolitan'
};

function transliterateToEnglish(nepaliText) {
  if (!nepaliText) return '';
  
  const transliterationMap = {
    'मधेश': 'Madhesh',
    'सप्तरी': 'Saptari',
    'कञ्चनरुप': 'Kanchanrup',
    'नेपाल': 'Nepal',
    'कोशी': 'Koshi',
    'बागमती': 'Bagmati',
    'गण्डकी': 'Gandaki',
    'लुम्बिनी': 'Lumbini',
    'कर्णाली': 'Karnali',
    'सुदूरपश्चिम': 'Sudurpashchim',
    'वलुवा': 'Waluwa',
    'सितापुर': 'Sitapur'
  };
  
  // Check exact match first
  if (transliterationMap[nepaliText]) {
    return transliterationMap[nepaliText];
  }
  
  // Handle municipality types
  let result = nepaliText
    .replace(/ नगरपालिका$/, ' Municipality')
    .replace(/ गाउँपालिका$/, ' Rural Municipality')
    .replace(/ महानगरपालिका$/, ' Metropolitan')
    .replace(/ उपमहानगरपालिका$/, ' Sub-Metropolitan');
  
  // For polling centers and other text with Nepali characters, try basic transliteration
  // Replace common Nepali abbreviations and words
  result = result
    .replace(/म\.मा\.वि\./g, 'School') // म.मा.वि. = School abbreviation
    .replace(/वि\./g, 'Vidyalaya')
    .replace(/मा\./g, 'Ma')
    .replace(/प्रा\./g, 'Pra')
    .replace(/उच्च/g, 'Higher')
    .replace(/माध्यमिक/g, 'Secondary')
    .replace(/प्राथमिक/g, 'Primary');
  
  // Try to transliterate individual words if the full text contains Nepali
  if (/[\u0900-\u097F]/.test(result)) {
    // Split into words and try to transliterate each
    const words = result.split(/[,\s]+/).filter(w => w.trim().length > 0);
    const transliteratedWords = words.map(word => {
      const trimmedWord = word.trim();
      // Check if this word is in our map
      if (transliterationMap[trimmedWord]) {
        return transliterationMap[trimmedWord];
      }
      // If word contains Nepali but not in map, keep it for now
      // The clean function will handle it
      return trimmedWord;
    });
    
    // Filter out empty translations and join
    const validWords = transliteratedWords.filter(w => w && w.length > 0);
    
    // If we have transliterated words, use them
    if (validWords.length > 0) {
      // For polling centers, prefer the last 2 words (usually place names)
      // But if first word is "School" or similar, include it
      const hasSchool = validWords[0].toLowerCase().includes('school');
      if (hasSchool && validWords.length > 2) {
        result = [validWords[0], ...validWords.slice(-2)].join(' ');
      } else if (validWords.length > 1) {
        // Use last 2 words (usually the place names)
        result = validWords.slice(-2).join(' ');
      } else {
        result = validWords.join(' ');
      }
    }
  }
  
  return result;
}

async function getOrCreateCountry(nepaliName) {
  const englishName = transliterateToEnglish(nepaliName);
  
  const { data: existing, error: findError } = await supabase
    .from('countries')
    .select('id')
    .eq('nepali_name', nepaliName)
    .single();
  
  if (existing) {
    log(`  ✓ Found existing country: ${nepaliName}`, 'green');
    return existing.id;
  }
  
  if (findError && findError.code !== 'PGRST116') {
    throw new Error(`Error finding country: ${findError.message}`);
  }
  
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

async function getOrCreateProvince(countryId, nepaliName) {
  const englishName = transliterateToEnglish(nepaliName);
  const provinceCode = PROVINCE_CODES[nepaliName];
  
  if (!provinceCode) {
    throw new Error(`Unknown province: ${nepaliName}. Please add to PROVINCE_CODES mapping.`);
  }
  
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

async function getOrCreateDistrict(provinceId, nepaliName) {
  const englishName = transliterateToEnglish(nepaliName);
  
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

async function getOrCreateMunicipality(districtId, nepaliName, municipalityTypeNepali) {
  const englishName = transliterateToEnglish(nepaliName);
  const type = MUNICIPALITY_TYPE_MAP[municipalityTypeNepali];
  
  if (!type) {
    throw new Error(`Unknown municipality type: ${municipalityTypeNepali}`);
  }
  
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

async function getOrCreateWard(municipalityId, wardNumber, metadata) {
  const wardNum = parseInt(wardNumber);
  
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
        : null
      // Note: Polling centers are stored in the separate polling_centers table, not here
    })
    .select('id')
    .single();
  
  if (createError) {
    throw new Error(`Error creating ward: ${createError.message}`);
  }
  
  log(`  ✓ Created ward: ${wardNum}`, 'green');
  return created.id;
}

async function getOrCreatePollingCenter(wardId, nepaliName, englishName = null) {
  if (!nepaliName || nepaliName.trim() === '') {
    throw new Error('Polling center name is required');
  }
  
  // Try to find existing
  const { data: existing, error: findError } = await supabase
    .from('polling_centers')
    .select('id')
    .eq('ward_id', wardId)
    .eq('nepali_name', nepaliName)
    .single();
  
  if (existing) {
    log(`  ✓ Found existing polling center: ${nepaliName}`, 'green');
    return existing.id;
  }
  
  if (findError && findError.code !== 'PGRST116') {
    throw new Error(`Error finding polling center: ${findError.message}`);
  }
  
  // Create new polling center
  const { data: created, error: createError } = await supabase
    .from('polling_centers')
    .insert({
      ward_id: wardId,
      nepali_name: nepaliName,
      english_name: englishName || null
    })
    .select('id')
    .single();
  
  if (createError) {
    throw new Error(`Error creating polling center: ${createError.message}`);
  }
  
  log(`  ✓ Created polling center: ${nepaliName}`, 'green');
  return created.id;
}

async function importVoters(pollingCenterId, votersData) {
  log(`\n👥 Step 6: Importing ${votersData.length} voter records...`, 'cyan');
  
  const batchSize = 100;
  const totalBatches = Math.ceil(votersData.length / batchSize);
  let insertedCount = 0;
  let skippedCount = 0;
  
  for (let i = 0; i < votersData.length; i += batchSize) {
    const batch = votersData.slice(i, i + batchSize);
    const batchNumber = Math.floor(i / batchSize) + 1;
    
    const voters = batch.map(record => {
      const voterNumber = record.voter_number || record['मतदाता नं'] || record.voter_id;
      const serialNumber = record.serial_number || record['सि.नं.'];
      const fullName = record.voter_name || record['मतदाताको नाम'];
      const age = record.age || record['उमेर(वर्ष)'];
      const gender = record.gender || record['लिङ्ग'];
      const spouseName = record.spouse_name || record['पति/पत्नीको नाम'];
      const fatherMotherName = record.father_mother_name || record['पिता/माताको नाम'];
      
      return {
        polling_center_id: pollingCenterId,
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
      if (error.code === '23505') {
        log(`  ⚠ Batch ${batchNumber}/${totalBatches}: Some records already exist (skipping duplicates)`, 'yellow');
        skippedCount += batch.length;
      } else {
        throw new Error(`Failed to insert batch ${batchNumber}: ${error.message}`);
      }
    } else {
      insertedCount += inserted.length;
      log(`  ✓ Batch ${batchNumber}/${totalBatches}: Inserted ${inserted.length} records`, 'green');
    }
    
    process.stdout.write(`\r  Progress: ${Math.min(i + batchSize, votersData.length)}/${votersData.length} records`);
  }
  
  log('\n', 'reset');
  return { insertedCount, skippedCount };
}

// ============================================
// MAIN FUNCTION
// ============================================

async function extractAndImport(phpFile) {
  try {
    log('\n=== Extract and Import Ward Data ===\n', 'blue');
    
    // Step 1: Read PHP file
    log(`📄 Step 1: Reading PHP file: ${phpFile}`, 'cyan');
    const fileContent = fs.readFileSync(phpFile, 'utf8');
    log(`✓ File read successfully (${(fileContent.length / 1024).toFixed(2)} KB)`, 'green');
    
    // Step 2: Extract metadata
    log('\n📋 Step 2: Extracting metadata...', 'cyan');
    const metadata = extractMetadata(fileContent);
    metadata.extracted_at = new Date().toISOString();
    metadata.source_file = path.basename(phpFile);
    log(`✓ Found metadata: ${metadata.province}, ${metadata.district}, Ward ${metadata.ward}`, 'green');
    
    // Step 3: Extract table data
    log('\n📊 Step 3: Extracting table data...', 'cyan');
    const tableData = extractTableData(fileContent);
    log(`✓ Extracted ${tableData.data.length} records`, 'green');
    
    // Step 4: Generate file path (hierarchical structure)
    const relativePath = generateFilePath(metadata);
    const outputDir = path.join(process.cwd(), 'src', 'assets', 'data');
    const outputPath = path.join(outputDir, relativePath);
    
    // Step 5: Save JSON file
    log('\n💾 Step 4: Saving JSON file...', 'cyan');
    // Create full directory structure (country/province/district/municipality/)
    const fileDir = path.dirname(outputPath);
    if (!fs.existsSync(fileDir)) {
      fs.mkdirSync(fileDir, { recursive: true });
      log(`  ✓ Created directory structure: ${path.relative(outputDir, fileDir)}`, 'green');
    }
    
    const output = {
      metadata,
      headers: tableData.headers,
      headers_english: tableData.headers_english,
      data: tableData.data,
      summary: {
        total_records: tableData.total_records,
        columns: tableData.headers.length
      }
    };
    
    const jsonString = JSON.stringify(output, null, 2);
    fs.writeFileSync(outputPath, jsonString, 'utf8');
    log(`✓ Data saved to: ${relativePath}`, 'green');
    log(`  Full path: ${outputPath}`, 'cyan');
    log(`  File size: ${(jsonString.length / 1024).toFixed(2)} KB`, 'cyan');
    
    // Step 6: Import to Supabase
    log('\n🗄️  Step 5: Importing to Supabase...', 'cyan');
    
    // Get or create country
    log('\n📋 Processing country...', 'cyan');
    const countryId = await getOrCreateCountry(metadata.country || 'नेपाल');
    
    // Get or create province
    log('\n📋 Processing province...', 'cyan');
    const provinceId = await getOrCreateProvince(countryId, metadata.province);
    
    // Get or create district
    log('\n📋 Processing district...', 'cyan');
    const districtId = await getOrCreateDistrict(provinceId, metadata.district);
    
    // Get or create municipality
    log('\n📋 Processing municipality...', 'cyan');
    const municipalityId = await getOrCreateMunicipality(
      districtId,
      metadata.municipality,
      metadata.municipality_type
    );
    
    // Get or create ward
    log('\n📋 Processing ward...', 'cyan');
    const wardId = await getOrCreateWard(
      municipalityId,
      metadata.ward_number || metadata.ward,
      metadata
    );
    
    // Get or create polling center
    log('\n📋 Processing polling center...', 'cyan');
    if (!metadata.polling_center) {
      throw new Error('Polling center is required in metadata');
    }
    const pollingCenterId = await getOrCreatePollingCenter(
      wardId,
      metadata.polling_center,
      null // English name can be added later if needed
    );
    
    // Import voters (linked to polling center)
    const { insertedCount, skippedCount } = await importVoters(pollingCenterId, tableData.data);
    
    // Summary
    log('\n✅ Process completed!', 'green');
    log(`  JSON file: ${relativePath}`, 'cyan');
    log(`  Total records: ${tableData.data.length}`, 'cyan');
    log(`  Successfully inserted: ${insertedCount}`, 'green');
    if (skippedCount > 0) {
      log(`  Skipped (duplicates): ${skippedCount}`, 'yellow');
    }
    
    // Verify
    log('\n🔍 Verifying import...', 'cyan');
    const { count, error: countError } = await supabase
      .from('voters')
      .select('*', { count: 'exact', head: true })
      .eq('polling_center_id', pollingCenterId);
    
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

function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    log('Usage: node scripts/extract-and-import-ward.js [php-file]', 'yellow');
    log('', 'reset');
    log('Examples:', 'cyan');
    log('  node scripts/extract-and-import-ward.js src/assets/view-ward-data/view_ward.php', 'reset');
    log('', 'reset');
    log('Environment variables required:', 'yellow');
    log('  SUPABASE_URL=your-project-url', 'reset');
    log('  SUPABASE_ANON_KEY=your-anon-key', 'reset');
    process.exit(1);
  }
  
  const phpFile = args[0];
  
  if (!fs.existsSync(phpFile)) {
    log(`❌ Error: File not found: ${phpFile}`, 'red');
    process.exit(1);
  }
  
  extractAndImport(phpFile);
}

main();

