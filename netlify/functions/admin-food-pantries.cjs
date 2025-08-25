const Joi = require('joi');
const { connectDB } = require('./utils/db.js');
const { FoodPantry } = require('./utils/models.js');
const { validateToken, extractToken, createResponse, createErrorResponse, handleCORS } = require('./utils/auth.js');

const foodPantrySchema = Joi.object({
  name: Joi.string().required(),
  contactInfo: Joi.object({
    phone: Joi.string().optional(),
    email: Joi.string().email().optional(),
    address: Joi.string().optional()
  }).optional(),
  commitmentAmounts: Joi.object({
    total: Joi.number().min(0).optional(),
    vegetables: Joi.number().min(0).optional(),
    fruits: Joi.number().min(0).optional(),
    herbs: Joi.number().min(0).optional(),
    flowers: Joi.number().min(0).optional()
  }).optional(),
  isActive: Joi.boolean().optional()
});

exports.handler = async function(event, context) {
  if (event.httpMethod === 'OPTIONS') {
    return handleCORS();
  }

  try {
    await connectDB();

    // For GET requests, allow public access
    if (event.httpMethod === 'GET') {
      const pantries = await FoodPantry.find().sort({ name: 1 });
      
      const transformedPantries = pantries.map(pantry => ({
        ...pantry.toObject(),
        id: pantry._id.toString()
      }));

      return createResponse(200, { success: true, data: transformedPantries });
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
        // Create food pantry
        const body = JSON.parse(event.body || '{}');
        const { error } = foodPantrySchema.validate(body);
        
        if (error) {
          return createErrorResponse(400, `Validation error: ${error.details[0].message}`);
        }

        const foodPantry = new FoodPantry(body);
        await foodPantry.save();
        
        return createResponse(201, { 
          success: true, 
          data: {
            ...foodPantry.toObject(),
            id: foodPantry._id.toString()
          }
        });

      case 'PUT':
        // Update food pantry
        if (!id) {
          return createErrorResponse(400, 'Food pantry ID required');
        }

        const updateBody = JSON.parse(event.body || '{}');
        const { error: updateError } = foodPantrySchema.validate(updateBody);
        
        if (updateError) {
          return createErrorResponse(400, `Validation error: ${updateError.details[0].message}`);
        }

        const updatedPantry = await FoodPantry.findByIdAndUpdate(
          id,
          updateBody,
          { new: true, runValidators: true }
        );

        if (!updatedPantry) {
          return createErrorResponse(404, 'Food pantry not found');
        }

        return createResponse(200, { 
          success: true, 
          data: {
            ...updatedPantry.toObject(),
            id: updatedPantry._id.toString()
          }
        });

      case 'DELETE':
        // Delete food pantry
        if (!id) {
          return createErrorResponse(400, 'Food pantry ID required');
        }

        const deletedPantry = await FoodPantry.findByIdAndDelete(id);
        if (!deletedPantry) {
          return createErrorResponse(404, 'Food pantry not found');
        }

        return createResponse(200, { success: true, message: 'Food pantry deleted successfully' });

      default:
        return createErrorResponse(405, 'Method Not Allowed');
    }

  } catch (error) {
    console.error('Admin food pantries error:', error);
    return createErrorResponse(500, 'Internal server error');
  }
};