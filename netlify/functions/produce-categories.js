const { ProduceCategory } = require('./utils/models.js');
const { validateToken, extractToken } = require('./utils/auth.js');
const { connectDB } = require('./utils/db.js');

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Connect to database
    await connectDB();

    // Get auth token from headers
    const authHeader = event.headers.authorization || event.headers.Authorization;
    const token = extractToken(authHeader);
    if (!token) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Authorization token required' })
      };
    }

    const user = await validateToken(token);
    if (!user) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Invalid or expired token' })
      };
    }

    // Fetch all categories, sorted by display order
    const categories = await ProduceCategory
      .find({})
      .sort({ displayOrder: 1, name: 1 });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: categories
      })
    };
  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        details: error.message
      })
    };
  }
};