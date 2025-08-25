const Joi = require('joi');
const { connectDB } = require('./utils/db.js');
const { User } = require('./utils/User.js');
const { generateToken, createResponse, createErrorResponse, handleCORS } = require('./utils/auth.js');

const signinSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required()
});

exports.handler = async function(event, context) {
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
    const { error } = signinSchema.validate(body);
    
    if (error) {
      return createErrorResponse(400, `Validation error: ${error.details[0].message}`);
    }

    const { email, password } = body;

    // Find user
    const user = await User.findOne({ email, isActive: true });
    if (!user) {
      return createErrorResponse(401, 'Invalid credentials');
    }

    // Verify password
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return createErrorResponse(401, 'Invalid credentials');
    }

    // Generate token
    const token = generateToken(user._id.toString());

    // Return success response (matching Supabase format for compatibility)
    return createResponse(200, {
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
    console.error('Signin error:', error);
    return createErrorResponse(500, 'Internal server error');
  }
};