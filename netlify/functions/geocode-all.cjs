const { connectDB } = require('./utils/db.js');
const { HarvestLocation, FoodPantry } = require('./utils/models.js');

// Geocoding function using Mapbox
async function geocodeAddress(addressObj) {
  try {
    const fullAddress = `${addressObj.street}, ${addressObj.city}, ${addressObj.state} ${addressObj.zip}`;
    const apiKey = process.env.MAPBOX_ACCESS_TOKEN;
    
    if (!apiKey) {
      console.warn('MAPBOX_ACCESS_TOKEN not set, skipping geocoding');
      return null;
    }

    console.log(`Geocoding: ${fullAddress}`);
    
    // Add delay to respect rate limits
    await new Promise(resolve => setTimeout(resolve, 200));

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
        console.log(`✅ Geocoded: ${coordinates.latitude}, ${coordinates.longitude}`);
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

// Main geocoding function
async function geocodeAll() {
  try {
    await connectDB();
    console.log('🌍 Starting geocoding process...');
    
    // Geocode Harvest Locations
    console.log('\n📍 Geocoding Harvest Locations...');
    const harvestLocations = await HarvestLocation.find({ isActive: true });
    
    for (const location of harvestLocations) {
      console.log(`\nProcessing location: ${location.name}`);
      const coordinates = await geocodeAddress(location.address);
      
      if (coordinates) {
        await HarvestLocation.findByIdAndUpdate(location._id, { coordinates });
        console.log(`Updated ${location.name} with coordinates`);
      } else {
        console.log(`Failed to geocode ${location.name}`);
      }
    }
    
    // Geocode Food Pantries
    console.log('\n🏪 Geocoding Food Pantries...');
    const foodPantries = await FoodPantry.find({ isActive: true, 'address.street': { $exists: true, $ne: '' } });
    
    for (const pantry of foodPantries) {
      if (pantry.address && pantry.address.street) {
        console.log(`\nProcessing pantry: ${pantry.name}`);
        const coordinates = await geocodeAddress(pantry.address);
        
        if (coordinates) {
          await FoodPantry.findByIdAndUpdate(pantry._id, { coordinates });
          console.log(`Updated ${pantry.name} with coordinates`);
        } else {
          console.log(`Failed to geocode ${pantry.name}`);
        }
      } else {
        console.log(`Skipping ${pantry.name} - no address`);
      }
    }
    
    console.log('\n✅ Geocoding complete!');
    
    // Output results for seeder update
    console.log('\n📋 Results for seeder update:');
    
    const updatedLocations = await HarvestLocation.find({ isActive: true }).lean();
    console.log('\n// Harvest Locations with coordinates:');
    updatedLocations.forEach(location => {
      if (location.coordinates) {
        console.log(`// ${location.name}: { latitude: ${location.coordinates.latitude}, longitude: ${location.coordinates.longitude} }`);
      }
    });
    
    const updatedPantries = await FoodPantry.find({ isActive: true, coordinates: { $exists: true } }).lean();
    console.log('\n// Food Pantries with coordinates:');
    updatedPantries.forEach(pantry => {
      if (pantry.coordinates) {
        console.log(`// ${pantry.name}: { latitude: ${pantry.coordinates.latitude}, longitude: ${pantry.coordinates.longitude} }`);
      }
    });
    
  } catch (error) {
    console.error('Geocoding process failed:', error);
    process.exit(1);
  }
}

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }
  
  try {
    await geocodeAll();
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true, 
        message: 'Geocoding completed successfully' 
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        success: false, 
        error: error.message 
      })
    };
  }
};

// Allow running directly from command line
if (require.main === module) {
  geocodeAll().then(() => {
    console.log('Process complete');
    process.exit(0);
  }).catch(error => {
    console.error('Process failed:', error);
    process.exit(1);
  });
}