const express = require('express');
const { login, getCurrentAdmin } = require('../controllers/authController');
const { requireAdmin } = require('../middleware/authMiddleware');
const { loginRateLimit } = require('../middleware/loginRateLimit');

const router = express.Router();

router.post('/login', loginRateLimit, login);
router.get('/me', requireAdmin, getCurrentAdmin);

module.exports = router;
