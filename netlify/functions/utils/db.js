const mongoose = require('mongoose');

// Cache connection to reuse across function calls
let cachedConnection = null;

async function connectDB() {
  // If already connected, return the cached connection
  if (cachedConnection && mongoose.connection.readyState === 1) {
    return cachedConnection;
  }

  // If connecting, wait for the connection to complete
  if (mongoose.connection.readyState === 2) {
    // Wait for connection to complete
    await new Promise((resolve, reject) => {
      mongoose.connection.once('connected', resolve);
      mongoose.connection.once('error', reject);
    });
    return cachedConnection;
  }

  // If disconnected or uninitialized, create new connection
  if (mongoose.connection.readyState === 0 || mongoose.connection.readyState === 3) {
    try {
      cachedConnection = await mongoose.connect(process.env.MONGODB_URI, {
        maxPoolSize: 1, // Single connection for serverless
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        bufferCommands: false
      });
      
      console.log('MongoDB connected');
      return cachedConnection;
    } catch (error) {
      console.error('MongoDB connection error:', error);
      throw error;
    }
  }

  return cachedConnection;
}

module.exports = { connectDB };