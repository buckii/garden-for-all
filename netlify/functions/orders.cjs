const { connectDB } = require('./utils/db.js');
const { validateToken, extractToken, createResponse, createErrorResponse, handleCORS } = require('./utils/auth.js');
const { Order, FoodPantry, ProduceType } = require('./utils/models.js');
const { User } = require('./utils/User.js');
const { orderUpdates } = require('./utils/pusher.js');

exports.handler = async function(event, context) {
  if (event.httpMethod === 'OPTIONS') {
    return handleCORS();
  }

  try {
    await connectDB();

    // Validate authentication for all methods
    const token = extractToken(event.headers.authorization);
    if (!token) {
      return createErrorResponse(401, 'Authorization token required');
    }

    const user = await validateToken(token);

    if (event.httpMethod === 'POST') {
      return await createOrder(event, user);
    } else if (event.httpMethod === 'GET') {
      return await getOrders(event, user);
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

async function createOrder(event, user) {
  try {
    const orderData = JSON.parse(event.body);
    console.log('Creating order with data:', JSON.stringify(orderData, null, 2));
    console.log('User creating order:', user.email);
    
    // Validate required fields
    if (!orderData.pantryId || !orderData.deliveryDate || !orderData.packerName || !orderData.products || orderData.products.length === 0) {
      return createErrorResponse(400, 'Missing required fields: pantryId, deliveryDate, packerName, and at least one product');
    }

    // Validate pantry exists
    const pantry = await FoodPantry.findById(orderData.pantryId);
    if (!pantry) {
      return createErrorResponse(400, 'Invalid pantry ID');
    }

    // Validate all products exist
    const produceTypeIds = orderData.products.map(p => p.produceTypeId);
    const produceTypes = await ProduceType.find({ _id: { $in: produceTypeIds } });
    
    if (produceTypes.length !== produceTypeIds.length) {
      return createErrorResponse(400, 'One or more invalid produce type IDs');
    }

    // Calculate totals
    let totalWeight = 0;
    let totalValue = 0;
    const processedProducts = orderData.products.map(product => {
      const produceType = produceTypes.find(pt => pt._id.toString() === product.produceTypeId);
      const weight = product.weight || 0;
      const value = weight * (produceType?.pricePerLb || 0);
      
      totalWeight += weight;
      totalValue += value;
      
      return {
        produceTypeId: product.produceTypeId,
        weight: weight,
        quantity: product.quantity || 0,
        pricePerLb: produceType?.pricePerLb || 0,
        value: value
      };
    });

    // Create order
    const order = new Order({
      pantryId: orderData.pantryId,
      deliveryDate: new Date(orderData.deliveryDate),
      pickupTime: orderData.pickupTime || '',
      packerName: orderData.packerName,
      orderType: orderData.orderType || 'delivery',
      notes: orderData.notes || '',
      products: processedProducts,
      status: orderData.status || 'pending',
      totalWeight: totalWeight,
      totalValue: totalValue,
      createdBy: user._id,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await order.save();
    
    console.log('Order saved successfully:', order._id);

    // Populate the order for response
    const populatedOrder = await Order.findById(order._id)
      .populate('pantryId')
      .populate('products.produceTypeId')
      .populate('createdBy', 'email');

    // Send real-time update
    await orderUpdates.created(populatedOrder);

    return createResponse(201, {
      success: true,
      data: populatedOrder
    });
    
  } catch (error) {
    console.error('Create order error:', error);
    console.error('Error details:', error.message, error.stack);
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
      sortOrder = 'desc'
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
      if (startDate) query.deliveryDate.$gte = new Date(startDate);
      if (endDate) query.deliveryDate.$lte = new Date(endDate);
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
    
    // Manually populate produce types for products
    for (const order of orders) {
      if (order.products && order.products.length > 0) {
        for (const product of order.products) {
          if (product.produceTypeId) {
            const produceType = await ProduceType.findById(product.produceTypeId);
            if (produceType) {
              product.produceType = produceType;
            }
          }
        }
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
    const allowedUpdates = ['status', 'notes', 'deliveryDate', 'pickupTime', 'packerName', 'orderType', 'pantryId', 'products', 'totalWeight', 'totalValue'];
    const updates = {};
    
    for (const field of allowedUpdates) {
      if (updateData[field] !== undefined) {
        updates[field] = updateData[field];
      }
    }
    
    // If products were updated, recalculate totals
    if (updateData.products) {
      const produceTypeIds = updateData.products.map(p => p.produceTypeId);
      const produceTypes = await ProduceType.find({ _id: { $in: produceTypeIds } });
      
      let totalWeight = 0;
      let totalValue = 0;
      
      const processedProducts = updateData.products.map(product => {
        const produceType = produceTypes.find(pt => pt._id.toString() === product.produceTypeId);
        const weight = product.weight || 0;
        const value = weight * (produceType?.pricePerLb || 0);
        
        totalWeight += weight;
        totalValue += value;
        
        return {
          produceTypeId: product.produceTypeId,
          weight: weight,
          quantity: product.quantity || 0,
          pricePerLb: produceType?.pricePerLb || 0,
          value: value
        };
      });
      
      updates.products = processedProducts;
      updates.totalWeight = totalWeight;
      updates.totalValue = totalValue;
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
    .populate('products.produceTypeId')
    .populate('createdBy', 'email')
    .populate('updatedBy', 'email');

    // Send real-time update
    await orderUpdates.updated(updatedOrder);

    return createResponse(200, {
      success: true,
      data: updatedOrder
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