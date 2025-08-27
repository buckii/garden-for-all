const Joi = require('joi');
const { connectDB } = require('./utils/db.js');
const { HarvestEntry, ProduceType, FoodPantry } = require('./utils/models.js');
const { createResponse, createErrorResponse, handleCORS } = require('./utils/auth.js');

const createHarvestSchema = Joi.object({
  produce_type_id: Joi.string().optional(),
  produceTypeId: Joi.string().optional(),
  quantity: Joi.number().min(0).required(),
  unit: Joi.string().required(),
  weight: Joi.number().min(0).optional(), // Optional - will be calculated if not provided
  pantry_id: Joi.string().optional(),
  pantryId: Joi.string().optional(),
  harvestDate: Joi.date().optional(),
  harvest_date: Joi.date().optional(),
  harvester_name: Joi.string().allow('').optional(),
  harvesterName: Joi.string().allow('').optional(),
  notes: Joi.string().allow('').optional()
});

exports.handler = async function(event, context) {
  if (event.httpMethod === 'OPTIONS') {
    return handleCORS();
  }

  if (event.httpMethod !== 'POST') {
    return createErrorResponse(405, 'Method Not Allowed');
  }

  try {
    await connectDB();

    // Parse and validate request body
    const body = JSON.parse(event.body || '{}');
    const { error } = createHarvestSchema.validate(body);
    
    if (error) {
      return createErrorResponse(400, `Validation error: ${error.details[0].message}`);
    }

    // Support both snake_case and camelCase field names
    const produceTypeId = body.produce_type_id || body.produceTypeId;
    const pantryId = body.pantry_id || body.pantryId;
    const quantity = body.quantity;
    const unit = body.unit;
    const providedWeight = body.weight;
    const harvestDate = body.harvest_date || body.harvestDate || new Date();
    const harvesterName = body.harvester_name || body.harvesterName;
    const notes = body.notes;

    // Validate required fields
    if (!produceTypeId) {
      return createErrorResponse(400, 'Produce type ID is required');
    }
    if (!pantryId) {
      return createErrorResponse(400, 'Pantry ID is required');
    }

    // Verify produce type exists
    const produceType = await ProduceType.findById(produceTypeId);
    if (!produceType) {
      return createErrorResponse(400, 'Invalid produce type');
    }

    // Verify pantry exists
    const pantry = await FoodPantry.findById(pantryId);
    if (!pantry) {
      return createErrorResponse(400, 'Invalid pantry');
    }

    // Calculate or use provided weight
    let weight;
    let weightEstimated = false;
    
    if (providedWeight && providedWeight > 0) {
      // Use provided weight
      weight = providedWeight;
      weightEstimated = false;
    } else {
      // Calculate estimated weight using conversion factor
      weight = quantity * (produceType.conversionFactor || 1);
      weightEstimated = true;
    }

    // Create harvest entry
    const entry = new HarvestEntry({
      produceTypeId,
      pantryId,
      quantity,
      unit,
      weight,
      weightEstimated,
      harvestDate: new Date(harvestDate),
      harvesterName: harvesterName || undefined,
      notes: notes || undefined
    });

    await entry.save();

    // Populate the saved entry for response
    await entry.populate([
      {
        path: 'produceTypeId',
        populate: {
          path: 'categoryId',
          model: 'ProduceCategory'
        }
      },
      {
        path: 'pantryId',
        model: 'FoodPantry'
      }
    ]);

    // Transform response (include both snake_case and camelCase for compatibility)
    const transformedEntry = {
      _id: entry._id,
      produce_type_id: entry.produceTypeId._id,
      produceTypeId: entry.produceTypeId._id,
      pantry_id: entry.pantryId._id,
      pantryId: entry.pantryId._id,
      quantity: entry.quantity,
      unit: entry.unit,
      weight: entry.weight,
      weightEstimated: entry.weightEstimated,
      weight_estimated: entry.weightEstimated,
      harvestDate: entry.harvestDate.toISOString().split('T')[0],
      harvest_date: entry.harvestDate.toISOString().split('T')[0],
      harvester_name: entry.harvesterName,
      harvesterName: entry.harvesterName,
      notes: entry.notes,
      created_at: entry.createdAt,
      createdAt: entry.createdAt,
      updated_at: entry.updatedAt,
      updatedAt: entry.updatedAt,
      produceType: {
        _id: entry.produceTypeId._id,
        name: entry.produceTypeId.name,
        unitType: entry.produceTypeId.unitType,
        unit_type: entry.produceTypeId.unitType,
        conversionFactor: entry.produceTypeId.conversionFactor,
        conversion_factor: entry.produceTypeId.conversionFactor,
        categoryId: entry.produceTypeId.categoryId._id,
        category: {
          _id: entry.produceTypeId.categoryId._id,
          name: entry.produceTypeId.categoryId.name,
          description: entry.produceTypeId.categoryId.description
        }
      },
      pantry: {
        _id: entry.pantryId._id,
        name: entry.pantryId.name
      }
    };

    return createResponse(201, {
      success: true,
      data: transformedEntry
    });

  } catch (error) {
    console.error('Harvest create error:', error);
    return createErrorResponse(500, 'Internal server error');
  }
};