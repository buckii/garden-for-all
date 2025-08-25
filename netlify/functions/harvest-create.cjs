const Joi = require('joi');
const { connectDB } = require('./utils/db.js');
const { HarvestEntry, ProduceType } = require('./utils/models.js');
const { createResponse, createErrorResponse, handleCORS } = require('./utils/auth.js');

const createHarvestSchema = Joi.object({
  produceTypeId: Joi.string().required(),
  quantity: Joi.number().min(0).required(),
  unit: Joi.string().required(),
  harvestDate: Joi.date().required(),
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

    const { produceTypeId, quantity, unit, harvestDate, harvesterName, notes } = body;

    // Verify produce type exists
    const produceType = await ProduceType.findById(produceTypeId);
    if (!produceType) {
      return createErrorResponse(400, 'Invalid produce type');
    }

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

    // Populate the saved entry for response
    await entry.populate({
      path: 'produceTypeId',
      populate: {
        path: 'categoryId',
        model: 'ProduceCategory'
      }
    });

    // Transform response
    const transformedEntry = {
      _id: entry._id,
      produceTypeId: entry.produceTypeId._id,
      quantity: entry.quantity,
      unit: entry.unit,
      harvestDate: entry.harvestDate.toISOString().split('T')[0],
      harvesterName: entry.harvesterName,
      notes: entry.notes,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
      produceType: {
        _id: entry.produceTypeId._id,
        name: entry.produceTypeId.name,
        unitType: entry.produceTypeId.unitType,
        conversionFactor: entry.produceTypeId.conversionFactor,
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