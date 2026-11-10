const express = require('express');
const {
  getCategories,
  getAdminCategories,
  createCategory,
  updateCategory,
} = require('../controllers/categoryController');
const { requireAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', getCategories);
router.get('/admin/all', requireAdmin, getAdminCategories);
router.post('/', requireAdmin, createCategory);
router.patch('/:id', requireAdmin, updateCategory);

module.exports = router;
