const { connectDB } = require('./utils/db.js');
const { createResponse, createErrorResponse, handleCORS } = require('./utils/auth.js');
const { HarvestEntry, Order } = require('./utils/models.js');

exports.handler = async function(event, context) {
  if (event.httpMethod === 'OPTIONS') {
    return handleCORS();
  }

  if (event.httpMethod !== 'GET') {
    return createErrorResponse(405, 'Method Not Allowed');
  }

  try {
    await connectDB();

    const queryParams = event.queryStringParameters || {};
    const { days = 14 } = queryParams; // Default to last 14 days

    // Calculate date range
    const today = new Date();
    const startDate = new Date();
    startDate.setDate(today.getDate() - parseInt(days));

    // Get all harvest entries in the date range
    const harvestEntries = await HarvestEntry.find({
      harvestDate: { $gte: startDate, $lte: today }
    })
    .populate('produceTypeId', 'name pricePerLb conversionFactor')
    .populate('pantryId', 'name')
    .sort({ harvestDate: -1 });

    // Get all orders that reduce inventory (ready and completed orders)
    const orders = await Order.find({
      deliveryDate: { $gte: startDate, $lte: today },
      status: { $in: ['ready', 'completed'] }
    })
    .populate('pantryId', 'name')
    .lean();


    // Create allocation map: key = "YYYY-MM-DD:produceTypeId:pantryId", value = allocated weight
    const allocatedWeights = new Map();

    orders.forEach(order => {
      if (order.products) {
        const deliveryDate = new Date(order.deliveryDate).toISOString().split('T')[0];
        order.products.forEach(product => {
          const key = `${deliveryDate}:${product.produceTypeId}:${order.pantryId._id || order.pantryId}`;
          const existing = allocatedWeights.get(key) || 0;
          allocatedWeights.set(key, existing + (product.weight || 0));
        });
      }
    });

    // Group harvest entries and calculate available inventory
    const harvestGroups = new Map();

    harvestEntries.forEach(entry => {
      if (!entry.produceTypeId || !entry.pantryId) return;

      const harvestDate = new Date(entry.harvestDate).toISOString().split('T')[0];
      const produceTypeId = entry.produceTypeId._id.toString();
      const pantryId = entry.pantryId._id.toString();
      
      const key = `${harvestDate}:${produceTypeId}:${pantryId}`;
      
      if (!harvestGroups.has(key)) {
        harvestGroups.set(key, {
          harvestDate: entry.harvestDate,
          produceType: entry.produceTypeId.name,
          pantryId: pantryId,
          pantryName: entry.pantryId.name,
          totalHarvested: 0,
          pricePerLb: entry.produceTypeId.pricePerLb || 0
        });
      }
      
      const group = harvestGroups.get(key);
      const weight = entry.weight || (entry.quantity * (entry.produceTypeId.conversionFactor || 1));
      group.totalHarvested += weight;
    });

    // Calculate available inventory by subtracting allocated amounts
    const availableInventory = [];

    harvestGroups.forEach((group, key) => {
      const allocatedWeight = allocatedWeights.get(key) || 0;
      const availableWeight = group.totalHarvested - allocatedWeight;
      
      // Only include items with meaningful available weight (> 0.1 lbs)
      if (availableWeight > 0.1) {
        const daysOld = Math.floor((today.getTime() - new Date(group.harvestDate).getTime()) / (1000 * 60 * 60 * 24));
        
        availableInventory.push({
          harvestDate: group.harvestDate,
          produceType: group.produceType,
          pantryName: group.pantryName,
          totalHarvested: group.totalHarvested,
          allocatedWeight: allocatedWeight,
          availableWeight: availableWeight,
          totalValue: availableWeight * group.pricePerLb,
          daysOld: daysOld,
          pricePerLb: group.pricePerLb
        });
      }
    });

    // Group by produce type and harvest date for display
    const groupedInventory = new Map();
    
    availableInventory.forEach(item => {
      const groupKey = `${item.harvestDate}:${item.produceType}`;
      
      if (!groupedInventory.has(groupKey)) {
        groupedInventory.set(groupKey, {
          harvestDate: item.harvestDate,
          produceType: item.produceType,
          totalWeight: 0,
          totalValue: 0,
          pantries: [],
          daysOld: item.daysOld
        });
      }
      
      const group = groupedInventory.get(groupKey);
      group.totalWeight += item.availableWeight;
      group.totalValue += item.totalValue;
      
      group.pantries.push({
        name: item.pantryName,
        weight: item.availableWeight,
        harvested: item.totalHarvested,
        allocated: item.allocatedWeight
      });
    });

    // Convert to array and sort by date (newest first) then by weight (heaviest first)
    const result = Array.from(groupedInventory.values())
      .sort((a, b) => {
        const dateCompare = new Date(b.harvestDate).getTime() - new Date(a.harvestDate).getTime();
        if (dateCompare !== 0) return dateCompare;
        return b.totalWeight - a.totalWeight;
      });


    return createResponse(200, {
      success: true,
      data: {
        items: result,
        summary: {
          totalItems: result.length,
          totalWeight: result.reduce((sum, item) => sum + item.totalWeight, 0),
          totalValue: result.reduce((sum, item) => sum + item.totalValue, 0),
          dateRange: {
            start: startDate.toISOString().split('T')[0],
            end: today.toISOString().split('T')[0],
            days: parseInt(days)
          }
        }
      }
    });

  } catch (error) {
    console.error('Available inventory error:', error);
    return createErrorResponse(500, 'Internal server error');
  }
};