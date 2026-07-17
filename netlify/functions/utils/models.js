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
  county: { 
    type: String, 
    enum: ['Franklin County', 'Licking County', 'Other'],
    default: 'Franklin County',
    required: true
  },
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
  commitmentAmounts: {
    total: { type: Number, default: 0, min: 0 },
    vegetables: { type: Number, default: 0, min: 0 },
    fruits: { type: Number, default: 0, min: 0 },
    herbs: { type: Number, default: 0, min: 0 },
    flowers: { type: Number, default: 0, min: 0 },
    spring: { type: Number, default: 0, min: 0 },
    summer: { type: Number, default: 0, min: 0 },
    fall: { type: Number, default: 0, min: 0 },
    winter: { type: Number, default: 0, min: 0 }
  },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Commitment Schema - supports only pantry-specific commitments
const commitmentSchema = new mongoose.Schema({
  // Commitment must be to a specific pantry
  pantryId: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodPantry', required: true },

  // Daily commitment details
  weekStartDate: { type: Date, required: true }, // Week start date (can be any day of week now)

  // Days of the week for delivery (array of day numbers: 0=Sunday, 1=Monday, etc.)
  daysOfWeek: {
    type: [Number],
    required: true,
    validate: {
      validator: function(days) {
        return days.length > 0 && days.every(d => d >= 0 && d <= 6);
      },
      message: 'Must specify at least one day between 0 (Sunday) and 6 (Saturday)'
    }
  },

  // Frequency in weeks (1 = every week, 2 = every 2 weeks, etc.)
  frequencyWeeks: { type: Number, required: true, default: 1, min: 1 },

  // End date for the commitment series
  endDate: { type: Date, required: true },

  // Commitment can be for specific produce types, categories, or total weight
  commitmentType: {
    type: String,
    enum: ['total', 'produce_type', 'category'],
    required: true
  },

  // If commitmentType is 'produce_type', this references the specific produce
  produceTypeId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProduceType', required: false },

  // If commitmentType is 'category', this references the produce category
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProduceCategory', required: false },

  // Daily weight commitment in pounds (per delivery day)
  dailyWeightLbs: { type: Number, required: true, min: 0 },

  // Legacy field for backward compatibility - calculated from dailyWeightLbs * daysOfWeek.length
  weeklyWeightLbs: { type: Number, min: 0 },

  // Whether this is a firm/committed plan or a tentative plan
  isFirm: { type: Boolean, default: false },

  notes: { type: String, trim: true },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false }
}, { timestamps: true });

// No longer need pantryId/county validation since pantryId is required and county is removed

// Validation: if commitmentType is 'produce_type', produceTypeId must be specified
commitmentSchema.pre('validate', function(next) {
  if (this.commitmentType === 'produce_type' && !this.produceTypeId) {
    next(new Error('Produce type must be specified for produce-specific commitments'));
  } else if (this.commitmentType === 'category' && !this.categoryId) {
    next(new Error('Category must be specified for category-specific commitments'));
  } else {
    next();
  }
});

// Index for efficient querying
commitmentSchema.index({ pantryId: 1, weekStartDate: 1, isActive: 1 });
commitmentSchema.index({ produceTypeId: 1, weekStartDate: 1, isActive: 1 });
commitmentSchema.index({ categoryId: 1, weekStartDate: 1, isActive: 1 });
commitmentSchema.index({ weekStartDate: 1, isActive: 1 });

// Legacy Pantry Commitment Schema (kept for backward compatibility)
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
  pantryId: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodPantry', required: false }, // Which pantry will receive this harvest (optional - can be general inventory)
  locationId: { type: mongoose.Schema.Types.ObjectId, ref: 'HarvestLocation', required: true }, // Where this was harvested
  harvestDate: { type: Date, required: true },
  harvesterName: { type: String, trim: true },
  notes: { type: String, trim: true },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: false } // Optional - if set, this harvest entry belongs to an order
}, { timestamps: true });

