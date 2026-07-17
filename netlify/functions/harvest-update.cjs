const Joi = require('joi');
const { connectDB } = require('./utils/db.js');
const { HarvestEntry, ProduceType, FoodPantry } = require('./utils/models.js');
const { createResponse, createErrorResponse, handleCORS, extractToken, validateToken } = require('./utils/auth.js');
const { harvestUpdates } = require('./utils/pusher.js');
const { getEasternDateString } = require('./utils/date.js');

// Entries from today can be edited/deleted freely (the frictionless harvester
// flow). Touching a previous day's entry requires a signed-in user so that
// historical records can't be altered anonymously.
async function requireAuthForPastEntry(event, entry, action) {
  // harvestDate is stored as UTC midnight of the harvest calendar day, so
  // read it back as a UTC date (matching harvest-list). Rendering it in
  // Eastern time would shift it to 8 PM the previous day and misclassify
  // every entry from today as a past entry.
  const entryDate = new Date(entry.harvestDate).toISOString().split('T')[0];
  if (entryDate === getEasternDateString()) {
    return null; // Today's entry — no auth required
  }

  const token = extractToken(event.headers && event.headers.authorization);
  if (!token) {
    return createErrorResponse(
      401,
      `This harvest entry is from ${entryDate}. You must be signed in to ${action} entries from a previous day. Only today's entries can be ${action === 'edit' ? 'edited' : 'deleted'} without signing in.`
    );
  }

  try {
    await validateToken(token);
  } catch (authError) {
    return createErrorResponse(
      401,
      `Your session has expired. Please sign in again to ${action} harvest entries from a previous day.`
    );
  }

  return null;
}

const updateHarvestSchema = Joi.object({
  produceTypeId: Joi.string().optional(),
  pantryId: Joi.string().allow('', null).optional(),
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

    // Editing a previous day's entry requires authentication
    const authError = await requireAuthForPastEntry(event, existingEntry, 'edit');
    if (authError) {
      return authError;
    }

    // Validate produce type exists if provided
    if (value.produceTypeId) {
      const produceType = await ProduceType.findById(value.produceTypeId);
      if (!produceType) {
        return createErrorResponse(400, 'Invalid produce type');
      }
    }

    // Convert empty string to null for pantryId
    if (value.pantryId === '') {
      value.pantryId = null;
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
      pantry_id: updatedEntry.pantryId?._id || null,
      pantryId: updatedEntry.pantryId?._id || null,
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
      pantry: updatedEntry.pantryId ? {
        _id: updatedEntry.pantryId._id,
        name: updatedEntry.pantryId.name
      } : null
    };

    // Send real-time update
    await harvestUpdates.updated(transformedEntry);

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