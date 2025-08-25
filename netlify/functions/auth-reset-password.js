import Joi from 'joi';
import { connectDB } from './utils/db.js';
import { User } from './utils/User.js';
import { createResponse, createErrorResponse, handleCORS } from './utils/auth.js';

const resetSchema = Joi.object({
  email: Joi.string().email().required()
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
    const { error } = resetSchema.validate(body);
    
    if (error) {
      return createErrorResponse(400, `Validation error: ${error.details[0].message}`);
    }

    const { email } = body;

    // Check if user exists (but don't reveal if they don't - security best practice)
    const user = await User.findOne({ email, isActive: true });
    
    // TODO: In a real implementation, you would:
    // 1. Generate a password reset token
    // 2. Store it in the database with expiration
    // 3. Send an email with the reset link
    
    // For now, always return success (security best practice - don't reveal if email exists)
    return createResponse(200, {
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent'
    });

  } catch (error) {
    console.error('Password reset error:', error);
    return createErrorResponse(500, 'Internal server error');
  }
}