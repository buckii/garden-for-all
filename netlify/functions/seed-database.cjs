const { connectDB } = require('./utils/db.js');
const { ProduceCategory, ProduceType, HarvestLocation, FoodPantry, HarvestEntry, Commitment, Order } = require('./utils/models.js');
const { User } = require('./utils/User.js');
const { createResponse, createErrorResponse } = require('./utils/auth.js');
const fs = require('fs');
const path = require('path');

// Categories with display order
const categories = [
  { name: 'Fruit', description: 'Fresh fruits and berries', displayOrder: 1 },
  { name: 'Greens', description: 'Leafy greens and salad vegetables', displayOrder: 2 },
  { name: 'Herbs', description: 'Fresh herbs and aromatics', displayOrder: 3 },
  { name: 'Vegetables', description: 'General vegetables and root crops', displayOrder: 4 }
];

// Harvest Locations
const harvestLocations = [
  {
    name: 'Farm',
    address: {
      street: '5580 Johnstown-Alexandria Rd',
      city: 'Johnstown',
      state: 'OH', 
      zip: '43031'
    },
    coordinates: {
      latitude: 40.1375,
      longitude: -82.6672
    }
  },
  {
    name: 'Garden',
    address: {
      street: '5101 Johnstown Rd.',
      city: 'New Albany',
      state: 'OH',
      zip: '43054'
    },
    coordinates: {
      latitude: 40.061204,
      longitude: -82.835151
    }
  }
];

function parseQuantityAndUnit(quantityStr) {
  if (!quantityStr) {
    return { quantity: 0, unit: 'pounds' };
  }
  
  // Clean the string and convert to lowercase for matching
  const cleaned = quantityStr.toLowerCase().trim();
  
  // Extract number from the beginning of the string
  const numberMatch = cleaned.match(/^(\d+(?:\.\d+)?)/);
  const quantity = numberMatch ? parseFloat(numberMatch[1]) : 0;
  
  // Map to new unit system
  if (cleaned.includes('pint') || cleaned.includes('berry') || cleaned.includes('raspberry')) {
    return { quantity, unit: 'half-pints' };
  }
  if (cleaned.includes('bunch') || cleaned.includes('bouquet') || cleaned.includes('flower')) {
    return { quantity, unit: 'bouquets' };
  }
  
  // Default to pounds for everything else
  return { quantity, unit: 'pounds' };
}


function loadDataFromCSV() {
  try {
    // Try multiple possible paths for the CSV file
    const possiblePaths = [
      path.resolve('data/harvestentries.csv'),  // From root directory
      path.resolve('../../data/harvestentries.csv'),  // From functions directory
      path.resolve(__dirname, '../../data/harvestentries.csv')  // Relative to this file
    ];
    
    let csvPath = null;
    for (const testPath of possiblePaths) {
      if (fs.existsSync(testPath)) {
        csvPath = testPath;
        break;
      }
    }
    
    if (!csvPath) {
      throw new Error(`CSV file not found. Tried paths: ${possiblePaths.join(', ')}`);
    }
    
    console.log(`Loading CSV from: ${csvPath}`);
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n');
    const header = lines[0].split('\t');
    
    // Clean and log header for debugging
    const cleanHeader = header.map(col => col.trim());
    console.log('CSV Header columns:', cleanHeader);
    
    // Find column indices dynamically from first row
    const typeIndex = cleanHeader.findIndex(col => col === 'Type');
    const productIndex = cleanHeader.findIndex(col => col === 'Product');
    const quantityIndex = cleanHeader.findIndex(col => col === 'Quantity');
    const weightIndex = cleanHeader.findIndex(col => col === 'Weight (lbs)');
    const dateIndex = cleanHeader.findIndex(col => col === 'Delivery Date');
    
    // Find Month and Year columns (if they exist) to skip them
    const monthIndex = cleanHeader.findIndex(col => col === 'Month');
    const yearIndex = cleanHeader.findIndex(col => col === 'Year');
    
    // Find Pantry column - should be the last column after skipping Month/Year
    let pantryIndex = cleanHeader.findIndex(col => col === 'Pantry');
    
    // If Pantry column not found by name, use the last column that's not Month or Year
    if (pantryIndex === -1) {
      for (let i = cleanHeader.length - 1; i >= 0; i--) {
        if (i !== monthIndex && i !== yearIndex && cleanHeader[i] !== '') {
          pantryIndex = i;
          console.log(`Using column "${cleanHeader[i]}" at index ${i} as Pantry column`);
          break;
        }
      }
    }
    
    console.log('Column indices:', {
      type: typeIndex,
      product: productIndex,
      quantity: quantityIndex,
      weight: weightIndex,
      date: dateIndex,
      month: monthIndex,
      year: yearIndex,
      pantry: pantryIndex
    });
    
    if (typeIndex === -1 || productIndex === -1 || weightIndex === -1 || dateIndex === -1) {
      throw new Error('Required columns (Type, Product, Weight, Delivery Date) not found in CSV');
    }
    
    const uniqueProducts = new Set();
    const produceData = [];
    const harvestEntries = [];
    
    // Category mapping from CSV to database categories
    const categoryMapping = {
      'Fruit': 'Fruit',
      'Greens': 'Greens', 
      'Herbs': 'Herbs',
      'Vegetables': 'Vegetables'
    };
    
    // Default values for missing nutritional/pricing data
    const defaultValues = {
      'Fruit': { servingWeightOz: 5.0, servingsPerLb: 3.2, pricePerLb: 2.0, conversionFactor: 1.0, unitType: 'pounds' },
      'Greens': { servingWeightOz: 3.0, servingsPerLb: 5.33, pricePerLb: 2.5, conversionFactor: 1.0, unitType: 'pounds' },
      'Herbs': { servingWeightOz: 0.5, servingsPerLb: 32.0, pricePerLb: 8.0, conversionFactor: 1.0, unitType: 'bouquets' },
      'Vegetables': { servingWeightOz: 4.0, servingsPerLb: 4.0, pricePerLb: 1.5, conversionFactor: 1.0, unitType: 'pounds' }
    };
    
    // Process each line
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const columns = line.split('\t');
      const type = columns[typeIndex]?.trim();
      const product = columns[productIndex]?.trim();
      const quantityStr = columns[quantityIndex]?.trim() || '';
      const weightStr = columns[weightIndex]?.trim();
      const weight = weightStr ? parseFloat(weightStr) : 0;
      const dateStr = columns[dateIndex]?.trim();
      const pantry = columns[pantryIndex]?.trim() || '';
      
      if (!type || !product || !dateStr) continue;
      
      // Parse quantity and unit from quantity string
      const { quantity, unit } = parseQuantityAndUnit(quantityStr);
      
      // Parse date (format appears to be M/D/YY)
      let harvestDate;
      try {
        const dateParts = dateStr.split('/');
        if (dateParts.length === 3) {
          const month = parseInt(dateParts[0]);
          const day = parseInt(dateParts[1]);
          let year = parseInt(dateParts[2]);
          
          // Convert 2-digit year to 4-digit year
          if (year < 50) {
            year += 2000;
          } else if (year < 100) {
            year += 1900;
          }
          
          harvestDate = new Date(year, month - 1, day);
        } else {
          harvestDate = new Date(dateStr);
        }
      } catch (e) {
        console.warn(`Invalid date format: ${dateStr}, skipping entry`);
        continue;
      }
      
      // Add unique products (case-insensitive, by product name only)
      const productKey = product.toLowerCase();
      if (!uniqueProducts.has(productKey)) {
        uniqueProducts.add(productKey);
        
        const mappedCategory = categoryMapping[type] || 'Vegetables';
        const defaults = defaultValues[mappedCategory] || defaultValues['Vegetables'];
        
        produceData.push({
          category: mappedCategory,
          name: product,
          unitType: defaults.unitType,
          servingWeightOz: defaults.servingWeightOz,
          servingsPerLb: defaults.servingsPerLb,
          pricePerLb: defaults.pricePerLb,
          conversionFactor: defaults.conversionFactor
        });
      }
      
      // Add harvest entry
      harvestEntries.push({
        type: type,
        product: product,
        notes: quantityStr, // Store original quantity string as notes
        weight: weight,
        harvestDate: harvestDate,
        pantry: pantry,
        quantity: quantity,
        unit: unit
      });
    }
    
    console.log(`Loaded ${produceData.length} unique products and ${harvestEntries.length} harvest entries from CSV`);
    
    // Log all unique produce type names for debugging
    console.log('Unique produce types found:');
    const sortedProduceData = produceData.sort((a, b) => a.name.localeCompare(b.name));
    sortedProduceData.forEach(item => {
      console.log(`  ${item.category}: ${item.name} (${item.unitType})`);
    });
    
    return { produceData, harvestEntries };
    
  } catch (error) {
    console.error('Error loading CSV data:', error);
    throw error;
  }
}

