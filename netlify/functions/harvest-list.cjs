const { connectDB } = require('./utils/db.js');
const { HarvestEntry, ProduceType, ProduceCategory } = require('./utils/models.js');
const { createResponse, createErrorResponse, handleCORS } = require('./utils/auth.js');

exports.handler = async function(event, context) {
  if (event.httpMethod === 'OPTIONS') {
    return handleCORS();
  }

  if (event.httpMethod !== 'GET') {
    return createErrorResponse(405, 'Method Not Allowed');
  }

  try {
    await connectDB();

    // Get query parameters
    const queryParams = event.queryStringParameters || {};
    const { date, limit = 100 } = queryParams;

    // Build query
    let query = {};
    if (date) {
      query.harvestDate = date;
    }

    // Fetch harvest entries with populated produce type and category
    const entries = await HarvestEntry.find(query)
      .populate({
        path: 'produceTypeId',
        populate: {
          path: 'categoryId',
          model: 'ProduceCategory'
        }
      })
      .sort({ harvestDate: -1, createdAt: -1 })
      .limit(parseInt(limit));

    // Transform data to match frontend expectations
    const transformedEntries = entries.map(entry => ({
      _id: entry._id,
      produceTypeId: entry.produceTypeId._id,
      quantity: entry.quantity,
      unit: entry.unit,
      harvestDate: entry.harvestDate.toISOString().split('T')[0],
      harvesterName: entry.harvesterName,
      notes: entry.notes,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
      produceType: {
        _id: entry.produceTypeId._id,
        name: entry.produceTypeId.name,
        unitType: entry.produceTypeId.unitType,
        conversionFactor: entry.produceTypeId.conversionFactor,
        categoryId: entry.produceTypeId.categoryId._id,
        category: {
          _id: entry.produceTypeId.categoryId._id,
          name: entry.produceTypeId.categoryId.name,
          description: entry.produceTypeId.categoryId.description
        }
      }
    }));

    return createResponse(200, {
      success: true,
      data: transformedEntries
    });

  } catch (error) {
    console.error('Harvest list error:', error);
    return createErrorResponse(500, 'Internal server error');
  }
};