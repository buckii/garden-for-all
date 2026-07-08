const { connectDB } = require('./utils/db.js');
const { HarvestEntry } = require('./utils/models.js');
const { createResponse, createErrorResponse, handleCORS, extractToken, validateToken } = require('./utils/auth.js');
const { getEasternDateString, toEasternDateString } = require('./utils/date.js');

// Entries from today can be edited/deleted freely (the frictionless harvester
// flow). Touching a previous day's entry requires a signed-in user so that
// historical records can't be altered anonymously.
async function requireAuthForPastEntry(event, entry, action) {
  const entryDate = toEasternDateString(entry.harvestDate);
  if (entryDate === getEasternDateString()) {
    return null; // Today's entry — no auth required
  }

  const token = extractToken(event.headers && event.headers.authorization);
  if (!token) {
    return createErrorResponse(
      401,
      `This harvest entry is from ${entryDate}. You must be signed in to ${action} entries from a previous day. Only today's entries can be ${action === 'edit' ? 'edited' : 'deleted'} without signing in.`
    );
  }

  try {
    await validateToken(token);
  } catch (authError) {
    return createErrorResponse(
      401,
      `Your session has expired. Please sign in again to ${action} harvest entries from a previous day.`
    );
  }

  return null;
}

exports.handler = async function(event, context) {
  if (event.httpMethod === 'OPTIONS') {
    return handleCORS();
  }

  if (event.httpMethod !== 'DELETE') {
    return createErrorResponse(405, 'Method Not Allowed');
  }

  try {
    await connectDB();

    const { id } = event.queryStringParameters || {};

    if (!id) {
      return createErrorResponse(400, 'Harvest entry ID is required');
    }

    // Find the entry first so we can enforce auth before deleting
    const existingEntry = await HarvestEntry.findById(id);

    if (!existingEntry) {
      return createErrorResponse(404, 'Harvest entry not found');
    }

    // Deleting a previous day's entry requires authentication
    const authError = await requireAuthForPastEntry(event, existingEntry, 'delete');
    if (authError) {
      return authError;
    }

    await HarvestEntry.deleteOne({ _id: existingEntry._id });

    return createResponse(200, {
      success: true,
      message: 'Harvest entry deleted successfully',
      data: {
        id: existingEntry._id
      }
    });

  } catch (error) {
    console.error('Harvest delete error:', error);
    return createErrorResponse(500, `Failed to delete harvest entry: ${error.message}`);
  }
};