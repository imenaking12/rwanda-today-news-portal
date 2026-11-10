const express = require('express');
const { getCloudinaryUploadSignature } = require('../controllers/mediaController');
const { requireAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/signature', requireAdmin, getCloudinaryUploadSignature);

module.exports = router;
