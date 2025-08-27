const { connectDB } = require('./utils/db.js');
const { ProduceCategory, ProduceType, FoodPantry, HarvestEntry } = require('./utils/models.js');
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

function parseQuantityAndUnit(quantityStr) {
  if (!quantityStr) {
    return { quantity: 0, unit: 'items' };
  }
  
  // Clean the string and convert to lowercase for matching
  const cleaned = quantityStr.toLowerCase().trim();
  
  // Extract number from the beginning of the string
  const numberMatch = cleaned.match(/^(\d+(?:\.\d+)?)/);
  const quantity = numberMatch ? parseFloat(numberMatch[1]) : 0;
  
  // Common unit patterns (ignoring size descriptors like "large" and "small")
  if (cleaned.includes('bag')) {
    return { quantity, unit: 'bags' };
  }
  if (cleaned.includes('box')) {
    return { quantity, unit: 'boxes' };
  }
  if (cleaned.includes('bunch')) {
    return { quantity, unit: 'bunches' };
  }
  if (cleaned.includes('pint')) {
    return { quantity, unit: 'pints' };
  }
  if (cleaned.includes('pound') || cleaned.includes('lb')) {
    return { quantity, unit: 'items' };
  }
  
  // If it's just a number with no unit, assume items/pieces
  if (/^\d+(?:\.\d+)?$/.test(cleaned)) {
    return { quantity, unit: 'items' };
  }
  
  // Default fallback
  return { quantity, unit: 'items' };
}

function loadDataFromCSV() {
  try {
    const csvPath = path.resolve('data/harvestentries.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n');
    const header = lines[0].split('\t');
    
    // Find column indices (header has extra spaces due to tab separation)
    const typeIndex = header.findIndex(col => col.trim() === 'Type');
    const productIndex = header.findIndex(col => col.trim() === 'Product');
    const quantityIndex = header.findIndex(col => col.trim() === 'Quantity');
    const weightIndex = header.findIndex(col => col.trim() === 'Weight (lbs)');
    const dateIndex = header.findIndex(col => col.trim() === 'Delivery Date');
    const pantryIndex = header.findIndex(col => col.trim() === 'Pantry');
    
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
      'Fruit': { servingWeightOz: 5.0, servingsPerLb: 3.2, pricePerLb: 2.0, conversionFactor: 1.0, unitType: 'items' },
      'Greens': { servingWeightOz: 3.0, servingsPerLb: 5.33, pricePerLb: 2.5, conversionFactor: 0.19, unitType: 'bunches' },
      'Herbs': { servingWeightOz: 0.5, servingsPerLb: 32.0, pricePerLb: 8.0, conversionFactor: 0.03, unitType: 'bunches' },
      'Vegetables': { servingWeightOz: 4.0, servingsPerLb: 4.0, pricePerLb: 1.5, conversionFactor: 1.0, unitType: 'items' }
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
      
      // Add unique products
      const productKey = `${type}:${product}`;
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
    return { produceData, harvestEntries };
    
  } catch (error) {
    console.error('Error loading CSV data:', error);
    throw error;
  }
}

// Load data from CSV
const { produceData, harvestEntries } = loadDataFromCSV();

// Central Ohio food pantries based on Garden for All data
const foodPantries = [
  {
    name: 'GRIN (Gahanna Residents in Need)',
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
    name: 'Broad Street Presbyterian Church Food Pantry',
    contactInfo: {
      phone: '(614) 221-6552',
      email: 'foodpantry@bspc.org',
      address: '760 East Broad Street, Columbus, OH 43205'
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
    contactInfo: {
      phone: '(614) 855-4265',
      email: 'info@newalbanyfoodpantry.org',
      address: '79 N. High St, New Albany, OH 43054'
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
  }
];

exports.handler = async function(event, context) {
  // Only allow POST requests for seeding
  if (event.httpMethod !== 'POST') {
    return createErrorResponse(405, 'Method Not Allowed');
  }

  try {
    await connectDB();

    // Parse request body to check for clearData parameter
    const body = JSON.parse(event.body || '{}');
    const shouldClearData = body.clearData === true;

    // Clear existing data only if requested
    if (shouldClearData) {
      console.log('Clearing existing data...');
      await HarvestEntry.deleteMany({});
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
        let category = await ProduceCategory.findOne({ name: categoryData.name });
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
        
        const existing = await ProduceType.findOne({ name: item.name });
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
        let pantry = await FoodPantry.findOne({ name: pantryData.name });
        if (!pantry) {
          pantry = await FoodPantry.create(pantryData);
          console.log(`Created new food pantry: ${pantry.name}`);
        } else {
          console.log(`Food pantry already exists: ${pantry.name}`);
        }
        createdPantries.push(pantry);
      }
    }

    // Create harvest entries
    console.log('Creating harvest entries...');
    let createdHarvestEntries = 0;
    
    if (shouldClearData || await HarvestEntry.countDocuments() === 0) {
      // Create mappings for lookups
      const produceTypeMap = {};
      const allProduceTypes = await ProduceType.find({}).populate('categoryId');
      allProduceTypes.forEach(pt => {
        const categoryName = pt.categoryId.name;
        const key = `${categoryName}:${pt.name}`;
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
      });
      
      // Use first pantry as default for entries without pantry specified
      const defaultPantryId = createdPantries.length > 0 ? createdPantries[0]._id : null;
      
      // Prepare batch insert data
      const harvestEntriesToInsert = [];
      let skippedCount = 0;
      
      for (const entry of harvestEntries) {
        const productKey = `${entry.type}:${entry.product}`;
        const produceTypeId = produceTypeMap[productKey];
        
        if (!produceTypeId) {
          skippedCount++;
          continue;
        }
        
        // Find pantry ID
        let pantryId = defaultPantryId;
        if (entry.pantry) {
          const pantryKey = entry.pantry.toLowerCase().trim();
          if (pantryMap[pantryKey]) {
            pantryId = pantryMap[pantryKey];
          }
        }
        
        if (!pantryId) {
          skippedCount++;
          continue;
        }
        
        harvestEntriesToInsert.push({
          produceTypeId: produceTypeId,
          quantity: entry.quantity,
          unit: entry.unit,
          weight: entry.weight,
          weightEstimated: false,
          pantryId: pantryId,
          harvestDate: entry.harvestDate,
          notes: entry.notes
        });
      }
      
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
      
      console.log(`Created ${createdHarvestEntries} harvest entries`);
    } else {
      const existingCount = await HarvestEntry.countDocuments();
      console.log(`${existingCount} harvest entries already exist`);
      createdHarvestEntries = existingCount;
    }

    return createResponse(200, {
      success: true,
      message: 'Database seeded successfully',
      data: {
        categories: createdCategories.length,
        produceTypes: createdProduceTypes.length,
        foodPantries: createdPantries.length,
        harvestEntries: createdHarvestEntries
      }
    });

  } catch (error) {
    console.error('Database seeding error:', error);
    return createErrorResponse(500, `Seeding failed: ${error.message}`);
  }
};