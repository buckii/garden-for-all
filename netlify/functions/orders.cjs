const { connectDB } = require('./utils/db.js');
const { validateToken, extractToken, createResponse, createErrorResponse, handleCORS } = require('./utils/auth.js');
const { Order, FoodPantry, ProduceType, HarvestEntry } = require('./utils/models.js');
const { User } = require('./utils/User.js');
const { orderUpdates } = require('./utils/pusher.js');

exports.handler = async function(event, context) {
  if (event.httpMethod === 'OPTIONS') {
    return handleCORS();
  }

  try {
    await connectDB();

    if (event.httpMethod === 'GET') {
      // GET requests don't require authentication for public read access
      return await getOrders(event, null);
    }

    // Validate authentication for POST, PUT, DELETE methods
    const token = extractToken(event.headers.authorization);
    if (!token) {
      return createErrorResponse(401, 'Authorization token required');
    }

    let user;
    try {
      user = await validateToken(token);
    } catch (authError) {
      console.error('Authentication error:', authError.message);
      return createErrorResponse(401, 'Invalid or expired token');
    }

    if (event.httpMethod === 'POST') {
      return await createOrder(event, user);
    } else if (event.httpMethod === 'PUT') {
      return await updateOrder(event, user);
    } else if (event.httpMethod === 'DELETE') {
      return await deleteOrder(event, user);
    } else {
      return createErrorResponse(405, 'Method Not Allowed');
    }
  } catch (error) {
    console.error('Orders API error:', error);
    return createErrorResponse(500, 'Internal server error');
  }
};

// Helper function to recalculate order totals based on harvest entries
async function recalculateOrderTotals(orderId) {
  const harvestEntries = await HarvestEntry.find({ orderId })
    .populate('produceTypeId', 'pricePerLb');

  let totalWeight = 0;
  let totalValue = 0;

  harvestEntries.forEach(entry => {
    const weight = entry.weight || 0;
    const pricePerLb = entry.produceTypeId?.pricePerLb || 0;
    totalWeight += weight;
    totalValue += (weight * pricePerLb);
  });

  return { totalWeight, totalValue };
}

async function createOrder(event, user) {
  try {
    const orderData = JSON.parse(event.body);

    // Validate required fields
    if (!orderData.pantryId || !orderData.deliveryDate) {
      return createErrorResponse(400, 'Missing required fields: pantryId and deliveryDate');
    }

    // Validate pantry exists
    const pantry = await FoodPantry.findById(orderData.pantryId);
    if (!pantry) {
      return createErrorResponse(400, 'Invalid pantry ID');
    }

    // Create order (without products - harvest entries will be added separately)
    const order = new Order({
      pantryId: orderData.pantryId,
      deliveryDate: new Date(orderData.deliveryDate),
      pickupTime: orderData.pickupTime || '',
      packerName: orderData.packerName || '',
      orderType: orderData.orderType || 'delivery',
      notes: orderData.notes || '',
      status: orderData.status || 'draft',
      totalWeight: 0,
      totalValue: 0,
      createdBy: user._id,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await order.save();

    // If harvest entry IDs were provided, assign them to this order
    if (orderData.harvestEntryIds && orderData.harvestEntryIds.length > 0) {
      await HarvestEntry.updateMany(
        {
          _id: { $in: orderData.harvestEntryIds },
          pantryId: orderData.pantryId,  // Security: only allow entries for the same pantry
          $or: [
            { orderId: null },
            { orderId: { $exists: false } }
          ]
        },
        { $set: { orderId: order._id } }
      );

      // Recalculate totals
      const totals = await recalculateOrderTotals(order._id);
      order.totalWeight = totals.totalWeight;
      order.totalValue = totals.totalValue;
      await order.save();
    }

    // Populate the order for response
    const populatedOrder = await Order.findById(order._id)
      .populate('pantryId')
      .populate('createdBy', 'email');

    // Get harvest entries for this order
    const harvestEntries = await HarvestEntry.find({ orderId: order._id })
      .populate('produceTypeId')
      .populate('locationId');

    // Send real-time update
    await orderUpdates.created(populatedOrder);

    return createResponse(201, {
      success: true,
      data: {
        ...populatedOrder.toObject(),
        harvestEntries
      }
    });

  } catch (error) {
    console.error('Create order error:', error);
    return createErrorResponse(500, `Failed to create order: ${error.message}`);
  }
}

async function getOrders(event, user) {
  try {
    const queryParams = event.queryStringParameters || {};
    const {
      page = 1,
      limit = 50,
      status,
      pantryId,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      includeHarvestEntries = 'true'
    } = queryParams;

    // Build query
    let query = {};

    if (status) {
      query.status = status;
    }

    if (pantryId) {
      query.pantryId = pantryId;
    }

    if (startDate || endDate) {
      query.deliveryDate = {};
      if (startDate) {
        query.deliveryDate.$gte = new Date(startDate);
      }
      if (endDate) {
        // Add one day and use $lt to include the entire end date
        const endDatePlusOne = new Date(endDate);
        endDatePlusOne.setDate(endDatePlusOne.getDate() + 1);
        query.deliveryDate.$lt = endDatePlusOne;
      }
    }

    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Fetch orders with populated data
    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('pantryId')
        .populate('createdBy', 'email')
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Order.countDocuments(query)
    ]);

    // Optionally include harvest entries for each order
    if (includeHarvestEntries === 'true') {
      for (const order of orders) {
        const harvestEntries = await HarvestEntry.find({ orderId: order._id })
          .populate('produceTypeId')
          .populate('locationId')
          .lean();

        order.harvestEntries = harvestEntries;

        // Group by produce type for easier display (like the old products array)
        const productsMap = new Map();
        harvestEntries.forEach(entry => {
          const produceTypeId = entry.produceTypeId?._id?.toString();
          if (!produceTypeId) return;

          if (!productsMap.has(produceTypeId)) {
            productsMap.set(produceTypeId, {
              produceTypeId: entry.produceTypeId._id,
              produceType: entry.produceTypeId,
              weight: 0,
              quantity: 0,
              pricePerLb: entry.produceTypeId.pricePerLb || 0,
              value: 0,
              entries: []
            });
          }

          const product = productsMap.get(produceTypeId);
          product.weight += entry.weight || 0;
          product.quantity += entry.quantity || 0;
          product.value += (entry.weight || 0) * (entry.produceTypeId.pricePerLb || 0);
          product.entries.push({
            _id: entry._id,
            weight: entry.weight,
            quantity: entry.quantity,
            harvestDate: entry.harvestDate,
            location: entry.locationId?.name
          });
        });

        order.products = Array.from(productsMap.values());
      }
    }

    // Calculate pagination info
    const totalPages = Math.ceil(total / limitNum);

    return createResponse(200, {
      success: true,
      data: {
        orders,
        pagination: {
          current: pageNum,
          pages: totalPages,
          total: total,
          limit: limitNum,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1
        }
      }
    });

  } catch (error) {
    console.error('Get orders error:', error);
    return createErrorResponse(500, 'Failed to fetch orders');
  }
}

