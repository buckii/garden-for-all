#!/usr/bin/env node

/**
 * Database Seeding Script
 *
 * Usage:
 *   npm run seed              # Seed without clearing
 *   npm run seed:clear        # Clear data and reseed
 *   npm run seed:all          # Clear data and reseed with all historical data
 *
 * Or run directly:
 *   node scripts/seed.js [--clear] [--all]
 */

import https from 'https';
import http from 'http';

// Parse command line arguments
const args = process.argv.slice(2);
const clearData = args.includes('--clear');
const allHistoricalData = args.includes('--all');

// Determine the API URL based on environment
const API_URL = process.env.API_URL || 'http://localhost:8888';
const endpoint = `${API_URL}/api/seed-database`;

// Request body
const requestBody = JSON.stringify({
  clearData,
  allHistoricalData
});

// Parse the URL
const url = new URL(endpoint);
const protocol = url.protocol === 'https:' ? https : http;

const options = {
  hostname: url.hostname,
  port: url.port || (url.protocol === 'https:' ? 443 : 80),
  path: url.pathname,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(requestBody)
  }
};

console.log('\n🌱 Garden For All - Database Seeder\n');
console.log(`Target: ${endpoint}`);
console.log(`Clear existing data: ${clearData ? 'YES' : 'NO'}`);
console.log(`Include all historical data: ${allHistoricalData ? 'YES' : 'NO'}`);
console.log('\nStarting seed process...\n');

const req = protocol.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const response = JSON.parse(data);

      if (res.statusCode === 200 && response.success) {
        console.log('✅ Database seeded successfully!\n');
        console.log('Summary:');
        if (response.summary) {
          Object.entries(response.summary).forEach(([key, value]) => {
            console.log(`  - ${key}: ${value}`);
          });
        }
        console.log('\n');
        process.exit(0);
      } else {
        console.error('❌ Seeding failed:');
        console.error(`   Status: ${res.statusCode}`);
        console.error(`   Error: ${response.error || response.message || 'Unknown error'}`);
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Failed to parse response:');
      console.error(`   ${error.message}`);
      console.error(`   Response: ${data}`);
      process.exit(1);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request failed:');
  console.error(`   ${error.message}`);
  console.error('\n💡 Make sure your development server is running:');
  console.error('   npm run dev');
  process.exit(1);
});

// Send the request
req.write(requestBody);
req.end();
