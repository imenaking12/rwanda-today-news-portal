const express = require('express');
const { createResearchDraft } = require('../controllers/editorialAiController');
const { requireAdmin } = require('../middleware/authMiddleware');
const { editorialAiRateLimit } = require('../middleware/editorialAiRateLimit');

const router = express.Router();

router.post('/drafts', requireAdmin, editorialAiRateLimit, createResearchDraft);

module.exports = router;
