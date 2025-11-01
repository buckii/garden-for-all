const { Commitment, FoodPantry, ProduceType, ProduceCategory } = require('./utils/models.js');
const { validateToken, extractToken, createResponse, createErrorResponse, handleCORS } = require('./utils/auth.js');
const { connectDB } = require('./utils/db.js');

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return handleCORS();
  }

  try {
    // Connect to database
    await connectDB();

    // Handle different HTTP methods
    switch (event.httpMethod) {
      case 'GET':
        // GET requests don't require authentication (read-only)
        return await handleGet(event, headers);
      case 'POST':
      case 'PUT':
      case 'DELETE':
        // Write operations require authentication
        const authHeader = event.headers.authorization || event.headers.Authorization;
        const token = extractToken(authHeader);
        if (!token) {
          return createErrorResponse(401, 'Authorization token required');
        }

        let user;
        try {
          user = await validateToken(token);
          if (!user) {
            return createErrorResponse(401, 'Invalid or expired token');
          }
        } catch (error) {
          return createErrorResponse(401, 'Invalid or expired token');
        }

        switch (event.httpMethod) {
          case 'POST':
            return await handlePost(event, headers, user);
          case 'PUT':
            return await handlePut(event, headers, user);
          case 'DELETE':
            return await handleDelete(event, headers, user);
        }
      default:
        return createErrorResponse(405, 'Method not allowed');
    }
  } catch (error) {
    console.error('Function error:', error);
    return createErrorResponse(500, 'Internal server error');
  }
};

async function handleGet(event, headers) {
  const { pantryId, startDate, endDate, commitmentType, isActive = 'true' } = event.queryStringParameters || {};

  // Build query - pantryId is optional (if not provided, get all pantries)
  const query = { 
    isActive: isActive === 'true' 
  };
  
  // Add pantryId filter only if provided
  if (pantryId) {
    query.pantryId = pantryId;
  }
  
  if (startDate || endDate) {
    // When filtering by date range, we need to find commitments where the requested
    // date range overlaps with the commitment's date range (weekStartDate to endDate)
    if (startDate && endDate && startDate === endDate) {
      // Single date query: find commitments that include this date
      // Commitment must start on or before the date AND end on or after the date
      const requestedDate = new Date(startDate);
      const nextDay = new Date(startDate);
      nextDay.setDate(nextDay.getDate() + 1);

      query.weekStartDate = { $lt: nextDay };
      query.endDate = { $gte: requestedDate };
    } else {
      // Range query: find commitments that overlap with the requested range
      query.weekStartDate = {};
      query.endDate = {};

      if (startDate) {
        // Commitment must end on or after the start of the requested range
        query.endDate.$gte = new Date(startDate);
      }
      if (endDate) {
        // Commitment must start before the end of the requested range
        const endDatePlusOne = new Date(endDate);
        endDatePlusOne.setDate(endDatePlusOne.getDate() + 1);
        query.weekStartDate.$lt = endDatePlusOne;
      }
    }
  }
  
  if (commitmentType) {
    query.commitmentType = commitmentType;
  }

  // Fetch commitments with populated references
  const commitments = await Commitment
    .find(query)
    .populate('pantryId', 'name county')
    .populate('produceTypeId', 'name unitType')
    .populate('categoryId', 'name')
    .sort({ weekStartDate: -1, createdAt: -1 });

  return createResponse(200, {
    success: true,
    data: commitments
  });
}

