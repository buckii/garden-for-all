const { connectDB } = require('./utils/db.js');
const { HarvestEntry } = require('./utils/models.js');
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

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    

    // Helper function to calculate total weight for a date range
    const calculatePeriodWeight = async (startDate, endDate) => {
      const entries = await HarvestEntry.find({
        harvestDate: { 
          $gte: startDate,
          $lt: endDate 
        }
      });
      
      const total = entries.reduce((sum, entry) => sum + (entry.weight || 0), 0);
      return total;
    };

    // Calculate date ranges
    
    // 7-day periods
    const last7DaysStart = new Date(today);
    last7DaysStart.setDate(today.getDate() - 7);
    const previous7DaysStart = new Date(last7DaysStart);
    previous7DaysStart.setDate(last7DaysStart.getDate() - 7);
    
    // 30-day periods  
    const last30DaysStart = new Date(today);
    last30DaysStart.setDate(today.getDate() - 30);
    const previous30DaysStart = new Date(last30DaysStart);
    previous30DaysStart.setDate(last30DaysStart.getDate() - 30);
    
    // Year to date periods
    const currentYearStart = new Date(now.getFullYear(), 0, 1);
    const lastYearStart = new Date(now.getFullYear() - 1, 0, 1);
    const lastYearSameDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());


    // Calculate all periods in parallel
    const [
      last7Days,
      previous7Days, 
      last30Days,
      previous30Days,
      currentYtd,
      previousYtd
    ] = await Promise.all([
      calculatePeriodWeight(last7DaysStart, today),
      calculatePeriodWeight(previous7DaysStart, last7DaysStart),
      calculatePeriodWeight(last30DaysStart, today),
      calculatePeriodWeight(previous30DaysStart, last30DaysStart),
      calculatePeriodWeight(currentYearStart, today),
      calculatePeriodWeight(lastYearStart, lastYearSameDate)
    ]);

    const periodData = {
      last7Days,
      previous7Days,
      last30Days, 
      previous30Days,
      currentYtd,
      previousYtd,
      // Calculate percentage changes
      change7Days: previous7Days > 0 ? ((last7Days - previous7Days) / previous7Days * 100) : 0,
      change30Days: previous30Days > 0 ? ((last30Days - previous30Days) / previous30Days * 100) : 0,
      changeYtd: previousYtd > 0 ? ((currentYtd - previousYtd) / previousYtd * 100) : 0
    };


    return createResponse(200, {
      success: true,
      data: periodData
    });

  } catch (error) {
    console.error('Period comparison error:', error);
    return createErrorResponse(500, 'Internal server error');
  }
};