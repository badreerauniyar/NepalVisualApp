#!/usr/bin/env node

/**
 * Script to help set up PRD images
 * This script will help you map existing images to the expected names
 */

const fs = require('fs');
const path = require('path');

const imagesDir = path.join(__dirname, '..', 'docs', 'images');
const expectedImages = [
  'complete-platform-overview.png',
  'voter-list-filter.png',
  'voter-data-table.png',
  'voter-statistics-dashboard.png',
  'religion-caste-distribution.png'
];

console.log('📸 PRD Images Setup Helper\n');
console.log('Expected image files:');
expectedImages.forEach((img, index) => {
  console.log(`  ${index + 1}. ${img}`);
});

console.log('\n📁 Current images in docs/images/:');
const existingImages = fs.readdirSync(imagesDir).filter(f => 
  /\.(png|jpg|jpeg)$/i.test(f)
);

if (existingImages.length === 0) {
  console.log('  No images found. Please add your screenshots to docs/images/');
  process.exit(0);
}

existingImages.forEach((img, index) => {
  const exists = fs.existsSync(path.join(imagesDir, img));
  const check = exists ? '✓' : '✗';
  console.log(`  ${check} ${img}`);
});

console.log('\n💡 To use your existing images:');
console.log('   1. Rename your images to match the expected names above, OR');
console.log('   2. Update PRD_INVESTOR.md to reference your actual image filenames\n');

console.log('📄 To generate PDF after adding images:');
console.log('   npm run generate-prd-pdf\n');

