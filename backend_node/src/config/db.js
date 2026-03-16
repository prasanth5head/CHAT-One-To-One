const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log(`[MongoDB] ✅ Connected: ${conn.connection.host}`);
    console.log(`[MongoDB] 📦 Database: ${conn.connection.name}`);

    mongoose.connection.on('error', (err) => {
      console.error('[MongoDB] Connection error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('[MongoDB] ⚠️ Disconnected. Attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('[MongoDB] ♻️ Reconnected');
    });

  } catch (err) {
    console.error(`[MongoDB] ❌ Connection failed: ${err.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
