const path = require('path');
const dotenv = require('dotenv');
const http = require('http');

// Load environment variables from Backend/.env (or root .env as fallback)
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/db');
const { initMongoSeed } = require('./seed/dataService');
const apiRoutes = require('./routes/api');
const { initSocket } = require('./socket');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';

// Production & Development CORS Configuration
app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (e.g. Render health checks, curl, cron)
    if (!origin) return callback(null, true);
    // Dynamically allow Vercel production/preview deployments and local dev
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Routes
app.use('/api', apiRoutes);

// Health Check Endpoint (For Render, Uptime Robot, etc.)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'Worker Space API',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

app.get('/', (req, res) => {
  res.json({
    message: 'Worker Space Admin Dashboard API is running',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      stats: '/api/stats',
      departments: '/api/departments',
      teams: '/api/teams',
      members: '/api/members',
      assignments: '/api/assignments',
      tasks: '/api/tasks',
      workDone: '/api/work-done'
    }
  });
});

// Start Server
const startServer = async () => {
  const isMongo = await connectDB();
  if (isMongo) {
    await initMongoSeed();
  }

  // Initialize Socket.IO Real-Time Engine
  initSocket(server);

  // Initialize WPPConnect WhatsApp Session asynchronously in background
  try {
    const { initWppSession } = require('./services/wppService');
    initWppSession().catch(err => {
      console.warn('[WPPConnect] Background session initialization notice:', err.message);
    });
  } catch (err) {
    console.warn('[WPPConnect] WPP service loader notice:', err.message);
  }

  server.listen(PORT, HOST, () => {
    console.log(`[Server] Worker Space Backend with Socket.IO running on http://${HOST}:${PORT}`);
  });
};

startServer();
