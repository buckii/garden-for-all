import Joi from 'joi';
import crypto from 'crypto';
import { connectDB } from './utils/db.js';
import { User } from './utils/User.js';
import { createResponse, createErrorResponse, handleCORS } from './utils/auth.js';

const confirmResetSchema = Joi.object({
  token: Joi.string().required(),
  password: Joi.string().min(6).required()
});

export async function handler(event, context) {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return handleCORS();
  }

  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return createErrorResponse(405, 'Method Not Allowed');
  }

  try {
    // Connect to database
    await connectDB();

    // Parse and validate request body
    const body = JSON.parse(event.body || '{}');
    const { error } = confirmResetSchema.validate(body);
    
    if (error) {
      return createErrorResponse(400, `Validation error: ${error.details[0].message}`);
    }

    const { token, password } = body;

    // Hash the token to compare with stored hash
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find user with valid reset token
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
      isActive: true
    });

    if (!user) {
      return createErrorResponse(400, 'Token is invalid or has expired');
    }

    // Update password and clear reset token fields
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return createResponse(200, {
      success: true,
      message: 'Password has been reset successfully'
    });

  } catch (error) {
    console.error('Password reset confirmation error:', error);
    return createErrorResponse(500, 'Internal server error');
  }
}