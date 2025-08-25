const Joi = require('joi');
const { connectDB } = require('./utils/db.js');
const { ProduceType, HarvestEntry } = require('./utils/models.js');
const { validateToken, extractToken, createResponse, createErrorResponse, handleCORS } = require('./utils/auth.js');

const produceTypeSchema = Joi.object({
  name: Joi.string().required(),
  categoryId: Joi.string().required(),
  unitType: Joi.string().valid('weight', 'count', 'volume').required(),
  conversionFactor: Joi.number().min(0).required()
});

exports.handler = async function(event, context) {
  if (event.httpMethod === 'OPTIONS') {
    return handleCORS();
  }

  try {
    await connectDB();

    // For GET requests, allow public access
    if (event.httpMethod === 'GET') {
      const produceTypes = await ProduceType.find()
        .populate('categoryId')
        .sort({ name: 1 });

      const transformedTypes = produceTypes.map(type => ({
        _id: type._id,
        id: type._id.toString(),
        categoryId: type.categoryId._id,
        name: type.name,
        unitType: type.unitType,
        conversionFactor: type.conversionFactor,
        createdAt: type.createdAt,
        updatedAt: type.updatedAt,
        category: {
          _id: type.categoryId._id,
          id: type.categoryId._id.toString(),
          name: type.categoryId.name,
          description: type.categoryId.description,
          displayOrder: type.categoryId.displayOrder
        }
      }));

      return createResponse(200, { success: true, data: transformedTypes });
    }

    // For write operations, require admin authentication
    const token = extractToken(event.headers.authorization);
    if (!token) {
      return createErrorResponse(401, 'Access token required');
    }

    const user = await validateToken(token);
    if (user.role !== 'admin') {
      return createErrorResponse(403, 'Admin access required');
    }

    const { httpMethod, pathParameters } = event;
    const id = pathParameters?.id;

    switch (httpMethod) {
      case 'POST':
        // Create produce type
        const body = JSON.parse(event.body || '{}');
        const { error } = produceTypeSchema.validate(body);
        
        if (error) {
          return createErrorResponse(400, `Validation error: ${error.details[0].message}`);
        }

        const produceType = new ProduceType(body);
        await produceType.save();
        
        // Populate the category for response
        await produceType.populate('categoryId');
        
        return createResponse(201, { 
          success: true, 
          data: {
            ...produceType.toObject(),
            id: produceType._id.toString()
          }
        });

      case 'PUT':
        // Update produce type
        if (!id) {
          return createErrorResponse(400, 'Produce type ID required');
        }

        const updateBody = JSON.parse(event.body || '{}');
        const { error: updateError } = produceTypeSchema.validate(updateBody);
        
        if (updateError) {
          return createErrorResponse(400, `Validation error: ${updateError.details[0].message}`);
        }

        const updatedProduceType = await ProduceType.findByIdAndUpdate(
          id,
          updateBody,
          { new: true, runValidators: true }
        ).populate('categoryId');

        if (!updatedProduceType) {
          return createErrorResponse(404, 'Produce type not found');
        }

        return createResponse(200, { 
          success: true, 
          data: {
            ...updatedProduceType.toObject(),
            id: updatedProduceType._id.toString()
          }
        });

      case 'DELETE':
        // Delete produce type
        if (!id) {
          return createErrorResponse(400, 'Produce type ID required');
        }

        // Check if produce type has associated harvest entries
        const harvestEntriesCount = await HarvestEntry.countDocuments({ produceTypeId: id });
        if (harvestEntriesCount > 0) {
          return createErrorResponse(400, 'Cannot delete produce type that has associated harvest entries');
        }

        const deletedProduceType = await ProduceType.findByIdAndDelete(id);
        if (!deletedProduceType) {
          return createErrorResponse(404, 'Produce type not found');
        }

        return createResponse(200, { success: true, message: 'Produce type deleted successfully' });

      default:
        return createErrorResponse(405, 'Method Not Allowed');
    }

  } catch (error) {
    console.error('Admin produce types error:', error);
    return createErrorResponse(500, 'Internal server error');
  }
};