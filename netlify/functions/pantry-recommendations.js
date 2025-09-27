const { Commitment, FoodPantry, ProduceType, HarvestEntry } = require('./utils/models.js');
const { createResponse, createErrorResponse, handleCORS } = require('./utils/auth.js');
const { connectDB } = require('./utils/db.js');

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return handleCORS();
  }

  if (event.httpMethod !== 'GET') {
    return createErrorResponse(405, 'Method not allowed');
  }

  try {
    // Connect to database
    await connectDB();

    const { produceTypeId, harvestDate = new Date().toISOString().split('T')[0] } = event.queryStringParameters || {};

    if (!produceTypeId) {
      return createErrorResponse(400, 'Produce type ID is required');
    }

    // Calculate the start of the current week (Monday)
    const harvestDateObj = new Date(harvestDate);
    const dayOfWeek = harvestDateObj.getDay();
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Sunday = 0, so subtract 6 days
    const weekStartDate = new Date(harvestDateObj);
    weekStartDate.setDate(harvestDateObj.getDate() - daysToSubtract);
    weekStartDate.setHours(0, 0, 0, 0);

    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekStartDate.getDate() + 7);

    // Get produce type info to find category
    const produceType = await ProduceType.findById(produceTypeId).populate('categoryId');
    if (!produceType) {
      return createErrorResponse(404, 'Produce type not found');
    }

    // 1. Find pantries with unmet produce type commitments for this week
    const produceTypeCommitments = await Commitment.find({
      produceTypeId: produceTypeId,
      weekStartDate: weekStartDate,
      isActive: true
    }).populate('pantryId');

    // Calculate fulfilled amounts for each pantry for this specific produce type
    const pantryFulfillment = new Map();
    
    for (const commitment of produceTypeCommitments) {
      if (!commitment.pantryId) continue;

      // Get total harvested for this pantry, produce type, and week
      const harvestedEntries = await HarvestEntry.find({
        pantryId: commitment.pantryId._id,
        produceTypeId: produceTypeId,
        harvestDate: {
          $gte: weekStartDate,
          $lt: weekEndDate
        }
      });

      const totalHarvested = harvestedEntries.reduce((sum, entry) => sum + entry.weight, 0);
      const unmetAmount = Math.max(0, commitment.weeklyWeightLbs - totalHarvested);

      if (unmetAmount > 0) {
        pantryFulfillment.set(commitment.pantryId._id.toString(), {
          pantry: commitment.pantryId,
          unmetAmount,
          commitmentType: 'produce_type',
          priority: 1
        });
      }
    }

    // 2. If no unmet produce type commitments, check category commitments
    if (pantryFulfillment.size === 0 && produceType.categoryId) {
      const categoryCommitments = await Commitment.find({
        categoryId: produceType.categoryId._id,
        weekStartDate: weekStartDate,
        isActive: true
      }).populate('pantryId');

      for (const commitment of categoryCommitments) {
        if (!commitment.pantryId) continue;

        // Get all produce types in this category
        const categoryProduceTypes = await ProduceType.find({ categoryId: produceType.categoryId._id });
        const categoryProduceTypeIds = categoryProduceTypes.map(pt => pt._id);

        // Get total harvested for this pantry, category, and week
        const harvestedEntries = await HarvestEntry.find({
          pantryId: commitment.pantryId._id,
          produceTypeId: { $in: categoryProduceTypeIds },
          harvestDate: {
            $gte: weekStartDate,
            $lt: weekEndDate
          }
        });

        const totalHarvested = harvestedEntries.reduce((sum, entry) => sum + entry.weight, 0);
        const unmetAmount = Math.max(0, commitment.weeklyWeightLbs - totalHarvested);

        if (unmetAmount > 0) {
          pantryFulfillment.set(commitment.pantryId._id.toString(), {
            pantry: commitment.pantryId,
            unmetAmount,
            commitmentType: 'category',
            priority: 2
          });
        }
      }
    }

    // 3. If no unmet produce or category commitments, check total commitments
    if (pantryFulfillment.size === 0) {
      const totalCommitments = await Commitment.find({
        commitmentType: 'total',
        weekStartDate: weekStartDate,
        isActive: true
      }).populate('pantryId');

      for (const commitment of totalCommitments) {
        if (!commitment.pantryId) continue;

        // Get total harvested for this pantry and week (all produce types)
        const harvestedEntries = await HarvestEntry.find({
          pantryId: commitment.pantryId._id,
          harvestDate: {
            $gte: weekStartDate,
            $lt: weekEndDate
          }
        });

        const totalHarvested = harvestedEntries.reduce((sum, entry) => sum + entry.weight, 0);
        const unmetAmount = Math.max(0, commitment.weeklyWeightLbs - totalHarvested);

        if (unmetAmount > 0) {
          pantryFulfillment.set(commitment.pantryId._id.toString(), {
            pantry: commitment.pantryId,
            unmetAmount,
            commitmentType: 'total',
            priority: 3
          });
        }
      }
    }

    // Sort by priority (1=produce_type, 2=category, 3=total) then by unmet amount (highest first)
    const recommendations = Array.from(pantryFulfillment.values())
      .sort((a, b) => {
        if (a.priority !== b.priority) {
          return a.priority - b.priority; // Lower priority number = higher priority
        }
        return b.unmetAmount - a.unmetAmount; // Higher unmet amount first
      });

    const recommendedPantry = recommendations.length > 0 ? recommendations[0] : null;

    return createResponse(200, {
      success: true,
      data: {
        recommendedPantry: recommendedPantry ? {
          pantryId: recommendedPantry.pantry._id,
          pantryName: recommendedPantry.pantry.name,
          unmetAmount: recommendedPantry.unmetAmount,
          commitmentType: recommendedPantry.commitmentType,
          priority: recommendedPantry.priority
        } : null,
        weekStartDate: weekStartDate.toISOString().split('T')[0],
        allRecommendations: recommendations.map(rec => ({
          pantryId: rec.pantry._id,
          pantryName: rec.pantry.name,
          unmetAmount: rec.unmetAmount,
          commitmentType: rec.commitmentType,
          priority: rec.priority
        }))
      }
    });

  } catch (error) {
    console.error('Pantry recommendation error:', error);
    return createErrorResponse(500, 'Internal server error');
  }
};