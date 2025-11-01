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
    const { days = 2000 } = queryParams; // Default to last 2000 days to include all data

    // Calculate date range
    const today = new Date();
    const startDate = new Date();
    startDate.setDate(today.getDate() - parseInt(days));

    // Get all harvest entries in the date range that are NOT assigned to an order
    // Available inventory = harvest entries where orderId is null/undefined
    const harvestEntries = await HarvestEntry.find({
      harvestDate: { $gte: startDate, $lte: today },
      $or: [
        { orderId: null },
        { orderId: { $exists: false } }
      ]
    })
    .populate('produceTypeId', 'name pricePerLb conversionFactor')
    .populate('pantryId', 'name')
    .sort({ harvestDate: -1 });

    // Group harvest entries by produce type and pantry (across all harvest dates)
    const harvestGroups = new Map();

    harvestEntries.forEach(entry => {
      if (!entry.produceTypeId || !entry.pantryId) return;

      const produceTypeId = entry.produceTypeId._id.toString();
      const pantryId = entry.pantryId._id.toString();

      // Key without date - we aggregate all harvests for this pantry/produce combo
      const key = `${produceTypeId}:${pantryId}`;

      if (!harvestGroups.has(key)) {
        harvestGroups.set(key, {
          produceType: entry.produceTypeId.name,
          pantryId: pantryId,
          pantryName: entry.pantryId.name,
          totalHarvested: 0,
          pricePerLb: entry.produceTypeId.pricePerLb || 0,
          harvests: []  // Track individual harvests for detailed display
        });
      }

      const group = harvestGroups.get(key);
      const weight = entry.weight || (entry.quantity * (entry.produceTypeId.conversionFactor || 1));
      group.totalHarvested += weight;

      // Add individual harvest details
      group.harvests.push({
        date: entry.harvestDate,
        weight: weight,
        entryId: entry._id
      });
    });

    // Build available inventory (no need to subtract allocated weight anymore)
    const availableInventory = [];

    harvestGroups.forEach((group, key) => {
      const availableWeight = group.totalHarvested;

      // Only include items with meaningful available weight (> 0.1 lbs)
      if (availableWeight > 0.1) {
        // Find the oldest harvest date for this group
        const oldestHarvest = group.harvests.reduce((oldest, h) => {
          return new Date(h.date) < new Date(oldest.date) ? h : oldest;
        }, group.harvests[0]);

        const daysOld = Math.floor((today.getTime() - new Date(oldestHarvest.date).getTime()) / (1000 * 60 * 60 * 24));

        availableInventory.push({
          produceType: group.produceType,
          pantryName: group.pantryName,
          totalHarvested: group.totalHarvested,
          availableWeight: availableWeight,
          totalValue: availableWeight * group.pricePerLb,
          daysOld: daysOld,
          pricePerLb: group.pricePerLb,
          harvests: group.harvests
        });
      }
    });

    // Group by produce type for display (combining all pantries)
    const groupedInventory = new Map();

    availableInventory.forEach(item => {
      const groupKey = item.produceType;

      if (!groupedInventory.has(groupKey)) {
        groupedInventory.set(groupKey, {
          produceType: item.produceType,
          totalWeight: 0,
          totalValue: 0,
          pantries: [],
          daysOld: item.daysOld,
          harvestDate: item.harvests[0]?.date || new Date()  // Use most recent harvest for sorting
        });
      }

      const group = groupedInventory.get(groupKey);
      group.totalWeight += item.availableWeight;
      group.totalValue += item.totalValue;

      // Update daysOld to be the oldest across all items for this produce type
      if (item.daysOld > group.daysOld) {
        group.daysOld = item.daysOld;
      }

      group.pantries.push({
        name: item.pantryName,
        weight: item.availableWeight,
        harvested: item.totalHarvested
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
    console.error('Error stack:', error.stack);
    console.error('Error message:', error.message);
    return createErrorResponse(500, `Internal server error: ${error.message}`);
  }
};