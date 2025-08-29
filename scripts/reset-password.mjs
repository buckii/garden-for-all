#!/usr/bin/env node

import mongoose from 'mongoose';
import crypto from 'crypto';
import process from 'process';

// Get email from command line argument
const email = process.argv[2];

if (!email) {
  console.error('Usage: node scripts/reset-password.mjs <email>');
  process.exit(1);
}

// Load environment variables manually from .env file
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, '..', '.env');

try {
  const envContent = readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, ...value] = line.split('=');
    if (key && !process.env[key]) {
      process.env[key] = value.join('=').replace(/^["']|["']$/g, '');
    }
  });
} catch (err) {
  console.log('No .env file found, using defaults');
}

// User schema matching netlify/functions/utils/User.js
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'user'], default: 'user' },
  firstName: { type: String },
  lastName: { type: String },
  isActive: { type: Boolean, default: true },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  return resetToken;
};

const User = mongoose.model('User', userSchema);

async function resetPassword() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/garden-for-all';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Find user
    const user = await User.findOne({ email, isActive: true });
    
    if (!user) {
      console.log(`No active user found with email: ${email}`);
      process.exit(1);
    }

    // Generate reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // Generate reset URL
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5174';
    const resetUrl = `${clientUrl}/reset-password/${resetToken}`;

    console.log('\n===== PASSWORD RESET LINK =====');
    console.log(`User: ${email}`);
    console.log(`Reset URL: ${resetUrl}`);
    console.log(`Token expires in: 10 minutes`);
    console.log('================================\n');
    console.log('Open this URL in your browser to reset the password.');
    console.log('\nAlternatively, you can copy just the token:');
    console.log(resetToken);

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

resetPassword();