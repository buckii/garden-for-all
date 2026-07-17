const crypto = require('crypto');
const { connectDB } = require('./utils/db.js');
const { QrLoginSession } = require('./utils/models.js');
const { createResponse, createErrorResponse, handleCORS } = require('./utils/auth.js');

// How long a QR code is scannable before the login page regenerates it.
// The Mongo TTL index (10 min) is the hard cleanup backstop.
const SESSION_VALIDITY_SECONDS = 300;

exports.handler = async function(event, context) {
  if (event.httpMethod === 'OPTIONS') {
    return handleCORS();
  }

  if (event.httpMethod !== 'POST') {
    return createErrorResponse(405, 'Method Not Allowed');
  }

  try {
    await connectDB();

    // 128 bits of entropy: the session ID doubles as the Pusher channel name,
    // so it must be unguessable
    const sessionId = crypto.randomBytes(16).toString('hex');

    await QrLoginSession.create({ sessionId, status: 'pending' });

    return createResponse(201, {
      success: true,
      data: {
        sessionId,
        expiresIn: SESSION_VALIDITY_SECONDS
      }
    });
  } catch (error) {
    console.error('QR login create error:', error);
    return createErrorResponse(500, 'Internal server error');
  }
};
