const Joi = require('joi');
const { connectDB } = require('./utils/db.js');
const { HarvestEntry, ProduceType } = require('./utils/models.js');
const { createResponse, createErrorResponse, handleCORS } = require('./utils/auth.js');

const createHarvestSchema = Joi.object({
  produce_type_id: Joi.string().optional(),
  produceTypeId: Joi.string().optional(),
  quantity: Joi.number().min(0).required(),
  unit: Joi.string().required(),
  harvestDate: Joi.date().optional(),
  harvest_date: Joi.date().optional(),
  harvester_name: Joi.string().allow('').optional(),
  harvesterName: Joi.string().allow('').optional(),
  notes: Joi.string().allow('').optional()
}).or('produce_type_id', 'produceTypeId');

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
    const quantity = body.quantity;
    const unit = body.unit;
    const harvestDate = body.harvest_date || body.harvestDate || new Date();
    const harvesterName = body.harvester_name || body.harvesterName;
    const notes = body.notes;

    console.log('Received harvest data:', {
      produceTypeId,
      quantity,
      unit,
      harvestDate,
      harvesterName,
      notes,
      bodyKeys: Object.keys(body)
    });

    // Verify produce type exists
    const produceType = await ProduceType.findById(produceTypeId);
    if (!produceType) {
      console.error('Produce type not found:', produceTypeId);
      return createErrorResponse(400, `Invalid produce type: ${produceTypeId}`);
    }
    console.log('Found produce type:', produceType.name);

    // Create harvest entry
    const entry = new HarvestEntry({
      produceTypeId,
      quantity,
      unit,
      harvestDate: new Date(harvestDate),
      harvesterName: harvesterName || undefined,
      notes: notes || undefined
    });

    await entry.save();
    console.log('Saved harvest entry:', {
      _id: entry._id,
      produceTypeId: entry.produceTypeId,
      quantity: entry.quantity,
      unit: entry.unit
    });

    // Populate the saved entry for response
    await entry.populate({
      path: 'produceTypeId',
      populate: {
        path: 'categoryId',
        model: 'ProduceCategory'
      }
    });

    // Transform response (include both snake_case and camelCase for compatibility)
    const transformedEntry = {
      _id: entry._id,
      produce_type_id: entry.produceTypeId._id,
      produceTypeId: entry.produceTypeId._id,
      quantity: entry.quantity,
      unit: entry.unit,
      harvestDate: entry.harvestDate.toISOString().split('T')[0],
      harvester_name: entry.harvesterName,
      harvesterName: entry.harvesterName,
      notes: entry.notes,
      createdAt: entry.createdAt,
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