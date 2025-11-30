# Data Scraping Scripts

## Extract Ward Data from PHP/HTML File

This script extracts voter data from HTML tables embedded in PHP files and converts it to JSON format.

### Features

- ✅ Extracts data from HTML tables in PHP files
- ✅ Preserves both Nepali and English field names
- ✅ Extracts metadata (province, district, ward)
- ✅ Handles large files efficiently
- ✅ No external dependencies

### Usage

```bash
# Using npm script
npm run extract-ward src/assets/view-ward-data/view_ward.php

# With custom output file
npm run extract-ward src/assets/view-ward-data/view_ward.php src/assets/data/ward-data.json

# Or directly with node
node scripts/extract-ward-data.js src/assets/view-ward-data/view_ward.php output.json
```

### Output Format

The script generates JSON with:
- **metadata**: Province, district, ward, extraction timestamp
- **headers**: Original Nepali column headers
- **headers_english**: English translations
- **data**: Array of records with both Nepali and English field names
- **summary**: Total records and column count

### Example Output

```json
{
  "metadata": {
    "province": "मधेश",
    "district": "सप्तरी",
    "ward": "6",
    "extracted_at": "2025-11-30T12:05:33.402Z"
  },
  "headers": ["सि.नं.", "मतदाता नं", ...],
  "headers_english": ["serial_number", "voter_number", ...],
  "data": [
    {
      "सि.नं.": "1",
      "serial_number": "1",
      "मतदाता नं": "30176212",
      "voter_number": "30176212",
      ...
    }
  ]
}
```

---

## PHP to JSON Scraper

This script helps you scrape data from PHP endpoints and convert it to JSON format.

### Features

- ✅ Fetches data from PHP URLs (HTTP/HTTPS)
- ✅ Automatically detects and parses JSON in PHP output
- ✅ Parses HTML tables to JSON
- ✅ Handles various PHP output formats
- ✅ Saves clean JSON files
- ✅ No external dependencies (uses Node.js built-ins)

### Usage

#### Basic Usage

```bash
# Using npm script
npm run scrape "https://example.com/data.php"

# Or directly with node
node scripts/scrape-to-json.js "https://example.com/data.php"
```

#### With Custom Output File

```bash
# Save to specific location
npm run scrape "https://example.com/data.php" src/assets/data/scraped-data.json

# Or save to root directory
npm run scrape "https://example.com/data.php" output.json
```

### How It Works

The script tries multiple methods to extract structured data:

1. **Direct JSON**: If the PHP output is already valid JSON
2. **Extracted JSON**: Extracts JSON from PHP output (handles cases where PHP wraps JSON)
3. **HTML Table Parsing**: Converts HTML tables to JSON arrays
4. **Raw Text**: If none of the above work, saves raw text with metadata

### Examples

```bash
# Example 1: Scrape and save to default location
npm run scrape "https://api.example.com/get-data.php"

# Example 2: Scrape and save to assets folder
npm run scrape "https://api.example.com/get-data.php" src/assets/data/new-data.json

# Example 3: Scrape with query parameters
npm run scrape "https://api.example.com/data.php?id=123&format=json" output.json
```

### Output

The script will:
- Display progress messages in the console
- Save the JSON file to the specified location
- Show file size and location after completion

### Tips

1. **Check the PHP response first**: Open the URL in your browser to see what format the data is in
2. **If it's HTML**: The script will try to parse tables automatically
3. **If it's already JSON**: The script will detect and save it directly
4. **If parsing fails**: The script saves the raw data so you can manually process it

### Troubleshooting

- **Connection errors**: Make sure the URL is accessible and doesn't require authentication
- **Parsing issues**: Check the raw output - the script saves it with a `_raw` field if parsing fails
- **CORS issues**: If scraping from browser, you might need to use a server-side approach (this script runs on Node.js, so CORS doesn't apply)

