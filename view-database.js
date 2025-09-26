import { createRequire } from 'module';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const require = createRequire(import.meta.url);
const mongoose = require('mongoose');

// Import models
const { ProduceCategory, ProduceType, FoodPantry, HarvestEntry, Order } = require('./netlify/functions/utils/models.js');

async function viewDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get counts
    const categoriesCount = await ProduceCategory.countDocuments();
    const produceTypesCount = await ProduceType.countDocuments();
    const pantriesCount = await FoodPantry.countDocuments();
    const harvestEntriesCount = await HarvestEntry.countDocuments();
    const ordersCount = await Order.countDocuments();

    console.log('\n📊 Database Summary:');
    console.log(`Categories: ${categoriesCount}`);
    console.log(`Produce Types: ${produceTypesCount}`);
    console.log(`Food Pantries: ${pantriesCount}`);
    console.log(`Harvest Entries: ${harvestEntriesCount}`);
    console.log(`Orders: ${ordersCount}`);

    // Show categories
    console.log('\n📂 Categories:');
    const categories = await ProduceCategory.find({}).sort({ displayOrder: 1 });
    categories.forEach(cat => {
      console.log(`  ${cat.displayOrder}. ${cat.name} - ${cat.description}`);
    });

    // Show some produce types by category
    console.log('\n🥬 Sample Produce Types:');
    for (const category of categories) {
      const produceTypes = await ProduceType.find({ categoryId: category._id }).limit(5);
      console.log(`  ${category.name}:`);
      produceTypes.forEach(pt => {
        console.log(`    - ${pt.name} (${pt.unitType})`);
      });
    }

    // Show food pantries
    console.log('\n🏪 Food Pantries:');
    const pantries = await FoodPantry.find({}).sort({ name: 1 });
    pantries.forEach(pantry => {
      console.log(`  📍 ${pantry.name} (${pantry.county})`);
      console.log(`     📞 ${pantry.contactInfo.phone}`);
      console.log(`     📧 ${pantry.contactInfo.email}`);
      console.log(`     🎯 Total commitment: ${pantry.commitmentAmounts.total} lbs`);
    });

    // Show recent harvest entries
    console.log('\n🌱 Recent Harvest Entries (last 10):');
    const recentEntries = await HarvestEntry.find({})
      .populate('produceTypeId')
      .populate('pantryId')
      .sort({ harvestDate: -1 })
      .limit(10);
    
    recentEntries.forEach(entry => {
      const date = entry.harvestDate.toLocaleDateString();
      const pantryName = entry.pantryId ? entry.pantryId.name : 'No Pantry';
      console.log(`  ${date}: ${entry.weight} lbs ${entry.produceTypeId.name} → ${pantryName}`);
    });

    console.log('\n✅ Successfully connected to and explored the local database!');
    console.log('🔗 MongoDB Connection: mongodb://localhost:27017/garden-for-all-local');
    
  } catch (error) {
    console.error('Error viewing database:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

viewDatabase();