const express = require('express');
const { createDraftFromChatGPT } = require('../controllers/chatGPTIntegrationController');
const { requireChatGPTIntegration } = require('../middleware/chatGPTIntegrationAuth');

const router = express.Router();

router.post('/articles/drafts', requireChatGPTIntegration, createDraftFromChatGPT);

module.exports = router;
