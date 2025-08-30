const Joi = require('joi');
const { connectDB } = require('./utils/db.js');
const { PantryCommitment, HarvestEntry } = require('./utils/models.js');
const { validateToken, extractToken, createResponse, createErrorResponse, handleCORS } = require('./utils/auth.js');

const commitmentSchema = Joi.object({
  pantryId: Joi.string().required(),
  year: Joi.number().integer().min(2020).max(2030).required(),
  weeklyCommitment: Joi.object({
    vegetables: Joi.number().min(0).optional(),
    fruits: Joi.number().min(0).optional(),
    herbs: Joi.number().min(0).optional(),
    flowers: Joi.number().min(0).optional(),
    total: Joi.number().min(0).optional()
  }).required()
});

exports.handler = async function(event, context) {
  if (event.httpMethod === 'OPTIONS') {
    return handleCORS();
  }

  try {
    await connectDB();

    // Validate authentication
    const token = extractToken(event.headers.authorization);
    if (!token) {
      return createErrorResponse(401, 'Authorization token required');
    }

    const user = await validateToken(token);
    if (user.role !== 'admin') {
      return createErrorResponse(403, 'Admin access required');
    }

    const { httpMethod, queryStringParameters } = event;

    switch (httpMethod) {
      case 'GET':
        return await getCommitments(queryStringParameters);
      case 'POST':
        return await createCommitment(event.body, user);
      case 'PUT':
        return await updateCommitment(event.body, queryStringParameters, user);
      case 'DELETE':
        return await deleteCommitment(queryStringParameters);
      default:
        return createErrorResponse(405, 'Method Not Allowed');
    }
  } catch (error) {
    console.error('Pantry Commitments API error:', error);
    return createErrorResponse(500, 'Internal server error');
  }
};

async function getCommitments(params) {
  try {
    const { pantryId, year } = params || {};
    
    let query = { isActive: true };
    if (pantryId) query.pantryId = pantryId;
    if (year) query.year = parseInt(year);

    const commitments = await PantryCommitment.find(query)
      .populate('pantryId', 'name')
      .sort({ year: -1, createdAt: -1 })
      .lean();

    // If requesting commitments with progress
    if (params?.includeProgress === 'true') {
      const commitmentsWithProgress = await Promise.all(
        commitments.map(async (commitment) => {
          const progress = await calculateYearToDateProgress(commitment.pantryId._id || commitment.pantryId, commitment.year);
          return {
            ...commitment,
            progress
          };
        })
      );
      
      return createResponse(200, {
        success: true,
        data: commitmentsWithProgress
      });
    }

    return createResponse(200, {
      success: true,
      data: commitments
    });
  } catch (error) {
    console.error('Get commitments error:', error);
    return createErrorResponse(500, 'Failed to fetch commitments');
  }
}

async function createCommitment(body, user) {
  try {
    const commitmentData = JSON.parse(body || '{}');
    const { error } = commitmentSchema.validate(commitmentData);
    
    if (error) {
      return createErrorResponse(400, `Validation error: ${error.details[0].message}`);
    }

    // Check if commitment already exists for this pantry/year
    const existingCommitment = await PantryCommitment.findOne({
      pantryId: commitmentData.pantryId,
      year: commitmentData.year,
      isActive: true
    });

    if (existingCommitment) {
      return createErrorResponse(400, 'Commitment already exists for this pantry and year');
    }

    const commitment = new PantryCommitment({
      ...commitmentData,
      createdBy: user.id
    });
    
    await commitment.save();
    await commitment.populate('pantryId', 'name');

    return createResponse(201, {
      success: true,
      data: commitment
    });
  } catch (error) {
    console.error('Create commitment error:', error);
    return createErrorResponse(500, 'Failed to create commitment');
  }
}

async function updateCommitment(body, params, user) {
  try {
    const { id } = params || {};
    if (!id) {
      return createErrorResponse(400, 'Commitment ID required');
    }

    const updateData = JSON.parse(body || '{}');
    const { error } = commitmentSchema.validate(updateData);
    
    if (error) {
      return createErrorResponse(400, `Validation error: ${error.details[0].message}`);
    }

    const commitment = await PantryCommitment.findByIdAndUpdate(
      id,
      {
        ...updateData,
        updatedBy: user.id
      },
      { new: true, runValidators: true }
    ).populate('pantryId', 'name');

    if (!commitment) {
      return createErrorResponse(404, 'Commitment not found');
    }

    return createResponse(200, {
      success: true,
      data: commitment
    });
  } catch (error) {
    console.error('Update commitment error:', error);
    return createErrorResponse(500, 'Failed to update commitment');
  }
}

async function deleteCommitment(params) {
  try {
    const { id } = params || {};
    if (!id) {
      return createErrorResponse(400, 'Commitment ID required');
    }

    const commitment = await PantryCommitment.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!commitment) {
      return createErrorResponse(404, 'Commitment not found');
    }

    return createResponse(200, {
      success: true,
      message: 'Commitment deleted successfully'
    });
  } catch (error) {
    console.error('Delete commitment error:', error);
    return createErrorResponse(500, 'Failed to delete commitment');
  }
}

async function calculateYearToDateProgress(pantryId, year) {
  try {
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31, 23, 59, 59);
    const now = new Date();
    const currentDate = now > endOfYear ? endOfYear : now;

    // Calculate weeks elapsed in the year
    const msPerWeek = 7 * 24 * 60 * 60 * 1000;
    const weeksElapsed = Math.ceil((currentDate - startOfYear) / msPerWeek);

    // Get all harvest entries for this pantry this year
    const harvestEntries = await HarvestEntry.find({
      pantryId: pantryId,
      harvestDate: {
        $gte: startOfYear,
        $lte: currentDate
      }
    }).populate('produceTypeId');

    // Group by produce category and sum weights
    const actualDeliveries = {
      vegetables: 0,
      fruits: 0,
      herbs: 0,
      flowers: 0,
      total: 0
    };

    harvestEntries.forEach(entry => {
      const category = entry.produceTypeId?.category?.name?.toLowerCase() || 'other';
      const weight = entry.weight || 0;
      
      if (actualDeliveries.hasOwnProperty(category)) {
        actualDeliveries[category] += weight;
      }
      actualDeliveries.total += weight;
    });

    return {
      weeksElapsed,
      actualDeliveries,
      startOfYear,
      endOfYear,
      currentDate
    };
  } catch (error) {
    console.error('Calculate progress error:', error);
    return {
      weeksElapsed: 0,
      actualDeliveries: { vegetables: 0, fruits: 0, herbs: 0, flowers: 0, total: 0 }
    };
  }
}