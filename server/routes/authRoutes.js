const express = require('express');
const { login, getCurrentAdmin } = require('../controllers/authController');
const { requireAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/login', login);
router.get('/me', requireAdmin, getCurrentAdmin);

module.exports = router;
