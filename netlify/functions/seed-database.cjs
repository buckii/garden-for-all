const { connectDB } = require('./utils/db.js');
const { ProduceCategory, ProduceType, FoodPantry } = require('./utils/models.js');
const { createResponse, createErrorResponse } = require('./utils/auth.js');

// Categories with display order
const categories = [
  { name: 'Fruit', description: 'Fresh fruits and berries', displayOrder: 1 },
  { name: 'Greens', description: 'Leafy greens and salad vegetables', displayOrder: 2 },
  { name: 'Herbs', description: 'Fresh herbs and aromatics', displayOrder: 3 },
  { name: 'Vegetables', description: 'General vegetables and root crops', displayOrder: 4 }
];

// Produce types with complete Garden for All data including pricing and serving information
const produceData = [
  // Fruits
  { category: 'Fruit', name: 'Apples', unitType: 'pounds', servingWeightOz: 3.52, servingsPerLb: 4.55, pricePerLb: 1.8541, conversionFactor: 1.0 },
  { category: 'Fruit', name: 'Blueberries', unitType: 'pints', servingWeightOz: 5.22, servingsPerLb: 3.07, pricePerLb: 4.1575, conversionFactor: 0.33 },
  { category: 'Fruit', name: 'Cantaloupe', unitType: 'pounds', servingWeightOz: 5.6, servingsPerLb: 2.86, pricePerLb: 0.7523, conversionFactor: 1.0 },
  { category: 'Fruit', name: 'Peaches', unitType: 'pounds', servingWeightOz: 6.17, servingsPerLb: 2.59, pricePerLb: 2.1785, conversionFactor: 1.0 },
  { category: 'Fruit', name: 'Raspberries', unitType: 'pints', servingWeightOz: 4.34, servingsPerLb: 3.69, pricePerLb: 7.7338, conversionFactor: 0.28 },
  { category: 'Fruit', name: 'Strawberries', unitType: 'pints', servingWeightOz: 4.2, servingsPerLb: 3.81, pricePerLb: 2.9682, conversionFactor: 0.75 },
  { category: 'Fruit', name: 'Watermelon', unitType: 'pounds', servingWeightOz: 10.09, servingsPerLb: 1.59, pricePerLb: 0.382, conversionFactor: 1.0 },
  
  // Greens
  { category: 'Greens', name: 'Arugula', unitType: 'bunches', servingWeightOz: 3, servingsPerLb: 5.33, pricePerLb: 2.3074, conversionFactor: 0.19 },
  { category: 'Greens', name: 'Bok Choy', unitType: 'bunches', servingWeightOz: 2.5, servingsPerLb: 6.40, pricePerLb: 1.2604, conversionFactor: 0.16 },
  { category: 'Greens', name: 'Cabbage', unitType: 'pounds', servingWeightOz: 3.14, servingsPerLb: 5.10, pricePerLb: 0.797, conversionFactor: 1.0 },
  { category: 'Greens', name: 'Collards', unitType: 'bunches', servingWeightOz: 3, servingsPerLb: 5.33, pricePerLb: 3.0881, conversionFactor: 0.19 },
  { category: 'Greens', name: 'kale', unitType: 'bunches', servingWeightOz: 3, servingsPerLb: 5.33, pricePerLb: 3.4338, conversionFactor: 0.19 },
  { category: 'Greens', name: 'Lettuce', unitType: 'bunches', servingWeightOz: 3, servingsPerLb: 5.33, pricePerLb: 2.3074, conversionFactor: 0.19 },
  { category: 'Greens', name: 'Microgreens', unitType: 'pounds', servingWeightOz: 0.88, servingsPerLb: 18.18, pricePerLb: 12.00, conversionFactor: 1.0 },
  { category: 'Greens', name: 'Mixed Greens', unitType: 'bunches', servingWeightOz: 3, servingsPerLb: 5.33, pricePerLb: 2.925, conversionFactor: 0.19 },
  { category: 'Greens', name: 'Mustard Greens', unitType: 'bunches', servingWeightOz: 3, servingsPerLb: 3, pricePerLb: 2.925, conversionFactor: 0.19 },
  { category: 'Greens', name: 'Red Lettuce', unitType: 'bunches', servingWeightOz: 3, servingsPerLb: 5.33, pricePerLb: 2.3074, conversionFactor: 0.19 },
  { category: 'Greens', name: 'Romaine', unitType: 'bunches', servingWeightOz: 3, servingsPerLb: 5.33, pricePerLb: 2.3074, conversionFactor: 0.19 },
  { category: 'Greens', name: 'Spinach', unitType: 'pounds', servingWeightOz: 3, servingsPerLb: 5.33, pricePerLb: 4.1214, conversionFactor: 1.0 },
  { category: 'Greens', name: 'Swiss Chard', unitType: 'bunches', servingWeightOz: 3, servingsPerLb: 5.33, pricePerLb: 3.4338, conversionFactor: 0.19 },
  { category: 'Greens', name: 'Turnip Greens', unitType: 'bunches', servingWeightOz: 1.94, servingsPerLb: 8.25, pricePerLb: 2.925, conversionFactor: 0.12 },
  
  // Herbs
  { category: 'Herbs', name: 'Basil', unitType: 'bunches', servingWeightOz: 0.5, servingsPerLb: 32.0, pricePerLb: 8.00, conversionFactor: 0.03 },
  { category: 'Herbs', name: 'Chives', unitType: 'bunches', servingWeightOz: 0.5, servingsPerLb: 32.0, pricePerLb: 8.00, conversionFactor: 0.03 },
  { category: 'Herbs', name: 'Cilantro', unitType: 'bunches', servingWeightOz: 0.5, servingsPerLb: 32.0, pricePerLb: 8.00, conversionFactor: 0.03 },
  { category: 'Herbs', name: 'Cutting Celery', unitType: 'bunches', servingWeightOz: 0.5, servingsPerLb: 32.0, pricePerLb: 1.1637, conversionFactor: 0.03 },
  { category: 'Herbs', name: 'Dill', unitType: 'bunches', servingWeightOz: 0.5, servingsPerLb: 32.0, pricePerLb: 8.00, conversionFactor: 0.03 },
  { category: 'Herbs', name: 'Garlic', unitType: 'pounds', servingWeightOz: 0.5, servingsPerLb: 32.0, pricePerLb: 12.00, conversionFactor: 1.0 },
  { category: 'Herbs', name: 'Garlic Scapes', unitType: 'bunches', servingWeightOz: 0.3, servingsPerLb: 53.33, pricePerLb: 8.00, conversionFactor: 0.02 },
  { category: 'Herbs', name: 'Herbs', unitType: 'bunches', servingWeightOz: 0.5, servingsPerLb: 32.0, pricePerLb: 8.00, conversionFactor: 0.03 },
  { category: 'Herbs', name: 'Lavender', unitType: 'bunches', servingWeightOz: 0.5, servingsPerLb: 32.0, pricePerLb: 12.00, conversionFactor: 0.03 },
  { category: 'Herbs', name: 'Mint', unitType: 'bunches', servingWeightOz: 0.5, servingsPerLb: 32.0, pricePerLb: 8.00, conversionFactor: 0.03 },
  { category: 'Herbs', name: 'Oregano', unitType: 'bunches', servingWeightOz: 0.5, servingsPerLb: 32.0, pricePerLb: 8.00, conversionFactor: 0.03 },
  { category: 'Herbs', name: 'Parsley', unitType: 'bunches', servingWeightOz: 0.5, servingsPerLb: 32.0, pricePerLb: 8.00, conversionFactor: 0.03 },
  { category: 'Herbs', name: 'Rosemary', unitType: 'bunches', servingWeightOz: 0.5, servingsPerLb: 32.0, pricePerLb: 8.00, conversionFactor: 0.03 },
  { category: 'Herbs', name: 'Sage', unitType: 'bunches', servingWeightOz: 0.5, servingsPerLb: 32.0, pricePerLb: 8.00, conversionFactor: 0.03 },
  { category: 'Herbs', name: 'Scallions', unitType: 'bunches', servingWeightOz: 0.53, servingsPerLb: 30.19, pricePerLb: 1.1062, conversionFactor: 0.03 },
  { category: 'Herbs', name: 'Scapes', unitType: 'bunches', servingWeightOz: 0.5, servingsPerLb: 32.0, pricePerLb: 8.00, conversionFactor: 0.03 },
  { category: 'Herbs', name: 'Tarragon', unitType: 'bunches', servingWeightOz: 0.5, servingsPerLb: 32.0, pricePerLb: 8.00, conversionFactor: 0.03 },
  { category: 'Herbs', name: 'Thyme', unitType: 'bunches', servingWeightOz: 0.5, servingsPerLb: 32.0, pricePerLb: 8.00, conversionFactor: 0.03 },
  
  // Vegetables
  { category: 'Vegetables', name: 'Acorn Squash', unitType: 'pounds', servingWeightOz: 7.25, servingsPerLb: 2.21, pricePerLb: 1.2136, conversionFactor: 1.0 },
  { category: 'Vegetables', name: 'Beans', unitType: 'pounds', servingWeightOz: 3, servingsPerLb: 5.33, pricePerLb: 2.6199, conversionFactor: 1.0 },
  { category: 'Vegetables', name: 'Beans, wax', unitType: 'pounds', servingWeightOz: 3, servingsPerLb: 5.33, pricePerLb: 2.6199, conversionFactor: 1.0 },
  { category: 'Vegetables', name: 'Beets', unitType: 'bunches', servingWeightOz: 4.8, servingsPerLb: 3.33, pricePerLb: 1.8126, conversionFactor: 0.30 },
  { category: 'Vegetables', name: 'Blue Hubbard squash', unitType: 'pounds', servingWeightOz: 4.09, servingsPerLb: 3.91, pricePerLb: 1.2136, conversionFactor: 1.0 },
  { category: 'Vegetables', name: 'Broccoli', unitType: 'pounds', servingWeightOz: 5.3, servingsPerLb: 3.02, pricePerLb: 3.082, conversionFactor: 1.0 },
  { category: 'Vegetables', name: 'Brussels Sprouts', unitType: 'pounds', servingWeightOz: 3.1, servingsPerLb: 5.16, pricePerLb: 2.9139, conversionFactor: 1.0 },
  { category: 'Vegetables', name: 'Butternut Squash', unitType: 'pounds', servingWeightOz: 7.25, servingsPerLb: 2.21, pricePerLb: 1.2691, conversionFactor: 1.0 },
  { category: 'Vegetables', name: 'Carrots', unitType: 'pounds', servingWeightOz: 2.8, servingsPerLb: 5.71, pricePerLb: 0.9761, conversionFactor: 1.0 },
  { category: 'Vegetables', name: 'Cauliflower', unitType: 'pounds', servingWeightOz: 1, servingsPerLb: 16.0, pricePerLb: 2.1841, conversionFactor: 1.0 },
  { category: 'Vegetables', name: 'Cherry Tomatoes', unitType: 'pints', servingWeightOz: 5.25, servingsPerLb: 3.05, pricePerLb: 3.8729, conversionFactor: 0.33 },
  { category: 'Vegetables', name: 'Corn', unitType: 'pounds', servingWeightOz: 5.11, servingsPerLb: 3.13, pricePerLb: 2.2281, conversionFactor: 1.0 },
  { category: 'Vegetables', name: 'Cucumbers', unitType: 'pounds', servingWeightOz: 3.5, servingsPerLb: 4.57, pricePerLb: 1.2473, conversionFactor: 1.0 },
  { category: 'Vegetables', name: 'Daikon Radish', unitType: 'pounds', servingWeightOz: 3, servingsPerLb: 5.33, pricePerLb: 1.8126, conversionFactor: 1.0 },
  { category: 'Vegetables', name: 'Edamame', unitType: 'pounds', servingWeightOz: 5.5, servingsPerLb: 2.91, pricePerLb: 3.00, conversionFactor: 1.0 },
  { category: 'Vegetables', name: 'Eggplant', unitType: 'pounds', servingWeightOz: 3.5, servingsPerLb: 4.57, pricePerLb: 2.1841, conversionFactor: 1.0 },
  { category: 'Vegetables', name: 'Flower bouquets', unitType: 'bunches', servingWeightOz: 1, servingsPerLb: 0.0, pricePerLb: 5.00, conversionFactor: 0.0 },
  { category: 'Vegetables', name: 'Green Peppers', unitType: 'pounds', servingWeightOz: 6.2, servingsPerLb: 2.58, pricePerLb: 1.4789, conversionFactor: 1.0 },
  { category: 'Vegetables', name: 'Kohlrabi', unitType: 'pounds', servingWeightOz: 4.76, servingsPerLb: 3.36, pricePerLb: 1.8126, conversionFactor: 1.0 },
  { category: 'Vegetables', name: 'Leeks', unitType: 'bunches', servingWeightOz: 4.37, servingsPerLb: 3.66, pricePerLb: 1.1062, conversionFactor: 0.27 },
  { category: 'Vegetables', name: 'Okra', unitType: 'pounds', servingWeightOz: 3.5, servingsPerLb: 4.57, pricePerLb: 5.1567, conversionFactor: 1.0 },
  { category: 'Vegetables', name: 'Onions', unitType: 'pounds', servingWeightOz: 5.3, servingsPerLb: 3.02, pricePerLb: 1.1062, conversionFactor: 1.0 },
  { category: 'Vegetables', name: 'Peas', unitType: 'pounds', servingWeightOz: 3.5, servingsPerLb: 4.57, pricePerLb: 2.6199, conversionFactor: 1.0 },
  { category: 'Vegetables', name: 'Peppers', unitType: 'pounds', servingWeightOz: 5.3, servingsPerLb: 3.02, pricePerLb: 1.4789, conversionFactor: 1.0 },
  { category: 'Vegetables', name: 'Potatoes', unitType: 'pounds', servingWeightOz: 6.1, servingsPerLb: 2.62, pricePerLb: 0.8166, conversionFactor: 1.0 },
  { category: 'Vegetables', name: 'Pumpkin', unitType: 'pounds', servingWeightOz: 7.79, servingsPerLb: 2.05, pricePerLb: 1.50, conversionFactor: 1.0 },
  { category: 'Vegetables', name: 'Radishes', unitType: 'bunches', servingWeightOz: 3, servingsPerLb: 5.33, pricePerLb: 1.8126, conversionFactor: 0.19 },
  { category: 'Vegetables', name: 'Spaghetti Squash', unitType: 'pounds', servingWeightOz: 5.46, servingsPerLb: 2.93, pricePerLb: 1.2136, conversionFactor: 1.0 },
  { category: 'Vegetables', name: 'Sunflowers', unitType: 'bunches', servingWeightOz: 1, servingsPerLb: 0.0, pricePerLb: 3.00, conversionFactor: 0.0 },
  { category: 'Vegetables', name: 'Sweet Potatoes', unitType: 'pounds', servingWeightOz: 4.6, servingsPerLb: 3.48, pricePerLb: 1.1565, conversionFactor: 1.0 },
  { category: 'Vegetables', name: 'Tomatillos', unitType: 'pounds', servingWeightOz: 4.7, servingsPerLb: 3.40, pricePerLb: 2.1868, conversionFactor: 1.0 },
  { category: 'Vegetables', name: 'Tomatoes', unitType: 'pounds', servingWeightOz: 6.35, servingsPerLb: 2.52, pricePerLb: 2.1868, conversionFactor: 1.0 },
  { category: 'Vegetables', name: 'Turnips', unitType: 'pounds', servingWeightOz: 4.5, servingsPerLb: 3.56, pricePerLb: 1.8126, conversionFactor: 1.0 },
  { category: 'Vegetables', name: 'Yellow squash', unitType: 'pounds', servingWeightOz: 3.5, servingsPerLb: 4.57, pricePerLb: 1.6359, conversionFactor: 1.0 },
  { category: 'Vegetables', name: 'Zucchini', unitType: 'pounds', servingWeightOz: 3.5, servingsPerLb: 4.57, pricePerLb: 1.6359, conversionFactor: 1.0 }
];

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

    return createResponse(200, {
      success: true,
      message: 'Database seeded successfully',
      data: {
        categories: createdCategories.length,
        produceTypes: createdProduceTypes.length,
        foodPantries: createdPantries.length
      }
    });

  } catch (error) {
    console.error('Database seeding error:', error);
    return createErrorResponse(500, `Seeding failed: ${error.message}`);
  }
};