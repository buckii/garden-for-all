const mongoose = require('mongoose');

// Produce Category Schema
const produceCategorySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  displayOrder: { type: Number, default: 0 }
}, { timestamps: true });

// Produce Type Schema
const produceTypeSchema = new mongoose.Schema({
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProduceCategory', required: true },
  name: { type: String, required: true, trim: true },
  unitType: { type: String, required: true, enum: ['pounds', 'pints', 'bunches'] },
  conversionFactor: { type: Number, required: true, default: 0, min: 0 },
  pricePerLb: { type: Number, default: 0, min: 0 },
  servingWeightOz: { type: Number, default: 0, min: 0 },
  servingsPerLb: { type: Number, default: 0, min: 0 }
}, { timestamps: true });

// Food Pantry Schema
const foodPantrySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  contactInfo: {
    phone: { type: String, trim: true },
    email: { type: String, lowercase: true, trim: true },
    address: { type: String, trim: true }
  },
  commitmentAmounts: {
    total: { type: Number, default: 0, min: 0 },
    vegetables: { type: Number, default: 0, min: 0 },
    fruits: { type: Number, default: 0, min: 0 },
    herbs: { type: Number, default: 0, min: 0 },
    flowers: { type: Number, default: 0, min: 0 }
  }
}, { timestamps: true });

// Harvest Entry Schema
const harvestEntrySchema = new mongoose.Schema({
  produceTypeId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProduceType', required: true },
  quantity: { type: Number, required: true, min: 0 },
  unit: { type: String, required: true, trim: true },
  harvestDate: { type: Date, required: true },
  harvesterName: { type: String, trim: true },
  notes: { type: String, trim: true }
}, { timestamps: true });

// Pantry Distribution Schema
const pantryDistributionSchema = new mongoose.Schema({
  pantryId: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodPantry', required: true },
  harvestEntryId: { type: mongoose.Schema.Types.ObjectId, ref: 'HarvestEntry', required: true },
  quantityDistributed: { type: Number, required: true, min: 0 },
  distributionDate: { type: Date, required: true }
}, { timestamps: { updatedAt: false } });

// Create indexes
produceCategorySchema.index({ displayOrder: 1 });
produceTypeSchema.index({ categoryId: 1, name: 1 });
harvestEntrySchema.index({ produceTypeId: 1, harvestDate: -1 });
pantryDistributionSchema.index({ pantryId: 1, distributionDate: -1 });

// Prevent re-compilation in serverless environment
const ProduceCategory = mongoose.models.ProduceCategory || mongoose.model('ProduceCategory', produceCategorySchema);
const ProduceType = mongoose.models.ProduceType || mongoose.model('ProduceType', produceTypeSchema);
const FoodPantry = mongoose.models.FoodPantry || mongoose.model('FoodPantry', foodPantrySchema);
const HarvestEntry = mongoose.models.HarvestEntry || mongoose.model('HarvestEntry', harvestEntrySchema);
const PantryDistribution = mongoose.models.PantryDistribution || mongoose.model('PantryDistribution', pantryDistributionSchema);

module.exports = {
  ProduceCategory,
  ProduceType,
  FoodPantry,
  HarvestEntry,
  PantryDistribution
};