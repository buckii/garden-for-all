const { connectDB } = require('./utils/db.js');
const { validateToken, extractToken, createResponse, createErrorResponse, handleCORS } = require('./utils/auth.js');
const { HarvestLocation } = require('./utils/models.js');

exports.handler = async function(event, context) {
  if (event.httpMethod === 'OPTIONS') {
    return handleCORS();
  }

  try {
    await connectDB();

    // Validate authentication for all methods except GET
    if (event.httpMethod !== 'GET') {
      const token = extractToken(event.headers.authorization);
      if (!token) {
        return createErrorResponse(401, 'Authorization token required');
      }
      await validateToken(token);
    }

    if (event.httpMethod === 'GET') {
      return await getLocations(event);
    } else if (event.httpMethod === 'POST') {
      return await createLocation(event);
    } else if (event.httpMethod === 'PUT') {
      return await updateLocation(event);
    } else if (event.httpMethod === 'DELETE') {
      return await deleteLocation(event);
    } else {
      return createErrorResponse(405, 'Method Not Allowed');
    }
  } catch (error) {
    console.error('Harvest Locations API error:', error);
    return createErrorResponse(500, 'Internal server error');
  }
};

async function getLocations(event) {
  try {
    const locations = await HarvestLocation.find({ isActive: true })
      .sort({ name: 1 })
      .lean();

    return createResponse(200, {
      success: true,
      data: locations
    });
  } catch (error) {
    console.error('Get locations error:', error);
    return createErrorResponse(500, 'Failed to fetch locations');
  }
}

async function geocodeAddress(addressObj) {
  try {
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

async function createLocation(event) {
  try {
    const locationData = JSON.parse(event.body);
    
    // Validate required fields
    if (!locationData.name || !locationData.address?.street || !locationData.address?.city || 
        !locationData.address?.state || !locationData.address?.zip) {
      return createErrorResponse(400, 'Missing required fields: name, address (street, city, state, zip)');
    }

    // Geocode the address
    const coordinates = await geocodeAddress(locationData.address);

    const location = new HarvestLocation({
      name: locationData.name.trim(),
      address: {
        street: locationData.address.street.trim(),
        city: locationData.address.city.trim(),
        state: locationData.address.state.trim(),
        zip: locationData.address.zip.trim()
      },
      coordinates: coordinates,
      isActive: true
    });

    await location.save();

    const response = {
      success: true,
      data: location
    };

    // Add warning if geocoding failed
    if (!coordinates) {
      response.warning = 'Location saved but geocoding failed. Coordinates not available.';
    }

    return createResponse(201, response);
  } catch (error) {
    console.error('Create location error:', error);
    return createErrorResponse(500, 'Failed to create location');
  }
}

async function updateLocation(event) {
  try {
    const locationId = event.queryStringParameters?.id;
    
    if (!locationId) {
      return createErrorResponse(400, 'Location ID is required');
    }

    const updateData = JSON.parse(event.body);
    
    // Find the location
    const location = await HarvestLocation.findById(locationId);
    if (!location) {
      return createErrorResponse(404, 'Location not found');
    }

    // Update fields
    if (updateData.name) location.name = updateData.name.trim();
    if (updateData.address) {
      // Check if address actually changed
      const addressChanged = 
        updateData.address.street !== location.address.street ||
        updateData.address.city !== location.address.city ||
        updateData.address.state !== location.address.state ||
        updateData.address.zip !== location.address.zip;
      
      location.address = {
        street: updateData.address.street?.trim() || location.address.street,
        city: updateData.address.city?.trim() || location.address.city,
        state: updateData.address.state?.trim() || location.address.state,
        zip: updateData.address.zip?.trim() || location.address.zip
      };
      
      // Re-geocode only if address actually changed
      if (addressChanged) {
        const coordinates = await geocodeAddress(location.address);
        // Always update coordinates - either with new ones or null if geocoding failed
        location.coordinates = coordinates;
      }
    }
    
    if (updateData.isActive !== undefined) {
      location.isActive = updateData.isActive;
    }

    await location.save();

    const response = {
      success: true,
      data: location
    };

    // Add warning if location has no coordinates
    if (!location.coordinates) {
      response.warning = 'Location updated but geocoding failed. Coordinates not available.';
    }

    return createResponse(200, response);
  } catch (error) {
    console.error('Update location error:', error);
    return createErrorResponse(500, 'Failed to update location');
  }
}

async function deleteLocation(event) {
  try {
    const locationId = event.queryStringParameters?.id;
    
    if (!locationId) {
      return createErrorResponse(400, 'Location ID is required');
    }

    // Soft delete by setting isActive to false
    const location = await HarvestLocation.findByIdAndUpdate(
      locationId,
      { isActive: false },
      { new: true }
    );

    if (!location) {
      return createErrorResponse(404, 'Location not found');
    }

    return createResponse(200, {
      success: true,
      message: 'Location deactivated successfully'
    });
  } catch (error) {
    console.error('Delete location error:', error);
    return createErrorResponse(500, 'Failed to delete location');
  }
}