// Load data from CSV
const { produceData, harvestEntries } = loadDataFromCSV();

// 2025 Weekly Commitment Schedule for Broad Street Food Pantry (Mondays)
const broadStreetCommitments = [
  // Lettuce weeks (Apr-Jun)
  { week: '2025-04-21', produce: 'Lettuce', weight: 25 },
  { week: '2025-04-28', produce: 'Lettuce', weight: 25 },
  { week: '2025-05-05', produce: 'Lettuce', weight: 25 },
  { week: '2025-05-12', produce: 'Lettuce', weight: 25 },
  { week: '2025-05-19', produce: 'Lettuce', weight: 25 },
  { week: '2025-05-26', produce: 'Lettuce', weight: 25 },
  { week: '2025-06-02', produce: 'Lettuce', weight: 25 },
  { week: '2025-06-09', produce: 'Lettuce', weight: 25 },
  { week: '2025-06-16', produce: 'Lettuce', weight: 25 },
  { week: '2025-06-23', produce: 'Lettuce', weight: 25 },
  
  // Mixed weeks starting Jun 30 (Monday)
  { week: '2025-06-30', produce: 'Okra', weight: 15 },
  { week: '2025-06-30', produce: 'Cherry Tomatoes', weight: 30 },
  { week: '2025-06-30', produce: 'Carrots', weight: 75 },
  
  // July weeks
  { week: '2025-07-07', produce: 'Okra', weight: 15 },
  { week: '2025-07-07', produce: 'Cherry Tomatoes', weight: 30 },
  { week: '2025-07-07', produce: 'Raspberries', weight: 25 },
  
  { week: '2025-07-14', produce: 'Okra', weight: 15 },
  { week: '2025-07-14', produce: 'Cherry Tomatoes', weight: 30 },
  { week: '2025-07-14', produce: 'Raspberries', weight: 25 },
  
  { week: '2025-07-21', produce: 'Okra', weight: 15 },
  { week: '2025-07-21', produce: 'Cherry Tomatoes', weight: 30 },
  { week: '2025-07-21', produce: 'Raspberries', weight: 25 },
  
  { week: '2025-07-28', produce: 'Okra', weight: 15 },
  { week: '2025-07-28', produce: 'Cherry Tomatoes', weight: 30 },
  { week: '2025-07-28', produce: 'Raspberries', weight: 25 },
  { week: '2025-07-28', produce: 'Carrots', weight: 75 },
  
  // August weeks
  { week: '2025-08-04', produce: 'Okra', weight: 15 },
  { week: '2025-08-04', produce: 'Cherry Tomatoes', weight: 30 },
  { week: '2025-08-04', produce: 'Raspberries', weight: 25 },
  
  { week: '2025-08-11', produce: 'Okra', weight: 15 },
  { week: '2025-08-11', produce: 'Cherry Tomatoes', weight: 30 },
  { week: '2025-08-11', produce: 'Raspberries', weight: 25 },
  
  { week: '2025-08-18', produce: 'Okra', weight: 15 },
  { week: '2025-08-18', produce: 'Cherry Tomatoes', weight: 30 },
  { week: '2025-08-18', produce: 'Raspberries', weight: 25 },
  
  { week: '2025-08-25', produce: 'Okra', weight: 15 },
  { week: '2025-08-25', produce: 'Cherry Tomatoes', weight: 30 },
  { week: '2025-08-25', produce: 'Raspberries', weight: 25 },
  { week: '2025-08-25', produce: 'Carrots', weight: 75 },
  
  // September weeks
  { week: '2025-09-01', produce: 'Okra', weight: 15 },
  { week: '2025-09-01', produce: 'Cherry Tomatoes', weight: 30 },
  { week: '2025-09-01', produce: 'Raspberries', weight: 25 },
  
  { week: '2025-09-08', produce: 'Okra', weight: 15 },
  { week: '2025-09-08', produce: 'Cherry Tomatoes', weight: 30 },
  { week: '2025-09-08', produce: 'Raspberries', weight: 25 },
  
  { week: '2025-09-15', produce: 'Okra', weight: 15 },
  { week: '2025-09-15', produce: 'Cherry Tomatoes', weight: 30 },
  { week: '2025-09-15', produce: 'Raspberries', weight: 25 },
  
  { week: '2025-09-22', produce: 'Okra', weight: 15 },
  { week: '2025-09-22', produce: 'Cherry Tomatoes', weight: 30 },
  { week: '2025-09-22', produce: 'Raspberries', weight: 25 },
  { week: '2025-09-22', produce: 'Carrots', weight: 75 },
  
  { week: '2025-09-29', produce: 'Okra', weight: 15 },
  { week: '2025-09-29', produce: 'Cherry Tomatoes', weight: 30 },
  { week: '2025-09-29', produce: 'Raspberries', weight: 25 }
];

