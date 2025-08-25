const jwt = require('jsonwebtoken');
const { User } = require('./User.js');

function generateToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
}

async function validateToken(token) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user || !user.isActive) {
      throw new Error('Invalid or inactive user');
    }
    
    return user;
  } catch (error) {
    throw new Error('Invalid token');
  }
}

function extractToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

function createResponse(statusCode, data, headers = {}) {
  return {
    statusCode,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
      ...headers
    },
    body: JSON.stringify(data)
  };
}

function createErrorResponse(statusCode, message) {
  return createResponse(statusCode, {
    success: false,
    error: message
  });
}

function handleCORS() {
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
    },
    body: ''
  };
}

module.exports = {
  generateToken,
  validateToken,
  extractToken,
  createResponse,
  createErrorResponse,
  handleCORS
};