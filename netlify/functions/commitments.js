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
    query.weekStartDate = {};
    if (startDate) {
      query.weekStartDate.$gte = new Date(startDate);
    }
    if (endDate) {
      // Add one day and use $lt to include the entire end date
      const endDatePlusOne = new Date(endDate);
      endDatePlusOne.setDate(endDatePlusOne.getDate() + 1);
      query.weekStartDate.$lt = endDatePlusOne;
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
  if (!data.startDate || !data.endDate || !data.commitmentType || !data.weeklyWeightLbs || !data.pantryId) {
    return createErrorResponse(400, 'Start date, end date, commitment type, weekly weight, and pantry ID are required');
  }

  // Validate commitment type specific fields
  if (data.commitmentType === 'produce_type' && !data.produceTypeId) {
    return createErrorResponse(400, 'Produce type ID required for produce type commitments');
  }

  if (data.commitmentType === 'category' && !data.categoryId) {
    return createErrorResponse(400, 'Category ID required for category commitments');
  }

  // Auto-adjust start and end dates to Mondays if needed
  // Parse dates in local timezone to avoid timezone shifts
  const startDateParts = data.startDate.split('-').map(Number);
  const endDateParts = data.endDate.split('-').map(Number);
  let startDate = new Date(startDateParts[0], startDateParts[1] - 1, startDateParts[2]);
  let endDate = new Date(endDateParts[0], endDateParts[1] - 1, endDateParts[2]);
  
  // Adjust start date to Monday if needed
  if (startDate.getDay() !== 1) {
    const daysToSubtract = startDate.getDay() === 0 ? 6 : startDate.getDay() - 1;
    startDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() - daysToSubtract);
  }
  
  // Adjust end date to Monday if needed
  if (endDate.getDay() !== 1) {
    const daysToSubtract = endDate.getDay() === 0 ? 6 : endDate.getDay() - 1;
    endDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate() - daysToSubtract);
  }
  
  if (startDate > endDate) {
    return createErrorResponse(400, 'Start date must be before or equal to end date');
  }

  // Generate weekly commitments
  const commitments = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    // Create commitment object for this week
    const commitmentData = {
      pantryId: data.pantryId,
      weekStartDate: new Date(currentDate),
      commitmentType: data.commitmentType,
      weeklyWeightLbs: data.weeklyWeightLbs,
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
    
    // Move to next Monday (7 days later)
    currentDate.setDate(currentDate.getDate() + 7);
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
    message: `Created ${commitments.length} weekly commitments`,
    data: commitments.map(c => ({
      _id: c._id,
      weekStartDate: c.weekStartDate,
      commitmentType: c.commitmentType,
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

  // Auto-adjust week start date to Monday if provided
  if (data.weekStartDate) {
    // Parse date in local timezone to avoid timezone shifts
    const dateParts = data.weekStartDate.split('-').map(Number);
    let weekDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
    
    // Adjust to Monday if needed
    if (weekDate.getDay() !== 1) {
      const daysToSubtract = weekDate.getDay() === 0 ? 6 : weekDate.getDay() - 1;
      weekDate = new Date(weekDate.getFullYear(), weekDate.getMonth(), weekDate.getDate() - daysToSubtract);
      // Update the data with the corrected date
      data.weekStartDate = weekDate.toISOString().split('T')[0];
    }
  }

  // Update commitment fields
  if (data.weekStartDate) commitment.weekStartDate = new Date(data.weekStartDate);
  if (data.commitmentType) commitment.commitmentType = data.commitmentType;
  if (data.weeklyWeightLbs !== undefined) commitment.weeklyWeightLbs = data.weeklyWeightLbs;
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