// Central Ohio food pantries based on Garden for All data
const foodPantries = [
  {
    name: 'GRIN (Gahanna Residents in Need)',
    county: 'Franklin County',
    contactInfo: {
      phone: '(614) 214-4747',
      email: 'info@grin4gahanna.org',
      address: '165 Granville Street, Gahanna, OH 43230'
    },
    commitmentAmounts: {
      total: 1800,
      vegetables: 700,
      fruits: 600,
      herbs: 200,
      flowers: 300
    },
    isActive: true
  },
  {
    name: 'Broad Street Food Pantry',
    county: 'Franklin County',
    contactInfo: {
      phone: '(614) 221-6552',
      email: 'foodpantry@bspc.org',
      address: '760 East Broad Street, Columbus, OH 43205'
    },
    address: {
      street: '760 East Broad Street',
      city: 'Columbus',
      state: 'OH',
      zip: '43205'
    },
    coordinates: {
      latitude: 39.965287,
      longitude: -82.979862
    },
    commitmentAmounts: {
      total: 2200,
      vegetables: 900,
      fruits: 700,
      herbs: 300,
      flowers: 300
    },
    isActive: true
  },
  {
    name: 'New Albany Food Pantry (NAFP)',
    county: 'Franklin County',
    contactInfo: {
      phone: '(614) 855-4265',
      email: 'info@newalbanyfoodpantry.org',
      address: '79 N. High St, New Albany, OH 43054'
    },
    address: {
      street: '79 N. High St',
      city: 'New Albany',
      state: 'OH',
      zip: '43054'
    },
    coordinates: {
      latitude: 40.084586,
      longitude: -82.80907
    },
    commitmentAmounts: {
      total: 1500,
      vegetables: 600,
      fruits: 500,
      herbs: 200,
      flowers: 200
    },
    isActive: true
  },
  {
    name: 'Vineyard Columbus Northside Food Pantry',
    county: 'Franklin County',
    contactInfo: {
      phone: '(614) 268-0477',
      email: 'northside@vineyardcolumbus.org',
      address: '4664 Cleveland Avenue, Columbus, OH 43231'
    },
    commitmentAmounts: {
      total: 1400,
      vegetables: 600,
      fruits: 400,
      herbs: 200,
      flowers: 200
    },
    isActive: true
  },
  {
    name: 'Motherful Columbus',
    county: 'Franklin County',
    contactInfo: {
      phone: '(614) 735-8467',
      email: 'info@motherful.org',
      address: '254 Agler Rd, Columbus, OH 43219'
    },
    commitmentAmounts: {
      total: 1000,
      vegetables: 450,
      fruits: 350,
      herbs: 100,
      flowers: 100
    },
    isActive: true
  },
  {
    name: 'Food Pantry Network - Brice Street',
    county: 'Licking County',
    contactInfo: {
      phone: '(740) 344-7401',
      email: 'info@fpnlc.org',
      address: '1035 Brice Street, Newark, OH 43055'
    },
    commitmentAmounts: {
      total: 1600,
      vegetables: 700,
      fruits: 500,
      herbs: 200,
      flowers: 200
    },
    isActive: true
  },
  {
    name: 'Faith Care Ministry',
    county: 'Licking County',
    contactInfo: {
      phone: '(614) 555-0123',
      email: 'info@faithcare.org',
      address: 'Central Ohio (Contact for specific location)'
    },
    commitmentAmounts: {
      total: 800,
      vegetables: 350,
      fruits: 250,
      herbs: 100,
      flowers: 100
    },
    isActive: true
  },
  {
    name: 'Market Street Community Pantry',
    county: 'Licking County',
    contactInfo: {
      phone: '(614) 555-0456',
      email: 'info@marketstreetpantry.org',
      address: 'Columbus, OH (Contact for specific location)'
    },
    commitmentAmounts: {
      total: 1200,
      vegetables: 500,
      fruits: 400,
      herbs: 150,
      flowers: 150
    },
    isActive: true
  },
  {
    name: 'Community Bags Food Pantry',
    county: 'Licking County',
    contactInfo: {
      phone: '(614) 555-0789',
      email: 'bags@communityhelp.org',
      address: 'Columbus, OH (Contact for specific location)'
    },
    commitmentAmounts: {
      total: 900,
      vegetables: 400,
      fruits: 300,
      herbs: 100,
      flowers: 100
    },
    isActive: true
  },
  {
    name: 'New Albany Farmers Market',
    county: 'Franklin County',
    contactInfo: {
      phone: '(614) 855-4265',
      email: 'market@newalbanyfarmersmarket.org',
      address: 'New Albany, OH 43054'
    },
    commitmentAmounts: {
      total: 1100,
      vegetables: 500,
      fruits: 350,
      herbs: 125,
      flowers: 125
    },
    isActive: true
  },
  {
    name: 'Northridge Food Pantry',
    county: 'Licking County',
    contactInfo: {
      phone: '(614) 555-0100',
      email: 'info@northridgepantry.org',
      address: 'Northridge, OH (Contact for specific location)'
    },
    commitmentAmounts: {
      total: 1300,
      vegetables: 600,
      fruits: 400,
      herbs: 150,
      flowers: 150
    },
    isActive: true
  },
  {
    name: 'Common Ground Free Store',
    county: 'Franklin County',
    contactInfo: {
      phone: '(614) 555-0101',
      email: 'info@commonground.org',
      address: 'Columbus, OH (Contact for specific location)'
    },
    commitmentAmounts: {
      total: 800,
      vegetables: 400,
      fruits: 250,
      herbs: 75,
      flowers: 75
    },
    isActive: true
  },
  {
    name: 'NNEMAP Food Pantry',
    county: 'Franklin County',
    contactInfo: {
      phone: '(614) 555-0102',
      email: 'info@nnemap.org',
      address: 'Columbus, OH (Contact for specific location)'
    },
    commitmentAmounts: {
      total: 900,
      vegetables: 450,
      fruits: 300,
      herbs: 75,
      flowers: 75
    },
    isActive: true
  },
  {
    name: 'In The Garden',
    county: 'Franklin County',
    contactInfo: {
      phone: '(614) 555-0103',
      email: 'info@inthegarden.org',
      address: 'Columbus, OH (Contact for specific location)'
    },
    commitmentAmounts: {
      total: 600,
      vegetables: 300,
      fruits: 200,
      herbs: 50,
      flowers: 50
    },
    isActive: true
  },
  {
    name: 'Church Pantry',
    county: 'Franklin County',
    contactInfo: {
      phone: '(614) 555-0104',
      email: 'info@churchpantry.org',
      address: 'Columbus, OH (Contact for specific location)'
    },
    commitmentAmounts: {
      total: 700,
      vegetables: 350,
      fruits: 250,
      herbs: 50,
      flowers: 50
    },
    isActive: true
  },
  {
    name: 'Other',
    county: 'Other',
    contactInfo: {
      phone: '(614) 555-0105',
      email: 'info@other.org',
      address: 'Various Locations'
    },
    commitmentAmounts: {
      total: 500,
      vegetables: 250,
      fruits: 150,
      herbs: 50,
      flowers: 50
    },
    isActive: true
  },
  {
    name: 'Stygler Food Pantry',
    county: 'Other',
    contactInfo: {
      phone: '(614) 555-0106',
      email: 'info@stygler.org',
      address: 'Contact for specific location'
    },
    commitmentAmounts: {
      total: 400,
      vegetables: 200,
      fruits: 100,
      herbs: 50,
      flowers: 50
    },
    isActive: true
  },
  {
    name: 'OSU Newark Student Food Pantry (Campus Corner)',
    county: 'Licking County',
    contactInfo: {
      phone: '(740) 364-9578',
      email: 'campuscornerpantry@osu.edu',
      address: 'John L. and Christine Warner Library and Student Center, Room 233, 1179 University Drive, Newark, OH 43055'
    },
    address: {
      street: '1179 University Drive',
      city: 'Newark',
      state: 'OH',
      zip: '43055'
    },
    coordinates: {
      latitude: 40.058396,
      longitude: -82.401842
    },
    commitmentAmounts: {
      total: 1200,
      vegetables: 500,
      fruits: 400,
      herbs: 150,
      flowers: 150
    },
    isActive: true
  }
];

