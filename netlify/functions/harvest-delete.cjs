const { connectDB } = require('./utils/db.js');
const { HarvestEntry } = require('./utils/models.js');
const { createResponse, createErrorResponse, handleCORS } = require('./utils/auth.js');

exports.handler = async function(event, context) {
  if (event.httpMethod === 'OPTIONS') {
    return handleCORS();
  }

  if (event.httpMethod !== 'DELETE') {
    return createErrorResponse(405, 'Method Not Allowed');
  }

  try {
    await connectDB();

    const { id } = event.queryStringParameters || {};

    if (!id) {
      return createErrorResponse(400, 'Harvest entry ID is required');
    }

    // Find and delete the harvest entry
    const deletedEntry = await HarvestEntry.findByIdAndDelete(id);

    if (!deletedEntry) {
      return createErrorResponse(404, 'Harvest entry not found');
    }

    return createResponse(200, {
      success: true,
      message: 'Harvest entry deleted successfully',
      data: {
        id: deletedEntry._id
      }
    });

  } catch (error) {
    console.error('Harvest delete error:', error);
    return createErrorResponse(500, `Failed to delete harvest entry: ${error.message}`);
  }
};