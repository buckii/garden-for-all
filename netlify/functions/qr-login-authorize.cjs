const Joi = require('joi');
const { connectDB } = require('./utils/db.js');
const { QrLoginSession } = require('./utils/models.js');
const { validateToken, extractToken, createResponse, createErrorResponse, handleCORS } = require('./utils/auth.js');
const { sendUpdate } = require('./utils/pusher.js');

// Must match the validity window in qr-login-create.cjs / qr-login-claim.cjs
const SESSION_VALIDITY_MS = 5 * 60 * 1000;

const authorizeSchema = Joi.object({
  sessionId: Joi.string().hex().length(32).required()
});

exports.handler = async function(event, context) {
  if (event.httpMethod === 'OPTIONS') {
    return handleCORS();
  }

  if (event.httpMethod !== 'POST') {
    return createErrorResponse(405, 'Method Not Allowed');
  }

  try {
    await connectDB();

    // The scanning device must be logged in — its user is who the new device becomes
    const token = extractToken(event.headers.authorization || event.headers.Authorization);
    if (!token) {
      return createErrorResponse(401, 'Authentication required');
    }

    let user;
    try {
      user = await validateToken(token);
    } catch (err) {
      return createErrorResponse(401, 'Invalid token');
    }

    const body = JSON.parse(event.body || '{}');
    const { error } = authorizeSchema.validate(body);
    if (error) {
      return createErrorResponse(400, `Validation error: ${error.details[0].message}`);
    }

    // Atomically flip pending -> authorized so a session can only be approved once
    const session = await QrLoginSession.findOneAndUpdate(
      {
        sessionId: body.sessionId,
        status: 'pending',
        createdAt: { $gte: new Date(Date.now() - SESSION_VALIDITY_MS) }
      },
      { status: 'authorized', userId: user._id },
      { new: true }
    );

    if (!session) {
      return createErrorResponse(400, 'This QR code is invalid, expired, or already used. Refresh the login page and scan again.');
    }

    // Notify only the device displaying this specific QR code.
    // No token in the payload — the waiting device exchanges the session ID
    // for its own JWT via qr-login-claim over HTTPS.
    await sendUpdate(`qr-login-${session.sessionId}`, 'qr-login-authorized', {
      authorizedBy: user.email
    });

    return createResponse(200, { success: true });
  } catch (error) {
    console.error('QR login authorize error:', error);
    return createErrorResponse(500, 'Internal server error');
  }
};
