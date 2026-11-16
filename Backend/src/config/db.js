const mongoose = require('mongoose');
const dns = require('dns');

// Prefer IPv4 for DNS resolution in Node.js
try {
  if (dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder('ipv4first');
  }
} catch (e) {
  // ignore
}

let isConnected = false;
let lastReportedState = null;

// Attach Mongoose connection event listeners
mongoose.connection.on('connected', async () => {
  isConnected = true;
  if (lastReportedState !== 'connected') {
    lastReportedState = 'connected';
    console.log(`[Database] MongoDB Atlas connection established successfully.`);
  }
  try {
    const { initMongoSeed } = require('../seed/dataService');
    if (typeof initMongoSeed === 'function') {
      await initMongoSeed();
    }
  } catch (e) {
    console.warn('[Database] Post-connect sync notice:', e.message);
  }
});

mongoose.connection.on('disconnected', () => {
  isConnected = false;
  if (lastReportedState !== 'disconnected') {
    lastReportedState = 'disconnected';
    console.warn(`[Database] MongoDB Atlas disconnected. Active operations preserved locally in db.json until reconnect.`);
  }
});

mongoose.connection.on('error', (err) => {
  isConnected = false;
  if (lastReportedState !== 'error') {
    lastReportedState = 'error';
    console.warn(`[Database] MongoDB Atlas connection error: ${err.message}`);
  }
});

const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/worker_space';

  const tryConnect = async (timeout = 10000) => {
    if (mongoose.connection.readyState === 1) {
      isConnected = true;
      return mongoose.connection;
    }
    if (mongoose.connection.readyState === 2) {
      return null;
    }

    try {
      const conn = await mongoose.connect(mongoURI, {
        serverSelectionTimeoutMS: timeout,
        connectTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        maxPoolSize: 10,
        heartbeatFrequencyMS: 10000
      });
      isConnected = true;
      return conn;
    } catch (error) {
      isConnected = false;
      if (lastReportedState !== 'connect_failed') {
        lastReportedState = 'connect_failed';
        console.error(`\n========================================================================`);
        console.error(`[Database Alert] Unable to connect to MongoDB Atlas:`);
        console.error(`Error: ${error.message}`);
        if (error.message.includes('whitelist') || error.message.includes('Could not connect to any servers')) {
          console.error(`\n[CRITICAL REQUIREMENT] MongoDB Atlas IP Whitelist:`);
          console.error(`MongoDB Atlas has blocked this IP from accessing the database.`);
          console.error(`To fix:`);
          console.error(`1. Go to MongoDB Atlas: https://cloud.mongodb.com`);
          console.error(`2. In the left sidebar under "Security", click "Network Access"`);
          console.error(`3. Click "Add IP Address"`);
          console.error(`4. Choose "Allow Access From Anywhere" (0.0.0.0/0) or add your current IP.`);
          console.error(`5. Click "Confirm". Reconnection will occur automatically once active.`);
        }
        console.error(`========================================================================\n`);
      }
      return null;
    }
  };

  const initialConn = await tryConnect(10000);
  if (initialConn) {
    console.log(`[Database] MongoDB Atlas connected on startup: ${initialConn.connection.host}`);
  } else {
    console.log(`[Database] Operating with local fallback (Backend/data/db.json) while retrying Atlas connection every 10s...`);
  }

  // Active background auto-reconnect with 10s intervals
  const scheduleReconnect = () => {
    setTimeout(async () => {
      if (!getStatus() && mongoose.connection.readyState === 0) {
        try {
          await tryConnect(10000);
        } catch (e) {
          // ignore
        }
      }
      scheduleReconnect();
    }, 10000);
  };
  scheduleReconnect();

  return Boolean(initialConn);
};

// Returns true strictly when Mongoose has an active, open connection (readyState === 1)
const getStatus = () => {
  return mongoose.connection.readyState === 1 && isConnected;
};

module.exports = { connectDB, getStatus };
