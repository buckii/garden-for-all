const mongoose = require('mongoose');

// Cache connection to reuse across function calls
let cachedConnection = null;

async function connectDB() {
  if (cachedConnection && mongoose.connection.readyState === 1) {
    return cachedConnection;
  }

  if (mongoose.connection.readyState === 0) {
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