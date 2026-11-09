
const express = require('express');

const router = express.Router();

const {
  getArticles,
  getArticleById
} = require('../controllers/articleController');

// GET /api/articles
router.get('/', getArticles);

// GET /api/articles/:id
router.get('/:id', getArticleById);

module.exports = router;

