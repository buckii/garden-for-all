const { connectDB } = require('./utils/db.js');
const { ProduceType, ProduceCategory } = require('./utils/models.js');
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

    // Fetch produce types with categories
    const produceTypes = await ProduceType.find()
      .populate('categoryId')
      .sort({ name: 1 });

    // Transform data to match frontend expectations
    const transformedTypes = produceTypes.map(type => ({
      _id: type._id,
      categoryId: type.categoryId._id,
      name: type.name,
      unitType: type.unitType,
      conversionFactor: type.conversionFactor,
      createdAt: type.createdAt,
      updatedAt: type.updatedAt,
      category: {
        _id: type.categoryId._id,
        name: type.categoryId.name,
        description: type.categoryId.description,
        displayOrder: type.categoryId.displayOrder
      }
    }));

    return createResponse(200, {
      success: true,
      data: transformedTypes
    });

  } catch (error) {
    console.error('Produce types list error:', error);
    return createErrorResponse(500, 'Internal server error');
  }
};