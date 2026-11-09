
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

// Import routes
const articleRoutes = require('./routes/articleRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Register routes
app.use('/api/articles', articleRoutes);

// Homepage test
app.get('/', (req, res) => {
  res.send('Welcome to Rwanda Today API!');
});

// API status
app.get('/api/status', (req, res) => {
  res.json({
    success: true,
    message: 'Rwanda Today backend is working!',
  });
});

// Connect to MongoDB
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected successfully!');

    app.listen(PORT, () => {
      console.log(`Rwanda Today server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  });
