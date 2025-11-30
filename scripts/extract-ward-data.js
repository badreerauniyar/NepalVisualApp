#!/usr/bin/env node

/**
 * Extract Ward Data from PHP/HTML File
 * 
 * This script extracts voter data from an HTML table embedded in a PHP file
 * and converts it to JSON format.
 * 
 * Usage:
 *   node scripts/extract-ward-data.js [input-file] [output-file]
 * 
 * Example:
 *   node scripts/extract-ward-data.js src/assets/view-ward-data/view_ward.php src/assets/data/ward-data.json
 */

const fs = require('fs');
const path = require('path');

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
 * Extract table data from HTML
 */
function extractTableData(html) {
  // Find the table with id="tbl_data"
  const tableRegex = /<table[^>]*id=["']tbl_data["'][^>]*>([\s\S]*?)<\/table>/i;
  const tableMatch = html.match(tableRegex);
  
  if (!tableMatch) {
    // Try to find any table
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
 * Parse table HTML to extract rows and cells
 */
function parseTable(tableHtml) {
  // Extract headers
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
  
  // Default headers if not found
  if (headers.length === 0) {
    headers = ['serial_number', 'voter_number', 'voter_name', 'age', 'gender', 'spouse_name', 'father_mother_name', 'voter_details'];
  }
  
  // Extract rows from tbody
  const tbodyRegex = /<tbody[^>]*>([\s\S]*?)<\/tbody>/i;
  const tbodyMatch = tableHtml.match(tbodyRegex);
  const rowsHtml = tbodyMatch ? tbodyMatch[1] : tableHtml;
  
  const rows = [];
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let rowMatch;
  
  while ((rowMatch = rowRegex.exec(rowsHtml)) !== null) {
    const rowHtml = rowMatch[1];
    const cells = [];
    
    // Extract cells
    const cellRegex = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
    let cellMatch;
    
    while ((cellMatch = cellRegex.exec(rowHtml)) !== null) {
      cells.push(cleanText(cellMatch[1]));
    }
    
    if (cells.length > 0) {
      // Create object with both Nepali and English keys
      const rowObj = {};
      cells.forEach((cell, index) => {
        const nepaliKey = headers[index] || `column_${index}`;
        
        // Skip voter_details column (मतदाता विवरण) - it's just button text, not real data
        if (nepaliKey === 'मतदाता विवरण' || nepaliKey === 'voter_details') {
          return; // Skip this column
        }
        
        const englishKey = mapHeaderToEnglish(nepaliKey);
        
        // Store with both Nepali and English keys
        rowObj[nepaliKey] = cell;
        rowObj[englishKey] = cell;
      });
      
      // Also extract voter number and name from links/buttons if available
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
  
  // Filter out voter_details from headers (it's just button text, not real data)
  const filteredHeaders = headers.filter(h => h !== 'मतदाता विवरण');
  const englishHeaders = filteredHeaders.map(h => mapHeaderToEnglish(h));
  
  return {
    headers: filteredHeaders,
    headers_english: englishHeaders,
    data: rows,
    total_records: rows.length
  };
}

/**
 * Map Nepali headers to English
 */
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

/**
 * Clean HTML text
 */
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

/**
 * Extract metadata from the HTML (province, district, etc.)
 */
function extractMetadata(html) {
  const metadata = {};
  
  // Extract country (default to Nepal/नेपाल if not found)
  const countryMatch = html.match(/<span[^>]*>([^<]*नेपाल[^<]*)<\/span>/i);
  if (countryMatch) {
    metadata.country = cleanText(countryMatch[1]);
  } else {
    metadata.country = 'नेपाल'; // Default to Nepal
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
  
  // Extract municipality/VDC (नगरपालिका or गाउँपालिका)
  // Pattern 1: Municipality name includes the type (e.g., "कञ्चनरुप नगरपालिका")
  const municipalityWithTypeMatch = html.match(/<span[^>]*>([^<]*(?:नगरपालिका|गाउँपालिका)[^<]*)<\/span>/i);
  if (municipalityWithTypeMatch) {
    const fullText = cleanText(municipalityWithTypeMatch[1]);
    metadata.municipality = fullText;
    
    // Detect and extract type
    if (fullText.includes('नगरपालिका')) {
      metadata.municipality_type = 'नगरपालिका'; // Municipality
      metadata.municipality_name = fullText.replace(/नगरपालिका/g, '').trim();
    } else if (fullText.includes('गाउँपालिका')) {
      metadata.municipality_type = 'गाउँपालिका'; // Rural Municipality
      metadata.municipality_name = fullText.replace(/गाउँपालिका/g, '').trim();
    }
  } else {
    // Pattern 2: Municipality name separate from type
    const municipalityMatch = html.match(/<span[^>]*>([^<]+)<\/span>[^<]*(?:नगरपालिका|गाउँपालिका)/i);
    if (municipalityMatch) {
      metadata.municipality_name = cleanText(municipalityMatch[1]);
      // Try to detect type from context
      if (html.match(/नगरपालिका/i)) {
        metadata.municipality_type = 'नगरपालिका';
      } else if (html.match(/गाउँपालिका/i)) {
        metadata.municipality_type = 'गाउँपालिका';
      }
      metadata.municipality = `${metadata.municipality_name} ${metadata.municipality_type || ''}`.trim();
    }
  }
  
  // Extract ward number
  const wardMatch = html.match(/वडा[^<]*<span[^>]*>([^<]+)<\/span>/i);
  if (wardMatch) {
    metadata.ward = cleanText(wardMatch[1]);
    metadata.ward_number = cleanText(wardMatch[1]); // Also store as ward_number for consistency
  }
  
  // Extract House of Representatives Constituency (प्रतिनिधि सभा निर्वाचन क्षेत्र)
  const hoRMatch = html.match(/प्रतिनिधि सभा निर्वाचन क्षेत्र[^<]*<span[^>]*>([^<]+)<\/span>/i);
  if (hoRMatch) {
    metadata.house_of_representatives_constituency = cleanText(hoRMatch[1]);
    // Don't store translation label - it's just plain text, not data
  }
  
  // Extract Provincial Assembly Constituency (प्रदेश सभा निर्वाचन क्षेत्र)
  // Try with span first, then without
  let provincialMatch = html.match(/प्रदेश सभा निर्वाचन क्षेत्र[^<]*<span[^>]*>([^<]+)<\/span>/i);
  if (!provincialMatch) {
    provincialMatch = html.match(/प्रदेश सभा निर्वाचन क्षेत्र[^<]*:?\s*([0-9]+)/i);
  }
  if (provincialMatch) {
    metadata.provincial_assembly_constituency = cleanText(provincialMatch[1]);
    // Don't store translation label - it's just plain text, not data
  }
  
  // Extract Polling Center (मतदान केन्द्र)
  const pollingCenterMatch = html.match(/मतदान केन्द्र[^<]*<span[^>]*>([^<]+)<\/span>/i);
  if (pollingCenterMatch) {
    metadata.polling_center = cleanText(pollingCenterMatch[1]);
    // Don't store translation label - it's just plain text, not data
  }
  
  return metadata;
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    log('Usage: node scripts/extract-ward-data.js [input-file] [output-file]', 'yellow');
    log('', 'reset');
    log('Examples:', 'cyan');
    log('  node scripts/extract-ward-data.js src/assets/view-ward-data/view_ward.php', 'reset');
    log('  node scripts/extract-ward-data.js src/assets/view-ward-data/view_ward.php src/assets/data/ward-data.json', 'reset');
    process.exit(1);
  }
  
  const inputFile = args[0];
  const outputFile = args[1] || 'ward-data.json';
  
  try {
    log('\n=== Ward Data Extractor ===\n', 'blue');
    
    // Read the file
    log(`Reading file: ${inputFile}`, 'cyan');
    const fileContent = fs.readFileSync(inputFile, 'utf8');
    log(`✓ File read successfully (${(fileContent.length / 1024).toFixed(2)} KB)`, 'green');
    
    // Extract metadata
    log('\nExtracting metadata...', 'cyan');
    const metadata = extractMetadata(fileContent);
    if (Object.keys(metadata).length > 0) {
      log(`✓ Found metadata: ${JSON.stringify(metadata)}`, 'green');
    }
    
    // Extract table data
    log('\nExtracting table data...', 'cyan');
    const tableData = extractTableData(fileContent);
    log(`✓ Extracted ${tableData.data.length} records`, 'green');
    
    // Combine metadata and data
    const output = {
      metadata: {
        ...metadata,
        extracted_at: new Date().toISOString(),
        source_file: path.basename(inputFile)
      },
      headers: tableData.headers,
      data: tableData.data,
      summary: {
        total_records: tableData.total_records,
        columns: tableData.headers.length
      }
    };
    
    // Save to file
    log('\nSaving to file...', 'cyan');
    const jsonString = JSON.stringify(output, null, 2);
    const fullPath = path.resolve(outputFile);
    const dir = path.dirname(fullPath);
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(fullPath, jsonString, 'utf8');
    log(`✓ Data saved to: ${fullPath}`, 'green');
    log(`  File size: ${(jsonString.length / 1024).toFixed(2)} KB`, 'cyan');
    log(`  Records: ${tableData.data.length}`, 'cyan');
    
    log('\n✓ Extraction completed successfully!', 'green');
    
    // Show sample record
    if (tableData.data.length > 0) {
      log('\nSample record:', 'cyan');
      console.log(JSON.stringify(tableData.data[0], null, 2));
    }
    
  } catch (error) {
    log(`\n✗ Error: ${error.message}`, 'red');
    if (error.stack) {
      log(error.stack, 'red');
    }
    process.exit(1);
  }
}

// Run the script
main();

