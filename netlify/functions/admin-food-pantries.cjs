const Joi = require('joi');
const { connectDB } = require('./utils/db.js');
const { FoodPantry } = require('./utils/models.js');
const { validateToken, extractToken, createResponse, createErrorResponse, handleCORS } = require('./utils/auth.js');

async function geocodeAddress(addressObj) {
  try {
    // Check if we have all required address components
    if (!addressObj?.street || !addressObj?.city || !addressObj?.state || !addressObj?.zip) {
      return null;
    }

    const fullAddress = `${addressObj.street}, ${addressObj.city}, ${addressObj.state} ${addressObj.zip}`;
    const apiKey = process.env.MAPBOX_ACCESS_TOKEN;
    
    if (!apiKey) {
      console.warn('MAPBOX_ACCESS_TOKEN not set, skipping geocoding');
      return null;
    }

    const geocodeUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(fullAddress)}.json?access_token=${apiKey}&limit=1`;
    
    const response = await fetch(geocodeUrl);
    
    if (!response.ok) {
      console.error('Mapbox Geocoding API error:', response.status, response.statusText);
      return null;
    }

    const data = await response.json();
    
    if (data && data.features && data.features.length > 0) {
      const feature = data.features[0];
      
      if (feature.geometry && feature.geometry.coordinates && Array.isArray(feature.geometry.coordinates) && feature.geometry.coordinates.length >= 2) {
        const coordinates = {
          latitude: feature.geometry.coordinates[1], // Mapbox returns [longitude, latitude]
          longitude: feature.geometry.coordinates[0]
        };
        return coordinates;
      }
    }
    
    console.warn('No geocoding results found for address:', fullAddress);
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

const foodPantrySchema = Joi.object({
  name: Joi.string().required(),
  contactInfo: Joi.object({
    phone: Joi.string().allow('').optional(),
    email: Joi.string().email().allow('').optional()
  }).optional(),
  address: Joi.object({
    street: Joi.string().allow('').optional(),
    city: Joi.string().allow('').optional(),
    state: Joi.string().allow('').optional(),
    zip: Joi.string().allow('').optional()
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

    const { httpMethod, path } = event;
    // Parse ID from path: /admin-food-pantries/[id]
    const pathSegments = path.split('/').filter(Boolean);
    const id = pathSegments.length > 1 ? pathSegments[pathSegments.length - 1] : null;

    switch (httpMethod) {
      case 'POST':
        // Create food pantry
        const body = JSON.parse(event.body || '{}');
        const { error } = foodPantrySchema.validate(body);
        
        if (error) {
          return createErrorResponse(400, `Validation error: ${error.details[0].message}`);
        }

        // Geocode the address if provided
        const geocodedCoordinates = body.address ? await geocodeAddress(body.address) : null;

        const foodPantry = new FoodPantry({
          ...body,
          coordinates: geocodedCoordinates
        });
        await foodPantry.save();

        const responseData = {
          success: true, 
          data: {
            ...foodPantry.toObject(),
            id: foodPantry._id.toString()
          }
        };

        // Add warning if geocoding failed
        if (body.address && !geocodedCoordinates) {
          responseData.warning = 'Pantry saved but geocoding failed. Coordinates not available.';
        }
        
        return createResponse(201, responseData);

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

        // Find the existing pantry
        const existingPantry = await FoodPantry.findById(id);
        if (!existingPantry) {
          return createErrorResponse(404, 'Food pantry not found');
        }

        // Check if address changed and re-geocode if needed
        let updatedCoordinates = existingPantry.coordinates;
        if (updateBody.address) {
          const addressChanged = 
            updateBody.address.street !== existingPantry.address?.street ||
            updateBody.address.city !== existingPantry.address?.city ||
            updateBody.address.state !== existingPantry.address?.state ||
            updateBody.address.zip !== existingPantry.address?.zip;

          if (addressChanged) {
            updatedCoordinates = await geocodeAddress(updateBody.address);
          }
        }

        const updatedPantry = await FoodPantry.findByIdAndUpdate(
          id,
          {
            ...updateBody,
            coordinates: updatedCoordinates
          },
          { new: true, runValidators: true }
        );

        const updateResponse = { 
          success: true, 
          data: {
            ...updatedPantry.toObject(),
            id: updatedPantry._id.toString()
          }
        };

        // Add warning if location has no coordinates
        if (updateBody.address && !updatedPantry.coordinates) {
          updateResponse.warning = 'Pantry updated but geocoding failed. Coordinates not available.';
        }

        return createResponse(200, updateResponse);

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