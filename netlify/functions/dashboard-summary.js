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

    // Calculate date ranges
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfYear = new Date(today.getFullYear(), 0, 1);

    // Get harvest entries with produce types for calculations
    const [dailyEntries, weeklyEntries, monthlyEntries, yearlyEntries] = await Promise.all([
      HarvestEntry.find({ harvestDate: { $gte: today } }).populate('produceTypeId'),
      HarvestEntry.find({ harvestDate: { $gte: startOfWeek } }).populate('produceTypeId'),
      HarvestEntry.find({ harvestDate: { $gte: startOfMonth } }).populate('produceTypeId'),
      HarvestEntry.find({ harvestDate: { $gte: startOfYear } }).populate('produceTypeId')
    ]);

    // Helper function to calculate summary
    const calculateSummary = (entries) => {
      return entries.reduce((acc, entry) => {
        acc.totalQuantity += entry.quantity;
        acc.totalValue += entry.quantity * (entry.produceTypeId?.conversionFactor || 0);
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