exports.handler = async function(event, context) {
  // Only allow POST requests for seeding
  if (event.httpMethod !== 'POST') {
    return createErrorResponse(405, 'Method Not Allowed');
  }

  try {
    await connectDB();

    // Parse request body to check for options
    const body = JSON.parse(event.body || '{}');
    const shouldClearData = body.clearData === true;
    let allHistoricalData = body.allHistoricalData === true;

    // Clear existing data only if requested
    if (shouldClearData) {
      console.log('Clearing existing data...');
      await Order.deleteMany({});
      await HarvestEntry.deleteMany({});
      await Commitment.deleteMany({});
      await ProduceType.deleteMany({});
      await ProduceCategory.deleteMany({});
      await FoodPantry.deleteMany({});
    }

    // Create categories (only if they don't exist or if we cleared data)
    console.log('Creating categories...');
    let createdCategories;
    if (shouldClearData) {
      createdCategories = await ProduceCategory.insertMany(categories);
      console.log(`Created ${createdCategories.length} categories`);
    } else {
      // Get existing categories or create missing ones
      createdCategories = [];
      for (const categoryData of categories) {
        let category = await ProduceCategory.findOne({ 
          name: { $regex: new RegExp(`^${categoryData.name}$`, 'i') } 
        });
        if (!category) {
          category = await ProduceCategory.create(categoryData);
          console.log(`Created new category: ${category.name}`);
        }
        createdCategories.push(category);
      }
    }

    // Create a mapping of category names to IDs
    const categoryMap = {};
    createdCategories.forEach(category => {
      categoryMap[category.name] = category._id;
    });

    // Upsert harvest locations based on name
    console.log('Upserting harvest locations...');
    const createdLocations = [];
    
    for (const locationData of harvestLocations) {
      // Find existing location by name (case-insensitive)
      const existingLocation = await HarvestLocation.findOne({ 
        name: { $regex: new RegExp(`^${locationData.name}$`, 'i') } 
      });
      
      if (existingLocation) {
        // Check if address has changed
        const addressChanged = 
          existingLocation.address.street !== locationData.address.street ||
          existingLocation.address.city !== locationData.address.city ||
          existingLocation.address.state !== locationData.address.state ||
          existingLocation.address.zip !== locationData.address.zip;
        
        if (addressChanged) {
          console.log(`Address changed for ${locationData.name}, updating and re-geocoding...`);
          existingLocation.address = locationData.address;
          existingLocation.coordinates = locationData.coordinates; // Use provided coordinates
          await existingLocation.save();
          console.log(`Updated harvest location: ${existingLocation.name}`);
        } else {
          console.log(`Found existing harvest location (no changes): ${existingLocation.name}`);
        }
        createdLocations.push(existingLocation);
      } else {
        // Create new location
        const newLocation = await HarvestLocation.create(locationData);
        console.log(`Created harvest location: ${newLocation.name}`);
        createdLocations.push(newLocation);
      }
    }
    console.log(`Using ${createdLocations.length} harvest locations`);

    // Create produce types with category references and pricing data
    console.log('Creating produce types...');
    let createdProduceTypes;
    if (shouldClearData) {
      const produceTypes = produceData.map(item => ({
        name: item.name,
        categoryId: categoryMap[item.category],
        unitType: item.unitType,
        conversionFactor: item.conversionFactor,
        servingWeightOz: item.servingWeightOz,
        servingsPerLb: item.servingsPerLb,
        pricePerLb: item.pricePerLb
      }));
      createdProduceTypes = await ProduceType.insertMany(produceTypes);
      console.log(`Created ${createdProduceTypes.length} produce types`);
    } else {
      // Update existing or create new produce types
      createdProduceTypes = [];
      for (const item of produceData) {
        const produceData_item = {
          name: item.name,
          categoryId: categoryMap[item.category],
          unitType: item.unitType,
          conversionFactor: item.conversionFactor,
          servingWeightOz: item.servingWeightOz,
          servingsPerLb: item.servingsPerLb,
          pricePerLb: item.pricePerLb
        };
        
        const existing = await ProduceType.findOne({ 
          name: { $regex: new RegExp(`^${item.name}$`, 'i') } 
        });
        if (existing) {
          // Update existing produce type with new pricing data
          const updated = await ProduceType.findByIdAndUpdate(existing._id, produceData_item, { new: true });
          createdProduceTypes.push(updated);
          console.log(`Updated produce type: ${updated.name}`);
        } else {
          // Create new produce type
          const created = await ProduceType.create(produceData_item);
          createdProduceTypes.push(created);
          console.log(`Created new produce type: ${created.name}`);
        }
      }
    }

    // Create food pantries (only if they don't exist or if we cleared data)
    console.log('Creating food pantries...');
    let createdPantries;
    if (shouldClearData) {
      createdPantries = await FoodPantry.insertMany(foodPantries);
      console.log(`Created ${createdPantries.length} food pantries`);
    } else {
      // Get existing pantries or create missing ones
      createdPantries = [];
      for (const pantryData of foodPantries) {
        let pantry = await FoodPantry.findOne({ 
          name: { $regex: new RegExp(`^${pantryData.name}$`, 'i') } 
        });
        if (!pantry) {
          pantry = await FoodPantry.create(pantryData);
          console.log(`Created new food pantry: ${pantry.name}`);
        } else {
          console.log(`Food pantry already exists: ${pantry.name}`);
        }
        createdPantries.push(pantry);
      }
    }

    // Determine import date range
    let importStartDate = null;
    if (!shouldClearData && !allHistoricalData) {
      // Find most recent harvest entry date and start from day before
      const mostRecent = await HarvestEntry.findOne({}, {}, { sort: { harvestDate: -1 } });
      if (mostRecent) {
        importStartDate = new Date(mostRecent.harvestDate);
        importStartDate.setDate(importStartDate.getDate() - 1); // Start from day before most recent
        console.log(`Incremental import: starting from ${importStartDate.toISOString().split('T')[0]} (day before most recent: ${mostRecent.harvestDate.toISOString().split('T')[0]})`);
      } else {
        console.log('No existing harvest entries found, importing all historical data');
        allHistoricalData = true; // Force full import if no existing data
      }
    } else if (allHistoricalData) {
      console.log('Importing all historical data');
    } else {
      console.log('Clearing all data and importing everything');
    }

    // Create harvest entries
    console.log('Creating harvest entries...');
    let createdHarvestEntries = 0;
    const newlyInsertedEntries = []; // Track newly inserted entries for order creation
    
    if (shouldClearData) {
      await HarvestEntry.deleteMany({});
      console.log('Cleared existing harvest entries');
    } else if (importStartDate) {
      // For incremental imports, remove existing entries from import start date onwards
      const deleteResult = await HarvestEntry.deleteMany({ 
        harvestDate: { $gte: importStartDate } 
      });
      console.log(`Cleared ${deleteResult.deletedCount} existing entries from ${importStartDate.toISOString().split('T')[0]} onwards for incremental import`);
    }
    
    // Always process harvest entries to check for new ones
    {
      // Create mappings for lookups (case-insensitive)
      const produceTypeMap = {};
      const allProduceTypes = await ProduceType.find({}).populate('categoryId');
      allProduceTypes.forEach(pt => {
        const categoryName = pt.categoryId.name;
        // Store with lowercase key for case-insensitive lookup
        const key = `${categoryName.toLowerCase()}:${pt.name.toLowerCase()}`;
        produceTypeMap[key] = pt._id;
      });
      
      const pantryMap = {};
      createdPantries.forEach(pantry => {
        // Map common pantry abbreviations
        pantryMap[pantry.name.toLowerCase()] = pantry._id;
        if (pantry.name.includes('Broad Street')) {
          pantryMap['broad st'] = pantry._id;
        }
        if (pantry.name.includes('GRIN')) {
          pantryMap['grin'] = pantry._id;
        }
        if (pantry.name.includes('New Albany')) {
          pantryMap['new albany'] = pantry._id;
          pantryMap['nafp'] = pantry._id;
        }
        if (pantry.name.includes('Vineyard')) {
          pantryMap['vineyard'] = pantry._id;
        }
        if (pantry.name.includes('Motherful')) {
          pantryMap['motherful'] = pantry._id;
        }
        if (pantry.name.includes('Food Pantry Network') && pantry.name.includes('Brice')) {
          pantryMap['fpn brice'] = pantry._id;
        }
        if (pantry.name.includes('Market Street')) {
          pantryMap['market street'] = pantry._id;
        }
        if (pantry.name.includes('Northridge')) {
          pantryMap['northridge'] = pantry._id;
          pantryMap['northridge'] = pantry._id; // Handle case variation
        }
        if (pantry.name.includes('Community Bags')) {
          pantryMap['bags'] = pantry._id;
          pantryMap['community bags'] = pantry._id;
        }
        if (pantry.name.includes('Common Ground')) {
          pantryMap['common ground'] = pantry._id;
        }
        if (pantry.name.includes('NNEMAP')) {
          pantryMap['nnemap'] = pantry._id;
        }
        if (pantry.name.includes('In The Garden')) {
          pantryMap['in the garden'] = pantry._id;
        }
        if (pantry.name.includes('Church')) {
          pantryMap['church'] = pantry._id;
        }
        if (pantry.name.includes('Other')) {
          pantryMap['other'] = pantry._id;
        }
        if (pantry.name.includes('Faith Care')) {
          pantryMap['faith care'] = pantry._id;
        }
        if (pantry.name.includes('Farmers Market') || pantry.name.includes('Farmer\'s Market')) {
          pantryMap['farmer\'s market'] = pantry._id;
          pantryMap['farmers\' market'] = pantry._id;
          pantryMap['farmers market'] = pantry._id;
        }
        if (pantry.name.includes('Stygler')) {
          pantryMap['stygler'] = pantry._id;
        }
        if (pantry.name.includes('OSU Newark') || pantry.name.includes('Campus Corner')) {
          pantryMap['osu newark'] = pantry._id;
          pantryMap['campus corner'] = pantry._id;
          pantryMap['osu'] = pantry._id;
        }
      });
      
      // Use "Other" pantry as default for entries without pantry specified
      const otherPantry = createdPantries.find(p => p.name.includes('Other'));
      const defaultPantryId = otherPantry ? otherPantry._id : (createdPantries.length > 0 ? createdPantries[0]._id : null);
      
      // Prepare batch insert data
      const harvestEntriesToInsert = [];
      let skippedCount = 0;
      let duplicateCount = 0;
      
      // For bulk duplicate detection when not clearing data and importing all historical data
      let existingEntries = [];
      if (!shouldClearData && allHistoricalData) {
        console.log('Loading existing entries for duplicate detection...');
        existingEntries = await HarvestEntry.find({}).select('harvestDate produceTypeId pantryId');
        console.log(`Found ${existingEntries.length} existing entries`);
      }
      // Note: For incremental imports, we already cleared overlapping entries, so no duplicate detection needed
      
      // Create a Set for O(1) duplicate lookups
      const existingEntriesSet = new Set();
      existingEntries.forEach(entry => {
        const key = `${entry.harvestDate.toISOString()}:${entry.produceTypeId}:${entry.pantryId}`;
        existingEntriesSet.add(key);
      });
      
      // Count entries that will be processed based on date filter
      let processedEntryCount = 0;
      let skippedDateCount = 0;
      
      for (const entry of harvestEntries) {
        // Skip entries before import start date (for incremental imports)
        if (importStartDate && entry.harvestDate < importStartDate) {
          skippedDateCount++;
          continue;
        }
        processedEntryCount++;
        
        // Use lowercase key for case-insensitive lookup
        const productKey = `${entry.type.toLowerCase()}:${entry.product.toLowerCase()}`;
        let produceTypeId = produceTypeMap[productKey];
        
        
        // If not found with category:product key, try to find by product name only
        if (!produceTypeId) {
          const fallbackProduceType = allProduceTypes.find(pt => 
            pt.name.toLowerCase() === entry.product.toLowerCase()
          );
          if (fallbackProduceType) {
            produceTypeId = fallbackProduceType._id;
            console.log(`🔄 Using fallback for ${entry.product}: found in ${fallbackProduceType.categoryId.name} category instead of ${entry.type}`);
          }
        }
        
        if (!produceTypeId) {
          console.log(`❌ Skipping entry for ${entry.product} (${entry.type}) - no produce type found`);
          skippedCount++;
          continue;
        }
        
        // Find pantry ID
        let pantryId = defaultPantryId;
        if (entry.pantry) {
          const pantryKey = entry.pantry.toLowerCase().trim();
          if (pantryMap[pantryKey]) {
            pantryId = pantryMap[pantryKey];
          } else {
            // Log unmapped pantries for debugging
            if (entry.product.toLowerCase() === 'watermelon') {
              console.log(`⚠️  No mapping for pantry "${entry.pantry}" (key: "${pantryKey}") for watermelon entry`);
            }
          }
        }
        
        if (!pantryId) {
          if (entry.product.toLowerCase() === 'watermelon') {
            console.log(`❌ Skipping watermelon entry due to missing pantry: ${entry.pantry}`);
          }
          skippedCount++;
          continue;
        }
        
        // Check if this entry already exists (optimized with Set lookup)
        if (!shouldClearData && allHistoricalData && existingEntries.length > 0) {
          const duplicateKey = `${entry.harvestDate.toISOString()}:${produceTypeId}:${pantryId}`;
          if (existingEntriesSet.has(duplicateKey)) {
            duplicateCount++;
            continue; // Skip this entry as it already exists
          }
        }
        
        const entryToInsert = {
          produceTypeId: produceTypeId,
          quantity: entry.quantity,
          unit: entry.unit,
          weight: entry.weight,
          weightEstimated: false,
          pantryId: pantryId,
          locationId: createdLocations[0]._id, // Use the first harvest location (Farm)
          harvestDate: entry.harvestDate,
          harvesterName: 'Seeded Data',
          notes: entry.notes
        };
        
        harvestEntriesToInsert.push(entryToInsert);
        newlyInsertedEntries.push(entryToInsert);
      }
      
      // Count watermelon entries to be inserted for debugging
      const watermelonToInsert = harvestEntriesToInsert.filter(entry => {
        const pt = allProduceTypes.find(pt => pt._id.toString() === entry.produceTypeId.toString());
        return pt && pt.name === 'Watermelon';
      });
      console.log(`🍉 About to insert ${watermelonToInsert.length} watermelon entries out of ${harvestEntriesToInsert.length} total entries`);
      
      // Batch insert in chunks of 500 for better performance
      const chunkSize = 500;
      for (let i = 0; i < harvestEntriesToInsert.length; i += chunkSize) {
        const chunk = harvestEntriesToInsert.slice(i, i + chunkSize);
        await HarvestEntry.insertMany(chunk, { ordered: false });
        createdHarvestEntries += chunk.length;
      }
      
      if (skippedCount > 0) {
        console.log(`Skipped ${skippedCount} entries due to missing produce types or pantries`);
      }
      if (duplicateCount > 0) {
        console.log(`Skipped ${duplicateCount} duplicate entries (same date, produce type, and pantry)`);
      }
      
      console.log(`Created ${createdHarvestEntries} new harvest entries`);
      
      if (skippedDateCount > 0) {
        console.log(`Skipped ${skippedDateCount} entries due to date filtering (before ${importStartDate.toISOString().split('T')[0]})`);
      }
    
    const existingCount = await HarvestEntry.countDocuments();
    console.log(`Total harvest entries in database: ${existingCount}`);
    } // End of harvest entry processing block

    // Create orders from harvest entries (grouped by date and pantry)
    console.log('Creating orders from harvest entries...');
    let createdOrders = 0;
    
    // Always process order creation for newly inserted harvest entries
    if (shouldClearData || newlyInsertedEntries.length > 0) {
      // Find admin user for createdBy field
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@gardenforall.org';
      let adminUser = await User.findOne({ email: adminEmail });
      
      if (!adminUser) {
        console.log('No admin user found, skipping order creation');
        return;
      }
      // Get harvest entries for order creation
      let harvestEntriesForOrders;
      
      if (shouldClearData) {
        // When clearing data, use all harvest entries
        harvestEntriesForOrders = await HarvestEntry.find({})
          .populate('produceTypeId')
          .populate('pantryId')
          .sort({ harvestDate: 1 });
      } else {
        // When not clearing data, only create orders for newly inserted entries
        if (newlyInsertedEntries.length === 0) {
          console.log('No new harvest entries to process for orders');
          const existingOrderCount = await Order.countDocuments();
          console.log(`${existingOrderCount} orders already exist`);
          createdOrders = existingOrderCount;
        } else {
          // Get the newly inserted entries with populated data
          const newEntryIds = [];
          for (const entry of newlyInsertedEntries) {
            // Find the inserted entry to get its ID
            const insertedEntry = await HarvestEntry.findOne({
              harvestDate: entry.harvestDate,
              produceTypeId: entry.produceTypeId,
              pantryId: entry.pantryId,
              weight: entry.weight
            });
            if (insertedEntry) {
              newEntryIds.push(insertedEntry._id);
            }
          }
          
          harvestEntriesForOrders = await HarvestEntry.find({
            _id: { $in: newEntryIds }
          })
          .populate('produceTypeId')
          .populate('pantryId')
          .sort({ harvestDate: 1 });
        }
      }
      
      // Skip order creation if no entries to process
      if (!harvestEntriesForOrders || harvestEntriesForOrders.length === 0) {
        console.log('No harvest entries to process for order creation');
      } else {
        // Group harvest entries by date and pantry
        const orderGroups = new Map();
        
        harvestEntriesForOrders.forEach(entry => {
        if (!entry.pantryId || !entry.produceTypeId) return;
        
        // Create key: "YYYY-MM-DD:pantryId"
        const dateKey = entry.harvestDate.toISOString().split('T')[0];
        const groupKey = `${dateKey}:${entry.pantryId._id}`;
        
        if (!orderGroups.has(groupKey)) {
          orderGroups.set(groupKey, {
            pantryId: entry.pantryId._id,
            pantryName: entry.pantryId.name,
            deliveryDate: entry.harvestDate,
            entries: []
          });
        }
        
        orderGroups.get(groupKey).entries.push(entry);
      });
      
      console.log(`Found ${orderGroups.size} unique date/pantry combinations for orders`);
      
      const ordersToInsert = [];
      
      for (const [groupKey, group] of orderGroups) {
        // Skip groups with less than 2 items (not worth making an order)
        if (group.entries.length < 2) continue;
        
        // Calculate total weight and value for the order
        let totalWeight = 0;
        let totalValue = 0;
        const products = [];
        
        // Group products by type within the same order
        const productMap = new Map();
        
        group.entries.forEach(entry => {
          const productKey = entry.produceTypeId._id.toString();
          const weight = entry.weight || 0;
          const pricePerLb = entry.produceTypeId.pricePerLb || 0;
          const value = weight * pricePerLb;
          
          if (!productMap.has(productKey)) {
            productMap.set(productKey, {
              produceTypeId: entry.produceTypeId._id,
              weight: 0,
              quantity: 0,
              pricePerLb: pricePerLb,
              value: 0
            });
          }
          
          const product = productMap.get(productKey);
          product.weight += weight;
          product.quantity += entry.quantity || 0;
          product.value += value;
          
          totalWeight += weight;
          totalValue += value;
        });
        
        // Convert map to array
        productMap.forEach(product => {
          products.push(product);
        });
        
        // Determine order type and status based on date
        const deliveryDate = new Date(group.deliveryDate);
        const now = new Date();
        let status = 'completed'; // Set all seeded orders to completed
        let orderType = 'delivery';
        
        // Some orders are pickups
        if (Math.random() < 0.2) {
          orderType = 'pickup';
        }
        
        // Generate realistic packer names
        const packerNames = [
          'Garden Volunteer', 'Farm Team', 'Harvest Crew', 'Community Helper',
          'Student Volunteer', 'Master Gardener', 'Farm Assistant', 'Garden Club'
        ];
        const packerName = packerNames[Math.floor(Math.random() * packerNames.length)];
        
        ordersToInsert.push({
          pantryId: group.pantryId,
          deliveryDate: deliveryDate,
          pickupTime: orderType === 'pickup' ? '10:00' : null,
          packerName: packerName,
          orderType: orderType,
          status: status,
          notes: `Generated from harvest entries on ${deliveryDate.toLocaleDateString()}`,
          products: products,
          totalWeight: Math.round(totalWeight * 100) / 100, // Round to 2 decimals
          totalValue: Math.round(totalValue * 100) / 100,
          createdBy: adminUser._id, // Admin user created
          updatedBy: adminUser._id
        });
      }
      
      console.log(`Creating ${ordersToInsert.length} orders from grouped harvest entries`);
      
      if (ordersToInsert.length > 0) {
        // Insert orders in chunks
        const chunkSize = 100;
        for (let i = 0; i < ordersToInsert.length; i += chunkSize) {
          const chunk = ordersToInsert.slice(i, i + chunkSize);
          await Order.insertMany(chunk);
          createdOrders += chunk.length;
        }
        
        console.log(`Created ${createdOrders} orders`);
      }
      } // End of else block for checking harvestEntriesForOrders
    }

    // Create commitments for Broad Street Food Pantry
    console.log('Creating commitments for Broad Street Food Pantry...');
    let createdCommitments = 0;
    
    // Find Broad Street Food Pantry
    const broadStreetPantry = await FoodPantry.findOne({ 
      name: { $regex: /Broad Street/i } 
    });
    
    if (broadStreetPantry) {
      // Create produce type mapping for quick lookup
      const allProduceTypes = await ProduceType.find({}).populate('categoryId');
      const produceTypeMap = {};
      allProduceTypes.forEach(pt => {
        produceTypeMap[pt.name.toLowerCase()] = pt._id;
      });
      
      // Only create commitments if we cleared data or no commitments exist
      if (shouldClearData || await Commitment.countDocuments({ pantryId: broadStreetPantry._id }) === 0) {
        const commitmentsToInsert = [];
        
        for (const commitment of broadStreetCommitments) {
          const produceTypeId = produceTypeMap[commitment.produce.toLowerCase()];
          if (produceTypeId) {
            // Parse week date and ensure it's a Monday
            const [year, month, day] = commitment.week.split('-').map(Number);
            const weekStartDate = new Date(year, month - 1, day);
            
            // Verify it's a Monday (1 = Monday)
            if (weekStartDate.getDay() === 1) {
              commitmentsToInsert.push({
                pantryId: broadStreetPantry._id,
                weekStartDate: weekStartDate,
                commitmentType: 'produce_type',
                produceTypeId: produceTypeId,
                weeklyWeightLbs: commitment.weight,
                notes: `Seeded commitment - ${commitment.produce}`,
                isActive: true,
                createdBy: null // System created
              });
            } else {
              console.warn(`Skipping ${commitment.week} - not a Monday`);
            }
          } else {
            console.warn(`Could not find produce type for: ${commitment.produce}`);
          }
        }
        
        if (commitmentsToInsert.length > 0) {
          await Commitment.insertMany(commitmentsToInsert);
          createdCommitments = commitmentsToInsert.length;
          console.log(`Created ${createdCommitments} commitments for Broad Street Food Pantry`);
        }
      } else {
        const existingCount = await Commitment.countDocuments({ pantryId: broadStreetPantry._id });
        console.log(`${existingCount} commitments already exist for Broad Street Food Pantry`);
        createdCommitments = existingCount;
      }
    } else {
      console.warn('Could not find Broad Street Food Pantry');
    }

    // Get final produce type list for debugging
    const finalProduceTypes = await ProduceType.find({}).populate('categoryId').sort({ name: 1 });
    const produceTypesList = finalProduceTypes.map(pt => ({
      name: pt.name,
      category: pt.categoryId.name,
      unitType: pt.unitType
    }));

    return createResponse(200, {
      success: true,
      message: 'Database seeded successfully',
      data: {
        categories: createdCategories.length,
        produceTypes: createdProduceTypes.length,
        foodPantries: createdPantries.length,
        harvestEntries: createdHarvestEntries,
        orders: createdOrders,
        commitments: createdCommitments,
        importMode: shouldClearData ? 'full-clear' : (allHistoricalData ? 'all-historical' : 'incremental'),
        importStartDate: importStartDate ? importStartDate.toISOString().split('T')[0] : null,
        produceTypesList: produceTypesList
      }
    });

  } catch (error) {
    console.error('Database seeding error:', error);
    return createErrorResponse(500, `Seeding failed: ${error.message}`);
  }
};