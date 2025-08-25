const { connectDB } = require('./utils/db.js');
const { User } = require('./utils/User.js');
const { createResponse, createErrorResponse, handleCORS } = require('./utils/auth.js');

exports.handler = async function(event, context) {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return handleCORS();
  }

  // Allow both GET and POST for easy initialization
  if (event.httpMethod !== 'GET' && event.httpMethod !== 'POST') {
    return createErrorResponse(405, 'Method Not Allowed');
  }

  try {
    // Connect to database
    await connectDB();

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@gardenforall.org';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    
    if (existingAdmin) {
      return createResponse(200, {
        success: true,
        message: `Admin user already exists: ${adminEmail}`
      });
    }

    // Create admin user
    const adminUser = new User({
      email: adminEmail,
      password: adminPassword,
      role: 'admin',
      firstName: 'Admin',
      lastName: 'User',
      isActive: true
    });

    await adminUser.save();

    return createResponse(201, {
      success: true,
      message: `Admin user created successfully: ${adminEmail}`,
      data: {
        user: adminUser.toJSON()
      }
    });

  } catch (error) {
    console.error('Init admin error:', error);
    return createErrorResponse(500, 'Failed to initialize admin user');
  }
};