const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const articleRoutes = require('./routes/articleRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
}));
app.use(express.json({ limit: '2mb' }));

app.get('/', (req, res) => {
  res.send('Welcome to Rwanda Today API!');
});

app.get('/api/status', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Rwanda Today backend is working!',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/articles', articleRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'API route not found.' });
});

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
