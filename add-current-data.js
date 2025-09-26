import { createRequire } from 'module';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const require = createRequire(import.meta.url);
const mongoose = require('mongoose');

// Import models
const { ProduceType, FoodPantry, HarvestEntry, HarvestLocation } = require('./netlify/functions/utils/models.js');

async function addCurrentWeekData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get some produce types and pantries
    const produceTypes = await ProduceType.find({}).limit(10);
    const pantries = await FoodPantry.find({}).limit(5);
    const location = await HarvestLocation.findOne({ name: 'Farm' });

    if (!location || pantries.length === 0 || produceTypes.length === 0) {
      console.error('Missing required data (location, pantries, or produce types)');
      return;
    }

    // Create harvest entries for this week (last 7 days)
    const currentEntries = [];
    const today = new Date();
    
    // Generate entries for the last 7 days
    for (let i = 0; i < 7; i++) {
      const harvestDate = new Date(today);
      harvestDate.setDate(today.getDate() - i);
      
      // Add 2-3 entries per day
      const numEntries = Math.floor(Math.random() * 2) + 2; // 2-3 entries
      
      for (let j = 0; j < numEntries; j++) {
        const randomProduceType = produceTypes[Math.floor(Math.random() * produceTypes.length)];
        const randomPantry = pantries[Math.floor(Math.random() * pantries.length)];
        const weight = Math.floor(Math.random() * 50) + 5; // 5-55 lbs
        const quantity = Math.floor(Math.random() * 10) + 1; // 1-10 items
        
        currentEntries.push({
          produceTypeId: randomProduceType._id,
          quantity: quantity,
          unit: randomProduceType.unitType,
          weight: weight,
          weightEstimated: false,
          pantryId: randomPantry._id,
          locationId: location._id,
          harvestDate: harvestDate,
          harvesterName: 'Current Week Demo',
          notes: `Added for current week demo - ${randomProduceType.name}`
        });
      }
    }

    // Insert the entries
    if (currentEntries.length > 0) {
      await HarvestEntry.insertMany(currentEntries);
      console.log(`Added ${currentEntries.length} current week harvest entries`);
      
      // Show what was added
      console.log('Sample entries added:');
      const sampleEntries = await HarvestEntry.find({ 
        harvesterName: 'Current Week Demo' 
      })
      .populate('produceTypeId')
      .populate('pantryId')
      .sort({ harvestDate: -1 })
      .limit(5);
      
      sampleEntries.forEach(entry => {
        console.log(`  ${entry.harvestDate.toLocaleDateString()}: ${entry.weight} lbs ${entry.produceTypeId.name} → ${entry.pantryId.name}`);
      });
    }

  } catch (error) {
    console.error('Error adding current week data:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

addCurrentWeekData();