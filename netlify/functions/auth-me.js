import { connectDB } from './utils/db.js';
import { validateToken, extractToken, createResponse, createErrorResponse, handleCORS } from './utils/auth.js';

export async function handler(event, context) {
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
      return createErrorResponse(401, 'Access token required');
    }

    // Validate token and get user
    const user = await validateToken(token);

    return createResponse(200, {
      success: true,
      data: {
        user: user.toJSON()
      }
    });

  } catch (error) {
    console.error('Get user error:', error);
    return createErrorResponse(403, 'Invalid token');
  }
}