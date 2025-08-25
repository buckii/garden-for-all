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
      id: type._id.toString(),
      categoryId: type.categoryId._id,
      category_id: type.categoryId._id.toString(), // Add snake_case for compatibility
      name: type.name,
      unitType: type.unitType,
      unit_type: type.unitType, // Add snake_case for compatibility
      conversionFactor: type.conversionFactor,
      conversion_factor: type.conversionFactor, // Add snake_case for compatibility
      pricePerLb: type.pricePerLb || 0,
      price_per_lb: type.pricePerLb || 0, // Add snake_case for compatibility
      servingWeightOz: type.servingWeightOz || 0,
      serving_weight_oz: type.servingWeightOz || 0, // Add snake_case for compatibility
      servingsPerLb: type.servingsPerLb || 0,
      servings_per_lb: type.servingsPerLb || 0, // Add snake_case for compatibility
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