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

    // Calculate date ranges - all comparing to same periods last year
    
    // 7-day periods (this year vs last year same dates)
    const last7DaysStart = new Date(today);
    last7DaysStart.setDate(today.getDate() - 7);
    const lastYear7DaysStart = new Date(last7DaysStart);
    lastYear7DaysStart.setFullYear(lastYear7DaysStart.getFullYear() - 1);
    const lastYear7DaysEnd = new Date(today);
    lastYear7DaysEnd.setFullYear(lastYear7DaysEnd.getFullYear() - 1);
    
    // 30-day periods (this year vs last year same dates)
    const last30DaysStart = new Date(today);
    last30DaysStart.setDate(today.getDate() - 30);
    const lastYear30DaysStart = new Date(last30DaysStart);
    lastYear30DaysStart.setFullYear(lastYear30DaysStart.getFullYear() - 1);
    const lastYear30DaysEnd = new Date(today);
    lastYear30DaysEnd.setFullYear(lastYear30DaysEnd.getFullYear() - 1);
    
    // Year to date periods (current YTD vs prior year same period)
    const currentYearStart = new Date(now.getFullYear(), 0, 1);
    const lastYearStart = new Date(now.getFullYear() - 1, 0, 1);
    const lastYearSameDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());


    // Calculate all periods in parallel
    const [
      last7Days,
      lastYear7Days, 
      last30Days,
      lastYear30Days,
      currentYtd,
      previousYtd
    ] = await Promise.all([
      calculatePeriodWeight(last7DaysStart, today),
      calculatePeriodWeight(lastYear7DaysStart, lastYear7DaysEnd),
      calculatePeriodWeight(last30DaysStart, today),
      calculatePeriodWeight(lastYear30DaysStart, lastYear30DaysEnd),
      calculatePeriodWeight(currentYearStart, today),
      calculatePeriodWeight(lastYearStart, lastYearSameDate)
    ]);

    const periodData = {
      last7Days,
      previous7Days: lastYear7Days,  // Now represents same 7 days last year
      last30Days, 
      previous30Days: lastYear30Days, // Now represents same 30 days last year
      currentYtd,
      previousYtd,
      // Calculate percentage changes (now all year-over-year)
      change7Days: lastYear7Days > 0 ? ((last7Days - lastYear7Days) / lastYear7Days * 100) : 0,
      change30Days: lastYear30Days > 0 ? ((last30Days - lastYear30Days) / lastYear30Days * 100) : 0,
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