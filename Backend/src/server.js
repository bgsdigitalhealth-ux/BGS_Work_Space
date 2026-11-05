const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from Backend/.env (or root .env as fallback)
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/db');
const { initMongoSeed } = require('./seed/dataService');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', apiRoutes);

app.get('/', (req, res) => {
  res.json({
    message: 'Worker Space Admin Dashboard API is running',
    version: '1.0.0',
    endpoints: {
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

  app.listen(PORT, () => {
    console.log(`[Server] Worker Space Backend running on http://localhost:${PORT}`);
  });
};

startServer();
