const { connectDB } = require('./utils/db.js');
const { HarvestEntry, FoodPantry } = require('./utils/models.js');
const { createResponse, createErrorResponse, handleCORS } = require('./utils/auth.js');

exports.handler = async function(event, context) {
  if (event.httpMethod === 'OPTIONS') {
    return handleCORS();
  }

  if (event.httpMethod !== 'GET') {
    return createErrorResponse(405, 'Method Not Allowed');
  }

  try {
    await connectDB();

    // Get the start of the current year
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    startOfYear.setUTCHours(0, 0, 0, 0);

    // Fetch all active pantries with county information
    const pantries = await FoodPantry.find({ isActive: true }).lean();

    // Create a map of pantry IDs to counties
    const pantryCountyMap = new Map();
    pantries.forEach(pantry => {
      pantryCountyMap.set(pantry._id.toString(), pantry.county || 'Other');
    });

    // Fetch all harvest entries for the current year
    const yearlyEntries = await HarvestEntry.find({
      harvestDate: { $gte: startOfYear }
    }).populate('produceTypeId').lean();

    // Group by county and calculate totals
    const countyStats = {};

    yearlyEntries.forEach(entry => {
      const pantryId = entry.pantryId?.toString();
      const county = pantryCountyMap.get(pantryId) || 'Other';

      if (!countyStats[county]) {
        countyStats[county] = {
          county: county,
          totalWeight: 0,
          totalValue: 0,
          entryCount: 0,
          pantries: new Set()
        };
      }

      const weightInPounds = entry.weight || 0;
      const pricePerLb = entry.produceTypeId?.pricePerLb || 0;
      const value = weightInPounds * pricePerLb;

      countyStats[county].totalWeight += weightInPounds;
      countyStats[county].totalValue += value;
      countyStats[county].entryCount += 1;
      countyStats[county].pantries.add(pantryId);
    });

    // Convert to array and format pantry counts
    const statsArray = Object.values(countyStats).map(stat => ({
      county: stat.county,
      totalWeight: stat.totalWeight,
      totalValue: stat.totalValue,
      entryCount: stat.entryCount,
      pantryCount: stat.pantries.size
    }));

    // Sort by total weight descending
    statsArray.sort((a, b) => b.totalWeight - a.totalWeight);

    // Calculate grand totals
    const grandTotal = statsArray.reduce((acc, stat) => ({
      totalWeight: acc.totalWeight + stat.totalWeight,
      totalValue: acc.totalValue + stat.totalValue,
      entryCount: acc.entryCount + stat.entryCount
    }), { totalWeight: 0, totalValue: 0, entryCount: 0 });

    return createResponse(200, {
      success: true,
      data: {
        year: now.getFullYear(),
        counties: statsArray,
        totals: grandTotal
      }
    });

  } catch (error) {
    console.error('County stats error:', error);
    return createErrorResponse(500, 'Internal server error');
  }
};
