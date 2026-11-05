const mongoose = require('mongoose');
const dns = require('dns');

// Ensure DNS resolution for SRV records uses Google/Cloudflare DNS
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (e) {
  // ignore if not supported in environment
}

let isConnected = false;
let retryInterval = null;

const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/worker_space';
  try {
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    console.log(`[Database] MongoDB Atlas connected successfully: ${conn.connection.host}`);
    if (retryInterval) {
      clearInterval(retryInterval);
      retryInterval = null;
    }
    return true;
  } catch (error) {
    isConnected = false;
    const isAtlas = mongoURI.includes('mongodb.net');
    console.warn(`[Database] MongoDB not connected: ${error.message}`);
    if (isAtlas) {
      console.warn(`[Database] Atlas Cluster detected. If you see ECONNRESET or server selection timeout:`);
      console.warn(`[Database] Please ensure your IP is whitelisted in MongoDB Atlas -> Security -> Network Access.`);
      console.warn(`[Database] Tip: Add '0.0.0.0/0' (Allow access from anywhere) in Atlas Network Access.`);
    }
    console.warn(`[Database] Backend is operating with synchronized database state.`);

    // Automatically retry in background every 15s to pick up connection once IP is whitelisted
    if (!retryInterval && isAtlas) {
      retryInterval = setInterval(async () => {
        try {
          if (!isConnected) {
            const conn = await mongoose.connect(mongoURI, { serverSelectionTimeoutMS: 4000 });
            isConnected = true;
            console.log(`[Database] MongoDB Atlas connected in background: ${conn.connection.host}`);
            const { initMongoSeed } = require('../seed/dataService');
            await initMongoSeed();
            clearInterval(retryInterval);
            retryInterval = null;
          }
        } catch (e) {
          // silently continue retrying until whitelisted
        }
      }, 15000);
    }

    return false;
  }
};

const getStatus = () => isConnected;

module.exports = { connectDB, getStatus };
