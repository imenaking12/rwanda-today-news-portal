const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const articleRoutes = require('./routes/articleRoutes');
const authRoutes = require('./routes/authRoutes');
const chatGPTIntegrationRoutes = require('./routes/chatGPTIntegrationRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const { ensureDefaultCategories } = require('./services/defaultCategories');
const { startPublishScheduler } = require('./services/publishScheduler');

const app = express();
const PORT = process.env.PORT || 5000;

app.disable('x-powered-by');
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});

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
app.use('/api/categories', categoryRoutes);
app.use('/api/integrations/chatgpt', chatGPTIntegrationRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'API route not found.' });
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('MongoDB connected successfully!');
    await ensureDefaultCategories();
    startPublishScheduler();
    app.listen(PORT, () => {
      console.log(`Rwanda Today server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  });
