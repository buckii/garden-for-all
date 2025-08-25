const Joi = require('joi');
const { connectDB } = require('./utils/db.js');
const { ProduceCategory, ProduceType } = require('./utils/models.js');
const { validateToken, extractToken, createResponse, createErrorResponse, handleCORS } = require('./utils/auth.js');

const categorySchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().allow('').optional(),
  displayOrder: Joi.number().optional()
});

exports.handler = async function(event, context) {
  if (event.httpMethod === 'OPTIONS') {
    return handleCORS();
  }

  try {
    await connectDB();

    // For GET requests, allow public access
    if (event.httpMethod === 'GET') {
      const categories = await ProduceCategory.find().sort({ displayOrder: 1, name: 1 });
      return createResponse(200, { success: true, data: categories });
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
        // Create category
        const body = JSON.parse(event.body || '{}');
        const { error } = categorySchema.validate(body);
        
        if (error) {
          return createErrorResponse(400, `Validation error: ${error.details[0].message}`);
        }

        const category = new ProduceCategory(body);
        await category.save();
        return createResponse(201, { success: true, data: category });

      case 'PUT':
        // Update category
        if (!id) {
          return createErrorResponse(400, 'Category ID required');
        }

        const updateBody = JSON.parse(event.body || '{}');
        const { error: updateError } = categorySchema.validate(updateBody);
        
        if (updateError) {
          return createErrorResponse(400, `Validation error: ${updateError.details[0].message}`);
        }

        const updatedCategory = await ProduceCategory.findByIdAndUpdate(
          id,
          updateBody,
          { new: true, runValidators: true }
        );

        if (!updatedCategory) {
          return createErrorResponse(404, 'Category not found');
        }

        return createResponse(200, { success: true, data: updatedCategory });

      case 'DELETE':
        // Delete category
        if (!id) {
          return createErrorResponse(400, 'Category ID required');
        }

        // Check if category has associated produce types
        const produceTypesCount = await ProduceType.countDocuments({ categoryId: id });
        if (produceTypesCount > 0) {
          return createErrorResponse(400, 'Cannot delete category that has associated produce types');
        }

        const deletedCategory = await ProduceCategory.findByIdAndDelete(id);
        if (!deletedCategory) {
          return createErrorResponse(404, 'Category not found');
        }

        return createResponse(200, { success: true, message: 'Category deleted successfully' });

      default:
        return createErrorResponse(405, 'Method Not Allowed');
    }

  } catch (error) {
    console.error('Admin categories error:', error);
    return createErrorResponse(500, 'Internal server error');
  }
};