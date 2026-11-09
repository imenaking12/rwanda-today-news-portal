const express = require('express');
const {
  getArticles,
  getArticleById,
  getAdminArticles,
  createArticle,
  updateArticle,
  deleteArticle,
} = require('../controllers/articleController');
const { requireAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

// Public reading endpoints
router.get('/', getArticles);

// All article management endpoints require an authenticated administrator.
router.get('/admin/all', requireAdmin, getAdminArticles);
router.post('/', requireAdmin, createArticle);
router.patch('/:id', requireAdmin, updateArticle);
router.delete('/:id', requireAdmin, deleteArticle);

// Keep the public ID route after the fixed /admin/all route.
router.get('/:id', getArticleById);

module.exports = router;
