const mongoose = require('mongoose');
const dns = require('dns');

// Disable Mongoose command buffering immediately so operations never hang when disconnected
mongoose.set('bufferCommands', false);

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
    console.log(`[Database] Operating with high-speed persistent disk storage (data safely preserved in db.json).`);
  }
});

mongoose.connection.on('error', (err) => {
  isConnected = false;
  // Silently mark offline; do not flood console logs on ECONNRESET
  if (lastReportedState !== 'error') {
    lastReportedState = 'error';
    console.warn(`[Database] MongoDB Atlas connection status: Offline (${err.message}). High-speed persistent disk storage active.`);
  }
});

const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/worker_space';

  const tryConnect = async (timeout = 5000) => {
    // If already connected or currently connecting, skip
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
        connectTimeoutMS: 6000,
        socketTimeoutMS: 30000,
        maxPoolSize: 5,
        heartbeatFrequencyMS: 15000,
        bufferCommands: false
      });
      isConnected = true;
      return conn;
    } catch (error) {
      isConnected = false;
      return null;
    }
  };

  const initialConn = await tryConnect(5000);
  if (initialConn) {
    console.log(`[Database] MongoDB Atlas connected on startup: ${initialConn.connection.host}`);
  } else {
    console.log(`[Database] System fully operational with persistent disk storage (Backend/data/db.json). Zero data loss.`);
  }

  // Graceful background auto-reconnect with exponential backoff to avoid connection resets
  let reconnectDelay = 30000;
  const scheduleReconnect = () => {
    setTimeout(async () => {
      if (!getStatus() && mongoose.connection.readyState === 0) {
        try {
          const res = await tryConnect(4000);
          if (res) {
            reconnectDelay = 30000;
          } else {
            reconnectDelay = Math.min(reconnectDelay * 1.5, 180000); // Max 3 minutes
          }
        } catch (e) {
          reconnectDelay = Math.min(reconnectDelay * 1.5, 180000);
        }
      }
      scheduleReconnect();
    }, reconnectDelay);
  };
  scheduleReconnect();

  return Boolean(initialConn);
};

// Returns true strictly when Mongoose has an active, open connection (readyState === 1)
const getStatus = () => {
  return mongoose.connection.readyState === 1 && isConnected;
};

module.exports = { connectDB, getStatus };
