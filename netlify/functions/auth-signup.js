import Joi from 'joi';
import { connectDB } from './utils/db.js';
import { User } from './utils/User.js';
import { generateToken, createResponse, createErrorResponse, handleCORS } from './utils/auth.js';

const signupSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  firstName: Joi.string().optional(),
  lastName: Joi.string().optional()
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
    const { error } = signupSchema.validate(body);
    
    if (error) {
      return createErrorResponse(400, `Validation error: ${error.details[0].message}`);
    }

    const { email, password, firstName, lastName } = body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return createErrorResponse(400, 'User already exists with this email');
    }

    // Create new user
    const user = new User({
      email,
      password,
      firstName,
      lastName,
      role: 'user' // Default role
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id.toString());

    // Return success response (matching Supabase format for compatibility)
    return createResponse(201, {
      success: true,
      data: {
        user: user.toJSON(),
        token,
        session: {
          access_token: token,
          user: user.toJSON()
        }
      }
    });

  } catch (error) {
    console.error('Signup error:', error);
    
    // Handle MongoDB duplicate key error
    if (error.code === 11000) {
      return createErrorResponse(400, 'User already exists with this email');
    }
    
    return createErrorResponse(500, 'Internal server error');
  }
}