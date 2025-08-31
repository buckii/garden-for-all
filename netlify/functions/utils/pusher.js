const Pusher = require('pusher');

// Initialize Pusher (will be null if not configured)
let pusher = null;

try {
  const appId = process.env.PUSHER_APP_ID;
  const key = process.env.PUSHER_KEY;
  const secret = process.env.PUSHER_SECRET;
  const cluster = process.env.PUSHER_CLUSTER;

  if (appId && key && secret && cluster) {
    pusher = new Pusher({
      appId,
      key,
      secret,
      cluster,
      useTLS: true
    });
  } else {
    console.warn('Pusher not configured - real-time updates disabled');
  }
} catch (error) {
  console.warn('Failed to initialize Pusher:', error.message);
}

// Event types
const EVENTS = {
  HARVEST_CREATED: 'harvest-created',
  HARVEST_UPDATED: 'harvest-updated',
  HARVEST_DELETED: 'harvest-deleted',
  ORDER_CREATED: 'order-created',
  ORDER_UPDATED: 'order-updated', 
  ORDER_DELETED: 'order-deleted',
  PANTRY_CREATED: 'pantry-created',
  PANTRY_UPDATED: 'pantry-updated',
  PANTRY_DELETED: 'pantry-deleted',
  COMMITMENT_CREATED: 'commitment-created',
  COMMITMENT_UPDATED: 'commitment-updated',
  COMMITMENT_DELETED: 'commitment-deleted',
  DASHBOARD_UPDATE: 'dashboard-update'
};

// Channel names
const CHANNELS = {
  GARDEN: 'garden-harvest',
  ADMIN: 'garden-admin',
  DASHBOARD: 'garden-dashboard'
};

/**
 * Send a real-time update via Pusher
 * @param {string} channel - Channel name
 * @param {string} event - Event name
 * @param {object} data - Data to send
 */
async function sendUpdate(channel, event, data = {}) {
  if (!pusher) {
    console.log('Pusher not configured, skipping real-time update');
    return false;
  }

  try {
    await pusher.trigger(channel, event, {
      ...data,
      timestamp: new Date().toISOString()
    });
    console.log(`✅ Sent Pusher event: ${event} on ${channel}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to send Pusher event:', error);
    return false;
  }
}

/**
 * Send harvest-related updates
 */
const harvestUpdates = {
  created: (harvestEntry) => sendUpdate(CHANNELS.GARDEN, EVENTS.HARVEST_CREATED, { harvestEntry }),
  updated: (harvestEntry) => sendUpdate(CHANNELS.GARDEN, EVENTS.HARVEST_UPDATED, { harvestEntry }),
  deleted: (entryId) => sendUpdate(CHANNELS.GARDEN, EVENTS.HARVEST_DELETED, { entryId }),
};

/**
 * Send order-related updates
 */
const orderUpdates = {
  created: (order) => sendUpdate(CHANNELS.ADMIN, EVENTS.ORDER_CREATED, { order }),
  updated: (order) => sendUpdate(CHANNELS.ADMIN, EVENTS.ORDER_UPDATED, { order }),
  deleted: (orderId) => sendUpdate(CHANNELS.ADMIN, EVENTS.ORDER_DELETED, { orderId }),
};

/**
 * Send pantry-related updates
 */
const pantryUpdates = {
  created: (pantry) => sendUpdate(CHANNELS.ADMIN, EVENTS.PANTRY_CREATED, { pantry }),
  updated: (pantry) => sendUpdate(CHANNELS.ADMIN, EVENTS.PANTRY_UPDATED, { pantry }),
  deleted: (pantryId) => sendUpdate(CHANNELS.ADMIN, EVENTS.PANTRY_DELETED, { pantryId }),
};

/**
 * Send commitment-related updates
 */
const commitmentUpdates = {
  created: (commitment) => sendUpdate(CHANNELS.ADMIN, EVENTS.COMMITMENT_CREATED, { commitment }),
  updated: (commitment) => sendUpdate(CHANNELS.ADMIN, EVENTS.COMMITMENT_UPDATED, { commitment }),
  deleted: (commitmentId) => sendUpdate(CHANNELS.ADMIN, EVENTS.COMMITMENT_DELETED, { commitmentId }),
};

/**
 * Send dashboard update notification
 */
const dashboardUpdates = {
  refresh: (reason = 'data-changed') => sendUpdate(CHANNELS.DASHBOARD, EVENTS.DASHBOARD_UPDATE, { reason })
};

/**
 * Send comprehensive update that affects multiple areas
 */
async function sendComprehensiveUpdate(updateType, data) {
  const promises = [
    dashboardUpdates.refresh(updateType)
  ];

  // Add specific updates based on type
  switch (updateType) {
    case 'harvest':
      promises.push(sendUpdate(CHANNELS.GARDEN, `harvest-${data.action || 'updated'}`, data));
      break;
    case 'order':
      promises.push(sendUpdate(CHANNELS.ADMIN, `order-${data.action || 'updated'}`, data));
      break;
    case 'pantry':
      promises.push(sendUpdate(CHANNELS.ADMIN, `pantry-${data.action || 'updated'}`, data));
      break;
    case 'commitment':
      promises.push(sendUpdate(CHANNELS.ADMIN, `commitment-${data.action || 'updated'}`, data));
      break;
  }

  await Promise.all(promises);
}

module.exports = {
  pusher,
  EVENTS,
  CHANNELS,
  sendUpdate,
  harvestUpdates,
  orderUpdates,
  pantryUpdates,
  commitmentUpdates,
  dashboardUpdates,
  sendComprehensiveUpdate,
  isConfigured: () => !!pusher
};