async function updateOrder(event, user) {
  try {
    const orderId = event.queryStringParameters?.id;

    if (!orderId) {
      return createErrorResponse(400, 'Order ID is required');
    }

    const updateData = JSON.parse(event.body);

    // Find the order
    const order = await Order.findById(orderId);
    if (!order) {
      return createErrorResponse(404, 'Order not found');
    }

    // Update allowed fields
    const allowedUpdates = ['status', 'notes', 'deliveryDate', 'pickupTime', 'packerName', 'orderType', 'pantryId'];
    const updates = {};

    for (const field of allowedUpdates) {
      if (updateData[field] !== undefined) {
        updates[field] = updateData[field];
      }
    }

    // Handle adding harvest entries
    if (updateData.addHarvestEntryIds && updateData.addHarvestEntryIds.length > 0) {
      await HarvestEntry.updateMany(
        {
          _id: { $in: updateData.addHarvestEntryIds },
          pantryId: order.pantryId,  // Security: only allow entries for the same pantry
          $or: [
            { orderId: null },
            { orderId: { $exists: false } }
          ]
        },
        { $set: { orderId: order._id } }
      );
    }

    // Handle removing harvest entries
    if (updateData.removeHarvestEntryIds && updateData.removeHarvestEntryIds.length > 0) {
      await HarvestEntry.updateMany(
        {
          _id: { $in: updateData.removeHarvestEntryIds },
          orderId: order._id
        },
        { $unset: { orderId: 1, pantryId: 1 } }
      );
    }

    // Recalculate totals if harvest entries were modified
    if (updateData.addHarvestEntryIds || updateData.removeHarvestEntryIds) {
      const totals = await recalculateOrderTotals(order._id);
      updates.totalWeight = totals.totalWeight;
      updates.totalValue = totals.totalValue;
    }

    updates.updatedAt = new Date();
    updates.updatedBy = user._id;

    // Update the order
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      updates,
      { new: true, runValidators: true }
    )
    .populate('pantryId')
    .populate('createdBy', 'email')
    .populate('updatedBy', 'email');

    // Get harvest entries for this order
    const harvestEntries = await HarvestEntry.find({ orderId: updatedOrder._id })
      .populate('produceTypeId')
      .populate('locationId');

    // Send real-time update
    await orderUpdates.updated(updatedOrder);

    return createResponse(200, {
      success: true,
      data: {
        ...updatedOrder.toObject(),
        harvestEntries
      }
    });

  } catch (error) {
    console.error('Update order error:', error);
    return createErrorResponse(500, 'Failed to update order');
  }
}

async function deleteOrder(event, user) {
  try {
    const orderId = event.queryStringParameters?.id;

    if (!orderId) {
      return createErrorResponse(400, 'Order ID is required');
    }

    // Find and delete the order
    const order = await Order.findById(orderId);
    if (!order) {
      return createErrorResponse(404, 'Order not found');
    }

    // Release all harvest entries back to inventory (clear both orderId and pantryId)
    await HarvestEntry.updateMany(
      { orderId: order._id },
      { $unset: { orderId: 1, pantryId: 1 } }
    );

    await Order.findByIdAndDelete(orderId);

    // Send real-time update
    await orderUpdates.deleted(orderId);

    return createResponse(200, {
      success: true,
      message: 'Order deleted successfully'
    });

  } catch (error) {
    console.error('Delete order error:', error);
    return createErrorResponse(500, 'Failed to delete order');
  }
}
