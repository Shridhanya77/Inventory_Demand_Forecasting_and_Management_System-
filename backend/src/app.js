const express = require('express');
const cors = require('cors');
const db = require('./config/db');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const managerRoutes = require('./routes/manager');
const staffRoutes = require('./routes/staff');
const studentRoutes = require('./routes/student');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/manager', managerRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/student', studentRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Inventory Backend API running. Frontend at http://localhost:3000' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'inventory-backend' });
});

app.get('/api/health/db', async (req, res) => {
  try {
    const ok = await db.healthCheck();
    res.json({ status: ok ? 'ok' : 'fail', db: ok ? 'connected' : 'not_connected' });
  } catch (err) {
    res.status(503).json({ status: 'fail', db: 'not_connected', error: err.message });
  }
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Server error' });
});

module.exports = app;
