const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/worker_space';
  try {
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 2000,
    });
    isConnected = true;
    console.log(`[Database] MongoDB connected successfully: ${conn.connection.host}`);
    return true;
  } catch (error) {
    isConnected = false;
    console.warn(`[Database] MongoDB not reachable at ${mongoURI}.`);
    console.warn(`[Database] Falling back to seamless In-Memory Mock Store with seed data.`);
    console.warn(`[Database] To use live MongoDB, set MONGODB_URI in .env or start local mongod.`);
    return false;
  }
};

const getStatus = () => isConnected;

module.exports = { connectDB, getStatus };