async function handlePost(event, headers, user) {
  const data = JSON.parse(event.body);

  // Validate required fields
  if (!data.startDate || !data.endDate || !data.commitmentType || !data.dailyWeightLbs || !data.pantryId) {
    return createErrorResponse(400, 'Start date, end date, commitment type, daily weight, and pantry ID are required');
  }

  // Validate days of week
  if (!data.daysOfWeek || !Array.isArray(data.daysOfWeek) || data.daysOfWeek.length === 0) {
    return createErrorResponse(400, 'At least one day of the week must be selected');
  }

  // Validate frequency
  const frequencyWeeks = data.frequencyWeeks || 1;
  if (frequencyWeeks < 1) {
    return createErrorResponse(400, 'Frequency must be at least 1 week');
  }

  // Validate commitment type specific fields
  if (data.commitmentType === 'produce_type' && !data.produceTypeId) {
    return createErrorResponse(400, 'Produce type ID required for produce type commitments');
  }

  if (data.commitmentType === 'category' && !data.categoryId) {
    return createErrorResponse(400, 'Category ID required for category commitments');
  }

  // Parse dates in local timezone to avoid timezone shifts
  const startDateParts = data.startDate.split('-').map(Number);
  const endDateParts = data.endDate.split('-').map(Number);
  let startDate = new Date(startDateParts[0], startDateParts[1] - 1, startDateParts[2]);
  let endDate = new Date(endDateParts[0], endDateParts[1] - 1, endDateParts[2]);

  if (startDate > endDate) {
    return createErrorResponse(400, 'Start date must be before or equal to end date');
  }

  // Calculate weekly weight for backward compatibility
  const weeklyWeightLbs = data.dailyWeightLbs * data.daysOfWeek.length;

  // Generate commitment records by frequency
  const commitments = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    // Calculate the end of this frequency period
    const periodEnd = new Date(currentDate);
    periodEnd.setDate(periodEnd.getDate() + (frequencyWeeks * 7) - 1);

    // Don't go past the overall end date
    const actualPeriodEnd = periodEnd > endDate ? endDate : periodEnd;

    // Create commitment object for this period
    const commitmentData = {
      pantryId: data.pantryId,
      weekStartDate: new Date(currentDate),
      endDate: actualPeriodEnd,
      daysOfWeek: data.daysOfWeek,
      frequencyWeeks: frequencyWeeks,
      commitmentType: data.commitmentType,
      dailyWeightLbs: data.dailyWeightLbs,
      weeklyWeightLbs: weeklyWeightLbs,
      isFirm: data.isFirm || false,
      notes: data.notes || '',
      createdBy: user._id,
      isActive: true
    };

    // Set specific type references if provided
    if (data.produceTypeId) {
      commitmentData.produceTypeId = data.produceTypeId;
    }
    if (data.categoryId) {
      commitmentData.categoryId = data.categoryId;
    }

    // Clean up fields based on commitment type
    if (commitmentData.commitmentType !== 'produce_type') {
      delete commitmentData.produceTypeId;
    }
    if (commitmentData.commitmentType !== 'category') {
      delete commitmentData.categoryId;
    }

    const commitment = new Commitment(commitmentData);
    await commitment.save();
    commitments.push(commitment);

    // Move to next period (frequency weeks later)
    currentDate.setDate(currentDate.getDate() + (frequencyWeeks * 7));
  }

  // Populate references for the first commitment as a sample
  if (commitments.length > 0) {
    await commitments[0].populate('pantryId', 'name county');
    if (commitments[0].produceTypeId) {
      await commitments[0].populate('produceTypeId', 'name unitType');
    }
    if (commitments[0].categoryId) {
      await commitments[0].populate('categoryId', 'name');
    }
  }

  return createResponse(201, {
    success: true,
    message: `Created ${commitments.length} commitment period(s)`,
    data: commitments.map(c => ({
      _id: c._id,
      weekStartDate: c.weekStartDate,
      endDate: c.endDate,
      daysOfWeek: c.daysOfWeek,
      frequencyWeeks: c.frequencyWeeks,
      commitmentType: c.commitmentType,
      dailyWeightLbs: c.dailyWeightLbs,
      weeklyWeightLbs: c.weeklyWeightLbs
    }))
  });
}

async function handlePut(event, headers, user) {
  const { id } = event.queryStringParameters || {};
  if (!id) {
    return createErrorResponse(400, 'Commitment ID is required');
  }

  const data = JSON.parse(event.body);
  const commitment = await Commitment.findById(id);

  if (!commitment) {
    return createErrorResponse(404, 'Commitment not found');
  }

  // Update commitment fields
  if (data.weekStartDate) {
    const dateParts = data.weekStartDate.split('-').map(Number);
    commitment.weekStartDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
  }
  if (data.endDate) {
    const dateParts = data.endDate.split('-').map(Number);
    commitment.endDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
  }
  if (data.daysOfWeek !== undefined) commitment.daysOfWeek = data.daysOfWeek;
  if (data.frequencyWeeks !== undefined) commitment.frequencyWeeks = data.frequencyWeeks;
  if (data.commitmentType) commitment.commitmentType = data.commitmentType;
  if (data.dailyWeightLbs !== undefined) {
    commitment.dailyWeightLbs = data.dailyWeightLbs;
    // Recalculate weekly weight for backward compatibility
    if (commitment.daysOfWeek && commitment.daysOfWeek.length > 0) {
      commitment.weeklyWeightLbs = data.dailyWeightLbs * commitment.daysOfWeek.length;
    }
  }
  if (data.weeklyWeightLbs !== undefined) commitment.weeklyWeightLbs = data.weeklyWeightLbs;
  if (data.isFirm !== undefined) commitment.isFirm = data.isFirm;
  if (data.notes !== undefined) commitment.notes = data.notes;
  if (data.produceTypeId !== undefined) commitment.produceTypeId = data.produceTypeId;
  if (data.categoryId !== undefined) commitment.categoryId = data.categoryId;

  // Clean up fields based on commitment type
  if (commitment.commitmentType !== 'produce_type') {
    commitment.produceTypeId = undefined;
  }
  if (commitment.commitmentType !== 'category') {
    commitment.categoryId = undefined;
  }

  await commitment.save();

  // Populate references before returning
  await commitment.populate('pantryId', 'name county');
  if (commitment.produceTypeId) {
    await commitment.populate('produceTypeId', 'name unitType');
  }
  if (commitment.categoryId) {
    await commitment.populate('categoryId', 'name');
  }

  return createResponse(200, {
    success: true,
    data: commitment
  });
}

async function handleDelete(event, headers, user) {
  const { id } = event.queryStringParameters || {};
  if (!id) {
    return createErrorResponse(400, 'Commitment ID is required');
  }

  const commitment = await Commitment.findById(id);
  if (!commitment) {
    return createErrorResponse(404, 'Commitment not found');
  }

  // Soft delete by setting isActive to false
  commitment.isActive = false;
  await commitment.save();

  return createResponse(200, {
    success: true,
    message: 'Commitment deleted successfully'
  });
}