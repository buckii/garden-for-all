const Joi = require('joi');
const { connectDB } = require('./utils/db.js');
const { HarvestEntry, ProduceType, FoodPantry } = require('./utils/models.js');
const { createResponse, createErrorResponse, handleCORS } = require('./utils/auth.js');

const updateHarvestSchema = Joi.object({
  produceTypeId: Joi.string().optional(),
  pantryId: Joi.string().optional(),
  quantity: Joi.number().min(0).optional(),
  unit: Joi.string().optional(),
  weight: Joi.number().min(0).optional(),
  harvestDate: Joi.date().optional(),
  harvesterName: Joi.string().allow('').optional(),
  notes: Joi.string().allow('').optional()
});

exports.handler = async function(event, context) {
  if (event.httpMethod === 'OPTIONS') {
    return handleCORS();
  }

  if (event.httpMethod !== 'PUT') {
    return createErrorResponse(405, 'Method Not Allowed');
  }

  try {
    await connectDB();

    const { id } = event.queryStringParameters || {};

    if (!id) {
      return createErrorResponse(400, 'Harvest entry ID is required');
    }

    const body = JSON.parse(event.body || '{}');
    
    // Validate request body
    const { error, value } = updateHarvestSchema.validate(body);
    if (error) {
      return createErrorResponse(400, error.details[0].message);
    }

    // Find the existing harvest entry
    const existingEntry = await HarvestEntry.findById(id);
    if (!existingEntry) {
      return createErrorResponse(404, 'Harvest entry not found');
    }

    // Validate produce type exists if provided
    if (value.produceTypeId) {
      const produceType = await ProduceType.findById(value.produceTypeId);
      if (!produceType) {
        return createErrorResponse(400, 'Invalid produce type');
      }
    }

    // Validate pantry exists if provided
    if (value.pantryId) {
      const pantry = await FoodPantry.findById(value.pantryId);
      if (!pantry) {
        return createErrorResponse(400, 'Invalid pantry');
      }
    }

    // Update weight estimation flag if weight is being updated
    if (value.weight !== undefined) {
      value.weightEstimated = false; // Manual weight entry
    }

    // Update the harvest entry
    const updatedEntry = await HarvestEntry.findByIdAndUpdate(
      id,
      value,
      { new: true, runValidators: true }
    );

    // Populate the updated entry for response
    await updatedEntry.populate([
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

    // Transform response
    const transformedEntry = {
      _id: updatedEntry._id,
      produce_type_id: updatedEntry.produceTypeId._id,
      produceTypeId: updatedEntry.produceTypeId._id,
      pantry_id: updatedEntry.pantryId._id,
      pantryId: updatedEntry.pantryId._id,
      quantity: updatedEntry.quantity,
      unit: updatedEntry.unit,
      weight: updatedEntry.weight,
      weightEstimated: updatedEntry.weightEstimated,
      weight_estimated: updatedEntry.weightEstimated,
      harvestDate: updatedEntry.harvestDate.toISOString().split('T')[0],
      harvest_date: updatedEntry.harvestDate.toISOString().split('T')[0],
      harvester_name: updatedEntry.harvesterName,
      harvesterName: updatedEntry.harvesterName,
      notes: updatedEntry.notes,
      created_at: updatedEntry.createdAt,
      createdAt: updatedEntry.createdAt,
      updated_at: updatedEntry.updatedAt,
      updatedAt: updatedEntry.updatedAt,
      produceType: {
        _id: updatedEntry.produceTypeId._id,
        name: updatedEntry.produceTypeId.name,
        unitType: updatedEntry.produceTypeId.unitType,
        unit_type: updatedEntry.produceTypeId.unitType,
        conversionFactor: updatedEntry.produceTypeId.conversionFactor,
        conversion_factor: updatedEntry.produceTypeId.conversionFactor,
        category: {
          _id: updatedEntry.produceTypeId.categoryId._id,
          name: updatedEntry.produceTypeId.categoryId.name,
          description: updatedEntry.produceTypeId.categoryId.description
        }
      },
      pantry: {
        _id: updatedEntry.pantryId._id,
        name: updatedEntry.pantryId.name
      }
    };

    return createResponse(200, {
      success: true,
      message: 'Harvest entry updated successfully',
      data: transformedEntry
    });

  } catch (error) {
    console.error('Harvest update error:', error);
    return createErrorResponse(500, `Failed to update harvest entry: ${error.message}`);
  }
};