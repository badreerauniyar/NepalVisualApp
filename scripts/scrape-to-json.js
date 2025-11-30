#!/usr/bin/env node

/**
 * Data Scraping Script - PHP to JSON Converter
 * 
 * This script fetches data from a PHP endpoint and converts it to JSON format.
 * 
 * Usage:
 *   node scripts/scrape-to-json.js <URL> [output-file]
 * 
 * Example:
 *   node scripts/scrape-to-json.js "https://example.com/data.php" output.json
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

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
 * Fetch data from URL
 */
function fetchData(url) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const client = parsedUrl.protocol === 'https:' ? https : http;
    
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      }
    };

    log(`Fetching data from: ${url}`, 'cyan');
    
    const req = client.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          log(`✓ Successfully fetched data (${data.length} bytes)`, 'green');
          resolve(data);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

/**
 * Try to parse JSON from response
 */
function tryParseJSON(text) {
  try {
    return JSON.parse(text);
  } catch (e) {
    return null;
  }
}

/**
 * Extract JSON from PHP output (handles cases where PHP outputs JSON)
 */
function extractJSONFromPHP(phpOutput) {
  // Try to find JSON in the output
  // Pattern 1: JSON wrapped in PHP tags or HTML
  const jsonMatch = phpOutput.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch (e) {
      // Continue to other methods
    }
  }

  // Pattern 2: Look for JSON-like structures
  const jsonLikePattern = /(\{[\s\S]{20,}\}|\[[\s\S]{20,}\])/;
  const match = phpOutput.match(jsonLikePattern);
  if (match) {
    try {
      return JSON.parse(match[1]);
    } catch (e) {
      // Continue
    }
  }

  return null;
}

/**
 * Parse HTML table to JSON
 */
function parseHTMLTable(html) {
  const rows = [];
  const tableRegex = /<table[^>]*>([\s\S]*?)<\/table>/i;
  const tableMatch = html.match(tableRegex);
  
  if (!tableMatch) return null;

  const tableContent = tableMatch[1];
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  const rowsMatch = tableContent.matchAll(rowRegex);

  let headers = [];
  let isFirstRow = true;

  for (const rowMatch of rowsMatch) {
    const rowContent = rowMatch[1];
    const cellRegex = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
    const cells = [];
    
    for (const cellMatch of rowContent.matchAll(cellRegex)) {
      const cellText = cellMatch[1]
        .replace(/<[^>]+>/g, '') // Remove HTML tags
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .trim();
      cells.push(cellText);
    }

    if (cells.length > 0) {
      if (isFirstRow) {
        headers = cells;
        isFirstRow = false;
      } else {
        const rowObj = {};
        cells.forEach((cell, index) => {
          const key = headers[index] || `column_${index}`;
          rowObj[key] = cell;
        });
        rows.push(rowObj);
      }
    }
  }

  return rows.length > 0 ? rows : null;
}

/**
 * Convert PHP output to structured data
 */
function convertToJSON(data) {
  // Method 1: Try direct JSON parse
  const directJSON = tryParseJSON(data);
  if (directJSON) {
    log('✓ Data is already valid JSON', 'green');
    return directJSON;
  }

  // Method 2: Try to extract JSON from PHP output
  const extractedJSON = extractJSONFromPHP(data);
  if (extractedJSON) {
    log('✓ Extracted JSON from PHP output', 'green');
    return extractedJSON;
  }

  // Method 3: Try to parse HTML table
  if (data.includes('<table') || data.includes('<TABLE')) {
    log('Attempting to parse HTML table...', 'yellow');
    const tableData = parseHTMLTable(data);
    if (tableData) {
      log('✓ Parsed HTML table to JSON', 'green');
      return tableData;
    }
  }

  // Method 4: Return as raw text with metadata
  log('⚠ Could not parse as structured data. Returning raw text.', 'yellow');
  return {
    _raw: data,
    _note: 'Data could not be automatically parsed. Manual processing may be required.',
    _length: data.length,
    _preview: data.substring(0, 500)
  };
}

/**
 * Save data to JSON file
 */
function saveToFile(data, outputPath) {
  const jsonString = JSON.stringify(data, null, 2);
  const fullPath = path.resolve(outputPath);
  const dir = path.dirname(fullPath);

  // Create directory if it doesn't exist
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(fullPath, jsonString, 'utf8');
  log(`✓ Data saved to: ${fullPath}`, 'green');
  log(`  File size: ${(jsonString.length / 1024).toFixed(2)} KB`, 'cyan');
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    log('Usage: node scripts/scrape-to-json.js <URL> [output-file]', 'yellow');
    log('', 'reset');
    log('Examples:', 'cyan');
    log('  node scripts/scrape-to-json.js "https://example.com/data.php"', 'reset');
    log('  node scripts/scrape-to-json.js "https://example.com/data.php" output.json', 'reset');
    log('  node scripts/scrape-to-json.js "https://example.com/data.php" src/assets/data/scraped-data.json', 'reset');
    process.exit(1);
  }

  const url = args[0];
  const outputFile = args[1] || 'scraped-data.json';

  try {
    log('\n=== PHP to JSON Scraper ===\n', 'blue');
    
    // Fetch data
    const rawData = await fetchData(url);
    
    // Convert to JSON
    log('\nConverting data to JSON...', 'cyan');
    const jsonData = convertToJSON(rawData);
    
    // Save to file
    log('\nSaving to file...', 'cyan');
    saveToFile(jsonData, outputFile);
    
    log('\n✓ Scraping completed successfully!', 'green');
    
  } catch (error) {
    log(`\n✗ Error: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Run the script
main();

