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
  unitType: { type: String, required: true, enum: ['pounds', 'half-pints', 'bouquets'] },
  conversionFactor: { type: Number, required: true, default: 0, min: 0 },
  pricePerLb: { type: Number, default: 0, min: 0 },
  servingWeightOz: { type: Number, default: 0, min: 0 },
  servingsPerLb: { type: Number, default: 0, min: 0 }
}, { timestamps: true });

// Harvest Location Schema
const harvestLocationSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  address: {
    street: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    zip: { type: String, required: true, trim: true }
  },
  coordinates: {
    latitude: { type: Number },
    longitude: { type: Number }
  },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Food Pantry Schema
const foodPantrySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  contactInfo: {
    phone: { type: String, trim: true },
    email: { type: String, lowercase: true, trim: true }
  },
  address: {
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    zip: { type: String, trim: true }
  },
  coordinates: {
    latitude: { type: Number },
    longitude: { type: Number }
  },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Pantry Commitment Schema
const pantryCommitmentSchema = new mongoose.Schema({
  pantryId: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodPantry', required: true },
  year: { type: Number, required: true },
  weeklyCommitment: {
    vegetables: { type: Number, default: 0, min: 0 }, // lbs per week
    fruits: { type: Number, default: 0, min: 0 },
    herbs: { type: Number, default: 0, min: 0 },
    flowers: { type: Number, default: 0, min: 0 },
    total: { type: Number, default: 0, min: 0 }
  },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

// Index for efficient querying
pantryCommitmentSchema.index({ pantryId: 1, year: 1, isActive: 1 });

// Harvest Entry Schema
const harvestEntrySchema = new mongoose.Schema({
  produceTypeId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProduceType', required: true },
  quantity: { type: Number, required: true, min: 0 },
  unit: { type: String, required: true, trim: true },
  weight: { type: Number, required: true, min: 0 }, // Weight in pounds
  weightEstimated: { type: Boolean, default: false }, // True if weight was calculated, false if manually entered
  pantryId: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodPantry', required: true }, // Which pantry will receive this harvest
  locationId: { type: mongoose.Schema.Types.ObjectId, ref: 'HarvestLocation', required: true }, // Where this was harvested
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

// Order Schema
const orderSchema = new mongoose.Schema({
  pantryId: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodPantry', required: true },
  deliveryDate: { type: Date, required: true },
  pickupTime: { type: String, trim: true }, // Time in HH:MM format
  packerName: { type: String, required: true, trim: true },
  orderType: { type: String, required: true, enum: ['delivery', 'pickup'], default: 'delivery' },
  status: { type: String, required: true, enum: ['draft', 'in-progress', 'ready', 'completed', 'cancelled'], default: 'draft' },
  notes: { type: String, trim: true },
  products: [{
    produceTypeId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProduceType', required: true },
    weight: { type: Number, required: true, min: 0 },
    quantity: { type: Number, default: 0, min: 0 },
    pricePerLb: { type: Number, default: 0, min: 0 },
    value: { type: Number, default: 0, min: 0 }
  }],
  totalWeight: { type: Number, default: 0, min: 0 },
  totalValue: { type: Number, default: 0, min: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Create indexes
produceCategorySchema.index({ displayOrder: 1 });
produceTypeSchema.index({ categoryId: 1, name: 1 });
harvestLocationSchema.index({ name: 1 });
harvestLocationSchema.index({ isActive: 1 });
harvestEntrySchema.index({ produceTypeId: 1, harvestDate: -1 });
harvestEntrySchema.index({ locationId: 1, harvestDate: -1 });
pantryDistributionSchema.index({ pantryId: 1, distributionDate: -1 });
orderSchema.index({ pantryId: 1, deliveryDate: -1 });
orderSchema.index({ status: 1, createdAt: -1 });

// Prevent re-compilation in serverless environment
const ProduceCategory = mongoose.models.ProduceCategory || mongoose.model('ProduceCategory', produceCategorySchema);
const ProduceType = mongoose.models.ProduceType || mongoose.model('ProduceType', produceTypeSchema);
const HarvestLocation = mongoose.models.HarvestLocation || mongoose.model('HarvestLocation', harvestLocationSchema);
const FoodPantry = mongoose.models.FoodPantry || mongoose.model('FoodPantry', foodPantrySchema);
const PantryCommitment = mongoose.models.PantryCommitment || mongoose.model('PantryCommitment', pantryCommitmentSchema);
const HarvestEntry = mongoose.models.HarvestEntry || mongoose.model('HarvestEntry', harvestEntrySchema);
const PantryDistribution = mongoose.models.PantryDistribution || mongoose.model('PantryDistribution', pantryDistributionSchema);
const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);

module.exports = {
  ProduceCategory,
  ProduceType,
  HarvestLocation,
  FoodPantry,
  PantryCommitment,
  HarvestEntry,
  PantryDistribution,
  Order
};