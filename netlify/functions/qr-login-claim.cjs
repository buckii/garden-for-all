const Joi = require('joi');
const { connectDB } = require('./utils/db.js');
const { QrLoginSession } = require('./utils/models.js');
const { User } = require('./utils/User.js');
const { generateToken, createResponse, createErrorResponse, handleCORS } = require('./utils/auth.js');

// Must match the validity window in qr-login-create.cjs / qr-login-authorize.cjs
const SESSION_VALIDITY_MS = 5 * 60 * 1000;

const claimSchema = Joi.object({
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

    const body = JSON.parse(event.body || '{}');
    const { error } = claimSchema.validate(body);
    if (error) {
      return createErrorResponse(400, `Validation error: ${error.details[0].message}`);
    }

    // Atomically flip authorized -> claimed: the session ID is a bearer secret,
    // so it must only ever be exchangeable for a token once
    const session = await QrLoginSession.findOneAndUpdate(
      {
        sessionId: body.sessionId,
        status: 'authorized',
        createdAt: { $gte: new Date(Date.now() - SESSION_VALIDITY_MS) }
      },
      { status: 'claimed' },
      { new: true }
    );

    if (!session || !session.userId) {
      return createErrorResponse(400, 'This QR login session is not authorized, expired, or already used.');
    }

    const user = await User.findById(session.userId);
    if (!user || !user.isActive) {
      return createErrorResponse(401, 'Invalid or inactive user');
    }

    const token = generateToken(user._id.toString());

    // Same response shape as auth-signin so the client can reuse its session handling
    return createResponse(200, {
      success: true,
      data: {
        user: user.toJSON(),
        token,
        session: {
          access_token: token,
          user: user.toJSON()
        }
      }
    });
  } catch (error) {
    console.error('QR login claim error:', error);
    return createErrorResponse(500, 'Internal server error');
  }
};
