import { createRequire } from 'module';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const require = createRequire(import.meta.url);

const { handler } = require('./netlify/functions/seed-database.cjs');

// Mock Netlify context and event
const event = {
  httpMethod: 'POST',
  body: JSON.stringify({ clearData: true })
};

const context = {};

// Run the seeder
handler(event, context)
  .then(result => {
    console.log('Seeder completed!');
    if (result && result.statusCode) {
      console.log('Status:', result.statusCode);
      console.log('Result:', JSON.parse(result.body));
    } else {
      console.log('Result:', result);
    }
    process.exit(0);
  })
  .catch(error => {
    console.error('Seeder failed:', error);
    process.exit(1);
  });