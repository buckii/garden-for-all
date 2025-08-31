/**
 * Get current date in Eastern timezone as YYYY-MM-DD string
 */
function getEasternDateString() {
  return new Date().toLocaleDateString('en-CA', { 
    timeZone: 'America/New_York' 
  });
}

/**
 * Get date string for a given date in Eastern timezone
 */
function toEasternDateString(date) {
  return new Date(date).toLocaleDateString('en-CA', { 
    timeZone: 'America/New_York' 
  });
}

/**
 * Create a Date object from YYYY-MM-DD string treating it as local date
 */
function createLocalDate(dateString) {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

module.exports = {
  getEasternDateString,
  toEasternDateString,
  createLocalDate
};