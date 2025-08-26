const { connectDB } = require('./utils/db.js');
const { HarvestEntry, ProduceType, FoodPantry, PantryDistribution } = require('./utils/models.js');
const { validateToken, extractToken, createResponse, createErrorResponse, handleCORS } = require('./utils/auth.js');

exports.handler = async function(event, context) {
  if (event.httpMethod === 'OPTIONS') {
    return handleCORS();
  }

  if (event.httpMethod !== 'GET') {
    return createErrorResponse(405, 'Method Not Allowed');
  }

  try {
    await connectDB();

    // Require authentication for dashboard data
    const token = extractToken(event.headers.authorization);
    if (!token) {
      return createErrorResponse(401, 'Access token required');
    }

    await validateToken(token); // Just verify token is valid

    // Calculate date ranges using UTC midnight
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setUTCDate(today.getUTCDate() + 1);
    
    const startOfWeek = new Date(today);
    startOfWeek.setUTCDate(today.getUTCDate() - today.getUTCDay());
    
    const startOfMonth = new Date(today.getUTCFullYear(), today.getUTCMonth(), 1);
    startOfMonth.setUTCHours(0, 0, 0, 0);
    
    const startOfYear = new Date(today.getUTCFullYear(), 0, 1);
    startOfYear.setUTCHours(0, 0, 0, 0);

    // Get harvest entries with produce types for calculations
    const [dailyEntries, weeklyEntries, monthlyEntries, yearlyEntries] = await Promise.all([
      HarvestEntry.find({ 
        harvestDate: { 
          $gte: today,
          $lt: tomorrow 
        } 
      }).populate('produceTypeId'),
      HarvestEntry.find({ harvestDate: { $gte: startOfWeek } }).populate('produceTypeId'),
      HarvestEntry.find({ harvestDate: { $gte: startOfMonth } }).populate('produceTypeId'),
      HarvestEntry.find({ harvestDate: { $gte: startOfYear } }).populate('produceTypeId')
    ]);

    // Helper function to calculate summary
    const calculateSummary = (entries) => {
      return entries.reduce((acc, entry) => {
        // Convert quantity to pounds using conversion factor
        const conversionFactor = entry.produceTypeId?.conversionFactor || 1;
        const quantityInPounds = entry.quantity * conversionFactor;
        acc.totalQuantity += quantityInPounds;
        
        // Calculate value using price per pound
        const pricePerLb = entry.produceTypeId?.pricePerLb || 0;
        const value = quantityInPounds * pricePerLb;
        acc.totalValue += value;
        acc.count += 1;
        
        return acc;
      }, { totalQuantity: 0, totalValue: 0, count: 0 });
    };

    const summary = {
      daily: calculateSummary(dailyEntries),
      weekly: calculateSummary(weeklyEntries),
      monthly: calculateSummary(monthlyEntries),
      yearly: calculateSummary(yearlyEntries)
    };

    return createResponse(200, {
      success: true,
      data: summary
    });

  } catch (error) {
    console.error('Dashboard summary error:', error);
    return createErrorResponse(500, 'Internal server error');
  }
};