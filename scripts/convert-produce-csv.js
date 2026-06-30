#!/usr/bin/env node

/**
 * Produce CSV Converter
 *
 * Converts the exported "Produce totals" spreadsheet (comma-separated, with
 * extra analysis columns and footer rows) into the tab-separated
 * `data/harvestentries.csv` format that `seed-database.cjs` expects.
 *
 * What it does:
 *   1. Parses the source as real CSV (handles quoted fields with embedded
 *      commas, e.g. "Beans, wax" or "1,040.00").
 *   2. Keeps only the 9 columns the seeder reads:
 *        Type, Product, Quantity, Weight (lbs), Servings,
 *        Delivery Date, Month, Year, Pantry
 *   3. Drops summary/footer/junk rows by requiring Type, Product, and a
 *      date-shaped Delivery Date (M/D/YY or M/D/YYYY) on every kept row.
 *   4. Writes tab-separated output.
 *
 * Usage:
 *   node scripts/convert-produce-csv.js <input.csv> [output.csv]
 *
 * Defaults output to data/harvestentries.csv (the file the seeder loads).
 * After converting, run `npm run seed:all` to import.
 */

import fs from 'fs';
import path from 'path';

// The columns the seeder cares about, in order. Header names are trimmed on
// read by the seeder, so plain names are fine here.
const OUTPUT_COLUMNS = [
  'Type',
  'Product',
  'Quantity',
  'Weight (lbs)',
  'Servings',
  'Delivery Date',
  'Month',
  'Year',
  'Pantry'
];

// Matches M/D/YY or M/D/YYYY (the Delivery Date formats in the source data).
const DATE_RE = /^\d{1,2}\/\d{1,2}\/\d{2,4}$/;

/**
 * Parse CSV text into an array of row arrays.
 * Handles double-quoted fields, embedded commas, escaped quotes ("") and
 * both \n and \r\n line endings.
 */
function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"'; // escaped quote
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\r') {
      // ignore; handled by \n
    } else if (char === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }

  // Flush the final field/row if the file doesn't end with a newline.
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

function main() {
  const args = process.argv.slice(2);
  const inputPath = args[0];
  const outputPath = args[1] || path.resolve('data/harvestentries.csv');

  if (!inputPath) {
    console.error('Usage: node scripts/convert-produce-csv.js <input.csv> [output.csv]');
    process.exit(1);
  }

  if (!fs.existsSync(inputPath)) {
    console.error(`Input file not found: ${inputPath}`);
    process.exit(1);
  }

  console.log('\n🔄 Produce CSV Converter\n');
  console.log(`Input:  ${inputPath}`);
  console.log(`Output: ${outputPath}\n`);

  const text = fs.readFileSync(inputPath, 'utf-8');
  const rows = parseCSV(text);

  if (rows.length === 0) {
    console.error('No rows found in input file.');
    process.exit(1);
  }

  // Map source header names -> column index so we tolerate column reordering.
  const header = rows[0].map((h) => h.trim());
  const indexFor = {};
  for (const col of OUTPUT_COLUMNS) {
    indexFor[col] = header.findIndex((h) => h === col);
  }

  const missing = OUTPUT_COLUMNS.filter((c) => indexFor[c] === -1);
  if (missing.length > 0) {
    console.error(`Missing expected column(s) in header: ${missing.join(', ')}`);
    console.error(`Found header: ${header.join(' | ')}`);
    process.exit(1);
  }

  const outLines = [OUTPUT_COLUMNS.join('\t')];
  let kept = 0;
  let skipped = 0;

  for (let i = 1; i < rows.length; i++) {
    const cols = rows[i];
    const value = (name) => (cols[indexFor[name]] ?? '').trim();

    const type = value('Type');
    const product = value('Product');
    const date = value('Delivery Date');

    // Require the essentials and a date-shaped Delivery Date. This drops the
    // blank summary rows, the "Check the formulas..." note, and the x,x,x
    // footer rows.
    if (!type || !product || !DATE_RE.test(date)) {
      skipped++;
      continue;
    }

    const out = OUTPUT_COLUMNS.map((name) => value(name));
    outLines.push(out.join('\t'));
    kept++;
  }

  fs.writeFileSync(outputPath, outLines.join('\n') + '\n', 'utf-8');

  console.log('✅ Conversion complete\n');
  console.log(`  Rows kept:    ${kept}`);
  console.log(`  Rows skipped: ${skipped} (headers/summaries/footers/invalid dates)`);
  console.log(`\nNext: run "npm run seed:all" to import (this clears the DB first —`);
  console.log(`make sure MONGODB_URI points at the right database).\n`);
}

main();
