import { createResponse, handleCORS } from './utils/auth.js';

export async function handler(event, context) {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return handleCORS();
  }

  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return createResponse(405, { error: 'Method Not Allowed' });
  }

  try {
    // For JWT tokens, signout is handled client-side by removing the token
    // In a more complex system, you could maintain a blacklist of tokens
    
    return createResponse(200, {
      success: true,
      message: 'Signed out successfully'
    });

  } catch (error) {
    console.error('Signout error:', error);
    return createResponse(500, {
      success: false,
      error: 'Internal server error'
    });
  }
}