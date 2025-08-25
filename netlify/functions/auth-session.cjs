const { connectDB } = require('./utils/db.js');
const { validateToken, extractToken, createResponse, createErrorResponse, handleCORS } = require('./utils/auth.js');

exports.handler = async function(event, context) {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return handleCORS();
  }

  // Only allow GET
  if (event.httpMethod !== 'GET') {
    return createErrorResponse(405, 'Method Not Allowed');
  }

  try {
    // Connect to database
    await connectDB();

    // Extract token from Authorization header
    const token = extractToken(event.headers.authorization);
    
    if (!token) {
      // Return null session (not an error - matches Supabase behavior)
      return createResponse(200, {
        success: true,
        data: {
          session: null
        }
      });
    }

    // Validate token and get user
    const user = await validateToken(token);

    // Return session data (matching Supabase format)
    return createResponse(200, {
      success: true,
      data: {
        session: {
          access_token: token,
          user: user.toJSON()
        }
      }
    });

  } catch (error) {
    console.error('Session error:', error);
    
    // Return null session for invalid tokens (matches Supabase behavior)
    return createResponse(200, {
      success: true,
      data: {
        session: null
      }
    });
  }
};