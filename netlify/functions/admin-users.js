import Joi from 'joi';
import { connectDB } from './utils/db.js';
import { User } from './utils/User.js';
import { validateToken, extractToken, createResponse, createErrorResponse, handleCORS } from './utils/auth.js';

const createUserSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('admin', 'user').default('user'),
  firstName: Joi.string().trim().allow(''),
  lastName: Joi.string().trim().allow('')
});

const updateUserSchema = Joi.object({
  email: Joi.string().email(),
  role: Joi.string().valid('admin', 'user'),
  firstName: Joi.string().trim().allow(''),
  lastName: Joi.string().trim().allow(''),
  isActive: Joi.boolean()
});

export async function handler(event, context) {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return handleCORS();
  }

  try {
    // Connect to database
    await connectDB();

    // Validate token and check admin access
    const token = extractToken(event.headers.authorization);
    if (!token) {
      return createErrorResponse(401, 'Authorization token required');
    }

    const user = await validateToken(token);
    if (user.role !== 'admin') {
      return createErrorResponse(403, 'Admin access required');
    }

    // Handle different HTTP methods
    switch (event.httpMethod) {
      case 'GET':
        return await getUsers(event);
      case 'POST':
        return await createUser(event);
      case 'PUT':
        return await updateUser(event);
      case 'DELETE':
        return await deleteUser(event);
      default:
        return createErrorResponse(405, 'Method Not Allowed');
    }

  } catch (error) {
    console.error('Admin users error:', error);
    return createErrorResponse(500, 'Internal server error');
  }
}

async function getUsers(event) {
  const page = parseInt(event.queryStringParameters?.page) || 1;
  const limit = parseInt(event.queryStringParameters?.limit) || 20;
  const search = event.queryStringParameters?.search || '';
  const role = event.queryStringParameters?.role;

  const skip = (page - 1) * limit;

  // Build query
  const query = {};
  if (search) {
    query.$or = [
      { email: { $regex: search, $options: 'i' } },
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } }
    ];
  }
  if (role) {
    query.role = role;
  }

  const [users, total] = await Promise.all([
    User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(query)
  ]);

  return createResponse(200, {
    success: true,
    data: {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
}

async function createUser(event) {
  const body = JSON.parse(event.body || '{}');
  const { error, value } = createUserSchema.validate(body);
  
  if (error) {
    return createErrorResponse(400, `Validation error: ${error.details[0].message}`);
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email: value.email });
  if (existingUser) {
    return createErrorResponse(409, 'User with this email already exists');
  }

  // Create new user
  const user = new User(value);
  await user.save();

  return createResponse(201, {
    success: true,
    data: { user }
  });
}

async function updateUser(event) {
  const userId = event.queryStringParameters?.id;
  if (!userId) {
    return createErrorResponse(400, 'User ID is required');
  }

  const body = JSON.parse(event.body || '{}');
  const { error, value } = updateUserSchema.validate(body);
  
  if (error) {
    return createErrorResponse(400, `Validation error: ${error.details[0].message}`);
  }

  // Don't allow empty updates
  if (Object.keys(value).length === 0) {
    return createErrorResponse(400, 'At least one field must be updated');
  }

  // Check if email is being changed and if it already exists
  if (value.email) {
    const existingUser = await User.findOne({ 
      email: value.email, 
      _id: { $ne: userId } 
    });
    if (existingUser) {
      return createErrorResponse(409, 'Email already exists');
    }
  }

  const user = await User.findByIdAndUpdate(
    userId,
    value,
    { new: true, runValidators: true }
  );

  if (!user) {
    return createErrorResponse(404, 'User not found');
  }

  return createResponse(200, {
    success: true,
    data: { user }
  });
}

async function deleteUser(event) {
  const userId = event.queryStringParameters?.id;
  if (!userId) {
    return createErrorResponse(400, 'User ID is required');
  }

  const user = await User.findByIdAndDelete(userId);
  if (!user) {
    return createErrorResponse(404, 'User not found');
  }

  return createResponse(200, {
    success: true,
    message: 'User deleted successfully'
  });
}