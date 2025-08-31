const { connectDB } = require('./utils/db.js');
const { HarvestEntry, ProduceType } = require('./utils/models.js');
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

    // Get query parameters
    const queryParams = event.queryStringParameters || {};
    const weeks = parseInt(queryParams.weeks) || 12;
    const period = queryParams.period || 'weeks'; // 'weeks' or 'month'

    // Calculate date range
    const now = new Date();
    let startDate;
    
    if (period === 'month') {
      // Current month only
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else {
      // Specified number of weeks
      startDate = new Date(now);
      startDate.setDate(now.getDate() - (weeks * 7));
    }


    // Fetch harvest entries within the date range with populated produce types
    const entries = await HarvestEntry.find({
      harvestDate: { 
        $gte: startDate,
        $lte: now 
      }
    })
    .populate('produceTypeId')
    .sort({ harvestDate: 1 });


    // Process data into weekly trends by product
    const weeklyData = new Map();
    const productTotals = new Map();

    // Generate week labels
    const weekLabels = [];
    for (let i = weeks - 1; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (i * 7 + now.getDay()));
      const weekKey = weekStart.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
      weekLabels.push(weekKey);
      weeklyData.set(weekKey, new Map());
    }

    // Process each harvest entry
    entries.forEach(entry => {
      if (!entry.produceTypeId) return;

      const productName = entry.produceTypeId.name;
      const harvestDate = new Date(entry.harvestDate);
      
      // Find the week this entry belongs to
      const weekStart = new Date(harvestDate);
      weekStart.setDate(harvestDate.getDate() - harvestDate.getDay()); // Get start of week (Sunday)
      const weekKey = weekStart.toLocaleDateString('en-US', {
        month: 'short',  
        day: 'numeric'
      });

      // Use weight field (already in pounds)
      const weightInPounds = entry.weight || 0;
      
      if (weightInPounds > 0 && weeklyData.has(weekKey)) {
        const weekProducts = weeklyData.get(weekKey);
        weekProducts.set(productName, (weekProducts.get(productName) || 0) + weightInPounds);
      }

      // Track total production for each product
      if (weightInPounds > 0) {
        productTotals.set(productName, (productTotals.get(productName) || 0) + weightInPounds);
      }
    });

    // Get top 5 products by total production
    const topProducts = Array.from(productTotals.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(entry => entry[0]);


    // Generate datasets for top products
    const datasets = topProducts.map((product, index) => {
      const colors = ['#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#3b82f6'];
      
      return {
        label: product,
        data: weekLabels.map(week => {
          const weekProducts = weeklyData.get(week);
          return weekProducts ? (weekProducts.get(product) || 0) : 0;
        }),
        backgroundColor: colors[index % colors.length],
        borderWidth: 0,
        borderRadius: 2,
      };
    });

    // Calculate "Other" products data
    const otherData = weekLabels.map(week => {
      const weekProducts = weeklyData.get(week);
      if (!weekProducts) return 0;
      
      let otherTotal = 0;
      weekProducts.forEach((quantity, product) => {
        if (!topProducts.includes(product)) {
          otherTotal += quantity;
        }
      });
      return otherTotal;
    });

    // Add "Other" dataset if there's data
    if (otherData.some(value => value > 0)) {
      datasets.push({
        label: 'Other',
        data: otherData,
        backgroundColor: '#6b7280',
        borderWidth: 0,
        borderRadius: 2,
      });
    }

    // Calculate summary statistics
    const totalProduction = Array.from(productTotals.values()).reduce((sum, val) => sum + val, 0);
    const totalProducts = productTotals.size;
    const averageWeeklyProduction = totalProduction / weeks;

    const summary = {
      totalProduction: totalProduction.toFixed(1),
      totalProducts,
      averageWeeklyProduction: averageWeeklyProduction.toFixed(1),
      weeks,
      dateRange: {
        start: startDate.toISOString().split('T')[0],
        end: now.toISOString().split('T')[0]
      }
    };


    return createResponse(200, {
      success: true,
      data: {
        labels: weekLabels,
        datasets,
        summary,
        productTotals: Object.fromEntries(
          Array.from(productTotals.entries()).sort((a, b) => b[1] - a[1])
        )
      }
    });

  } catch (error) {
    console.error('Production trends error:', error);
    return createErrorResponse(500, 'Internal server error');
  }
};