// Pantry Distribution Schema
const pantryDistributionSchema = new mongoose.Schema({
  pantryId: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodPantry', required: true },
  harvestEntryId: { type: mongoose.Schema.Types.ObjectId, ref: 'HarvestEntry', required: true },
  quantityDistributed: { type: Number, required: true, min: 0 },
  distributionDate: { type: Date, required: true }
}, { timestamps: { updatedAt: false } });

// Order Schema
// Note: Orders no longer have a products array. Instead, harvest entries have an optional orderId field.
// To get order contents, query: HarvestEntry.find({ orderId: order._id })
const orderSchema = new mongoose.Schema({
  pantryId: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodPantry', required: true },
  deliveryDate: { type: Date, required: true },
  pickupTime: { type: String, trim: true }, // Time in HH:MM format
  packerName: { type: String, required: false, trim: true },
  orderType: { type: String, required: true, enum: ['delivery', 'pickup'], default: 'delivery' },
  // 'delivered' is the current terminal status. 'completed' is a legacy alias kept in the enum
  // so pre-rename records still validate on update; run scripts/migrate-order-status.cjs to convert them.
  status: { type: String, required: true, enum: ['draft', 'in-progress', 'ready', 'delivered', 'completed', 'cancelled'], default: 'draft' },
  notes: { type: String, trim: true },
  // Cached totals - recalculated when harvest entries are added/removed
  totalWeight: { type: Number, default: 0, min: 0 },
  totalValue: { type: Number, default: 0, min: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// QR Login Session Schema
// Short-lived, single-use sessions for logging in a second device by scanning
// a QR code from an already-authenticated device.
// Lifecycle: pending -> authorized (phone approved) -> claimed (new device got its JWT).
const qrLoginSessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true },
  status: { type: String, required: true, enum: ['pending', 'authorized', 'claimed'], default: 'pending' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  // TTL: MongoDB deletes the document ~10 minutes after creation
  createdAt: { type: Date, default: Date.now, expires: 600 }
});

// Create indexes
produceCategorySchema.index({ displayOrder: 1 });
produceTypeSchema.index({ categoryId: 1, name: 1 });
harvestLocationSchema.index({ name: 1 });
harvestLocationSchema.index({ isActive: 1 });
harvestEntrySchema.index({ produceTypeId: 1, harvestDate: -1 });
harvestEntrySchema.index({ locationId: 1, harvestDate: -1 });
harvestEntrySchema.index({ orderId: 1 });
harvestEntrySchema.index({ pantryId: 1, orderId: 1 });
pantryDistributionSchema.index({ pantryId: 1, distributionDate: -1 });
orderSchema.index({ pantryId: 1, deliveryDate: -1 });
orderSchema.index({ status: 1, createdAt: -1 });

// Prevent re-compilation in serverless environment
const ProduceCategory = mongoose.models.ProduceCategory || mongoose.model('ProduceCategory', produceCategorySchema);
const ProduceType = mongoose.models.ProduceType || mongoose.model('ProduceType', produceTypeSchema);
const HarvestLocation = mongoose.models.HarvestLocation || mongoose.model('HarvestLocation', harvestLocationSchema);
const FoodPantry = mongoose.models.FoodPantry || mongoose.model('FoodPantry', foodPantrySchema);
const Commitment = mongoose.models.Commitment || mongoose.model('Commitment', commitmentSchema);
const PantryCommitment = mongoose.models.PantryCommitment || mongoose.model('PantryCommitment', pantryCommitmentSchema);
const HarvestEntry = mongoose.models.HarvestEntry || mongoose.model('HarvestEntry', harvestEntrySchema);
const PantryDistribution = mongoose.models.PantryDistribution || mongoose.model('PantryDistribution', pantryDistributionSchema);
const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);
const QrLoginSession = mongoose.models.QrLoginSession || mongoose.model('QrLoginSession', qrLoginSessionSchema);

module.exports = {
  ProduceCategory,
  ProduceType,
  HarvestLocation,
  FoodPantry,
  Commitment,
  PantryCommitment,
  HarvestEntry,
  PantryDistribution,
  Order,
  QrLoginSession
};