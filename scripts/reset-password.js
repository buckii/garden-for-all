#!/usr/bin/env node

import mongoose from 'mongoose';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

// Get email from command line argument
const email = process.argv[2];

if (!email) {
  console.error('Usage: node scripts/reset-password.js <email>');
  process.exit(1);
}

// User schema (simplified version matching the main schema)
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'gardener'], default: 'gardener' },
  isActive: { type: Boolean, default: true },
  passwordResetToken: String,
  passwordResetExpires: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.passwordResetExpires = Date.now() + 3600000; // 1 hour
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
    console.log(`Token expires in: 1 hour`);
    console.log('================================\n');
    console.log('Open this URL in your browser to reset the password.');

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

resetPassword();