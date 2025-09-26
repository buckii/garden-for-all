const { ProduceType } = require('./utils/models.js');
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

    const { categoryId } = event.queryStringParameters || {};

    // Build query
    const query = {};
    if (categoryId) {
      query.categoryId = categoryId;
    }

    // Fetch produce types with category information
    const produceTypes = await ProduceType
      .find(query)
      .populate('categoryId', 'name')
      .sort({ name: 1 });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: produceTypes
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