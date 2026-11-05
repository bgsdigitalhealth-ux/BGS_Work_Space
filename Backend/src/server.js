const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { connectDB } = require('./config/db');
const { initMongoSeed } = require('./seed/dataService');
const apiRoutes = require('./routes/api');

dotenv.config();

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

