const { connectDB } = require('./utils/db.js');
const { FoodPantry } = require('./utils/models.js');
const { createResponse, createErrorResponse, handleCORS } = require('./utils/auth.js');

exports.handler = async function(event, context) {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return handleCORS();
  }

  try {
    await connectDB();

    if (event.httpMethod === 'GET') {
      // Get all active food pantries (public endpoint, no auth required)
      const pantries = await FoodPantry.find({ isActive: true })
        .sort({ name: 1 })
        .select('-__v');

      return createResponse(200, {
        success: true,
        data: pantries
      });
    }

    return createErrorResponse(405, 'Method Not Allowed');

  } catch (error) {
    console.error('Food pantries error:', error);
    return createErrorResponse(500, `Server error: ${error.message}`);
  }
};