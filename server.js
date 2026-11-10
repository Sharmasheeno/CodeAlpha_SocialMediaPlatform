require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const connectDB = require('./config/db');

const app = express();

app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Health check (works with or without a database)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    dbConnected: mongoose.connection.readyState === 1,
  });
});

// Graceful guard: data routes return a clean JSON error when MongoDB
// is not connected, instead of hanging or crashing.
app.use('/api', (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      error: 'Database is not connected. Start MongoDB and restart the server.',
    });
  }
  return next();
});

// API routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/posts', require('./routes/posts'));

// Static frontend
app.use(express.static(path.join(__dirname, 'public')));

// JSON 404 for unknown API routes
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API route not found.' });
});

const PORT = process.env.PORT || 5000;

connectDB().finally(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});
