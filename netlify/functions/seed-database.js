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

// Produce types organized by category
const produceData = [
  // Fruits
  { category: 'Fruit', name: 'Apples', unitType: 'pounds', conversionFactor: 1.0 },
  { category: 'Fruit', name: 'Blueberries', unitType: 'pints', conversionFactor: 0.33 },
  { category: 'Fruit', name: 'Peaches', unitType: 'pounds', conversionFactor: 1.0 },
  { category: 'Fruit', name: 'Raspberries', unitType: 'pints', conversionFactor: 0.28 },
  { category: 'Fruit', name: 'Strawberries', unitType: 'pints', conversionFactor: 0.75 },
  
  // Greens
  { category: 'Greens', name: 'Arugula', unitType: 'pounds', conversionFactor: 1.0 },
  { category: 'Greens', name: 'Bok Choy', unitType: 'pounds', conversionFactor: 1.0 },
  { category: 'Greens', name: 'Cabbage', unitType: 'pounds', conversionFactor: 1.0 },
  { category: 'Greens', name: 'Collards', unitType: 'bunches', conversionFactor: 0.5 },
  { category: 'Greens', name: 'kale', unitType: 'bunches', conversionFactor: 0.3 },
  { category: 'Greens', name: 'Lettuce', unitType: 'bunches', conversionFactor: 0.75 },
  { category: 'Greens', name: 'Microgreens', unitType: 'pounds', conversionFactor: 1.0 },
  { category: 'Greens', name: 'Mixed Greens', unitType: 'pounds', conversionFactor: 1.0 },
  { category: 'Greens', name: 'Mustard Greens', unitType: 'bunches', conversionFactor: 0.4 },
  { category: 'Greens', name: 'Spinach', unitType: 'pounds', conversionFactor: 1.0 },
  { category: 'Greens', name: 'Swiss Chard', unitType: 'bunches', conversionFactor: 0.4 },
  
  // Herbs
  { category: 'Herbs', name: 'Basil', unitType: 'bunches', conversionFactor: 0.1 },
  { category: 'Herbs', name: 'Cilantro', unitType: 'bunches', conversionFactor: 0.1 },
  { category: 'Herbs', name: 'Dill', unitType: 'bunches', conversionFactor: 0.05 },
  { category: 'Herbs', name: 'Garlic Scapes', unitType: 'bunches', conversionFactor: 0.02 },
  { category: 'Herbs', name: 'Herbs', unitType: 'bunches', conversionFactor: 0.1 },
  { category: 'Herbs', name: 'Mint', unitType: 'bunches', conversionFactor: 0.05 },
  { category: 'Herbs', name: 'Parsley', unitType: 'bunches', conversionFactor: 0.1 },
  { category: 'Herbs', name: 'Sage', unitType: 'bunches', conversionFactor: 0.02 },
  
  // Vegetables
  { category: 'Vegetables', name: 'Acorn Squash', unitType: 'pounds', conversionFactor: 1.0 },
  { category: 'Vegetables', name: 'Beans', unitType: 'pounds', conversionFactor: 1.0 },
  { category: 'Vegetables', name: 'Beets', unitType: 'bunches', conversionFactor: 0.3 },
  { category: 'Vegetables', name: 'Broccoli', unitType: 'bunches', conversionFactor: 1.5 },
  { category: 'Vegetables', name: 'Brussels Sprouts', unitType: 'pounds', conversionFactor: 1.0 },
  { category: 'Vegetables', name: 'Butternut Squash', unitType: 'pounds', conversionFactor: 1.0 },
  { category: 'Vegetables', name: 'Cantaloupe', unitType: 'pounds', conversionFactor: 3.0 },
  { category: 'Vegetables', name: 'Carrots', unitType: 'bunches', conversionFactor: 0.75 },
  { category: 'Vegetables', name: 'Cauliflower', unitType: 'pounds', conversionFactor: 2.0 },
  { category: 'Vegetables', name: 'Cherry Tomatoes', unitType: 'pints', conversionFactor: 0.6 },
  { category: 'Vegetables', name: 'Corn', unitType: 'bunches', conversionFactor: 2.5 },
  { category: 'Vegetables', name: 'Cucumbers', unitType: 'pounds', conversionFactor: 0.5 },
  { category: 'Vegetables', name: 'Daikon Radish', unitType: 'pounds', conversionFactor: 1.0 },
  { category: 'Vegetables', name: 'Eggplant', unitType: 'pounds', conversionFactor: 1.0 },
  { category: 'Vegetables', name: 'Garlic', unitType: 'pounds', conversionFactor: 0.2 },
  { category: 'Vegetables', name: 'Kohlrabi', unitType: 'pounds', conversionFactor: 0.5 },
  { category: 'Vegetables', name: 'Leeks', unitType: 'bunches', conversionFactor: 0.3 },
  { category: 'Vegetables', name: 'Okra', unitType: 'pounds', conversionFactor: 1.0 },
  { category: 'Vegetables', name: 'Onions', unitType: 'pounds', conversionFactor: 0.3 },
  { category: 'Vegetables', name: 'Peas', unitType: 'pounds', conversionFactor: 1.0 },
  { category: 'Vegetables', name: 'Peppers', unitType: 'pounds', conversionFactor: 0.25 },
  { category: 'Vegetables', name: 'Potatoes', unitType: 'pounds', conversionFactor: 1.0 },
  { category: 'Vegetables', name: 'Pumpkin', unitType: 'pounds', conversionFactor: 1.0 },
  { category: 'Vegetables', name: 'Radishes', unitType: 'bunches', conversionFactor: 0.25 },
  { category: 'Vegetables', name: 'Spaghetti Squash', unitType: 'pounds', conversionFactor: 1.0 },
  { category: 'Vegetables', name: 'Sweet Potatoes', unitType: 'pounds', conversionFactor: 1.0 },
  { category: 'Vegetables', name: 'Tomatoes', unitType: 'pounds', conversionFactor: 1.0 },
  { category: 'Vegetables', name: 'Turnips', unitType: 'bunches', conversionFactor: 0.5 },
  { category: 'Vegetables', name: 'Watermelon', unitType: 'pounds', conversionFactor: 8.0 },
  { category: 'Vegetables', name: 'Yellow squash', unitType: 'pounds', conversionFactor: 0.5 },
  { category: 'Vegetables', name: 'Zucchini', unitType: 'pounds', conversionFactor: 0.5 }
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

    // Clear existing data
    console.log('Clearing existing data...');
    await ProduceType.deleteMany({});
    await ProduceCategory.deleteMany({});
    await FoodPantry.deleteMany({});

    // Create categories
    console.log('Creating categories...');
    const createdCategories = await ProduceCategory.insertMany(categories);
    console.log(`Created ${createdCategories.length} categories`);

    // Create a mapping of category names to IDs
    const categoryMap = {};
    createdCategories.forEach(category => {
      categoryMap[category.name] = category._id;
    });

    // Create produce types with category references
    console.log('Creating produce types...');
    const produceTypes = produceData.map(item => ({
      name: item.name,
      categoryId: categoryMap[item.category],
      unitType: item.unitType,
      conversionFactor: item.conversionFactor
    }));

    const createdProduceTypes = await ProduceType.insertMany(produceTypes);
    console.log(`Created ${createdProduceTypes.length} produce types`);

    // Create food pantries
    console.log('Creating food pantries...');
    const createdPantries = await FoodPantry.insertMany(foodPantries);
    console.log(`Created ${createdPantries.length} food pantries`);

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