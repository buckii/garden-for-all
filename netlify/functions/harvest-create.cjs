const Joi = require('joi');
const { connectDB } = require('./utils/db.js');
const { HarvestEntry, ProduceType, FoodPantry, HarvestLocation, Order } = require('./utils/models.js');
const { createResponse, createErrorResponse, handleCORS } = require('./utils/auth.js');
const { harvestUpdates } = require('./utils/pusher.js');
const { orderUpdates } = require('./utils/pusher.js');
const { getEasternDateString } = require('./utils/date.js');

const createHarvestSchema = Joi.object({
  produce_type_id: Joi.string().optional(),
  produceTypeId: Joi.string().optional(),
  location_id: Joi.string().optional(),
  locationId: Joi.string().optional(),
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
    const locationId = body.location_id || body.locationId;
    const pantryId = body.pantry_id || body.pantryId;
    const quantity = body.quantity;
    const unit = body.unit;
    const providedWeight = body.weight;
    const harvestDate = body.harvest_date || body.harvestDate || getEasternDateString();
    const harvesterName = body.harvester_name || body.harvesterName;
    const notes = body.notes;

    // Validate required fields
    if (!produceTypeId) {
      return createErrorResponse(400, 'Produce type ID is required');
    }
    if (!locationId) {
      return createErrorResponse(400, 'Location ID is required');
    }
    // Note: pantryId is now optional - if not provided, harvest stays in inventory

    // Verify produce type exists
    const produceType = await ProduceType.findById(produceTypeId);
    if (!produceType) {
      return createErrorResponse(400, 'Invalid produce type');
    }

    // Verify location exists
    const location = await HarvestLocation.findById(locationId);
    if (!location) {
      return createErrorResponse(400, 'Invalid harvest location');
    }

    // Verify pantry exists (if provided)
    let pantry = null;
    if (pantryId) {
      pantry = await FoodPantry.findById(pantryId);
      if (!pantry) {
        return createErrorResponse(400, 'Invalid pantry');
      }
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
      locationId,
      pantryId,
      quantity,
      unit,
      weight,
      weightEstimated,
      harvestDate: typeof harvestDate === 'string' ? harvestDate : getEasternDateString(),
      harvesterName: harvesterName || undefined,
      notes: notes || undefined
    });

    await entry.save();

    // Populate the saved entry for response
    const populateOptions = [
      {
        path: 'produceTypeId',
        populate: {
          path: 'categoryId',
          model: 'ProduceCategory'
        }
      },
      {
        path: 'locationId',
        model: 'HarvestLocation'
      }
    ];

    if (pantryId) {
      populateOptions.push({
        path: 'pantryId',
        model: 'FoodPantry'
      });
    }

    await entry.populate(populateOptions);

    // Transform response (include both snake_case and camelCase for compatibility)
    const transformedEntry = {
      _id: entry._id,
      produce_type_id: entry.produceTypeId._id,
      produceTypeId: entry.produceTypeId._id,
      location_id: entry.locationId._id,
      locationId: entry.locationId._id,
      pantry_id: entry.pantryId?._id || null,
      pantryId: entry.pantryId?._id || null,
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
      location: {
        _id: entry.locationId._id,
        name: entry.locationId.name,
        address: entry.locationId.address
      },
      pantry: entry.pantryId ? {
        _id: entry.pantryId._id,
        name: entry.pantryId.name
      } : null
    };

    // Send real-time update
    await harvestUpdates.created(transformedEntry);

    // If pantry is selected, try to add to an existing draft/in-progress order
    let addedToOrder = false;
    let orderInfo = null;

    if (pantryId) {
      try {
        // Find an existing draft or in-progress order for this pantry
        let existingOrder = await Order.findOne({
          pantryId: pantryId,
          status: { $in: ['draft', 'in-progress'] }
        }).sort({ updatedAt: -1 }); // Get the most recently updated order

        // If no existing order found, create a new one in 'in-progress' status
        if (!existingOrder) {
          const deliveryDate = new Date();

          existingOrder = new Order({
            pantryId: pantryId,
            deliveryDate: deliveryDate,
            status: 'in-progress',
            orderType: 'delivery',
            products: [],
            totalWeight: 0,
            totalValue: 0,
            notes: 'Auto-created from harvest entry'
          });
        }

        // Check if this produce type is already in the order
        const existingProductIndex = existingOrder.products.findIndex(
          p => p.produceTypeId.toString() === produceTypeId
        );

        if (existingProductIndex >= 0) {
          // Add to existing product line
          existingOrder.products[existingProductIndex].weight += weight;
          existingOrder.products[existingProductIndex].quantity += quantity;
          existingOrder.products[existingProductIndex].value =
            existingOrder.products[existingProductIndex].weight * existingOrder.products[existingProductIndex].pricePerLb;
        } else {
          // Add as new product line
          existingOrder.products.push({
            produceTypeId: produceTypeId,
            weight: weight,
            quantity: quantity,
            pricePerLb: produceType.pricePerLb || 0,
            value: weight * (produceType.pricePerLb || 0)
          });
        }

        // Recalculate order totals
        existingOrder.totalWeight = existingOrder.products.reduce((sum, p) => sum + (p.weight || 0), 0);
        existingOrder.totalValue = existingOrder.products.reduce((sum, p) => sum + (p.value || 0), 0);
        existingOrder.updatedAt = new Date();

        const wasNew = existingOrder.isNew;
        await existingOrder.save();

        // Populate order for response
        await existingOrder.populate([
          { path: 'pantryId' },
          { path: 'products.produceTypeId' }
        ]);

        // Send order update notification (created or updated)
        if (wasNew) {
          await orderUpdates.created(existingOrder);
        } else {
          await orderUpdates.updated(existingOrder);
        }

        addedToOrder = true;
        orderInfo = {
          orderId: existingOrder._id,
          orderStatus: existingOrder.status,
          totalWeight: existingOrder.totalWeight,
          totalValue: existingOrder.totalValue,
          isNewOrder: wasNew
        };
      } catch (orderError) {
        // Log error but don't fail the harvest creation
        console.error('Error adding harvest to order:', orderError.message);
      }
    }

    return createResponse(201, {
      success: true,
      data: transformedEntry,
      addedToOrder: addedToOrder,
      orderInfo: orderInfo
    });

  } catch (error) {
    console.error('Harvest create error:', error);
    return createErrorResponse(500, 'Internal server error');
  }
};